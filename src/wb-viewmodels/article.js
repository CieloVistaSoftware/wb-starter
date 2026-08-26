/**
 * Article / Articles List Behaviors
 * -----------------------------------------------------------------------------
 * <article> was mapped (tag-map.js elementMap) and schema'd
 * (wb-models/article.schema.json) but had no behavior implementation of any
 * kind -- pages using wb-lazy.js (no schema-builder/MVVM engine at all) got
 * zero enhancement, and even wb.js pages relied on the schema's $view alone
 * with no interactivity layer. This builds the full structure directly, the
 * same self-sufficient pattern card.js/alert()/chip() (feedback.js) use, so
 * it works identically under both runtimes.
 *
 * CSS: src/styles/behaviors/article.css
 */

// Move all live child nodes out of `element` into a DocumentFragment before
// rebuilding -- innerHTML round-tripping would re-parse nested <article>
// tags (inside <div x-articles>) into brand-new element instances that never
// went through WB.scan()'s querySelectorAll pass, so they'd never get their
// own behavior injected.
function takeChildren(element) {
  const frag = document.createDocumentFragment();
  while (element.firstChild) frag.appendChild(element.firstChild);
  return frag;
}

export function article(element, options = {}) {
  const title = options.title || element.getAttribute('title') || '';
  const subtitle = options.subtitle || element.getAttribute('subtitle') || '';
  const author = options.author || element.getAttribute('author') || '';
  const date = options.date || element.getAttribute('date') || '';
  const category = options.category || element.getAttribute('category') || '';
  const image = options.image || element.getAttribute('image') || '';
  const imageAlt = options.imageAlt || element.getAttribute('image-alt') || title;
  const readingTime = options.readingTime || element.getAttribute('reading-time') || '';
  const footer = options.footer || element.getAttribute('footer') || '';
  const featured = options.featured ?? element.hasAttribute('featured');

  const body = takeChildren(element);

  // #448 dropped classList.add('x-article') on the assumption article.css's
  // bare `x-article {}` tag selector covers every consumer -- true only for
  // a REAL <article> tag. #528: schema-builder.js's buildStructure() (and
  // any other non-<article>-tagged host wb-lazy.js's runtime hands this
  // function) can't be reached by that tag selector at all, so those hosts
  // never got styled. Same guard chip()'s #521 fix uses (feedback.js) and
  // articles()'s #523-follow-up fix uses just below in this file: only a
  // host whose tag ISN'T already x-article needs the class -- adding it
  // unconditionally would trip no-redundant-tag-name-class.spec.ts on real
  // <article> tags (demos/site/content.html).
  if (element.tagName.toLowerCase() !== 'x-article') element.classList.add('x-article');
  element.classList.toggle('x-article--featured', featured);

  const hasHeaderContent = image || category || date || readingTime || title || subtitle || author;
  if (hasHeaderContent) {
    // A semantic <header> tag here collides with the header() behavior's
    // own autoInject nativeMap entry ('header' -> 'header', tag-map.js):
    // WB.init({autoInject:true}) treats ANY native <header> element on the
    // page as a site/page-header candidate and adds the 'x-header' class,
    // and behaviors/header.css's `x-header, header { display: flex; ... }`
    // rule (meant for the site's own nav header) then applies its row-flex
    // layout here too -- cramming the media/meta/title/subtitle/byline
    // that are meant to stack vertically into one horizontal row instead.
    // A plain <div> sidesteps the collision entirely and matches every
    // other internal wrapper in this file (.x-article__meta/__byline are
    // already <div>, not semantic tags, for the same reason).
    const header = document.createElement('div');
    header.className = 'x-article__header';

    if (image) {
      const media = document.createElement('figure');
      media.className = 'x-article__media';
      const img = document.createElement('img');
      img.src = image;
      img.alt = imageAlt;
      media.appendChild(img);
      header.appendChild(media);
    }

    if (category || date || readingTime) {
      const meta = document.createElement('div');
      meta.className = 'x-article__meta';
      if (category) {
        const categoryEl = document.createElement('span');
        categoryEl.className = 'x-article__category';
        categoryEl.textContent = category;
        meta.appendChild(categoryEl);
      }
      if (date) {
        const dateEl = document.createElement('time');
        dateEl.className = 'x-article__date';
        dateEl.textContent = date;
        dateEl.setAttribute('datetime', date);
        meta.appendChild(dateEl);
      }
      if (readingTime) {
        const readingTimeEl = document.createElement('span');
        readingTimeEl.className = 'x-article__reading-time';
        readingTimeEl.textContent = readingTime;
        meta.appendChild(readingTimeEl);
      }
      header.appendChild(meta);
    }

    if (title) {
      const titleEl = document.createElement('h1');
      titleEl.className = 'x-article__title';
      titleEl.textContent = title;
      header.appendChild(titleEl);
    }

    if (subtitle) {
      const subtitleEl = document.createElement('p');
      subtitleEl.className = 'x-article__subtitle';
      subtitleEl.textContent = subtitle;
      header.appendChild(subtitleEl);
    }

    if (author) {
      const byline = document.createElement('div');
      byline.className = 'x-article__byline';
      const authorLabel = document.createElement('span');
      authorLabel.textContent = `By ${author}`;
      byline.appendChild(authorLabel);
      header.appendChild(byline);
    }

    element.appendChild(header);
  }

  const content = document.createElement('div');
  content.className = 'x-article__content';
  content.appendChild(body);
  element.appendChild(content);

  if (footer) {
    const footerEl = document.createElement('footer');
    footerEl.className = 'x-article__footer';
    footerEl.textContent = footer;
    element.appendChild(footerEl);
  }

  return () => {
    element.classList.remove('x-article', 'x-article--featured');
    element.innerHTML = '';
  };
}

