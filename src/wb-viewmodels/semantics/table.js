import { readFlag, readAttr, readNumber } from '../../core/read-attr.js';
import { createToast } from '../feedback.js';

/**
 * Table — enhanced <table> element
 *
 * Adds sortable headers, striping, row hover, search, selection, copy and
 * pagination. A plain <table> IS this behavior (tag-map.js), so there is no
 * attribute to add; `x-table` exists for a non-table host only.
 *
 * Options are read with readFlag/readAttr/readNumber (#1344). They used to be
 * read with a bare `hasAttribute()`, which had two consequences:
 *
 *   striped="false"   turned striping ON, because hasAttribute is true for ANY
 *                     value including the string "false" — the #747 trap. Six
 *                     options had it (striped, bordered, compact, copyable,
 *                     selectable, searchable) while paginated/sortable/hoverable
 *                     checked `!== 'false'` correctly, so the same file did it
 *                     right three times and wrong six times;
 *   pageSize          was looked up as `page-size` first, and the docs taught
 *                     that dashed spelling, while the rule is that no attribute
 *                     name carries a dash — only the x- behavior prefix does
 *                     (#1125). The schema has always said `pageSize`.
 *
 * readFlag/readAttr accept the camelCase name, still read the dashed and data-*
 * spellings for anything already written, and treat "false" and "0" as false.
 */
/**
 * Compare two cell values by what they ARE, not by what parseFloat makes of them.
 *
 * #1011. The previous comparator was one line:
 *
 *   const aNum = parseFloat(aVal.replace(/[^0-9.-]/g, ''));
 *
 * `parseFloat("2026-09-03")` is 2026, so every date in a year compared EQUAL and
 * a date column never moved -- while the header arrow still updated, so the
 * control looked like it worked. `parseFloat("4.0.1")` is 4, so every 4.x
 * version tied with every other and the order collapsed to whatever the stable
 * sort happened to leave.
 *
 * Stripping characters before deciding the type is the root mistake: it turns
 * "9/3/2026" into the number 932026 and "3 items" into 3. The type has to be
 * decided from the WHOLE value.
 */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:[T\s].*)?$/;
/** A date as a PAGE renders it: "Sep 5, 2026", "5 Sep 2026", "9/5/2026". */
const LOCALE_DATE = /^(?:[A-Za-z]{3,9}\.? \d{1,2}, ?\d{4}|\d{1,2} [A-Za-z]{3,9}\.? \d{4}|\d{1,2}\/\d{1,2}\/\d{4})$/;
const DOTTED_VERSION = /^\d+(?:\.\d+){1,3}$/;
const PURE_NUMBER = /^-?\d+(?:\.\d+)?$/;

