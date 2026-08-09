import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// For every src/wb-models/*.schema.json, checks whether the matching
// behavior function (schemaFor) in src/wb-viewmodels/**/*.js actually reads
// each declared `properties` key anywhere in its body (as a quoted string
// literal or dot-access, e.g. getAttribute('shape') / options.shape). A
// property that's declared but never referenced always renders as a no-op --
// confirmed 3x live already (avatar `shape`, chip `label`/`icon`): the
// schema's `appliesClass`/`$view` metadata is documentation only, nothing
// in src/core auto-applies it (grep confirms zero references to
// `appliesClass` outside the schema files themselves).

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SCHEMA_DIR = path.join(ROOT, 'src', 'wb-models');
const VIEWMODEL_DIR = path.join(ROOT, 'src', 'wb-viewmodels');

// Property names that are structural/universal and legitimately not read as
// plain getAttribute/options lookups inside the behavior body (handled by
// core wiring, CSS custom properties, or ARIA only) -- skip these to keep
// the report signal-heavy.
const SKIP_PROPS = new Set(['id', 'class', 'style']);

function walk(dir, exts, out) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, exts, out);
    else if (exts.includes(path.extname(entry.name))) out.push(full);
  }
  return out;
}

const schemaFiles = walk(SCHEMA_DIR, ['.json'], []).filter(f => f.endsWith('.schema.json'));
const viewmodelFiles = walk(VIEWMODEL_DIR, ['.js'], []);

// Concatenate all viewmodel source once; extract each exported function's
// body by brace-counting from its signature.
const sources = viewmodelFiles.map(f => ({ file: f, text: fs.readFileSync(f, 'utf8') }));

function findFunctionBody(behaviorName) {
  const sigRe = new RegExp(`export\\s+function\\s+${behaviorName}\\s*\\(`);
  for (const { file, text } of sources) {
    const m = sigRe.exec(text);
    if (!m) continue;

    // Skip past the parameter list first -- it may itself contain braces
    // (e.g. `options = {}`), which a naive "first {" search would mistake
    // for the function body's opening brace.
    const parenStart = text.indexOf('(', m.index);
    let parenDepth = 0;
    let parenEnd = -1;
    for (let i = parenStart; i < text.length; i++) {
      if (text[i] === '(') parenDepth++;
      else if (text[i] === ')') {
        parenDepth--;
        if (parenDepth === 0) { parenEnd = i; break; }
      }
    }
    if (parenEnd === -1) continue;

    const openBrace = text.indexOf('{', parenEnd);
    if (openBrace === -1) continue;
    let depth = 0;
    for (let i = openBrace; i < text.length; i++) {
      if (text[i] === '{') depth++;
      else if (text[i] === '}') {
        depth--;
        if (depth === 0) {
          return { file, body: text.slice(openBrace, i + 1) };
        }
      }
    }
  }
  return null;
}

const results = [];

for (const schemaFile of schemaFiles) {
  let schema;
  try {
    schema = JSON.parse(fs.readFileSync(schemaFile, 'utf8'));
  } catch {
    continue;
  }
  const behaviorName = schema.schemaFor;
  const props = Object.keys(schema.properties || {}).filter(p => !SKIP_PROPS.has(p));
  if (!behaviorName || props.length === 0) continue;

  const found = findFunctionBody(behaviorName);
  if (!found) {
    results.push({ schema: schemaFile, behaviorName, status: 'NO_BEHAVIOR_FN', unused: props });
    continue;
  }

  const unused = props.filter(prop => {
    const dotRe = new RegExp(`\\.${prop}\\b`);
    const quoteRe = new RegExp(`['"\`]${prop}['"\`]`);
    return !dotRe.test(found.body) && !quoteRe.test(found.body);
  });

  if (unused.length > 0) {
    results.push({ schema: schemaFile, behaviorName, status: 'PARTIAL', unused, file: found.file });
  }
}

console.log(`Schema attribute usage audit — ${schemaFiles.length} schemas checked`);
console.log('='.repeat(70));

results.sort((a, b) => b.unused.length - a.unused.length);
for (const r of results) {
  const rel = path.relative(ROOT, r.schema);
  console.log(`${rel} — behavior: ${r.behaviorName} [${r.status}]`);
  console.log(`  unused properties: ${r.unused.join(', ')}`);
  if (r.file) console.log(`  behavior fn: ${path.relative(ROOT, r.file)}`);
}

console.log('='.repeat(70));
console.log(`Total: ${results.length} schema(s) with unused/unimplemented properties`);
