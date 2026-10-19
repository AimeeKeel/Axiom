import {
  CURSOR_ALLOWED_AGENT_FIELDS,
  CURSOR_FORCED_FOREGROUND,
  classifyAgentTools,
} from "./contract.ts";
import {
  assertNoUnsupportedClaudeTokens,
  CURSOR_MCP_TOOL_BOUNDARY,
  CURSOR_XCUI_TOOL_BOUNDARY,
  rewriteCursorMcpWorkflows,
  rewriteCursorInvocations,
  WRAPPED_BINARY_PATTERN,
} from "./references.ts";
import type {
  AgentProfile,
  Authority,
  SourceAgent,
  TransformedAgent,
} from "./types.ts";

function yamlScalar(value: string): string {
  return /^[a-zA-Z0-9_.-]+$/.test(value) ? value : JSON.stringify(value);
}

export function normalizeAgentDescription(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("agent description must be a non-empty string");
  }
  const firstParagraph = value.trim().split(/\n[ \t]*\n/, 1)[0] ?? "";
  const normalizedParagraph = firstParagraph.replace(/\s+/g, " ").trim();
  const firstSentence = normalizedParagraph.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? normalizedParagraph;
  const description = rewriteCursorMcpWorkflows(rewriteCursorInvocations(firstSentence.replace(/\bCLI-based\b/g, "MCP-based")));
  assertNoUnsupportedClaudeTokens(description);
  return description;
}

function assertCanonicalAgent(agent: SourceAgent): void {
  if (agent.filename !== `${agent.name}.md`) {
    throw new Error(`agent filename must match name: ${agent.filename}`);
  }
  if (agent.frontmatter.name !== agent.name) {
    throw new Error(`agent frontmatter name must match name: ${agent.name}`);
  }
  for (const field of Object.keys(agent.frontmatter)) {
    if (!CURSOR_ALLOWED_AGENT_FIELDS.has(field)) {
      throw new Error(`unknown agent frontmatter field: ${field}`);
    }
  }
  if (!Array.isArray(agent.frontmatter.tools)) {
    throw new Error(`agent frontmatter tools must be an array: ${agent.name}`);
  }
  if (agent.frontmatter.tools.join("\0") !== agent.tools.join("\0")) {
    throw new Error(`agent tools disagree with frontmatter: ${agent.name}`);
  }
}

function requiredSkills(frontmatter: Record<string, unknown>): string[] {
  const skills = frontmatter.skills;
  if (skills === undefined) return [];
  if (!Array.isArray(skills) || skills.some((skill) => typeof skill !== "string")) {
    throw new Error("agent skills must be a string array");
  }
  return skills;
}

function promptPreamble(agent: SourceAgent): string {
  const sections: string[] = [];
  const skills = requiredSkills(agent.frontmatter);
  if (skills.length > 0) {
    sections.push(`## Required Skills\n\n${skills.map((skill) => `- \`${skill}\``).join("\n")}`);
  }
  return sections.length === 0 ? "" : `${sections.join("\n\n")}\n\n`;
}

export function transformAgent(agent: SourceAgent, profile: AgentProfile): TransformedAgent {
  assertCanonicalAgent(agent);
  const authority = classifyAgentTools(agent.tools) as Authority;
  const sourceBackground = agent.frontmatter.background === true;
  // Apply the forced-foreground exclusion once, before it reaches frontmatter — emitting
  // `is_background: true` here while reporting foreground downstream ships inconsistent metadata.
  const releasedBackground = profile === "full"
    && authority === "readonly"
    && sourceBackground
    && !CURSOR_FORCED_FOREGROUND.has(agent.name);
  const description = normalizeAgentDescription(agent.frontmatter.description);
  const frontmatter = profile === "full"
    ? [
      `name: ${yamlScalar(agent.name)}`,
      `description: ${yamlScalar(description)}`,
      "model: inherit",
      `readonly: ${authority === "readonly"}`,
      `is_background: ${releasedBackground}`,
    ]
    : [
      `name: ${yamlScalar(agent.name)}`,
      `description: ${yamlScalar(description)}`,
    ];
  const translatedBody = rewriteCursorMcpWorkflows(rewriteCursorInvocations(agent.body));
  const hasMcpWorkflow = new RegExp(`\\baxiom_${WRAPPED_BINARY_PATTERN}_`).test(translatedBody);
  const body = `${hasMcpWorkflow ? `${CURSOR_MCP_TOOL_BOUNDARY}\n\n` : ""}${agent.name === "simulator-tester" ? `${CURSOR_XCUI_TOOL_BOUNDARY}\n\n` : ""}${translatedBody}`;
  assertNoUnsupportedClaudeTokens(body);

  return {
    name: agent.name,
    authority,
    sourceBackground,
    releasedBackground,
    authorityExpansion: [...agent.tools],
    file: {
      path: `agents/${agent.filename}`,
      content: `---\n${frontmatter.join("\n")}\n---\n\n${promptPreamble(agent)}${body}`,
      mode: 0o644,
    },
  };
}
