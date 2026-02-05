import { createToast } from '../feedback.js';

/**
 * Enhanced `<table>` element with sorting, filtering, and selection.
 * - Striped, hoverable, searchable tables with `[x-behavior="table"]`.
 */
export function cc() {}

export function table(element, options = {}) {
  const config = {
    striped: options.striped ?? element.hasAttribute('data-striped'),
    hover: options.hover ?? (element.dataset.hover !== 'false'),
    bordered: options.bordered ?? element.hasAttribute('data-bordered'),
    compact: options.compact ?? element.hasAttribute('data-compact'),
    sortable: options.sortable ?? (element.dataset.sortable !== 'false'),
    searchable: options.searchable ?? element.hasAttribute('data-searchable'),
    copyable: options.copyable ?? element.hasAttribute('data-copyable'),
    selectable: options.selectable ?? element.hasAttribute('data-selectable'),
    ...options
  };

  // Logic removed - structure is now handled by ui-table.html template
  // We assume the table structure (thead, tbody) exists.
  
  const tableEl = element.querySelector('table') || element;
  let searchInput = element.querySelector('.wb-table__search');

  // If searchable but no input found (and we are not the wrapper), we might need to look around or just skip
  // But since we are moving to templates, the template should have rendered the input.

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

  tableEl.classList.add('wb-table');
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
        rows.sort((a, b) => {
          const aVal = a.children[colIndex].textContent.trim();
          const bVal = b.children[colIndex].textContent.trim();
          
          const aNum = parseFloat(aVal.replace(/[^0-9.-]/g, ''));
          const bNum = parseFloat(bVal.replace(/[^0-9.-]/g, ''));
          
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
          }
          return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
        
        rows.forEach(row => tbody.appendChild(row));
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
    rows.forEach((tr, index) => {
      tr.style.cursor = 'pointer';
      tr.onclick = (e) => {
        if (e.target.closest('a, button, input')) return;
        rows.forEach(r => r.classList.remove('active'));
        tr.classList.add('active');
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
        navigator.clipboard.writeText(text).then(() => {
          createToast(`Copied: ${text}`, 'success');
        });
      }
    });
    tableEl.style.cursor = 'pointer';
  }

  element.dataset.wbReady = 'table';
  return () => {
    tableEl.classList.remove('wb-table', 'wb-table--striped', 'wb-table--hover', 'wb-table--bordered', 'wb-table--compact');
  };
}

export default { table };
