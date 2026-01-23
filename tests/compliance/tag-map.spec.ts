/**
 * Tag Map Unit Tests
 * ==================
 * Tests for src/core/tag-map.js
 * 
 * Verifies:
 * - Component set contains expected entries
 * - tagMap correctly maps wb-* tags to behaviors
 * - Reverse lookup (behaviorToTag) works
 * - Utility functions work correctly
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Load the module source for static analysis
const tagMapPath = path.join(process.cwd(), 'src/core/tag-map.js');
const tagMapSource = fs.readFileSync(tagMapPath, 'utf-8');

test.describe('Tag Map - Static Analysis', () => {
  
  test('tag-map.js file exists', () => {
    expect(fs.existsSync(tagMapPath)).toBe(true);
  });

  test('exports components Set', () => {
    expect(tagMapSource).toContain('export const components = new Set(');
  });

  test('exports tagMap Map', () => {
    expect(tagMapSource).toContain('export const tagMap = new Map()');
  });

  test('exports behaviorToTag Map', () => {
    expect(tagMapSource).toContain('export const behaviorToTag = new Map()');
  });

  test('exports isComponent function', () => {
    expect(tagMapSource).toContain('export function isComponent(');
  });

  test('exports getBehaviorForTag function', () => {
    expect(tagMapSource).toContain('export function getBehaviorForTag(');
  });

  test('exports getTagForBehavior function', () => {
    expect(tagMapSource).toContain('export function getTagForBehavior(');
  });

  test('exports listComponents function', () => {
    expect(tagMapSource).toContain('export function listComponents(');
  });

  test('has default export object', () => {
    expect(tagMapSource).toContain('export default {');
  });
});

test.describe('Tag Map - Component Coverage', () => {
  
  // Extract component names from the source
  const componentMatch = tagMapSource.match(/export const components = new Set\(\[([\s\S]*?)\]\)/);
  const componentList = componentMatch 
    ? componentMatch[1].match(/'([^']+)'/g)?.map(s => s.replace(/'/g, '')) || []
    : [];

  test('components Set is not empty', () => {
    expect(componentList.length).toBeGreaterThan(0);
  });

  test('contains core components', () => {
    const coreComponents = [
      'hero', 'card', 'navbar', 'sidebar', 'footer', 'header',
      'modal', 'dialog', 'tabs', 'accordion', 'dropdown'
    ];
    
    for (const comp of coreComponents) {
      expect(componentList, `Missing core component: ${comp}`).toContain(comp);
    }
  });

  test('contains card variants', () => {
    const cardVariants = [
      'card', 'cardimage', 'cardvideo', 'cardbutton', 'cardhero',
      'cardprofile', 'cardpricing', 'cardstats', 'cardtestimonial',
      'cardproduct', 'cardnotification', 'cardfile', 'cardlink'
    ];
    
    for (const variant of cardVariants) {
      expect(componentList, `Missing card variant: ${variant}`).toContain(variant);
    }
  });

  test('contains feedback components', () => {
    const feedbackComponents = [
      'toast', 'badge', 'progress', 'spinner', 'avatar',
      'chip', 'alert', 'skeleton', 'divider', 'breadcrumb'
    ];
    
    for (const comp of feedbackComponents) {
      expect(componentList, `Missing feedback component: ${comp}`).toContain(comp);
    }
  });

  test('contains navigation components', () => {
    const navComponents = [
      'navbar', 'sidebar', 'menu', 'pagination', 'steps',
      'treeview', 'backtotop', 'link', 'statusbar'
    ];
    
    for (const comp of navComponents) {
      expect(componentList, `Missing navigation component: ${comp}`).toContain(comp);
    }
  });

  test('contains form components', () => {
    const formComponents = [
      'input', 'textarea', 'select', 'checkbox', 'radio',
      'button', 'switch', 'range', 'rating'
    ];
    
    for (const comp of formComponents) {
      expect(componentList, `Missing form component: ${comp}`).toContain(comp);
    }
  });

  test('contains media components', () => {
    const mediaComponents = [
      'image', 'gallery', 'video', 'audio', 'youtube',
      'vimeo', 'embed', 'figure', 'carousel'
    ];
    
    for (const comp of mediaComponents) {
      expect(componentList, `Missing media component: ${comp}`).toContain(comp);
    }
  });

  test('contains layout components', () => {
    const layoutComponents = [
      'grid', 'flex', 'container', 'stack', 'cluster', 'center'
    ];
    
    for (const comp of layoutComponents) {
      expect(componentList, `Missing layout component: ${comp}`).toContain(comp);
    }
  });

  test('contains semantic components', () => {
    const semanticComponents = [
      'table', 'code', 'pre', 'kbd', 'mark', 'json',
      'timeline', 'stat', 'list', 'desclist'
    ];
    
    for (const comp of semanticComponents) {
      expect(componentList, `Missing semantic component: ${comp}`).toContain(comp);
    }
  });

  test('no duplicate components', () => {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    
    for (const comp of componentList) {
      if (seen.has(comp)) {
        duplicates.push(comp);
      }
      seen.add(comp);
    }
    
    expect(duplicates, `Duplicate components found: ${duplicates.join(', ')}`).toHaveLength(0);
  });
});

test.describe('Tag Map - Runtime Behavior', () => {
  
  test('tagMap auto-populates from components', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { tagMap, components } = await import('/src/core/tag-map.js');
      return {
        tagMapSize: tagMap.size,
        componentsSize: components.size,
        match: tagMap.size === components.size
      };
    });
    
    expect(result.match, 'tagMap size should equal components size').toBe(true);
    expect(result.tagMapSize).toBeGreaterThan(0);
  });

  test('isComponent returns true for valid wb-* tags', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { isComponent } = await import('/src/core/tag-map.js');
      return {
        card: isComponent('wb-card'),
        hero: isComponent('wb-hero'),
        navbar: isComponent('wb-navbar'),
        modal: isComponent('wb-modal')
      };
    });
    
    expect(result.card).toBe(true);
    expect(result.hero).toBe(true);
    expect(result.navbar).toBe(true);
    expect(result.modal).toBe(true);
  });

  test('isComponent returns false for unknown tags', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { isComponent } = await import('/src/core/tag-map.js');
      return {
        div: isComponent('div'),
        span: isComponent('span'),
        unknown: isComponent('wb-unknown-component'),
        empty: isComponent('')
      };
    });
    
    expect(result.div).toBe(false);
    expect(result.span).toBe(false);
    expect(result.unknown).toBe(false);
    expect(result.empty).toBe(false);
  });

  test('isComponent is case-insensitive', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { isComponent } = await import('/src/core/tag-map.js');
      return {
        lower: isComponent('wb-card'),
        upper: isComponent('WB-CARD'),
        mixed: isComponent('Wb-Card')
      };
    });
    
    expect(result.lower).toBe(true);
    expect(result.upper).toBe(true);
    expect(result.mixed).toBe(true);
  });

  test('getBehaviorForTag returns correct behavior', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { getBehaviorForTag } = await import('/src/core/tag-map.js');
      return {
        card: getBehaviorForTag('wb-card'),
        hero: getBehaviorForTag('wb-hero'),
        cardimage: getBehaviorForTag('wb-cardimage'),
        navbar: getBehaviorForTag('wb-navbar')
      };
    });
    
    expect(result.card).toBe('card');
    expect(result.hero).toBe('hero');
    expect(result.cardimage).toBe('cardimage');
    expect(result.navbar).toBe('navbar');
  });

  test('getBehaviorForTag returns null for unknown tags', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { getBehaviorForTag } = await import('/src/core/tag-map.js');
      return {
        div: getBehaviorForTag('div'),
        unknown: getBehaviorForTag('wb-unknown'),
        empty: getBehaviorForTag('')
      };
    });
    
    expect(result.div).toBeNull();
    expect(result.unknown).toBeNull();
    expect(result.empty).toBeNull();
  });

  test('getTagForBehavior returns correct tag', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { getTagForBehavior } = await import('/src/core/tag-map.js');
      return {
        card: getTagForBehavior('card'),
        hero: getTagForBehavior('hero'),
        navbar: getTagForBehavior('navbar')
      };
    });
    
    expect(result.card).toBe('wb-card');
    expect(result.hero).toBe('wb-hero');
    expect(result.navbar).toBe('wb-navbar');
  });

  test('getTagForBehavior returns null for unknown behaviors', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { getTagForBehavior } = await import('/src/core/tag-map.js');
      return {
        unknown: getTagForBehavior('unknown-behavior'),
        empty: getTagForBehavior('')
      };
    });
    
    expect(result.unknown).toBeNull();
    expect(result.empty).toBeNull();
  });

  test('listComponents returns array of all components', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { listComponents, components } = await import('/src/core/tag-map.js');
      const list = listComponents();
      return {
        isArray: Array.isArray(list),
        length: list.length,
        matchesSet: list.length === components.size,
        includesCard: list.includes('card'),
        includesHero: list.includes('hero')
      };
    });
    
    expect(result.isArray).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result.matchesSet).toBe(true);
    expect(result.includesCard).toBe(true);
    expect(result.includesHero).toBe(true);
  });

  test('behaviorToTag is inverse of tagMap', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { tagMap, behaviorToTag } = await import('/src/core/tag-map.js');
      
      // Check every entry in tagMap has inverse in behaviorToTag
      let allMatch = true;
      for (const [tag, behavior] of tagMap) {
        if (behaviorToTag.get(behavior) !== tag) {
          allMatch = false;
          break;
        }
      }
      
      return {
        tagMapSize: tagMap.size,
        behaviorToTagSize: behaviorToTag.size,
        allMatch
      };
    });
    
    expect(result.tagMapSize).toBe(result.behaviorToTagSize);
    expect(result.allMatch).toBe(true);
  });

  test('default export contains all utilities', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const tagMapModule = await import('/src/core/tag-map.js');
      const defaultExport = tagMapModule.default;
      
      return {
        hasTagMap: 'tagMap' in defaultExport,
        hasBehaviorToTag: 'behaviorToTag' in defaultExport,
        hasComponents: 'components' in defaultExport,
        hasIsComponent: typeof defaultExport.isComponent === 'function',
        hasGetBehaviorForTag: typeof defaultExport.getBehaviorForTag === 'function',
        hasGetTagForBehavior: typeof defaultExport.getTagForBehavior === 'function',
        hasListComponents: typeof defaultExport.listComponents === 'function'
      };
    });
    
    expect(result.hasTagMap).toBe(true);
    expect(result.hasBehaviorToTag).toBe(true);
    expect(result.hasComponents).toBe(true);
    expect(result.hasIsComponent).toBe(true);
    expect(result.hasGetBehaviorForTag).toBe(true);
    expect(result.hasGetTagForBehavior).toBe(true);
    expect(result.hasListComponents).toBe(true);
  });
});

test.describe('Tag Map - Sync with Behavior Registry', () => {
  
  test('components align with behavior registry', async ({ page }) => {
    await page.goto('/demos/blank.html');
    
    const result = await page.evaluate(async () => {
      const { listComponents } = await import('/src/core/tag-map.js');
      const { hasBehavior } = await import('/src/wb-viewmodels/index.js');
      
      const components = listComponents();
      const missingBehaviors: string[] = [];
      
      // Check each component has a behavior (some may not, which is OK)
      for (const comp of components) {
        // We don't fail on missing - just track
        if (!hasBehavior(comp)) {
          missingBehaviors.push(comp);
        }
      }
      
      return {
        totalComponents: components.length,
        missingBehaviors,
        missingCount: missingBehaviors.length
      };
    });
    
    // Log missing behaviors for awareness (not a failure)
    if (result.missingCount > 0) {
      console.log(`Components without behaviors (${result.missingCount}): ${result.missingBehaviors.join(', ')}`);
    }
    
    // At least 80% of components should have behaviors
    const coverage = (result.totalComponents - result.missingCount) / result.totalComponents;
    expect(coverage).toBeGreaterThan(0.8);
  });
});
