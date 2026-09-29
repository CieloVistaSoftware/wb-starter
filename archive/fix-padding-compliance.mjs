/**
 * Fix content-panel padding violations by adding padding to buttons
 */
import fs from 'fs';

const FILES = [
  'demos/autoinject.html',
  'demos/multi-component-demo-generated.html',
  'demos/schema-first-architecture.html',
  'demos/site/cards.html',
  'demos/site/content.html',
  'demos/site/effects.html',
  'demos/site/feedback.html',
  'demos/site/forms.html',
  'demos/site/interactive.html',
  'demos/site/layout.html',
  'demos/site/overlays.html',
  'demos/site/shop-now.html',
  'pages/ai-permutation-test.html',
  'pages/behaviors.html',
  'pages/components.html',
  'pages/home.html',
  'pages/themes.html',
  'pages/whats-new.html'
];

console.log('Fixing button padding in', FILES.length, 'files...\n');

for (const file of FILES) {
  try {
    let html = fs.readFileSync(file, 'utf8');
    const original = html;
    
    html = html.replace(/<button([^>]*)>/g, (match, attrs) => {
      if (!attrs.includes('style=')) {
        return \<button\ style="padding: 1rem !important;">\;
      }
      return match;
    });
    
    if (html !== original) {
      fs.writeFileSync(file, html, 'utf8');
      console.log('✓', file);
    }
  } catch (e) {
    console.error('✗', file, e.message);
  }
}
