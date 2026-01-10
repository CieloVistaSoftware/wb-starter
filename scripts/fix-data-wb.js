/**
 * AUTO-FIX ALL data-wb artifacts in SOURCE files
 * Converts: -> <wb-X> or x-X
 */
import fs from 'fs';
import path from 'path';

// Components that become <wb-*> tags
const COMPONENTS = [
  'card', 'badge', 'button', 'modal', 'alert', 'avatar', 'chip', 'progress',
  'spinner', 'skeleton', 'rating', 'switch', 'tabs', 'accordion', 'drawer',
  'dropdown', 'tooltip', 'toast', 'navbar', 'footer', 'header', 'hero',
  'cardhero', 'cardimage', 'cardprofile', 'cardstats', 'cardpricing',
  'cardproduct', 'cardtestimonial', 'cardnotification', 'cardfile',
  'cardlink', 'cardhorizontal', 'cardoverlay', 'cardportfolio',
  'cardbutton', 'carddraggable', 'cardexpandable', 'cardminimizable',
  'cardvideo', 'code', 'container', 'grid', 'row', 'column', 'span',
  'repeater', 'control', 'themecontrol', 'input', 'select', 'textarea',
  'checkbox', 'dialog', 'details', 'audio', 'video', 'table'
];

// Behaviors that become x-* attributes
const BEHAVIORS = [
  'ripple', 'tooltip', 'sticky', 'draggable', 'resizable', 'copy', 'share',
  'print', 'fullscreen', 'darkmode', 'collapse', 'animate', 'scroll',
  'parallax', 'lazy', 'form', 'validate', 'mask', 'hotkey', 'confetti',
  'fireworks', 'snow', 'sparkle', 'glow', 'rainbow', 'bounce', 'shake',
  'pulse', 'flash', 'tada', 'wobble', 'jello', 'swing', 'rubberband',
  'heartbeat', 'fadein', 'slidein', 'zoomin', 'flip', 'rotate', 'typewriter',
  'countup', 'marquee', 'particle', 'lightbox', 'popover', 'confirm',
  'prompt', 'sheet', 'notify', 'backtotop', 'clock', 'countdown',
  'relativetime', 'truncate', 'gallery', 'youtube', 'ratio', 'json',
  'kbd', 'empty', 'breadcrumb', 'pagination', 'steps', 'timeline',
  'stat', 'list', 'desclist', 'tags', 'autocomplete', 'file', 'otp',
  'colorpicker', 'masked', 'password', 'search', 'stepper', 'counter',
  'image'
];

const stats = { filesProcessed: 0, filesModified: 0, replacements: 0 };

function convertLine(line) {
  let modified = line;
  let changes = 0;
  
  // Pattern 1: on div/span/etc -> <wb-component>
  // This is complex - would need DOM parsing. Skip for now, document for manual fix.
  
  // Pattern 2: -> x-behavior
  BEHAVIORS.forEach(behavior => {
    const pattern = new RegExp(`x-legacy=["']${behavior}["']`, 'gi');
    if (pattern.test(modified)) {
      modified = modified.replace(pattern, `x-${behavior}`);
      changes++;
    }
  });
  
  // Pattern 3: Multiple behaviors -> x-ripple x-toast
  const multiBehaviorPattern = /x-legacy=["']([^"']+)["']/g;
  let match;
  while ((match = multiBehaviorPattern.exec(line)) !== null) {
    const behaviors = match[1].split(/\s+/);
    const allAreBehaviors = behaviors.every(b => BEHAVIORS.includes(b.toLowerCase()));
    if (allAreBehaviors && behaviors.length > 1) {
      const replacement = behaviors.map(b => `x-${b}`).join(' ');
      modified = modified.replace(match[0], replacement);
      changes++;
    }
  }
  
  return { modified, changes };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('x-behavior')) return false;
    
    const lines = content.split('\n');
    let totalChanges = 0;
    const newLines = lines.map(line => {
      const { modified, changes } = convertLine(line);
      totalChanges += changes;
      return modified;
    });
    
    if (totalChanges > 0) {
      fs.writeFileSync(filePath, newLines.join('\n'));
      console.log(`✅ ${filePath}: ${totalChanges} replacements`);
      stats.replacements += totalChanges;
      stats.filesModified++;
      return true;
    }
    return false;
  } catch (e) {
    console.error(`❌ Error processing ${filePath}: ${e.message}`);
    return false;
  }
}

function scan(dir, extensions = ['.html', '.js']) {
  const SKIP = ['node_modules', '.git', 'dist', 'coverage', 'data'];
  
  try {
    fs.readdirSync(dir).forEach(item => {
      if (SKIP.includes(item)) return;
      const fp = path.join(dir, item);
      if (fs.statSync(fp).isDirectory()) {
        scan(fp, extensions);
      } else {
        const ext = path.extname(item).toLowerCase();
        if (extensions.includes(ext)) {
          stats.filesProcessed++;
          processFile(fp);
        }
      }
    });
  } catch (e) {}
}

console.log('='.repeat(60));
console.log('AUTO-FIX: Converting data-wb to x-* behaviors');
console.log('='.repeat(60));
console.log('\nProcessing HTML and JS files...\n');

// Process source files
scan('./pages', ['.html']);
scan('./demos', ['.html']);
scan('./src', ['.html', '.js']);
scan('./public', ['.html']);
scan('./tests', ['.html']);

console.log('\n' + '='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));
console.log(`Files processed: ${stats.filesProcessed}`);
console.log(`Files modified: ${stats.filesModified}`);
console.log(`Total replacements: ${stats.replacements}`);
console.log('\nNote: Complex component conversions (div -> <wb-card>)');
console.log('require manual review or a more sophisticated parser.');
