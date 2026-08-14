import { createToast } from '../feedback.js';

/**
 * Table - Enhanced <table> element
 * Adds sorting, striping, hover effects, and more
 * Helper Attribute: [x-behavior="table"]
 */
export function table(element, options = {}) {
  const config = {
    striped: options.striped ?? (element.hasAttribute('striped') || element.hasAttribute('data-striped')),
    hover: options.hover ?? (element.getAttribute('hover') !== 'false'),
    bordered: options.bordered ?? element.hasAttribute('bordered'),
    compact: options.compact ?? element.hasAttribute('compact'),
    sortable: options.sortable ?? (element.getAttribute('sortable') !== 'false'),
    searchable: options.searchable ?? element.hasAttribute('searchable'),
    copyable: options.copyable ?? element.hasAttribute('copyable'),
    selectable: options.selectable ?? element.hasAttribute('selectable'),
    ...options
  };

  const tableEl = element.querySelector('table') || element;
  let searchInput = element.querySelector('.wb-table__search');

  // If searchable but no input found (and we are not the wrapper), we might need to look around or just skip
  // But since we are moving to templates, the template should have rendered the input.

  // schema-builder.js's processSchema() unconditionally wipes a schema-built
  // element's original content before rebuilding table.schema.json's $view
  // (an empty <thead>/<tbody> pair -- the schema declares no row-building
  // logic at all) -- the wiped content is stashed as element._wbOriginalSlot
  // ("nothing reads this unless a behavior explicitly opts in", per
  // schema-builder.js's own comment). table.js never opted in: the comment
  // it used to have here ("Logic removed... assume the table structure
  // exists") assumed something else would populate rows, but nothing ever
  // did. Confirmed live: every <wb-table> on docs/components/semantics/
  // table.md rendered a completely empty table (0 <tr> elements) regardless
  // of whether rows were authored as slotted <thead>/<tbody> markup,
  // headers/rows attributes, or the schema's own data/columns properties.
  // Populate real rows here, trying each authoring method in turn --
  // same "read back the pre-wipe original content" pattern overlay.js's
  // drawer() already uses for its own title text.
  const tableElForBuild = element.querySelector('table') || element;
  const theadForBuild = tableElForBuild.querySelector('thead');
  const tbodyForBuild = tableElForBuild.querySelector('tbody');
  if (theadForBuild && tbodyForBuild && !tbodyForBuild.querySelector('tr')) {
    const headersAttr = element.getAttribute('headers');
    const rowsAttr = element.getAttribute('rows');
    const dataAttr = element.getAttribute('data');
    const columnsAttr = element.getAttribute('columns');

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
      // _wbOriginalSlot (schema-builder.js) is TEXT-only and can't carry
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

  // #448: skip the class specifically when tableEl IS the <wb-table> HOST
  // itself (a <wb-table> used with no nested <table> child) -- data.css
  // selects the `wb-table` TAG directly for that case now. Still added when
  // tableEl is a native <table> (either autoInject's native.table entry, or
  // the child <table> a <wb-table> wraps), since data.css's `table.wb-table`/
  // `.wb-table > table` rules still need the class there (a native `table`
  // tag can never match a `wb-table` tag selector).
  if (tableEl.tagName.toLowerCase() !== 'wb-table') tableEl.classList.add('wb-table');
  if (config.striped) tableEl.classList.add('wb-table--striped');
  if (config.hover) tableEl.classList.add('wb-table--hover');
  if (config.bordered) tableEl.classList.add('wb-table--bordered');
  if (config.compact) tableEl.classList.add('wb-table--compact');

  // Search Logic
  if (searchInput) {
    searchInput.oninput = () => {
      const term = searchInput.value.toLowerCase();
      const rows = tbody.querySelectorAll('tr');
      
      rows.forEach((row, i) => {
        const text = row.textContent.toLowerCase();
        const match = !term || text.includes(term);
        row.style.display = match ? '' : 'none';
      });
    };
  }

  // Sort Logic
  if (config.sortable) {
    const headers = tableEl.querySelectorAll('th');
    headers.forEach((th, colIndex) => {
      th.style.cursor = 'pointer';
      th.onclick = () => {
        if (sortCol === colIndex) {
          sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          sortCol = colIndex;
          sortDir = 'asc';
        }
        
        // Update UI
        headers.forEach(h => h.classList.remove('wb-table--sorted-asc', 'wb-table--sorted-desc'));
        th.classList.add(sortDir === 'asc' ? 'wb-table--sorted-asc' : 'wb-table--sorted-desc');
        
        // Sort Rows
        const dataRows = Array.from(tbody.querySelectorAll('tr'));
        dataRows.sort((a, b) => {
          const aVal = a.children[colIndex].textContent.trim();
          const bVal = b.children[colIndex].textContent.trim();
          
          const aNum = parseFloat(aVal.replace(/[^0-9.-]/g, ''));
          const bNum = parseFloat(bVal.replace(/[^0-9.-]/g, ''));
          
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
          }
          return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
        
        dataRows.forEach(row => tbody.appendChild(row));
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
      tr.style.cursor = 'pointer';
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
    tableEl.style.cursor = 'pointer';
  }

  return () => {
    tableEl.classList.remove('wb-table', 'wb-table--striped', 'wb-table--hover', 'wb-table--bordered', 'wb-table--compact');
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
