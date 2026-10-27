import { test, expect } from '../fixtures/offline';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

/**
 * WB Pro lives in a private repo and plugs into the core registry with
 * registerBehaviorPack() (#1953). The core must load a pack's behaviors like
 * its own, and a pack must never replace a core behavior: loading Pro may add
 * behaviors, but Free markup has to behave the same with or without it.
 */

const PACK_DIR = pathToFileURL(resolve('tests/fixtures/behavior-pack') + '/').href;

test.describe('behavior packs', () => {
  test('a pack behavior registers and lazy-loads from the pack folder', async () => {
    const registry = await import('../../src/wb-viewmodels/index.js');
    const result = registry.registerBehaviorPack({
      name: 'testpack', baseUrl: PACK_DIR, behaviors: { packsparkle: 'fx' },
    });

    expect(result.added).toEqual(['packsparkle']);
    expect(registry.hasBehavior('packsparkle')).toBe(true);
    expect(registry.resolveBehaviorName('PackSparkle')).toBe('packsparkle');

    const fn = await registry.getBehavior('packsparkle');
    const element = { dataset: {} as Record<string, string> };
    fn(element);
    expect(element.dataset.packsparkle).toBe('applied');
  });

  test('a pack cannot replace a core behavior', async () => {
    const registry = await import('../../src/wb-viewmodels/index.js');
    const before = registry.behaviorModules.toast;
    const result = registry.registerBehaviorPack({
      name: 'testpack2', baseUrl: PACK_DIR, behaviors: { toast: 'fx' },
    });

    expect(result.skipped).toEqual(['toast']);
    expect(registry.behaviorModules.toast).toBe(before);
  });

  test('a runtime that subscribed first is told what a later pack added', async () => {
    // wb-lazy.js builds its selector list once, at load; this is how a pack
    // registered afterwards still gets its [x-name] attributes routed.
    const registry = await import('../../src/wb-viewmodels/index.js');
    const heard: string[][] = [];
    registry.onBehaviorPack((added: string[]) => heard.push(added));
    registry.registerBehaviorPack({ name: 'testpack3', baseUrl: PACK_DIR, behaviors: { packlistened: 'fx', toast: 'fx' } });
    expect(heard).toEqual([['packlistened']]);
  });
});
