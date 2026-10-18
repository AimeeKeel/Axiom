/**
 * Tests for scripts/app-schemas.ts.
 *
 * Run via `node --test scripts/app-schemas.test.ts`; `npm run test:unit` runs it with every
 * other script test. Everything here is pure: the census itself needs Xcode and runs only
 * when someone invokes `node scripts/app-schemas.ts census`. The last suite reads the
 * committed census and reference, so CI fails when either was edited without the other.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  assemble,
  type Census,
  CENSUS_FILE,
  classifyMetadata,
  fixitType,
  formatFixit,
  interfaceDrift,
  normalizeAvailability,
  ownerOf,
  parseDiagnostics,
  parseSchemaInterface,
  processorType,
  REFERENCE_FILE,
  renderSchemaReference,
  replaceGeneratedSection,
  schemaIds,
} from "./app-schemas.ts";

const INTERFACE = `@available(anyAppleOS 27.0, *)
@available(watchOS, unavailable)
@available(tvOS, unavailable)
extension AppIntents::AppSchema.AppIntents::NotesIntent {
  @_alwaysEmitIntoClient public var createNote: some AppIntents::AppSchemaIntent {
    get {
        AppSchema.Intent("CreateNoteIntent")
    }
  }
}
@available(anyAppleOS 27.0, *)
@available(watchOS, unavailable)
@available(tvOS, unavailable)
extension AppIntents::AppSchema.AppIntents::Intent : AppIntents::AppSchema.AppIntents::NotesIntent {
}
@available(iOS 18.0, macOS 15.0, visionOS 2.0, *)
@available(watchOS, unavailable)
@available(tvOS, unavailable)
extension AppIntents::AppSchema.AppIntents::NotesEntity {
  @_alwaysEmitIntoClient public var note: some AppIntents::AppSchemaEntity {
    get {
        AppSchema.Entity("NoteEntity")
    }
  }
  @_alwaysEmitIntoClient public var folder: some AppIntents::AppSchemaEntity {
    get {
        AppSchema.Entity("FolderEntity")
    }
  }
  @available(anyAppleOS, deprecated: 27.0, message: "Use .system.searchInApp instead")
  @_alwaysEmitIntoClient public var search: some AppIntents::AppSchemaEntity {
    get {
        AppSchema.Entity("NotesSearchEntity")
    }
  }
}
@available(iOS 26.2, *)
@available(macOS, unavailable)
@available(tvOS, unavailable)
@available(watchOS, unavailable)
@available(visionOS, unavailable)
extension AppIntents::AppSchema.AppIntents::WordProcessorEnum {
  @_alwaysEmitIntoClient public var pageSize: some AppIntents::AppSchemaEnum {
    get {
        AppSchema.Enum("PageSize")
    }
  }
}
`;

const DECLS = parseSchemaInterface(INTERFACE);
const IDS = schemaIds(DECLS);

describe("parseSchemaInterface", () => {
  it("lists every schema accessor with its domain, kind, internal id, block availability and deprecation", () => {
    assert.deepEqual(DECLS, [
      { domain: "notes", kind: "intent", name: "createNote", id: "CreateNoteIntent", available: "OS27" },
      { domain: "notes", kind: "entity", name: "note", id: "NoteEntity", available: "iOS 18+, macOS 15+, visionOS 2+" },
      { domain: "notes", kind: "entity", name: "folder", id: "FolderEntity", available: "iOS 18+, macOS 15+, visionOS 2+" },
      { domain: "notes", kind: "entity", name: "search", id: "NotesSearchEntity", available: "iOS 18+, macOS 15+, visionOS 2+", deprecated: "27; use .system.searchInApp" },
      { domain: "wordProcessor", kind: "enum", name: "pageSize", id: "PageSize", available: "iOS 26.2+; not macOS/visionOS" },
    ]);
  });
});

describe("parseSchemaInterface guards", () => {
  it("merges an accessor's own @available into its block's", () => {
    const text = INTERFACE.replace(
      "  @_alwaysEmitIntoClient public var createNote:",
      "  @available(iOS 27.2, *)\n  @_alwaysEmitIntoClient public var createNote:",
    );
    assert.equal(parseSchemaInterface(text)[0].available, "OS27, iOS 27.2+");
  });

  it("throws on a schema id no accessor accounted for", () => {
    const text = INTERFACE.replace(
      "extension AppIntents::AppSchema.AppIntents::WordProcessorEnum {",
      "extension AppIntents::AppSchema.AppIntents::WordProcessorEnum where Self: Sendable {",
    );
    assert.throws(() => parseSchemaInterface(text), /schema ids no accessor accounted for: PageSize/);
  });

  it("reads an @available written on the accessor's own line", () => {
    const text = INTERFACE.replace(
      "  @_alwaysEmitIntoClient public var createNote:",
      "  @available(macOS, unavailable) @_alwaysEmitIntoClient public var createNote:",
    );
    assert.equal(parseSchemaInterface(text)[0].available, "OS27; not macOS");
  });

  it("throws on a deprecation it cannot read", () => {
    const text = INTERFACE.replace(
      '@available(anyAppleOS, deprecated: 27.0, message: "Use .system.searchInApp instead")',
      '@available(*, deprecated, renamed: "searchInApp")',
    );
    assert.throws(() => parseSchemaInterface(text), /unrecognized deprecation/);
  });
});

describe("normalizeAvailability refusals", () => {
  for (const clause of ['anyAppleOS, deprecated: 28.0, message: "Use .x.y instead"', "iOS, introduced: 27.0", "*, unavailable"]) {
    it(`throws on the clause ${clause}`, () => {
      assert.throws(() => normalizeAvailability([clause]), /unrecognized @available clause/);
    });
  }
});

describe("normalizeAvailability", () => {
  const cases: Array<[string[], string]> = [
    [["anyAppleOS 27.0, *", "watchOS, unavailable", "tvOS, unavailable"], "OS27"],
    [["iOS 18.0, macOS 15.0, visionOS 2.0, *", "watchOS, unavailable", "tvOS, unavailable"], "iOS 18+, macOS 15+, visionOS 2+"],
    [["iOS 26.2, *", "macOS, unavailable", "tvOS, unavailable", "watchOS, unavailable", "visionOS, unavailable"], "iOS 26.2+; not macOS/visionOS"],
    [["iOS 26.0, macOS 27.0, *", "tvOS, unavailable", "watchOS, unavailable", "visionOS, unavailable"], "iOS 26+, macOS 27+; not visionOS"],
    [["anyAppleOS 27.0, *", "watchOS, unavailable", "tvOS, unavailable", "visionOS, unavailable"], "OS27; not visionOS"],
    [["anyAppleOS 27.0, *", "watchOS, unavailable", "tvOS, unavailable", "iOS 27.2, *"], "OS27, iOS 27.2+"],
    [["iOS 18.0, macOS 15.0, *", "macOS, unavailable"], "iOS 18+; not macOS"],
    [["iOS 18.0, *", "macOS, unavailable", "macOS 27.0, *"], "iOS 18+, macOS 27+"],
  ];
  for (const [clauses, expected] of cases) {
    it(`renders ${clauses[0]} as "${expected}"`, () => {
      assert.equal(normalizeAvailability(clauses), expected);
    });
  }
});

describe("processorType", () => {
  const cases: Array<[string, string]> = [
    ["String", "String"],
    ["Schema<NoteEntity>", ".notes.note"],
    ["FolderEntity", ".notes.folder"],
    ["Array<Schema<NoteEntity>>", "[.notes.note]"],
    ["Set<Schema<PageSize>>", "Set<.wordProcessor.pageSize>"],
    ["Array<File>", "[IntentFile]"],
    ["Person", "IntentPerson"],
    ["Codable<Swift.Duration>", "Duration"],
    ["RecurrenceRule", "Calendar.RecurrenceRule"],
    ["SystemEntity<com.apple.-GeoToolbox-AppIntents.GeoToolbox.PlaceDescriptorEntity>", "GeoToolbox.PlaceDescriptor"],
  ];
  for (const [raw, expected] of cases) {
    it(`reads ${raw} as ${expected}`, () => {
      assert.equal(processorType(raw, IDS, new Map()), expected);
    });
  }

  it("names a union by its cases type and records the cases once", () => {
    const unions = new Map<string, string[]>();
    const type = processorType("Array<ItemCases:(Schema<NoteEntity> | Array<Person> | String)>", IDS, unions);
    assert.deepEqual({ type, unions: [...unions] }, {
      type: "[Item]",
      unions: [["Item", [".notes.note", "[IntentPerson]", "String"]]],
    });
  });
});

describe("formatFixit", () => {
  it("flattens a multi-line fix-it and names schema types by accessor", () => {
    const raw = "extension NoteEntity: IntentValueQuery {\\n    func values(for input: [String]) async throws -> [NoteEntity] {\\n        <#code#>\\n    }\\n}\\n\\n";
    assert.equal(formatFixit(raw, IDS), "extension .notes.note: IntentValueQuery { func values(for input: [String]) async throws -> [.notes.note] }");
  });
});

describe("processorType union collisions", () => {
  it("throws when one union name arrives with two case lists", () => {
    const unions = new Map<string, string[]>();
    processorType("ACases:(String | Int)", IDS, unions);
    assert.throws(() => processorType("ACases:(String | Date)", IDS, unions), /union A appears with two case lists/);
  });
});

describe("fixitType", () => {
  const cases: Array<[string, { type: string; optional: boolean }]> = [
    ["String", { type: "String", optional: false }],
    ["Date?", { type: "Date", optional: true }],
    ["<#FolderEntity#>?", { type: ".notes.folder", optional: true }],
    ["[<#NoteEntity#>]", { type: "[.notes.note]", optional: false }],
    ["Set<<#PageSize#>>", { type: "Set<.wordProcessor.pageSize>", optional: false }],
  ];
  for (const [raw, expected] of cases) {
    it(`reads the fix-it type ${raw}`, () => {
      assert.deepEqual(fixitType(raw, IDS), expected);
    });
  }
});

describe("parseDiagnostics", () => {
  const P = "/tmp/x/Probe/All.swift";
  const log = [
    `${P}:12: error: Missing required parameter 'name' from AppSchemaIntent 'notes.createNote'`,
    `${P}:12: error: Missing required parameter 'name' from AppSchemaIntent 'notes.createNote'`,
    `${P}:21:1: fixit: var name: String`,
    `${P}:30: warning: App Intents use case 'Start Navigation' is missing the schema 'maps.placeIntentValueQuery'`,
    `${P}:40:98: error: cannot convert value of type 'String' to expected argument type 'Int'`,
    `macro expansion @AppIntent:7:1: error: type 'I_notes_open' does not conform to protocol 'OpenIntent'`,
    "2026-10-18 appintentsmetadataprocessor[1:2] error: At least one halting error was produced during export",
    "error: AssistantSchemaIntent 'assistant.activate' requires 'supportedModes = .foreground'",
  ].join("\n");

  it("separates metadata errors, warnings and fix-its from Swift errors, once per line and message", () => {
    assert.deepEqual(parseDiagnostics(log), {
      metadata: [
        { line: 12, kind: "error", message: "Missing required parameter 'name' from AppSchemaIntent 'notes.createNote'" },
        { line: 21, kind: "fixit", message: "var name: String" },
        { line: 30, kind: "warning", message: "App Intents use case 'Start Navigation' is missing the schema 'maps.placeIntentValueQuery'" },
        { line: 0, kind: "error", message: "AssistantSchemaIntent 'assistant.activate' requires 'supportedModes = .foreground'" },
      ],
      swift: [
        "cannot convert value of type 'String' to expected argument type 'Int'",
        "type 'I_notes_open' does not conform to protocol 'OpenIntent'",
      ],
    });
  });
});

describe("classifyMetadata", () => {
  // Verbatim processor messages from the 27.1 census logs.
  const cases: Array<[string, unknown]> = [
    ["Missing required parameter 'name' from AppSchemaIntent 'notes.createNote'", { kind: "missing", name: "name" }],
    ["Missing required property 'title' from AppSchemaEntity 'audio.album'", { kind: "missing", name: "title" }],
    ["'N_audio_activity' conforming to 'audio.activity' requires enum case 'cooking'", { kind: "case", name: "cooking" }],
    [
      "AppSchemaIntent 'notes.createNote' requires that 'perform()' include a 'ReturnsValue<Schema<NoteEntity>>'",
      { kind: "returns", type: "Schema<NoteEntity>" },
    ],
    ["Parameter 'tab' does not match required AppSchemaIntent type 'TabEntity'", { kind: "type", name: "tab", type: "TabEntity" }],
    [
      "Parameter 'audio' does not match required AppSchemaIntent parameter of 'Array<File>'",
      { kind: "type", name: "audio", type: "Array<File>" },
    ],
    [
      "Property 'owner' type does not match required AppSchemaEntity property type 'OwnerCases:(Person | String)'",
      { kind: "type", name: "owner", type: "OwnerCases:(Person | String)" },
    ],
    [
      "Property 'alarms' does not match required AppSchemaEntity property of 'Array<EventAlarmCases:(Codable<Swift.Duration> | Date)>'",
      { kind: "type", name: "alarms", type: "Array<EventAlarmCases:(Codable<Swift.Duration> | Date)>" },
    ],
    ["Required AppSchemaIntent parameter 'tab' must be optional", { kind: "optionality", name: "tab", optional: true }],
    [
      "The 'supportedTypeIdentifiers' argument of parameter 'attachments' must specify at least one UTType subtype of the following supertypes: 'public.audio', 'public.image', 'public.item'",
      { kind: "contentTypes", name: "attachments", supertypes: ["public.audio", "public.image", "public.item"] },
    ],
    [
      "AssistantSchemaIntent 'assistant.activate' requires 'supportedModes = .foreground'",
      { kind: "static", name: "supportedModes", value: ".foreground" },
    ],
    ["'OpenIntent' must have 'target' as the only required parameter", { kind: "noShape" }],
    ["Something Apple has not said before", undefined],
  ];
  for (const [message, expected] of cases) {
    it(`classifies: ${message.slice(0, 60)}`, () => {
      assert.deepEqual(classifyMetadata(message), expected);
    });
  }
});

describe("assemble and ownerOf", () => {
  it("attribute every line of a keyed declaration, and none of the header, to that declaration", () => {
    const source = assemble([
      { key: "a", text: "struct A {\n}\n" },
      { key: "b", text: "struct B {\n    var x: Int\n}\n" },
    ]);
    const lines = source.text.split("\n");
    const owners = lines.map((_, i) => ownerOf(source, i + 1));
    const expected = lines.map((line, i) => {
      const at = lines.indexOf("struct A {");
      const bt = lines.indexOf("struct B {");
      return i >= bt ? "b" : i >= at ? "a" : undefined;
    });
    assert.deepEqual(owners, expected);
  });
});

describe("interfaceDrift", () => {
  it("lists schemas only the SDK has as + and only the census has as -", () => {
    const census: Census = {
      xcode: "", sdk: "", unconfirmed: [],
      domains: [{
        name: "notes", tier: "primary", unions: {}, singleCase: {}, enums: [],
        intents: [{ name: "createNote", available: "OS27", parameters: [] }],
        entities: [{ name: "gone", available: "OS27", properties: [] }],
      }],
    };
    assert.deepEqual(interfaceDrift(DECLS.slice(0, 2), census), [
      "+ notes.entity.note iOS 18+, macOS 15+, visionOS 2+",
      "- notes.entity.gone OS27",
    ]);
  });
});

const SMALL: Census = {
  xcode: "Xcode 27.1 (27A9275)",
  sdk: "iphoneos 27.1",
  domains: [
    {
      name: "notes",
      tier: "primary",
      intents: [
        {
          name: "createNote",
          available: "OS27",
          parameters: [
            { name: "name", type: "AttributedString", optional: false },
            { name: "folder", type: ".notes.folder", optional: true },
            { name: "attachments", type: "[IntentFile]", optional: false, contentTypes: ["public.item"] },
          ],
          returns: ".notes.note",
          warnings: ["App Intents use case 'Create Note' is missing the schema 'notes.noteIntentValueQuery'"],
        },
        {
          name: "openNote",
          available: "OS27",
          conformance: "OpenIntent",
          parameters: [{ name: "target", type: ".notes.note", optional: false }],
          statics: ["static let supportedModes: IntentModes = .foreground"],
          deprecated: "27; use .system.open",
        },
      ],
      entities: [
        { name: "note", available: "OS27", properties: [{ name: "name", type: "AttributedString", optional: false }] },
        { name: "folder", available: "iOS 18+, macOS 15+, visionOS 2+", properties: [] },
        { name: "tag", available: "iOS 18+, macOS 15+, visionOS 2+", properties: [{ name: "note", type: ".notes.note", optional: true }] },
      ],
      enums: [
        { name: "sort", available: "OS27", cases: ["name", "date"] },
        { name: "mode", available: "OS27", cases: [] },
      ],
      unions: { Target: [".notes.note", "String"], Pick: ["String", "Int"], Slot: ["Date", "Int"] },
      singleCase: { Target: "yes", Pick: "no", Slot: "unverified" },
    },
    {
      name: "assistant",
      tier: "single",
      intents: [
        { name: "activate", available: "iOS 26.2+; not macOS/visionOS", parameters: [], statics: ["static let supportedModes: IntentModes = .foreground"] },
        { name: "listen", available: "iOS 26.2+; not macOS/visionOS", parameters: [] },
        { name: "speak", available: "OS27", parameters: [] },
        { name: "whisper", available: "OS27; not visionOS", parameters: [] },
      ],
      entities: [],
      enums: [],
      unions: {},
      singleCase: {},
    },
  ],
  unconfirmed: [],
};

describe("renderSchemaReference", () => {
  it("renders each domain as tier and platform lines plus one table per schema kind, tagging a row by the newest type it references", () => {
    assert.equal(
      renderSchemaReference(SMALL),
      [
        "Census: Xcode 27.1 (27A9275), iphoneos 27.1 SDK. A control build adopting every schema exactly as listed produced no errors.",
        "",
        "## Notes",
        "",
        "**Tier**: Primary. **Platforms**: OS27",
        "",
        "| Intent | Required parameters | Returns |",
        "|---|---|---|",
        "| `createNote` | `name: AttributedString, folder: .notes.folder?, attachments: [IntentFile]`; `attachments` content types: public.item | `.notes.note` |",
        "| `openNote` (OpenIntent), deprecated in 27; use `.system.open` | `target: .notes.note`; needs `static let supportedModes: IntentModes = .foreground` | — |",
        "",
        "| Entity | Required properties |",
        "|---|---|",
        "| `note` | `name: AttributedString` |",
        "| `folder` (iOS 18+, macOS 15+, visionOS 2+) | — |",
        "| `tag` | `note: .notes.note?` |",
        "",
        "| Enum | Required cases |",
        "|---|---|",
        "| `sort` | `name, date` |",
        "",
        "Enums with no required cases: `mode`",
        "",
        "| Union (`@UnionValue`) | Cases | Builds with only its first case, and with only its last |",
        "|---|---|---|",
        "| `Target` | `.notes.note, String` | yes |",
        "| `Pick` | `String, Int` | no |",
        "| `Slot` | `Date, Int` | unverified |",
        "",
        "Build warnings (the build still succeeds):",
        "",
        "- `createNote`: App Intents use case 'Create Note' is missing the schema 'notes.noteIntentValueQuery'",
        "",
        "## Assistant",
        "",
        "**Tier**: Single-purpose. **Platforms**: iOS 26.2+; not macOS/visionOS",
        "",
        "| Intent | Required parameters | Returns |",
        "|---|---|---|",
        "| `activate` | needs `static let supportedModes: IntentModes = .foreground` | — |",
        "| `listen` | — | — |",
        "| `speak` `OS27` | — | — |",
        "| `whisper` `OS27`; not visionOS | — | — |",
        "",
      ].join("\n"),
    );
  });

  it("lists every schema the control build still rejected", () => {
    const rendered = renderSchemaReference({ ...SMALL, unconfirmed: ["notes intent createNote: Some error"] });
    assert.equal(
      rendered.split("\n").slice(0, 5).join("\n"),
      [
        "Census: Xcode 27.1 (27A9275), iphoneos 27.1 SDK. A control build adopting every schema exactly as listed still produced the errors below; those rows are incomplete.",
        "",
        "- notes intent createNote: Some error",
        "",
        "## Notes",
      ].join("\n"),
    );
  });
});

describe("replaceGeneratedSection", () => {
  it("replaces only the text between the markers", () => {
    const { START, END } = { START: "<!-- generated: begin -->", END: "<!-- generated: end -->" };
    const before = `# Title\n\nIntro.\n\n${START}\nold\n${END}\n\nOutro.\n`;
    assert.equal(replaceGeneratedSection(before, "new\n", START, END), `# Title\n\nIntro.\n\n${START}\nnew\n${END}\n\nOutro.\n`);
  });

  it("returns undefined when a marker is missing", () => {
    assert.equal(replaceGeneratedSection("# Title\n", "new\n", "<!-- a -->", "<!-- b -->"), undefined);
  });
});

describe("committed census", () => {
  const census: Census = JSON.parse(fs.readFileSync(CENSUS_FILE, "utf8"));

  it("matches the generated section of the reference (run node scripts/app-schemas.ts)", () => {
    const reference = fs.readFileSync(REFERENCE_FILE, "utf8");
    assert.equal(reference, replaceGeneratedSection(reference, renderSchemaReference(census)));
  });

  it("was confirmed by a clean control build", () => {
    assert.deepEqual(census.unconfirmed, []);
  });
});

describe("hand-written Audio tables in siri-audio-ref", () => {
  // siri-audio-ref keeps its own Audio tables for the behavior notes beside each row; this pins
  // their members, optionality, cases and return requirements to the census so they cannot drift.
  const census: Census = JSON.parse(fs.readFileSync(CENSUS_FILE, "utf8"));
  const audio = census.domains.find((d) => d.name === "audio")!;
  const text = fs.readFileSync(path.join(path.dirname(REFERENCE_FILE), "siri-audio-ref.md"), "utf8");
  const rows = (heading: string) => {
    const section = text.split(`\n### ${heading}\n`)[1].split(/\n##+ /)[0];
    return [...section.matchAll(/^\| `\.audio\.(\w+)`[^|]*\|(.*)$/gm)].map((m) => ({ name: m[1], cells: m[2].split(/(?<!\\)\|/) }));
  };
  const members = (cell: string) =>
    [...cell.matchAll(/`(\w+): ([^`]+)`/g)].map((m) => ({ name: m[1], optional: m[2].endsWith("?") })).sort((a, b) => (a.name < b.name ? -1 : 1));
  const recorded = (list: Array<{ name: string; optional: boolean }>) => list.map(({ name, optional }) => ({ name, optional }));

  it("entities list exactly the census's required properties, at its optionality", () => {
    assert.deepEqual(
      Object.fromEntries(rows("Entities").map((r) => [r.name, members(r.cells[0])])),
      Object.fromEntries(audio.entities.map((e) => [e.name, recorded(e.properties)])),
    );
  });

  it("intents list exactly the census's required parameters, and a ReturnsValue wherever the census has one", () => {
    assert.deepEqual(
      Object.fromEntries(rows("Intents").map((r) => [r.name, { parameters: members(r.cells[0]), returns: r.cells[1].includes("ReturnsValue") }])),
      Object.fromEntries(audio.intents.map((i) => [i.name, { parameters: recorded(i.parameters), returns: i.returns !== undefined }])),
    );
  });

  it("enums list exactly the census's required cases", () => {
    const cases = (cell: string) => cell.replace(/\([^)]*\)|\d+:/g, "").replace(/[`,]/g, " ").split(/\s+/).filter(Boolean).sort();
    assert.deepEqual(
      Object.fromEntries(rows("Enums").map((r) => [r.name, cases(r.cells[0])])),
      Object.fromEntries(audio.enums.map((e) => [e.name, e.cases.slice().sort()])),
    );
  });
});

describe("Available domains table in app-intents-ref", () => {
  it("names every census domain exactly once, under its census tier", () => {
    const census: Census = JSON.parse(fs.readFileSync(CENSUS_FILE, "utf8"));
    const text = fs.readFileSync(path.join(path.dirname(REFERENCE_FILE), "app-intents-ref.md"), "utf8");
    const table = /^\| Tier \|.*\n(?:\|.*\n)+/m.exec(text.split("\n### Available domains\n")[1])![0].trimEnd();
    const TIERS: Record<string, string> = { Primary: "primary", "Single-purpose": "single", "Shortcuts-specific": "shortcuts" };
    let tier = "";
    const listed: Array<[string, string]> = [];
    for (const row of table.split("\n").slice(2)) {
      const [, tierCell, domains] = row.split("|").map((c) => c.trim());
      if (tierCell) tier = TIERS[tierCell.split(" — ")[0]];
      for (const name of domains.replace(/\([^)]*\)/g, "").split(",")) listed.push([name.replace(/\s+/g, "").toLowerCase(), tier]);
    }
    assert.deepEqual(
      listed.sort(),
      census.domains.map((d): [string, string] => [d.name.toLowerCase(), d.tier]).sort(),
    );
  });
});
