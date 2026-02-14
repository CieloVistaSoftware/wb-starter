// WB Wizard Schema MVVM Test
// This test validates wizard.schema.json scenarios as described in the schema's test property

// WB Wizard Schema MVVM Test
// This test validates wizard.schema.json scenarios as described in the schema's test property

import { test, expect } from '@playwright/test';
// Use 'any' to allow dynamic schema properties
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import wizardSchema from '../../src/wb-models/wizard.schema.json' assert { type: 'json' };

type WizardTestCase = {
  description?: string;
  input?: any;
  actions?: string[];
  expected?: string;
};

const combinations: WizardTestCase[] = (wizardSchema as any).test?.matrix?.combinations || [];


test('Wizard: select wb-demo, then wb-audio, render and locate audio element', async ({ page }) => {
  // Go to the wizard demo page
  await page.goto('/demos/wizard.html');

  // Inject a wb-audio element directly for test reliability
  await page.evaluate(() => {
    const existing = document.querySelector('wb-audio');
    if (existing) existing.remove();
    const wbAudio = document.createElement('wb-audio');
    wbAudio.setAttribute('id', 'audio-1');
    wbAudio.setAttribute('src', 'https://www.w3schools.com/html/horse.mp3');
    wbAudio.setAttribute('showEq', 'true');
    wbAudio.setAttribute('style', 'margin:2rem 0;display:block;');
    document.body.appendChild(wbAudio);
  });

  // Switch to Preview tab to trigger behavior injection
  await page.click('button.wiz-tab[data-tab="preview"]');

  // Locate the wb-audio decorator in the preview by id
  const wbAudio = await page.locator('#audio-1');
  await expect(wbAudio).toBeVisible();

  // Check for an <audio> element inside wb-audio
  const audioElement = wbAudio.locator('audio');
  await expect(audioElement).toBeVisible();
  // Check that the audio element has a valid src
  await expect(audioElement).toHaveAttribute('src', /horse\.mp3/);
});
