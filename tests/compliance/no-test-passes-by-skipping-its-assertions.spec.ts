import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

/**
 * #1092: a test whose every expect() sits inside an if() asserts NOTHING when
 * the condition is false -- and passes. On a docs page rendering zero links,
 * "page links have correct hrefs" was green. 52 tests had that shape; each was
 * read and given an unconditional precondition, an explicit test.skip(reason),
 * or confirmed as real branching.
 *
 * This walks every spec's AST and flags a test when some path through its body
 * reaches no expect() and at least one expect() is under an if(). Loops count
 * as possibly-empty. It is deliberately conservative; a test that branches
 * legitimately goes in REVIEWED with the reason it is safe, and that list may
 * only shrink.
 */
const REVIEWED: Record<string, { count: number; why: string }> = {
  'tests/behaviors/functional-runner.spec.ts': { count: 5, why: 'every generated test ends in expectRowAsserted(), which fails a row that asserted nothing (#1092)' },
  'tests/behaviors/button-permutations.spec.ts': { count: 1, why: 'both target branches assert in full; an empty TARGETS list fails its own enum test' },
  'tests/compliance/page-compliance.spec.ts': { count: 1, why: 'every spec row must declare required or minCount, asserted unconditionally (#1092)' },
  'tests/demos/broken-requests-classification.spec.ts': { count: 2, why: 'oracle rows: an unconditional expect.soft runs before the branch, over fixed lists whose size is asserted' },
};

function specFiles(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== 'fixtures') specFiles(p, out); }
    else if (/\.spec\.(ts|js|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}

const isExpect = (n: ts.Node): boolean => {
  if (!ts.isCallExpression(n)) return false;
  let e: ts.Expression = n.expression;
  while (ts.isPropertyAccessExpression(e) || ts.isCallExpression(e)) e = e.expression;
  return ts.isIdentifier(e) && e.text === 'expect';
};
const isTestCall = (n: ts.Node): n is ts.CallExpression => {
  if (!ts.isCallExpression(n)) return false;
  const e = n.expression;
  const name = ts.isIdentifier(e) ? e.text
    : ts.isPropertyAccessExpression(e) && ts.isIdentifier(e.expression) ? `${e.expression.text}.${e.name.text}` : '';
  return name === 'test' || name === 'it' || name === 'test.only';
};
/** Does every path through `node` reach an expect()? Conservative. */
function always(node: ts.Node | undefined): boolean {
  if (!node) return false;
  if (ts.isIfStatement(node)) return always(node.thenStatement) && always(node.elseStatement);
  if (ts.isBlock(node)) return node.statements.some(always);
  if (ts.isConditionalExpression(node)) return always(node.whenTrue) && always(node.whenFalse);
  if (ts.isForStatement(node) || ts.isForOfStatement(node) || ts.isForInStatement(node) || ts.isWhileStatement(node)) return false;
  if (ts.isTryStatement(node)) return always(node.tryBlock) || always(node.finallyBlock);
  if (ts.isFunctionLike(node)) return false;
  if (ts.isBinaryExpression(node)
    && (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken || node.operatorToken.kind === ts.SyntaxKind.BarBarToken)) return always(node.left);
  if (isExpect(node)) return true;
  let found = false;
  ts.forEachChild(node, (c) => { if (!found && always(c)) found = true; });
  return found;
}
function contains(node: ts.Node, pred: (n: ts.Node) => boolean): boolean {
  let found = false;
  const v = (n: ts.Node) => { if (found) return; if (pred(n)) { found = true; return; } ts.forEachChild(n, v); };
  v(node);
  return found;
}

function scan(): Record<string, string[]> {
  const root = process.cwd();
  const hits: Record<string, string[]> = {};
  for (const file of specFiles(path.join(root, 'tests'))) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const visit = (n: ts.Node) => {
      if (isTestCall(n)) {
        const fn = n.arguments.find((a) => ts.isArrowFunction(a) || ts.isFunctionExpression(a)) as ts.ArrowFunction | undefined;
        if (fn?.body && contains(fn.body, isExpect) && !always(fn.body)
          && contains(fn.body, (x) => ts.isIfStatement(x) && contains(x, isExpect))) {
          const title = n.arguments[0] && ts.isStringLiteralLike(n.arguments[0]) ? n.arguments[0].text : '(computed title)';
          (hits[rel] ||= []).push(title);
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }
  return hits;
}

test('no test can pass by skipping all of its assertions (#1092)', () => {
  const hits = scan();
  const offenders: string[] = [];
  for (const [file, titles] of Object.entries(hits)) {
    const allowed = REVIEWED[file]?.count ?? 0;
    if (titles.length > allowed) {
      offenders.push(`${file}: ${titles.length} test(s) whose expects can all be skipped (reviewed: ${allowed}) -- ${titles.join(' | ')}`);
    }
  }
  expect(offenders, 'assert the precondition unconditionally, or test.skip(condition, reason) -- a silent pass is not a pass').toEqual([]);
});

test('the reviewed list only shrinks (#1092)', () => {
  const hits = scan();
  const stale = Object.entries(REVIEWED)
    .filter(([file, { count }]) => (hits[file]?.length ?? 0) < count)
    .map(([file, { count }]) => `${file}: reviewed ${count}, now ${hits[file]?.length ?? 0} -- lower the count`);
  expect(stale).toEqual([]);
});
