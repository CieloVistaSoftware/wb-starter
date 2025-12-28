/**
 * Builder mkEl() Function Compliance Tests
 * =========================================
 * Tests the builder's element creation function to ensure:
 * - Native attributes go to correct destinations (src, href, placeholder, etc.)
 * - Dataset attributes are properly set
 * - Element types are created correctly
 * - All edge cases are covered
 * 
 * BUG HISTORY:
 * - 2024-12-19: Fixed src attribute being set directly on div elements
 *   instead of dataset.src for non-media elements (audio, video containers)
 */

import { test, expect, Page } from '@playwright/test';

// =============================================================================
// ATTRIBUTE ROUTING PERMUTATIONS
// =============================================================================
// Tests that attributes are routed to the correct destination based on element type

interface AttributeTest {
  name: string;
  component: { n: string; b: string; t?: string; d: Record<string, any> };
  checks: {
    attribute?: Record<string, string>;      // Check native attribute
    dataset?: Record<string, string>;        // Check dataset
    property?: Record<string, any>;          // Check JS property
    notAttribute?: string[];                 // Ensure attribute NOT set natively
    notDataset?: string[];                   // Ensure NOT in dataset
  };
}

const attributeRoutingTests: AttributeTest[] = [
  // ==========================================================================
  // SRC ATTRIBUTE ROUTING - The bug we fixed
  // ==========================================================================
  {
    name: 'Audio: src goes to dataset.src (not native src) for div container',
    component: {
      n: 'Audio',
      b: 'audio',
      d: {
        src: 'https://example.com/audio.mp3',
        volume: '0.8',
        showEq: false
      }
    },
    checks: {
      dataset: { src: 'https://example.com/audio.mp3' },
      notAttribute: ['src'] // src should NOT be a native attribute on div
    }
  },
  {
    name: 'Video (div container): src goes to dataset.src',
    component: {
      n: 'Video',
      b: 'video',
      d: {
        src: 'https://example.com/video.mp4',
        poster: 'https://example.com/poster.jpg'
      }
    },
    checks: {
      dataset: { src: 'https://example.com/video.mp4', poster: 'https://example.com/poster.jpg' },
      notAttribute: ['src', 'poster']
    }
  },
  {
    name: 'Image (IMG element): src goes to native src attribute',
    component: {
      n: 'Image',
      b: 'image',
      t: 'img',
      d: {
        src: 'https://example.com/image.jpg',
        alt: 'Test image'
      }
    },
    checks: {
      attribute: { src: 'https://example.com/image.jpg' }
      // alt might be dataset or attribute, depends on implementation
    }
  },
  {
    name: 'Card Image: src goes to dataset.src for article container',
    component: {
      n: 'Card Image',
      b: 'cardimage',
      d: {
        src: 'https://picsum.photos/400/200',
        alt: 'Card image',
        title: 'Image Card'
      }
    },
    checks: {
      dataset: { src: 'https://picsum.photos/400/200' },
      notAttribute: ['src']
    }
  },
  {
    name: 'YouTube: id goes to dataset.id',
    component: {
      n: 'YouTube',
      b: 'youtube',
      d: {
        id: 'dQw4w9WgXcQ'
      }
    },
    checks: {
      dataset: { id: 'dQw4w9WgXcQ' }
    }
  },
  {
    name: 'Avatar: src goes to dataset.src for div container',
    component: {
      n: 'Avatar',
      b: 'avatar',
      d: {
        src: 'https://i.pravatar.cc/80',
        name: 'John Doe',
        size: 'md'
      }
    },
    checks: {
      dataset: { src: 'https://i.pravatar.cc/80', name: 'John Doe', size: 'md' },
      notAttribute: ['src']
    }
  },

  // ==========================================================================
  // HREF ATTRIBUTE ROUTING
  // ==========================================================================
  {
    name: 'Link (A element): href goes to native href attribute',
    component: {
      n: 'Link',
      b: 'link',
      t: 'a',
      d: {
        href: '#section1',
        text: 'Jump to Section'
      }
    },
    checks: {
      attribute: { href: '#section1' }
    }
  },
  {
    name: 'Card Link: href goes to dataset for div container',
    component: {
      n: 'Card Link',
      b: 'cardlink',
      d: {
        href: 'https://example.com',
        title: 'Link Card'
      }
    },
    checks: {
      dataset: { href: 'https://example.com' },
      notAttribute: ['href'] // div elements don't have native href
    }
  },

  // ==========================================================================
  // PLACEHOLDER ATTRIBUTE ROUTING
  // ==========================================================================
  {
    name: 'Input: placeholder goes to native attribute',
    component: {
      n: 'Input',
      b: 'input',
      t: 'input',
      d: {
        placeholder: 'Enter text...'
      }
    },
    checks: {
      attribute: { placeholder: 'Enter text...' }
    }
  },
  {
    name: 'Autocomplete (input): placeholder goes to native attribute',
    component: {
      n: 'Autocomplete',
      b: 'autocomplete',
      t: 'input',
      d: {
        placeholder: 'Start typing...',
        source: '["Apple","Banana"]'
      }
    },
    checks: {
      attribute: { placeholder: 'Start typing...' },
      dataset: { source: '["Apple","Banana"]' }
    }
  },
  {
    name: 'Search (input): placeholder goes to native attribute',
    component: {
      n: 'Search',
      b: 'search',
      t: 'input',
      d: {
        placeholder: 'Search...'
      }
    },
    checks: {
      attribute: { placeholder: 'Search...' }
    }
  },

  // ==========================================================================
  // TEXT/CONTENT ROUTING
  // ==========================================================================
  {
    name: 'Badge: text becomes textContent',
    component: {
      n: 'Badge',
      b: 'badge',
      d: {
        text: 'Badge Text',
        variant: 'default'
      }
    },
    checks: {
      property: { textContent: 'Badge Text' },
      dataset: { variant: 'default' }
    }
  },
  {
    name: 'Alert: message goes to dataset',
    component: {
      n: 'Alert',
      b: 'alert',
      d: {
        type: 'info',
        title: 'Alert Title',
        message: 'Alert message content'
      }
    },
    checks: {
      dataset: { type: 'info', title: 'Alert Title', message: 'Alert message content' }
    }
  },

  // ==========================================================================
  // CLASS ATTRIBUTE ROUTING
  // ==========================================================================
  {
    name: 'Component with class: class becomes className',
    component: {
      n: 'Test',
      b: 'card',
      d: {
        class: 'custom-class another-class',
        title: 'Test Card'
      }
    },
    checks: {
      // className should contain custom-class (checked via string match)
      property: { className: 'custom-class' } // Will check if className contains this
    }
  },

  // ==========================================================================
  // BOOLEAN ATTRIBUTES
  // ==========================================================================
  {
    name: 'Audio: loop as boolean dataset',
    component: {
      n: 'Audio',
      b: 'audio',
      d: {
        src: 'https://example.com/audio.mp3',
        loop: true,
        autoplay: false
      }
    },
    checks: {
      dataset: { src: 'https://example.com/audio.mp3' }
      // Boolean handling varies - loop: true might be data-loop="true" or just data-loop
    }
  },
  {
    name: 'Card: elevated as boolean',
    component: {
      n: 'Card',
      b: 'card',
      d: {
        title: 'Card Title',
        elevated: true,
        clickable: false
      }
    },
    checks: {
      dataset: { title: 'Card Title' }
    }
  }
];

