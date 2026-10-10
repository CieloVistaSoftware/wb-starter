/**
 * The optional "publish it on GitHub Pages now?" step of create-wb-starter (#1232).
 *
 * Every new site carries .github/workflows/deploy.yml, which builds and
 * publishes the site on each push to main. This step does the rest, when the
 * owner says yes: make a git repo, create the GitHub repo with the GitHub CLI
 * (`gh`), turn Pages on with "GitHub Actions" as its source, and push.
 *
 * Rules:
 *   - It is asked only when `gh` is installed and signed in, and only in a
 *     terminal. The answer defaults to No.
 *   - --yes answers yes without asking; --no-github skips the step.
 *   - The repo is PUBLIC by default: GitHub Pages is free only for public
 *     repos. --private makes it private, and Pages then needs a paid plan.
 *   - Creating the site never fails because of GitHub. Anything that goes
 *     wrong prints the manual steps and returns.
 *
 * Everything that touches the outside world is passed in (`run`, `ask`,
 * `log`), so the tests drive it without ever calling GitHub.
 */
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';

/** The `gh` to run. CREATE_WB_STARTER_GH points the tests at a stand-in. */
export function ghCommand(env = process.env) {
  return env.CREATE_WB_STARTER_GH || 'gh';
}

/** spawnSync, reduced to what the step needs. Never throws. */
export function runCommand(cmd, args, { cwd } = {}) {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], shell: false });
  return { ok: !r.error && r.status === 0, stdout: (r.stdout || '').trim(), stderr: (r.stderr || '').trim(), missing: r.error?.code === 'ENOENT' };
}

/** Ask one yes/no question on the terminal. Anything but y/yes is No. */
export function askYesNo(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => { rl.close(); resolve(/^y(es)?$/i.test(answer.trim())); });
    rl.on('close', () => resolve(false));
  });
}

/** The steps to publish later, by hand. */
export function manualSteps(repoName, { isPrivate = false } = {}) {
  const visibility = isPrivate ? '--private' : '--public';
  return [
    'To publish it on GitHub Pages later:',
    `  1. Create a ${isPrivate ? 'private' : 'public'} GitHub repo and push this folder to its main branch,`,
    `     e.g. with the GitHub CLI: gh repo create ${repoName} ${visibility} --source . --push`,
    '  2. On GitHub: Settings -> Pages -> Build and deployment -> Source: GitHub Actions.',
    '  3. Push to main. .github/workflows/deploy.yml builds the site and publishes it',
    `     at https://<your-user>.github.io/${repoName}/`,
    ...(isPrivate ? ['  GitHub Pages on a private repo needs a paid GitHub plan.'] : []),
  ].join('\n');
}

/**
 * Offer to create the GitHub repo and publish the site.
 *
 * @param {object} o
 * @param {string} o.siteDir     the new site's folder
 * @param {string} o.repoName    the GitHub repo name (the site's package name)
 * @param {{yes?: boolean, noGithub?: boolean, isPrivate?: boolean}} o.flags
 * @param {boolean} o.interactive  stdin and stdout are a terminal
 * @param {(cmd: string, args: string[], opts?: {cwd?: string}) => {ok: boolean, stdout: string, stderr: string, missing?: boolean}} [o.run]
 * @param {(question: string) => Promise<boolean>} [o.ask]
 * @param {(line: string) => void} [o.log]
 * @param {string} [o.gh]        the gh executable
 * @returns {Promise<{published: boolean, reason: string, url?: string}>}
 */
export async function offerGitHubPages({
  siteDir, repoName, flags = {}, interactive,
  run = runCommand, ask = askYesNo, log = console.log, gh = ghCommand(),
}) {
  const { yes = false, noGithub = false, isPrivate = false } = flags;
  const later = (reason, detail) => {
    if (detail) log(`\n${detail}`);
    log(`\n${manualSteps(repoName, { isPrivate })}`);
    return { published: false, reason };
  };
  try {
    if (noGithub) return later('--no-github');

    const version = run(gh, ['--version']);
    if (!version.ok) return later('gh-missing', 'The GitHub CLI (gh) is not installed, so the site was not put on GitHub. Get it at https://cli.github.com/');
    if (!run(gh, ['auth', 'status']).ok) return later('gh-signed-out', 'The GitHub CLI is not signed in (run: gh auth login), so the site was not put on GitHub.');

    if (!yes) {
      if (!interactive) return later('not-a-terminal');
      const visibility = isPrivate ? 'private' : 'public';
      const agreed = await ask(`\nCreate a ${visibility} GitHub repo "${repoName}" and publish it on GitHub Pages now? (y/N) `);
      if (!agreed) return later('declined');
    }

    const git = (args) => run('git', args, { cwd: siteDir });
    // `git init -b` needs git 2.28; symbolic-ref names the branch on any git.
    if (!git(['init']).ok || !git(['symbolic-ref', 'HEAD', 'refs/heads/main']).ok) {
      return later('git-init-failed', 'git init failed (is git installed?), so the site was not put on GitHub.');
    }
    const committed = git(['add', '-A']).ok && git(['commit', '-m', `Create ${repoName} with create-wb-starter`]);
    if (!committed || !committed.ok) {
      return later('git-commit-failed', `The first commit failed${committed?.stderr ? `: ${committed.stderr.split('\n')[0]}` : ''}. Set git's user.name and user.email, then commit.`);
    }

    // Create the repo, then turn Pages on, THEN push: the push starts the
    // deploy workflow, and it can only publish once Pages is on.
    const created = run(gh, ['repo', 'create', repoName, isPrivate ? '--private' : '--public', '--source', '.', '--remote', 'origin'], { cwd: siteDir });
    if (!created.ok) return later('repo-create-failed', `gh repo create failed: ${created.stderr.split('\n')[0] || 'no reason given'}`);

    const login = run(gh, ['api', 'user', '--jq', '.login']);
    const owner = login.ok && login.stdout ? login.stdout : '<your-user>';
    const pages = run(gh, ['api', '-X', 'POST', `repos/${owner}/${repoName}/pages`, '-f', 'build_type=workflow']);
    if (!pages.ok) {
      log(`\nThe repo was created, but GitHub Pages was not turned on${isPrivate ? ' (Pages on a private repo needs a paid GitHub plan)' : ''}.`);
      log('Turn it on: Settings -> Pages -> Build and deployment -> Source: GitHub Actions.');
    }

    const pushed = run('git', ['push', '-u', 'origin', 'main'], { cwd: siteDir });
    if (!pushed.ok) return later('push-failed', `The repo was created, but git push failed: ${pushed.stderr.split('\n')[0] || 'no reason given'}`);

    const url = `https://${owner.toLowerCase()}.github.io/${repoName}/`;
    log(`\n✓ On GitHub: https://github.com/${owner}/${repoName}`);
    log(pages.ok
      ? `✓ Publishing to ${url}\n  The first deploy takes a minute or two (see the repo's Actions tab). Every push to main publishes again.`
      : `  Once Pages is on, every push to main publishes to ${url}`);
    return { published: pages.ok, reason: pages.ok ? 'published' : 'pages-failed', url };
  } catch (err) {
    return later('error', `Putting the site on GitHub failed: ${err.message}`);
  }
}
