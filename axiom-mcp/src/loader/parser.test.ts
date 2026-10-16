import { describe, it, expect } from 'vitest';
import { outsideFences, parseSections, parseSkill, parseCommand, parseAgent, parseAppleDoc, filterSkillSections, parseReferenceFile } from './parser.js';
import type { Skill } from './parser.js';

describe('outsideFences', () => {
  // A fence closes only on its own character with at least its opening length,
  // so a fence can quote another one (CommonMark).
  it.each([
    ['backtick fence', ['```', '# a', '```', 'b'], [false, false, false, true]],
    ['~~~ is not closed by ```', ['~~~', '```', '# x', '~~~', 'y'], [false, false, false, false, true]],
    ['four backticks wrap three', ['````md', '```swift', '# x', '```', '````', 'y'], [false, false, false, false, false, true]],
    ['indented fence in a list item', ['- item', '  ```bash', '  # c', '  ```', 'z'], [true, false, false, false, true]],
    ['an unclosed fence runs to the end', ['ok', '```', '# x'], [true, false, false]],
  ])('%s', (_name, lines, expected) => {
    expect(outsideFences(lines)).toEqual(expected);
  });
});

describe('parseSections', () => {
  // A bash comment in a fenced block is not a heading (Axiom-w4d0). Before the
  // fix, 773 of the bundle's 5,260 sections began on such a line.
  it('ignores # and ## lines inside ``` and ~~~ fences', () => {
    const content = [
      '# Title', 'Intro', '## Setup', '```bash', '# Check the log', '## not a heading', '```',
      '~~~', '# also not', '~~~', '## Usage', 'Done',
    ].join('\n');

    expect(parseSections(content).map((s) => [s.heading, s.startLine, s.endLine])).toEqual([
      ['Title', 0, 1], ['Setup', 2, 9], ['Usage', 10, 11],
    ]);
  });

  it('parses content with ## headings into sections', () => {
    const content = '## First\nContent one\n## Second\nContent two';
    const sections = parseSections(content);

    expect(sections).toEqual([
      { heading: 'First', level: 2, startLine: 0, endLine: 1, charCount: expect.any(Number) },
      { heading: 'Second', level: 2, startLine: 2, endLine: 3, charCount: expect.any(Number) },
    ]);
  });

  it('creates _preamble section for content before first heading', () => {
    const content = 'Preamble text\n## First\nContent';
    const sections = parseSections(content);

    expect(sections[0].heading).toBe('_preamble');
    expect(sections[1].heading).toBe('First');
  });

  it('handles single # headings', () => {
    const content = '# Title\nSome content\n## Section\nMore content';
    const sections = parseSections(content);

    expect(sections[0].heading).toBe('Title');
    expect(sections[0].level).toBe(1);
    expect(sections[1].heading).toBe('Section');
    expect(sections[1].level).toBe(2);
  });

  it('ignores ### and deeper headings', () => {
    const content = '## Top\n### Sub\nContent';
    const sections = parseSections(content);

    expect(sections.length).toBe(1);
    expect(sections[0].heading).toBe('Top');
  });

  it('returns preamble section for empty content', () => {
    const sections = parseSections('');
    expect(sections.length).toBe(1);
    expect(sections[0].heading).toBe('_preamble');
    expect(sections[0].charCount).toBe(0);
  });

  it('handles content with only preamble (no headings)', () => {
    const content = 'Just some text\nwith multiple lines';
    const sections = parseSections(content);

    expect(sections.length).toBe(1);
    expect(sections[0].heading).toBe('_preamble');
  });
});

describe('parseSkill', () => {
  it('parses frontmatter and content', () => {
    const md = `---
name: axiom-test-skill
description: A test skill
---

## Section One

Content here
`;
    const skill = parseSkill(md, 'axiom-test-skill');

    expect(skill.name).toBe('axiom-test-skill');
    expect(skill.description).toBe('A test skill');
    expect(skill.source).toBe('axiom');
    expect(skill.sections.length).toBeGreaterThan(0);
  });

  it('infers skill type from name conventions', () => {
    const base = `---\nname: NAME\ndescription: test\n---\nContent`;
    const suiteBase = `---\nname: NAME\ndescription: test\n---\nSee skills/child.md for details`;

    expect(parseSkill(suiteBase.replace('NAME', 'axiom-build'), 'axiom-build').skillType).toBe('router');
    expect(parseSkill(base.replace('NAME', 'axiom-something-ref'), 'axiom-something-ref').skillType).toBe('reference');
    expect(parseSkill(base.replace('NAME', 'axiom-something-diag'), 'axiom-something-diag').skillType).toBe('diagnostic');
    expect(parseSkill(base.replace('NAME', 'axiom-using-axiom'), 'axiom-using-axiom').skillType).toBe('meta');
    expect(parseSkill(base.replace('NAME', 'axiom-regular'), 'axiom-regular').skillType).toBe('discipline');
    // A skills/*.md path inside a code block is an example, not a routing table.
    expect(parseSkill('---\nname: axiom-regular\ndescription: test\n---\n```\nsee skills/child.md\n```\n', 'axiom-regular').skillType).toBe('discipline');
  });

  it('falls back to filename when name not in frontmatter', () => {
    const md = `---\ndescription: test\n---\nContent`;
    const skill = parseSkill(md, 'my-skill-dir');
    expect(skill.name).toBe('my-skill-dir');
  });

  it('defaults to empty arrays for tags and related', () => {
    const md = `---\nname: test\n---\nContent`;
    const skill = parseSkill(md, 'test');

    expect(skill.tags).toEqual([]);
    expect(skill.related).toEqual([]);
  });
});

