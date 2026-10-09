// The playground's "120 card heroes (all permutations)" example, in one place
// (#1597). demos/playground.html renders it live; scripts/render-hero-gallery.mjs
// renders each hero to a JPG for pages/hero-gallery.html. Both import this file,
// so the gallery always shows exactly the heroes the playground does.
//
// Combines the previous separate "20 card heroes" (plain x-cardhero)
// and "20 signature heroes" (x-cardhero + companion x-modal + x-fadein)
// generators into one 120-instance set, and now also cycles variant=
// and overlay= -- properties neither original ever touched -- alongside
// xalign/height/background. Property arrays deliberately have different
// lengths and are each offset by a different multiple of `round` (how
// many times the 12-item content list has already looped), the same
// background-offset trick both originals already used, now applied to
// every axis so paired combinations keep shifting well past any single
// array's own wrap point instead of repeating in lockstep.

const CONTENT = [
  ['Launch', 'Build faster with wb-starter', 'Schema-first, zero-build behaviors.', 'Get Started', 'View Docs'],
  ['New', 'Compose, don\'t configure', 'Stack x-* behaviors on any element.', 'Try it', 'Learn more'],
  ['v3', 'Themeable to the core', 'Every color flows from one theme system.', 'Explore themes', null],
  ['Open Source', 'Own your behaviors', 'Light DOM, no shadow boundaries.', 'Star on GitHub', 'Read the guide'],
  ['Fast', 'No build step. Ever.', 'Drop a script tag and go.', 'Get Started', null],
  ['Accessible', 'Semantics by default', 'Native elements, enhanced.', 'See a11y', 'Docs'],
  ['Zero Build.', 'Infinite Possibility.', 'The web framework that doesn’t need a framework.', 'Try the Playground', 'Read the Guide'],
  ['No Bundler.', 'No JSX. No Waiting.', 'Ship the way the browser already understands.', 'Try the Playground', 'Read the Guide'],
  ['Light DOM.', 'Always.', 'Never fight a shadow boundary again.', 'Try the Playground', 'Read the Guide'],
  ['Schema First.', 'Behavior Second.', 'Describe the shape. Let behaviors do the rest.', 'Try the Playground', 'Read the Guide'],
  ['Compose,', 'Don’t Configure.', 'Stack x-* behaviors on any native element.', 'Try the Playground', 'Read the Guide'],
  ['Themeable', 'To The Core.', 'Every color flows from one variable system.', 'Try the Playground', 'Read the Guide'],
];
const VARIANTS = ['default', 'cosmic', 'split', 'minimal', 'gradient'];
const XALIGNS = ['center', 'left', 'right'];
const HEIGHTS = ['320px', '380px', '440px', '500px'];
const BGS = [
  null, null,
  'linear-gradient(135deg, var(--success-color), var(--info-color))',
  'linear-gradient(135deg, var(--danger-color), var(--warning-color))',
  'linear-gradient(135deg, var(--primary), var(--secondary))',
  'linear-gradient(135deg, var(--primary), var(--info-color))',
  '../images/placeholder-waves.svg',
];
// Each CTA links to the doc it's talking about, on the LIVE site (John:
// "make all the links on hero demos go to the .io site"). A hero is a
// demo of a real landing page, so its buttons go where a real visitor's
// would, not to a relative path that only works inside this repo.
const SITE = 'https://cielovistasoftware.github.io/wb-starter/';
const DV = (file) => SITE + 'public/doc-viewer.html?file=' + encodeURIComponent(file);
const INTRO = SITE + '?page=introduction';
const CTA_HREF = {
  'Get Started': DV('docs/V3-GUIDE.md'), 'View Docs': DV('docs/V3-GUIDE.md'),
  // #1244: "Read the guide" opens the Introduction, the evaluator's entry point.
  'Docs': DV('docs/V3-GUIDE.md'), 'Read the guide': INTRO, 'Read the Guide': INTRO,
  'Try it': DV('docs/V3-GUIDE.md'), 'Learn more': DV('docs/behaviors-reference.md'),
  'Explore themes': DV('docs/themes.md'), 'See a11y': DV('docs/V3-GUIDE.md'),
  'Star on GitHub': 'https://github.com/CieloVistaSoftware/wb-starter',
  'Try the Playground': SITE + 'demos/playground.html',
};
const href = (c) => CTA_HREF[c] || DV('docs/V3-GUIDE.md');

