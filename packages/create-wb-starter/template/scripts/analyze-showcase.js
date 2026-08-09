import fs from 'fs';
const html = fs.readFileSync('demos/behaviors-showcase.html', 'utf8');

// Find all id= attributes
const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
console.log('All IDs:', ids.join(', '));
console.log('---');

// Check for key sections
const sections = ['header','nav','buttons','inputs','selection','feedback','overlays','navigation','data','media','effects','utilities','footer'];
sections.forEach(s => {
  console.log(s + ': ' + (ids.includes(s) ? 'YES' : 'NO'));
});

// Check for key components
console.log('---');
const components = ['wb-tabs','wb-accordion','wb-alert','wb-badge','wb-progress','wb-spinner','wb-avatar','wb-rating','wb-modal','wb-drawer','wb-audio','wb-switch','wb-demo'];
components.forEach(c => {
  const re = new RegExp('<' + c + '[\\s>]', 'gi');
  const count = (html.match(re) || []).length;
  console.log(c + ': ' + count);
});

// Check for x- behaviors
console.log('---');
const xBehaviors = ['x-stepper','x-breadcrumb','x-pagination','x-steps','x-clock','x-countdown','x-youtube','x-tooltip','x-ripple','x-toast','x-masonry','x-dropdown','x-toggle','x-sticky','x-drawer-layout'];
xBehaviors.forEach(x => {
  const re = new RegExp(x + '[="\\s>]', 'gi');
  const count = (html.match(re) || []).length;
  console.log(x + ': ' + count);
});
