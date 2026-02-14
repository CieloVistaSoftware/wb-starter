import fs from 'fs';
import path from 'path';

const COLOR_EXCEPTION_FILES = ['themes.css', 'wb-signature.css', 'variables.css', 'demo.css', 'components.css', 'site.css', 'transitions.css', 'wb-grayscale.css', 'wb-grayscale-dark.css', 'hero.css', 'navbar.css'];

function isInVarFallback(content, match, matchIndex) {
  const before = content.substring(0, matchIndex);
  const lastSemicolon = before.lastIndexOf(';');
  const lastBrace = before.lastIndexOf('{');
  const propStart = Math.max(lastSemicolon, lastBrace) + 1;
  const currentProp = before.substring(propStart);
  let depth = 0;
  let i = 0;
  while (i < currentProp.length) {
    if (currentProp.substring(i, i + 4) === 'var(') { depth++; i += 4; }
    else if (currentProp[i] === ')') { depth--; i++; }
    else { i++; }
  }
  return depth > 0;
}

function isInShadow(content, matchIndex) {
  const lineStart = content.lastIndexOf('\n', matchIndex) + 1;
  const lineEnd = content.indexOf('\n', matchIndex);
  const line = content.substring(lineStart, lineEnd === -1 ? undefined : lineEnd);
  return /box-shadow|text-shadow|--shadow/i.test(line);
}

function isBlackWhiteTransparency(match, content, matchIndex) {
  if (!match.startsWith('rgba(')) return false;
  const after = content.substring(matchIndex, matchIndex + 50);
  return /rgba\(\s*(0\s*,\s*0\s*,\s*0|255\s*,\s*255\s*,\s*255)/.test(after);
}

function getCssFiles(dir) {
  let results = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const full = path.join(dir, item.name);
      if (item.isDirectory() && !['node_modules','.git','dist','build','coverage','test-results','.playwright-artifacts'].includes(item.name)) {
        results = results.concat(getCssFiles(full));
      } else if (item.name.endsWith('.css')) {
        results.push(full);
      }
    }
  } catch(e) {}
  return results;
}

const ROOT = process.cwd();
const files = getCssFiles(ROOT);

for (const file of files) {
  const filename = path.basename(file);
  if (COLOR_EXCEPTION_FILES.includes(filename)) continue;
  if (filename === 'builder.css' || filename === 'audio.css') continue;
  if (file.includes('tmp') || file.includes('.playwright-artifacts')) continue;

  const content = fs.readFileSync(file, 'utf-8');
  const colorRegex = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/gi;
  let match;
  while ((match = colorRegex.exec(content)) !== null) {
    const idx = match.index;
    const lineStart = content.lastIndexOf('\n', idx) + 1;
    const lineEnd = content.indexOf('\n', idx);
    const line = content.substring(lineStart, lineEnd === -1 ? undefined : lineEnd);
    if (line.trimStart().startsWith('/*') || line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;
    if (isInVarFallback(content, match[0], idx)) continue;
    if (isBlackWhiteTransparency(match[0], content, idx)) continue;
    if (isInShadow(content, idx)) continue;
    const rel = path.relative(ROOT, file);
    console.log(rel + ':L' + content.substring(0, idx).split('\n').length + ': ' + match[0] + ' => ' + line.trim().substring(0, 120));
  }
}