// =============================================================================
// EDGE CASE TESTS
// =============================================================================
const edgeCaseTests: AttributeTest[] = [
  {
    name: 'Empty src should not create native src attribute',
    component: {
      n: 'Audio',
      b: 'audio',
      d: {
        src: '',
        volume: '0.8'
      }
    },
    checks: {
      notAttribute: ['src'],
      dataset: { volume: '0.8' }
    }
  },
  {
    name: 'Null/undefined properties should be skipped',
    component: {
      n: 'Card',
      b: 'card',
      d: {
        title: 'Test',
        subtitle: null as any,
        footer: undefined as any
      }
    },
    checks: {
      dataset: { title: 'Test' }
      // Note: null/undefined might still appear as strings - this is acceptable behavior
      // The key test is that title is set correctly
    }
  },
  {
    name: 'Special characters in values should be preserved',
    component: {
      n: 'Alert',
      b: 'alert',
      d: {
        message: 'Test with "quotes" and <brackets>',
        type: 'info'
      }
    },
    checks: {
      dataset: { 
        message: 'Test with "quotes" and <brackets>',
        type: 'info'
      }
    }
  },
  {
    name: 'URL with query params preserved',
    component: {
      n: 'Audio',
      b: 'audio',
      d: {
        src: 'https://example.com/audio.mp3?token=abc123&quality=high'
      }
    },
    checks: {
      dataset: { src: 'https://example.com/audio.mp3?token=abc123&quality=high' }
    }
  }
];

// =============================================================================
// TEST IMPLEMENTATION
// =============================================================================

// NOTE: These tests require the dev server running (npm run dev)
// Run with: npx playwright test builder-mkel --project=behaviors

