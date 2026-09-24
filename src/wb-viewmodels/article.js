/**
 * Articles List Behavior
 * -----------------------------------------------------------------------------
 * articles() is the grid/list wrapper that lays out <article> children. Each
 * child is a card: tag-map.js routes <article> to card.js, which renders the
 * title, author, date, category and reading time. There is no separate
 * article() any more -- it was unreachable (the `article` name loaded card.js)
 * and was deleted.
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
  element.classList.add('x-articles');

  if (title) {
    // A native <header> here would auto-inject the header() behavior on top
    // of this one -- a plain <div> avoids that collision.
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
        // The appended <article> hosts must be scanned to become cards. WB.scan is async (#845), so it is awaited here rather
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
