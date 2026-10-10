import { test, expect } from '@playwright/test';
import { execFileSync, spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

/**
 * Creating a site offers to publish it on GitHub Pages (#1232).
 *
 * John: "When a new site is created should it also have option to create
 * github site?" Every new site carries a Pages workflow, and creation asks one
 * question, default No: create the GitHub repo and publish it now?
 *
 * None of this calls GitHub. The GitHub step takes its `gh` and its commands
 * as arguments, and the end-to-end case points the scaffolder at a stand-in
 * `gh` (CREATE_WB_STARTER_GH) whose "repo" is a bare git repo in a temp folder.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PKG = path.join(ROOT, 'packages', 'create-wb-starter');
const CREATE = path.join(PKG, 'bin', `${path.basename(PKG)}.js`);
// Loaded from PKG rather than by a second spelled-out path.
const { offerGitHubPages } = await import(pathToFileURL(path.join(PKG, 'lib', 'github-pages.js')).href);
// A gh that is certainly not there, so no test can reach a real, signed-in gh.
const NO_GH = path.join(os.tmpdir(), 'wb-create-no-such-gh', 'gh');

let work: string;
test.beforeEach(() => { work = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-create-gh-')); });
test.afterEach(() => { fs.rmSync(work, { recursive: true, force: true }); });

function create(args: string[], env: Record<string, string> = {}) {
  return spawnSync(process.execPath, [CREATE, ...args], {
    cwd: work, encoding: 'utf8', env: { ...process.env, CREATE_WB_STARTER_GH: NO_GH, ...env },
  });
}

type Call = { cmd: string; args: string[] };
/** A stand-in for every command the step runs; `fail` names commands that fail. */
function fakeRun(fail: (c: Call) => boolean = () => false, login = 'octo') {
  const calls: Call[] = [];
  const run = (cmd: string, args: string[]) => {
    const call = { cmd, args };
    calls.push(call);
    if (fail(call)) return { ok: false, stdout: '', stderr: `${cmd} ${args[0]} failed` };
    const stdout = args.join(' ') === 'api user --jq .login' ? login : '';
    return { ok: true, stdout, stderr: '' };
  };
  return { calls, run };
}
const line = (c: Call) => [c.cmd, ...c.args].join(' ');

test('a new site carries a GitHub Pages workflow that builds and publishes dist/', () => {
  const r = create(['my-site', '--yes', '--no-github']);
  expect(r.status, r.stderr).toBe(0);
  const site = path.join(work, 'my-site');
  // npm drops dot-folders from a package, so it ships as _github and is renamed.
  expect(fs.existsSync(path.join(site, '_github'))).toBe(false);
  const workflow = fs.readFileSync(path.join(site, '.github', 'workflows', 'deploy.yml'), 'utf8');
  expect(workflow).toMatch(/on:\s*\n\s*push:\s*\n\s*branches: \[main\]/);
  expect(workflow).toContain('workflow_dispatch');
  expect(workflow).toContain('run: npm run build');
  expect(workflow).toMatch(/uses: actions\/upload-pages-artifact@v\d+\s*\n\s*with:\s*\n\s*path: dist\b/);
  expect(workflow).toMatch(/uses: actions\/deploy-pages@v\d+/);
  expect(workflow).toMatch(/pages: write/);
  expect(workflow).toMatch(/id-token: write/);
  // --no-github: nothing was put on GitHub, and it says how to do it later.
  expect(fs.existsSync(path.join(site, '.git'))).toBe(false);
  expect(r.stdout).toContain('To publish it on GitHub Pages later:');
  expect(r.stdout).toContain('gh repo create my-site --public --source . --push');
});

test('the scaffolder ships the workflow: _github is in the published package', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(PKG, 'package.json'), 'utf8'));
  expect(pkg.files).toEqual(expect.arrayContaining(['bin', 'lib', 'template']));
  expect(fs.existsSync(path.join(PKG, 'template', '_github', 'workflows', 'deploy.yml'))).toBe(true);
});

test('with no gh, --yes still creates the site, prints the manual steps and exits 0', () => {
  // `--yes my-site`: --yes takes no value, so my-site is still the folder.
  const r = create(['--yes', 'my-site']);
  expect(r.status, r.stderr).toBe(0);
  expect(fs.existsSync(path.join(work, 'my-site', 'index.html'))).toBe(true);
  expect(r.stdout).toContain('The GitHub CLI (gh) is not installed');
  expect(r.stdout).toContain('To publish it on GitHub Pages later:');
  expect(fs.existsSync(path.join(work, 'my-site', '.git'))).toBe(false);
});

test('on yes it creates the public repo, turns Pages on, then pushes', async () => {
  const { calls, run } = fakeRun();
  const out: string[] = [];
  let asked = '';
  const result = await offerGitHubPages({
    siteDir: work, repoName: 'my-site', flags: {}, interactive: true, gh: 'gh', run,
    ask: async (q: string) => { asked = q; return true; }, log: (s: string) => out.push(s),
  });
  expect(asked).toContain('Create a public GitHub repo "my-site" and publish it on GitHub Pages now? (y/N)');
  const lines = calls.map(line);
  const create = lines.indexOf('gh repo create my-site --public --source . --remote origin');
  const pages = lines.indexOf('gh api -X POST repos/octo/my-site/pages -f build_type=workflow');
  const push = lines.indexOf('git push -u origin main');
  expect(create, lines.join('\n')).toBeGreaterThan(-1);
  expect(pages, 'Pages is turned on with the site\'s name').toBeGreaterThan(create);
  expect(push, 'the push that starts the deploy comes after Pages is on').toBeGreaterThan(pages);
  expect(lines).toContain('git init');
  expect(lines.some((l) => l.startsWith('git commit -m'))).toBe(true);
  expect(result).toEqual({ published: true, reason: 'published', url: 'https://octo.github.io/my-site/' });
  expect(out.join('\n')).toContain('https://octo.github.io/my-site/');
});

