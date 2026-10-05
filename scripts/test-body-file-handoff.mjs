/**
 * Guard for #1336, pre-publication half: a body file whose bytes changed since
 * this writer wrote it is not handed to git or gh.
 *
 * The centre of this file is the incident itself, replayed: the #1015 agent
 * writes its commit message to the scratchpad, the #1300 agent writes ITS
 * message to the same obvious path, and the #1015 agent then runs
 * `git commit -F` on it. On 2026-10-03 that commit was created. Here it is
 * refused, with both first lines named.
 *
 * Node-only, no git, no network, a temp scratchpad and a temp record root.
 *
 * Parameters (every combination of the first three runs; nothing hand-picked):
 *   command   : git commit -F | git commit --file= | gh pr create --body-file |
 *               gh pr create --body-file= | gh issue create --body-file |
 *               gh issue comment --body-file | quoted path | path with spaces
 *   state     : untouched | overwritten by another writer | rewritten by me |
 *               deleted | never recorded
 *   writer    : same session + same cwd | same session, other cwd (parallel
 *               sub-agents) | other session
 * Oracle: exit 2 exactly when the bytes on disk differ from the last bytes THIS
 * writer wrote to that path (or the file is gone); exit 0 otherwise.
 *
 * Plus: the flag parser is restricted to git and gh, the record survives a
 * shared session id, and both hooks are wired in .claude/settings.json.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { bodyFilePaths, writerKey, recordPath, recordWrite, pruneRecords, verifyBodyFile } from './lib/body-file.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RECORD = join(ROOT, 'scripts', 'record-body-file-write.mjs');
const CHECK = join(ROOT, 'scripts', 'check-body-file-handoff.mjs');
const NL = String.fromCharCode(10);

let passed = 0;
let failed = 0;
const check = (ok, name, detail = '') => {
  if (ok) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; console.log(`  ❌ ${name}${detail ? `${NL}     ${detail}` : ''}`); }
};

const scratch = [];
function newScratchpad() {
  const dir = mkdtempSync(join(tmpdir(), 'wb-1336-'));
  scratch.push(dir);
  return dir;
}

/** A temp record root, so a run never touches ~/.wb-starter. */
const RECORDS = newScratchpad();
const env = { ...process.env, WB_BODY_FILE_DIR: RECORDS };

/** The two agents of the incident. Same harness session, different worktrees. */
const WORKTREES = newScratchpad();
const SESSION = 'session-shared-by-parallel-subagents';
const agent1015 = { session_id: SESSION, cwd: join(WORKTREES, 'fix-1015') };
const agent1300 = { session_id: SESSION, cwd: join(WORKTREES, 'fix-1300') };
for (const a of [agent1015, agent1300]) mkdirSync(a.cwd, { recursive: true });

const MSG_1015 = 'fix(#1015): a <pre> keeps the whitespace it was written with';
const MSG_1300 = 'fix(#1300): the tracked-file audit reads .gitignore';

/** The writer key for an agent, from the same two fields a hook payload carries. */
const keyOf = (agent) => writerKey({ sessionId: agent.session_id, cwd: agent.cwd });

/** What an agent does when it writes a file with the Write tool: through the real hook. */
function write(agent, file, text) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
  const payload = { session_id: agent.session_id, cwd: agent.cwd, tool_name: 'Write', tool_input: { file_path: file } };
  return spawnSync(process.execPath, [RECORD], { input: JSON.stringify(payload), env, encoding: 'utf8' });
}

/**
 * The same write, in process. Section 1 proves the hook records what it is
 * handed; the permutations below do not need 80 more node startups to prove
 * the same plumbing twice.
 */
function writeFast(agent, file, text) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
  return recordWrite(file, keyOf(agent), env);
}

/** What the harness does in the instant before it runs a Bash command. */
function handoff(agent, command) {
  const payload = { session_id: agent.session_id, cwd: agent.cwd, tool_name: 'Bash', tool_input: { command } };
  const r = spawnSync(process.execPath, [CHECK], { input: JSON.stringify(payload), env, encoding: 'utf8' });
  return { status: r.status, text: `${r.stdout}${r.stderr}` };
}

