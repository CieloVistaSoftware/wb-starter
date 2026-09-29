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
 * The published URL lives HERE, in the repo, under version control.
 *
 * It is public, it is the same for every clone, and it is not a secret --
 * system environment variables are for secrets (John's rule), and this is not
 * one. Putting it there also broke the gate for anyone whose machine had not
 * had the variable set by hand, which is every machine but one.
 *
 * --url overrides for a one-off run against somewhere else (a staging copy, a
 * fork's Pages site).
 */
const PUBLISHED_URL = 'https://cielovistasoftware.github.io/wb-starter/';

const argIdx = process.argv.indexOf('--url');
const override = argIdx !== -1 ? process.argv[argIdx + 1] : null;
const url = override || PUBLISHED_URL;
const skipWait = process.argv.includes('--no-wait');

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
  // SMOKE_BASE_URL is a process-local handoff to the spec, set for this child
  // only. It is deliberately NOT a system environment variable: those hold
  // secrets, and a public URL is not one.
  { stdio: 'inherit', env: { ...process.env, SMOKE_BASE_URL: url }, shell: true }
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
