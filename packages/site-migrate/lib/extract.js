/* global document, Node, NodeFilter -- this function runs in the browser page, not in Node. */
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
 * v1 (#1832) adds pricing tables (x-cardpricing), YouTube and Vimeo embeds
 * (x-youtube, x-vimeo), tab sets (x-tabs) and inline SVG icons (x-icon).
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

  // ---------------------------------------------------------------- v1 recognisers (#1832)
  // Pricing: a card that carries a price. Everything in it must have a place
  // in x-cardpricing, which replaces its content: what does not fit makes it
  // an ordinary card again.
  const PRICE = '.pricing-card-title, .price, .plan-price, .card-price, .pricing-price';
  const isPricing = (e) => !!e.querySelector(PRICE)
    && (isCard(e) || hasClass(e, /^(pricing|pricing-card|pricing-table|pricing-plan|price-card|plan)$/));
  // Video embeds: the two players WB Starter has behaviors for.
  const YOUTUBE = /^(?:https?:)?\/\/(?:www\.)?(?:youtube(?:-nocookie)?\.com\/(?:embed|shorts|live|v)\/|youtu\.be\/)([\w-]{11})/i;
  const VIMEO = /^(?:https?:)?\/\/player\.vimeo\.com\/video\/(\d+)/i;
  // Inline SVG: an icon is drawn at text size.
  const ICON_MAX = 48;
  const isIconSvg = (e) => {
    const r = e.getBoundingClientRect();
    if (r.width || r.height) return r.width <= ICON_MAX && r.height <= ICON_MAX;
    const w = parseFloat(e.getAttribute('width'));
    const h = parseFloat(e.getAttribute('height'));
    return w > 0 && h > 0 && w <= ICON_MAX && h <= ICON_MAX;
  };
  // Tabs: a tab list whose tabs each name a panel, and the one element that
  // holds exactly those panels. Found before the walk, because the list comes
  // first in the page and the panels after it.
  const TABLIST = '[role="tablist"], .nav-tabs, .nav-pills';
  const TAB = '[role="tab"], [data-bs-toggle="tab"], [data-bs-toggle="pill"], [data-toggle="tab"], [data-toggle="pill"]';
  const tabLists = new Map();
  const tabHosts = new Map();
  for (const list of document.body.querySelectorAll(TABLIST)) {
    const tabs = [...list.querySelectorAll(TAB)];
    if (tabs.length < 2) continue;
    const targetOf = (t) => {
      const ref = t.getAttribute('data-bs-target') || t.getAttribute('data-target') || (t.getAttribute('aria-controls') ? `#${t.getAttribute('aria-controls')}` : '') || t.getAttribute('href') || '';
      return ref.startsWith('#') && ref.length > 1 ? document.getElementById(ref.slice(1)) : null;
    };
    const panels = tabs.map(targetOf);
    const host = panels[0] && panels[0].parentElement;
    if (!host || panels.some((p) => !p || p.parentElement !== host) || new Set(panels).size !== panels.length
      || kids(host).length !== panels.length || list.contains(host) || host.contains(list)) continue;
    const active = Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true' || t.classList.contains('active')));
    const group = { list, host, tabs, panels, active, labels: tabs.map((t) => norm(t.textContent)) };
    tabLists.set(list, group);
    tabHosts.set(host, group);
  }

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

  const card = (e, before = '') => {
    const nested = (x) => x.parentElement.closest('.card, .panel, .tile') !== e;
    const titleEl = [...e.querySelectorAll('.card-title, .panel-title, h1, h2, h3, h4, h5, h6')].find((x) => !nested(x));
    const subEl = [...e.querySelectorAll('.card-subtitle, .panel-subtitle')].find((x) => !nested(x));
    const attrs = cleanAttrs(e).kept.filter(([k]) => k === 'id');
    const moved = [];
    if (titleEl && !titleEl.querySelector('a, img')) { attrs.push(['title', norm(titleEl.textContent)]); skip.add(titleEl); moved.push(`the heading "${norm(titleEl.textContent)}" becomes title`); }
    if (subEl && !subEl.querySelector('a, img')) { attrs.push(['subtitle', norm(subEl.textContent)]); skip.add(subEl); moved.push(`"${norm(subEl.textContent)}" becomes subtitle`); }
    const { dropped } = cleanAttrs(e);
    note(e, showTag(nativeTag('article'), attrs), `${before}A card in their markup; <article> IS a card in WB Starter (nativeMap 'article' → card, Law 0).${moved.length ? ` ${moved.join(', ')[0].toUpperCase()}${moved.join(', ').slice(1)} (the card renders it in its header);` : ''} the rest stays between the tags (#968).${dropReason(e, dropped)}`);
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

  const pricing = (e) => {
    const priceEl = e.querySelector(PRICE);
    const periodEl = [...priceEl.children].find((c) => /^(small|span|sub|sup)$/.test(lower(c))) || null;
    const price = norm([...priceEl.childNodes].filter((c) => c.nodeType === Node.TEXT_NODE).map((c) => c.data).join(' '));
    const period = periodEl ? norm(periodEl.textContent) : '';
    const planEl = [...e.querySelectorAll('h1, h2, h3, h4, h5, h6, .plan-name, .plan-title')].find((x) => x !== priceEl && !priceEl.contains(x) && !x.contains(priceEl)) || null;
    const items = [...e.querySelectorAll('li')];
    const actions = [...e.querySelectorAll('a, button')].filter((x) => !x.closest('li'));
    const paras = [...e.querySelectorAll('p')].filter((x) => !priceEl.contains(x) && !x.closest('li') && !(planEl && planEl.contains(x)));
    // x-cardpricing renders its own defaults for what is missing ("/month",
    // "Get Started", "Feature 1"): a missing piece would put words on the page
    // that the source never had.
    const why = [];
    if (!price) why.push('it has no price');
    if (!period) why.push('the price has no period, and x-cardpricing would show "/month"');
    if (priceEl.children.length > (periodEl ? 1 : 0)) why.push('the price holds more than an amount and a period');
    if (!planEl || !norm(planEl.textContent)) why.push('it has no plan name');
    if (!items.length) why.push('it lists no features, and x-cardpricing would show "Feature 1, Feature 2"');
    if (items.some((li) => li.textContent.includes(','))) why.push('a feature has a comma in it, and x-cardpricing\'s features attribute is split on commas');
    if (items.some((li) => li.querySelector('a, img, button'))) why.push('a feature holds a link or an image, which features="..." cannot carry');
    if (actions.length !== 1) why.push(actions.length ? 'it has more than one call to action' : 'it has no call to action, and x-cardpricing would show "Get Started"');
    if (paras.length > 1) why.push('it has more than one paragraph, and x-cardpricing has room for one description');
    if (e.querySelector('img, svg, video, iframe, table, form')) why.push('it holds media or a table, which x-cardpricing would drop');
    // Every word must land in an attribute: x-cardpricing replaces its content.
    const used = [priceEl, planEl, ...items, ...actions, ...paras].filter(Boolean);
    const walker = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
    const left = [];
    for (let t = walker.nextNode(); t; t = walker.nextNode()) if (t.data.trim() && !used.some((u) => u.contains(t))) left.push(norm(t.data));
    if (left.length) why.push(`"${left.join(' ')}" has no place in it`);
    if (why.length) return card(e, `A pricing card, but not x-cardpricing: ${why.join('; ')}. `);

    const cta = actions[0];
    const attrs = [...cleanAttrs(e).kept.filter(([k]) => k === 'id'), xAttr('x-cardpricing'),
      ['plan', norm(planEl.textContent)], ['price', price], ['period', period]];
    if (paras.length) attrs.push(['description', norm(paras[0].textContent)]);
    attrs.push(['features', items.map((li) => norm(li.textContent)).join(', ')], ['cta', norm(cta.textContent)]);
    const href = lower(cta) === 'a' ? cta.getAttribute('href') : null;
    if (href) attrs.push(['cta-href', href]);
    const featured = hasClass(e, /^(featured|popular|recommended|highlight|border-primary)$/);
    if (featured) attrs.push(['featured', '']);
    note(e, showTag('article', attrs), `A pricing card; x-cardpricing is WB Starter's pricing card (extensionMap 'x-cardpricing'). Every piece of it is copied into an attribute, word for word: the plan name, the price and its period${paras.length ? ', the description' : ''}, ${items.length} feature${items.length === 1 ? '' : 's'} and the call to action.${href ? '' : ' The call to action was a button with no link, so cta-href is left out and it points nowhere (#) until you set it.'}${featured ? ` It was marked as the featured plan (class="${norm(e.getAttribute('class'))}"), so featured.` : ''}${dropReason(e, cleanAttrs(e).dropped)}`);
    return [el('article', attrs, [])];
  };

  const embed = (e, src) => {
    const yt = src.match(YOUTUBE);
    const vm = src.match(VIMEO);
    let query;
    try { query = new URL(src, document.baseURI).searchParams; } catch { query = new URLSearchParams(); }
    const on = (k) => query.get(k) === '1' || query.get(k) === 'true';
    const flags = [on('autoplay') && 'autoplay', (on('mute') || on('muted')) && 'muted', on('loop') && 'loop'].filter(Boolean);
    const asked = flags.length ? ` The URL asked for ${flags.join(', ')}, so ${flags.length === 1 ? 'that attribute is' : 'those attributes are'} set.` : '';
    const title = e.getAttribute('title');
    const lost = title ? ` Their title="${norm(title)}" is not carried over: the behavior builds its own <iframe>.` : '';
    if (yt) {
      const attrs = [xAttr('x-youtube'), ['url', src], ...flags.map((f) => [f, ''])];
      if (query.get('controls') === '0') attrs.push(['controls', 'false']);
      note(e, showTag('div', attrs), `A YouTube player; x-youtube embeds it (extensionMap 'x-youtube'), reading the video id from the same URL.${asked}${lost}`);
      return [el('div', attrs, [])];
    }
    const attrs = [xAttr('x-vimeo'), ['video-id', vm[1]], ...flags.map((f) => [f, ''])];
    note(e, showTag('div', attrs), `A Vimeo player; x-vimeo embeds it (extensionMap 'x-vimeo') from the video id in its URL.${asked}${lost}`);
    return [el('div', attrs, [])];
  };

  const tabSet = (e) => {
    const g = tabHosts.get(e);
    const attrs = [xAttr('x-tabs')];
    if (g.active) attrs.push(['active-tab', String(g.active)]);
    note(e, showTag('div', attrs), `A tab set; x-tabs builds the tab buttons from its panels (extensionMap 'x-tabs'). Each panel's tab label becomes its tab-title${g.active ? `, and tab ${g.active + 1} ("${g.labels[g.active]}") started open, so active-tab="${g.active}"` : ''}.${dropReason(e, cleanAttrs(e).dropped)}`);
    const panels = g.panels.map((p, i) => {
      const ids = cleanAttrs(p).kept.map(([k]) => k).filter((k) => k === 'id' || k.startsWith('aria-'));
      note(p, showTag('div', [['tab-title', g.labels[i]]]), `Tab panel ${i + 1}, labelled "${g.labels[i]}" by its tab.${ids.length ? ` Its ${ids.join(' and ')} ${ids.length === 1 ? 'goes' : 'go'}: x-tabs gives each panel its own id and label.` : ''}${dropReason(p, cleanAttrs(p).dropped)}`);
      return el('div', [['tab-title', g.labels[i]]], convertChildren(p));
    });
    return [el('div', attrs, panels)];
  };

  /** Inline SVG, copied as it is: only class, style, data-* and on* go. */
  const copySvg = (n) => {
    if (n.nodeType === Node.TEXT_NODE) return n.data.trim() ? [text(n.data.replace(/\s+/g, ' '))] : [];
    if (n.nodeType !== Node.ELEMENT_NODE) return [];
    const attrs = [...n.attributes].filter(({ name }) => !(name === 'class' || name === 'style' || name.startsWith('data-') || /^on/.test(name))).map(({ name, value }) => [name, value]);
    return [el(n.tagName, attrs, [...n.childNodes].flatMap(copySvg))];
  };
  const svg = (e) => {
    const r = e.getBoundingClientRect();
    const size = `${Math.round(r.width)}x${Math.round(r.height)}px`;
    const { dropped } = cleanAttrs(e);
    const gone = dropped.filter((n) => n === 'class' || n === 'style' || n.startsWith('data-') || /^on/.test(n));
    const dropNote = gone.length ? ` Dropped ${gone.map((n) => (n === 'class' ? `class="${norm(e.getAttribute('class'))}"` : n)).join(', ')}.` : '';
    if (isIconSvg(e)) {
      if ('x-icon' in registry.extensionMap) {
        const attrs = [xAttr('x-icon')];
        note(e, `${showTag('span', attrs)} + <svg>`, `An inline SVG icon (${size}); x-icon sizes it to the text beside it (extensionMap 'x-icon'). The drawing is kept as it is.${dropNote}`);
        return [el('span', attrs, copySvg(e))];
      }
      note(e, '<svg> (kept as it is)', `An inline SVG icon (${size}). The registry has no x-icon, so the SVG is kept as it is, at the size its own width and height give it.${dropNote}`);
      return copySvg(e);
    }
    const why = `an inline drawing (${size}), too big to be an icon: keep it inline, or save it as an .svg file and use <img> with alt text`;
    unclassified.push({ path: pathOf(e), from: describe(e), text: norm(e.getAttribute('aria-label') || e.textContent) || 'inline <svg>', why });
    note(e, '<!-- TODO: unclassified --> + <svg>', `Not classified: ${why}. Kept as it is under a TODO comment for a person to decide.${dropNote}`);
    return [{ t: 'comment', v: ' TODO: unclassified (was an inline svg) ' }, ...copySvg(e)];
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
    if (tag === 'svg') return svg(e);
    if (tag === 'iframe' && (YOUTUBE.test(e.getAttribute('src') || '') || VIMEO.test(e.getAttribute('src') || ''))) return embed(e, e.getAttribute('src'));
    if (tabLists.has(e)) {
      note(e, '(removed)', `The tab buttons of a tab set; x-tabs builds its own from each panel's tab-title (${tabLists.get(e).labels.map((l) => `"${l}"`).join(', ')}).`);
      return [];
    }
    if (tabHosts.has(e)) return tabSet(e);
    if (tag === 'iframe' || tag === 'canvas' || tag === 'object' || tag === 'embed') {
      const src = e.getAttribute('src') || e.getAttribute('data') || '';
      unclassified.push({ path: pathOf(e), from: describe(e), text: src || `inline <${tag}>`, why: `<${tag}> is not migrated; add it back by hand (an image, a link, ...)` });
      note(e, '(removed, listed as unclassified)', `<${tag}> is not migrated${tag === 'iframe' ? ': only YouTube and Vimeo players are' : ''}.`);
      return [];
    }
    if (isHero(e)) return hero(e);
    if (isShell(e)) return handleShell(e);
    if (tag === 'main' || e.getAttribute('role') === 'main') {
      note(e, '(unwrapped)', 'A page is a fragment: the WB Starter shell supplies <main> and loads the page into it (Law 10).');
      return convertChildren(e);
    }
    if (isTestimonial(e)) return testimonial(e);
    if (isPricing(e)) return pricing(e);
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