test('--private makes a private repo and says Pages then needs a paid plan', async () => {
  const { calls, run } = fakeRun((c) => c.args.includes('build_type=workflow'));
  const out: string[] = [];
  const result = await offerGitHubPages({
    siteDir: work, repoName: 'my-site', flags: { yes: true, isPrivate: true }, interactive: false, gh: 'gh', run,
    ask: async () => { throw new Error('--yes must not ask'); }, log: (s: string) => out.push(s),
  });
  expect(calls.map(line)).toContain('gh repo create my-site --private --source . --remote origin');
  expect(calls.map(line), 'still pushed: the workflow publishes once Pages is on').toContain('git push -u origin main');
  expect(result.reason).toBe('pages-failed');
  expect(out.join('\n')).toContain('Pages on a private repo needs a paid GitHub plan');
  expect(out.join('\n')).toContain('Source: GitHub Actions');
});

test('the answer defaults to No, and No touches nothing', async () => {
  const { calls, run } = fakeRun();
  const out: string[] = [];
  const result = await offerGitHubPages({
    siteDir: work, repoName: 'my-site', flags: {}, interactive: true, gh: 'gh', run,
    ask: async () => false, log: (s: string) => out.push(s),
  });
  expect(result.reason).toBe('declined');
  expect(calls.map(line)).toEqual(['gh --version', 'gh auth status']);
  expect(out.join('\n')).toContain('To publish it on GitHub Pages later:');
});

test('it never asks outside a terminal, or when gh is signed out', async () => {
  const ask = async () => { throw new Error('must not ask'); };
  const quiet = () => {};
  const ci = fakeRun();
  expect((await offerGitHubPages({ siteDir: work, repoName: 'my-site', interactive: false, gh: 'gh', run: ci.run, ask, log: quiet })).reason).toBe('not-a-terminal');
  expect(ci.calls.map(line)).toEqual(['gh --version', 'gh auth status']);

  const signedOut = fakeRun((c) => c.args[0] === 'auth');
  const out: string[] = [];
  expect((await offerGitHubPages({ siteDir: work, repoName: 'my-site', flags: { yes: true }, interactive: true, gh: 'gh', run: signedOut.run, ask, log: (s: string) => out.push(s) })).reason).toBe('gh-signed-out');
  expect(signedOut.calls.map(line)).toEqual(['gh --version', 'gh auth status']);
  expect(out.join('\n')).toContain('gh auth login');
});

test('a failed repo create prints the manual steps and never throws', async () => {
  const { calls, run } = fakeRun((c) => c.args[0] === 'repo');
  const out: string[] = [];
  const result = await offerGitHubPages({ siteDir: work, repoName: 'my-site', flags: { yes: true }, interactive: false, gh: 'gh', run, log: (s: string) => out.push(s) });
  expect(result.reason).toBe('repo-create-failed');
  expect(calls.map(line)).not.toContain('git push -u origin main');
  expect(out.join('\n')).toContain('To publish it on GitHub Pages later:');
});

test('end to end with a stand-in gh: --yes commits the site and pushes it with its workflow', () => {
  test.skip(process.platform === 'win32', 'the stand-in gh is a #! script');
  const remote = path.join(work, 'remote.git');
  execFileSync('git', ['init', '--bare', '-q', remote]);
  const log = path.join(work, 'gh.log');
  const gh = path.join(work, 'fake-gh');
  // Logs each call; `repo create` adds the bare repo as origin, as gh would add GitHub.
  fs.writeFileSync(gh, `#!${process.execPath}
const fs = require('fs');
const { execFileSync } = require('child_process');
const args = process.argv.slice(2);
fs.appendFileSync(process.env.FAKE_GH_LOG, args.join(' ') + '\\n');
if (args[0] === 'repo' && args[1] === 'create') execFileSync('git', ['remote', 'add', 'origin', process.env.FAKE_GH_REMOTE]);
if (args.join(' ') === 'api user --jq .login') process.stdout.write('octo');
`);
  fs.chmodSync(gh, 0o755);
  // The stand-in is CommonJS: keep it out of the repo's "type": "module".
  fs.writeFileSync(path.join(work, 'package.json'), '{"type":"commonjs"}');
  const r = create(['my-site', '--yes'], {
    CREATE_WB_STARTER_GH: gh, FAKE_GH_LOG: log, FAKE_GH_REMOTE: remote,
    GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 'test@example.com', GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 'test@example.com',
  });
  expect(r.status, r.stderr + r.stdout).toBe(0);
  const calls = fs.readFileSync(log, 'utf8').trim().split('\n');
  expect(calls).toContain('repo create my-site --public --source . --remote origin');
  expect(calls).toContain('api -X POST repos/octo/my-site/pages -f build_type=workflow');
  expect(r.stdout).toContain('Publishing to https://octo.github.io/my-site/');
  const pushed = execFileSync('git', ['--git-dir', remote, 'ls-tree', '-r', '--name-only', 'main'], { encoding: 'utf8' }).split('\n');
  expect(pushed).toEqual(expect.arrayContaining(['.github/workflows/deploy.yml', '.gitignore', 'index.html', 'config/site.json', 'pages/home.html']));
});