export function articles(element, options = {}) {
  const layout = options.layout || element.getAttribute('layout') || 'grid';
  const columns = options.columns || element.getAttribute('columns') || '3';
  const pagination = options.pagination ?? element.hasAttribute('pagination');
  const title = options.title || element.getAttribute('title') || '';

  const body = takeChildren(element);

  // #448 dropped the bare 'x-articles' class on the assumption no CSS
  // selector needed it. #523 re-added it unconditionally to satisfy a
  // schema-built (non-<div x-articles>-tagged) host, but that broke
  // no-redundant-tag-name-class.spec.ts on real <div x-articles> tags
  // (demos/site/content.html) -- same shape chip()'s #521 guard exists
  // to prevent (feedback.js). Applying that same tag-name guard here:
  // only a host whose tag ISN'T already x-articles needs the class.
  if (element.tagName.toLowerCase() !== 'x-articles') element.classList.add('x-articles');

  if (title) {
    // Same native-<header>/header() autoInject collision as article()
    // above (see its comment) -- a plain <div> avoids it.
    const header = document.createElement('div');
    header.className = 'x-articles__header';
    const titleEl = document.createElement('h2');
    titleEl.textContent = title;
    header.appendChild(titleEl);
    element.appendChild(header);
  }

  const list = document.createElement('div');
  list.className = `x-articles__list x-articles--${layout}`;
  if (layout === 'grid') {
    list.style.setProperty('--x-articles-columns', columns);
  }
  list.appendChild(body);
  element.appendChild(list);

  // articles.schema.json declares `source` ("Data source URL for fetching
  // articles dynamically") and `limit` ("Maximum number of articles to show").
  // Neither was read, so both were documented and inert (#861).
  //
  // `limit` applies to authored children too: it says "maximum number to
  // SHOW", not "maximum to fetch", and an author who hand-writes 20 articles
  // with limit="5" means the same thing as one who fetches 20.
  const limitRaw = options.limit ?? element.getAttribute('limit');
  const limit = limitRaw == null || limitRaw === '' ? NaN : parseInt(limitRaw, 10);
  const applyLimit = () => {
    if (!Number.isFinite(limit) || limit < 0) return;
    Array.from(list.children).forEach((child, i) => { child.hidden = i >= limit; });
  };
  applyLimit();

  const source = options.source || element.getAttribute('source') || '';

  // A generation token, not a plain `aborted` boolean.
  //
  // WB.scan() and observe()'s MutationObserver can both reach the same element,
  // so articles() may run twice. With a per-closure boolean, the second run's
  // setup ran the FIRST closure's cleanup, which set aborted = true -- and the
  // first fetch, already in flight and the only one anybody was waiting on,
  // threw its results away silently. The list just stayed empty.
  //
  // The token makes "is this response still wanted?" a question about the
  // element rather than about one closure: the newest run wins, and a stale
  // run drops out without cancelling the live one.
  const generation = (element._wbArticlesGen = (element._wbArticlesGen || 0) + 1);
  const isStale = () => element._wbArticlesGen !== generation || !element.isConnected;

  if (source) {
    element.setAttribute('aria-busy', 'true');
    fetch(source, { headers: { Accept: 'application/json' } })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
      })
      .then(async (data) => {
        if (isStale()) return;
        // Accept a bare array or the usual { articles } / { items } envelopes
        // rather than dictating one response shape to every backend.
        const items = Array.isArray(data) ? data : (data?.articles ?? data?.items ?? []);
        if (!Array.isArray(items)) throw new Error('source did not return an array');
        const shown = Number.isFinite(limit) && limit >= 0 ? items.slice(0, limit) : items;
        for (const item of shown) {
          const art = document.createElement('article');
          art.setAttribute('x-article', '');
          for (const [key, attr] of [
            ['title', 'title'], ['subtitle', 'subtitle'], ['author', 'author'],
            ['date', 'date'], ['category', 'category'], ['image', 'image'],
            ['imageAlt', 'image-alt'], ['readingTime', 'reading-time'],
          ]) {
            const v = item?.[key] ?? item?.[attr];
            if (v != null && v !== '') art.setAttribute(attr, String(v));
          }
          if (item?.featured) art.setAttribute('featured', '');
          list.appendChild(art);
        }
        element.removeAttribute('aria-busy');
        // The appended hosts carry x-article and must be scanned to become
        // articles. WB.scan is async (#845), so it is awaited here rather
        // than fired and forgotten.
        await globalThis.WB?.scan?.(list);
        element.dispatchEvent(new CustomEvent('wb:articles:loaded', {
          bubbles: true, detail: { count: shown.length, source },
        }));
      })
      .catch((err) => {
        if (isStale()) return;
        element.removeAttribute('aria-busy');
        // Fail visibly, but do NOT clear the list: a source that 404s must not
        // blank out articles the author already wrote by hand.
        element.setAttribute('data-articles-error', String(err?.message || err));
        element.dispatchEvent(new CustomEvent('wb:articles:error', {
          bubbles: true, detail: { source, error: String(err?.message || err) },
        }));
      });
  }

  if (pagination) {
    const pager = document.createElement('div');
    pager.className = 'x-articles__pagination';
    const prevBtn = document.createElement('x-button');
    prevBtn.textContent = 'Previous';
    prevBtn.setAttribute('disabled', '');
    const pageLabel = document.createElement('span');
    pageLabel.className = 'x-articles__page-label';
    pageLabel.textContent = 'Page 1';
    const nextBtn = document.createElement('x-button');
    nextBtn.textContent = 'Next';
    pager.appendChild(prevBtn);
    pager.appendChild(pageLabel);
    pager.appendChild(nextBtn);
    element.appendChild(pager);
  }

  return () => {
    // Retire this generation so any in-flight fetch drops its results
    // instead of writing into a torn-down element.
    element._wbArticlesGen = (element._wbArticlesGen || 0) + 1;
    element.classList.remove('x-articles');
    element.innerHTML = '';
  };
}
