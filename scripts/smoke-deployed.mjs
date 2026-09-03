/**
 * smoke-deployed.mjs — Law 17's runnable half.
 *
 * A push to main publishes live. The push is not the deliverable; a booting
 * site is. This runs tests/compliance/site-smoke.spec.ts against the DEPLOYED
 * origin instead of localhost.
 *
 * Law 17 was written before this existed, which made it a rule with no
 * sanctioned way to follow it: npm_test_async cannot pass an env var, and
 * Windows will not take `FOO=bar npx ...` inline. Hence a shim rather than a
 * one-liner in package.json.
 *
 *   npm run test:smoke:deployed
 *   npm run test:smoke:deployed -- --url https://example.com/somewhere/
 *
 * Waits for the GitHub Pages build to report `built` first, because running
 * against a `building` origin tests the PREVIOUS deploy and reports a
 * confident, meaningless pass.
 */
import { execSync, spawnSync } from 'child_process';

/*
 * The URL comes from the SYSTEM environment, never from a value invented here.
 * John's rule: all environment variables are stored and used at the system
 * level. This script READS SMOKE_BASE_URL; it does not manufacture one and
 * inject it into the child process.
 *
 * Set it once, permanently, then never think about it again:
 *
 *   setx SMOKE_BASE_URL "https://cielovistasoftware.github.io/wb-starter/"
 *
 * (setx writes to the user environment; open a NEW shell for it to be visible.)
 */
const argIdx = process.argv.indexOf('--url');
const override = argIdx !== -1 ? process.argv[argIdx + 1] : null;
const url = override || process.env.SMOKE_BASE_URL;
const skipWait = process.argv.includes('--no-wait');

if (!url) {
  console.error(
    '\n❌ SMOKE_BASE_URL is not set in the system environment.\n\n' +
      '   Set it once, at the system level:\n\n' +
      '     setx SMOKE_BASE_URL "https://cielovistasoftware.github.io/wb-starter/"\n\n' +
      '   Then open a new shell and re-run. (--url <address> overrides it for a\n' +
      '   one-off run against somewhere else, e.g. a staging copy.)\n'
  );
  process.exit(1);
}

const REPO = 'CieloVistaSoftware/wb-starter';
const POLL_MS = 15_000;
const MAX_WAIT_MS = 10 * 60_000;

function pagesStatus() {
  try {
    return JSON.parse(
      execSync(`gh api repos/${REPO}/pages/builds/latest`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      })
    );
  } catch {
    return null; // gh missing or unauthenticated — not fatal, just skip the wait
  }
}

async function waitForBuild() {
  const started = Date.now();
  let last = '';
  while (Date.now() - started < MAX_WAIT_MS) {
    const s = pagesStatus();
    if (!s) {
      console.log('⚠️  could not read Pages build status (gh unavailable) — smoking anyway');
      return;
    }
    if (s.status !== last) {
      console.log(`   Pages build: ${s.status} @ ${String(s.commit).slice(0, 8)}`);
      last = s.status;
    }
    if (s.status === 'built') return;
    if (s.status === 'errored') {
      console.error(`\n❌ Pages build ERRORED: ${s.error?.message || '(no message)'}`);
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  console.error('\n❌ Pages build did not reach "built" within 10 minutes.');
  process.exit(1);
}

console.log(`\n🔥 Deployed smoke — ${url}\n`);
if (!skipWait) await waitForBuild();

const res = spawnSync(
  'npx',
  ['playwright', 'test', 'site-smoke', '--project=compliance', '--reporter=line'],
  // Inherit the system environment as-is. The only case that adds anything is
  // an explicit --url override for a one-off run; the normal path passes the
  // ambient SMOKE_BASE_URL straight through, unmodified.
  { stdio: 'inherit', env: override ? { ...process.env, SMOKE_BASE_URL: override } : process.env, shell: true }
);

if (res.status === 0) {
  console.log(`\n✅ The deployed site boots. ${url}\n`);
} else {
  console.error(
    `\n❌ THE DEPLOYED SITE IS BROKEN — ${url}\n` +
      `   Fix it before reporting anything else as done (Law 17).\n` +
      `   If this failed seconds after a push, a stale client is possible:\n` +
      `   JS is served max-age=600 with no content hash (#989). Re-check with\n` +
      `   fetch(url, {cache:'reload'}) before concluding the deploy failed.\n`
  );
}
process.exit(res.status ?? 1);
