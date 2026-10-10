/* global document, Node -- this function runs in the browser page, not in Node. */
/**
 * The extractor: runs INSIDE the rendered page (page.evaluate), so it reads
 * the DOM the browser built, after the page's own scripts ran, not the raw
 * source. It must not reference anything outside this one function:
 * Playwright sends its source text to the page.
 *
 * It walks document.body and returns:
 *   nodes        the proposed fragment, as a plain tree
 *                ({t:'el', tag, attrs, kids} | {t:'text', v} | {t:'comment', v})
 *   findings     one entry per element it changed, with the reason
 *   unclassified regions it could not map, left in place under a TODO comment
 *   assets       every image, media file, icon and download the page uses
 *   shell        what belongs in config/site.json, not in a page
 *   sourceText   all the text of the page, for the "nothing invented" check
 *
 * Every rule here maps onto markup WB Starter already has: a native element
 * that auto-injects its behavior (nativeMap in src/core/tag-map.js) or an
 * x-* attribute in extensionMap. The registry is passed in, and the rules
 * refuse to emit an x-* attribute it does not list.
 *
 * @param {{nativeMap: Record<string,string>, extensionMap: Record<string,string>}} registry
 */
export function extractInPage(registry) {
  const findings = [];
  const unclassified = [];
  const assets = [];
  const shell = {
    companyName: null,
    pageTitle: (document.title || '').trim() || null,
    pageDescription: null,
    navigationMenu: [],
    notInMenu: [],
    footerCopyrightText: null,
  };

  const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const lower = (el) => el.tagName.toLowerCase();
  const classList = (el) => [...el.classList].map((c) => c.toLowerCase());
  const hasClass = (el, re) => classList(el).some((c) => re.test(c));
  const kids = (el) => [...el.children];

  // ---------------------------------------------------------------- registry
  const native = Object.entries(registry.nativeMap);
  /** The behavior a native element auto-injects, from nativeMap. */
  const nativeBehavior = (el) => {
    for (const [selector, behavior] of native) if (el.matches(selector)) return { selector, behavior };
    return null;
  };
  /** An x-* attribute, only if extensionMap has it. */
  const xAttr = (name) => {
    if (!(name in registry.extensionMap)) throw new Error(`site-migrate rule asked for ${name}, which is not in extensionMap`);
    return [name, ''];
  };
  /** A native tag whose behavior the rule relies on, only if nativeMap has it. */
  const nativeTag = (tag) => {
    if (!(tag in registry.nativeMap)) throw new Error(`site-migrate rule relies on <${tag}> auto-injecting, but nativeMap has no "${tag}"`);
    return tag;
  };

  // ---------------------------------------------------------------- describing
  const describe = (el) => {
    const parts = [lower(el)];
    for (const a of ['id', 'class', 'role']) if (el.hasAttribute(a)) parts.push(`${a}="${norm(el.getAttribute(a))}"`);
    return `<${parts.join(' ')}>`;
  };
  const step = (el) => {
    const tag = lower(el);
    if (el.id) return `${tag}#${el.id}`;
    const cls = el.classList[0] ? `.${el.classList[0]}` : '';
    const same = el.parentElement ? kids(el.parentElement).filter((k) => lower(k) === tag) : [];
    const nth = same.length > 1 ? `:nth-of-type(${same.indexOf(el) + 1})` : '';
    return `${tag}${cls}${nth}`;
  };
  const pathOf = (el) => {
    const steps = [];
    for (let n = el; n && n !== document.body && n !== document.documentElement; n = n.parentElement) steps.unshift(step(n));
    return (document.body.contains(el) ? ['body', ...steps] : steps).join(' > ');
  };
  const showTag = (tag, attrs) => `<${[tag, ...attrs.map(([k, v]) => (v === '' ? k : `${k}="${v}"`))].join(' ')}>`;
  const note = (el, to, why) => findings.push({ path: pathOf(el), from: describe(el), to, why });
  /** Hold a finding's place, so a parent is listed before the children it converts first. */
  const reserve = () => findings.push(null) - 1;
  const fill = (i, el, to, why) => { findings[i] = { path: pathOf(el), from: describe(el), to, why }; };

  // ---------------------------------------------------------------- assets
  const asset = (el, kind, url) => {
    if (!url || url.startsWith('data:') || url.startsWith('#') || url.startsWith('javascript:') || url.startsWith('mailto:') || url.startsWith('tel:')) return;
    if (!assets.some((a) => a.url === url && a.kind === kind)) assets.push({ kind, url, usedBy: pathOf(el) });
  };
  const DOWNLOAD = /\.(pdf|zip|docx?|xlsx?|pptx?|csv|mp3|mp4|webm|png|jpe?g|gif|svg|webp)(\?|#|$)/i;
  const collectAssets = (el) => {
    const tag = lower(el);
    if (tag === 'img') { asset(el, 'image', el.getAttribute('src')); for (const s of (el.getAttribute('srcset') || '').split(',')) asset(el, 'image', norm(s).split(' ')[0]); }
    if (['video', 'audio', 'source', 'track'].includes(tag)) asset(el, tag === 'track' ? 'captions' : 'media', el.getAttribute('src'));
    if (tag === 'video') asset(el, 'image', el.getAttribute('poster'));
    if (tag === 'a' && DOWNLOAD.test(el.getAttribute('href') || '')) asset(el, 'download', el.getAttribute('href'));
    const style = el.getAttribute('style') || '';
    for (const m of style.matchAll(/url\((['"]?)([^'")]+)\1\)/g)) asset(el, 'image (from inline style)', m[2]);
  };

  // ---------------------------------------------------------------- attributes
  // What a migrated element keeps: what the content means, never how their
  // site styled or scripted it.
  const KEEP = new Set(['id', 'href', 'src', 'srcset', 'sizes', 'alt', 'type', 'name', 'for', 'value', 'placeholder',
    'required', 'checked', 'selected', 'disabled', 'readonly', 'multiple', 'action', 'method', 'rows', 'cols', 'min',
    'max', 'step', 'pattern', 'maxlength', 'minlength', 'autocomplete', 'colspan', 'rowspan', 'scope', 'headers',
    'datetime', 'cite', 'width', 'height', 'loading', 'target', 'rel', 'open', 'lang', 'label', 'poster', 'controls',
    'start', 'reversed', 'abbr', 'title', 'download', 'kind', 'srclang']);
  const cleanAttrs = (el) => {
    const kept = [];
    const dropped = [];
    for (const { name, value } of [...el.attributes]) {
      if (KEEP.has(name) || name.startsWith('aria-')) kept.push([name, value]);
      else dropped.push(name);
    }
    return { kept, dropped };
  };
  const dropReason = (el, dropped) => {
    if (!dropped.length) return '';
    const why = [];
    const shown = dropped.map((n) => (['class', 'style', 'role'].includes(n) ? `${n}="${norm(el.getAttribute(n))}"` : n));
    if (dropped.includes('class')) why.push('their CSS is not ported (only theme tokens carry over, #982)');
    if (dropped.includes('style')) why.push('no inline styles');
    if (dropped.some((n) => n.startsWith('data-'))) why.push('no data-* attributes; their framework\'s data-* hooks do nothing here');
    if (dropped.some((n) => n.startsWith('on'))) why.push('their scripts are not ported');
    if (dropped.includes('role')) why.push('the tag itself says what the element is');
    return ` Dropped ${shown.join(', ')}: ${why.join('; ') || 'not part of WB Starter markup'}.`;
  };

  // ---------------------------------------------------------------- tree helpers
  const el = (tag, attrs, children) => ({ t: 'el', tag, attrs, kids: children });
  const text = (v) => ({ t: 'text', v });
  const skip = new Set();
  const convertChildren = (parent) => [...parent.childNodes].flatMap(convertNode);
  const convertNode = (n) => {
    if (n.nodeType === Node.TEXT_NODE) {
      const v = n.data.replace(/\s+/g, ' ');
      return v ? [text(v)] : [];
    }
    if (n.nodeType !== Node.ELEMENT_NODE || skip.has(n)) return [];
    collectAssets(n);
    return convertElement(n);
  };
  const hasOwnText = (e) => [...e.childNodes].some((c) => c.nodeType === Node.TEXT_NODE && c.data.trim());

  // ---------------------------------------------------------------- recognisers
  const SHELL_TAGS = new Set(['header', 'nav', 'footer']);
  const SHELL_ROLES = new Set(['banner', 'navigation', 'contentinfo']);
  const CONTENT_ANCESTORS = 'main, article, section, aside, [role="main"]';
  const isHero = (e) => hasClass(e, /^(hero|jumbotron|masthead|banner)(-|_|$)/) && !hasClass(e, /^(hero|banner)(-|_)(text|title|image|img|content|body)/);
  const isShell = (e) => (SHELL_TAGS.has(lower(e)) || SHELL_ROLES.has(e.getAttribute('role')) || hasClass(e, /^(navbar|site-header|site-footer|site-nav)$/))
    && !(e.parentElement && e.parentElement.closest(CONTENT_ANCESTORS));
  const isCard = (e) => hasClass(e, /^(card|panel|tile)$/);
  const ATTRIBUTION = 'footer, figcaption, .blockquote-footer, .author, .testimonial-author, .name';
  const isTestimonial = (e) => hasClass(e, /^(testimonial|review)$/)
    || (lower(e) === 'blockquote' && !!e.querySelector('cite, footer'))
    || (lower(e) === 'figure' && !!e.querySelector(':scope > blockquote') && !!e.querySelector(':scope > figcaption'));
  const isAccordion = (e) => hasClass(e, /^accordion$/);
  const CAPTION = 'figcaption, .caption, .wp-caption-text, .img-caption';
  const isFigureLike = (e) => ['div', 'p'].includes(lower(e)) && e.querySelectorAll('img').length === 1
    && !!e.querySelector(CAPTION) && kids(e).length <= 2;
  const isColumn = (e) => hasClass(e, /^col(-|$)/);
  const isGrid = (e) => hasClass(e, /^(row|grid|card-deck|card-group|columns)$/) && kids(e).length >= 2
    && kids(e).every((k) => isColumn(k) || isCard(k));
  const LAYOUT = /^(container|container-fluid|wrapper|inner|content|row|col(-.*)?|card-body|card-footer|card-header|section-inner)$/;
  const isLayoutWrapper = (e) => ['div', 'span'].includes(lower(e)) && classList(e).length > 0 && classList(e).every((c) => LAYOUT.test(c) || /^(mt|mb|my|mx|ml|mr|pt|pb|py|px|p|m|g|gx|gy|h|w|text|bg|d|align|justify|order|shadow|rounded|border)-/.test(c));
  const isIconGlyph = (e) => ['i', 'span'].includes(lower(e)) && !norm(e.textContent) && !e.children.length && hasClass(e, /^(fa|fas|far|fab|bi|icon|glyphicon|material-icons)(-|$)/);
  const ROLE_TAG = { complementary: 'aside', region: 'section', contentinfo: 'footer', banner: 'header', navigation: 'nav', article: 'article' };
  const DROP = {
    script: 'Their scripts are not ported; WB Starter behaviors replace them',
    noscript: 'Only shown without scripts; WB Starter pages need none',
    style: 'Their CSS is not ported (only theme tokens carry over, #982)',
    link: 'Their CSS is not ported (only theme tokens carry over, #982)',
    meta: 'Page metadata lives in config/site.json',
    template: 'Inert markup their scripts used',
  };

  // ---------------------------------------------------------------- rules
  const keepAs = (e, tag, why) => {
    const { kept, dropped } = cleanAttrs(e);
    const nb = nativeBehavior(e);
    const changed = tag !== lower(e) || dropped.length;
    const auto = nb && lower(e) === tag ? ` <${tag}> auto-injects "${nb.behavior}" (nativeMap '${nb.selector}').` : '';
    if (changed || auto) note(e, showTag(tag, kept), `${why || (changed ? 'Kept.' : 'Unchanged.')}${auto}${dropReason(e, dropped)}`.trim());
    return [el(tag, kept, convertChildren(e))];
  };

  const handleShell = (e) => {
    const links = [...e.querySelectorAll('a[href]')];
    for (const a of links) {
      const label = norm(a.textContent);
      const href = a.getAttribute('href');
      if (hasClass(a, /^(navbar-brand|brand|logo|site-title)$/)) { shell.companyName ??= label || null; continue; }
      if (lower(e) === 'footer' || e.getAttribute('role') === 'contentinfo') continue;
      if (!label) continue;
      if (/^[a-z]+:/i.test(href) && !/^file:/i.test(href)) { shell.notInMenu.push({ text: label, href, why: 'a link to another site, not a page of this one' }); continue; }
      if (href.startsWith('#')) { shell.notInMenu.push({ text: label, href, why: 'an anchor on this page, not a page' }); continue; }
      const file = href.split(/[?#]/)[0].replace(/\/+$/, '').split('/').pop() || 'index';
      const slug = file.replace(/\.html?$/i, '').toLowerCase().replace(/[^a-z0-9-]+/g, '-') || 'index';
      const page = slug === 'index' ? 'home' : slug;
      if (!shell.navigationMenu.some((m) => m.pageToLoad === page)) shell.navigationMenu.push({ menuItemId: page, menuItemText: label, pageToLoad: page });
    }
    if (lower(e) === 'footer' || e.getAttribute('role') === 'contentinfo' || hasClass(e, /^site-footer$/)) {
      const blocks = [...e.querySelectorAll('p, address, small, li, div')].filter((b) => !b.querySelector('p, address, small, li, div'));
      const pieces = (blocks.length ? blocks : [e]).map((b) => ({ b, t: norm(b.textContent) })).filter((p) => p.t);
      for (const { b, t } of pieces) {
        if (!shell.footerCopyrightText && /©|\(c\)|copyright/i.test(t)) { shell.footerCopyrightText = t; continue; }
        unclassified.push({ path: pathOf(b), from: describe(b), text: t, why: 'site footer content: config/site.json has no place for it. Put it on a page (a Contact page?) by hand.' });
      }
      note(e, 'config/site.json footerSettings', 'The site footer is part of the shell WB Starter builds from config/site.json, not of a page (Law 10: pages are fragments).');
      return [];
    }
    note(e, 'config/site.json navigationMenu', `Site navigation is built from config/site.json, not written into each page (Law 10). ${shell.navigationMenu.length} menu item(s) proposed below.`);
    return [];
  };

  const hero = (e) => {
    const { kept, dropped } = cleanAttrs(e);
    const attrs = [...kept.filter(([k]) => k === 'id'), xAttr('x-hero'), ...kept.filter(([k]) => k !== 'id')];
    note(e, showTag('section', attrs), `A page hero in their markup; x-hero styles a section as the page hero (extensionMap 'x-hero' → hero).${dropReason(e, dropped)}`);
    return [el('section', attrs, convertChildren(e))];
  };

  const card = (e) => {
    const nested = (x) => x.parentElement.closest('.card, .panel, .tile') !== e;
    const titleEl = [...e.querySelectorAll('.card-title, .panel-title, h1, h2, h3, h4, h5, h6')].find((x) => !nested(x));
    const subEl = [...e.querySelectorAll('.card-subtitle, .panel-subtitle')].find((x) => !nested(x));
    const attrs = cleanAttrs(e).kept.filter(([k]) => k === 'id');
    const moved = [];
    if (titleEl && !titleEl.querySelector('a, img')) { attrs.push(['title', norm(titleEl.textContent)]); skip.add(titleEl); moved.push(`the heading "${norm(titleEl.textContent)}" becomes title`); }
    if (subEl && !subEl.querySelector('a, img')) { attrs.push(['subtitle', norm(subEl.textContent)]); skip.add(subEl); moved.push(`"${norm(subEl.textContent)}" becomes subtitle`); }
    const { dropped } = cleanAttrs(e);
    note(e, showTag(nativeTag('article'), attrs), `A card in their markup; <article> IS a card in WB Starter (nativeMap 'article' → card, Law 0).${moved.length ? ` ${moved.join(', ')[0].toUpperCase()}${moved.join(', ').slice(1)} (the card renders it in its header);` : ''} the rest stays between the tags (#968).${dropReason(e, dropped)}`);
    return [el('article', attrs, convertChildren(e))];
  };

  const testimonial = (e) => {
    const bq = lower(e) === 'blockquote' ? e : e.querySelector('blockquote');
    const attribution = [...e.querySelectorAll(ATTRIBUTION)].find((x) => x !== bq) || null;
    const roleEl = (attribution && attribution.querySelector('cite, .role, .title, .company')) || e.querySelector('.role, .company');
    const strip = (s) => norm(s).replace(/^[\s—–\-,]+|[\s—–\-,]+$/g, '');
    const role = roleEl ? strip(roleEl.textContent) : '';
    let author = '';
    if (attribution) {
      const clone = attribution.cloneNode(true);
      const r = roleEl && attribution.contains(roleEl) ? clone.querySelector('cite, .role, .title, .company') : null;
      if (r) r.remove();
      author = strip(clone.textContent);
    }
    const avatar = [...e.querySelectorAll('img')].find((i) => !(bq && bq.contains(i)));
    const stars = (norm(e.textContent).match(/★/g) || []).length;
    const attrs = [...cleanAttrs(e).kept.filter(([k]) => k === 'id'), xAttr('x-cardtestimonial')];
    if (author) attrs.push(['author', author]);
    if (role) attrs.push(['role', role]);
    if (avatar) { attrs.push(['avatar', avatar.getAttribute('src')]); collectAssets(avatar); }
    if (stars) attrs.push(['rating', String(stars)]);
    for (const x of [attribution, roleEl, avatar]) if (x) skip.add(x);
    const starEls = [...e.querySelectorAll('*')].filter((x) => /^[★☆\s]+$/.test(x.textContent) && x.textContent.trim() && !x.children.length);
    for (const x of starEls) skip.add(x);
    const body = bq ? convertChildren(bq) : convertChildren(e);
    const { dropped } = cleanAttrs(e);
    const parts = [author && `author="${author}"`, role && `role="${role}"`, avatar && 'the photo becomes avatar', stars && `${stars} ★ become rating="${stars}"`].filter(Boolean);
    note(e, showTag('article', attrs), `A quotation with its attribution; x-cardtestimonial is WB Starter's testimonial card (extensionMap 'x-cardtestimonial'). The quote stays between the tags, word for word (#968)${parts.length ? `; ${parts.join(', ')} (copied from the attribution, not written)` : ''}.${dropReason(e, dropped)}`);
    return [el('article', attrs, body.filter((n) => !(n.t === 'text' && /^[\s★☆]*$/.test(n.v) && n.v.includes('★'))))];
  };

  const accordion = (e) => {
    const items = kids(e).filter((k) => hasClass(k, /^(accordion-item|card|panel)$/));
    const out = [];
    note(e, '(unwrapped: one <details> per item)', `An accordion; WB Starter's x-accordion is deprecated in favour of native <details>/<summary>, which needs no script (nativeMap 'details' → details).${dropReason(e, cleanAttrs(e).dropped)}`);
    for (const item of items) {
      const head = item.querySelector('.accordion-header, .accordion-button, .card-header, .panel-heading, [data-bs-toggle], [data-toggle]');
      const body = item.querySelector('.accordion-collapse, .collapse, .panel-collapse');
      if (!head || !body) { out.push(...convertNode(item)); continue; }
      const inner = body.querySelector(':scope > .accordion-body, :scope > .card-body, :scope > .panel-body') || body;
      const open = body.classList.contains('show') || body.classList.contains('in') || head.querySelector('[aria-expanded="true"]') || head.getAttribute('aria-expanded') === 'true';
      const label = norm(head.textContent);
      const attrs = open ? [['open', '']] : [];
      // A panel that is one run of text is a paragraph.
      const textOnly = !inner.children.length && norm(inner.textContent);
      note(item, showTag(nativeTag('details'), attrs), `An accordion item: its header "${label}" becomes the <summary>, its panel the body${textOnly ? ' (one run of text, so a <p>)' : ''}${open ? '; it started expanded, so open' : ''}.${dropReason(item, cleanAttrs(item).dropped)}`);
      const panel = convertChildren(inner);
      out.push(el('details', attrs, [el('summary', [], [text(label)]), ...(textOnly ? [el('p', [], panel)] : panel)]));
    }
    return out;
  };

  const figure = (e) => {
    const cap = e.querySelector(CAPTION);
    skip.add(cap);
    const { kept, dropped } = cleanAttrs(e);
    const attrs = kept.filter(([k]) => k === 'id');
    note(e, showTag(nativeTag('figure'), attrs), `An image with its caption; <figure> + <figcaption> say so natively, and <figure> auto-injects "figure" (nativeMap 'figure').${dropReason(e, dropped)}`);
    collectAssets(cap);
    const media = convertChildren(e);
    return [el('figure', attrs, [...media, el('figcaption', [], convertChildren(cap))])];
  };

  const grid = (e) => {
    const cells = kids(e);
    const span = cells.map((c) => (classList(c).join(' ').match(/col-(?:[a-z]{2}-)?(\d+)/) || [])[1]).find(Boolean);
    const columns = Math.min(span ? Math.round(12 / Number(span)) : cells.length, 6);
    // A <form> laid out as a grid stays a <form>: x-grid goes on it.
    const tag = lower(e) === 'div' ? 'div' : lower(e);
    const { kept, dropped } = cleanAttrs(e);
    const attrs = [...kept.filter(([k]) => k === 'id'), xAttr('x-grid'), ['columns', String(columns)], ...kept.filter(([k]) => k !== 'id')];
    note(e, showTag(tag, attrs), `${cells.length} repeated siblings in a ${span ? `${span}-of-12 column ` : ''}grid; x-grid lays them out responsively (extensionMap 'x-grid' → grid), columns="${columns}".${dropReason(e, dropped)}`);
    const items = [];
    for (const c of cells) {
      if (!isColumn(c)) { items.push(...convertNode(c)); continue; }
      collectAssets(c);
      const at = reserve();
      const inner = convertChildren(c).filter((n) => !(n.t === 'text' && !n.v.trim()));
      fill(at, c, inner.length === 1 ? '(unwrapped: its content is the grid cell)' : '<div>', `A grid column; x-grid lays out its children itself${inner.length === 1 ? '' : ', and a <div> keeps this column\'s pieces together in one cell'}.${dropReason(c, cleanAttrs(c).dropped)}`);
      items.push(...(inner.length === 1 ? inner : [el('div', [], inner)]));
    }
    return [el(tag, attrs, items)];
  };

  const generic = (e) => {
    const tag = lower(e);
    const { kept, dropped } = cleanAttrs(e);
    const handlers = dropped.filter((n) => n.startsWith('on'));
    if (handlers.length || (tag === 'div' && hasOwnText(e) && dropped.length)) {
      const why = handlers.length
        ? `it had ${handlers.join(', ')}, which WB Starter cannot carry over; decide what it should do`
        : 'a styled block whose meaning its markup does not say';
      unclassified.push({ path: pathOf(e), from: describe(e), text: norm(e.textContent).slice(0, 120), why });
      note(e, '<!-- TODO: unclassified --> + <div>', `Not classified: ${why}. Kept word for word under a TODO comment for a person to decide.${dropReason(e, dropped)}`);
      const was = `${tag}${[...e.classList].map((c) => `.${c}`).join('')}`.replace(/--/g, '-');
      return [{ t: 'comment', v: ` TODO: unclassified (was ${was}) ` }, el('div', kept, convertChildren(e))];
    }
    if (tag === 'div' && !kept.length && hasOwnText(e) && !e.querySelector('p, div, section, article, ul, ol, table, form, h1, h2, h3, h4, h5, h6')) {
      note(e, '<p>', `A <div> holding only a line of text is a paragraph.${dropReason(e, dropped)}`);
      return [el('p', [], convertChildren(e))];
    }
    if (!kept.length) {
      if (dropped.length) note(e, '(unwrapped)', `A <${tag}> that only carried their styling; its content stays.${dropReason(e, dropped)}`);
      return convertChildren(e);
    }
    return keepAs(e, tag);
  };

  function convertElement(e) {
    const tag = lower(e);
    if (tag in DROP) {
      if (tag === 'link' && /icon/i.test(e.getAttribute('rel') || '')) asset(e, 'icon', e.getAttribute('href'));
      note(e, '(removed)', `${DROP[tag]}.`);
      return [];
    }
    if (tag === 'svg' || tag === 'iframe' || tag === 'canvas' || tag === 'object' || tag === 'embed') {
      const src = e.getAttribute('src') || e.getAttribute('data') || '';
      unclassified.push({ path: pathOf(e), from: describe(e), text: src || `inline <${tag}>`, why: `<${tag}> is not migrated by v0; add it back by hand (an image, x-youtube, x-icon, ...)` });
      note(e, '(removed, listed as unclassified)', `<${tag}> is not migrated by v0.`);
      return [];
    }
    if (isHero(e)) return hero(e);
    if (isShell(e)) return handleShell(e);
    if (tag === 'main' || e.getAttribute('role') === 'main') {
      note(e, '(unwrapped)', 'A page is a fragment: the WB Starter shell supplies <main> and loads the page into it (Law 10).');
      return convertChildren(e);
    }
    if (isTestimonial(e)) return testimonial(e);
    if (isCard(e)) return card(e);
    if (isAccordion(e)) return accordion(e);
    if (isFigureLike(e)) return figure(e);
    if (isGrid(e)) return grid(e);
    if (isIconGlyph(e)) {
      note(e, '(removed)', `An icon-font glyph (class="${norm(e.getAttribute('class'))}"); their icon font is not ported. Add an x-icon by hand if the icon matters.`);
      return [];
    }
    const role = e.getAttribute('role');
    if (tag === 'div' && ROLE_TAG[role]) return keepAs(e, ROLE_TAG[role], `role="${role}" on a <div> is the <${ROLE_TAG[role]}> element.`);
    if (tag === 'font' || tag === 'center') {
      note(e, '(unwrapped)', `<${tag}> is presentational and obsolete; its content stays.`);
      return convertChildren(e);
    }
    if (isLayoutWrapper(e)) {
      note(e, '(unwrapped)', `A layout wrapper (class="${norm(e.getAttribute('class'))}"); WB Starter's page layout replaces it, and its content stays.`);
      return convertChildren(e);
    }
    if (tag === 'div' || tag === 'span') return generic(e);
    return keepAs(e, tag);
  }

  // ---------------------------------------------------------------- the page
  const head = document.head;
  const desc = head.querySelector('meta[name="description"]');
  if (desc) shell.pageDescription = norm(desc.getAttribute('content')) || null;
  for (const l of head.querySelectorAll('link[rel~="icon"]')) asset(l, 'icon', l.getAttribute('href'));
  for (const s of head.querySelectorAll('link[rel="stylesheet"], style, script')) {
    const ref = s.getAttribute('href') || s.getAttribute('src');
    const from = `<${lower(s)}${ref ? ` ${s.hasAttribute('href') ? 'href' : 'src'}="${ref}"` : ''}>`;
    findings.push({ path: `head > ${lower(s)}`, from, to: '(removed)', why: `${DROP[lower(s)]}.` });
  }
  const nodes = convertChildren(document.body);

  // Every word the page shows, for the "nothing invented" check in Node.
  const sourceText = norm([document.title, desc ? desc.getAttribute('content') : '',
    ...[...document.body.querySelectorAll('img[alt]')].map((i) => i.getAttribute('alt')),
    ...[...document.body.querySelectorAll('img[src]')].map((i) => i.getAttribute('src')),
    document.body.textContent].join(' '));

  return { nodes, findings, unclassified, assets, shell, sourceText };
}
