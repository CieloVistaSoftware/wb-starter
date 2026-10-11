import { test, expect, Page, Locator } from '../fixtures/offline';
import fs from 'fs';
import path from 'path';

/**
 * REGRESSION (#1845): every direction the slidein / slideout schemas declare
 * must play a real animation.
 *
 * slidein.schema.json documented `direction` as `left`, `right`, `top` or
 * `bottom`. slidein() in src/wb-viewmodels/effects.js plays the keyframe
 * `x-slide-in-${direction}`, and src/styles/behaviors/effects.css defines only
 * x-slide-in-left / -right / -up / -down. So `direction="top"` and `"bottom"`
 * -- two of the four documented values -- set an animation-name that matches no
 * @keyframes rule. That is not a CSS error: the element just does not move.
 *
 * The values under test are read from the schema, not hard-coded: the `enum`
 * plus every backticked value the description teaches. A schema that documents
 * a direction the code cannot animate fails here, whichever list it is in.
 *
 * The animation proof is the one tests/behaviors/effects-actions.spec.ts uses
 * (#847): the computed animation-name must resolve to an @keyframes rule that
 * a loaded stylesheet defines, and the browser must fire `animationstart`. An
 * unknown animation-name passes a plain `!== 'none'` check and animates
 * nothing, so that check alone would not catch this bug.
 */

const ROOT = process.cwd();

interface DirectionSchema {
  properties?: { direction?: { enum?: string[]; description?: string; default?: string } };
}

/** The direction values a behavior's schema declares or teaches. */
function declaredDirections(behavior: string): { values: string[]; enumValues: string[] } {
  const file = path.join(ROOT, 'src', 'wb-models', `${behavior}.schema.json`);
  const schema = JSON.parse(fs.readFileSync(file, 'utf8')) as DirectionSchema;
  const prop = schema.properties?.direction ?? {};
  const enumValues = prop.enum ?? [];
  const taught = Array.from((prop.description ?? '').matchAll(/`([a-z-]+)`/g), (m) => m[1]);
  const values = Array.from(new Set([...enumValues, ...taught, ...(prop.default ? [prop.default] : [])]));
  return { values, enumValues };
}

async function bootWB(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).WB && typeof (window as any).WB.scan === 'function', {
    timeout: 20000,
  });
}

/** Prepend markup in view and upgrade it through the public API. */
async function scanMarkup(page: Page, html: string): Promise<void> {
  await page.evaluate(async (markup) => {
    document.getElementById('wb-1845-probe')?.remove();
    const host = document.createElement('div');
    host.id = 'wb-1845-probe';
    host.style.cssText = 'position:relative;z-index:2147483000;display:flex;flex-wrap:wrap;gap:8px;';
    host.innerHTML = markup;
    document.body.prepend(host);
    window.scrollTo(0, 0);
    await (window as any).WB.scan(host, { eager: true });
  }, html);
}

/** Click `target`; return the animation-names it requested and which have no @keyframes. */
async function clickAndRead(target: Locator): Promise<{ requested: string[]; missing: string[] }> {
  await target.evaluate((el) => {
    (el as any).__starts = [];
    el.addEventListener('animationstart', (e) => {
      if (e.target === el) (el as any).__starts.push((e as AnimationEvent).animationName);
    });
  });
  await target.click();
  return target.evaluate((el) => {
    const defined = new Set<string>();
    const walk = (rules: CSSRuleList): void => {
      for (const r of Array.from(rules) as CSSRule[]) {
        if (r instanceof CSSKeyframesRule) defined.add(r.name);
        else if ((r as CSSGroupingRule).cssRules) {
          try { walk((r as CSSGroupingRule).cssRules); } catch { /* cross-origin */ }
        }
      }
    };
    for (const sheet of Array.from(document.styleSheets)) {
      try { walk(sheet.cssRules); } catch { /* cross-origin */ }
    }
    const requested = getComputedStyle(el).animationName
      .split(',')
      .map((n) => n.trim())
      .filter((n) => n && n !== 'none');
    return { requested, missing: requested.filter((n) => !defined.has(n)) };
  });
}

const CASES = [
  { behavior: 'slidein', keyframe: 'x-slide-in' },
  { behavior: 'slideout', keyframe: 'x-slide-out' },
];

test.describe('every declared slide direction animates (#1845)', () => {
  test.describe.configure({ timeout: 60000 });

  for (const c of CASES) {
    test(`${c.behavior}.schema.json declares its directions as an enum`, async () => {
      const { values, enumValues } = declaredDirections(c.behavior);
      expect(enumValues, `${c.behavior}.schema.json: direction must be an enum`).not.toEqual([]);
      expect(
        values.filter((v) => !enumValues.includes(v)),
        `${c.behavior}.schema.json: the description/default teach direction values the enum does not declare`
      ).toEqual([]);
    });

    test(`x-${c.behavior}: every declared direction plays a defined @keyframes`, async ({ page }) => {
      const { values } = declaredDirections(c.behavior);
      expect(values.length, `${c.behavior}.schema.json declares no direction values`).toBeGreaterThan(0);

      await bootWB(page);
      await scanMarkup(
        page,
        values
          .map((d) => `<button id="${c.behavior}-${d}" x-${c.behavior} direction="${d}">${d}</button>`)
          .join('')
      );

      const dead: string[] = [];
      for (const d of values) {
        const el = page.locator(`#${c.behavior}-${d}`);
        await expect(el, `x-${c.behavior} direction=${d} attached`).toHaveClass(
          new RegExp(`(^|\\s)x-${c.behavior}(\\s|$)`)
        );
        const state = await clickAndRead(el);
        expect(state.requested, `x-${c.behavior} direction=${d}: click set no animation-name`).toEqual([
          `${c.keyframe}-${d}`,
        ]);
        if (state.missing.length) {
          dead.push(`${d} -> ${state.missing.join(', ')}`);
          continue;
        }
        await expect
          .poll(async () => el.evaluate((n) => (n as any).__starts.length), {
            timeout: 5000,
            message: `x-${c.behavior} direction=${d}: no animationstart fired`,
          })
          .toBeGreaterThan(0);
      }

      expect(
        dead,
        `x-${c.behavior}: these schema-declared directions name an animation no stylesheet defines, ` +
          'so they render no animation'
      ).toEqual([]);
    });
  }
});
