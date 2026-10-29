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
import os from "node:os";
import path from "node:path";
import {
  acceptedSubstitutes,
  assemble,
  claimedTarget,
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
  readUnionNames,
  replaceGeneratedSection,
  schemaIds,
  schemaUnionNames,
  declaredAvailability,
  moduleTypes,
  eachMetadata,
  keepProbe,
  readInterface,
  typeAvailability,
  unionNameOf,
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

  // The 27.2 processor spells types in prose; each must land on the 27.1 spelling above.
  const prose: Array<[string, string]> = [
    ["@AppEntity(schema: .browser.tab)", ".browser.tab"],
    ["@AppEnum(schema: .camera.captureMode)", ".camera.captureMode"],
    ["an array of File", "[IntentFile]"],
    ["an array of @AppEntity(schema: .photos.asset)", "[.photos.asset]"],
    ["a set of @AppEnum(schema: .audio.playbackAttributes)", "Set<.audio.playbackAttributes>"],
    ["a set of String", "Set<String>"],
    ["GeoToolbox.PlaceDescriptorEntity", "GeoToolbox.PlaceDescriptor"],
    ["an array of GeoToolbox.PlaceDescriptorEntity", "[GeoToolbox.PlaceDescriptor]"],
    ["VisualIntelligence.SemanticContentDescriptorEntity", "VisualIntelligence.SemanticContentDescriptor"],
  ];
  for (const [raw, expected] of prose) {
    it(`reads the 27.2 spelling ${raw} as ${expected}`, () => {
      assert.equal(processorType(raw, IDS, new Map()), expected);
    });
  }

  it("names a 27.2 union, which the message no longer names, by the name it is given", () => {
    const unions = new Map<string, string[]>();
    const type = processorType("an array of a @UnionValue with cases limited to the types Codable<Swift.Duration> or Date", IDS, unions, "EventAlarm");
    assert.deepEqual({ type, unions: [...unions] }, { type: "[EventAlarm]", unions: [["EventAlarm", ["Duration", "Date"]]] });
  });

  it("reads a 27.2 union of three or more cases in order", () => {
    const unions = new Map<string, string[]>();
    processorType(
      "a @UnionValue with cases limited to the types an array of Person, @AppEntity(schema: .messages.messagePerson), or an array of @AppEntity(schema: .messages.messagePerson)",
      IDS, unions, "MessageDestination",
    );
    assert.deepEqual([...unions], [["MessageDestination", ["[IntentPerson]", ".messages.messagePerson", "[.messages.messagePerson]"]]]);
  });

  it("throws on a 27.2 union it has no name for, naming where it looked", () => {
    assert.throws(
      () => processorType("a @UnionValue with cases limited to the types Person or String", IDS, new Map(), undefined, "PlaylistEntity#owner in /x/AppIntentSchemas.sqlite"),
      /union of Person, String has no name: no PlaylistEntity#owner in \/x\/AppIntentSchemas\.sqlite/,
    );
  });

  it("reads a 27.2 union listed without a serial comma", () => {
    const unions = new Map<string, string[]>();
    processorType("a @UnionValue with cases limited to the types Person, String or Date", IDS, unions, "Pick");
    assert.deepEqual([...unions], [["Pick", ["IntentPerson", "String", "Date"]]]);
  });

  it("keeps a module-qualified Entity name it has no rule for", () => {
    assert.equal(processorType("AppIntents.TransientAppEntity", IDS, new Map()), "AppIntents.TransientAppEntity");
  });

  for (const raw of ["a type conforming to schema 'NoteEntity'", "@AppEntity(schema: .notes)", "an array of a type conforming to schema 'X'"]) {
    it(`throws on the unrecognized spelling ${raw}, naming it`, () => {
      assert.throws(() => processorType(raw, IDS, new Map()), (e: Error) => e.message.includes(`unrecognized processor type '${raw.replace(/^an array of /, "")}'`));
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

describe("schemaUnionNames", () => {
  it("names the union each member and result takes, through optional, array and set wrappers, and skips the rest", () => {
    const union = (id: string) => ({ unionSchema: { _0: { _cases: [], id } } });
    const names = schemaUnionNames([
      {
        id: "SendMessageIntent",
        members: [
          { name: "content", type: { optional: { _0: { attributedString: {} } } } },
          { name: "destination", type: union("MessageDestination") },
          { name: "location", type: { optional: { _0: union("EventLocation") } } },
        ],
        result: { array: { _0: union("AudioItem") } },
      },
      { id: "EventEntity", members: [{ name: "alarms", type: { set: { _0: union("EventAlarm") } } }], result: null },
    ]);
    assert.deepEqual([...names], [
      ["SendMessageIntent#destination", "MessageDestination"],
      ["SendMessageIntent#location", "EventLocation"],
      ["SendMessageIntent#perform()", "AudioItem"],
      ["EventEntity#alarms", "EventAlarm"],
    ]);
  });

  const union = (id: string) => ({ unionSchema: { _0: { _cases: [], id } } });
  it("reads only the highest version of a schema, comparing versions as numbers", () => {
    const names = schemaUnionNames([
      { id: "PhotoEntity", version: [1, 10, 0], members: [{ name: "place", type: union("New") }] },
      { id: "PhotoEntity", version: [1, 9, 0], members: [{ name: "place", type: union("Old") }] },
    ]);
    assert.deepEqual([...names], [["PhotoEntity#place", "New"]]);
  });

  it("throws when one member is given two union names", () => {
    assert.throws(
      () => schemaUnionNames([
        { id: "EventEntity", members: [{ name: "alarms", type: union("EventAlarm") }] },
        { id: "EventEntity", members: [{ name: "alarms", type: union("Alarm") }] },
      ]),
      /EventEntity#alarms is both EventAlarm and Alarm/,
    );
  });
});

describe("readUnionNames", () => {
  const database = readUnionNames();
  const present = database.file !== undefined && fs.existsSync(database.file);
  it("names, for every member and result the committed census types with a union, the union the census records", { skip: !present && `no schema database (${database.file ?? "no Xcode"})` }, () => {
    assert.equal(database.error, undefined);
    const census: Census = JSON.parse(fs.readFileSync(CENSUS_FILE, "utf8"));
    const ids = new Map(readInterface()!.decls.map((d) => [`${d.domain}.${d.kind}.${d.name}`, d.id]));
    const unions = census.domains.flatMap((d) => Object.keys(d.unions));
    const expected: Array<[string, string]> = [];
    const actual: Array<[string, string | undefined]> = [];
    for (const d of census.domains) {
      const schemas = [
        ...d.intents.map((s) => ["intent", s, [...s.parameters, ...(s.returns ? [{ name: "perform()", type: s.returns }] : [])]] as const),
        ...d.entities.map((s) => ["entity", s, s.properties] as const),
      ];
      for (const [kind, s, members] of schemas) {
        for (const m of members) {
          const union = unions.find((u) => new RegExp(`\\b${u}\\b`).test(m.type));
          if (!union) continue;
          const k = `${ids.get(`${d.name}.${kind}.${s.name}`)}#${m.name}`;
          expected.push([k, union]);
          actual.push([k, database.names.get(k)]);
        }
      }
    }
    assert.ok(expected.length > 0);
    assert.deepEqual(actual, expected);
  });

  it("keeps, rather than throws, an error reading the database, with the file it read", () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "app-schemas-test-")), "AppIntentSchemas.sqlite");
    fs.writeFileSync(file, "not a database");
    const read = readUnionNames(file);
    assert.deepEqual({ file: read.file, names: [...read.names], failed: read.error instanceof Error }, { file, names: [], failed: true });
  });
});

