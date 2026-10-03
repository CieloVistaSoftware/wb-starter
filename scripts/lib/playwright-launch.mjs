/**
 * How the async runner starts Playwright: WITHOUT a shell (#1194).
 *
 * scripts/test-async.mjs used to spawn("npx", args, { shell: true }). With a
 * shell, Node joins the arguments into one command line with no quoting, so
 * Windows cmd.exe (and sh) re-parse it: a --grep pattern containing "|" is read
 * as a pipe and the run dies in under two seconds with 0 tests, and a pattern
 * with spaces becomes several arguments. --grep is the documented way (Tier-1
 * Law 4) for an agent to run a filtered suite, so alternation was impossible
 * through the approved path.
 *
 * Starting Playwright's own CLI script with the current Node, and handing it the
 * argument ARRAY, means no argument is ever re-parsed by anything.
 */
import { fileURLToPath } from 'node:url';

/**
 * Playwright's CLI script. WB_PLAYWRIGHT_CLI lets the guard substitute a recorder
 * that writes down exactly the arguments it received.
 */
export function playwrightCli() {
  return process.env.WB_PLAYWRIGHT_CLI || fileURLToPath(import.meta.resolve('@playwright/test/cli'));
}

/**
 * The command and argument array that runs Playwright, from the list the runner
 * builds (['playwright', 'test', ...]). The leading 'playwright' is npx's name for
 * the tool, not an argument to it, so it is dropped.
 */
export function playwrightInvocation(cmdArgs) {
  const rest = cmdArgs[0] === 'playwright' ? cmdArgs.slice(1) : cmdArgs;
  return { command: process.execPath, args: [playwrightCli(), ...rest] };
}
