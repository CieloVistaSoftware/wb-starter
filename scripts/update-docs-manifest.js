import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'docs');
const OUTPUT_FILE = path.join(ROOT, 'data', 'docs-manifest.json');

function getMarkdownFiles(dir, basePath = '') {
  const results = [];
  
  if (!fs.existsSync(dir)) return results;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;
    
    if (entry.isDirectory()) {
      // Skip hidden directories and node_modules
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      results.push(...getMarkdownFiles(fullPath, relativePath));
    } else if (entry.name.endsWith('.md')) {
      // Read first line for title
      const content = fs.readFileSync(fullPath, 'utf-8');
      const firstLine = content.split('\n')[0];
      const title = firstLine.replace(/^#\s*/, '').trim() || entry.name.replace('.md', '');
      
      results.push({
        path: `docs/${relativePath}`,
        title,
        name: entry.name.replace('.md', ''),
        category: basePath.split('/')[0] || 'root'
      });
    }
  }
  
  return results;
}

function generateManifest() {
  console.log('Scanning docs directory...');
  
  const files = getMarkdownFiles(DOCS_DIR);
  
  // Group by category
  const byCategory = {};
  for (const file of files) {
    if (!byCategory[file.category]) {
      byCategory[file.category] = [];
    }
    byCategory[file.category].push(file);
  }
  
  // #1071: NO `generated` timestamp.
  //
  // This file is tracked, because src/wb-viewmodels/demo.js reads it from the
  // deployed site. It is also rewritten on every `npm start`. With a timestamp
  // in it, every start produced a diff even when not one document had changed,
  // so the working tree was permanently dirty and the version badge's "*"
  // (uncommitted changes) could never clear.
  //
  // A manifest describes what the docs ARE. When it was built is a fact about
  // the build, not about the contents, and it is already recoverable from git.
  // Dropping it makes the file change only when the docs actually change, which
  // is also what makes a stale-manifest check possible: regenerate, and a diff
  // now MEANS something.
  const manifest = {
    totalFiles: files.length,
    categories: Object.keys(byCategory).sort(),
    byCategory,
    files: files.sort((a, b) => a.path.localeCompare(b.path))
  };
  
  // Ensure data directory exists
  const dataDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
  
  console.log(`Generated manifest with ${files.length} files in ${Object.keys(byCategory).length} categories`);
  console.log(`Output: ${OUTPUT_FILE}`);
}

generateManifest();
