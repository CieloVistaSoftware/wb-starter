import fs from 'fs';
import path from 'path';

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + '/' + file).isDirectory()) {
      if (file !== 'node_modules') {
        arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
      }
    } else {
      if (file.endsWith('.css')) {
        arrayOfFiles.push(path.join(dirPath, '/', file));
      }
    }
  });

  return arrayOfFiles;
}

async function findCssDuplicates() {
  const cssFiles = getAllFiles('src');
  
  const rulesMap = new Map(); // selector -> [{ file, content }]
  const contentMap = new Map(); // content -> [file]

  console.log('Scanning CSS files...');

  for (const file of cssFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    // Simple regex to match CSS rules: selector { content }
    // This is not a perfect parser but good enough for a rough audit
    const ruleRegex = /([^{]+)\{([^}]+)\}/g;
    let match;

    while ((match = ruleRegex.exec(content)) !== null) {
      const selector = match[1].trim().replace(/\s+/g, ' ');
      const body = match[2].trim().replace(/\s+/g, ' ');
      
      // Ignore media queries and keyframes for simplicity in this pass
      if (selector.startsWith('@')) continue;

      // Check for duplicate selectors
      if (!rulesMap.has(selector)) {
        rulesMap.set(selector, []);
      }
      rulesMap.get(selector).push({ file, body });

      // Check for duplicate content (exact rule body match)
      // We key by full rule to find exact duplicates
      const fullRule = `${selector} { ${body} }`;
      if (!contentMap.has(fullRule)) {
        contentMap.set(fullRule, []);
      }
      contentMap.get(fullRule).push(file);
    }
  }

  console.log('\n--- EXACT RULE DUPLICATES (Same Selector + Same Properties) ---');
  let dupCount = 0;
  for (const [rule, files] of contentMap.entries()) {
    if (files.length > 1) {
      // Filter out duplicates within the same file (rare but possible)
      const uniqueFiles = [...new Set(files)];
      if (uniqueFiles.length > 1) {
        console.log(`\nRule: ${rule.substring(0, 50)}...`);
        console.log('Found in:');
        uniqueFiles.forEach(f => console.log('  - ' + f));
        dupCount++;
      }
    }
  }

  if (dupCount === 0) {
    console.log('No exact rule duplicates found across different files.');
  }

  console.log('\n--- SELECTOR DUPLICATES (Same Selector, Different or Same Properties) ---');
  let selectorDupCount = 0;
  for (const [selector, occurrences] of rulesMap.entries()) {
    const files = occurrences.map(o => o.file);
    const uniqueFiles = [...new Set(files)];
    
    if (uniqueFiles.length > 1) {
      console.log(`\nSelector: ${selector}`);
      console.log('Found in:');
      uniqueFiles.forEach(f => console.log('  - ' + f));
      selectorDupCount++;
    }
  }
  
  if (selectorDupCount === 0) {
    console.log('No selector duplicates found across different files.');
  }
}

findCssDuplicates().catch(console.error);