function compareCells(a, b) {
  // Empty values sort last in both directions -- a blank is not "smallest",
  // it is missing, and burying it under real data is what a reader expects.
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  if (ISO_DATE.test(a) && ISO_DATE.test(b)) {
    return new Date(a).getTime() - new Date(b).getTime();
  }

  // #1011, second pass. Handling ISO dates fixed the format the DATA is in and
  // missed the format the PAGE renders. `pages/issues.html:329` prints
  // `toLocaleDateString(undefined, {year:'numeric', month:'short', day:'numeric'})`
  // — "Sep 5, 2026" — straight into a <table sortable>, and a rendered date
  // matches none of the rules above, so it fell through to localeCompare and
  // sorted ALPHABETICALLY BY MONTH NAME. Measured against the real comparator:
  //
  //   compare("Apr 1, 2025", "Mar 1, 2020") = -1   (chronologically +1: wrong by 5 years)
  //   compare("Jan 2, 2026", "Feb 1, 2026") = +1   (chronologically -1)
  //
  // Some pairs come out right by luck — "Sep 5, 2026" vs "Dec 1, 2025" happens
  // to agree — which is why a spot check of the Updated column looks fine.
  //
  // The shape is matched strictly before Date.parse is trusted, because
  // Date.parse is famously willing: it accepts "March 2020" and other prose, and
  // a Title column must never be reordered as though it held dates.
  //
  // Slash form is ambiguous across locales ("9/5/2026"); V8 reads it US-style.
  // That is a consistent ordering rather than a correct one, and still strictly
  // better than sorting by first digit. Anything genuinely order-critical should
  // be rendered ISO, which the branch above handles exactly.
  if (LOCALE_DATE.test(a) && LOCALE_DATE.test(b)) {
    const ta = Date.parse(a);
    const tb = Date.parse(b);
    if (!Number.isNaN(ta) && !Number.isNaN(tb)) return ta - tb;
  }

  if (DOTTED_VERSION.test(a) && DOTTED_VERSION.test(b)) {
    const as = a.split('.').map(Number);
    const bs = b.split('.').map(Number);
    for (let i = 0; i < Math.max(as.length, bs.length); i++) {
      const d = (as[i] ?? 0) - (bs[i] ?? 0);
      if (d) return d;
    }
    return 0;
  }

  if (PURE_NUMBER.test(a) && PURE_NUMBER.test(b)) {
    return Number(a) - Number(b);
  }

  // numeric: true so "item 2" precedes "item 10" instead of following it.
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Read this behavior's options off the host element (#1344).
 *
 * One place, one reader per option, each named exactly as
 * src/wb-models/table.schema.json declares it. The defaults here ARE the
 * schema's defaults — `sortable` and `hoverable` are true, everything else is
 * false — so `readFlag(el, name, fallback)` and the schema cannot disagree.
 *
 * `hover` is deliberately NOT read (#1344). It was an undeclared second name
 * for `hoverable`, which is the spelling the schema declares and
 * docs/architecture/standards/ATTRIBUTE-NAMING-STANDARD.md names as canonical.
 */
function optionsFrom(element, options = {}) {
  return {
    striped: options.striped ?? readFlag(element, 'striped'),
    hoverable: options.hoverable ?? readFlag(element, 'hoverable', true),
    // #669: paginated and pageSize were declared and read NOWHERE, so
    // <table paginated> produced no pagination at all -- exactly what John
    // reported.
    paginated: options.paginated ?? readFlag(element, 'paginated'),
    // #1344: the schema says `pageSize`. readNumber reads that, the dashed
    // `page-size` the old docs taught, and `data-page-size` — and never
    // returns NaN. `|| 10` keeps pageSize="0" from dividing by zero in the
    // pager.
    pageSize: Number(options.pageSize ?? readNumber(element, 'pageSize', 10)) || 10,
    bordered: options.bordered ?? readFlag(element, 'bordered'),
    compact: options.compact ?? readFlag(element, 'compact'),
    sortable: options.sortable ?? readFlag(element, 'sortable', true),
    // #669: the schema publishes `filterable`; this only read `searchable`.
    // The schema declares searchable as `aliasOf: filterable`, so either name
    // switches the one filter input on.
    searchable: options.searchable
      ?? (readFlag(element, 'searchable') || readFlag(element, 'filterable')),
    copyable: options.copyable ?? readFlag(element, 'copyable'),
    selectable: options.selectable ?? readFlag(element, 'selectable'),
  };
}

export function table(element, options = {}) {
  const config = { ...optionsFrom(element, options), ...options };

  const tableEl = element.querySelector('table') || element;
  // Detect an existing search input in either of the two places it can
  // legitimately live: nested inside `element` (the <table> host acting
  // as its own table, or a wrapped native <table> child), OR as the bare
  // native <table>'s own previous sibling (see the insertion logic below --
  // an <input> can't be a valid child of a real <table>).
  let searchInput = element.querySelector('.x-table__search') ||
    (tableEl.previousElementSibling && tableEl.previousElementSibling.classList &&
      tableEl.previousElementSibling.classList.contains('x-table__search')
      ? tableEl.previousElementSibling : null);

  // #433: `searchable` was computed above but nothing ever created the
  // input -- table.js only ever looked for one a schema/$view template was
  // assumed to have already rendered, which was never actually true for
  // either a bare <table searchable> (table.schema.json's $view has no
  // "search" part -- only an unrelated "filter" part gated on a different
  // property, `filterable`, that this file doesn't read at all) or a native
  // <table searchable> (no schema involvement for native tags at all).
  // Confirmed live: `searchable` rendered no search box on every documented
  // example. Build one here, the same self-sufficient pattern every other
  // boolean attribute in this file already uses (striped/hoverable/bordered/
  // compact all render their own effect with no author-supplied markup).
  if (config.searchable && !searchInput) {
    searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.className = 'x-table__search';
    searchInput.placeholder = 'Search...';
    searchInput.setAttribute('aria-label', 'Search table');
    if (tableEl.tagName.toLowerCase() === 'table' && tableEl.parentNode) {
      // A real <table> only permits table-content children (thead/tbody/
      // tr/...) -- an <input> placed inside it would be invalid content-
      // model-wise. Insert as the table's own previous sibling instead,
      // still directly above the rows it filters.
      tableEl.parentNode.insertBefore(searchInput, tableEl);
    } else {
      // <table> acting as its own table host (no nested <table> child)
      // -- a custom element has no HTML content-model restriction, so the
      // search box can be a real first child, ahead of its <thead>.
      element.insertBefore(searchInput, element.firstChild);
    }
  }

  // schema-builder.js's processSchema() unconditionally wipes a schema-built
  // element's original content before rebuilding table.schema.json's $view
  // (an empty <thead>/<tbody> pair -- the schema declares no row-building
  // logic at all) -- the wiped content is stashed as element._wbOriginalContent
  // ("nothing reads this unless a behavior explicitly opts in", per
  // schema-builder.js's own comment). table.js never opted in: the comment
  // it used to have here ("Logic removed... assume the table structure
  // exists") assumed something else would populate rows, but nothing ever
  // did. Confirmed live: every <table> on docs/components/semantics/
  // table.md rendered a completely empty table (0 <tr> elements) regardless
  // of whether rows were authored as slotted <thead>/<tbody> markup,
  // headers/rows attributes, or the schema's own data/columns properties.
  // Populate real rows here, trying each authoring method in turn --
  // same "read back the pre-wipe original content" pattern overlay.js's
  // drawer() already uses for its own title text.
  const tableElForBuild = element.querySelector('table') || element;
  let theadForBuild = tableElForBuild.querySelector('thead');
  let tbodyForBuild = tableElForBuild.querySelector('tbody');

  // Create the sections when they are missing.
  //
  // This used to REQUIRE thead and tbody to already exist, so it only ever
  // filled a table someone had half-built by hand. The form every doc shows --
  //
  //     <table headers="A,B" rows='[["1","2"]]'></table>
  //
  // has neither, so the block below was skipped entirely and the table
  // rendered empty: behavior attached, classed x-table--striped, containing
  // nothing at all. Requiring the author to hand-write the sections that the
  // attributes exist to fill defeats the point of the attributes.
  //
  // #1344: through readAttr like every other option, so one reader covers the
  // whole schema rather than four of its properties going round the side.
  const headersAttr = readAttr(element, 'headers', '');
  const rowsAttr = readAttr(element, 'rows', '');
  const dataAttr = readAttr(element, 'data', '');
  const columnsAttr = readAttr(element, 'columns', '');

  const wantsAttributeBuild = (headersAttr && rowsAttr) || (dataAttr && columnsAttr);
  if (wantsAttributeBuild && !theadForBuild) {
    theadForBuild = document.createElement('thead');
    tableElForBuild.appendChild(theadForBuild);
  }
  if (wantsAttributeBuild && !tbodyForBuild) {
    tbodyForBuild = document.createElement('tbody');
    tableElForBuild.appendChild(tbodyForBuild);
  }

  if (theadForBuild && tbodyForBuild && !tbodyForBuild.querySelector('tr')) {
    if (headersAttr && rowsAttr) {
      try {
        const headers = headersAttr.split(',').map(h => h.trim());
        const rows = JSON.parse(rowsAttr);
        populateTableRows(theadForBuild, tbodyForBuild, headers, rows);
      } catch (e) {
        console.warn(`[WB Table] failed to parse headers/rows attributes: ${e.message}`);
      }
    } else if (dataAttr && columnsAttr) {
      try {
        const data = JSON.parse(dataAttr);
        const columns = JSON.parse(columnsAttr);
        const headers = columns.map(c => c.label || c.key);
        const rows = data.map(row => columns.map(c => row[c.key]));
        populateTableRows(theadForBuild, tbodyForBuild, headers, rows);
      } catch (e) {
        console.warn(`[WB Table] failed to parse data/columns attributes: ${e.message}`);
      }
    } else if (element._wbOriginalHTML && element._wbOriginalHTML.trim()) {
      // _wbOriginalContent (schema-builder.js) is TEXT-only and can't carry
      // real markup -- _wbOriginalHTML is the actual pre-wipe innerHTML.
      const temp = document.createElement('div');
      temp.innerHTML = element._wbOriginalHTML;
      const originalThead = temp.querySelector('thead');
      const originalTbody = temp.querySelector('tbody');
      if (originalThead) theadForBuild.innerHTML = originalThead.innerHTML;
      if (originalTbody) tbodyForBuild.innerHTML = originalTbody.innerHTML;
    }
  }

  let currentData = [];
  let filteredData = [];
  let sortCol = -1;
  let sortDir = 'asc';

  // Initialize data from DOM
  const tbody = tableEl.querySelector('tbody');
  if (tbody) {
    currentData = Array.from(tbody.querySelectorAll('tr')).map(tr =>
      Array.from(tr.querySelectorAll('td')).map(td => td.textContent) // Use textContent instead of innerHTML
    );
    filteredData = [...currentData];
  }

  // #448: skip the class specifically when tableEl IS the <table> HOST
  // itself (a <table> used with no nested <table> child) -- data.css
  // selects the `.x-table` TAG directly for that case now. Still added when
  // tableEl is a native <table> (either autoInject's native.table entry, or
  // the child <table> a <table> wraps), since data.css's `table.x-table`/
  // `.x-table > table` rules still need the class there (a native `table`
  // tag can never match a `.x-table` tag selector).
  tableEl.classList.add('x-table');
  if (config.striped) tableEl.classList.add('x-table--striped');
  if (config.hoverable) tableEl.classList.add('x-table--hover');
  if (config.bordered) tableEl.classList.add('x-table--bordered');
  if (config.compact) tableEl.classList.add('x-table--compact');

  // Search Logic
  if (searchInput) {
    searchInput.oninput = () => {
      const term = searchInput.value.toLowerCase();
      const rows = tbody.querySelectorAll('tr');
      
      rows.forEach((row, i) => {
        const text = row.textContent.toLowerCase();
        const match = !term || text.includes(term);
        // A class, not style.display (#779) -- and not `hidden`, which the
        // pager below owns: a row can be off-page and filtered out at once.
        row.classList.toggle('x-table__row--filtered', !match);
      });
      // #344: table.schema.json declares filter, sort and page; nothing fired them.
      element.dispatchEvent(new CustomEvent('wb:table:filter', { bubbles: true, detail: { query: searchInput.value } }));
    };
  }

  // Sort Logic
  if (config.sortable) {
    const headers = tableEl.querySelectorAll('th');
    headers.forEach((th, colIndex) => {
      th.classList.add('x-table__sortable');   // pointer cursor, data.css (#779)
      th.onclick = () => {
        if (sortCol === colIndex) {
          sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          sortCol = colIndex;
          sortDir = 'asc';
        }
        
        // Update UI
        headers.forEach(h => h.classList.remove('x-table--sorted-asc', 'x-table--sorted-desc'));
        th.classList.add(sortDir === 'asc' ? 'x-table--sorted-asc' : 'x-table--sorted-desc');
        
        // Sort Rows
        const dataRows = Array.from(tbody.querySelectorAll('tr'));

        // #1036: a cell may declare its own sort key. What a column DISPLAYS and
        // what it should be ORDERED by are not always the same value -- a
        // priority column showing '—' for unrated, a date shown as "Sep 5, 2026",
        // a size shown as "1.2 MB". Without this the display text is the only
        // key available, and the Priority column sorted every unrated row above
        // priority 1: the least urgent first, in the column that exists to
        // express urgency.
        // Falls back to textContent, so every existing table sorts exactly as
        // it did.
        //
        // Law 11: a PLAIN attribute -- not `data-` and not `.dataset`. The
        // first version of this used `data-sort-value` and
        // `cell.dataset.sortValue`, which is the exact pattern the law forbids
        // on behavior elements.
        //
        // #1344: the name is `sortValue`. It was written `sort-value`, the
        // second dashed name in this file, and no attribute name carries a
        // dash -- only the x- behavior prefix does (#1125). readAttr reads the
        // camelCase name AND the dashed one, so cells already marked up with
        // `sort-value` keep sorting exactly as they did.
        const keyOf = (row) => {
          const cell = row.children[colIndex];
          if (!cell) return '';
          return (readAttr(cell, 'sortValue', '') || cell.textContent || '').trim();
        };

        dataRows.sort((a, b) => {
          const cmp = compareCells(keyOf(a), keyOf(b));
          return sortDir === 'asc' ? cmp : -cmp;
        });
        
        dataRows.forEach(row => tbody.appendChild(row));
        element.dispatchEvent(new CustomEvent('wb:table:sort', {
          bubbles: true, detail: { column: th.textContent.trim(), direction: sortDir },
        }));
      };
      
      // Right-click copy
      th.oncontextmenu = (e) => {
        e.preventDefault();
        const headerText = th.textContent.trim();
        navigator.clipboard.writeText(headerText).then(() => {
          createToast(`Copied column: ${headerText}`, 'success');
        });
      };
      th.title = 'Click to sort, right-click to copy';
    });
  }

  // Selectable Logic
  if (config.selectable) {
    const tableRows = tableEl.querySelectorAll('tbody tr');
    tableRows.forEach((tr, index) => {
      tr.classList.add('x-table__selectable');   // pointer cursor, data.css (#779)
      tr.onclick = (e) => {
        if (e.target.closest('a, button, input')) return;
        // #592: the demo hint text ("Hold Ctrl/Cmd to multi-select") was
        // never implemented -- this handler unconditionally cleared every
        // other row's `active` class on every click. Only clear the rest
        // when NEITHER modifier is held; when one is, toggle just the
        // clicked row so a second Ctrl/Cmd-click ADDS to the selection
        // instead of replacing it.
        if (e.ctrlKey || e.metaKey) {
          tr.classList.toggle('active');
        } else {
          tableRows.forEach(r => r.classList.remove('active'));
          tr.classList.add('active');
        }
        element.dispatchEvent(new CustomEvent('wb:table:select', {
          detail: { row: tr, index },
          bubbles: true
        }));
      };
    });
  }

  // Copyable Logic
  if (config.copyable) {
    tableEl.addEventListener('click', (e) => {
      const td = e.target.closest('td');
      if (td) {
        const displayText = td.textContent.trim();
        navigator.clipboard.writeText(displayText).then(() => {
          createToast(`Copied: ${displayText}`, 'success');
        });
      }
    });
    tableEl.classList.add('x-table--copyable');   // pointer cursor, data.css (#779)
  }

  // #669: pagination. Built after sorting and search wiring so it sees the final row
  // set, and re-derived from the live <tbody> each time rather than a cached
  // array -- sorting reorders those same nodes in place.
  let pagerCleanup = null;
  if (config.paginated) pagerCleanup = buildPager(element, tableEl, config.pageSize);

  return () => {
    if (pagerCleanup) pagerCleanup();
    tableEl.classList.remove('x-table', 'x-table--striped', 'x-table--hover', 'x-table--bordered', 'x-table--compact');
  };
}

/**
 * Shows one page of rows at a time with Prev/Next controls (#669).
 *
 * Rows are hidden with `hidden` rather than removed: sorting, searching and any
 * row-level listeners keep working on the same nodes, and nothing has to be
 * rebuilt when the page changes.
 */
function buildPager(element, tableEl, pageSize) {
  const tbody = tableEl.querySelector('tbody');
  if (!tbody) return null;

  const pager = document.createElement('nav');
  pager.className = 'x-table__pager';
  pager.setAttribute('aria-label', 'Table pagination');

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'x-table__pager-btn';
  prev.textContent = 'Previous';

  const status = document.createElement('span');
  status.className = 'x-table__pager-status';
  status.setAttribute('aria-live', 'polite');

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'x-table__pager-btn';
  next.textContent = 'Next';

  pager.append(prev, status, next);
  // A <nav> is not valid inside <table>, so mount it after the table.
  (tableEl.parentElement || element).insertBefore(pager, tableEl.nextSibling);

  let page = 0;
  const render = () => {
    const rows = [...tbody.querySelectorAll('tr')];
    const pages = Math.max(1, Math.ceil(rows.length / pageSize));
    if (page > pages - 1) page = pages - 1;
    rows.forEach((tr, i) => {
      tr.hidden = i < page * pageSize || i >= (page + 1) * pageSize;
    });
    status.textContent = `Page ${page + 1} of ${pages} — ${rows.length} rows`;
    prev.disabled = page === 0;
    next.disabled = page >= pages - 1;
  };

  // The page a reader sees: 1-based, as the status line says it.
  const announce = () => element.dispatchEvent(new CustomEvent('wb:table:page', { bubbles: true, detail: { page: page + 1 } }));
  const onPrev = () => { if (page > 0) { page--; render(); announce(); } };
  const onNext = () => { page++; render(); announce(); };
  prev.addEventListener('click', onPrev);
  next.addEventListener('click', onNext);
  render();

  return () => {
    prev.removeEventListener('click', onPrev);
    next.removeEventListener('click', onNext);
    [...tbody.querySelectorAll('tr')].forEach((tr) => { tr.hidden = false; });
    pager.remove();
  };
}

/** Builds real <tr>/<th>/<td> rows into an already-created (empty) thead/tbody pair. textContent, not innerHTML -- row data is untrusted string/JSON input, not markup. */
function populateTableRows(thead, tbody, headers, rows) {
  thead.innerHTML = '';
  const headerRow = document.createElement('tr');
  headers.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  tbody.innerHTML = '';
  rows.forEach(row => {
    const tr = document.createElement('tr');
    row.forEach(cell => {
      const td = document.createElement('td');
      td.textContent = String(cell);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

export default { table };
