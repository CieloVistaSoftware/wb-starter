// Builder Component Permutations
// Note: Builder is a page tool, not a data-wb behavior component
// These tests verify builder rendering with various property combinations

import { test, expect, Page, Locator } from '@playwright/test';

type Permutation = {
  desc: string;
  html: string;
  // Optional explicit expectations:
  expectedClasses?: string[];
  unexpectedClasses?: string[];
  attrs?: Record<string, string | RegExp | boolean>;
};

const permutations: Permutation[] = [
  {
    desc: 'Default builder component',
    html: '<div data-wb="builder" data-label="Test" data-icon="🧩"></div>',
    attrs: { 'data-label': /Test/, 'data-icon': /🧩/ },
    expectedClasses: ['wb-builder'], // base class, adjust to your actual base class
  },
  {
    desc: 'Dark theme',
    html: '<div data-wb="builder" data-label="Test" data-icon="🧩" data-theme="dark"></div>',
    expectedClasses: ['wb-builder--theme-dark'],
    unexpectedClasses: ['wb-builder--theme-light'],
  },
  {
    desc: 'Info variant',
    html: '<div data-wb="builder" data-label="Test" data-icon="🧩" data-variant="info"></div>',
    expectedClasses: ['wb-builder--variant-info'],
  },
  {
    desc: 'Clickable',
    html: '<div data-wb="builder" data-label="Test" data-icon="🧩" data-clickable></div>',
    expectedClasses: ['wb-builder--clickable'],
  },
  {
    desc: 'Not hoverable',
    html: '<div data-wb="builder" data-label="Test" data-icon="🧩" data-hoverable="false"></div>',
    unexpectedClasses: ['wb-builder--hoverable'],
  },
  {
    desc: 'Elevated',
    html: '<div data-wb="builder" data-label="Test" data-icon="🧩" data-elevated></div>',
    expectedClasses: ['wb-builder--elevated'],
  },
  {
    desc: 'All features',
    html: '<div data-wb="builder" data-label="Test" data-icon="🧩" data-theme="info" data-variant="success" data-clickable data-hoverable="true" data-elevated></div>',
    expectedClasses: [
      'wb-builder--theme-info',
      'wb-builder--variant-success',
      'wb-builder--clickable',
      'wb-builder--hoverable',
      'wb-builder--elevated',
    ],
  },
];

// --- helpers ---------------------------------------------------------------

function normalizeDataValue(raw: string | null): string | boolean {
  if (raw === null) return '';
  if (raw === '') return true; // boolean attribute present
  if (raw.toLowerCase() === 'true') return true;
  if (raw.toLowerCase() === 'false') return false;
  return raw;
}

async function injectPermutation(page: Page, html: string) {
  await page.evaluate(async (markup) => {
    // Wait for window.add to be available (max 2s)
    let tries = 0;
    while (typeof (window as any).add !== 'function' && tries < 20) {
      await new Promise(r => setTimeout(r, 100));
      tries++;
    }
    const container = document.createElement('div');
    container.innerHTML = markup.trim();
    const el = container.firstElementChild as HTMLElement | null;
    if (!el) throw new Error('Permutation HTML did not produce an element');

    // Build the object your builder's add() expects.
    const data: any = { b: 'builder', n: 'Test', d: {} as Record<string, any> };
    for (const attr of Array.from(el.attributes)) {
      if (!attr.name.startsWith('data-')) continue;
      const key = attr.name.replace('data-', '');
      const v = attr.value;
      data.d[key] = v === '' ? true : v;
    }

    const canvas = document.getElementById('canvas');
    if (!canvas) throw new Error('Missing #canvas on builder page');

    // Clear between runs
    canvas.innerHTML = '';

    if (typeof (window as any).add === 'function') {
      (window as any).add(data);
    } else {
      canvas.appendChild(el);
    }
  }, html);
}

async function getBuilder(page: Page): Promise<Locator> {
  // Wait for the .dropped wrapper to appear in the DOM
  await page.waitForSelector('.dropped', { state: 'attached', timeout: 5000 });
  const wrapper = page.locator('.dropped').first();
  await expect(wrapper).toBeVisible();
  // Return the inner builder element for attribute/class checks
  const builder = wrapper.locator('[data-wb="builder"]').first();
  return builder;
}

async function expectAttributes(builder: Locator, attrs?: Permutation['attrs']) {
  if (!attrs) return;

  for (const [name, expected] of Object.entries(attrs)) {
    if (expected === true) {
      // boolean attribute present: in HTML it may be "" or "true" depending on your rendering
      await expect(builder).toHaveAttribute(name, /^(|true)$/);
    } else if (expected instanceof RegExp) {
      await expect(builder).toHaveAttribute(name, expected);
    } else {
      await expect(builder).toHaveAttribute(name, String(expected));
    }
  }
}

async function expectClasses(builder: Locator, expected?: string[], unexpected?: string[]) {
  // Playwright's toHaveClass is strict if you pass array; here we just check contains.
  if (expected?.length) {
    for (const cls of expected) {
      await expect(builder).toHaveClass(new RegExp(`(^|\\s)${cls}(\\s|$)`));
    }
  }
  if (unexpected?.length) {
    for (const cls of unexpected) {
      await expect(builder).not.toHaveClass(new RegExp(`(^|\\s)${cls}(\\s|$)`));
    }
  }
}

// --- tests -----------------------------------------------------------------

test.describe('Builder Component Permutations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/builder.html');
  });

  for (const perm of permutations) {
    test(perm.desc, async ({ page }) => {
      await injectPermutation(page, perm.html);

      const builder = await getBuilder(page);

      // Attribute checks (label/icon etc.)
      await expectAttributes(builder, perm.attrs);

      // Auto-derive some expected classes from data-* (optional but handy)
      // This avoids repeating theme/variant assertions across permutations.
      const derived = await page.evaluate(() => {
        const el = document.querySelector('[data-wb="builder"]') as HTMLElement | null;
        if (!el) return null;

        const d: Record<string, any> = {};
        for (const attr of Array.from(el.attributes)) {
          if (!attr.name.startsWith('data-')) continue;
          d[attr.name.replace('data-', '')] = attr.value;
        }
        return d;
      });

      // Derived expectation: theme + variant
      // (If your implementation *always* adds these, this becomes a strong contract.)
      const html = perm.html;
      const themeMatch = html.match(/data-theme="([^"]+)"/);
      const variantMatch = html.match(/data-variant="([^"]+)"/);

      if (themeMatch?.[1]) {
        await expect(builder).toHaveClass(new RegExp(`wb-builder--theme-${themeMatch[1]}`));
      }
      if (variantMatch?.[1]) {
        await expect(builder).toHaveClass(new RegExp(`wb-builder--variant-${variantMatch[1]}`));
      }

      // Clickable / hoverable / elevated
      if (html.includes('data-clickable')) {
        await expect(builder).toHaveClass(/wb-builder--clickable/);
      }
      if (html.includes('data-hoverable="false"')) {
        await expect(builder).not.toHaveClass(/wb-builder--hoverable/);
      }
      if (html.includes('data-hoverable="true"')) {
        await expect(builder).toHaveClass(/wb-builder--hoverable/);
      }
      if (html.includes('data-elevated')) {
        await expect(builder).toHaveClass(/wb-builder--elevated/);
      }

      // Explicit class expectations (strongest)
      await expectClasses(builder, perm.expectedClasses, perm.unexpectedClasses);

      // Tiny sanity check: inline styles present (only if your builder injects them)
      // Uncomment if applicable:
      // const style = await builder.getAttribute('style');
      // expect(style).toBeTruthy();
    });
  }
});