describe('parseCommand', () => {
  it('parses command markdown with frontmatter', () => {
    const md = `---
name: fix-build
description: Fix build issues
---

Command content here
`;
    const command = parseCommand(md, 'fix-build.md');

    expect(command.name).toBe('fix-build');
    expect(command.description).toBe('Fix build issues');
    expect(command.content).toContain('Command content');
  });

  it('falls back to filename for name', () => {
    const md = `---\ndescription: test\n---\nContent`;
    const command = parseCommand(md, 'my-command.md');
    expect(command.name).toBe('my-command');
  });
});

describe('parseAgent', () => {
  it('parses agent markdown with model', () => {
    const md = `---
name: build-fixer
description: Fixes builds
model: haiku
---

Agent instructions here
`;
    const agent = parseAgent(md, 'build-fixer.md');

    expect(agent.name).toBe('build-fixer');
    expect(agent.description).toBe('Fixes builds');
    expect(agent.model).toBe('haiku');
    expect(agent.content).toContain('Agent instructions');
  });

  it('handles missing model field', () => {
    const md = `---\nname: test-agent\ndescription: test\n---\nContent`;
    const agent = parseAgent(md, 'test-agent.md');
    expect(agent.model).toBeUndefined();
  });
});

describe('parseAppleDoc', () => {
  it('takes the description from prose, not from a leading code block', () => {
    const content = '# Guide\n\n```swift\n// sample\n```\n\nThe first real sentence.';
    expect(parseAppleDoc(content, 'Guide.md', 'guide').description).toBe('The first real sentence.');
  });

  it('parses Apple doc without frontmatter', () => {
    const content = '# Liquid Glass in SwiftUI\n\nLearn how to apply glass effects.\n\n## Getting Started\n\nFirst step here.';
    const skill = parseAppleDoc(content, 'LiquidGlass-SwiftUI.md', 'guide');

    expect(skill.name).toBe('apple-guide-liquidglass-swiftui');
    expect(skill.source).toBe('apple');
    expect(skill.skillType).toBe('reference');
    expect(skill.description).toBe('Learn how to apply glass effects.');
    expect(skill.sections.length).toBeGreaterThan(0);
  });

  it('creates diagnostic type for diagnostic docs', () => {
    const content = '# Actor Isolation Error\n\nThis error occurs when...';
    const skill = parseAppleDoc(content, 'actor-isolation.md', 'diagnostic');

    expect(skill.name).toBe('apple-diag-actor-isolation');
    expect(skill.skillType).toBe('diagnostic');
  });

  it('infers tags from filename components', () => {
    const content = '# Test\nContent';
    const skill = parseAppleDoc(content, 'swift-concurrency-guide.md', 'guide');

    expect(skill.tags).toContain('swift');
    expect(skill.tags).toContain('concurrency');
    expect(skill.tags).toContain('guide');
  });
});

