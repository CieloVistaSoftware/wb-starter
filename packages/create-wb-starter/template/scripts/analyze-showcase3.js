import fs from 'fs';

const html = fs.readFileSync('demos/behaviors-showcase.html', 'utf8');

// Check exact selectors the failing tests use
const checks = [
  { name: 'x-stepper in #selection', selector: '#selection', attr: 'x-stepper' },
  { name: 'wb-alert[type="info"] in #feedback', selector: '#feedback', check: 'wb-alert' },
  { name: 'x-breadcrumb in #navigation', selector: '#navigation', attr: 'x-breadcrumb' },
  { name: 'x-pagination in #navigation', selector: '#navigation', attr: 'x-pagination' },
  { name: 'x-steps in #navigation', selector: '#navigation', attr: 'x-steps' },
  { name: 'wb-audio in #media', selector: '#media', check: 'wb-audio' },
  { name: 'x-youtube in #media', selector: '#media', attr: 'x-youtube' },
  { name: 'x-clock in #utilities', selector: '#utilities', attr: 'x-clock' },
  { name: 'x-countdown in #utilities', selector: '#utilities', attr: 'x-countdown' },
];

// For each check, find if the section exists and contains the element
checks.forEach(c => {
  const sectionIdx = html.indexOf(`id="${c.selector.replace('#', '')}"`);
  if (sectionIdx === -1) {
    console.log(`${c.name}: SECTION NOT FOUND`);
    return;
  }
  
  // Find next section or end
  const sectionStart = html.lastIndexOf('<section', sectionIdx);
  const afterSection = html.indexOf('</section>', sectionIdx);
  if (sectionStart === -1 || afterSection === -1) {
    console.log(`${c.name}: Could not find section boundaries`);
    return;
  }
  
  const sectionHtml = html.substring(sectionStart, afterSection + 10);
  
  if (c.attr) {
    const re = new RegExp(c.attr, 'gi');
    const count = (sectionHtml.match(re) || []).length;
    console.log(`${c.name}: ${count} instances in section`);
  }
  if (c.check) {
    const re = new RegExp('<' + c.check, 'gi');
    const count = (sectionHtml.match(re) || []).length;
    console.log(`${c.name}: ${count} instances in section`);
  }
});

// Also check wb-spinner for animation
const spinners = (html.match(/<wb-spinner/gi) || []).length;
console.log(`\nwb-spinner total: ${spinners}`);

// Check if alerts have type attribute
const alertTypes = [...html.matchAll(/<wb-alert[^>]*type="([^"]+)"/gi)].map(m => m[1]);
console.log('Alert types found:', alertTypes.join(', '));

// Check toast button attributes 
const toastBtns = [...html.matchAll(/<[^>]*x-toast[^>]*/gi)];
console.log('Toast buttons:', toastBtns.length);
if (toastBtns.length > 0) {
  console.log('  First:', toastBtns[0][0].substring(0, 120));
}
