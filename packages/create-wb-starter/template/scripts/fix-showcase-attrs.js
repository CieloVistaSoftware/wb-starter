import fs from 'fs';

let html = fs.readFileSync('demos/behaviors-showcase.html', 'utf8');

// Map of data-xxx → plain attribute conversions
// Some need special handling per the ATTRIBUTE-NAMING-STANDARD
const replacements = [
  // data-type → variant (per naming standard: "type" is reserved)
  [/data-type="/g, 'variant="'],
  // data-variant → variant
  [/data-variant="/g, 'variant="'],
  // data-message → message
  [/data-message="/g, 'message="'],
  // data-position → position
  [/data-position="/g, 'position="'],
  // data-value → value
  [/data-value="/g, 'value="'],
  // data-min → min (native)
  [/data-min="/g, 'min="'],
  // data-max → max (native)
  [/data-max="/g, 'max="'],
  // data-items → items
  [/data-items="/g, 'items="'],
  // data-current → current
  [/data-current="/g, 'current="'],
  // data-total → total
  [/data-total="/g, 'total="'],
  // data-per-page → per-page
  [/data-per-page="/g, 'per-page="'],
  // data-columns → columns
  [/data-columns="/g, 'columns="'],
  // data-id → video-id (for youtube, avoid collision with native id)
  [/data-id="/g, 'video-id="'],
  // data-ratio → ratio
  [/data-ratio="/g, 'ratio="'],
  // data-src → src (native)
  [/data-src="/g, 'src="'],
  // data-to → to
  [/data-to="/g, 'to="'],
  // data-date → date
  [/data-date="/g, 'date="'],
  // data-copy → copy-text
  [/data-copy="/g, 'copy-text="'],
  // data-share-title → share-title
  [/data-share-title="/g, 'share-title="'],
  // data-share-url → share-url
  [/data-share-url="/g, 'share-url="'],
  // data-lines → lines
  [/data-lines="/g, 'lines="'],
  // data-lazy → lazy (boolean)
  [/data-lazy=""/g, 'lazy=""'],
  [/data-lazy(?=")/g, 'lazy'],
  // data-zoomable → zoomable (boolean)
  [/data-zoomable=""/g, 'zoomable=""'],
  [/data-zoomable(?=")/g, 'zoomable'],
  // data-direction → direction
  [/data-direction="/g, 'direction="'],
  // data-title → heading (per naming standard: "title" creates browser tooltip)
  [/data-title="/g, 'heading="'],
  // data-content → description (per naming standard: avoid "content")
  [/data-content="/g, 'description="'],
  // data-mask → mask
  [/data-mask="/g, 'mask="'],
  // data-autosize → autosize (boolean)
  [/data-autosize=""/g, 'autosize=""'],
  // data-theme → (keep, this is on <html> element, different context)
  // data-tab-title → tab-title
  [/data-tab-title="/g, 'tab-title="'],
  // data-accordion-title → accordion-title
  [/data-accordion-title="/g, 'accordion-title="'],
];

replacements.forEach(([pattern, replacement]) => {
  const before = html.length;
  html = html.replace(pattern, replacement);
});

// Also fix the code examples inside <wb-mdhtml> blocks - they show data- in example code
// These are display-only but should reflect the correct API

fs.writeFileSync('demos/behaviors-showcase.html', html);

// Count remaining data- attributes (excluding data-theme on html tag)
const remaining = [...html.matchAll(/\sdata-(?!theme)[a-z][a-z0-9-]*(?==)/g)].map(m => m[0].trim());
const unique = [...new Set(remaining)];
console.log('Remaining data- attrs:', unique.length);
unique.forEach(u => console.log('  ' + u));
