import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Docs must not teach LEGACY COMPONENT INHERITANCE.
 *
 * wb-starter components are composition + schema driven (Light DOM, x-* behaviors,
 * wb-* tags). There is no component base class that variants subclass. Yet some
 * docs still describe a class hierarchy — "all card variants inherit from
 * cardBase", `class WbCardImage extends cardBase`, "is-a relationship", "Why
 * Inheritance Matters". That's the old model; flag it so it can't creep back.
 *
 * This targets COMPONENT-to-COMPONENT inheritance only. It deliberately does NOT
 * flag:
 *   - `extends HTMLElement` / `extends HTML*Element` — every custom element does that
 *   - schema inheritance (`_inheritance.schema.json`, "schema inheritance chain")
 *   - statements that behaviors do NOT use inheritance (that's the correct model)
 */
const ROOT = process.cwd();
const SKIP = new Set(['node_modules', '.git', 'data', 'test-results', '.playwright-artifacts', 'coverage', 'dist', 'out', '_today']);

function walk(dir: string, out: string[]): void {
  let ents: fs.Dirent[];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    if (SKIP.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, out);
    else if (e.name.endsWith('.md')) out.push(path.relative(ROOT, abs).replace(/\\/g, '/'));
  }
}

function mdFiles(): string[] {
  const out: string[] = [];
  walk(path.join(ROOT, 'docs'), out);
  for (const f of ['README.md', 'CLAUDE.md', 'CONTRIBUTING.md']) {
    if (fs.existsSync(path.join(ROOT, f))) out.push(f);
  }
  return [...new Set(out)];
}

// Each pattern is a distinct "legacy component inheritance" tell.
const LEGACY_PATTERNS: { re: RegExp; why: string }[] = [
  { re: /class\s+\w+\s+extends\s+(?!HTMLElement\b|HTML[A-Z]\w*Element\b|LitElement\b)\w*(?:Base|Card|Component)\b/,
    why: 'component subclasses another component/base class (use composition, not a class hierarchy)' },
  { re: /\bextends\s+cardBase\b/i, why: 'extends cardBase (there is no cardBase to subclass)' },
  { re: /\b(?:card\s+)?variants?\s+inherit\s+from/i, why: '"variants inherit from …" — components compose, they do not inherit' },
  { re: /\binherit(?:s|ing)?\s+(?:all\s+)?(?:core\s+)?(?:card\s+)?logic\b/i, why: '"inherit core logic" — describes a class hierarchy' },
  { re: /\bis-a\s+relationship\b/i, why: '"is-a relationship" — inheritance framing' },
  { re: /\bWhy\s+Inheritance\s+Matters\b/i, why: 'section promotes component inheritance' },
  { re: /\binherit(?:s|ing)?\s+from\s+[`'"]?cardBase\b/i, why: 'inherits from cardBase' },
];

test.describe('docs must not teach legacy component inheritance', () => {
  test('no .md doc describes a component inheritance hierarchy', () => {
    // Schema inheritance ($inherits / *.schema.json / the "lowest schema wins"
    // hierarchy) is a legitimate, unrelated concept — never a component-class tell.
    const SCHEMA_LINE = /\$inherits|schema\.json|\.schema\b|schema\s+inheritance/i;
    // The standards docs DEFINE the anti-pattern — they legitimately quote the
    // forbidden phrases ("Why Inheritance Matters", "is-a", …) in order to forbid
    // them. Don't flag the rule-defining docs against their own rule.
    const RULE_DEFINING = /standards\/(DEMOS-AND-DOCS-STANDARDS|V3-STANDARDS)\.md$/;
    const offenders: string[] = [];
    for (const rel of mdFiles()) {
      if (RULE_DEFINING.test(rel.replace(/\\/g, '/'))) continue;
      const lines = fs.readFileSync(path.join(ROOT, rel), 'utf8').split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        if (SCHEMA_LINE.test(lines[i])) continue;
        for (const { re, why } of LEGACY_PATTERNS) {
          if (re.test(lines[i])) {
            offenders.push(`${rel}:${i + 1} — ${why}\n      > ${lines[i].trim().slice(0, 100)}`);
            break; // one hit per line is enough
          }
        }
      }
    }
    expect(
      offenders,
      `these docs teach legacy component inheritance (use composition instead):\n  ${offenders.join('\n  ')}`,
    ).toEqual([]);
  });
});