/**
 * A CTA link as the gallery page writes it (#1597). The page is part of the
 * site, so a link into the site is written relative: on the live site
 * it opens the same .io page, and it doesn't repeat the site's URL 160+ times
 * (wb-prefix-cannot-return counts every "wb-starter", and the absolute links
 * pushed PACKAGE from ~780 to 1018). Links off the site stay absolute.
 */
export function galleryHref(link) {
  // Every link into the site: the gallery is a page fragment, injected at the
  // site root, so a root-relative href opens the same .io page. refs-resolve
  // resolves a fragment's links against the site root since #1244 (it used to
  // use pages/, which is why the playground link had to stay absolute).
  return link.startsWith(SITE) ? link.slice(SITE.length) : link;
}

/**
 * The 120 heroes, one entry each: its markup plus the facts the gallery
 * needs (title, the two CTA labels and links; cta2 is null when absent).
 */
export function heroPermutations() {
  const out = [];
  for (let i = 0; i < 120; i++) {
    const round = Math.floor(i / CONTENT.length);
    const [pre, title, sub, cta, cta2] = CONTENT[i % CONTENT.length];
    const variant = VARIANTS[(i + round) % VARIANTS.length];
    const xalign = XALIGNS[(i + round * 2) % XALIGNS.length];
    const height = HEIGHTS[(i + round * 3) % HEIGHTS.length];
    const bg = BGS[(i + round * 5) % BGS.length];
    const overlay = (i + round) % 5 !== 0; // on by default; off roughly 1-in-5 so it's exercised too
    // The companion trigger is <button x-modal>: it was a bare <dialog
    // modalTitle> (the migration's reading of <x-modal>), which only
    // showed at all because .x-dialog--trigger overrode the UA's hidden
    // <dialog>, and read to assistive tech as a dialog rather than a button.
    const signatureStyle = i % 2 === 1; // alternate the two original styles
    const attrs = [
      `pretitle="${pre} #${i + 1}"`,
      `title="${title}"`,
      `subtitle="${sub}"`,
      `height="${height}"`,
      `xalign="${xalign}"`,
      variant !== 'default' ? `variant="${variant}"` : '',
      overlay ? '' : `overlay="false"`,
      cta ? `cta="${cta}"` : '',
      cta ? `ctaHref="${href(cta)}"` : '',
      // The signature style's themed tooltip on its primary CTA. It was
      // part of the "20 signature heroes" set this generator absorbed, and
      // was lost in the merge -- cardhero still reads cta-tooltip (card.js)
      // and turns it into an x-tooltip on the button.
      signatureStyle && cta ? `cta-tooltip="${sub}"` : '',
      cta2 ? `ctaSecondary="${cta2}"` : '',
      cta2 ? `ctaSecondaryHref="${href(cta2)}"` : '',
      bg ? `background="${bg}"` : '',
      signatureStyle ? 'x-fadein' : '',
    ].filter(Boolean);
    const hero = `<section x-cardhero\n  ${attrs.join('\n  ')}>\n</section>`;
    const markup = signatureStyle
      ? `<div class="pg-signature-hero">\n  ${hero.replace(/\n/g, '\n  ')}\n  <button x-modal\n    modalTitle="${title}"\n    modalContent="${sub}">\n    See it in action\n  </button>\n</div>`
      : hero;
    out.push({
      index: i + 1,
      title,
      heroMarkup: hero,
      markup,
      cta: cta ? { label: cta, href: href(cta) } : null,
      cta2: cta2 ? { label: cta2, href: href(cta2) } : null,
    });
  }
  return out;
}

/** The playground's example text: every hero's markup, one after another. */
export function oneTwentyHeroes() {
  return heroPermutations().map((h) => h.markup).join('\n');
}