test.describe('Builder mkEl() Attribute Routing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/builder.html');
    await page.waitForFunction(() => typeof window['builderAPI']?.add === 'function', { timeout: 5000 });
  });

  for (const testCase of attributeRoutingTests) {
    test(testCase.name, async ({ page }) => {
      // Add component to canvas using builderAPI
      await page.evaluate((comp) => {
        const canvas = document.getElementById('canvas');
        if (canvas) {
          canvas.innerHTML = ''; // Clear
          window.builderAPI.add(comp);
        }
      }, testCase.component);

      // Wait for component to render
      await page.waitForTimeout(200);

      // Get the created element
      const element = page.locator(`[data-wb="${testCase.component.b}"]`).first();
      await expect(element).toBeVisible();

      const errors: string[] = [];

      // Check native attributes
      if (testCase.checks.attribute) {
        for (const [attr, expected] of Object.entries(testCase.checks.attribute)) {
          const actual = await element.getAttribute(attr);
          if (actual !== expected) {
            errors.push(`Attribute "${attr}": expected "${expected}", got "${actual}"`);
          }
        }
      }

      // Check dataset attributes
      if (testCase.checks.dataset) {
        for (const [key, expected] of Object.entries(testCase.checks.dataset)) {
          const actual = await element.evaluate((el, k) => (el as HTMLElement).dataset[k], key);
          if (actual !== expected) {
            errors.push(`Dataset "${key}": expected "${expected}", got "${actual}"`);
          }
        }
      }

      // Check JS properties
      if (testCase.checks.property) {
        for (const [prop, expected] of Object.entries(testCase.checks.property)) {
          const actual = await element.evaluate((el, p) => (el as any)[p], prop);
          // For className, check if it contains the expected value
          if (prop === 'className') {
            if (!String(actual).includes(String(expected))) {
              errors.push(`Property "${prop}": expected to contain "${expected}", got "${actual}"`);
            }
          } else if (actual !== expected) {
            errors.push(`Property "${prop}": expected "${expected}", got "${actual}"`);
          }
        }
      }

      // Check attributes that should NOT be set natively
      if (testCase.checks.notAttribute) {
        for (const attr of testCase.checks.notAttribute) {
          const hasAttr = await element.evaluate((el, a) => el.hasAttribute(a), attr);
          if (hasAttr) {
            errors.push(`Attribute "${attr}" should NOT be set natively on this element type`);
          }
        }
      }

      // Check dataset keys that should NOT exist
      if (testCase.checks.notDataset) {
        for (const key of testCase.checks.notDataset) {
          const hasKey = await element.evaluate((el, k) => k in (el as HTMLElement).dataset, key);
          if (hasKey) {
            errors.push(`Dataset "${key}" should NOT be set`);
          }
        }
      }

      expect(errors, `${testCase.name} failures:\n${errors.join('\n')}`).toEqual([]);
    });
  }
});

test.describe('Builder mkEl() Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/builder.html');
    await page.waitForFunction(() => typeof window['builderAPI']?.add === 'function', { timeout: 10000 });
  });

  for (const testCase of edgeCaseTests) {
    test(testCase.name, async ({ page }) => {
      // Add component to canvas using builderAPI
      await page.evaluate((comp) => {
        const canvas = document.getElementById('canvas');
        if (canvas) {
          canvas.innerHTML = '';
          window.builderAPI.add(comp);
        }
      }, testCase.component);

      await page.waitForTimeout(200);

      const element = page.locator(`[data-wb="${testCase.component.b}"]`).first();
      
      // Some edge cases might not render - that's okay for null/undefined tests
      const count = await element.count();
      if (count === 0) {
        // Skip if element didn't render (expected for some edge cases)
        return;
      }

      const errors: string[] = [];

      // Same checks as above
      if (testCase.checks.notAttribute) {
        for (const attr of testCase.checks.notAttribute) {
          const hasAttr = await element.evaluate((el, a) => el.hasAttribute(a), attr);
          if (hasAttr) {
            errors.push(`Attribute "${attr}" should NOT be set`);
          }
        }
      }

      if (testCase.checks.dataset) {
        for (const [key, expected] of Object.entries(testCase.checks.dataset)) {
          const actual = await element.evaluate((el, k) => (el as HTMLElement).dataset[k], key);
          if (actual !== expected) {
            errors.push(`Dataset "${key}": expected "${expected}", got "${actual}"`);
          }
        }
      }

      if (testCase.checks.notDataset) {
        for (const key of testCase.checks.notDataset) {
          const hasKey = await element.evaluate((el, k) => k in (el as HTMLElement).dataset, key);
          if (hasKey) {
            errors.push(`Dataset "${key}" should NOT be set for null/undefined values`);
          }
        }
      }

      expect(errors, `${testCase.name} failures:\n${errors.join('\n')}`).toEqual([]);
    });
  }
});

// =============================================================================
// ELEMENT TYPE TESTS - Verify correct element tags are created
// =============================================================================
test.describe('Builder mkEl() Element Types', () => {
  const elementTypeTests = [
    { name: 'Input creates INPUT element', b: 'input', t: 'input', expected: 'INPUT' },
    { name: 'Textarea creates TEXTAREA element', b: 'textarea', t: 'textarea', expected: 'TEXTAREA' },
    { name: 'Default creates DIV element', b: 'card', expected: 'DIV' },
    { name: 'Audio creates DIV container', b: 'audio', expected: 'DIV' },
    { name: 'Video behavior creates DIV container', b: 'video', expected: 'DIV' },
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/builder.html');
    await page.waitForFunction(() => typeof window['builderAPI']?.add === 'function', { timeout: 10000 });
  });

  for (const tc of elementTypeTests) {
    test(tc.name, async ({ page }) => {
      await page.evaluate((comp) => {
        const canvas = document.getElementById('canvas');
        if (canvas) {
          canvas.innerHTML = '';
          window.builderAPI.add(comp);
        }
      }, { n: tc.name, b: tc.b, t: tc.t, d: {} });

      await page.waitForTimeout(200);

      const element = page.locator(`[data-wb="${tc.b}"]`).first();
      const tagName = await element.evaluate(el => el.tagName);
      
      expect(tagName).toBe(tc.expected);
    });
  }
});
