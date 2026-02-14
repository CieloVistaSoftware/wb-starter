import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const EXCEPTION = ['themes.css','wb-signature.css','variables.css','demo.css','components.css','site.css','transitions.css','wb-grayscale.css','wb-grayscale-dark.css','hero.css','navbar.css','builder.css','audio.css'];
const EXCLUDE = ['node_modules','.git','dist','build','coverage','test-results','.playwright-artifacts'];

function getCssFiles(dir, results = []) {
  try {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      if (EXCLUDE.includes(f.name) || f.name.startsWith('.')) continue;
      const full = path.join(dir, f.name);
      if (f.isDirectory()) getCssFiles(full, results);
      else if (f.name.endsWith('.css')) results.push(full);
    }
  } catch (e) {}
  return results;
}

function isInVarFallback(content, match, idx) {
  const before = content.substring(Math.max(0, idx - 50), idx);
  return before.includes('var(') && !before.substring(before.lastIndexOf('var(')).includes(')');
}

function isBlackWhiteTransparency(match, content, idx) {
  const lower = match.toLowerCase();
  if (['#000','#fff','#000000','#ffffff','#0000','#00000000'].includes(lower)) return true;
  const chunk = content.substring(idx, idx + 60);
  if (lower.startsWith('rgba(') && /,\s*0\s*\)/.test(chunk)) return true;
  if (lower.startsWith('hsla(') && /,\s*0\s*\)/.test(chunk)) return true;
  return false;
}

function isInShadow(content, idx) {
  const lineStart = content.lastIndexOf('\n', idx) + 1;
  const lineEnd = content.indexOf('\n', idx);
  const line = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);
  return /box-shadow|text-shadow|drop-shadow|filter/.test(line);
}

const cssFiles = getCssFiles(ROOT);
console.log('Total CSS files scanned:', cssFiles.length);

const violations = [];
for (const file of cssFiles) {
  const filename = path.basename(file);
  if (EXCEPTION.includes(filename)) continue;
  if (file.includes('tmp') || file.includes('.playwright-artifacts')) continue;

  const content = fs.readFileSync(file, 'utf8');
  const colorRegex = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/gi;
  const hardcoded = [];
  let m;

  while ((m = colorRegex.exec(content)) !== null) {
    const ms = m[0], mi = m.index;
    if (isInVarFallback(content, ms, mi)) continue;
    if (isBlackWhiteTransparency(ms, content, mi)) continue;
    if (isInShadow(content, mi)) continue;

    const ls = content.lastIndexOf('\n', mi) + 1;
    const le = content.indexOf('\n', mi);
    const line = content.substring(ls, le === -1 ? content.length : le);
    if (line.trimStart().startsWith('/*') || line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;

    const lineNum = content.substring(0, mi).split('\n').length;
    hardcoded.push({ color: ms, line: line.trim().substring(0, 120), lineNum });
  }

  if (hardcoded.length > 0) {
    violations.push({ file: path.relative(ROOT, file).replace(/\\/g, '/'), count: hardcoded.length, samples: hardcoded });
  }
}

console.log(JSON.stringify(violations, null, 2));
console.log('Total violating files:', violations.length, 'Total colors:', violations.reduce((s, v) => s + v.count, 0));
