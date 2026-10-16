import { describe, it, expect } from 'vitest';
import { extractTags } from './generate-annotations.js';

describe('extractTags', () => {
  // Heading terms become search tags, so a bash comment in a fenced block must
  // not contribute one (Axiom-w4d0).
  it('takes heading tags from real headings only, not from # lines in code fences', () => {
    const content = '# Guide\n\n## UserDefaultsStorage\n\n```bash\n# CheckBuildLog for warnings\n```\n';
    const tags = extractTags('', 'axiom-data--guide', 'data', 'reference', content);
    expect(['userdefaultsstorage', 'checkbuildlog'].map((t) => tags.includes(t))).toEqual([true, false]);
  });
});
