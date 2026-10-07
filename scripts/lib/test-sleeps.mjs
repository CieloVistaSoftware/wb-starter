/**
 * Every fixed sleep in the spec files, classified by what follows it (#1516).
 *
 * A sleep is a guess about how fast the machine is. It passes on an idle box
 * and fails on a loaded one -- the signature of #961. But not every sleep is a
 * defect, so this classifies before it counts:
 *
 *   positive   sleep, then a one-time check that something IS true
 *              (`expect(value).toBe(true)` on a value read once). That is
 *              waiting FOR an event with a guess instead of a condition: the
 *              defect. Fix: wait on the condition (expect.poll, a retrying
 *              matcher, elementReady/buildInView in tests/base.ts).
 *   redundant  sleep, then -- with no action in between -- a RETRYING positive
 *              assertion (`await expect(locator).toHaveAttribute(...)`,
 *              expect.poll). The assertion already waits for its condition,
 *              so the sleep only adds time. Fix: delete it.
 *   negative   sleep, then a check that something did NOT happen (`.not.`,
 *              toBeHidden, toHaveCount(0), toBe(false) ...). Usually legitimate,
 *              because there is no event to wait for -- but a toBe(false) after
 *              a click that should close something is really a positive, so
 *              this is triage, not a verdict.
 *   setup      no assertion follows in the same block (a sleep at the end of a
 *              helper or beforeEach, "let the page settle"), or an action sits
 *              between the sleep and the assertion, so the sleep guards that
 *              action's starting state. Still a guess; the fix is to wait for
 *              the state the next step needs.
 *   marked     carries `// sleep-proves-negative: <reason>` on its line or the
 *              line above: a reviewed, deliberate negative proof.
 *   poll       the interval of a polling loop: the sleep sits in a loop that
 *              breaks (or returns) when a condition holds, or that runs
 *              against a deadline (`while (Date.now() < deadline)`). That IS
 *              waiting on the condition -- the sleep only paces the checks --
 *              so it is not a guess. expect.poll says it more plainly, but
 *              this is not the defect.
 *
 * Sleeps found:
 *   - `<x>.waitForTimeout(<n>)`                      Playwright's own sleep
 *   - `new Promise((r) => setTimeout(r, <n>))`       a promise sleep, in the test
 *                                                    or inside page.evaluate
 *   - `setTimeout(resolve, <n>)` in a Promise executor, any parameter name
 *
 * TypeScript's parser finds them, so a sleep in a comment or a string is not
 * counted and a multi-line call is.
 */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

export const MARKER = 'sleep-proves-negative:';

/** The matcher names that assert something did NOT happen (or is empty / off). */
const NEGATIVE_MATCHERS = new Set([
  'toBeHidden', 'toBeFalsy', 'toBeNull', 'toBeUndefined', 'toBeDisabled', 'toBeNaN',
]);

/** True when `node` is a sleep call; returns the delay text when it is. */
function sleepOf(node) {
  if (!ts.isCallExpression(node)) return null;
  const callee = node.expression;
  // page.waitForTimeout(n), frame.waitForTimeout(n)
  if (ts.isPropertyAccessExpression(callee) && callee.name.text === 'waitForTimeout') {
    return { kind: 'waitForTimeout', delay: node.arguments[0] ? node.arguments[0].getText() : '?' };
  }
  // setTimeout(r, n) where r is the parameter of an enclosing Promise executor.
  if (ts.isIdentifier(callee) && callee.text === 'setTimeout' && node.arguments.length >= 2) {
    const first = node.arguments[0];
    if (!ts.isIdentifier(first)) return null;
    for (let p = node.parent; p; p = p.parent) {
      if ((ts.isArrowFunction(p) || ts.isFunctionExpression(p)) && p.parent && ts.isNewExpression(p.parent)
        && ts.isIdentifier(p.parent.expression) && p.parent.expression.text === 'Promise') {
        const param = p.parameters[0];
        if (param && ts.isIdentifier(param.name) && param.name.text === first.text) {
          return { kind: 'setTimeout', delay: node.arguments[1].getText() };
        }
        return null;
      }
    }
  }
  return null;
}

