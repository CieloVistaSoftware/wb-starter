import fs from 'fs';
import path from 'path';

const TEST_DIR = path.resolve('tests/issues');
const issuesPath = path.resolve('data/issues.json');
const files = fs.readdirSync(TEST_DIR).filter(f => f.endsWith('.spec.ts'));

const issues = JSON.parse(fs.readFileSync(issuesPath, 'utf8'));

// Build map of note id -> page path (search 'Page: ' in note.content)
const notePageMap = {};

for (const note of issues.notes || []) {
  const id = note.id;
  const match = (note.content || '').match(/Page:\s*(\S+)/);
  if (match) notePageMap[id] = match[1];
}

let patched = [];
for (const file of files) {
  const filePath = path.join(TEST_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('auto-heuristic: issue-click') && !content.includes('auto-heuristic: nav-scroll')) continue;

  // Extract note id from filename
  const m = file.match(/^issue-note-([^\.]+)\.spec\.ts/);
  if (!m) continue;
  const noteIdRaw = m[1];
  // Note ids in data might be with -p0 or without; try exact match or with -p0
  let candidate = noteIdRaw;
  if (!notePageMap[candidate]) {
    // try append -p0
    if (notePageMap[`${candidate}-p0`]) candidate = `${candidate}-p0`;
  }

  const pagePath = notePageMap[candidate];
  if (pagePath && !content.includes(`http://localhost:3000${pagePath}`)) {
    // insert navigation after annotations push
    const insert = `await page.goto('http://localhost:3000${pagePath}');\n    await page.waitForLoadState('networkidle');`;
    content = content.replace(/(test.info\(\)\.annotations\.push\([\s\S]*?\);)/, `$1\n    ${insert}`);
    fs.writeFileSync(filePath, content, 'utf8');
    patched.push(file);
  }
}

console.log('Patched', patched.length, 'files');
if (patched.length) console.log(patched.join('\n'));
