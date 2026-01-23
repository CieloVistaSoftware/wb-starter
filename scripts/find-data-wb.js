// Search for data-wb artifacts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


interface ScanResult {
  file: string;
  line: number;
  text: string;
}

const results: ScanResult[] = [];

function scan(dir: string): void {
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      if (item === 'node_modules' || item === '.git') continue;

      const fullPath: string = path.join(dir, item);
      const stat: fs.Stats = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (/\.(html|js|md)$/.test(item)) {
        try {
          const content: string = fs.readFileSync(fullPath, 'utf8');
          const lines: string[] = content.split('\n');
          lines.forEach((line: string, i: number) => {
            // Look for x-legacy= patterns (old behavior syntax)
            if (line.includes('.');


console.log('Found', results.length, 'occurrences of x-legacy=\n');
results.forEach((r: ScanResult) => {
  console.log(`${r.file}:${r.line}`);
  console.log(`  ${r.text}`);
  console.log('');
});

// Write to JSON for easier processing
fs.writeFileSync('data/data-wb-artifacts.json', JSON.stringify(results, null, 2));
console.log('\nResults saved to data/data-wb-artifacts.json');
