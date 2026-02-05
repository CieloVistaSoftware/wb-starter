#!/usr/bin/env node
// scripts/codemods/preview-codemod.mjs
// Dependency-free conservative preview: applies regex transforms to files under a target dir
// and writes results to tmp/codemod-preview/<relpath>. Original files are not modified.

import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();
const target = process.argv[2] || 'scripts';
const outDir = process.argv[3] || 'tmp/codemod-preview';
const EXT = ['.js', '.cjs'];

function transform(src) {
  let out = src;
  out = out.replace(/const\s+(\w+)\s*=\s*require\(['"]([^'"\\)]+)['"]\)\s*;?/g, 'import $1 from "$2";');
  out = out.replace(/const\s+\{([^}]+)\}\s*=\s*require\(['"]([^'"\\)]+)['"]\)\s*;?/g, 'import {$1} from "$2";');
  out = out.replace(/module\.exports\s*=\s*(\w+)\s*;?/g, 'export default $1;');
  out = out.replace(/exports\.(\w+)\s*=\s*(\w+)\s*;?/g, 'export const $1 = $2;');
  return out;
}

async function walk(dir, outFiles) {
  const ents = await fs.readdir(dir, { withFileTypes: true });
  for (const e of ents) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, outFiles);
    else if (EXT.includes(path.extname(e.name))) outFiles.push(full);
  }
}

async function run() {
  const targetDir = path.join(root, target);
  const files = [];
  await walk(targetDir, files);
  const report = { target, files: [], transformed: 0 };
  for (const f of files) {
    const rel = path.relative(root, f);
    const src = await fs.readFile(f, 'utf8');
    const transformed = transform(src);
    const changed = transformed !== src;
    report.files.push({ file: rel, changed });
    if (changed) {
      const outPath = path.join(root, outDir, rel);
      await fs.mkdir(path.dirname(outPath), { recursive: true });
      await fs.writeFile(outPath, transformed, 'utf8');
      report.transformed++;
    }
  }
  await fs.mkdir(path.join(root, outDir), { recursive: true });
  await fs.writeFile(path.join(root, outDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log(`Wrote preview to ${outDir} — ${report.transformed} file(s) changed (preview)`);
  return report;
}

run().catch(err => { console.error(err); process.exit(1); });