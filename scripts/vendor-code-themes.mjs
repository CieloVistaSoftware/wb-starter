/**
 * vendor-code-themes.mjs — copy the highlight.js themes the code-theme picker
 * offers into src/styles/code-themes/hljs/, from the installed highlight.js.
 *
 * Why: every theme used to load from cdnjs at runtime, pinned to 11.9.0 while
 * the vendored highlighter (src/lib/highlight.js) is 11.11.1. Code blocks lost
 * their colours whenever cdnjs was unreachable, and the "dracula" entry never
 * existed there at all (it is base16/dracula), so choosing it always 404'd.
 *
 * Run after upgrading highlight.js:  node scripts/vendor-code-themes.mjs
 * tests/compliance/no-runtime-cdn.spec.ts fails if a theme in
 * CODE_THEMES has no vendored file.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CODE_THEMES, HLJS_THEME_SOURCE } from '../src/wb-viewmodels/codecontrol.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STYLES = join(ROOT, 'node_modules/highlight.js/styles');
const OUT = join(ROOT, 'src/styles/code-themes/hljs');

const version = JSON.parse(readFileSync(join(ROOT, 'node_modules/highlight.js/package.json'), 'utf8')).version;
mkdirSync(OUT, { recursive: true });

let copied = 0;
const missing = [];
for (const theme of CODE_THEMES) {
  if (theme.path) continue; // WB's own theme, already local
  const source = join(STYLES, `${HLJS_THEME_SOURCE[theme.id] || theme.id}.min.css`);
  if (!existsSync(source)) {
    missing.push(`${theme.id} (looked for ${source})`);
    continue;
  }
  copyFileSync(source, join(OUT, `${theme.id}.min.css`));
  copied++;
}

// The .min.css files carry no licence header; ship highlight.js's BSD-3 licence beside them.
copyFileSync(join(ROOT, 'node_modules/highlight.js/LICENSE'), join(OUT, 'LICENSE'));

console.log(`Vendored ${copied} highlight.js ${version} themes into src/styles/code-themes/hljs/`);
if (missing.length) {
  console.error(`No highlight.js ${version} stylesheet for:\n  ${missing.join('\n  ')}`);
  process.exit(1);
}
