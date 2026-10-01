import { test, expect } from '../fixtures/offline';
import { readFileSync } from 'node:fs';

const workflow = readFileSync('.github/workflows/issue-priority-check.yml', 'utf8')
  .split('\n')
  .filter((line) => !/^\s*#/.test(line))
  .join('\n');

test('issue priority checks are serialized per issue, with close checks kept separate', () => {
  expect(workflow).toMatch(
    /^concurrency:\s*\n\s+group: issue-priority-\$\{\{ github\.event\.issue\.number \}\}-\$\{\{ github\.event\.action == 'closed' && 'closed' \|\| 'open' \}\}/m,
  );
  expect(workflow).toMatch(/cancel-in-progress:\s*false/);
  expect(workflow).toContain('if [ "$COUNT" = "1" ]; then exit 0; fi');
});