describe("unionNameOf", () => {
  const decls = DECLS;
  it("raises a kept database error, with the database file, only when a union lacks a name", () => {
    const database = { file: "/x/AppIntentSchemas.sqlite", names: new Map<string, string>(), error: new Error("file is not a database") };
    const [name, where] = unionNameOf({ decls, unionDatabase: database }, "notes.entity.note", "owner");
    assert.equal(processorType("String", IDS, new Map(), name, where), "String");
    assert.throws(
      () => processorType("a @UnionValue with cases limited to the types Person or String", IDS, new Map(), name, where),
      /union of Person, String has no name: no NoteEntity#owner in \/x\/AppIntentSchemas\.sqlite, which could not be read: file is not a database/,
    );
  });
});

describe("keepProbe", () => {
  const cases: Array<[string | undefined, boolean]> = [[undefined, false], ["", false], ["0", false], ["1", true], ["yes", true]];
  for (const [value, expected] of cases) {
    it(`reads APP_SCHEMAS_KEEP_PROBE=${JSON.stringify(value)} as ${expected ? "keep" : "remove"}`, () => {
      assert.equal(keepProbe(value), expected);
    });
  }
});

describe("declaredAvailability", () => {
  const text = [
    "import Swift",
    "@available(iOS 26.0, macOS 26.0, visionOS 26.0, watchOS 26.0, tvOS 26.0, *)",
    "extension GeoToolbox.PlaceDescriptor : Swift.Hashable {",
    "  public struct Inner {",
    "  }",
    "}",
    "@available(iOS 26.4, macOS 26.4, *)",
    "@available(visionOS, unavailable)",
    "@frozen nonisolated public struct PlaceDescriptor : Swift::Sendable {",
    "}",
  ].join("\n");

  it("reads the @available stack of a top-level public type declaration", () => {
    assert.equal(declaredAvailability(text, "PlaceDescriptor"), "iOS 26.4+, macOS 26.4+; not visionOS");
  });

  it("throws when the interface does not declare the type at top level", () => {
    assert.throws(() => declaredAvailability(text, "Inner"), /declares no top-level public type Inner/);
  });

  it("skips deprecation clauses in the stack", () => {
    const deprecated = text.replace("@available(visionOS, unavailable)", '@available(visionOS, unavailable)\n@available(iOS, deprecated: 27.0, message: "Use Other")\n@available(*, deprecated, message: "Use Other")');
    assert.equal(declaredAvailability(deprecated, "PlaceDescriptor"), "iOS 26.4+, macOS 26.4+; not visionOS");
  });
});

