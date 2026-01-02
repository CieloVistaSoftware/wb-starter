/**
 * Audio Component Compliance Tests
 * =================================
 * Comprehensive tests for the WB Audio component
 * 
 * BUG HISTORY:
 * - 2024-12-19: Fixed src attribute routing - was setting el.src on div instead of dataset.src
 * - 2024-12-19: Verified native controls visibility when showEq is false
 */

import { test, expect, Page, Locator } from '@playwright/test';

// =============================================================================
// TEST CONFIGURATION
// =============================================================================
const AUDIO_SRC = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

interface AudioTestCase {
  name: string;
  props: Record<string, any>;
  checks: {
    hasNativeControls?: boolean;
    hasEqPanel?: boolean;
    hasPlayButton?: boolean;
    hasMasterVolume?: boolean;
    hasPresetButtons?: boolean;
    audioElementCreated?: boolean;
    srcIsCorrect?: boolean;
    volumeLevel?: number;
  };
}

// =============================================================================
// PERMUTATION MATRIX
// =============================================================================
const audioPermutations: AudioTestCase[] = [
  // Base case - default configuration
  {
    name: 'Default audio (showEq: false) shows native controls only',
    props: {
      src: AUDIO_SRC,
      volume: '0.8',
      showEq: false
    },
    checks: {
      hasNativeControls: true,
      hasEqPanel: false,
      audioElementCreated: true,
      srcIsCorrect: true
    }
  },
  
  // EQ enabled
  {
    name: 'Audio with EQ (showEq: true) shows both native controls and EQ panel',
    props: {
      src: AUDIO_SRC,
      volume: '0.8',
      showEq: true
    },
    checks: {
      hasNativeControls: true,
      hasEqPanel: true,
      hasPlayButton: true,
      hasMasterVolume: true,
      hasPresetButtons: true,
      audioElementCreated: true
    }
  },
  
  // Volume permutations
  {
    name: 'Audio volume at 0',
    props: {
      src: AUDIO_SRC,
      volume: '0'
    },
    checks: {
      audioElementCreated: true,
      volumeLevel: 0
    }
  },
  {
    name: 'Audio volume at 1 (max)',
    props: {
      src: AUDIO_SRC,
      volume: '1'
    },
    checks: {
      audioElementCreated: true,
      volumeLevel: 1
    }
  },
  {
    name: 'Audio volume at 0.5 (mid)',
    props: {
      src: AUDIO_SRC,
      volume: '0.5'
    },
    checks: {
      audioElementCreated: true,
      volumeLevel: 0.5
    }
  },
  
  // Loop permutation
  {
    name: 'Audio with loop enabled',
    props: {
      src: AUDIO_SRC,
      loop: true
    },
    checks: {
      audioElementCreated: true
    }
  },
  
  // No src (edge case)
  {
    name: 'Audio without src still creates container',
    props: {
      volume: '0.8',
      showEq: true
    },
    checks: {
      hasEqPanel: true,
      audioElementCreated: false // No audio element without src
    }
  },
  
  // String boolean
  {
    name: 'Audio with showEq as string "true"',
    props: {
      src: AUDIO_SRC,
      showEq: 'true'
    },
    checks: {
      hasEqPanel: true,
      hasPlayButton: true
    }
  },
  
  // Combined features
  {
    name: 'Audio with all features enabled',
    props: {
      src: AUDIO_SRC,
      volume: '0.7',
      showEq: true,
      loop: true,
      bass: '3',
      treble: '2'
    },
    checks: {
      hasNativeControls: true,
      hasEqPanel: true,
      hasPlayButton: true,
      hasMasterVolume: true,
      audioElementCreated: true
    }
  }
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
async function setupAudioComponent(page: Page, props: Record<string, any>): Promise<Locator> {
  await page.evaluate((p) => {
    const canvas = document.getElementById('canvas');
    if (canvas) {
      canvas.innerHTML = '';
      (window as any).add({
        n: 'Audio',
        i: '🎵',
        b: 'audio',
        d: p
      });
    }
  }, props);
  
  await page.waitForTimeout(300); // Allow behavior to initialize
  
  return page.locator('[data-wb="audio"]').first();
}

// =============================================================================
// TESTS
// =============================================================================
test.describe('Audio Component Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/builder.html');
    await page.waitForFunction(() => typeof (window as any)['add'] === 'function');
  });

  for (const tc of audioPermutations) {
    test(tc.name, async ({ page }) => {
      const element = await setupAudioComponent(page, tc.props);
      const errors: string[] = [];
      
      // Check if element was created
      const count = await element.count();
      if (count === 0) {
        errors.push('Audio container element was not created');
        expect(errors).toEqual([]);
        return;
      }
      
      // Check base class
      const hasBaseClass = await element.evaluate(el => el.classList.contains('wb-audio'));
      if (!hasBaseClass) {
        errors.push('Missing base class "wb-audio"');
      }
      
      // Check src is in dataset (not native attribute)
      if (tc.props.src) {
        const datasetSrc = await element.evaluate(el => (el as HTMLElement).dataset.src);
        const nativeSrc = await element.getAttribute('src');
        
        if (tc.checks.srcIsCorrect) {
          if (datasetSrc !== tc.props.src) {
            errors.push(`dataset.src should be "${tc.props.src}", got "${datasetSrc}"`);
          }
        }
        
        if (nativeSrc) {
          errors.push('src should NOT be a native attribute on the container div');
        }
      }
      
      // Check for audio element inside
      if (tc.checks.audioElementCreated !== undefined) {
        const audioEl = element.locator('audio');
        const audioCount = await audioEl.count();
        
        if (tc.checks.audioElementCreated && audioCount === 0) {
          errors.push('Audio element should be created inside container');
        }
        if (!tc.checks.audioElementCreated && tc.props.src && audioCount > 0) {
          // This is okay - audio element is expected when src is provided
        }
        
        // Check audio element has controls
        if (tc.checks.hasNativeControls && audioCount > 0) {
          const hasControls = await audioEl.first().getAttribute('controls');
          if (hasControls === null) {
            errors.push('Native audio element should have controls attribute');
          }
        }
        
        // Check volume level
        if (tc.checks.volumeLevel !== undefined && audioCount > 0) {
          const volume = await audioEl.first().evaluate(el => (el as HTMLAudioElement).volume);
          if (Math.abs(volume - tc.checks.volumeLevel) > 0.01) {
            errors.push(`Audio volume should be ${tc.checks.volumeLevel}, got ${volume}`);
          }
        }
      }
      
      // Check for EQ panel
      if (tc.checks.hasEqPanel !== undefined) {
        const eqPanel = element.locator('.wb-audio__eq-container');
        const eqCount = await eqPanel.count();
        
        if (tc.checks.hasEqPanel && eqCount === 0) {
          errors.push('EQ panel should be present when showEq is true');
        }
        if (!tc.checks.hasEqPanel && eqCount > 0) {
          errors.push('EQ panel should NOT be present when showEq is false');
        }
      }
      
      // Check for play button (in EQ panel volume row)
      if (tc.checks.hasPlayButton) {
        // Play button is the speaker/pause emoji button
        const playBtnExists = await element.evaluate(el => {
          const buttons = el.querySelectorAll('button');
          return Array.from(buttons).some(btn => 
            btn.innerHTML.includes('🔊') || btn.innerHTML.includes('⏸️')
          );
        });
        
        if (!playBtnExists) {
          errors.push('Play/Pause button should be present in EQ panel');
        }
      }
      
      // Check for master volume slider
      if (tc.checks.hasMasterVolume) {
        const masterVol = element.locator('.wb-audio__master-vol');
        const volCount = await masterVol.count();
        
        if (volCount === 0) {
          errors.push('Master volume slider should be present in EQ panel');
        }
      }
      
      // Check for preset buttons
      if (tc.checks.hasPresetButtons) {
        const presets = ['Flat', 'Bass Boost', 'Treble', 'V-Shape', 'Vocal'];
        for (const preset of presets) {
          const btnExists = await element.evaluate((el, p) => {
            const buttons = el.querySelectorAll('button');
            return Array.from(buttons).some(btn => btn.textContent === p);
          }, preset);
          
          if (!btnExists) {
            errors.push(`Preset button "${preset}" should be present`);
          }
        }
      }
      
      expect(errors, `${tc.name} failures:\n${errors.join('\n')}`).toEqual([]);
    });
  }
});

