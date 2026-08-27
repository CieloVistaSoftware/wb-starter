/**
 * Which declared attributes does the behavior read off a CHILD, not the host?
 *
 * #861 named the cause: scripts/generate-behavior-schemas.mjs scrapes every
 * getAttribute(...) in a function body WITHOUT checking the receiver, so an
 * attribute the behavior reads off a child, a sibling or a node it built lands
 * in the schema as if it were an option on the host.
 *
 * That is not cosmetic. Every generated test then sets it on the host, where it
 * can do nothing, and reports the behavior as broken -- which is exactly what
 * my pairwise run did to x-accordion.
 *
 * This finds them by the receiver, not by guessing from the name.
 */
import fs from 'node:fs';
import path from 'node:path';
import { stripJsComments } from './lib/js-scanner.mjs';

const MODELS = 'src/wb-models';
const VM = 'src/wb-viewmodels';
const IDX = path.join(VM, 'index.js');

// Receivers that are plainly NOT the host element.
const CHILD_RECEIVER = /\b(child|children|sec|section|item|row|panel|node|el|kid|entry|opt|option|tab|header|trigger)\w*/i;

function moduleMap() {
  const src = fs.readFileSync(IDX, 'utf8');
  const block = /const behaviorModules = \{([\s\S]*?)\n\};/.exec(src)[1].replace(/\/\/.*$/gm, '');
  return new Map(
    [...block.matchAll(/(['"]?[A-Za-z0-9_-]+['"]?)\s*:\s*'([^']+)'/g)]
      .map((m) => [m[1].replace(/['"]/g, ''), m[2]]),
  );
}

const MODULES = moduleMap();
const codeCache = new Map();
function codeFor(mod) {
  if (!codeCache.has(mod)) {
    const f = path.join(VM, `${mod}.js`);
    codeCache.set(mod, fs.existsSync(f) ? stripJsComments(fs.readFileSync(f, 'utf8')) : '');
  }
  return codeCache.get(mod);
}

/** Every `<receiver>.getAttribute('name')` / hasAttribute, with its receiver. */
function reads(code) {
  const out = [];
  const re = /([A-Za-z_$][\w$.]*)\s*\.\s*(?:get|has)Attribute\(\s*['"`]([^'"`]+)['"`]/g;
  let m;
  while ((m = re.exec(code))) out.push({ receiver: m[1], attr: m[2] });
  return out;
}

const findings = [];
for (const file of fs.readdirSync(MODELS).filter((f) => f.endsWith('.schema.json'))) {
  let s;
  try { s = JSON.parse(fs.readFileSync(path.join(MODELS, file), 'utf8')); } catch { continue; }
  if (s?.schemaType === 'definition' || s?.schemaType === 'page' || s?.isBase) continue;

  const name = String(s.schemaFor || file.replace('.schema.json', '')).replace(/^x-/, '');
  const mod = MODULES.get(name);
  if (!mod) continue;
  const code = codeFor(mod);
  if (!code) continue;

  const all = reads(code);
  const props = Object.keys(s.properties || {}).filter((k) => !/^[$_]/.test(k) && !/^x-/.test(k));

  for (const prop of props) {
    const hits = all.filter((r) => r.attr === prop);
    if (!hits.length) continue;
    // Read ONLY off non-host receivers -> it is a child attribute.
    const hostRead = hits.some((r) => /^(element|host|el)$/i.test(r.receiver) || /^this\b/.test(r.receiver));
    const childRead = hits.some((r) => CHILD_RECEIVER.test(r.receiver) && !/^(element|host)$/i.test(r.receiver));
    if (!hostRead && childRead) {
      findings.push({ behavior: name, prop, receivers: [...new Set(hits.map((h) => h.receiver))] });
    }
  }
}

console.log('DECLARED ON THE HOST, READ OFF A CHILD: ' + findings.length);
for (const f of findings) {
  console.log(`  x-${f.behavior.padEnd(16)} ${f.prop.padEnd(24)} read via: ${f.receivers.join(', ')}`);
}
fs.writeFileSync('data/child-scoped-attrs.json', JSON.stringify(findings, null, 2));
console.log('\n-> data/child-scoped-attrs.json');