describe("typeAvailability", () => {
  it("names the type and the interface it read when reading fails", () => {
    const sdk = fs.mkdtempSync(path.join(os.tmpdir(), "app-schemas-sdk-"));
    const file = path.join(sdk, "System/Library/Frameworks/GeoToolbox.framework/Modules/GeoToolbox.swiftmodule/arm64e-apple-ios.swiftinterface");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, "import Swift\n");
    assert.throws(() => typeAvailability(sdk, "GeoToolbox.PlaceDescriptor"), (e: Error) =>
      e.message.startsWith(`GeoToolbox.PlaceDescriptor (${file}): `) && e.message.includes("declares no top-level public type PlaceDescriptor"));
  });
});

describe("moduleTypes", () => {
  it("lists each module-qualified type a member, return or union names, but not Foundation's Calendar", () => {
    const domain = (name: string, type: string, unions: Record<string, string[]>): Census["domains"][number] => ({
      name, tier: "primary", enums: [], singleCase: {}, unions,
      intents: [{ name: "i", available: "OS27", parameters: [{ name: "p", type, optional: false }], returns: "[VisualIntelligence.SemanticContentDescriptor]" }],
      entities: [{ name: "e", available: "OS27", properties: [{ name: "r", type: "Calendar.RecurrenceRule", optional: true }] }],
    });
    assert.deepEqual(
      moduleTypes([domain("a", "[GeoToolbox.PlaceDescriptor]", {}), domain("b", "Where", { Where: ["LinkPresentation.LinkMetadata", "String"] })]),
      ["GeoToolbox.PlaceDescriptor", "LinkPresentation.LinkMetadata", "VisualIntelligence.SemanticContentDescriptor"],
    );
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

describe("parseDiagnostics without a location", () => {
  it("keeps a processor warning that carries no file and line", () => {
    const log = "warning: App Intents use case 'Start Navigation' is missing the schema 'maps.placeIntentValueQuery'";
    assert.deepEqual(parseDiagnostics(log).metadata, [
      { line: 0, kind: "warning", message: "App Intents use case 'Start Navigation' is missing the schema 'maps.placeIntentValueQuery'" },
    ]);
  });
});

describe("eachMetadata", () => {
  it("returns every message neither the visitor nor the classifier recognized", () => {
    const source = assemble([{ key: "notes.intent.createNote", text: "struct A {\n}\n" }]);
    const line = source.owners[0].line;
    const diagnostics = {
      swift: [],
      metadata: [
        { line, kind: "error" as const, message: "Missing required parameter 'name' from AppSchemaIntent 'notes.createNote'" },
        { line, kind: "error" as const, message: "Something Apple has not said before" },
        { line: 0, kind: "warning" as const, message: "no owner here" },
        { line: 0, kind: "error" as const, message: "no owner for this error" },
      ],
    };
    const unrecognized = eachMetadata(source, diagnostics, "pass2", (_owner, _kind, _message, finding) => finding !== undefined);
    assert.deepEqual(unrecognized, ["notes.intent.createNote: Something Apple has not said before", "line 0: no owner for this error"]);
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
    // Verbatim processor messages from the 27.2 (27B48) census logs.
    ["Type 'N_audio_activity' is missing case 'cooking' required by AppSchemaEnum 'audio.activity'", { kind: "case", name: "cooking" }],
    [
      "AppSchemaIntent 'notes.appendText' requires that 'perform()' must return @AppEntity(schema: .notes.note)",
      { kind: "returns", type: "@AppEntity(schema: .notes.note)" },
    ],
    [
      "AppSchemaIntent 'journal.createEntry' requires type of parameter 'mediaItems' to be an array of File",
      { kind: "type", name: "mediaItems", type: "an array of File" },
    ],
    [
      "AppSchemaEntity 'audio.playlist' requires type of property 'owner' to be a @UnionValue with cases limited to the types Person or String",
      { kind: "type", name: "owner", type: "a @UnionValue with cases limited to the types Person or String" },
    ],
    ["AppSchemaIntent 'audio.playAudio' requires type of parameter 'queueLocation' to be optional", { kind: "optionality", name: "queueLocation", optional: true }],
    ["AppSchemaEntity 'audio.playlist' requires type of property 'owner' to be optional", { kind: "optionality", name: "owner", optional: true }],
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
      xcode: "", sdk: "", unconfirmed: [], types: {},
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
  types: {},
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

  it("tags a row by the availability of a module type it names, directly or through a union, on the row's own platforms", () => {
    const old = "iOS 18+, macOS 15+, visionOS 2+";
    const place = (type: string) => [{ name: "location", type, optional: true }];
    const census: Census = {
      xcode: "X", sdk: "S", unconfirmed: [],
      types: {
        "GeoToolbox.PlaceDescriptor": "iOS 26+, macOS 26+, visionOS 26+, watchOS 26+, tvOS 26+",
        "VisualIntelligence.SemanticContentDescriptor": "iOS 26+, macOS 27+, macCatalyst 27+",
      },
      domains: [{
        name: "photos", tier: "primary", enums: [], singleCase: { Where: "yes" },
        unions: { Where: ["GeoToolbox.PlaceDescriptor", "String"] },
        intents: [
          { name: "search", available: old, parameters: place("[Where]") },
          { name: "share", available: "iOS 18+; not macOS", parameters: place("GeoToolbox.PlaceDescriptor") },
          { name: "find", available: "iOS 26+, macOS 27+; not visionOS", parameters: place("VisualIntelligence.SemanticContentDescriptor") },
          { name: "pin", available: "OS27", parameters: place("GeoToolbox.PlaceDescriptor") },
        ],
        entities: [
          { name: "album", available: old, properties: [] },
          { name: "asset", available: old, properties: [{ name: "location", type: "GeoToolbox.PlaceDescriptor", optional: true, alsoAccepts: "CLPlacemark", alsoAcceptsFrom: "iOS 18.0" }] },
          { name: "spot", available: old, properties: place("GeoToolbox.PlaceDescriptor") },
          { name: "cover", available: old, properties: [] },
          { name: "folder", available: old, properties: [] },
        ],
      }],
    };
    const rows = renderSchemaReference(census).split("\n").filter((l) => l.startsWith("| `"));
    assert.deepEqual(rows.map((r) => r.split(" | ")[0]), [
      "| `search` (iOS 26+, macOS 26+, visionOS 26+)",
      "| `share` (iOS 26+; not macOS)",
      "| `find` (iOS 26+, macOS 27+; not visionOS)",
      "| `pin` `OS27`",
      "| `album`",
      "| `asset`",
      "| `spot` (iOS 26+, macOS 26+, visionOS 26+)",
      "| `cover`",
      "| `folder`",
      "| `Where`",
    ]);
  });

  it("does not narrow a row by a member that also builds as an older type, and says which members those are", () => {
    const old = "iOS 18+, macOS 15+, visionOS 2+";
    const location = { name: "location", type: "GeoToolbox.PlaceDescriptor", optional: true, alsoAccepts: "CLPlacemark", alsoAcceptsFrom: "iOS 18.0" };
    const census: Census = {
      xcode: "X", sdk: "S", unconfirmed: [],
      types: { "GeoToolbox.PlaceDescriptor": "iOS 26+, macOS 26+, visionOS 26+, watchOS 26+, tvOS 26+" },
      domains: [{
        name: "journal", tier: "shortcuts", enums: [], singleCase: {}, unions: {},
        intents: [
          { name: "createEntry", available: old, parameters: [location], returns: ".journal.entry" },
          { name: "pinEntry", available: "OS27", parameters: [location] },
        ],
        entities: [{ name: "entry", available: old, properties: [location] }],
      }],
    };
    const lines = renderSchemaReference(census).split("\n");
    assert.deepEqual(lines.filter((l) => l.startsWith("| `") || l.includes("CLPlacemark")), [
      "| `createEntry` | `location: GeoToolbox.PlaceDescriptor?` | `.journal.entry` |",
      "| `pinEntry` `OS27` | `location: GeoToolbox.PlaceDescriptor?` | — |",
      "| `entry` | `location: GeoToolbox.PlaceDescriptor?` |",
      "`createEntry.location` and `entry.location` also build as `CLPlacemark` (measured at an iOS 18.0 deployment target), the type to declare where `GeoToolbox.PlaceDescriptor` (iOS 26+, macOS 26+, visionOS 26+) is unavailable.",
    ]);
  });

  it("drops a platform a named type is unavailable on", () => {
    const census: Census = {
      xcode: "X", sdk: "S", unconfirmed: [],
      types: { "Kit.Thing": "iOS 26+, macOS 26+; not visionOS" },
      domains: [{
        name: "notes", tier: "primary", enums: [], singleCase: {}, unions: {},
        intents: [
          { name: "a", available: "iOS 18+, macOS 15+, visionOS 2+", parameters: [{ name: "t", type: "Kit.Thing", optional: false }] },
          { name: "b", available: "iOS 18+, macOS 15+, visionOS 2+", parameters: [] },
          { name: "c", available: "iOS 18+, macOS 15+, visionOS 2+", parameters: [] },
        ],
        entities: [],
      }],
    };
    const rows = renderSchemaReference(census).split("\n").filter((l) => l.startsWith("| `"));
    assert.deepEqual(rows.map((r) => r.split(" | ")[0]), ["| `a` (iOS 26+, macOS 26+; not visionOS)", "| `b`", "| `c`"]);
  });

  it("throws when a named type's availability omits one of the row's platforms", () => {
    const census: Census = {
      xcode: "X", sdk: "S", unconfirmed: [],
      types: { "Kit.Thing": "iOS 26+, macOS 26+" },
      domains: [{
        name: "notes", tier: "primary", enums: [], singleCase: {}, unions: {},
        intents: [{ name: "a", available: "iOS 18+, macOS 15+, visionOS 2+", parameters: [{ name: "t", type: "Kit.Thing", optional: false }] }],
        entities: [],
      }],
    };
    assert.throws(() => renderSchemaReference(census), /a: iOS 26\+, macOS 26\+ says nothing about visionOS, where the row is available/);
  });

  it("asks for a new census when the census file predates recording type availability", () => {
    const census = {
      xcode: "X", sdk: "S", unconfirmed: [],
      domains: [{
        name: "notes", tier: "primary", enums: [], singleCase: {}, unions: {}, entities: [],
        intents: [{ name: "a", available: "OS27", parameters: [{ name: "t", type: "Kit.Thing", optional: false }] }],
      }],
    } as unknown as Census;
    assert.throws(() => renderSchemaReference(census), /records no type availability.*run node scripts\/app-schemas\.ts census/);
  });

  it("carries a module type's availability through every schema that names the schema naming it", () => {
    const old = "iOS 18+, macOS 15+, visionOS 2+";
    const census: Census = {
      xcode: "X", sdk: "S", unconfirmed: [],
      types: { "LinkPresentation.LinkMetadata": "iOS 26+, macOS 26+, visionOS 26+, watchOS 26+, tvOS 26+" },
      domains: [{
        name: "photos", tier: "primary", enums: [], singleCase: {}, unions: {},
        intents: [
          { name: "delete", available: old, parameters: [{ name: "entities", type: "[.photos.asset]", optional: false }] },
          { name: "open", available: old, parameters: [{ name: "target", type: ".photos.album", optional: false }] },
        ],
        entities: [
          { name: "album", available: old, properties: [{ name: "cover", type: ".photos.asset", optional: true }] },
          { name: "asset", available: old, properties: [{ name: "link", type: "LinkPresentation.LinkMetadata", optional: true }, { name: "album", type: ".photos.album", optional: true }] },
          { name: "a", available: old, properties: [] },
          { name: "b", available: old, properties: [] },
          { name: "c", available: old, properties: [] },
          { name: "d", available: old, properties: [] },
          { name: "e", available: old, properties: [] },
        ],
      }],
    };
    const rows = renderSchemaReference(census).split("\n").filter((l) => l.startsWith("| `"));
    assert.deepEqual(rows.map((r) => r.split(" | ")[0]), [
      "| `delete` (iOS 26+, macOS 26+, visionOS 26+)",
      "| `open` (iOS 26+, macOS 26+, visionOS 26+)",
      "| `album` (iOS 26+, macOS 26+, visionOS 26+)",
      "| `asset` (iOS 26+, macOS 26+, visionOS 26+)",
      "| `a`",
      "| `b`",
      "| `c`",
      "| `d`",
      "| `e`",
    ]);
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
  it("refuses a member that also builds as an older type without the deployment target that was measured", () => {
    const census: Census = {
      xcode: "X", sdk: "S", unconfirmed: [],
      types: { "GeoToolbox.PlaceDescriptor": "iOS 26+, macOS 26+, visionOS 26+, watchOS 26+, tvOS 26+" },
      domains: [{
        name: "journal", tier: "shortcuts", enums: [], singleCase: {}, unions: {}, intents: [],
        entities: [{
          name: "entry", available: "iOS 18+, macOS 15+, visionOS 2+",
          properties: [{ name: "location", type: "GeoToolbox.PlaceDescriptor", optional: true, alsoAccepts: "CLPlacemark" }],
        }],
      }],
    };
    assert.throws(() => renderSchemaReference(census), /entry\.location builds as CLPlacemark at no recorded deployment target; run node scripts\/app-schemas\.ts census/);
  });
});

describe("claimedTarget", () => {
  const old = "iOS 18+, macOS 15+, visionOS 2+";
  for (const [tags, target] of [
    [[old], "18.0"],
    [[old, old], "18.0"],
    [[old, "OS27"], "27.0"],
    [["iOS 26.2+; not macOS/visionOS", old], "26.2"],
  ] as const) {
    it(`builds ${tags.join(" with ")} at iOS ${target}, the newest iOS release among them`, () => {
      assert.equal(claimedTarget([...tags]), target);
    });
  }

  it("refuses a schema that is not on iOS, naming its tag", () => {
    assert.throws(() => claimedTarget([old, "macOS 27+"]), /macOS 27\+ is not available on iOS/);
  });
});

describe("acceptedSubstitutes", () => {
  const candidates = [
    { key: "photos.entity.asset", member: "location" },
    { key: "journal.entity.entry", member: "location" },
    { key: "journal.intent.createEntry", member: "location" },
  ];
  const control = "requires type of property 'location' to be GeoToolbox.PlaceDescriptorEntity";

  it("accepts every candidate when the substitute build succeeded", () => {
    assert.deepEqual(acceptedSubstitutes("substitutes", candidates, { succeeded: true, errors: [] }), candidates);
  });

  it("accepts no member of a schema the substitute build rejected", () => {
    const errors = [{ owner: "journal.entity.entry", message: control }];
    assert.deepEqual(acceptedSubstitutes("substitutes", candidates, { succeeded: false, errors }), [candidates[0], candidates[2]]);
  });

  it("refuses an error with no owning schema, naming its message, rather than accept the rest", () => {
    const errors = [{ owner: undefined, message: control }, { owner: "journal.entity.entry", message: control }];
    assert.throws(
      () => acceptedSubstitutes("substitutes", candidates, { succeeded: false, errors }),
      new RegExp(`substitutes: 1 error\\(s\\) with no owning schema: ${control}`),
    );
  });

  it("refuses an error owned by a schema with no substituted member", () => {
    const errors = [{ owner: "photos.enum.assetType", message: "something" }];
    assert.throws(
      () => acceptedSubstitutes("substitutes", candidates, { succeeded: false, errors }),
      /substitutes: errors in photos\.enum\.assetType, which substitutes no member: something/,
    );
  });

  it("refuses a failed build with no error", () => {
    assert.throws(() => acceptedSubstitutes("substitutes", candidates, { succeeded: false, errors: [] }), /substitutes: failed with no attributable error/);
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
