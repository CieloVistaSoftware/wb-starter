#!/usr/bin/env node
/**
 * document-behavior-classes.mjs — publish the styling contract
 * ============================================================
 * #1096. John: "the user must easily be able to find the class for current
 * element."
 *
 * Adds a `## Classes` table to each behavior doc, listing every class the
 * behavior applies and whether a stylesheet defines it. Read out of the
 * behavior's own source, so it cannot drift from what the code does.
 *
 * The `Styled` column is the point. A class with no rule is either dead weight
 * or — worse, when it is a `--state` modifier — a state the user can never see:
 * `x-card--expanded` looking identical to collapsed. Publishing the gap is how
 * it stops being invisible (#1095).
 *
 *   node scripts/document-behavior-classes.mjs
 *   node scripts/document-behavior-classes.mjs --check
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { classesAddedIn, hasRule, allCss, functionBody } from './lib/behavior-classes.mjs';

const CHECK = process.argv.includes('--check');
const DOCS = 'docs/behaviors';

// behavior name -> module path, from the runtime's own resolver
const index = readFileSync('src/wb-viewmodels/index.js', 'utf8');
const moduleOf = new Map();
for (const m of index.matchAll(/^\s*'?([a-zA-Z][\w-]*)'?\s*:\s*'([\w./-]+)'/gm)) {
  moduleOf.set(m[1].toLowerCase(), m[2]);
}

const css = allCss(readdirSync);

/**
 * Source for ONE behavior, scoped to its own exported function.
 *
 * Behaviors share modules -- card.js implements 19 of them -- so a whole-file
 * scan attributes every card class to every card behavior. The first draft did
 * exactly that and also failed to resolve 73 behaviors at all, because it only
 * looked where index.js pointed. Searching every module for the exported
 * function fixes both: the right file, and only that behavior's body.
 */
const ALL_MODULES = [];
(function collect(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = dir + '/' + e.name;
    if (e.isDirectory()) collect(p);
    else if (e.name.endsWith('.js')) ALL_MODULES.push(p);
  }
})('src/wb-viewmodels');

function sourceFor(name) {
  const mod = moduleOf.get(name.toLowerCase());
  const preferred = [
    mod && `src/wb-viewmodels/${mod}.js`,
    `src/wb-viewmodels/${name}.js`,
    `src/wb-viewmodels/semantics/${name}.js`,
  ].filter(Boolean).filter((p) => existsSync(p));

  for (const p of [...preferred, ...ALL_MODULES]) {
    const body = functionBody(readFileSync(p, 'utf8'), name);
    if (body) return body;
  }
  return null;
}

let changed = 0;
const noSource = [];

for (const file of readdirSync(DOCS).filter((f) => f.endsWith('.md'))) {
  const name = file.replace(/\.md$/, '');
  const path = `${DOCS}/${file}`;
  const doc = readFileSync(path, 'utf8');
  if (/^##\s+Classes\s*$/m.test(doc)) continue;         // already documented

  const src = sourceFor(name);
  if (!src) { noSource.push(name); continue; }

  const { literal, pattern } = classesAddedIn(src);
  const all = [...literal, ...pattern];
  if (!all.length) continue;                             // adds none: nothing to say

  const rows = all.map((cls) => {
    const styled = hasRule(css, cls);
    const kind = cls.includes('--') ? 'modifier' : cls.includes('__') ? 'part' : 'base';
    return `| \`${cls}\` | ${kind} | ${styled ? 'yes' : '**no rule**'} |`;
  });

  const section = [
    '',
    '## Classes',
    '',
    `Applied by \`${name}\` — target these to style it. Read from the behavior's own`,
    'source, so this list is what the code actually does.',
    '',
    '| Class | Kind | Styled |',
    '|---|---|---|',
    ...rows,
    '',
    'A `{name}` in a class is filled at runtime from the attribute of that name.',
    '',
    ...(rows.some((r) => r.includes('**no rule**'))
      ? ['> A class marked **no rule** is applied but nothing styles it. For a `--modifier` '
         + 'that means the state is invisible to the reader (#1095).', '']
      : []),
  ].join('\n');

  // Before Attributes if present, else at the end — the reader wants the
  // styling hooks near the authoring form, not buried under events.
  const attrs = doc.match(/^##\s+Attributes.*$/m);
  const next = attrs
    ? doc.slice(0, attrs.index) + section.replace(/^\n/, '') + '\n' + doc.slice(attrs.index)
    : doc.replace(/\s*$/, '\n') + section;

  if (!CHECK) writeFileSync(path, next);
  console.log(`${CHECK ? 'would add' : 'added'} ${path}: ${all.length} class(es), `
    + `${all.filter((c) => !hasRule(css, c)).length} unstyled`);
  changed += 1;
}

console.log(`\n${CHECK ? 'would change' : 'changed'}: ${changed} doc(s)`);
if (noSource.length) console.log(`no module resolved for ${noSource.length}: ${noSource.slice(0, 12).join(', ')}`);
