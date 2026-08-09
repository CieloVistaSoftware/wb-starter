/**
 * NUKE EVERYTHING - Remove ALL data-wb from entire project
 * Aggressive mode - no legacy to preserve
 */
import fs from 'fs';
import path from 'path';

const stats = { files: 0, replacements: 0 };
const SKIP = ['node_modules', '.git', 'dist', 'coverage', 'data'];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    
    // Skip if no data-wb
    if (!content.includes('x-behavior')) return;
    
    // === AGGRESSIVE REPLACEMENTS ===
    
    // 1. All -> x-X (for behaviors)
    const behaviors = [
      'ripple', 'tooltip', 'sticky', 'draggable', 'resizable', 'copy', 'share',
      'print', 'fullscreen', 'darkmode', 'collapse', 'animate', 'scroll',
      'parallax', 'lazy', 'form', 'validate', 'mask', 'confetti', 'fireworks', 
      'snow', 'sparkle', 'glow', 'rainbow', 'bounce', 'shake', 'pulse', 'flash', 
      'tada', 'wobble', 'jello', 'swing', 'rubberband', 'heartbeat', 'fadein', 
      'slidein', 'zoomin', 'flip', 'rotate', 'typewriter', 'lightbox', 'popover', 
      'confirm', 'prompt', 'notify', 'toast', 'backtotop', 'clock', 'countdown',
      'relativetime', 'truncate', 'hotkey', 'countup', 'marquee', 'particle',
      'json', 'kbd', 'empty', 'breadcrumb', 'pagination', 'steps', 'timeline',
      'stat', 'list', 'desclist', 'tags', 'autocomplete', 'file', 'otp',
      'colorpicker', 'masked', 'password', 'search', 'stepper', 'counter',
      'image', 'gallery', 'youtube', 'ratio', 'stack', 'cluster', 'grid'
    ];
    
    behaviors.forEach(b => {
      content = content.replace(new RegExp(`x-legacy=["']${b}["']`, 'gi'), `x-${b}`);
    });
    
    // 2. All on div/etc -> <wb-component>
    const components = [
      'card', 'badge', 'button', 'modal', 'alert', 'avatar', 'chip', 'progress',
      'spinner', 'skeleton', 'rating', 'switch', 'tabs', 'accordion', 'drawer',
      'dropdown', 'navbar', 'footer', 'header', 'hero', 'container',
      'cardhero', 'cardimage', 'cardprofile', 'cardstats', 'cardpricing',
      'cardproduct', 'cardtestimonial', 'cardnotification', 'cardfile',
      'cardlink', 'cardhorizontal', 'cardoverlay', 'cardportfolio',
      'cardbutton', 'carddraggable', 'cardexpandable', 'cardminimizable',
      'cardvideo', 'code', 'row', 'column', 'span', 'details', 'pre', 'ul', 'ol', 'dl',
      'repeater', 'control', 'themecontrol', 'input', 'select', 'textarea',
      'checkbox', 'dialog', 'audio', 'video', 'table', 'codecontrol', 
      'statusbar', 'mdhtml', 'sheet', 'builder'
    ];
    
    components.forEach(c => {
      // <wb-card  -> <wb-card
      content = content.replace(
        new RegExp(`<(div|section|article|span|nav|aside|main|header|footer|details|pre|ul|ol|dl|button|a|p|figure)([^>]*)\\bx-legacy=["']${c}["']`, 'gi'),
        `<wb-${c}$2`
      );
    });
    
    // 3. CSS selectors: [] -> wb-X or [x-X]
    content = content.replace(/\[x-legacy=["'](\w+)["']\]/g, (match, name) => {
      if (components.includes(name)) return `wb-${name}`;
      if (behaviors.includes(name)) return `[x-${name}]`;
      return match;
    });
    
    // 4. dataset.wb references in JS
    content = content.replace(/\.dataset\.wb\s*===?\s*["'](\w+)["']/g, (match, name) => {
      if (components.includes(name)) return `.tagName.toLowerCase() === 'wb-${name}'`;
      return match;
    });
    
    // 5. Clean up any remaining simple patterns
    content = content.replace(/x-legacy=["']button["']/gi, '');
    content = content.replace(/x-legacy=["']input["']/gi, '');
    content = content.replace(/x-legacy=["']details["']/gi, '');
    content = content.replace(/x-legacy=["']figure["']/gi, '');
    content = content.replace(/x-legacy=["']audio["']/gi, '');
    content = content.replace(/x-legacy=["']video["']/gi, '');
    
    // 6. Remove empty
    content = content.replace(/\s*x-legacy=["']["']/g, '');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content);
      const count = (original.match(/data-wb/g) || []).length - (content.match(/data-wb/g) || []).length;
      console.log(`✅ ${filePath}: ${count} fixes`);
      stats.files++;
      stats.replacements += Math.max(count, 1);
    }
  } catch (e) {
    console.error(`❌ ${filePath}: ${e.message}`);
  }
}

function scan(dir) {
  try {
    fs.readdirSync(dir).forEach(item => {
      if (SKIP.includes(item)) return;
      const fp = path.join(dir, item);
      if (fs.statSync(fp).isDirectory()) {
        scan(fp);
      } else if (/\.(html|js|css)$/i.test(item)) {
        if (item.includes('test-results') || item.includes('.temp')) return;
        processFile(fp);
      }
    });
  } catch (e) {}
}

console.log('='.repeat(60));
console.log('🔥 NUKING ALL data-wb - No legacy to preserve');
console.log('='.repeat(60));
console.log('');

scan('.');

console.log('\n' + '='.repeat(60));
console.log('DONE');
console.log('='.repeat(60));
console.log(`Files fixed: ${stats.files}`);
console.log(`Replacements: ${stats.replacements}`);
