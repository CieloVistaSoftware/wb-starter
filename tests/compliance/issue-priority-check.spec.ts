import { test, expect } from '../fixtures/offline';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadRubric } from '../../scripts/lib/priority-triage.mjs';

/**
 * The issue priority check posts its comment once, and shows the triage
 * rules' proposal when one matches.
 *
 * Filing #1231 with two labels fired `opened` and two `labeled` events at
 * once. Each run checked for the marker comment before any had posted it, so
 * the issue got the comment twice. A concurrency group per issue queues the
 * runs, so the later one finds the comment.
 *
 * John asked why the priority is not determined automatically. The triage
 * rules in scripts/lib/priority-triage.mjs are right about three times in four
 * when they match (their header has the audit), so the comment SHOWS the
 * proposal with its evidence and never applies it.
 */

const WORKFLOW = '.github/workflows/issue-priority-check.yml';
const workflow = readFileSync(WORKFLOW, 'utf8');
const runLines = workflow.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');

test.describe('issue priority check', () => {
  test('one issue\'s runs are queued, not run side by side', () => {
    expect(runLines).toMatch(/^concurrency:\s*\n\s+group: issue-priority-\$\{\{ github\.event\.issue\.number \}\}/m);
    expect(runLines).toMatch(/cancel-in-progress: false/);
  });

  test('the comment carries the triage proposal, and nothing applies it', () => {
    expect(runLines).toContain('node scripts/triage-issue-priority.mjs --suggest');
    expect(runLines).not.toMatch(/--add-label|triage-issue-priority\.mjs[^\n]*--apply/);
  });

  test('--suggest prints a proposal with its evidence when a rule matches, and nothing otherwise', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'priority-'));
    const suggest = (issue: object) => {
      const file = path.join(dir, 'issue.json');
      writeFileSync(file, JSON.stringify(issue));
      return execFileSync('node', ['scripts/triage-issue-priority.mjs', '--suggest', file], { encoding: 'utf8' }).trim();
    };

    const gate = suggest({ title: 'Gate', body: 'CI is red on every run since Tuesday' });
    expect(gate).toContain('`priority:1`');
    expect(gate).toContain('red on every run');
    expect(gate).toContain('runnable `test:`');

    expect(suggest({ title: 'Q: how do themes load?', body: '' })).toContain('`priority:5`');
    expect(suggest({ title: 'Add a button', body: 'It would be nice.' })).toBe('');
  });

  // Law 15 and the bug template repeat the rubric so it is read BEFORE an
  // issue is filed (#1231 was filed without a priority). A copy can drift, so
  // each level's wording must still match the workflow's table.
  test('Law 15 and the bug template carry the workflow\'s rubric, word for word', () => {
    const words = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const law = words(readFileSync('docs/claude/TIER1-LAWS.md', 'utf8').split('## 15.')[1] || '');
    const template = words(readFileSync('.github/ISSUE_TEMPLATE/bug.md', 'utf8'));
    expect(law, 'TIER1-LAWS.md has no Law 15').not.toBe('');
    for (const [level, meaning] of loadRubric() as Map<number, string>) {
      expect(law, `Law 15, priority:${level}`).toContain(words(meaning));
      expect(template, `bug template, priority:${level}`).toContain(words(`priority:${level} ${meaning}`));
    }
  });
});
