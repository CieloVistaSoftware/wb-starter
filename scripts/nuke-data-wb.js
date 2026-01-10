/**
 * AGGRESSIVE FIX - Remove ALL data-wb artifacts from entire project
 * No legacy to preserve - fix everything
 */
import fs from 'fs';
import path from 'path';

const stats = { files: 0, replacements: 0 };
const SKIP = ['node_modules', '.git', 'dist', 'coverage'];

// Component mappings: -> <wb-X>
const COMPONENTS = [
  'card', 'badge', 'button', 'modal', 'alert', 'avatar', 'chip', 'progress',
  'spinner', 'skeleton', 'rating', 'switch', 'tabs', 'accordion', 'drawer',
  'dropdown', 'tooltip', 'navbar', 'footer', 'header', 'hero', 'container',
  'cardhero', 'cardimage', 'cardprofile', 'cardstats', 'cardpricing',
  'cardproduct', 'cardtestimonial', 'cardnotification', 'cardfile',
  'cardlink', 'cardhorizontal', 'cardoverlay', 'cardportfolio',
  'cardbutton', 'carddraggable', 'cardexpandable', 'cardminimizable',
  'cardvideo', 'code', 'grid', 'row', 'column', 'span', 'details',
  'repeater', 'control', 'themecontrol', 'input', 'select', 'textarea',
  'checkbox', 'dialog', 'audio', 'video', 'table', 'pre', 'ul', 'ol', 'dl',
  'codecontrol', 'statusbar', 'mdhtml', 'sheet', 'json', 'empty',
  'breadcrumb', 'pagination', 'steps', 'timeline', 'stat', 'list', 'desclist',
  'tags', 'autocomplete', 'file', 'otp', 'colorpicker', 'masked', 'password',
  'search', 'stepper', 'counter', 'image', 'gallery', 'youtube', 'ratio',
  'clock', 'countdown', 'relativetime', 'truncate', 'hotkey', 'kbd',
  'backtotop', 'countup', 'marquee', 'particle'
];

// Behaviors: -> x-X
const BEHAVIORS = [
  'ripple', 'tooltip', 'sticky', 'draggable', 'resizable', 'copy', 'share',
  'print', 'fullscreen', 'darkmode', 'collapse', 'animate', 'scroll',
  'parallax', 'lazy', 'form', 'validate', 'mask', 'confetti',
  'fireworks', 'snow', 'sparkle', 'glow', 'rainbow', 'bounce', 'shake',
  'pulse', 'flash', 'tada', 'wobble', 'jello', 'swing', 'rubberband',
  'heartbeat', 'fadein', 'slidein', 'zoomin', 'flip', 'rotate', 'typewriter',
  'lightbox', 'popover', 'confirm', 'prompt', 'notify', 'toast'
];

function fixContent(content, filePath) {
  let result = content;
  let changes = 0;
  
  // === HTML FILES ===
  if (filePath.endsWith('.html')) {
    
    // 1. Convert component tags: <wb-card  ...> -> <wb-card ...>
    COMPONENTS.forEach(comp => {
      // Match any HTML tag with
      const pattern = new RegExp(
        `<(div|section|article|span|nav|aside|main|header|footer|details|pre|ul|ol|dl|button|a|p|figure)([^>]*)\\bx-legacy=["']${comp}["']([^>]*)>`,
        'gi'
      );
      result = result.replace(pattern, (match, tag, before, after) => {
        changes++;
        const attrs = (before + after).replace(/\s+/g, ' ').trim();
        return `<wb-${comp}${attrs ? ' ' + attrs : '>'}`; 
      });
    });
    
    // 2. Convert behaviors: x-ripple -> x-ripple
    BEHAVIORS.forEach(behavior => {
      const pattern = new RegExp(`\\bx-legacy=["']${behavior}["']`, 'gi');
      if (pattern.test(result)) {
        result = result.replace(pattern, `x-${behavior}`);
        changes++;
      }
    });
    
    // 3. Multi-behavior: -> x-ripple x-toast
    result = result.replace(/x-legacy=["']([^"']+)["']/g, (match, behaviors) => {
      const parts = behaviors.split(/\s+/);
      if (parts.every(p => BEHAVIORS.includes(p))) {
        changes++;
        return parts.map(b => `x-${b}`).join(' ');
      }
      return match;
    });
  }
  
  // === JS FILES ===
  if (filePath.endsWith('.js')) {
    // Update selector strings
    result = result.replace(/\[x-legacy=["'](\w+)["']\]/g, (match, name) => {
      if (COMPONENTS.includes(name)) {
        changes++;
        return `wb-${name}`;
      }
      if (BEHAVIORS.includes(name)) {
        changes++;
        return `[x-${name}]`;
      }
      return match;
    });
    
    // Update getAttribute calls
    result = result.replace(/getAttribute\(['"]data-wb['"]\)/g, () => {
      changes++;
      return `tagName.toLowerCase().startsWith('wb-')`;
    });
  }
  
  // === MD FILES - Update code examples ===
  if (filePath.endsWith('.md')) {
    // Update examples in markdown
    COMPONENTS.forEach(comp => {
      const pattern = new RegExp(`x-legacy=["']${comp}["']`, 'gi');
      if (pattern.test(result)) {
        // In docs, show the new syntax
        result = result.replace(pattern, `<!-- Use <wb-${comp}> instead -->`);
        changes++;
      }
    });
  }
  
  return { result, changes };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { result, changes } = fixContent(content, filePath);
    
    if (changes > 0) {
      fs.writeFileSync(filePath, result);
      console.log(`✅ ${filePath}: ${changes} fixes`);
      stats.files++;
      stats.replacements += changes;
    }
  } catch (e) {
    console.error(`❌ ${filePath}: ${e.message}`);
  }
}

function scan(dir) {
  try {
    fs.readdirSync(dir).forEach(item => {
      if (SKIP.includes(item)) return;
      // Skip data folder entirely
      if (item === 'data') return;
      
      const fp = path.join(dir, item);
      if (fs.statSync(fp).isDirectory()) {
        scan(fp);
      } else if (/\.(html|js)$/i.test(item)) {
        // Skip test results and temp files
        if (item.includes('test-results') || item.includes('.temp')) return;
        processFile(fp);
      }
    });
  } catch (e) {}
}

console.log('='.repeat(60));
console.log('🔥 AGGRESSIVE FIX - Removing ALL data-wb artifacts');
console.log('='.repeat(60));
console.log('');

scan('.');

console.log('\n' + '='.repeat(60));
console.log('COMPLETE');
console.log('='.repeat(60));
console.log(`Files fixed: ${stats.files}`);
console.log(`Total replacements: ${stats.replacements}`);
