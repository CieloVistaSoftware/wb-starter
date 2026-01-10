import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: node scripts/rename-page.js <oldName> <newName>');
  console.log('Example: node scripts/rename-page.js about story');
  process.exit(1);
}

const [oldName, newName] = args;
const rootDir = path.join(__dirname, '..');

const safeOld = path.basename(oldName, '.html');
const safeNew = path.basename(newName, '.html');

const oldHtmlPath = path.join(rootDir, 'pages', `${safeOld}.html`);
const newHtmlPath = path.join(rootDir, 'pages', `${safeNew}.html`);
const oldJsonPath = path.join(rootDir, 'data', 'pages', `${safeOld}.json`);
const newJsonPath = path.join(rootDir, 'data', 'pages', `${safeNew}.json`);

// Check if old file exists
if (!fs.existsSync(oldHtmlPath)) {
  console.error(`Error: Page 'pages/${safeOld}.html' not found.`);
  process.exit(1);
}

// Check if new file already exists
if (fs.existsSync(newHtmlPath)) {
  console.error(`Error: Page 'pages/${safeNew}.html' already exists.`);
  process.exit(1);
}

try {
  // Rename HTML
  fs.renameSync(oldHtmlPath, newHtmlPath);
  console.log(`✅ Renamed pages/${safeOld}.html -> pages/${safeNew}.html`);

  // Rename JSON if it exists
  if (fs.existsSync(oldJsonPath)) {
    fs.renameSync(oldJsonPath, newJsonPath);
    console.log(`✅ Renamed data/pages/${safeOld}.json -> data/pages/${safeNew}.json`);
  } else {
    console.log(`ℹ️  No data file found at data/pages/${safeOld}.json (skipping)`);
  }

} catch (err) {
  console.error('Error renaming files:', err);
  process.exit(1);
}
