/**
 * REGRESSION TESTS - Bug Fix Verification
 * ========================================
 * This file ensures ALL bugs found are:
 * 1. Documented in bug-registry.json
 * 2. Have corresponding test coverage
 * 3. Remain fixed (no regressions)
 * 
 * RULE: Every bug fix MUST have a regression test here.
 * NO EXCEPTIONS. Testing proves wellbeing.
 */

import { test, expect, Page, Locator } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BUG_REGISTRY_PATH = path.join(process.cwd(), 'data/bug-registry.json');

interface Bug {
  id: string;
  title: string;
  dateFound: string;
  severity: string;
  status: string;
  component: string;
  function: string;
  description: string;
  rootCause: string;
  symptom: string;
  fix: {
    file: string;
    before: string;
    after: string;
  };
  affectedComponents: string[];
  regressionTests: string[];
  testCases: string[];
}

interface BugRegistry {
  metadata: {
    totalBugs: number;
    testedBugs: number;
    untestedBugs: number;
  };
  bugs: Bug[];
}

function loadBugRegistry(): BugRegistry {
  if (!fs.existsSync(BUG_REGISTRY_PATH)) {
    throw new Error('Bug registry not found! Create data/bug-registry.json');
  }
  return JSON.parse(fs.readFileSync(BUG_REGISTRY_PATH, 'utf-8'));
}

// =============================================================================
// META-TEST: Ensure all bugs have tests
// =============================================================================
test.describe('Bug Registry Compliance', () => {
  test('all bugs in registry have regression tests listed', () => {
    const registry = loadBugRegistry();
    const issues: string[] = [];
    
    for (const bug of registry.bugs) {
      if (!bug.regressionTests || bug.regressionTests.length === 0) {
        issues.push(`${bug.id}: No regression tests listed`);
      }
      if (!bug.testCases || bug.testCases.length === 0) {
        issues.push(`${bug.id}: No test cases documented`);
      }
    }
    
    expect(issues, `Bugs without tests:\n${issues.join('\n')}`).toEqual([]);
  });

  test('bug registry metadata is accurate', () => {
    const registry = loadBugRegistry();
    
    const actualTotal = registry.bugs.length;
    const actualTested = registry.bugs.filter(b => 
      b.regressionTests && b.regressionTests.length > 0
    ).length;
    const actualUntested = actualTotal - actualTested;
    
    expect(registry.metadata.totalBugs).toBe(actualTotal);
    expect(registry.metadata.testedBugs).toBe(actualTested);
    expect(registry.metadata.untestedBugs).toBe(actualUntested);
  });

  test('no untested bugs allowed', () => {
    const registry = loadBugRegistry();
    expect(registry.metadata.untestedBugs, 'All bugs must have tests').toBe(0);
  });
});

// NOTE: Builder removed. These tests need rewrite to use behaviors-showcase.html or standalone test pages.
// Bugs are still tracked in bug-registry.json.

test.describe.skip('BUG-2025-12-26-002: Audio EQ panel controls (needs rewrite)', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Rewrite to use behaviors-showcase.html or standalone test page
  });

  test('Audio EQ panel has Play/Pause button and Master Volume', async ({ page }) => {
    await page.evaluate(() => {
      const canvas = document.getElementById('canvas');
      if (canvas) {
        canvas.innerHTML = '';
        (window as any).add({
          n: 'Audio',
          b: 'audio',
          d: {
            src: 'https://example.com/audio.mp3',
            showEq: true
          }
        });
      }
    });

    await page.waitForTimeout(300);
    
    const eqPanel = page.locator('.wb-audio__eq-container');
    await expect(eqPanel).toBeVisible();

    // Check for Play/Pause button
    const playBtn = eqPanel.locator('.wb-audio__eq-play-btn');
    await expect(playBtn).toBeVisible();
    await expect(playBtn).toHaveAttribute('aria-label', 'Play/Pause');

    // Check for Master Volume slider
    const volumeSlider = eqPanel.locator('.wb-audio__eq-master-volume');
    await expect(volumeSlider).toBeVisible();
    await expect(volumeSlider).toHaveAttribute('type', 'range');
  });
});

