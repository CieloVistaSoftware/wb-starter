const fs = require('fs');
const path = require('path');

const ROOT = '.';
const PATHS = {
  src: path.join(ROOT, 'src'),
  pages: path.join(ROOT, 'pages'),
  public: ROOT,
  demos: path.join(ROOT, 'demos')
};

function getFiles(dir, extensions) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && !['node_modules','.git','dist','coverage','.playwright-artifacts','test-results'].includes(e.name)) {
      results.push(...getFiles(full, extensions));
    } else if (extensions.includes(path.extname(e.name).toLowerCase())) {
      results.push(full);
    }
  }
  return results;
}

// Check broken JS imports
const jsFiles = getFiles(PATHS.src, ['.js']);
const jsIssues = [];
const ignoredImports = ['../src/core/wb-lazy.js'];

for (const file of jsFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const dir = path.dirname(file);
  const importRegex = /(?:import|export)\s+(?:[\s\S]*?from\s+)?['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (ignoredImports.includes(importPath)) continue;
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) continue;
    let targetPath = importPath.startsWith('/') ? path.join(ROOT, importPath) : path.join(dir, importPath);
    const exists = fs.existsSync(targetPath) || fs.existsSync(targetPath + '.js') || fs.existsSync(path.join(targetPath, 'index.js'));
    if (!exists) {
      jsIssues.push({file, import: importPath, target: targetPath});
    }
  }
}

// Check broken HTML links
const htmlFiles = [...getFiles(PATHS.pages, ['.html']), ...getFiles(PATHS.public, ['.html']), ...getFiles(PATHS.demos, ['.html'])];
const htmlIssues = [];

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const linkRegex = /(?:src|href)=['"]([^'"]+)['"]/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const linkPath = match[1];
    if (linkPath.startsWith('http') || linkPath.startsWith('#') || linkPath.startsWith('data:') || 
        linkPath.startsWith('mailto:') || linkPath.startsWith('javascript:') || 
        linkPath.includes('${') || linkPath.includes('{{') || linkPath.includes('&lt;')) continue;
    let targetPath = linkPath.startsWith('/') ? path.join(ROOT, linkPath) : path.join(path.dirname(file), linkPath);
    targetPath = targetPath.split('?')[0].split('#')[0];
    if (!fs.existsSync(targetPath)) {
      htmlIssues.push({file, link: linkPath, target: targetPath});
    }
  }
}

const output = { jsIssues, htmlIssues };
fs.writeFileSync('data/integrity-issues.json', JSON.stringify(output, null, 2));
console.log('Issues written to data/integrity-issues.json');
console.log(`Found ${jsIssues.length} broken JS imports and ${htmlIssues.length} broken HTML links`);
