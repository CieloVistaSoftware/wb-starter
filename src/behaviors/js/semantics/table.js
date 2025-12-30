import { createToast } from '../feedback.js';

/**
 * Table - Enhanced <table> element
 * Adds sorting, striping, hover effects, and more
 */
export function table(element, options = {}) {
  const config = {
    headers: (options.headers || element.dataset.headers || '').split(',').filter(Boolean),
    rows: options.rows || JSON.parse(element.dataset.rows || '[]'),
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

  // Parse existing table if no data provided
  if (config.rows.length === 0) {
    const tbody = element.querySelector('tbody');
    if (tbody) {
      config.rows = Array.from(tbody.querySelectorAll('tr')).map(tr => 
        Array.from(tr.querySelectorAll('td')).map(td => td.innerHTML)
      );
    }
    
    if (config.headers.length === 0) {
      const thead = element.querySelector('thead');
      if (thead) {
        config.headers = Array.from(thead.querySelectorAll('th')).map(th => th.innerHTML);
      }
    }
  }

  let currentData = [...config.rows];
  let filteredData = [...currentData];
  let sortCol = -1;
  let sortDir = 'asc';
  let searchInput = null;

  element.classList.add('wb-table');
  if (config.striped) element.classList.add('wb-table--striped');
  if (config.hover) element.classList.add('wb-table--hover');
  if (config.bordered) element.classList.add('wb-table--bordered');
  if (config.compact) element.classList.add('wb-table--compact');

  // Create search box if searchable
  if (config.searchable) {
    const wrapper = document.createElement('div');
    wrapper.className = 'wb-table__wrapper';
    element.parentNode.insertBefore(wrapper, element);
    
    searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Search...';
    searchInput.className = 'wb-table__search';
    searchInput.style.cssText = 'width:100%;padding:0.5rem;margin-bottom:0.5rem;border:1px solid var(--border-color,#374151);border-radius:6px;background:var(--bg-secondary,#1f2937);color:var(--text-primary,#f9fafb);';
    
    searchInput.oninput = () => {
      const term = searchInput.value.toLowerCase();
      if (!term) {
        filteredData = [...currentData];
      } else {
        filteredData = currentData.filter(row => 
          row.some(cell => String(cell).toLowerCase().includes(term))
        );
      }
      render();
    };
    
    wrapper.appendChild(searchInput);
    wrapper.appendChild(element);
  }

  const render = () => {
    let html = '<thead><tr>';
    config.headers.forEach((h, i) => {
      const sortClass = sortCol === i ? (sortDir === 'asc' ? 'wb-table--sorted-asc' : 'wb-table--sorted-desc') : '';
      const sortIndicator = sortCol === i ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';
      html += `<th data-col="${i}" class="${sortClass}">${h}${sortIndicator}</th>`;
    });
    html += '</tr></thead><tbody>';
    filteredData.forEach(row => {
      html += '<tr>';
      row.forEach(cell => html += '<td>' + cell + '</td>');
      html += '</tr>';
    });
    html += '</tbody>';
    element.innerHTML = html;

    // Add click handlers for sorting
    if (config.sortable) {
      element.querySelectorAll('th').forEach(th => {
        th.style.cursor = 'pointer';
        th.onclick = () => {
          const col = parseInt(th.dataset.col);
          if (sortCol === col) {
            sortDir = sortDir === 'asc' ? 'desc' : 'asc';
          } else {
            sortCol = col;
            sortDir = 'asc';
          }
          filteredData.sort((a, b) => {
            const aVal = a[col];
            const bVal = b[col];
            // Try numeric sort
            const aNum = parseFloat(String(aVal).replace(/[^0-9.-]/g, ''));
            const bNum = parseFloat(String(bVal).replace(/[^0-9.-]/g, ''));
            if (!isNaN(aNum) && !isNaN(bNum)) {
              return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
            }
            // String sort
            return sortDir === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
          });
          render();
        };
        
        // Right-click to copy column header
        th.oncontextmenu = (e) => {
          e.preventDefault();
          const headerText = th.textContent.replace(/[↑↓]/g, '').trim();
          navigator.clipboard.writeText(headerText).then(() => {
            createToast(`Copied column: ${headerText}`, 'success');
            const originalBg = th.style.background;
            th.style.background = 'var(--primary, #6366f1)';
            th.style.color = 'white';
            setTimeout(() => {
              th.style.background = originalBg;
              th.style.color = '';
            }, 300);
          });
        };
        th.title = 'Click to sort, right-click to copy';
      });
    }

    // Add click handlers for selection
    if (config.selectable) {
      element.querySelectorAll('tbody tr').forEach((tr, index) => {
        tr.style.cursor = 'pointer';
        tr.onclick = (e) => {
          // Ignore if clicking on a link or button inside the row
          if (e.target.closest('a, button, input')) return;
          
          // Remove active class from all rows
          element.querySelectorAll('tbody tr').forEach(r => r.classList.remove('active'));
          
          // Add active class to clicked row
          tr.classList.add('active');
          
          // Dispatch event
          element.dispatchEvent(new CustomEvent('wb:table:select', {
            detail: { 
              row: tr, 
              data: filteredData[index],
              index: index
            },
            bubbles: true
          }));
        };
      });
    }
  };

  // Copy cell content on click
  if (config.copyable) {
    element.addEventListener('click', (e) => {
      const td = e.target.closest('td');
      if (td && element.contains(td)) {
        const text = td.textContent.trim();
        navigator.clipboard.writeText(text).then(() => {
          createToast(`Copied: ${text}`, 'success');
          
          // Visual feedback
          const originalCellBg = td.style.background;
          td.style.background = 'var(--bg-tertiary, #374151)';
          setTimeout(() => {
            td.style.background = originalCellBg;
          }, 200);
        });
      }
    });
    element.style.cursor = 'pointer'; // Indicate clickable
  }

  if (config.headers.length > 0 || config.rows.length > 0) {
    render();
  }

  // API
  element.wbTable = {
    sort: (col, dir = 'asc') => { 
      sortCol = col; 
      sortDir = dir; 
      filteredData.sort((a, b) => dir === 'asc' ? String(a[col]).localeCompare(String(b[col])) : String(b[col]).localeCompare(String(a[col]))); 
      render(); 
    },
    search: (term) => {
      if (searchInput) searchInput.value = term;
      filteredData = term ? currentData.filter(row => row.some(cell => String(cell).toLowerCase().includes(term.toLowerCase()))) : [...currentData];
      render();
    },
    getData: () => filteredData,
    getAllData: () => currentData,
    setData: (data) => { currentData = [...data]; filteredData = [...data]; render(); },
    refresh: render
  };

  element.dataset.wbReady = 'table';
  return () => {
    element.classList.remove('wb-table', 'wb-table--striped', 'wb-table--hover', 'wb-table--bordered', 'wb-table--compact');
    if (searchInput && searchInput.parentNode) {
      const searchWrapper = searchInput.parentNode;
      searchWrapper.parentNode.insertBefore(element, searchWrapper);
      searchWrapper.remove();
    }
  };
}

export default { table };
