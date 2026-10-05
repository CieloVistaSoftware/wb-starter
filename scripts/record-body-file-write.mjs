#!/usr/bin/env node
/**
 * Claude Code PostToolUse hook (Write|Edit|MultiEdit): remember what this
 * writer just put in this file. Half of the #1336 guard; the other half is
 * scripts/check-body-file-handoff.mjs, which refuses a handoff when the bytes
 * no longer match this record.
 *
 * Observe only. It never fails a write, never prints on the happy path, and
 * exits 0 for anything it cannot read. The record is what makes the later
 * refusal possible; it is not itself a check.
 */
import { readFileSync } from 'node:fs';
import { recordWrite, writerKey, resolveFrom, pruneRecords } from './lib/body-file.mjs';

let payload = {};
try { payload = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { process.exit(0); }

const input = payload.tool_input || {};
const raw = input.file_path || (payload.tool_response && payload.tool_response.filePath) || '';
if (!raw) process.exit(0);

const cwd = payload.cwd || process.cwd();
recordWrite(resolveFrom(cwd, raw), writerKey({ sessionId: payload.session_id, cwd }));

// One sweep per write costs a readdir; without it the directory grows forever.
pruneRecords();
process.exit(0);
