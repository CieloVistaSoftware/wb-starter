/**
 * Where the POSIX shell that runs git's hooks actually lives (#1156).
 *
 * On Windows `sh` is on PATH only inside Git Bash. `C:\Program Files\Git\cmd`
 * and `mingw64\bin` are on the system PATH; `usr\bin`, where sh.exe lives, is
 * not. So a test that spawns 'sh' works from Git Bash and fails with ENOENT
 * from PowerShell, cmd, or a gate started by either.
 *
 * 2026-09-15: that is why `npm run ship` aborted. Three pre-push hook tests
 * came back with the spec's -1 fallback and reported "unnamed code would have
 * reached the published site" — a verdict about the site from a hook that had
 * never run. The same specs passed on their own from Git Bash.
 *
 * git knows where its own shell is: `git --exec-path` gives
 * <install>/mingw64/libexec/git-core, and sh.exe sits at <install>/usr/bin/sh.exe.
 * Ask git rather than trusting the environment.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/**
 * The environment a hook needs: the shell's own directory on PATH.
 *
 * Resolving sh.exe is not enough. A hook script runs `cat`, `grep`, `sed` — all
 * of them in that same usr/bin — so with only the shell resolved the hook starts
 * and then dies with "cat: command not found", which is a different wrong answer
 * about the same thing. Give the child what Git Bash would.
 *
 * @param {string|null} shell as returned by resolvePosixShell()
 * @param {NodeJS.ProcessEnv} [env]
 */
export function shellEnv(shell, env = process.env) {
  if (!shell || !shell.includes('\\') && !shell.includes('/')) return { ...env };
  const bin = dirname(shell);
  const sep = process.platform === 'win32' ? ';' : ':';
  const current = env.PATH || env.Path || '';
  return { ...env, PATH: current.split(sep).includes(bin) ? current : `${bin}${sep}${current}` };
}

/**
 * An absolute path to sh, or the bare name when PATH already has one.
 * @returns {string|null} null when no POSIX shell can be found at all
 */
export function resolvePosixShell() {
  // Non-Windows: sh is at a known place, and PATH is reliable.
  if (process.platform !== 'win32') return existsSync('/bin/sh') ? '/bin/sh' : 'sh';

  const candidates = [];
  try {
    // .../mingw64/libexec/git-core -> .../usr/bin/sh.exe
    const execPath = execFileSync('git', ['--exec-path'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (execPath) {
      const install = resolve(execPath, '..', '..', '..');
      candidates.push(join(install, 'usr', 'bin', 'sh.exe'), join(install, 'bin', 'sh.exe'));
    }
  } catch { /* git missing is the caller's problem, not this helper's */ }

  candidates.push(
    join(process.env.ProgramFiles || 'C:\\Program Files', 'Git', 'usr', 'bin', 'sh.exe'),
    join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Git', 'usr', 'bin', 'sh.exe'),
  );

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  // Last resort: PATH may still have one (running inside Git Bash).
  try {
    execFileSync('sh', ['-c', 'exit 0'], { stdio: 'ignore' });
    return 'sh';
  } catch {
    return null;
  }
}
