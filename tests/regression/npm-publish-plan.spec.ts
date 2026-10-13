/**
 * Every push is published to npm under the badge's number (#1860).
 *
 * publish-npm.yml runs after every push to main; publishPlan() decides, per
 * package, whether to publish. It must publish a number npm does not have, do
 * nothing for one it has, and never publish an older number after a newer one:
 * runs can finish out of order, and npm moves "latest" to whatever was
 * published last.
 */
import { test, expect } from '../fixtures/offline';
import { publishPlan } from '../../scripts/lib/npm-publish-plan.mjs';

test('a number npm does not have is published', () => {
  expect(publishPlan('1.0.511', ['1.0.0', '1.0.510']).action).toBe('publish');
  expect(publishPlan('1.0.511', []).action).toBe('publish');
});

test('a number npm already has is left alone', () => {
  const plan = publishPlan('1.0.510', ['1.0.0', '1.0.510']);
  expect(plan.action).toBe('skip');
  expect(plan.why).toContain('already on npm');
});

test('an older number is never published after a newer one', () => {
  // 1.0.99 < 1.0.510 numerically, though "1.0.99" > "1.0.510" as text.
  const plan = publishPlan('1.0.99', ['1.0.0', '1.0.510']);
  expect(plan.action).toBe('skip');
  expect(plan.why).toContain('1.0.510');
  expect(publishPlan('1.0.511', ['1.0.0', '1.0.99']).action).toBe('publish');
});

test('anything that is not a version number is refused', () => {
  expect(() => publishPlan('1.0', [])).toThrow(/not a version number/);
  expect(() => publishPlan('1.0.511-dirty', [])).toThrow(/not a version number/);
});