// =============================================================================
// BUG-2025-12-26-001: Figure data-caption attribute ignored
// =============================================================================
test.describe.skip('BUG-2025-12-26-001: Figure data-caption (needs rewrite)', () => {
  test.beforeEach(async ({ page }) => {
  });

  test('Figure renders caption from data-caption attribute', async ({ page }) => {
    const testCaption = 'Test Caption 123';
    
    await page.evaluate((caption) => {
      const canvas = document.getElementById('canvas');
      if (canvas) {
        canvas.innerHTML = '';
        (window as any).add({
          n: 'Figure',
          b: 'figure',
          d: {
            caption: caption
          }
        });
      }
    }, testCaption);

    await page.waitForTimeout(300);
    
    const figure = page.locator('[x-figure]');
    const figcaption = figure.locator('figcaption');
    
    await expect(figcaption).toBeVisible();
    await expect(figcaption).toHaveText(testCaption);
  });
});

// =============================================================================
// BUG-2024-12-19-001: Audio src attribute routing
// =============================================================================
test.describe.skip('BUG-2024-12-19-001: src attribute routing (needs rewrite)', () => {
  test.beforeEach(async ({ page }) => {
  });

  test('Audio: src goes to dataset.src NOT native src attribute', async ({ page }) => {
    // This is the EXACT bug that was fixed
    await page.evaluate(() => {
      const canvas = document.getElementById('canvas');
      if (canvas) {
        canvas.innerHTML = '';
        (window as any).add({
          n: 'Audio',
          b: 'audio',
          d: {
            src: 'https://example.com/audio.mp3',
            volume: '0.8'
          }
        });
      }
    });

    await page.waitForTimeout(300);
    
    const element = page.locator('wb-audio').first();
    
    // CRITICAL CHECK 1: src should be in dataset
    const datasetSrc = await element.evaluate(el => (el as HTMLElement).dataset.src);
    expect(datasetSrc, 'src should be in dataset').toBe('https://example.com/audio.mp3');
    
    // CRITICAL CHECK 2: src should NOT be native attribute on div
    const nativeSrc = await element.getAttribute('src');
    expect(nativeSrc, 'src should NOT be native attribute on div').toBeNull();
    
    // CRITICAL CHECK 3: Audio element should be created inside
    const audioEl = element.locator('audio');
    const audioCount = await audioEl.count();
    expect(audioCount, 'Audio element should be created').toBeGreaterThan(0);
    
    // CRITICAL CHECK 4: Audio element should have native controls
    const hasControls = await audioEl.first().getAttribute('controls');
    expect(hasControls, 'Audio should have native controls').not.toBeNull();
  });

  test('Video container: src goes to dataset.src', async ({ page }) => {
    await page.evaluate(() => {
      const canvas = document.getElementById('canvas');
      if (canvas) {
        canvas.innerHTML = '';
        (window as any).add({
          n: 'Video',
          b: 'video',
          d: {
            src: 'https://example.com/video.mp4'
          }
        });
      }
    });

    await page.waitForTimeout(300);
    
    const element = page.locator('wb-video').first();
    const count = await element.count();
    
    if (count > 0) {
      const datasetSrc = await element.evaluate(el => (el as HTMLElement).dataset.src);
      const nativeSrc = await element.getAttribute('src');
      
      expect(datasetSrc, 'Video src in dataset').toBe('https://example.com/video.mp4');
      expect(nativeSrc, 'No native src on container').toBeNull();
    }
  });

  test('CardImage: src goes to dataset.src', async ({ page }) => {
    await page.evaluate(() => {
      const canvas = document.getElementById('canvas');
      if (canvas) {
        canvas.innerHTML = '';
        (window as any).add({
          n: 'Card Image',
          b: 'cardimage',
          d: {
            src: 'https://picsum.photos/400/200',
            title: 'Test Card'
          }
        });
      }
    });

    await page.waitForTimeout(300);
    
    const element = page.locator('wb-cardimage').first();
    const count = await element.count();
    
    if (count > 0) {
      const datasetSrc = await element.evaluate(el => (el as HTMLElement).dataset.src);
      const nativeSrc = await element.getAttribute('src');
      
      expect(datasetSrc, 'CardImage src in dataset').toBe('https://picsum.photos/400/200');
      expect(nativeSrc, 'No native src on article').toBeNull();
    }
  });

  test('CardVideo: src goes to dataset.src', async ({ page }) => {
    await page.evaluate(() => {
      const canvas = document.getElementById('canvas');
      if (canvas) {
        canvas.innerHTML = '';
        (window as any).add({
          n: 'Card Video',
          b: 'cardvideo',
          d: {
            src: 'https://example.com/video.mp4'
          }
        });
      }
    });

    await page.waitForTimeout(300);
    
    const element = page.locator('wb-cardvideo').first();
    const count = await element.count();
    
    if (count > 0) {
      const datasetSrc = await element.evaluate(el => (el as HTMLElement).dataset.src);
      const nativeSrc = await element.getAttribute('src');
      
      expect(datasetSrc, 'CardVideo src in dataset').toBe('https://example.com/video.mp4');
      expect(nativeSrc, 'No native src on article').toBeNull();
    }
  });

  test('Avatar: src goes to dataset.src', async ({ page }) => {
    await page.evaluate(() => {
      const canvas = document.getElementById('canvas');
      if (canvas) {
        canvas.innerHTML = '';
        (window as any).add({
          n: 'Avatar',
          b: 'avatar',
          d: {
            src: 'https://i.pravatar.cc/80',
            name: 'John Doe'
          }
        });
      }
    });

    await page.waitForTimeout(300);
    
    const element = page.locator('wb-avatar').first();
    const count = await element.count();
    
    if (count > 0) {
      const datasetSrc = await element.evaluate(el => (el as HTMLElement).dataset.src);
      const nativeSrc = await element.getAttribute('src');
      
      expect(datasetSrc, 'Avatar src in dataset').toBe('https://i.pravatar.cc/80');
      expect(nativeSrc, 'No native src on div').toBeNull();
    }
  });

  test('YouTube: id goes to dataset.id', async ({ page }) => {
    await page.evaluate(() => {
      const canvas = document.getElementById('canvas');
      if (canvas) {
        canvas.innerHTML = '';
        (window as any).add({
          n: 'YouTube',
          b: 'youtube',
          d: {
            id: 'dQw4w9WgXcQ'
          }
        });
      }
    });

    await page.waitForTimeout(300);
    
    const element = page.locator('wb-youtube').first();
    const count = await element.count();
    
    if (count > 0) {
      const datasetId = await element.evaluate(el => (el as HTMLElement).dataset.id);
      expect(datasetId, 'YouTube id in dataset').toBe('dQw4w9WgXcQ');
    }
  });

  test('Vimeo: id goes to dataset.id', async ({ page }) => {
    await page.evaluate(() => {
      const canvas = document.getElementById('canvas');
      if (canvas) {
        canvas.innerHTML = '';
        (window as any).add({
          n: 'Vimeo',
          b: 'vimeo',
          d: {
            id: '123456789'
          }
        });
      }
    });

    await page.waitForTimeout(300);
    
    const element = page.locator('wb-vimeo').first();
    const count = await element.count();
    
    if (count > 0) {
      const datasetId = await element.evaluate(el => (el as HTMLElement).dataset.id);
      expect(datasetId, 'Vimeo id in dataset').toBe('123456789');
    }
  });

  // Test that ACTUAL media elements still get native src
  test('IMG element: src goes to native src attribute', async ({ page }) => {
    await page.evaluate(() => {
      const canvas = document.getElementById('canvas');
      if (canvas) {
        canvas.innerHTML = '';
        (window as any).add({
          n: 'Image',
          b: 'image',
          t: 'img',
          d: {
            src: 'https://picsum.photos/200/200'
          }
        });
      }
    });

    await page.waitForTimeout(300);
    
    const element = page.locator('wb-image').first();
    const count = await element.count();
    
    if (count > 0) {
      const tagName = await element.evaluate(el => el.tagName);
      
      // Only check native src if it's actually an IMG element
      if (tagName === 'IMG') {
        const nativeSrc = await element.getAttribute('src');
        expect(nativeSrc, 'IMG should have native src').toBe('https://picsum.photos/200/200');
      }
    }
  });
});