/** True when an if-guarded break/return sits in `body` (not in a nested function). */
function exitsOnCondition(body) {
  let found = false;
  const visit = (n) => {
    if (found || ts.isFunctionLike(n)) return;
    if ((ts.isBreakStatement(n) || ts.isReturnStatement(n))) {
      for (let p = n.parent; p && p !== body; p = p.parent) if (ts.isIfStatement(p)) { found = true; return; }
    }
    ts.forEachChild(n, visit);
  };
  visit(body);
  return found;
}

/** True when `node` paces a polling loop: see `poll` above. */
function inPollLoop(node) {
  for (let p = node.parent; p; p = p.parent) {
    if (ts.isFunctionLike(p)) {
      // A sleep helper's own body (const sleep = ...) is not the loop; keep
      // climbing only through the Promise executor of the sleep itself.
      if (p.parent && ts.isNewExpression(p.parent)) continue;
      return false;
    }
    if (ts.isWhileStatement(p) || ts.isDoStatement(p) || ts.isForStatement(p)) {
      const cond = ts.isForStatement(p) ? (p.condition ? p.condition.getText() : '') : p.expression.getText();
      return /\b(Date|performance)\.now\(\)|deadline|until/i.test(cond) || exitsOnCondition(p.statement);
    }
  }
  return false;
}

/** Playwright's web-first matchers: each retries until it passes or times out. */
const RETRYING = new Set([
  'toBeAttached', 'toBeChecked', 'toBeDisabled', 'toBeEditable', 'toBeEmpty', 'toBeEnabled',
  'toBeFocused', 'toBeHidden', 'toBeInViewport', 'toBeVisible', 'toContainText', 'toHaveAccessibleDescription',
  'toHaveAccessibleName', 'toHaveAttribute', 'toHaveClass', 'toHaveCount', 'toHaveCSS', 'toHaveId',
  'toHaveJSProperty', 'toHaveRole', 'toHaveScreenshot', 'toHaveText', 'toHaveValue', 'toHaveValues',
  'toHaveTitle', 'toHaveURL', 'toContainClass', 'toPass',
]);

/** Classify one expect(...) chain: 'negative', 'redundant' (it retries) or 'positive'. */
function expectKind(call) {
  // Walk the chain: expect(x).not.toBe(y) -> names ['not', 'toBe']
  const names = [];
  let lastArgs = [];
  let n = call;
  while (n) {
    if (ts.isCallExpression(n)) {
      if (ts.isPropertyAccessExpression(n.expression)) { names.unshift(n.expression.name.text); if (!lastArgs.length) lastArgs = n.arguments; n = n.expression.expression; continue; }
      break;
    }
    if (ts.isPropertyAccessExpression(n)) { names.unshift(n.name.text); n = n.expression; continue; }
    break;
  }
  const matcher = names[names.length - 1];
  const arg = lastArgs[0] ? lastArgs[0].getText().replace(/\s+/g, '') : '';
  // Negative first: a retrying `.not.toBeVisible()` passes at once while the
  // thing is still absent, so a sleep before it is doing the proving.
  if (names.includes('not')) return 'negative';
  if (NEGATIVE_MATCHERS.has(matcher)) return 'negative';
  if ((matcher === 'toBe' || matcher === 'toEqual' || matcher === 'toStrictEqual') && /^(false|0|null|undefined|\[\]|''|""|``)$/.test(arg)) return 'negative';
  if ((matcher === 'toHaveCount' || matcher === 'toHaveLength') && arg === '0') return 'negative';
  // expect.poll(...) and web-first matchers wait for their own condition; a
  // sleep before a positive one only adds time.
  if (names[0] === 'poll' || RETRYING.has(matcher)) return 'redundant';
  return 'positive';
}

