#!/usr/bin/env node
const { execSync } = require('child_process');
function run(cmd){ try{ return execSync(cmd,{encoding:'utf8'}); }catch(e){ return ''; } }
const shas = run('git rev-list --reverse --all').trim().split('\n');
let prevHas = false;
for (const s of shas) {
  const txt = run(`git show ${s}:package.json`);
  if (!txt) continue;
  const has = /start:mcp|mcp-server/.test(txt);
  if (prevHas && !has) {
    console.log('REMOVED_IN_COMMIT', s);
    console.log(run(`git --no-pager show --pretty=format:"%h %ad %an %s" --date=short ${s}`));
    process.exit(0);
  }
  prevHas = has;
}
console.log('No removal detected');