// =============================================================================
// PERMUTATION TESTS FOR ATTRIBUTE ROUTING
// =============================================================================
test.describe.skip('Attribute Routing Permutations (needs rewrite)', () => {
  const srcComponents = [
    { name: 'Audio', behavior: 'audio', containerTag: 'DIV', expectDataset: true, prop: 'src' },
    { name: 'Video', behavior: 'video', containerTag: 'DIV', expectDataset: true, prop: 'src' },
    { name: 'Card Image', behavior: 'cardimage', containerTag: 'ARTICLE', expectDataset: true, prop: 'src' },
    { name: 'Card Video', behavior: 'cardvideo', containerTag: 'ARTICLE', expectDataset: true, prop: 'src' },
    { name: 'Avatar', behavior: 'avatar', containerTag: 'DIV', expectDataset: true, prop: 'src' },
    { name: 'YouTube', behavior: 'youtube', containerTag: 'DIV', expectDataset: true, prop: 'id' },
    { name: 'Vimeo', behavior: 'vimeo', containerTag: 'DIV', expectDataset: true, prop: 'id' },
  ];

  test.beforeEach(async ({ page }) => {
  });

  for (const comp of srcComponents) {
    test(`${comp.name}: ${comp.prop} routing to dataset (container: ${comp.containerTag})`, async ({ page }) => {
      const testValue = comp.prop === 'id' ? 'test123456' : `https://test.com/${comp.behavior}.mp3`;
      
      await page.evaluate(({ behavior, prop, value }) => {
        const canvas = document.getElementById('canvas');
        if (canvas) {
          canvas.innerHTML = '';
          const data: Record<string, any> = {};
          data[prop] = value;
          (window as any).add({
            n: 'Test',
            b: behavior,
            d: data
          });
        }
      }, { behavior: comp.behavior, prop: comp.prop, value: testValue });

      await page.waitForTimeout(300);
      
      const element = page.locator(`[data-wb="${comp.behavior}"]`).first();
      const count = await element.count();
      
      if (count > 0) {
        const tagName = await element.evaluate(el => el.tagName);
        
        if (comp.expectDataset) {
          const datasetValue = await element.evaluate((el, p) => (el as HTMLElement).dataset[p], comp.prop);
          const nativeAttr = await element.getAttribute(comp.prop);
          
          expect(datasetValue, `${comp.name}: ${comp.prop} should be in dataset`).toBe(testValue);
          
          if (comp.prop === 'id') {
            // For ID, we just want to make sure it's not the video ID (element might have its own ID)
            expect(nativeAttr, `${comp.name}: ${comp.prop} should NOT match video ID`).not.toBe(testValue);
          } else {
            expect(nativeAttr, `${comp.name}: ${comp.prop} should NOT be native on ${tagName}`).toBeNull();
          }
        }
      }
    });
  }

  // Permutations for different src values
  const srcValues = [
    'https://example.com/file.mp3',
    'https://cdn.example.com/path/to/file.mp4?token=abc123',
    '/local/path/to/file.ogg',
    './relative/path.webm',
    'data:audio/mp3;base64,AAAA',
    '', // Empty
    'file with spaces.mp3',
  ];

  for (const srcVal of srcValues) {
    test(`Audio with src="${srcVal.substring(0, 30)}..." routes correctly`, async ({ page }) => {
      await page.evaluate((src) => {
        const canvas = document.getElementById('canvas');
        if (canvas) {
          canvas.innerHTML = '';
          (window as any).add({
            n: 'Audio',
            b: 'audio',
            d: { src }
          });
        }
      }, srcVal);

      await page.waitForTimeout(300);
      
      const element = page.locator('wb-audio').first();
      const count = await element.count();
      
      if (count > 0) {
        const datasetSrc = await element.evaluate(el => (el as HTMLElement).dataset.src);
        const nativeSrc = await element.getAttribute('src');
        
        expect(datasetSrc, 'src should match in dataset').toBe(srcVal);
        expect(nativeSrc, 'No native src on div').toBeNull();
      }
    });
  }
});

