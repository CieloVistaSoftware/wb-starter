#!/usr/bin/env node
/* Ensure critical user-facing npm scripts exist in package.json */
import fs from 'fs';
import path from 'path';

const PKG = path.join(process.cwd(), 'package.json');
const REQUIRED = [
  'start',
  'start:mcp',
  'mcp:healthcheck',
  'test',
  'test:compliance',
  'test:behaviors'
];

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

if (!fs.existsSync(PKG)) fail('package.json not found');
const pkg = JSON.parse(fs.readFileSync(PKG, 'utf8'));
const scripts = pkg.scripts || {};
const missing = REQUIRED.filter(s => !Object.prototype.hasOwnProperty.call(scripts, s));
if (missing.length) {
  console.error('Critical npm script(s) missing: ' + missing.join(', '));
  console.error('These scripts are required for developer workflows and CI. See CONTRIBUTING.md for the policy.');
  process.exit(2);
}
console.log('All critical scripts present');
process.exit(0);
