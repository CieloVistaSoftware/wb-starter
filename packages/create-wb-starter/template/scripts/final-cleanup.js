/**
 * FINAL CLEANUP - Fix HTML-encoded examples and remaining stragglers
 */
import fs from 'fs';
import path from 'path';

const stats = { files: 0, replacements: 0 };
const SKIP = ['node_modules', '.git', 'dist', 'coverage', 'data'];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    
    if (!content.includes('x-behavior')) return;
    
    // HTML-encoded examples: &lt;div -> &lt;wb-card
    const components = [
      'card', 'cardimage', 'cardstats', 'cardpricing', 'cardprofile', 
      'cardproduct', 'cardhero', 'cardtestimonial', 'button', 'input',
      'details', 'figure', 'audio', 'video', 'modal', 'alert', 'badge'
    ];
    
    components.forEach(c => {
      // &lt;div -> &lt;wb-card
      content = content.replace(
        new RegExp(`&lt;(div|section|article)\\s+x-legacy=["']${c}["']`, 'gi'),
        `&lt;wb-${c}`
      );
      // Also handle when attribute comes later
      content = content.replace(
        new RegExp(`x-legacy=["']${c}["']`, 'gi'),
        ``
      );
    });
    
    // Remove the comment about old syntax in pages/home.html
    content = content.replace(/- <wb-\w+>\s+NOT\s+x-legacy=["'][^"']+["']/g, '');
    
    // Fix kitchen-sink tag attributes  
    content = content.replace(/tag="]*'"/g, '');
    
    // Fix React/Vue examples in frameworks.html
    content = content.replace(/'x-behavior':\s*'[^']+',?\s*\/\/[^\n]*/g, '');
    content = content.replace(/<code>data-wb<\/code>/g, '<code>x-*</code>');
    
    // Fix CSS comments
    content = content.replace(//g, 'wb-header');
    content = content.replace(//g, 'wb-builder');
    
    // Fix button patterns
    content = content.replace(//g, 'x-$1');
    content = content.replace(//g, '');
    
    // Fix schema-viewer.html
    content = content.replace(
      /exampleHTML = `<\$\{tagName\}`;/g,
      'exampleHTML = `<wb-${componentName}`;'
    );
    
    // Fix mvvm-test.html headers
    content = content.replace(/<h3>data-wb Attribute<\/h3>/g, '<h3>Web Component Tags</h3>');
    
    // Remove x-ignore (legitimate opt-out, keep as is)
    // content = content.replace(/x-ignore/g, 'x-wb-ignore');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ ${filePath}`);
      stats.files++;
      stats.replacements++;
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
        processFile(fp);
      }
    });
  } catch (e) {}
}

console.log('🧹 Final cleanup...\n');
scan('.');
console.log(`\nFixed ${stats.files} files`);
