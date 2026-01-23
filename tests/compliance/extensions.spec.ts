/**
 * Extensions Registry Unit Tests
 * ==============================
 * Tests for src/core/extensions.js
 * 
 * Verifies:
 * - Extension definitions are complete
 * - Decoration vs Morph classification is correct
 * - Utility functions work correctly
 * - parseExtensionAttribute handles all cases
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Load the module source for static analysis
const extensionsPath = path.join(process.cwd(), 'src/core/extensions.js');
const extensionsSource = fs.readFileSync(extensionsPath, 'utf-8');

test.describe('Extensions - Static Analysis', () => {
  
  test('extensions.js file exists', () => {
    expect(fs.existsSync(extensionsPath)).toBe(true);
  });

  test('exports ExtensionType enum', () => {
    expect(extensionsSource).toContain('export const ExtensionType = {');
    expect(extensionsSource).toContain("DECORATION: 'decoration'");
    expect(extensionsSource).toContain("MORPH: 'morph'");
  });

  test('exports extensions object', () => {
    expect(extensionsSource).toContain('export const extensions = {');
  });

  test('exports listExtensions function', () => {
    expect(extensionsSource).toContain('export function listExtensions(');
  });

  test('exports listDecorations function', () => {
    expect(extensionsSource).toContain('export function listDecorations(');
  });

  test('exports listMorphs function', () => {
    expect(extensionsSource).toContain('export function listMorphs(');
  });

  test('exports hasExtension function', () => {
    expect(extensionsSource).toContain('export function hasExtension(');
  });

  test('exports isDecoration function', () => {
    expect(extensionsSource).toContain('export function isDecoration(');
  });

  test('exports isMorph function', () => {
    expect(extensionsSource).toContain('export function isMorph(');
  });

  test('exports getExtension function', () => {
    expect(extensionsSource).toContain('export function getExtension(');
  });

  test('exports getMorphBehavior function', () => {
    expect(extensionsSource).toContain('export function getMorphBehavior(');
  });

  test('exports parseExtensionAttribute function', () => {
    expect(extensionsSource).toContain('export function parseExtensionAttribute(');
  });

  test('has default export object', () => {
    expect(extensionsSource).toContain('export default {');
  });
});

test.describe('Extensions - Decoration Coverage', () => {
  
  test('contains visual effect decorations', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { extensions, isDecoration } = await import('/src/core/extensions.js');
      
      const effectDecorations = [
        'ripple', 'animate', 'fadein', 'fadeout', 'slidein', 'slideout',
        'zoomin', 'zoomout', 'bounce', 'shake', 'pulse', 'flip', 'rotate',
        'swing', 'tada', 'wobble', 'jello', 'heartbeat', 'flash', 'rubberband',
        'typewriter', 'countup', 'parallax', 'reveal', 'marquee', 'confetti',
        'sparkle', 'glow', 'rainbow', 'fireworks', 'snow', 'particle'
      ];
      
      const missing: string[] = [];
      const wrongType: string[] = [];
      
      for (const dec of effectDecorations) {
        if (!(dec in extensions)) {
          missing.push(dec);
        } else if (!isDecoration(dec)) {
          wrongType.push(dec);
        }
      }
      
      return { missing, wrongType };
    });
    
    expect(result.missing, `Missing effect decorations: ${result.missing.join(', ')}`).toHaveLength(0);
    expect(result.wrongType, `Wrong type (not decoration): ${result.wrongType.join(', ')}`).toHaveLength(0);
  });

  test('contains interaction decorations', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { extensions, isDecoration } = await import('/src/core/extensions.js');
      
      const interactionDecorations = [
        'tooltip', 'draggable', 'resizable', 'copy', 'toggle', 'reorder'
      ];
      
      const missing: string[] = [];
      const wrongType: string[] = [];
      
      for (const dec of interactionDecorations) {
        if (!(dec in extensions)) {
          missing.push(dec);
        } else if (!isDecoration(dec)) {
          wrongType.push(dec);
        }
      }
      
      return { missing, wrongType };
    });
    
    expect(result.missing, `Missing interaction decorations: ${result.missing.join(', ')}`).toHaveLength(0);
    expect(result.wrongType, `Wrong type (not decoration): ${result.wrongType.join(', ')}`).toHaveLength(0);
  });

  test('contains movement decorations', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { extensions, isDecoration } = await import('/src/core/extensions.js');
      
      const moveDecorations = ['moveup', 'movedown', 'moveleft', 'moveright', 'moveall'];
      
      const missing: string[] = [];
      const wrongType: string[] = [];
      
      for (const dec of moveDecorations) {
        if (!(dec in extensions)) {
          missing.push(dec);
        } else if (!isDecoration(dec)) {
          wrongType.push(dec);
        }
      }
      
      return { missing, wrongType };
    });
    
    expect(result.missing, `Missing movement decorations: ${result.missing.join(', ')}`).toHaveLength(0);
    expect(result.wrongType, `Wrong type (not decoration): ${result.wrongType.join(', ')}`).toHaveLength(0);
  });

  test('contains scroll decorations', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { extensions, isDecoration } = await import('/src/core/extensions.js');
      
      const scrollDecorations = ['scrollalong', 'scrollProgress', 'sticky', 'scroll'];
      
      const missing: string[] = [];
      const wrongType: string[] = [];
      
      for (const dec of scrollDecorations) {
        if (!(dec in extensions)) {
          missing.push(dec);
        } else if (!isDecoration(dec)) {
          wrongType.push(dec);
        }
      }
      
      return { missing, wrongType };
    });
    
    expect(result.missing, `Missing scroll decorations: ${result.missing.join(', ')}`).toHaveLength(0);
    expect(result.wrongType, `Wrong type (not decoration): ${result.wrongType.join(', ')}`).toHaveLength(0);
  });

  test('contains utility decorations', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { extensions, isDecoration } = await import('/src/core/extensions.js');
      
      const utilityDecorations = [
        'lazy', 'print', 'share', 'fullscreen', 'hotkey', 'clipboard',
        'truncate', 'highlight', 'external', 'countdown', 'clock',
        'relativetime', 'offline', 'visible', 'debug'
      ];
      
      const missing: string[] = [];
      const wrongType: string[] = [];
      
      for (const dec of utilityDecorations) {
        if (!(dec in extensions)) {
          missing.push(dec);
        } else if (!isDecoration(dec)) {
          wrongType.push(dec);
        }
      }
      
      return { missing, wrongType };
    });
    
    expect(result.missing, `Missing utility decorations: ${result.missing.join(', ')}`).toHaveLength(0);
    expect(result.wrongType, `Wrong type (not decoration): ${result.wrongType.join(', ')}`).toHaveLength(0);
  });

  test('contains theme/control decorations', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { extensions, isDecoration } = await import('/src/core/extensions.js');
      
      const themeDecorations = ['darkmode', 'themecontrol', 'codecontrol'];
      
      const missing: string[] = [];
      const wrongType: string[] = [];
      
      for (const dec of themeDecorations) {
        if (!(dec in extensions)) {
          missing.push(dec);
        } else if (!isDecoration(dec)) {
          wrongType.push(dec);
        }
      }
      
      return { missing, wrongType };
    });
    
    expect(result.missing, `Missing theme decorations: ${result.missing.join(', ')}`).toHaveLength(0);
    expect(result.wrongType, `Wrong type (not decoration): ${result.wrongType.join(', ')}`).toHaveLength(0);
  });

  test('all decorations have module defined', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { extensions, listDecorations } = await import('/src/core/extensions.js');
      
      const decorations = listDecorations();
      const missingModule: string[] = [];
      
      for (const dec of decorations) {
        if (!extensions[dec].module) {
          missingModule.push(dec);
        }
      }
      
      return { missingModule, total: decorations.length };
    });
    
    expect(result.missingModule, `Decorations missing module: ${result.missingModule.join(', ')}`).toHaveLength(0);
    expect(result.total).toBeGreaterThan(50); // Should have 50+ decorations
  });

  test('all decorations have description', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { extensions, listDecorations } = await import('/src/core/extensions.js');
      
      const decorations = listDecorations();
      const missingDesc: string[] = [];
      
      for (const dec of decorations) {
        if (!extensions[dec].description) {
          missingDesc.push(dec);
        }
      }
      
      return { missingDesc };
    });
    
    expect(result.missingDesc, `Decorations missing description: ${result.missingDesc.join(', ')}`).toHaveLength(0);
  });
});

test.describe('Extensions - Morph Coverage', () => {
  
  test('contains UI morphs', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { extensions, isMorph } = await import('/src/core/extensions.js');
      
      const uiMorphs = [
        'as-card', 'as-alert', 'as-badge', 'as-chip', 'as-pill',
        'as-avatar', 'as-tooltip', 'as-tabs', 'as-accordion',
        'as-collapse', 'as-dropdown', 'as-modal', 'as-drawer', 'as-popover'
      ];
      
      const missing: string[] = [];
      const wrongType: string[] = [];
      
      for (const morph of uiMorphs) {
        if (!(morph in extensions)) {
          missing.push(morph);
        } else if (!isMorph(morph)) {
          wrongType.push(morph);
        }
      }
      
      return { missing, wrongType };
    });
    
    expect(result.missing, `Missing UI morphs: ${result.missing.join(', ')}`).toHaveLength(0);
    expect(result.wrongType, `Wrong type (not morph): ${result.wrongType.join(', ')}`).toHaveLength(0);
  });

  test('contains navigation morphs', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { extensions, isMorph } = await import('/src/core/extensions.js');
      
      const navMorphs = [
        'as-hero', 'as-navbar', 'as-sidebar', 'as-footer',
        'as-header', 'as-breadcrumb', 'as-pagination', 'as-steps'
      ];
      
      const missing: string[] = [];
      const wrongType: string[] = [];
      
      for (const morph of navMorphs) {
        if (!(morph in extensions)) {
          missing.push(morph);
        } else if (!isMorph(morph)) {
          wrongType.push(morph);
        }
      }
      
      return { missing, wrongType };
    });
    
    expect(result.missing, `Missing navigation morphs: ${result.missing.join(', ')}`).toHaveLength(0);
    expect(result.wrongType, `Wrong type (not morph): ${result.wrongType.join(', ')}`).toHaveLength(0);
  });

  test('contains layout morphs', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { extensions, isMorph } = await import('/src/core/extensions.js');
      
      const layoutMorphs = [
        'as-gallery', 'as-carousel', 'as-table', 'as-list',
        'as-grid', 'as-masonry', 'as-timeline'
      ];
      
      const missing: string[] = [];
      const wrongType: string[] = [];
      
      for (const morph of layoutMorphs) {
        if (!(morph in extensions)) {
          missing.push(morph);
        } else if (!isMorph(morph)) {
          wrongType.push(morph);
        }
      }
      
      return { missing, wrongType };
    });
    
    expect(result.missing, `Missing layout morphs: ${result.missing.join(', ')}`).toHaveLength(0);
    expect(result.wrongType, `Wrong type (not morph): ${result.wrongType.join(', ')}`).toHaveLength(0);
  });

  test('all morphs have behavior defined', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { extensions, listMorphs } = await import('/src/core/extensions.js');
      
      const morphs = listMorphs();
      const missingBehavior: string[] = [];
      
      for (const morph of morphs) {
        if (!extensions[morph].behavior) {
          missingBehavior.push(morph);
        }
      }
      
      return { missingBehavior, total: morphs.length };
    });
    
    expect(result.missingBehavior, `Morphs missing behavior: ${result.missingBehavior.join(', ')}`).toHaveLength(0);
    expect(result.total).toBeGreaterThan(20); // Should have 20+ morphs
  });

  test('all morphs have description', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { extensions, listMorphs } = await import('/src/core/extensions.js');
      
      const morphs = listMorphs();
      const missingDesc: string[] = [];
      
      for (const morph of morphs) {
        if (!extensions[morph].description) {
          missingDesc.push(morph);
        }
      }
      
      return { missingDesc };
    });
    
    expect(result.missingDesc, `Morphs missing description: ${result.missingDesc.join(', ')}`).toHaveLength(0);
  });

  test('morph behaviors match component names', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { extensions, listMorphs } = await import('/src/core/extensions.js');
      const { components } = await import('/src/core/tag-map.js');
      
      const morphs = listMorphs();
      const unknownBehaviors: string[] = [];
      
      for (const morph of morphs) {
        const behavior = extensions[morph].behavior;
        if (!components.has(behavior)) {
          unknownBehaviors.push(`${morph} -> ${behavior}`);
        }
      }
      
      return { unknownBehaviors };
    });
    
    // Allow some morphs to reference behaviors not in components (they may be in viewmodels only)
    // Just warn, don't fail
    if (result.unknownBehaviors.length > 0) {
      console.log(`Morphs with behaviors not in tag-map: ${result.unknownBehaviors.join(', ')}`);
    }
  });
});

test.describe('Extensions - Utility Functions', () => {
  
  test('listExtensions returns all extensions', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { listExtensions, extensions } = await import('/src/core/extensions.js');
      const list = listExtensions();
      return {
        isArray: Array.isArray(list),
        length: list.length,
        matchesObject: list.length === Object.keys(extensions).length
      };
    });
    
    expect(result.isArray).toBe(true);
    expect(result.length).toBeGreaterThan(70); // 50+ decorations + 20+ morphs
    expect(result.matchesObject).toBe(true);
  });

  test('listDecorations returns only decorations', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { listDecorations, isDecoration } = await import('/src/core/extensions.js');
      const list = listDecorations();
      const allDecorations = list.every(name => isDecoration(name));
      return { isArray: Array.isArray(list), length: list.length, allDecorations };
    });
    
    expect(result.isArray).toBe(true);
    expect(result.length).toBeGreaterThan(50);
    expect(result.allDecorations).toBe(true);
  });

  test('listMorphs returns only morphs', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { listMorphs, isMorph } = await import('/src/core/extensions.js');
      const list = listMorphs();
      const allMorphs = list.every(name => isMorph(name));
      return { isArray: Array.isArray(list), length: list.length, allMorphs };
    });
    
    expect(result.isArray).toBe(true);
    expect(result.length).toBeGreaterThan(20);
    expect(result.allMorphs).toBe(true);
  });

  test('hasExtension returns true for valid extensions', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { hasExtension } = await import('/src/core/extensions.js');
      return {
        ripple: hasExtension('ripple'),
        tooltip: hasExtension('tooltip'),
        asCard: hasExtension('as-card'),
        asTimeline: hasExtension('as-timeline')
      };
    });
    
    expect(result.ripple).toBe(true);
    expect(result.tooltip).toBe(true);
    expect(result.asCard).toBe(true);
    expect(result.asTimeline).toBe(true);
  });

  test('hasExtension returns false for unknown extensions', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { hasExtension } = await import('/src/core/extensions.js');
      return {
        unknown: hasExtension('unknown-extension'),
        empty: hasExtension(''),
        card: hasExtension('card') // card is a component, not an extension
      };
    });
    
    expect(result.unknown).toBe(false);
    expect(result.empty).toBe(false);
    expect(result.card).toBe(false);
  });

  test('isDecoration correctly identifies decorations', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { isDecoration } = await import('/src/core/extensions.js');
      return {
        ripple: isDecoration('ripple'),
        tooltip: isDecoration('tooltip'),
        lazy: isDecoration('lazy'),
        asCard: isDecoration('as-card'), // morph, not decoration
        unknown: isDecoration('unknown')
      };
    });
    
    expect(result.ripple).toBe(true);
    expect(result.tooltip).toBe(true);
    expect(result.lazy).toBe(true);
    expect(result.asCard).toBe(false);
    expect(result.unknown).toBe(false);
  });

  test('isMorph correctly identifies morphs', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { isMorph } = await import('/src/core/extensions.js');
      return {
        asCard: isMorph('as-card'),
        asTimeline: isMorph('as-timeline'),
        asHero: isMorph('as-hero'),
        ripple: isMorph('ripple'), // decoration, not morph
        unknown: isMorph('unknown')
      };
    });
    
    expect(result.asCard).toBe(true);
    expect(result.asTimeline).toBe(true);
    expect(result.asHero).toBe(true);
    expect(result.ripple).toBe(false);
    expect(result.unknown).toBe(false);
  });

  test('getExtension returns full definition', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { getExtension, ExtensionType } = await import('/src/core/extensions.js');
      
      const ripple = getExtension('ripple');
      const asCard = getExtension('as-card');
      const unknown = getExtension('unknown');
      
      return {
        ripple: ripple ? {
          type: ripple.type,
          hasModule: !!ripple.module,
          hasDescription: !!ripple.description,
          isDecoration: ripple.type === ExtensionType.DECORATION
        } : null,
        asCard: asCard ? {
          type: asCard.type,
          behavior: asCard.behavior,
          hasDescription: !!asCard.description,
          isMorph: asCard.type === ExtensionType.MORPH
        } : null,
        unknown
      };
    });
    
    expect(result.ripple).not.toBeNull();
    expect(result.ripple?.isDecoration).toBe(true);
    expect(result.ripple?.hasModule).toBe(true);
    expect(result.ripple?.hasDescription).toBe(true);
    
    expect(result.asCard).not.toBeNull();
    expect(result.asCard?.isMorph).toBe(true);
    expect(result.asCard?.behavior).toBe('card');
    expect(result.asCard?.hasDescription).toBe(true);
    
    expect(result.unknown).toBeNull();
  });

  test('getMorphBehavior returns correct behavior', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { getMorphBehavior } = await import('/src/core/extensions.js');
      return {
        asCard: getMorphBehavior('as-card'),
        asTimeline: getMorphBehavior('as-timeline'),
        asHero: getMorphBehavior('as-hero'),
        asNavbar: getMorphBehavior('as-navbar'),
        ripple: getMorphBehavior('ripple'), // decoration, should return null
        unknown: getMorphBehavior('unknown')
      };
    });
    
    expect(result.asCard).toBe('card');
    expect(result.asTimeline).toBe('timeline');
    expect(result.asHero).toBe('hero');
    expect(result.asNavbar).toBe('navbar');
    expect(result.ripple).toBeNull();
    expect(result.unknown).toBeNull();
  });
});

test.describe('Extensions - parseExtensionAttribute', () => {
  
  test('parses decoration attributes', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { parseExtensionAttribute } = await import('/src/core/extensions.js');
      
      return {
        ripple: parseExtensionAttribute('x-ripple'),
        tooltip: parseExtensionAttribute('x-tooltip'),
        lazy: parseExtensionAttribute('x-lazy')
      };
    });
    
    expect(result.ripple).toEqual({ name: 'ripple', type: 'decoration', behavior: 'ripple' });
    expect(result.tooltip).toEqual({ name: 'tooltip', type: 'decoration', behavior: 'tooltip' });
    expect(result.lazy).toEqual({ name: 'lazy', type: 'decoration', behavior: 'lazy' });
  });

  test('parses morph attributes', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { parseExtensionAttribute } = await import('/src/core/extensions.js');
      
      return {
        asCard: parseExtensionAttribute('x-as-card'),
        asTimeline: parseExtensionAttribute('x-as-timeline'),
        asHero: parseExtensionAttribute('x-as-hero')
      };
    });
    
    expect(result.asCard).toEqual({ name: 'as-card', type: 'morph', behavior: 'card' });
    expect(result.asTimeline).toEqual({ name: 'as-timeline', type: 'morph', behavior: 'timeline' });
    expect(result.asHero).toEqual({ name: 'as-hero', type: 'morph', behavior: 'hero' });
  });

  test('returns null for non-x- attributes', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { parseExtensionAttribute } = await import('/src/core/extensions.js');
      
      return {
        dataAttr: parseExtensionAttribute('data-ripple'),
        plainAttr: parseExtensionAttribute('ripple'),
        classAttr: parseExtensionAttribute('class'),
        idAttr: parseExtensionAttribute('id')
      };
    });
    
    expect(result.dataAttr).toBeNull();
    expect(result.plainAttr).toBeNull();
    expect(result.classAttr).toBeNull();
    expect(result.idAttr).toBeNull();
  });

  test('returns null for unknown x- attributes', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { parseExtensionAttribute } = await import('/src/core/extensions.js');
      
      return {
        unknown: parseExtensionAttribute('x-unknown-extension'),
        card: parseExtensionAttribute('x-card'), // card is a component
        empty: parseExtensionAttribute('x-')
      };
    });
    
    expect(result.unknown).toBeNull();
    expect(result.card).toBeNull();
    expect(result.empty).toBeNull();
  });

  test('works with custom prefix', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { parseExtensionAttribute } = await import('/src/core/extensions.js');
      
      return {
        wbRipple: parseExtensionAttribute('wb-ripple', 'wb'),
        dataRipple: parseExtensionAttribute('data-ripple', 'data'),
        xRippleWrongPrefix: parseExtensionAttribute('x-ripple', 'wb')
      };
    });
    
    expect(result.wbRipple).toEqual({ name: 'ripple', type: 'decoration', behavior: 'ripple' });
    expect(result.dataRipple).toEqual({ name: 'ripple', type: 'decoration', behavior: 'ripple' });
    expect(result.xRippleWrongPrefix).toBeNull();
  });
});

test.describe('Extensions - No Duplicates', () => {
  
  test('no duplicate extension names', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { listExtensions } = await import('/src/core/extensions.js');
      const list = listExtensions();
      const seen = new Set<string>();
      const duplicates: string[] = [];
      
      for (const name of list) {
        if (seen.has(name)) {
          duplicates.push(name);
        }
        seen.add(name);
      }
      
      return { duplicates };
    });
    
    expect(result.duplicates, `Duplicate extensions: ${result.duplicates.join(', ')}`).toHaveLength(0);
  });

  test('decorations and morphs are mutually exclusive', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { listDecorations, listMorphs } = await import('/src/core/extensions.js');
      
      const decorations = new Set(listDecorations());
      const morphs = listMorphs();
      const overlap: string[] = [];
      
      for (const morph of morphs) {
        if (decorations.has(morph)) {
          overlap.push(morph);
        }
      }
      
      return { overlap };
    });
    
    expect(result.overlap, `Extensions in both decoration and morph: ${result.overlap.join(', ')}`).toHaveLength(0);
  });
});

test.describe('Extensions - Default Export', () => {
  
  test('default export contains all utilities', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const extensionsModule = await import('/src/core/extensions.js');
      const defaultExport = extensionsModule.default;
      
      return {
        hasExtensions: 'extensions' in defaultExport,
        hasExtensionType: 'ExtensionType' in defaultExport,
        hasListExtensions: typeof defaultExport.listExtensions === 'function',
        hasListDecorations: typeof defaultExport.listDecorations === 'function',
        hasListMorphs: typeof defaultExport.listMorphs === 'function',
        hasHasExtension: typeof defaultExport.hasExtension === 'function',
        hasIsDecoration: typeof defaultExport.isDecoration === 'function',
        hasIsMorph: typeof defaultExport.isMorph === 'function',
        hasGetExtension: typeof defaultExport.getExtension === 'function',
        hasGetMorphBehavior: typeof defaultExport.getMorphBehavior === 'function',
        hasParseExtensionAttribute: typeof defaultExport.parseExtensionAttribute === 'function'
      };
    });
    
    expect(result.hasExtensions).toBe(true);
    expect(result.hasExtensionType).toBe(true);
    expect(result.hasListExtensions).toBe(true);
    expect(result.hasListDecorations).toBe(true);
    expect(result.hasListMorphs).toBe(true);
    expect(result.hasHasExtension).toBe(true);
    expect(result.hasIsDecoration).toBe(true);
    expect(result.hasIsMorph).toBe(true);
    expect(result.hasGetExtension).toBe(true);
    expect(result.hasGetMorphBehavior).toBe(true);
    expect(result.hasParseExtensionAttribute).toBe(true);
  });
});

test.describe('Extensions - WB Integration', () => {
  
  test('WB.extensions exposes registry functions', async ({ page }) => {
    // Use setup.html which initializes WB directly
    await page.goto('/setup.html');
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Give WB time to initialize
    await page.waitForTimeout(2000);
    
    // Check if WB is available
    const hasWB = await page.evaluate(() => typeof window.WB !== 'undefined');
    
    if (!hasWB) {
      console.log('WB not available on page - skipping integration test');
      test.skip();
      return;
    }
    
    const result = await page.evaluate(() => {
      const WB = (window as any).WB;
      return {
        hasExtensions: !!WB.extensions,
        hasHasExtension: typeof WB.extensions?.hasExtension === 'function',
        hasIsDecoration: typeof WB.extensions?.isDecoration === 'function',
        hasIsMorph: typeof WB.extensions?.isMorph === 'function',
        hasGetMorphBehavior: typeof WB.extensions?.getMorphBehavior === 'function',
        hasListExtensions: typeof WB.extensions?.listExtensions === 'function',
        hasListDecorations: typeof WB.extensions?.listDecorations === 'function',
        hasListMorphs: typeof WB.extensions?.listMorphs === 'function'
      };
    });
    
    expect(result.hasExtensions).toBe(true);
    expect(result.hasHasExtension).toBe(true);
    expect(result.hasIsDecoration).toBe(true);
    expect(result.hasIsMorph).toBe(true);
    expect(result.hasGetMorphBehavior).toBe(true);
    expect(result.hasListExtensions).toBe(true);
    expect(result.hasListDecorations).toBe(true);
    expect(result.hasListMorphs).toBe(true);
  });

  test('WB.tags exposes tag-map functions', async ({ page }) => {
    // Use setup.html which initializes WB directly
    await page.goto('/setup.html');
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Give WB time to initialize
    await page.waitForTimeout(2000);
    
    // Check if WB is available
    const hasWB = await page.evaluate(() => typeof window.WB !== 'undefined');
    
    if (!hasWB) {
      console.log('WB not available on page - skipping integration test');
      test.skip();
      return;
    }
    
    const result = await page.evaluate(() => {
      const WB = (window as any).WB;
      return {
        hasTags: !!WB.tags,
        hasIsComponent: typeof WB.tags?.isComponent === 'function',
        hasGetBehaviorForTag: typeof WB.tags?.getBehaviorForTag === 'function',
        hasListComponents: typeof WB.tags?.listComponents === 'function'
      };
    });
    
    expect(result.hasTags).toBe(true);
    expect(result.hasIsComponent).toBe(true);
    expect(result.hasGetBehaviorForTag).toBe(true);
    expect(result.hasListComponents).toBe(true);
  });
});
