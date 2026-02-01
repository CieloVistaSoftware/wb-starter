#!/usr/bin/env node
// start.js - drop-in replacement for package.json `start` script
// - preserves existing behavior when run with no args
// - supports `npm start -- mcp` to restart the MCP server (developer convenience)
import { spawnSync } from 'child_process';

const args = process.argv.slice(2);
if (args[0] === 'mcp') {
  const childArgs = args.slice(1);
  const spawnArgs = ['scripts/mcp-restart.js', ...childArgs];
  const r = spawnSync(process.execPath, spawnArgs, { stdio: 'inherit' });
  process.exit(r.status ?? 0);
}

// default behavior (preserve previous command chain)
const cmd = 'node scripts/update-docs-manifest.js && node server.js';
const r = spawnSync(cmd, { shell: true, stdio: 'inherit' });
process.exit(r.status ?? 0);
