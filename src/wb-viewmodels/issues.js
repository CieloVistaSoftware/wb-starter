/**
 * Issues Behavior
 * -----------------------------------------------------------------------------
 * Draggable/resizable issue submission form
 * Title auto-generated from first 30 chars of description
 * Custom Tag: <wb-issues>
 * -----------------------------------------------------------------------------
 */

export function issues(element, options = {}) {
  let isOpen = false;
  let issues = [];
  
  // Drag/resize state
  let isDragging = false;
  let isResizing = false;
  let dragOffset = { x: 0, y: 0 };

  element.classList.add('wb-issues');

  // Build form - no title field, auto-generated
  element.innerHTML = `
    <button class="wb-issues-trigger" title="Report Issue">🐛</button>
    <div class="wb-issues-overlay"></div>
    <div class="wb-issues-dialog">
      <div class="wb-issues-header">
        <span class="wb-issues-title">🐛 Report Issue</span>
        <div class="wb-issues-header-btns">
          <button class="wb-issues-header-btn" id="viewAllBtn" title="View All">📋</button>
          <button class="wb-issues-header-btn wb-issues-close" title="Close">✕</button>
        </div>
      </div>
      <form class="wb-issues-form">
        <div class="wb-issues-field">
          <label>Type</label>
          <div class="wb-issues-type-btns">
            <label class="wb-issues-type active"><input type="radio" name="type" value="bug" checked><span>🐛 Bug</span></label>
            <label class="wb-issues-type"><input type="radio" name="type" value="feature"><span>✨ Feature</span></label>
            <label class="wb-issues-type"><input type="radio" name="type" value="improvement"><span>💡 Improve</span></label>
          </div>
        </div>
        <div class="wb-issues-field">
          <label>Priority</label>
          <div class="wb-issues-priority-btns">
            <label class="wb-issues-priority"><input type="radio" name="priority" value="low"><span class="low">Low</span></label>
            <label class="wb-issues-priority active"><input type="radio" name="priority" value="medium" checked><span class="medium">Medium</span></label>
            <label class="wb-issues-priority"><input type="radio" name="priority" value="high"><span class="high">High</span></label>
            <label class="wb-issues-priority"><input type="radio" name="priority" value="critical"><span class="critical">Critical</span></label>
          </div>
        </div>
        <div class="wb-issues-field wb-issues-field--grow">
          <label>Description *</label>
          <textarea name="description" placeholder="Describe the issue..." required></textarea>
        </div>
        <input type="hidden" name="page">
        <div class="wb-issues-submit">
          <button type="submit" class="wb-issues-submit-btn">💾 Submit Issue</button>
        </div>
      </form>
      <div class="wb-issues-footer">
        <span class="wb-issues-dot"></span>
        <span class="wb-issues-count">0 issues</span>
      </div>
      <div class="wb-issues-resize"></div>
    </div>
  `;

  // Elements
  const trigger = element.querySelector('.wb-issues-trigger');
  const overlay = element.querySelector('.wb-issues-overlay');
  const dialog = element.querySelector('.wb-issues-dialog');
  const header = element.querySelector('.wb-issues-header');
  const closeBtn = element.querySelector('.wb-issues-close');
  const form = element.querySelector('.wb-issues-form');
  const viewAllBtn = element.querySelector('#viewAllBtn');
  const dot = element.querySelector('.wb-issues-dot');
  const countEl = element.querySelector('.wb-issues-count');
  const pageInput = element.querySelector('input[name="page"]');
  const resizeHandle = element.querySelector('.wb-issues-resize');

  // Radio button styling
  form.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const group = radio.closest('.wb-issues-type-btns, .wb-issues-priority-btns');
      group.querySelectorAll('label').forEach(l => l.classList.remove('active'));
      radio.closest('label').classList.add('active');
    });
  });

  // Hide initially
  overlay.style.display = 'none';
  dialog.style.display = 'none';

  // Storage key
  const STORAGE_KEY = 'wb-issues-dialog';

  // Load saved position and size
  const loadSaved = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved) {
        if (saved.w) dialog.style.width = saved.w + 'px';
        if (saved.h) dialog.style.height = saved.h + 'px';
        if (saved.x !== undefined && saved.y !== undefined) {
          dialog.style.left = saved.x + 'px';
          dialog.style.top = saved.y + 'px';
          dialog.style.transform = 'none';
          return true; // Position was restored
        }
      }
    } catch {}
    return false; // No position saved
  };

  // Save current position and size
  const saveBounds = () => {
    const rect = dialog.getBoundingClientRect();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      x: rect.left,
      y: rect.top,
      w: dialog.offsetWidth,
      h: dialog.offsetHeight
    }));
  };

  // Center dialog helper
  const centerDialog = () => {
    dialog.style.left = '50%';
    dialog.style.top = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
  };

  // Load saved or center
  if (!loadSaved()) {
    centerDialog();
  }

  // Dragging
  header.addEventListener('mousedown', (e) => {
    if (e.target.closest('button')) return;
    isDragging = true;
    const rect = dialog.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    dialog.style.transform = 'none';
    document.body.style.userSelect = 'none';
  });

  // Resizing
  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const x = Math.max(0, Math.min(window.innerWidth - 100, e.clientX - dragOffset.x));
      const y = Math.max(0, Math.min(window.innerHeight - 50, e.clientY - dragOffset.y));
      dialog.style.left = x + 'px';
      dialog.style.top = y + 'px';
    }
    if (isResizing) {
      const rect = dialog.getBoundingClientRect();
      const w = Math.max(320, e.clientX - rect.left);
      const h = Math.max(300, e.clientY - rect.top);
      dialog.style.width = w + 'px';
      dialog.style.height = h + 'px';
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      document.body.style.userSelect = '';
      saveBounds(); // Save position and size
    }
    if (isResizing) {
      isResizing = false;
      document.body.style.userSelect = '';
      saveBounds(); // Save position and size
    }
  });

  // WebSocket
  let ws;
  const connectWS = () => {
    try {
      ws = new WebSocket(`ws://${location.hostname}:3001`);
      ws.onopen = () => dot.classList.add('connected');
      ws.onclose = () => { dot.classList.remove('connected'); setTimeout(connectWS, 2000); };
      ws.onerror = () => ws.close();
      ws.onmessage = (e) => {
        if (e.data === 'reload') location.reload();
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'claude-response') fetchCount();
        } catch {}
      };
    } catch {}
  };

  // Fetch count
  const fetchCount = async () => {
    try {
      const res = await fetch('/api/pending-issues?all=true');
      if (res.ok) {
        const data = await res.json();
        issues = data.issues || [];
        const pending = issues.filter(i => i.status === 'pending').length;
        countEl.textContent = `${issues.length} issue${issues.length !== 1 ? 's' : ''}${pending ? ` (${pending} pending)` : ''}`;
      }
    } catch { countEl.textContent = 'offline'; }
  };

  // Open/close
  const open = () => {
    isOpen = true;
    overlay.style.display = 'block';
    dialog.style.display = 'flex';
    // Use saved position/size or center if none saved
    if (!loadSaved()) {
      centerDialog();
    }
    pageInput.value = location.pathname + location.search;
    setTimeout(() => form.querySelector('textarea[name="description"]').focus(), 50);
  };
  const close = () => {
    isOpen = false;
    overlay.style.display = 'none';
    dialog.style.display = 'none';
  };

  // Submit - title auto-generated from description
  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const desc = fd.get('description').trim();
    const title = desc.substring(0, 30) + (desc.length > 30 ? '...' : '');
    
    // Map priority labels to numeric values for consistency with spec
    const PRIORITY_MAP = { low: 1, medium: 2, high: 3, critical: 4 };
    const priorityVal = fd.get('priority');
    const priorityNum = PRIORITY_MAP[priorityVal] || priorityVal;

    const content = [
      `[${fd.get('type').toUpperCase()}] ${title}`,
      `Priority: ${priorityNum}`,
      `Page: ${fd.get('page') || location.href}`,
      '',
      desc
    ].filter(Boolean).join('\n');

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = '⏳ Saving...';

    try {
      const res = await fetch('/api/add-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (!res.ok) throw new Error();
      btn.textContent = '✅ Saved!';
      form.reset();
      // Reset radio buttons to defaults
      form.querySelector('input[value="bug"]').checked = true;
      form.querySelector('input[value="medium"]').checked = true;
      form.querySelectorAll('.wb-issues-type, .wb-issues-priority').forEach(l => l.classList.remove('active'));
      form.querySelector('input[value="bug"]').closest('label').classList.add('active');
      form.querySelector('input[value="medium"]').closest('label').classList.add('active');
      fetchCount();
      setTimeout(() => { btn.disabled = false; btn.textContent = '💾 Submit Issue'; close(); }, 1000);
    } catch {
      btn.textContent = '❌ Error';
      setTimeout(() => { btn.disabled = false; btn.textContent = '💾 Submit Issue'; }, 2000);
    }
  };

  // View all issues
  const viewAll = async () => {
    const res = await fetch('/api/pending-issues?all=true');
    const data = await res.json();
    const all = (data.issues || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const modal = document.createElement('div');
    modal.className = 'wb-issues-list-modal';
    modal.innerHTML = `
      <div class="wb-issues-list-overlay"></div>
      <div class="wb-issues-list-panel">
        <div class="wb-issues-list-header">
          <span>📋 All Issues (${all.length})</span>
          <button type="button" class="wb-issues-list-close">✕</button>
        </div>
        <div class="wb-issues-list-filters">
          <button class="active" data-f="all">All</button>
          <button data-f="pending">⏳ Pending</button>
          <button data-f="pending-review">🔍 Review</button>
          <button data-f="resolved">✅ Done</button>
        </div>
        <div class="wb-issues-list-items"></div>
        <div class="wb-issues-list-actions">
          <button type="button" class="wb-issues-list-btn" id="clearResolved">🗑️ Clear Resolved</button>
          <button type="button" class="wb-issues-list-btn primary" id="refreshList">🔄 Refresh</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const list = modal.querySelector('.wb-issues-list-items');
    let filter = 'all';

    const render = (items = all) => {
      const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);
      if (!filtered.length) {
        list.innerHTML = '<div class="wb-issues-list-empty">No issues found</div>';
        return;
      }
      list.innerHTML = filtered.map(i => {
        const icons = { pending: '⏳', 'pending-review': '🔍', resolved: '✅', rejected: '❌' };
        const date = new Date(i.createdAt).toLocaleDateString();
        const desc = i.description.split('\n')[0].substring(0, 80);
        return `
          <div class="wb-issues-list-item" data-status="${i.status}">
            <div class="wb-issues-list-item-top">
              <span class="wb-issues-list-item-icon">${icons[i.status] || '❓'}</span>
              <span class="wb-issues-list-item-desc">${desc}</span>
              <span class="wb-issues-list-item-date">${date}</span>
            </div>
            ${i.status === 'pending' ? `<button class="wb-issues-list-item-resolve" data-id="${i.id}">✅ Resolve</button>` : ''}
          </div>
        `;
      }).join('');
    };
    render();

    // Filters
    modal.querySelectorAll('.wb-issues-list-filters button').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.wb-issues-list-filters button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filter = btn.dataset.f;
        render();
      });
    });

    // Close
    modal.querySelector('.wb-issues-list-close').onclick = () => modal.remove();
    modal.querySelector('.wb-issues-list-overlay').onclick = () => modal.remove();

    // Refresh
    modal.querySelector('#refreshList').onclick = async () => {
      const r = await fetch('/api/pending-issues?all=true');
      const d = await r.json();
      const fresh = (d.issues || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      render(fresh);
      fetchCount();
    };

    // Clear resolved
    modal.querySelector('#clearResolved').onclick = async () => {
      if (!confirm('Clear all resolved issues?')) return;
      await fetch('/api/clear-resolved-issues', { method: 'POST' });
      modal.querySelector('#refreshList').click();
    };

    // Resolve
    list.addEventListener('click', async (e) => {
      const btn = e.target.closest('.wb-issues-list-item-resolve');
      if (!btn) return;
      await fetch('/api/update-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId: btn.dataset.id, status: 'approved' })
      });
      modal.querySelector('#refreshList').click();
    });
  };

  // Events
  trigger.onclick = () => isOpen ? close() : open();
  overlay.onclick = close;
  closeBtn.onclick = close;
  form.onsubmit = submit;
  viewAllBtn.onclick = viewAll;
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) close(); });

  // Init
  connectWS();
  fetchCount();
  element.dataset.wbReady = 'issues';

  return () => { if (ws) ws.close(); };
}

export default issues;
