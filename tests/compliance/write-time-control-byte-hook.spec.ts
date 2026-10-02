import { test, expect } from '@playwright/test';
import { spawnSync } from 'child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

/**
 * #1162 layer 1 -- John: "yes add the write-time hook". .claude/settings.json
 * runs scripts/check-written-control-bytes.mjs after every Write/Edit; it must
 * exit 2 (Claude Code shows stderr to the agent) for a control byte, and 0 for
 * a clean file or a payload it cannot judge.
 */
const run = (payload: unknown) => spawnSync(process.execPath, ['scripts/check-written-control-bytes.mjs'],
  { input: JSON.stringify(payload), encoding: 'utf8' });

test('the hook is registered on Write|Edit|MultiEdit', () => {
  const settings = JSON.parse(readFileSync('.claude/settings.json', 'utf8'));
  const entry = settings.hooks.PostToolUse.find((h: { matcher: string }) => h.matcher === 'Write|Edit|MultiEdit');
  expect(entry?.hooks?.[0]?.command).toBe('node scripts/check-written-control-bytes.mjs');
});

test('a written control byte is rejected with its line; a clean file passes', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'cb-hook-'));
  try {
    const bad = path.join(dir, 'bad.js');
    const good = path.join(dir, 'good.js');
    writeFileSync(bad, `ok\nx${String.fromCharCode(27)}[0m\ny${String.fromCharCode(8)}\n`);
    writeFileSync(good, 'clean\n');
    const r = run({ tool_name: 'Edit', tool_input: { file_path: bad } });
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('bad.js:2:2');
    expect(r.stderr).toContain('bad.js:3:2');
    expect(run({ tool_name: 'Write', tool_input: { file_path: good } }).status).toBe(0);
    expect(run({}).status).toBe(0);
    expect(run({ tool_input: { file_path: path.join(dir, 'missing.js') } }).status).toBe(0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
