
import { getBehavior } from './src/behaviors/index.js';

async function testBehavior(name) {
  console.log(`Testing ${name}...`);
  try {
    const fn = await getBehavior(name);
    console.log(`Got function for ${name}`);
    
    const el = document.createElement('div');
    document.body.appendChild(el);
    
    // Mock dataset
    el.dataset = {};
    
    try {
      fn(el);
      console.log(`Applied ${name}. Classes: ${el.className}`);
      
      // Check base class
      const expectedClass = `wb-${name.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}`; // camelCase to kebab-case
      if (el.classList.contains(expectedClass)) {
        console.log(`PASS: Has ${expectedClass}`);
      } else {
        console.log(`FAIL: Missing ${expectedClass}`);
      }
      
    } catch (e) {
      console.error(`Error applying ${name}:`, e);
    }
    
    el.remove();
  } catch (e) {
    console.error(`Error loading ${name}:`, e);
  }
  console.log('---');
}

// Mock DOM
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><body></body>');
global.document = dom.window.document;
global.window = dom.window;
global.HTMLElement = dom.window.HTMLElement;
global.NodeList = dom.window.NodeList;

// Run tests
async function run() {
  await testBehavior('drawerLayout');
  await testBehavior('dialog');
  await testBehavior('drawer');
  await testBehavior('confetti');
  await testBehavior('cardvideo');
}

run();
