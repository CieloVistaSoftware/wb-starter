import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

/**
 * The scaffolder says when npm has a newer version of it.
 *
 * John, 2026-10-13: "add the update notice". npm tells no
 * one about a new version, and npx can run an old cached copy. The check must
 * never slow or break site creation: offline, CI and opt-out all print nothing.
 * No test here calls the registry; each passes its own fetch.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
// The spec's own name is the package's: create-<name>-update-notice.spec.ts.
const PKG_DIR = path.basename(fileURLToPath(import.meta.url)).replace(/-update-notice\.spec\.ts$/, '');
const LIB = path.join(ROOT, 'packages', PKG_DIR, 'lib', 'update-notice.js');
const { isNewer, updateMessage, checkForUpdate } = await import(pathToFileURL(LIB).href);

const registryFetch = (version: string) => async () => ({ ok: true, json: async () => ({ version }) });
const NO_ENV = {};
// Any package name works; the notice is built from the one it is given.
const PKG = { name: 'create-demo', version: '1.0.1' };

test('a higher version is newer; equal, lower and malformed are not', () => {
  expect(isNewer('1.0.2', '1.0.1')).toBe(true);
  expect(isNewer('1.1.0', '1.0.9')).toBe(true);
  expect(isNewer('2.0.0', '1.9.9')).toBe(true);
  expect(isNewer('1.0.10', '1.0.9')).toBe(true);
  expect(isNewer('1.0.1', '1.0.1')).toBe(false);
  expect(isNewer('1.0.0', '1.0.1')).toBe(false);
  expect(isNewer('nonsense', '1.0.1')).toBe(false);
});

test('the notice names both versions and the command to get the latest', () => {
  const message = updateMessage('create-demo', '1.0.2', '1.0.1');
  expect(message).toContain('1.0.1 -> 1.0.2');
  expect(message).toContain('A newer create-demo is out');
  expect(message).toContain('npm create demo@latest');
  expect(updateMessage('create-demo', '1.0.1', '1.0.1')).toBe('');
});

test('a newer version on npm produces the notice', async () => {
  expect(await checkForUpdate(PKG, { env: NO_ENV, fetchFn: registryFetch('1.0.2') })).toContain('1.0.1 -> 1.0.2');
});

test('the same version on npm prints nothing', async () => {
  expect(await checkForUpdate(PKG, { env: NO_ENV, fetchFn: registryFetch('1.0.1') })).toBe('');
});

test('offline, a registry error, CI and NO_UPDATE_NOTIFIER all print nothing', async () => {
  const offline = async () => { throw new Error('getaddrinfo ENOTFOUND registry.npmjs.org'); };
  const serverError = async () => ({ ok: false, json: async () => ({}) });
  expect(await checkForUpdate(PKG, { env: NO_ENV, fetchFn: offline })).toBe('');
  expect(await checkForUpdate(PKG, { env: NO_ENV, fetchFn: serverError })).toBe('');
  expect(await checkForUpdate(PKG, { env: { CI: 'true' }, fetchFn: registryFetch('9.0.0') })).toBe('');
  expect(await checkForUpdate(PKG, { env: { NO_UPDATE_NOTIFIER: '1' }, fetchFn: registryFetch('9.0.0') })).toBe('');
});
