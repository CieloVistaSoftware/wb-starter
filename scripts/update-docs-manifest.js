const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'docs');
const MANIFEST_PATH = path.join(DOCS_DIR, 'manifest.json');

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));

// Helper to find or create category
function getCategory(name, icon) {
  let cat = manifest.categories.find(c => c.name === name);
  if (!cat) {
    cat = { name, icon, docs: [] };
    manifest.categories.push(cat);
  }
  if (!cat.docs) cat.docs = [];
  return cat;
}

// Helper to check if file exists in manifest
function isInManifest(filePath) {
  const normalized = path.normalize(filePath);
  for (const cat of manifest.categories) {
    if (cat.docs) {
      for (const doc of cat.docs) {
        if (path.normalize(doc.file) === normalized) return true;
      }
    }
    if (cat.pages) {
        // pages usually don't have 'file' property pointing to md, but let's check
    }
  }
  return false;
}

// Scan files
function scanDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== '_today') {
        scanDir(fullPath, fileList);
      }
    } else if (file.endsWith('.md')) {
      fileList.push(path.relative(DOCS_DIR, fullPath));
    }
  }
  return fileList;
}

const allFiles = scanDir(DOCS_DIR);

for (const file of allFiles) {
  if (isInManifest(file)) continue;
  if (file === 'manifest.json') continue;

  const parts = file.split(path.sep);
  const fileName = path.basename(file, '.md');
  
  // Determine category
  let categoryName = 'Uncategorized';
  let icon = '📄';
  
  if (file.startsWith('components' + path.sep + 'semantic') || file.startsWith('components' + path.sep + 'semantics')) {
    categoryName = 'Semantics';
    icon = '🏷️';
  } else if (file.startsWith('components' + path.sep + 'effects')) {
    categoryName = 'Effects';
    icon = '✨';
  } else if (file.startsWith('compliance')) {
    categoryName = 'Compliance';
    icon = '⚖️';
  } else if (file.startsWith('components')) {
    categoryName = 'Components';
    icon = '🧩';
  } else if (file === 'card.md') {
    categoryName = 'Components';
    icon = '🧩';
  }

  const cat = getCategory(categoryName, icon);
  
  // Generate title
  let title = fileName.charAt(0).toUpperCase() + fileName.slice(1);
  if (fileName === 'index') title = parts[parts.length - 2] + ' Index';
  if (fileName === 'README') title = parts[parts.length - 2] + ' Readme';
  
  // Special cases
  if (file === 'card.md') title = 'Card Overview';
  if (file === 'components/cards/index.md') title = 'Card Components Index';

  cat.docs.push({
    file: file.replace(/\\/g, '/'), // Ensure forward slashes
    title: title,
    description: `Documentation for ${title}`
  });
  
  console.log(`Added ${file} to ${categoryName}`);
}

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
console.log('Manifest updated!');
