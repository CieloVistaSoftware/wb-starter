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
import { pagesDeployState } from './lib/pages-deploy-state.mjs';
import { playwrightInvocation } from './lib/playwright-launch.mjs';
import { parsePlaywrightSummary } from './lib/playwright-summary.mjs';

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

// #1361: judged by the Actions run that deploys main's head commit, not by the
// legacy builds list, which records every cancelled (superseded) duplicate build
// as "errored" and so reported a healthy deploy as broken.
function gh(args) {
  return execSync(`gh ${args}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

function deployStatus() {
  try {
    const head = gh(`api repos/${REPO}/commits/main --jq .sha`).trim();
    // "pages build and deployment" is GitHub's built-in dynamic workflow, which
    // `gh run list --workflow` cannot address by name -- list main's runs and
    // filter by name instead.
    const runs = JSON.parse(gh(
      `run list --repo ${REPO} --branch main --limit 60 --json name,headSha,status,conclusion`
    )).filter((r) => r.name === 'pages build and deployment');
    return pagesDeployState(runs, head);
  } catch {
    return null; // gh missing or unauthenticated — not fatal, just skip the wait
  }
}

async function waitForBuild() {
  const started = Date.now();
  let last = '';
  while (Date.now() - started < MAX_WAIT_MS) {
    const s = deployStatus();
    if (!s) {
      console.log('⚠️  could not read the Pages deploy status (gh unavailable) — smoking anyway');
      return;
    }
    if (s.state + s.detail !== last) {
      console.log(`   Pages deploy: ${s.state} (${s.detail})`);
      last = s.state + s.detail;
    }
    if (s.state === 'built') return;
    if (s.state === 'errored') {
      console.error(`\n❌ Pages deploy FAILED: ${s.detail}`);
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  console.error('\n❌ The Pages deploy for main\'s head did not finish within 10 minutes.');
  process.exit(1);
}

console.log(`\n🔥 Deployed smoke — ${url}\n`);
if (!skipWait) await waitForBuild();

// No shell (#1194): Playwright's own CLI through the current node, arguments
// as an array. SMOKE_BASE_URL is a process-local handoff to the spec, set for
// this child only -- deliberately NOT a system environment variable: those hold
// secrets, and a public URL is not one. With it set, playwright.config.ts
// starts no local server (#1364): this run tests the deployed site only.
const { command, args } = playwrightInvocation(['playwright', 'test', 'site-smoke', '--project=compliance', '--reporter=line']);
const res = spawnSync(command, args, {
  env: { ...process.env, SMOKE_BASE_URL: url },
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
process.stdout.write(res.stdout || '');
process.stderr.write(res.stderr || '');

// #1364: only a smoke test that RAN and failed means the deployed site is
// broken. A run that never got to test anything -- Playwright missing, the
// config failing to load, a local setup error -- used to print the same
// "THE DEPLOYED SITE IS BROKEN" over a healthy site.
// The line reporter redraws its status with terminal cursor codes, so its final
// "6 passed" arrives prefixed by ESC sequences; strip them before parsing.
const ANSI = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*[A-Za-z]', 'g');
const summary = parsePlaywrightSummary(`${res.stdout || ''}\n${res.stderr || ''}`.replace(ANSI, ''));
const ranTests = summary.passed !== null || summary.failed !== null;

if (res.status === 0 && ranTests) {
  console.log(`\n✅ The deployed site boots. ${url}\n`);
} else if (!ranTests) {
  console.error(
    `\n⚠️  THE SMOKE TEST DID NOT RUN — nothing was checked against ${url}.\n` +
      `   This is a problem on THIS machine, not evidence about the deployed site.\n` +
      `   Exit ${res.status}${res.error ? ` (${res.error.message})` : ''}. Try \`npm ci\`, then run this again.\n`
  );
  process.exit(2);
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
