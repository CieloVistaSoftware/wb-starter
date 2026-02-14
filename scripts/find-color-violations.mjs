import fs from 'fs';
import path from 'path';

const COLOR_EXCEPTION_FILES = ['themes.css', 'wb-signature.css', 'variables.css', 'demo.css', 'components.css', 'site.css', 'transitions.css', 'wb-grayscale.css', 'wb-grayscale-dark.css', 'hero.css', 'navbar.css', 'builder.css', 'audio.css'];

function getCssFiles(dir) {
  let results = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const full = path.join(dir, item.name);
      if (item.isDirectory() && !['node_modules','.git','dist','build','coverage','test-results','.playwright-artifacts','tmp'].includes(item.name)) {
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
const violations = [];

for (const file of files) {
  const filename = path.basename(file);
  if (COLOR_EXCEPTION_FILES.includes(filename)) continue;
  if (file.includes('tmp') || file.includes('.playwright-artifacts')) continue;
  const content = fs.readFileSync(file, 'utf-8');
  const colorRegex = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/gi;
  let match;
  const colors = [];
  while ((match = colorRegex.exec(content)) !== null) {
    const idx = match.index;
    const lineStart = content.lastIndexOf('\n', idx) + 1;
    const lineEnd = content.indexOf('\n', idx);
    const line = content.substring(lineStart, lineEnd === -1 ? undefined : lineEnd);
    if (line.trimStart().startsWith('/*') || line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;
    // Check var() fallback
    const before = content.substring(Math.max(0, idx - 50), idx);
    if (before.includes('var(') && !before.includes(')')) continue;
    // Check black/white/transparent
    const matchStr = match[0].toLowerCase();
    if (matchStr === '#fff' || matchStr === '#ffffff' || matchStr === '#000' || matchStr === '#000000') continue;
    if (matchStr === 'rgba(' || matchStr === 'rgb(') {
      const afterMatch = content.substring(idx, idx + 40);
      if (afterMatch.match(/rgba?\(\s*0\s*,\s*0\s*,\s*0/) || afterMatch.match(/rgba?\(\s*255\s*,\s*255\s*,\s*255/)) continue;
    }
    // Check shadow context
    const lineStr = line.trim();
    if (lineStr.includes('box-shadow') || lineStr.includes('text-shadow') || lineStr.includes('filter')) continue;
    
    colors.push({ color: match[0], line: lineStr.substring(0, 80) });
  }
  if (colors.length > 0) {
    violations.push({ file: path.relative(ROOT, file), count: colors.length, samples: colors.slice(0, 3) });
  }
}

fs.writeFileSync('data/css-color-violations.json', JSON.stringify(violations, null, 2));
console.log(JSON.stringify(violations, null, 2));
