/**
 * The shared-scratchpad collision guard (#1336): what an agent wrote to a body
 * file, and who wrote it.
 *
 * 2026-10-03: four agents worked different issues at once. Two of them wrote a
 * commit message to the same obvious path in the one scratchpad directory they
 * share, and the #1015 agent's `git commit -F commit-msg.txt` picked up the
 * #1300 agent's message. The commit landed describing work it did not contain.
 * A person reading the output caught it; nothing in the process did.
 *
 * The scratchpad is handed to the agent by the harness, so this repo cannot
 * move it or partition it. What the repo CAN do is refuse to hand a file to
 * `git commit -F` / `gh --body-file` when the bytes on disk are no longer the
 * bytes this writer put there. That needs a record of the write, which is what
 * this module addresses.
 *
 * WHY THIS, WHEN #1336 ALREADY HAS THREE LAYERS. The commit-msg hook
 * (scripts/lib/commit-issue-match.mjs), pr-body-names-its-issue.yml and
 * closing-comment-cites-its-pr.yml all compare PUBLISHED text against the
 * issue number its branch is named for. They are the right checks and they
 * stay. What none of them can do:
 *
 *   - stop anything. Two of the three run on a GitHub event, so the PR
 *     description or the closing comment is already published when they speak.
 *   - see a swap whose text cites the right number anyway -- two agents on one
 *     issue, or a body that happens to mention it.
 *   - cover `gh issue create --body-file`, the fourth row of the issue's own
 *     table, which has no number to be checked against yet.
 *
 * This layer is the collision check itself rather than a check on content: the
 * bytes are hashed when written and hashed again in the instant before git or
 * gh reads them. It runs before publication, it does not care what the file
 * says, and it covers every command that takes a body file.
 *
 * The record is keyed by WRITER, not by session: parallel sub-agents can share
 * one session id, and a single shared record would simply be overwritten by
 * the second agent -- the exact failure being guarded against, moved one level
 * down. Each writer owns one file per path and reads only its own, so two
 * agents never contend and never mask each other.
 *
 * Pure except for the small read/write helpers at the bottom; the hooks that
 * use it (scripts/record-body-file-write.mjs,
 * scripts/check-body-file-handoff.mjs) hold no logic of their own.
 */
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { readFileSync, writeFileSync, mkdirSync, renameSync, readdirSync, statSync, rmSync } from 'node:fs';
import { join, resolve, isAbsolute, extname } from 'node:path';

/** Never hashed or recorded: a body file is text, and a 40 MB video is not one. */
const BINARY = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf', '.zip', '.gz', '.woff', '.woff2', '.ttf', '.otf', '.mp3', '.mp4', '.webm', '.wav', '.ogg', '.vsix', '.exe', '.dll']);
const MAX_BYTES = 2 * 1024 * 1024;
const KEEP_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Where write records live. `~/.wb-starter` is already this repo's
 * machine-shared coordination directory (scripts/lib/test-lock.mjs, #651), and
 * the point here is cross-worktree visibility, so records cannot live in a
 * worktree. WB_BODY_FILE_DIR overrides it for tests.
 */
export function recordRoot(env = process.env) {
  return env.WB_BODY_FILE_DIR || join(homedir(), '.wb-starter', 'body-files');
}

/**
 * The identity of the thing that wrote a file: session AND working directory.
 *
 * Session alone is not enough (parallel sub-agents share one). Working
 * directory alone is not enough (two sessions in one checkout). Together they
 * are the finest grain available from a hook payload, and in this repo every
 * agent works in its own worktree, so they separate agents in practice.
 */
export function writerKey({ sessionId = '', cwd = '' } = {}) {
  const dir = process.platform === 'win32' ? cwd.replace(/\\/g, '/').toLowerCase() : cwd;
  return createHash('sha1').update(`${sessionId}|${dir}`).digest('hex').slice(0, 16);
}

/** One directory per body file path, shared by every writer of that path. */
export function pathKey(absolutePath) {
  const p = process.platform === 'win32' ? absolutePath.replace(/\\/g, '/').toLowerCase() : absolutePath;
  return createHash('sha1').update(p).digest('hex').slice(0, 20);
}

/** sha256 of the bytes on disk, or null when the file cannot be read. */
export function hashFile(file) {
  try {
    if (statSync(file).size > MAX_BYTES) return null;
    return createHash('sha256').update(readFileSync(file)).digest('hex');
  } catch { return null; }
}

/** First non-blank line, trimmed and capped -- enough to name a message in an error. */
export function firstLineOf(file) {
  try {
    const text = readFileSync(file, 'utf8');
    const line = text.split(/\r?\n/).find((l) => l.trim().length > 0) || '';
    return line.trim().slice(0, 120);
  } catch { return ''; }
}

export function isRecordable(file) {
  if (!file) return false;
  if (BINARY.has(extname(file).toLowerCase())) return false;
  try { return statSync(file).size <= MAX_BYTES; } catch { return false; }
}

// ── Which paths a command is about to publish ────────────────────────────────

/**
 * Split a shell command into tokens, honouring single and double quotes.
 * Good enough for finding a flag's value, which is all this is for.
 */
export function tokenize(command) {
  const out = [];
  let cur = '';
  let quote = '';
  let has = false;
  for (const ch of String(command)) {
    if (quote) {
      if (ch === quote) quote = '';
      else { cur += ch; has = true; }
    } else if (ch === '"' || ch === "'") {
      quote = ch; has = true;
    } else if (/\s/.test(ch)) {
      if (has) { out.push(cur); cur = ''; has = false; }
    } else { cur += ch; has = true; }
  }
  if (has) out.push(cur);
  return out;
}

/** Flags whose value is a file git or gh will publish verbatim. */
const FILE_FLAGS = new Set(['-F', '--file', '--body-file']);
const SEPARATORS = new Set(['|', '||', '&&', ';', '&', '(', ')', '{', '}']);

/**
 * Every path this command hands to git or gh as a message/body file.
 *
 * Restricted to git and gh on purpose: `curl -F` is form data and `sort -F`
 * does not exist, and a guard that blocks unrelated commands would be deleted
 * within a day. "-" (stdin) is not a path.
 *
 * @param {string} command the Bash tool's command string
 * @returns {string[]} paths exactly as written, in order, de-duplicated
 */
export function bodyFilePaths(command) {
  const tokens = tokenize(command);
  const found = [];
  let program = '';
  let expectValue = false;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (SEPARATORS.has(t)) { program = ''; expectValue = false; continue; }
    if (!program) {
      // Skip a leading `env VAR=x` / `VAR=x` prefix, then take the program name.
      if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(t) || t === 'env') continue;
      const name = t.replace(/\\/g, '/').split('/').pop().replace(/\.exe$/i, '');
      program = name;
      continue;
    }
    if (program !== 'git' && program !== 'gh') continue;
    if (expectValue) {
      expectValue = false;
      if (t !== '-' && !t.startsWith('-')) found.push(t);
      continue;
    }
    const eq = t.indexOf('=');
    if (eq > 0 && FILE_FLAGS.has(t.slice(0, eq))) {
      const value = t.slice(eq + 1);
      if (value && value !== '-') found.push(value);
      continue;
    }
    if (FILE_FLAGS.has(t)) expectValue = true;
  }
  return [...new Set(found)];
}

