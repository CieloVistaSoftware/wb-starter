#!/usr/bin/env node
/**
 * Claude Code PostToolUse hook (Write|Edit|MultiEdit): reject a control byte
 * the moment a file is written. #1162, layer 1 -- John, 2026-10-02: "yes add
 * the write-time hook".
 *
 * Escapes an agent writes (\b, \u001b) can be decoded into the real byte on the
 * way to disk (#888, #1049). The commit hook catches them at commit; this
 * catches them at the write, so the agent fixes the line in the same step.
 *
 * Reads the hook payload on stdin, checks tool_input.file_path with the same
 * rule as every other control-byte check (scripts/lib/control-bytes.mjs), and
 * exits 2 with the offending lines on stderr -- Claude Code shows that to the
 * agent. Exits 0 for a clean file, a binary file, or anything it cannot read:
 * a hook must never get in the way of a write it cannot judge.
 */
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { findControlBytes } from './lib/control-bytes.mjs';

const BINARY = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf', '.zip', '.gz', '.woff', '.woff2', '.ttf', '.otf', '.mp3', '.mp4', '.webm', '.wav', '.ogg', '.vsix']);

let file = '';
try {
  const payload = JSON.parse(readFileSync(0, 'utf8') || '{}');
  file = (payload.tool_input && payload.tool_input.file_path) || (payload.tool_response && payload.tool_response.filePath) || '';
} catch { process.exit(0); }

if (!file || BINARY.has(path.extname(file).toLowerCase())) process.exit(0);

let found;
try {
  if (statSync(file).size > 5 * 1024 * 1024) process.exit(0);
  found = findControlBytes(readFileSync(file));
} catch { process.exit(0); }

if (!found.length) process.exit(0);

const lines = found.slice(0, 10).map((f) => `  ${file}:${f.line}:${f.column}  ${f.name}`);
process.stderr.write(
  `Control byte written to ${file} (#1162):\n${lines.join('\n')}${found.length > 10 ? `\n  ... and ${found.length - 10} more` : ''}\n` +
  'An escape such as \\b or \\u001b was decoded into the real byte. Rewrite those lines: build the character ' +
  'from its code (String.fromCharCode(27)) instead of writing the escape as text.\n',
);
process.exit(2);