describe('filterSkillSections', () => {
  // Clients filter by the subheadings they can see; only # and ## start a
  // section, so a ### match returns the section that contains it.
  it('returns the containing section when a filter matches only a ### subheading', () => {
    const content = '## Certificates\n\n### Certificate Inspection\n\n```bash\n# View details\nopenssl x509 -in c.cer\n```\n\n## Profiles\n\nProfile text';
    const skill = parseSkill(`---\nname: axiom-x\ndescription: d\n---\n${content}`, 'axiom-x');
    const result = filterSkillSections(skill, ['certificate inspection']);
    expect([result.sections.map((s) => s.heading), result.content.includes('openssl x509'), result.content.includes('Profile text')]).toEqual([['Certificates'], true, false]);
  });

  it('resolves each filter on its own: a heading match does not drop another filter\'s subheading match', () => {
    const content = '## Certificates\n\n### Inspection\n\ntext\n\n## Profiles\n\nProfile text';
    const skill = parseSkill(`---\nname: axiom-x\ndescription: d\n---\n${content}`, 'axiom-x');
    expect(filterSkillSections(skill, ['profiles', 'inspection', 'inspection']).sections.map((s) => s.heading)).toEqual(['Certificates', 'Profiles']);
  });

  it('does not match a # comment inside a code block as a subheading', () => {
    const content = '## Certificates\n\n```bash\n# View details\n```\n\n## Profiles\n\nProfile text';
    const skill = parseSkill(`---\nname: axiom-x\ndescription: d\n---\n${content}`, 'axiom-x');
    expect(filterSkillSections(skill, ['view details']).sections).toEqual([]);
  });

  const skill: Skill = {
    name: 'test-skill',
    description: 'test',
    content: '## Overview\nIntro text\n## Patterns\nPattern content\n## Resources\nLinks here',
    skillType: 'discipline',
    source: 'axiom',
    tags: [],
    related: [],
    sections: [
      { heading: 'Overview', level: 2, startLine: 0, endLine: 1, charCount: 20 },
      { heading: 'Patterns', level: 2, startLine: 2, endLine: 3, charCount: 25 },
      { heading: 'Resources', level: 2, startLine: 4, endLine: 5, charCount: 18 },
    ],
  };

  it('returns full content when no section names provided', () => {
    const result = filterSkillSections(skill);
    expect(result.content).toBe(skill.content);
    expect(result.sections).toBe(skill.sections);
  });

  it('returns full content for empty section names array', () => {
    const result = filterSkillSections(skill, []);
    expect(result.content).toBe(skill.content);
  });

  it('filters to matching sections (case-insensitive substring)', () => {
    const result = filterSkillSections(skill, ['pattern']);
    expect(result.sections.length).toBe(1);
    expect(result.sections[0].heading).toBe('Patterns');
    expect(result.content).toContain('Pattern content');
    expect(result.content).not.toContain('Intro text');
  });

  it('matches multiple sections', () => {
    const result = filterSkillSections(skill, ['overview', 'resources']);
    expect(result.sections.length).toBe(2);
  });

  it('returns empty content when no sections match', () => {
    const result = filterSkillSections(skill, ['nonexistent']);
    expect(result.sections).toEqual([]);
    expect(result.content).toBe('');
  });

  it('always returns the same skill reference', () => {
    const result = filterSkillSections(skill, ['overview']);
    expect(result.skill).toBe(skill);
  });
});

describe('parseReferenceFile', () => {
  it('does not take a # comment in a code block as the title', () => {
    const content = 'Intro sentence.\n\n```bash\n# not a title\n```\n';
    expect(parseReferenceFile(content, 'audio-ref.md', 'axiom-media').description).not.toBe('not a title');
  });

  // Six suite files shipped "```swift" as their catalog description because the
  // first line after the title's heading was a fence.
  it('takes the description from prose, not from a leading code block', () => {
    const content = '# Audio Reference\n\n## Quick Reference\n\n```swift\n# not prose\nlet x = 1\n```\n\nUse the session first.\n';
    expect(parseReferenceFile(content, 'audio-ref.md', 'axiom-media').description).toBe('Use the session first.');
  });

  it('skips horizontal rules and table rows when looking for the description', () => {
    const content = '# Migration\n\n---\n\n| From | To |\n|---|---|\n| A | B |\n\n***\n\nMove one call site at a time.\n';
    expect(parseReferenceFile(content, 'migration.md', 'axiom-networking').description).toBe('Move one call site at a time.');
  });

  it('parses frontmatter-free markdown into a Skill', () => {
    const content = `# Timer Patterns

Use timers carefully to avoid retain cycles.

## Background Timers

Details about background timers here.
`;
    const skill = parseReferenceFile(content, 'timer-patterns.md', 'axiom-integration');

    expect(skill.name).toBe('axiom-integration--timer-patterns');
    expect(skill.description).toBe('Use timers carefully to avoid retain cycles.');
    expect(skill.skillType).toBe('discipline');
    expect(skill.source).toBe('axiom');
    expect(skill.tags).toContain('timer');
    expect(skill.tags).toContain('patterns');
  });

  it('infers skill type from filename suffix', () => {
    const content = '# Some Ref\n\nDescription here.\n';

    const refSkill = parseReferenceFile(content, 'timer-patterns-ref.md', 'axiom-integration');
    expect(refSkill.skillType).toBe('reference');

    const diagSkill = parseReferenceFile(content, 'timer-patterns-diag.md', 'axiom-integration');
    expect(diagSkill.skillType).toBe('diagnostic');
  });

  it('extracts description from first paragraph after title', () => {
    const content = `# Timer Patterns


Use timers carefully.

## Section
`;
    const skill = parseReferenceFile(content, 'timer-patterns.md', 'axiom-integration');

    expect(skill.description).toBe('Use timers carefully.');
  });

  it('falls back to title when no prose exists at all', () => {
    const content = `# Timer Patterns

## Overview
`;
    const skill = parseReferenceFile(content, 'timer-patterns.md', 'axiom-integration');

    expect(skill.description).toBe('Timer Patterns');
  });

  it('finds prose under a sub-header when none follows title directly', () => {
    const content = `# Timer Patterns

## Overview

Details here.
`;
    const skill = parseReferenceFile(content, 'timer-patterns.md', 'axiom-integration');

    expect(skill.description).toBe('Details here.');
  });
});
