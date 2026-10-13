import { describe, it, expect, vi } from 'vitest';
import { ResourcesHandler } from './handler.js';
import type { Loader } from '../loader/types.js';
import type { Skill } from '../loader/parser.js';
import { Logger, type Config } from '../config.js';

const mockLogger = new Logger({ mode: 'production', enableAppleDocs: false, logLevel: 'error' } satisfies Config);

function makeSkill(name: string): Skill {
  return { name, description: 'A skill', content: 'Body' } as Skill;
}

function makeHandler(skill: Skill): ResourcesHandler {
  const loader = {
    loadSkills: vi.fn().mockResolvedValue(new Map([[skill.name, skill]])),
    getSkill: vi.fn().mockResolvedValue(skill),
  } as unknown as Loader;
  return new ResourcesHandler(loader, mockLogger);
}

describe('ResourcesHandler', () => {
  it.each([
    ['axiom-build--xcode-debugging', 'Axiom Build Xcode Debugging'],
    ['axiom-design--liquid-glass-ref', 'Axiom Design Liquid Glass Ref'],
    ['axiom-swiftui', 'Axiom Swiftui'],
  ])('lists %s under the display name %s', async (id, displayName) => {
    const { resources } = await makeHandler(makeSkill(id)).listResources();

    expect(resources).toEqual([
      { uri: `axiom://skill/${id}`, name: displayName, description: 'A skill', mimeType: 'text/markdown' },
    ]);
  });

  it('heads read content with the same display name it lists', async () => {
    const id = 'axiom-build--xcode-debugging';

    const { contents } = await makeHandler(makeSkill(id)).readResource(`axiom://skill/${id}`);

    expect(contents[0].text.split('\n')[0]).toBe('# Axiom Build Xcode Debugging');
  });
});
