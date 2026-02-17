import fs from 'fs';

// Fix the renamed attributes in behavior JS files
// data-type → variant, data-title → heading, data-content → description, 
// data-id (youtube) → video-id, data-copy → copy-text

const fixes = [
  {
    file: 'src/wb-viewmodels/feedback.js',
    replacements: [
      // toast: type → variant
      [/element\.getAttribute\('type'\) \|\| 'info'/g, "element.getAttribute('variant') || 'info'"],
      // alert: type attribute reading 
      [/options\.type \|\| element\.getAttribute\('type'\)/g, "options.variant || element.getAttribute('variant')"],
    ]
  },
  {
    file: 'src/wb-viewmodels/overlay.js',
    replacements: [
      // popover: title → heading, content → description
      [/element\.getAttribute\('title'\)/g, "element.getAttribute('heading')"],
      [/element\.getAttribute\('content'\)/g, "element.getAttribute('description')"],
    ]
  },
  {
    file: 'src/wb-viewmodels/helpers.js',
    replacements: [
      // copy: copy → copy-text
      [/element\.getAttribute\('copy'\)/g, "element.getAttribute('copy-text')"],
      // share: share-title, share-url already correct from migration
    ]
  },
  {
    file: 'src/wb-viewmodels/media.js',
    replacements: [
      // youtube: id → video-id
      [/element\.getAttribute\('id'\)(?!.*\/\/)/g, "element.getAttribute('video-id')"],
    ]
  },
];

fixes.forEach(({file, replacements}) => {
  if (!fs.existsSync(file)) { console.log('SKIP:', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  let count = 0;
  replacements.forEach(([pattern, replacement]) => {
    const before = content;
    content = content.replace(pattern, replacement);
    if (content !== before) count++;
  });
  if (count > 0) {
    fs.writeFileSync(file, content);
    console.log(file + ': ' + count + ' fixes');
  } else {
    console.log(file + ': no changes needed');
  }
});

// Also check tabs.js for tab-title and navigation.js for accordion-title
['src/wb-viewmodels/tabs.js', 'src/wb-viewmodels/navigation.js'].forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // tab-title and accordion-title: migration converted dataset.tabTitle → getAttribute('tab-title') which is CORRECT
  const tabTitle = content.includes("getAttribute('tab-title')");
  const accTitle = content.includes("getAttribute('accordion-title')");
  console.log(file + ': tab-title=' + tabTitle + ' accordion-title=' + accTitle);
});