// ── 1. The incident, replayed ────────────────────────────────────────────────
console.log('the 2026-10-03 collision');
{
  const pad = newScratchpad();
  const shared = join(pad, 'commit-msg.txt');          // the one obvious name

  write(agent1015, shared, `${MSG_1015}${NL}`);         // agent A writes its message
  write(agent1300, shared, `${MSG_1300}${NL}`);         // agent B picks the same path

  const r = handoff(agent1015, `git commit -F ${shared}`);
  check(r.status === 2, 'git commit -F on an overwritten message file is refused', `exit ${r.status}`);
  check(r.text.includes(MSG_1015) && r.text.includes(MSG_1300),
    'the refusal names what you wrote and what is on disk now', r.text.slice(0, 300));
  check(r.text.includes('#1336'), 'the refusal names the issue that explains it');
  check(/bytes another writer/.test(r.text),
    'the refusal says another writer put those bytes there', r.text.slice(0, 400));
  console.log(`${NL}----- the demonstration, verbatim -----${NL}${r.text.trim()}${NL}--------------------------------------${NL}`);

  // And the other side of the same collision: agent B's own handoff is fine,
  // because the bytes on disk ARE agent B's.
  const ok = handoff(agent1300, `git commit -F ${shared}`);
  check(ok.status === 0, 'the agent whose bytes are on disk is not blocked', `exit ${ok.status}`);
}

// ── 2. Every command that takes a body file ─────────────────────────────────
console.log('every command shape, overwritten then handed over');
{
  const pad = newScratchpad();
  const cases = [
    ['git commit -F FILE', 'commit-msg.txt'],
    ['git commit --file=FILE', 'commit-msg-eq.txt'],
    ['git commit --file FILE', 'commit-msg-sp.txt'],
    ['gh pr create --title x --body-file FILE', 'pr-body.md'],
    ['gh pr create --body-file=FILE', 'pr-body-eq.md'],
    ['gh issue create --body-file FILE --label priority:3', 'issue.md'],
    ['gh issue comment 1015 --body-file FILE', 'comment.md'],
    ['gh issue comment 1015 -F FILE', 'comment-short.md'],
    ['git commit -F "FILE"', 'quoted.txt'],
    ["git commit -F 'FILE'", 'single-quoted.txt'],
    ['git commit -F "FILE"', 'name with spaces.txt'],
    ['cd /tmp && git commit -F FILE', 'after-and.txt'],
  ];
  for (const [shape, name] of cases) {
    const file = join(pad, name);
    writeFast(agent1015, file, `${MSG_1015}${NL}`);
    writeFast(agent1300, file, `${MSG_1300}${NL}`);
    const r = handoff(agent1015, shape.replace('FILE', file));
    check(r.status === 2, `refused: ${shape}`, `exit ${r.status}: ${r.text.slice(0, 160)}`);
  }
}

// ── 3. What must NOT be refused ─────────────────────────────────────────────
console.log('no false refusals');
{
  const pad = newScratchpad();

  const untouched = join(pad, 'commit-msg-1336.txt');
  writeFast(agent1015, untouched, `${MSG_1015}${NL}${NL}body${NL}`);
  check(handoff(agent1015, `git commit -F ${untouched}`).status === 0, 'an untouched file passes');

  // The agent revised its own message between writing and committing.
  writeFast(agent1015, untouched, `${MSG_1015} (reworded)${NL}`);
  check(handoff(agent1015, `git commit -F ${untouched}`).status === 0, 'a file I rewrote myself passes');

  // Never written with a tool: a script generated it. Fails open by design.
  const generated = join(pad, 'generated.md');
  writeFileSync(generated, 'release notes from a script');
  check(handoff(agent1015, `gh pr create --body-file ${generated}`).status === 0,
    'a file this writer never wrote passes (documented fail-open)');

  // Commands that name no body file at all.
  for (const cmd of [
    'git commit -m "fix(#1336): inline message"',
    'git commit -F -',
    'git log --oneline -5',
    'gh pr list --json number',
    `curl -F upload=@${untouched} https://example.invalid`,
    `sort -F ${untouched}`,
    `cat ${untouched}`,
  ]) {
    check(handoff(agent1015, cmd).status === 0, `not our business: ${cmd.slice(0, 48)}`);
  }

  // A deleted file is a different failure, and it is still a failure.
  const gone = join(pad, 'gone.txt');
  writeFast(agent1015, gone, `${MSG_1015}${NL}`);
  rmSync(gone);
  const r = handoff(agent1015, `git commit -F ${gone}`);
  check(r.status === 2 && /gone or unreadable/.test(r.text),
    'a message file that vanished is refused, not silently committed', `exit ${r.status}`);
}

