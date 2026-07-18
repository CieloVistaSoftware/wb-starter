/**
 * Article / Articles List Behaviors
 * -----------------------------------------------------------------------------
 * <wb-article> was mapped (tag-map.js elementMap) and schema'd
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
// rebuilding -- innerHTML round-tripping would re-parse nested <wb-article>
// tags (inside <wb-articles>) into brand-new element instances that never
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

  element.classList.add('wb-article');
  element.classList.toggle('wb-article--featured', featured);

  const hasHeaderContent = image || category || date || readingTime || title || subtitle || author;
  if (hasHeaderContent) {
    const header = document.createElement('header');
    header.className = 'wb-article__header';

    if (image) {
      const media = document.createElement('figure');
      media.className = 'wb-article__media';
      const img = document.createElement('img');
      img.src = image;
      img.alt = imageAlt;
      media.appendChild(img);
      header.appendChild(media);
    }

    if (category || date || readingTime) {
      const meta = document.createElement('div');
      meta.className = 'wb-article__meta';
      if (category) {
        const categoryEl = document.createElement('span');
        categoryEl.className = 'wb-article__category';
        categoryEl.textContent = category;
        meta.appendChild(categoryEl);
      }
      if (date) {
        const dateEl = document.createElement('time');
        dateEl.className = 'wb-article__date';
        dateEl.textContent = date;
        dateEl.setAttribute('datetime', date);
        meta.appendChild(dateEl);
      }
      if (readingTime) {
        const readingTimeEl = document.createElement('span');
        readingTimeEl.className = 'wb-article__reading-time';
        readingTimeEl.textContent = readingTime;
        meta.appendChild(readingTimeEl);
      }
      header.appendChild(meta);
    }

    if (title) {
      const titleEl = document.createElement('h1');
      titleEl.className = 'wb-article__title';
      titleEl.textContent = title;
      header.appendChild(titleEl);
    }

    if (subtitle) {
      const subtitleEl = document.createElement('p');
      subtitleEl.className = 'wb-article__subtitle';
      subtitleEl.textContent = subtitle;
      header.appendChild(subtitleEl);
    }

    if (author) {
      const byline = document.createElement('div');
      byline.className = 'wb-article__byline';
      const authorLabel = document.createElement('span');
      authorLabel.textContent = `By ${author}`;
      byline.appendChild(authorLabel);
      header.appendChild(byline);
    }

    element.appendChild(header);
  }

  const content = document.createElement('div');
  content.className = 'wb-article__content';
  content.appendChild(body);
  element.appendChild(content);

  if (footer) {
    const footerEl = document.createElement('footer');
    footerEl.className = 'wb-article__footer';
    footerEl.textContent = footer;
    element.appendChild(footerEl);
  }

  return () => {
    element.classList.remove('wb-article', 'wb-article--featured');
    element.innerHTML = '';
  };
}

export function articles(element, options = {}) {
  const layout = options.layout || element.getAttribute('layout') || 'grid';
  const columns = options.columns || element.getAttribute('columns') || '3';
  const pagination = options.pagination ?? element.hasAttribute('pagination');
  const title = options.title || element.getAttribute('title') || '';

  const body = takeChildren(element);

  element.classList.add('wb-articles');

  if (title) {
    const header = document.createElement('header');
    header.className = 'wb-articles__header';
    const titleEl = document.createElement('h2');
    titleEl.textContent = title;
    header.appendChild(titleEl);
    element.appendChild(header);
  }

  const list = document.createElement('div');
  list.className = `wb-articles__list wb-articles--${layout}`;
  if (layout === 'grid') {
    list.style.setProperty('--wb-articles-columns', columns);
  }
  list.appendChild(body);
  element.appendChild(list);

  if (pagination) {
    const pager = document.createElement('div');
    pager.className = 'wb-articles__pagination';
    const prevBtn = document.createElement('wb-button');
    prevBtn.textContent = 'Previous';
    prevBtn.setAttribute('disabled', '');
    const pageLabel = document.createElement('span');
    pageLabel.className = 'wb-articles__page-label';
    pageLabel.textContent = 'Page 1';
    const nextBtn = document.createElement('wb-button');
    nextBtn.textContent = 'Next';
    pager.appendChild(prevBtn);
    pager.appendChild(pageLabel);
    pager.appendChild(nextBtn);
    element.appendChild(pager);
  }

  return () => {
    element.classList.remove('wb-articles');
    element.innerHTML = '';
  };
}
