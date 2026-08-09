/**
 * format-md-code-samples.mjs
 *
 * Reformats HTML code samples inside ```html fences in markdown docs to the
 * project standard (docs/code-examples-standard.md):
 *   - the `<!-- comment -->` on its own line
 *   - the opening `<tag` on its own line
 *   - EVERY attribute on its own line, indented 2 spaces
 *   - the closing `>` on the last attribute
 *   - content + closing tag on their own lines
 *
 * Only ```html fences are touched — js/css/json/text fences are left alone.
 *
 * Usage: node scripts/format-md-code-samples.mjs [file ...]   (default: all docs)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import beautify from 'js-beautify';

const htmlBeautify = beautify.html;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fmt(code) {
  const beautified = htmlBeautify(code, {
    indent_size: 2,
    wrap_attributes: 'force-expand-multiline', // every attribute on its own line
    inline: [],                                // treat nothing as inline
    preserve_newlines: false,
    indent_inner_html: true,
    end_with_newline: false,
    eol: '\n',
  });
  return reflow(beautified).replace(/\s+$/, '');
}

// force-expand-multiline emits the tag-closing '>' on its OWN line (aligned with
// '<tag'), sometimes followed by content and/or the closing tag on that same line
// (`></tag>`, `>New</tag>`). The spec wants the '>' on the last attribute line, and
// content + closing tag each on their own line. Reflow the '>' lines accordingly.
function reflow(beautified) {
  const lines = beautified.split('\n');
  const out = [];
  for (const line of lines) {
    const m = line.match(/^(\s*)>(.*)$/);
    if (m && out.length) {
      const indent = m[1];
      const rest = m[2];
      out[out.length - 1] += '>'; // attach '>' to the last attribute line
      const close = rest.match(/^(.*?)(<\/[A-Za-z][\w-]*>)\s*$/);
      if (close) {
        const content = close[1].trim();
        if (content) out.push(indent + '  ' + content); // content on its own indented line
        out.push(indent + close[2]);                    // closing tag on its own line
      } else if (rest.trim()) {
        out.push(indent + '  ' + rest.trim());
      }
      // rest empty → block children already follow on their own lines
      continue;
    }
    out.push(line);
  }
  return out.join('\n');
}

const SKIP = new Set(['node_modules', '.git', 'data', 'test-results', '.playwright-artifacts', 'coverage', 'dist', 'out']);
function walk(dir, out) {
  let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    if (SKIP.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, out);
    else if (e.name.endsWith('.md')) out.push(abs);
  }
}

function targets(args) {
  if (args.length) return args.map((f) => path.resolve(ROOT, f));
  const out = [];
  for (const d of ['docs', 'demos']) walk(path.join(ROOT, d), out);
  for (const f of ['README.md', 'CONTRIBUTING.md']) { const p = path.join(ROOT, f); if (fs.existsSync(p)) out.push(p); }
  return [...new Set(out)];
}

let grand = 0, filesChanged = 0;
for (const file of targets(process.argv.slice(2))) {
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, 'utf8');
  let n = 0;
  const out = src.replace(/(```html[^\n]*\r?\n)([\s\S]*?)(\r?\n```)/g, (m, open, inner, close) => {
    const f = fmt(inner);
    if (f !== inner) n++;
    return open + f + close;
  });
  if (n > 0) { fs.writeFileSync(file, out); filesChanged++; grand += n; console.log(`${path.relative(ROOT, file)}: reformatted ${n} html block(s)`); }
}
console.log(`\nReformatted ${grand} html code block(s) across ${filesChanged} file(s).`);