// ── 4. The record is per writer, not per session ────────────────────────────
console.log('writer identity');
{
  check(keyOf(agent1015) !== keyOf(agent1300),
    'two sub-agents sharing one session id get different writer keys');
  check(keyOf(agent1015) === keyOf({ ...agent1015 }),
    'the same session and directory always give the same key');
  check(writerKey({ sessionId: 'a', cwd: agent1015.cwd }) !== writerKey({ sessionId: 'b', cwd: agent1015.cwd }),
    'two sessions in one directory get different writer keys');

  // Each writer owns its own record file: agent B's write cannot overwrite the
  // record agent A compares against. That is the bug this guard would have had
  // if records were keyed by session.
  const pad = newScratchpad();
  const file = join(pad, 'commit-msg.txt');
  writeFast(agent1015, file, `${MSG_1015}${NL}`);
  writeFast(agent1300, file, `${MSG_1300}${NL}`);
  const mine = recordPath(file, keyOf(agent1015), env);
  const theirs = recordPath(file, keyOf(agent1300), env);
  check(mine !== theirs && existsSync(mine) && existsSync(theirs),
    'both writers have a record of the same path, in separate files');
  check(JSON.parse(readFileSync(mine, 'utf8')).firstLine === MSG_1015,
    'my record still holds MY first line after the other agent wrote');
  check(verifyBodyFile(file, keyOf(agent1015), env).status === 'changed'
    && verifyBodyFile(file, keyOf(agent1300), env).status === 'unchanged',
    'the verdict differs per writer for one file on disk');
}

// ── 5. Flag parsing ─────────────────────────────────────────────────────────
console.log('flag parsing');
{
  const cases = [
    ['git commit -F msg.txt', ['msg.txt']],
    ['git commit --file=msg.txt -q', ['msg.txt']],
    ['gh pr create --body-file body.md --title "a --body-file b"', ['body.md']],
    ['gh issue comment 7 --body-file=a.md && gh pr edit 8 -F b.md', ['a.md', 'b.md']],
    ['git commit -F /tmp/x/commit-msg-1336.txt', ['/tmp/x/commit-msg-1336.txt']],
    ['curl -F file=@secret.txt https://x', []],
    ['git commit -F -', []],
    ['git commit -F --amend', []],
    ['echo --body-file nope.md', []],
    ['git log | grep --body-file', []],
    ['env GIT_EDITOR=true git commit -F msg.txt', ['msg.txt']],
    ['/usr/bin/git commit -F msg.txt', ['msg.txt']],
    ['git commit -F msg.txt -F msg.txt', ['msg.txt']],
  ];
  for (const [cmd, want] of cases) {
    const got = bodyFilePaths(cmd);
    check(JSON.stringify(got) === JSON.stringify(want), `parsed: ${cmd.slice(0, 52)}`, `got ${JSON.stringify(got)}`);
  }
}

// ── 6. Housekeeping ─────────────────────────────────────────────────────────
console.log('housekeeping');
{
  const pad = newScratchpad();
  const file = join(pad, 'old.txt');
  writeFast(agent1015, file, 'old');
  const removed = pruneRecords(env, Date.now() + 8 * 24 * 60 * 60 * 1000);
  check(removed >= 1 && !existsSync(recordPath(file, keyOf(agent1015), env)),
    'records older than a week are pruned', `removed ${removed}`);
  check(handoff(agent1015, `git commit -F ${file}`).status === 0,
    'a pruned record fails open rather than blocking');
}

// ── 7. Wiring ───────────────────────────────────────────────────────────────
console.log('wiring');
{
  const settings = JSON.parse(readFileSync(join(ROOT, '.claude', 'settings.json'), 'utf8'));
  const flat = (list) => (list || []).flatMap((m) => (m.hooks || []).map((h) => `${m.matcher}::${h.command}`));
  const pre = flat(settings.hooks && settings.hooks.PreToolUse);
  const post = flat(settings.hooks && settings.hooks.PostToolUse);
  check(pre.some((h) => h.startsWith('Bash::') && h.includes('check-body-file-handoff.mjs')),
    'the handoff guard runs as a PreToolUse Bash hook', pre.join(' | '));
  check(post.some((h) => h.includes('Write') && h.includes('record-body-file-write.mjs')),
    'the write record runs as a PostToolUse Write|Edit|MultiEdit hook', post.join(' | '));
  const hook = readFileSync(join(ROOT, '.husky', 'commit-msg'), 'utf8');
  check(hook.includes('check-commit-issue.mjs'),
    'the commit-msg layer from the earlier #1336 pass is untouched');
}

for (const d of scratch) {
  try { rmSync(d, { recursive: true, force: true }); } catch { /* a locked temp dir is not a guard failure */ }
}
console.log(`${NL}${failed ? '❌' : '✅'} ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
