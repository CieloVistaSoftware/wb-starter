import fs from 'node:fs';
import path from 'node:path';

/**
 * The set of class names some stylesheet rule styles -- what "this class has
 * a rule" means for the gates that ask it (#1429 appliesClass, #1095 classes
 * a behavior adds).
 *
 * Read from every .css file under src/styles (comments stripped), plus the
 * CSS some behaviors inject themselves (button.js BUTTON_CSS, ...): an
 * injected stylesheet styles a class as surely as a file does. Inside behavior
 * JS a class counts only in rule position -- followed on the same line by `{`
 * with no quote or `;` between -- so a querySelector('.x-foo') string is not
 * mistaken for styling. Lookahead, not a consuming match: `.x-a--top,
 * .x-a--bottom {` styles both, and a selector list may break across lines
 * before its `{` (tooltip.js). Newlines are safe to cross: a JS identifier
 * cannot contain `-`, so `.x-…` outside quotes only occurs in CSS text.
 *
 * `excludeSheets` drops stylesheets by file name. A sheet nothing loads
 * (enhancements.css, see no-behavior-stylesheet-is-unreachable.spec.ts) styles
 * nothing at runtime, so a gate about what the reader SEES leaves it out.
 */
function walk(dir: string, ext: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, ext, out); else if (e.name.endsWith(ext)) out.push(p);
  }
  return out;
}

export function behaviorSourceFiles(root: string = process.cwd()): string[] {
  return walk(path.join(root, 'src', 'wb-viewmodels'), '.js');
}

export function styledClasses(root: string = process.cwd(), excludeSheets: string[] = []): Set<string> {
  const css = walk(path.join(root, 'src', 'styles'), '.css')
    .filter((f) => !excludeSheets.includes(path.basename(f)))
    .map((f) => fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''))
    .join('\n');
  const styled = new Set([...css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));
  for (const file of behaviorSourceFiles(root)) {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(/\.(x-[\w-]+)(?=[^{};'"]*\{)/g)) styled.add(m[1]);
  }
  return styled;
}