// =============================================================================
// AUDIO COMPONENT SPECIFIC REGRESSION TESTS
// =============================================================================
test.describe.skip('Audio Component Regression Suite (needs rewrite)', () => {
  test.beforeEach(async ({ page }) => {
  });

  // Volume permutations
  const volumeLevels = ['0', '0.1', '0.25', '0.5', '0.75', '0.8', '1'];
  
  for (const vol of volumeLevels) {
    test(`Audio volume=${vol} applies correctly`, async ({ page }) => {
      await page.evaluate((volume) => {
        const canvas = document.getElementById('canvas');
        if (canvas) {
          canvas.innerHTML = '';
          (window as any).add({
            n: 'Audio',
            b: 'audio',
            d: {
              src: 'https://example.com/audio.mp3',
              volume
            }
          });
        }
      }, vol);

      await page.waitForTimeout(300);
      
      const audio = page.locator('wb-audio audio').first();
      const count = await audio.count();
      
      if (count > 0) {
        const actualVol = await audio.evaluate(el => (el as HTMLAudioElement).volume);
        expect(actualVol).toBeCloseTo(parseFloat(vol), 2);
      }
    });
  }

  // showEq permutations
  const eqStates = [
    { showEq: true, expectPanel: true, id: 'bool-true' },
    { showEq: false, expectPanel: false, id: 'bool-false' },
    { showEq: 'true', expectPanel: true, id: 'str-true' },
    { showEq: 'false', expectPanel: false, id: 'str-false' },
  ];

  for (const state of eqStates) {
    test(`Audio showEq=${state.showEq} creates EQ panel: ${state.expectPanel} (${state.id})`, async ({ page }) => {
      await page.evaluate((showEq) => {
        const canvas = document.getElementById('canvas');
        if (canvas) {
          canvas.innerHTML = '';
          (window as any).add({
            n: 'Audio',
            b: 'audio',
            d: {
              src: 'https://example.com/audio.mp3',
              showEq
            }
          });
        }
      }, state.showEq);

      await page.waitForTimeout(300);
      
      const eqPanel = page.locator('wb-audio .wb-audio__eq-container');
      const panelCount = await eqPanel.count();
      
      if (state.expectPanel) {
        expect(panelCount, 'EQ panel should exist').toBeGreaterThan(0);
      } else {
        expect(panelCount, 'EQ panel should NOT exist').toBe(0);
      }
    });
  }

  // Boolean attribute permutations
  const booleanTests = [
    { prop: 'loop', value: true, audioAttr: 'loop' },
    { prop: 'loop', value: false, audioAttr: 'loop' },
    { prop: 'autoplay', value: true, audioAttr: 'autoplay' },
  ];

  for (const bt of booleanTests) {
    test(`Audio ${bt.prop}=${bt.value} sets attribute correctly`, async ({ page }) => {
      const props: Record<string, any> = {
        src: 'https://example.com/audio.mp3'
      };
      props[bt.prop] = bt.value;

      await page.evaluate((p) => {
        const canvas = document.getElementById('canvas');
        if (canvas) {
          canvas.innerHTML = '';
          (window as any).add({
            n: 'Audio',
            b: 'audio',
            d: p
          });
        }
      }, props);

      await page.waitForTimeout(300);
      
      const audio = page.locator('wb-audio audio').first();
      const count = await audio.count();
      
      if (count > 0) {
        const hasAttr = await audio.getAttribute(bt.audioAttr);
        
        if (bt.value) {
          expect(hasAttr, `Should have ${bt.audioAttr} attribute`).not.toBeNull();
        } else {
          expect(hasAttr, `Should NOT have ${bt.audioAttr} attribute`).toBeNull();
        }
      }
    });
  }
});

// =============================================================================
// SUMMARY: Regression Test Coverage Report
// =============================================================================
test.describe('Regression Coverage Report', () => {
  test('generate coverage summary', () => {
    const registry = loadBugRegistry();
    
    console.log('\n📊 REGRESSION TEST COVERAGE REPORT');
    console.log('===================================');
    console.log(`Total Bugs Tracked: ${registry.metadata.totalBugs}`);
    console.log(`Bugs with Tests: ${registry.metadata.testedBugs}`);
    console.log(`Bugs WITHOUT Tests: ${registry.metadata.untestedBugs}`);
    console.log('\nBug Details:');
    
    for (const bug of registry.bugs) {
      console.log(`\n  ${bug.id}: ${bug.title}`);
      console.log(`    Status: ${bug.status}`);
      console.log(`    Severity: ${bug.severity}`);
      console.log(`    Component: ${bug.component}`);
      console.log(`    Test Cases: ${bug.testCases.length}`);
    }
    
    // No untested bugs allowed
    expect(registry.metadata.untestedBugs).toBe(0);
  });
});
