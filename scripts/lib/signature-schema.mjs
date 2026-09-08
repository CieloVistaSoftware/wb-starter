/**
 * The signature schema, read from the ONE place it is defined.
 * ============================================================
 * John: "The signature structure must be 1 time 1 place in a .md doc."
 *
 * It was in three: the field table in docs/standards/ISSUE-SIGNATURE-BLOCK.md,
 * a hardcoded REQUIRED_AT_FILING array in check-issue-signatures.mjs, and a
 * hardcoded KINDS set beside it. Three copies of one rule, and the doc — the
 * copy a person actually reads — had no authority over either of the others.
 *
 * So the tables in that document ARE the schema. This module parses them; it
 * defines nothing. Adding a row to the doc adds the rule everywhere, and there
 * is no list in a .mjs that can quietly disagree with what the standard says.
 *
 * The same argument the standard makes about `status` not being a field: a
 * second copy is a second thing that can be wrong.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
export const STANDARD = resolve(HERE, '../../docs/standards/ISSUE-SIGNATURE-BLOCK.md');

/** Rows of the first markdown table appearing after `heading`. */
function tableAfter(md, heading) {
  const at = md.indexOf(heading);
  if (at < 0) throw new Error(`signature schema: "${heading}" is missing from ${STANDARD}`);
  const lines = md.slice(at + heading.length).split('\n');
  const rows = [];
  let started = false;
  for (const line of lines) {
    const t = line.trim();
    if (!t.startsWith('|')) { if (started) break; continue; }
    if (/^\|[\s:|-]+\|$/.test(t)) { started = true; continue; } // the ---|--- rule
    if (!started) continue;                                     // the header row
    rows.push(t.split('|').slice(1, -1).map((c) => c.trim()));
  }
  if (!rows.length) throw new Error(`signature schema: no table rows under "${heading}"`);
  return rows;
}

const bare = (cell) => cell.replace(/`/g, '').trim();

function load() {
  // The repo checks out CRLF on Windows, so every heading match has to be done
  // against normalised text or the schema "goes missing" on one platform only.
  const md = readFileSync(STANDARD, 'utf8').split('\r\n').join('\n');

  const fieldRows = tableAfter(md, '\n## Fields\n');
  const kindRows = tableAfter(md, '\n### `kind`\n');
  const bannedRows = tableAfter(md, '\n### Never a field\n');

  const requiredAtFiling = [];
  const requiredOnClose = [];
  /** field -> the field whose presence makes it required (`evidence` <- `detect`) */
  const requiredWith = {};
  const known = [];

  for (const [nameCell, whenCell] of fieldRows) {
    const name = bare(nameCell);
    const when = whenCell.toLowerCase();
    known.push(name);
    if (when === 'yes') requiredAtFiling.push(name);
    else if (when.includes('on close')) requiredOnClose.push(name);
    else {
      // "whenever `detect` is present" -- the trigger is the field it names.
      const trigger = whenCell.match(/`([a-z][\w-]*)`/);
      if (trigger && when.includes('present')) requiredWith[name] = trigger[1];
    }
  }

  return {
    fields: known,
    requiredAtFiling,
    requiredOnClose,
    requiredWith,
    kinds: new Set(kindRows.map(([k]) => bare(k))),
    banned: bannedRows.map(([k]) => bare(k)),
    reasonFor: Object.fromEntries(bannedRows.map(([k, why]) => [bare(k), why])),
  };
}

export const SCHEMA = load();

/**
 * Read a Signature block out of an issue body.
 *
 * Here for the same reason the schema is: there were three of these, and they
 * did not agree. This one and check-issue-signatures.mjs's parsed the fenced
 * yaml; issue-state.mjs matches `name:` anywhere in the body with a line regex,
 * so it reads a field out of ordinary prose that happens to look like one. That
 * divergence is tracked separately -- it has tests over it and is not something
 * to change quietly.
 *
 * Returns null when there is no block, else { fields, block, full } where
 * `block` is the yaml text and `full` is the whole `## Signature` section, so a
 * caller can rewrite in place.
 */
export function parseSignature(body) {
  const m = (body || '').match(/##\s*Signature\s*\n+```ya?ml\n([\s\S]*?)```/i);
  if (!m) return null;
  const fields = {};
  let key = null;
  for (const raw of m[1].split('\n')) {
    // A block scalar (`detect: |`) owns every indented line under it.
    if (key && /^\s+\S/.test(raw)) {
      fields[key] = (fields[key] ? fields[key] + '\n' : '') + raw.trim();
      continue;
    }
    const f = raw.match(/^([a-z][\w-]*)\s*:\s*(.*)$/i);
    if (!f) continue;
    if (f[2].trim() === '|' || f[2].trim() === '>') { key = f[1]; fields[key] = ''; }
    else { key = null; fields[f[1]] = f[2].trim().replace(/^["']|["']$/g, ''); }
  }
  return { fields, block: m[1], full: m[0] };
}