// =============================================================================
// INTERACTION TESTS
// =============================================================================
test.describe('Audio Component Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/builder.html');
    await page.waitForFunction(() => typeof (window as any)['add'] === 'function');
  });

  test('EQ sliders are interactive', async ({ page }) => {
    const element = await setupAudioComponent(page, {
      src: AUDIO_SRC,
      showEq: true
    });
    
    // Find first EQ slider
    const slider = element.locator('.wb-audio__eq-slider').first();
    const sliderCount = await slider.count();
    
    expect(sliderCount).toBeGreaterThan(0);
    
    // Check slider is range input
    const type = await slider.getAttribute('type');
    expect(type).toBe('range');
    
    // Check min/max
    const min = await slider.getAttribute('min');
    const max = await slider.getAttribute('max');
    expect(min).toBe('-12');
    expect(max).toBe('12');
  });

  test('Preset buttons update sliders', async ({ page }) => {
    const element = await setupAudioComponent(page, {
      src: AUDIO_SRC,
      showEq: true
    });
    
    // Click "Bass Boost" preset
    const bassBoostBtn = element.locator('button', { hasText: 'Bass Boost' });
    await bassBoostBtn.click();
    
    await page.waitForTimeout(100);
    
    // First slider (25Hz) should be boosted to 8
    const firstSlider = element.locator('.wb-audio__eq-slider').first();
    const value = await firstSlider.inputValue();
    
    expect(parseInt(value)).toBe(8);
  });

  test('Zero All button resets all sliders', async ({ page }) => {
    const element = await setupAudioComponent(page, {
      src: AUDIO_SRC,
      showEq: true
    });
    
    // First apply Bass Boost
    const bassBoostBtn = element.locator('button', { hasText: 'Bass Boost' });
    await bassBoostBtn.click();
    await page.waitForTimeout(100);
    
    // Then click Zero All
    const zeroBtn = element.locator('button', { hasText: 'Zero All' });
    await zeroBtn.click();
    await page.waitForTimeout(100);
    
    // All sliders should be 0
    const sliders = element.locator('.wb-audio__eq-slider');
    const count = await sliders.count();
    
    for (let i = 0; i < count; i++) {
      const value = await sliders.nth(i).inputValue();
      expect(parseInt(value), `Slider ${i} should be 0`).toBe(0);
    }
  });

  test('Master volume slider changes audio volume', async ({ page }) => {
    const element = await setupAudioComponent(page, {
      src: AUDIO_SRC,
      showEq: true,
      volume: '0.8'
    });
    
    const masterVol = element.locator('.wb-audio__master-vol');
    const audioEl = element.locator('audio');
    
    // Change volume to 50%
    await masterVol.fill('50');
    await page.waitForTimeout(100);
    
    // Check audio element volume
    const volume = await audioEl.evaluate(el => (el as HTMLAudioElement).volume);
    expect(volume).toBeCloseTo(0.5, 1);
  });
});

// =============================================================================
// ACCESSIBILITY TESTS
// =============================================================================
test.describe('Audio Component Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/builder.html');
    await page.waitForFunction(() => typeof (window as any)['add'] === 'function');
  });

  test('Native audio has controls for keyboard access', async ({ page }) => {
    const element = await setupAudioComponent(page, {
      src: AUDIO_SRC,
      showEq: false
    });
    
    const audioEl = element.locator('audio');
    const hasControls = await audioEl.getAttribute('controls');
    
    expect(hasControls).not.toBeNull();
  });

  test('EQ sliders are keyboard accessible', async ({ page }) => {
    const element = await setupAudioComponent(page, {
      src: AUDIO_SRC,
      showEq: true
    });
    
    const slider = element.locator('.wb-audio__eq-slider').first();
    
    // Focus and use keyboard
    await slider.focus();
    const initialValue = await slider.inputValue();
    
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(50);
    
    const newValue = await slider.inputValue();
    
    // Value should have changed
    expect(parseInt(newValue)).toBeGreaterThan(parseInt(initialValue));
  });
});