/** Resolve a path the way the command's own shell would. */
export function resolveFrom(cwd, file) {
  return isAbsolute(file) ? resolve(file) : resolve(cwd || process.cwd(), file);
}

// ── The record itself ────────────────────────────────────────────────────────

/** Where one writer's record of one path lives. */
export function recordPath(file, writer, env = process.env) {
  return join(recordRoot(env), pathKey(file), `${writer}.json`);
}

/**
 * Remember that `writer` just wrote `file`. Never throws: a guard that breaks
 * a write it was only observing is worse than no guard.
 */
export function recordWrite(file, writer, env = process.env) {
  try {
    if (!isRecordable(file)) return null;
    const hash = hashFile(file);
    if (!hash) return null;
    const entry = { path: file, writer, hash, firstLine: firstLineOf(file), at: new Date().toISOString() };
    const target = recordPath(file, writer, env);
    mkdirSync(join(target, '..'), { recursive: true });
    // Atomic: a reader never sees half a record.
    const tmp = `${target}.${process.pid}.tmp`;
    writeFileSync(tmp, `${JSON.stringify(entry, null, 2)}\n`);
    renameSync(tmp, target);
    return entry;
  } catch { return null; }
}

export function readRecord(file, writer, env = process.env) {
  try { return JSON.parse(readFileSync(recordPath(file, writer, env), 'utf8')); } catch { return null; }
}

/** Every OTHER writer's record of this path -- who clobbered it, for the error. */
export function otherRecords(file, writer, env = process.env) {
  const dir = join(recordRoot(env), pathKey(file));
  let names = [];
  try { names = readdirSync(dir).filter((n) => n.endsWith('.json') && n !== `${writer}.json`); } catch { return []; }
  const out = [];
  for (const n of names) {
    try { out.push(JSON.parse(readFileSync(join(dir, n), 'utf8'))); } catch { /* a half-written record is not evidence */ }
  }
  return out.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

/**
 * The verdict for one path, with no I/O beyond reading the record and the file.
 *
 * @returns {{status: 'unrecorded'|'unchanged'|'changed'|'missing', mine?: object, now?: string|null, culprit?: object}}
 */
export function verifyBodyFile(file, writer, env = process.env) {
  const mine = readRecord(file, writer, env);
  if (!mine) return { status: 'unrecorded' };
  const now = hashFile(file);
  if (now === null) return { status: 'missing', mine };
  if (now === mine.hash) return { status: 'unchanged', mine };
  const culprit = otherRecords(file, writer, env).find((r) => r.hash === now);
  return { status: 'changed', mine, now, culprit };
}

/** Drop records older than a week. Best-effort, never throws. */
export function pruneRecords(env = process.env, now = Date.now()) {
  const root = recordRoot(env);
  let dirs = [];
  try { dirs = readdirSync(root); } catch { return 0; }
  let removed = 0;
  for (const d of dirs) {
    const full = join(root, d);
    try {
      if (now - statSync(full).mtimeMs > KEEP_MS) { rmSync(full, { recursive: true, force: true }); removed++; }
    } catch { /* a locked directory is not a failure */ }
  }
  return removed;
}
