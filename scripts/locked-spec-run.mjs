#!/usr/bin/env node
/**
 * locked-spec-run.mjs — run named spec files the way a hook is allowed to (#1128).
 *
 *   node scripts/locked-spec-run.mjs tests/compliance/project-integrity.spec.ts --reporter=line
 *
 * For shell hooks, which cannot take a lock themselves. The last step of
 * .husky/pre-commit used to be a bare `npx playwright test ...project-integrity`:
 * no machine-wide slot, so it ran beside a suite or another commit's run, and no
 * time limit, so a wedged run held the commit forever.
 *
 * This holds a single-run slot in the machine-wide lock dir (waiting on release
 * notifications, with a deadline), bounds the run, and leaves the port to
 * playwright.config.ts. All of it is scripts/lib/hold-machine.mjs; this file is
 * only the command line. It runs spec FILES only: a suite goes through the
 * suite lock (test-async, or the gate), never through here.
 *
 * Guarded by scripts/test-gate-guards.mjs.
 */
import { existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runSpecsHoldingSlot } from './lib/hold-machine.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const specs = argv.filter((a) => a.endsWith('.spec.ts'));
const args = argv.filter((a) => !a.endsWith('.spec.ts'));

if (!specs.length) {
  console.error('[spec-run] name at least one .spec.ts file — a suite takes the suite lock, not a slot.');
  process.exit(1);
}

const cli = join(ROOT, 'node_modules', '@playwright', 'test', 'cli.js');
if (!existsSync(cli)) {
  console.error(`[spec-run] Playwright CLI not found at ${cli} — run: npm install`);
  process.exit(1);
}

const res = await runSpecsHoldingSlot({ root: ROOT, cli, specs, args, label: 'spec-run' });
if (!res.held || res.hung || res.error) process.exit(1);
process.exit(res.status === 0 ? 0 : 1);