/** The outermost expect-chain call containing `expect(` found under `node`, in source order. */
function firstExpect(node) {
  let found = null;
  const visit = (n) => {
    if (found) return;
    // The outermost call of a chain whose root is expect(...) / expect.soft(...) / expect.poll(...)
    if (ts.isCallExpression(n) && !(n.parent && ts.isPropertyAccessExpression(n.parent) && n.parent.parent && ts.isCallExpression(n.parent.parent))) {
      let root = n;
      while (root && (ts.isCallExpression(root) || ts.isPropertyAccessExpression(root))) {
        root = ts.isCallExpression(root) ? root.expression : root.expression;
      }
      if (root && ts.isIdentifier(root) && root.text === 'expect') { found = n; return; }
    }
    ts.forEachChild(n, visit);
  };
  visit(node);
  return found;
}

/** The statement directly containing `node`, and the statements after it in its block. */
function statementsAfter(node) {
  let stmt = node;
  while (stmt.parent && !(ts.isBlock(stmt.parent) || ts.isSourceFile(stmt.parent) || ts.isCaseClause(stmt.parent))) stmt = stmt.parent;
  const list = stmt.parent ? stmt.parent.statements : [];
  const i = list ? list.indexOf(stmt) : -1;
  return i < 0 ? [] : list.slice(i + 1);
}

/**
 * @param {string} file  repo-relative path
 * @param {string} text  file contents
 * @returns {{file:string,line:number,kind:string,delay:string,class:string,reason?:string,inBrowser:boolean}[]}
 */
export function sleepsIn(file, text) {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const lines = text.split('\n');
  const out = [];
  const visit = (node) => {
    const s = sleepOf(node);
    if (s) {
      const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line; // 0-based
      const here = lines[line] || '';
      const above = lines[line - 1] || '';
      const markLine = here.includes(MARKER) ? here : above.includes(MARKER) ? above : null;
      let cls;
      let reason;
      if (markLine) {
        cls = 'marked';
        reason = markLine.slice(markLine.indexOf(MARKER) + MARKER.length).trim();
      } else if (inPollLoop(node)) {
        cls = 'poll';
      } else {
        // Up to the next sleep in the same block: the first assertion decides.
        let next = null;
        // An action (an awaited call that is not an assertion) between the
        // sleep and the assertion means the sleep may be guarding that
        // action's starting state, not the assertion: count it as setup.
        let actionBefore = false;
        for (const st of statementsAfter(node)) {
          let hasSleep = false;
          const scan = (n) => { if (!hasSleep && sleepOf(n)) hasSleep = true; else ts.forEachChild(n, scan); };
          scan(st);
          next = firstExpect(st);
          if (next || hasSleep) break;
          if (/\bawait\b/.test(st.getText())) actionBefore = true;
        }
        cls = next ? expectKind(next) : 'setup';
        if (cls === 'redundant' && actionBefore) cls = 'setup';
      }
      // Inside a page.evaluate / addInitScript callback: the sleep runs in the browser.
      let inBrowser = false;
      for (let p = node.parent; p; p = p.parent) {
        if (ts.isCallExpression(p) && ts.isPropertyAccessExpression(p.expression)
          && /^(evaluate|evaluateHandle|addInitScript|\$eval|\$\$eval|waitForFunction)$/.test(p.expression.name.text)) { inBrowser = true; break; }
      }
      out.push({ file, line: line + 1, kind: s.kind, delay: s.delay, class: cls, ...(reason !== undefined ? { reason } : {}), inBrowser });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

/** Every *.spec.ts file under tests/, repo-relative, sorted. */
export function specFiles(root) {
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = path.posix.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules') walk(rel); }
      else if (/\.spec\.ts$/.test(e.name)) out.push(rel);
    }
  };
  walk('tests');
  return out.sort();
}

/** All sleeps in the suite. */
export function allSleeps(root) {
  return specFiles(root).flatMap((f) => sleepsIn(f, fs.readFileSync(path.join(root, f), 'utf8')));
}
