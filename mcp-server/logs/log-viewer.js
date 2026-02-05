const logContainer = document.getElementById('log-container');
const searchInput = document.getElementById('search');
const filterDirection = document.getElementById('filter-direction');
const filterMethod = document.getElementById('filter-method');

let allEntries = [];
let methods = new Set();

// Syntax highlight JSON
function highlightJSON(json) {
  if (typeof json !== 'string') {
    json = JSON.stringify(json, null, 2);
  }
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, match => {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'json-key' : 'json-string';
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return `<span class="${cls}">${match}</span>`;
    });
}

// Parse the log file
function parseLog(text) {
  const entries = [];
  const lines = text.split('\n');
  let currentEntry = null;
  let jsonBuffer = [];
  let inJson = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Session header
    if (line.includes('MCP npm-runner started:')) {
      const match = line.match(/started: (.+)/);
      if (match) {
        entries.push({
          type: 'session',
          timestamp: match[1]
        });
      }
      continue;
    }
    
    // Transport message
    if (line.includes('transport started')) {
      entries.push({ type: 'transport', message: 'Transport started' });
      continue;
    }
    
    // Log entry header
    const headerMatch = line.match(/^\[([^\]]+)\] (->|<-) (?:\[id:(\d+)\] )?(.+)/);
    if (headerMatch) {
      // Save previous entry
      if (currentEntry && jsonBuffer.length) {
        try {
          currentEntry.json = JSON.parse(jsonBuffer.join('\n'));
        } catch {
          currentEntry.rawJson = jsonBuffer.join('\n');
        }
        entries.push(currentEntry);
      }
      
      currentEntry = {
        type: 'message',
        timestamp: headerMatch[1],
        direction: headerMatch[2] === '<-' ? 'incoming' : 'outgoing',
        id: headerMatch[3] || null,
        method: headerMatch[4],
        json: null
      };
      jsonBuffer = [];
      inJson = false;
      
      methods.add(headerMatch[4].split(' ')[0]);
      continue;
    }
    
    // JSON content
    if (line.startsWith('{')) {
      inJson = true;
    }
    
    if (inJson && line.trim()) {
      if (!line.startsWith('─')) {
        jsonBuffer.push(line);
      }
    }
    
    // Separator - end of JSON
    if (line.startsWith('─')) {
      if (currentEntry && jsonBuffer.length) {
        try {
          currentEntry.json = JSON.parse(jsonBuffer.join('\n'));
        } catch {
          currentEntry.rawJson = jsonBuffer.join('\n');
        }
        entries.push(currentEntry);
        currentEntry = null;
      }
      jsonBuffer = [];
      inJson = false;
    }
  }
  
  // Don't forget last entry
  if (currentEntry && jsonBuffer.length) {
    try {
      currentEntry.json = JSON.parse(jsonBuffer.join('\n'));
    } catch {
      currentEntry.rawJson = jsonBuffer.join('\n');
    }
    entries.push(currentEntry);
  }
  
  return entries;
}

// Render entries
function render(entries) {
  const search = searchInput.value.toLowerCase();
  const dirFilter = filterDirection.value;
  const methodFilter = filterMethod.value;
  
  let html = '';
  let inCount = 0, outCount = 0, total = 0;
  
  for (const entry of entries) {
    if (entry.type === 'session') {
      const date = new Date(entry.timestamp);
      html += `<div class="session-header">🚀 Session started: ${date.toLocaleString()}</div>`;
      continue;
    }
    
    if (entry.type === 'transport') {
      html += `<div class="transport-msg">⚡ ${entry.message}</div>`;
      continue;
    }
    
    // Apply filters
    if (dirFilter !== 'all' && entry.direction !== dirFilter) continue;
    if (methodFilter !== 'all' && !entry.method.startsWith(methodFilter)) continue;
    
    const jsonStr = entry.json ? JSON.stringify(entry.json) : (entry.rawJson || '');
    if (search && !entry.method.toLowerCase().includes(search) && !jsonStr.toLowerCase().includes(search)) {
      continue;
    }
    
    total++;
    if (entry.direction === 'incoming') inCount++;
    else outCount++;
    
    const isNotification = entry.method.includes('notification');
    const isError = entry.json?.error || entry.method.includes('error');
    const entryClass = isError ? 'error' : (isNotification ? 'notification' : entry.direction);
    
    const preview = entry.json?.method || entry.json?.result?.tools?.length + ' tools' || '';
    
    html += `
      <div class="log-entry ${entryClass}" data-json='${jsonStr.replace(/'/g, "&#39;")}'>
        <div class="entry-header" onclick="toggleEntry(this.parentElement)">
          <span class="toggle-icon">▶</span>
          <span class="direction">${entry.direction === 'incoming' ? '←' : '→'}</span>
          <span class="timestamp">${new Date(entry.timestamp).toLocaleTimeString()}</span>
          ${entry.id ? `<span class="msg-id">[${entry.id}]</span>` : ''}
          <span class="method">${escapeHtml(entry.method)}</span>
          <span class="preview">${escapeHtml(preview)}</span>
        </div>
        <div class="entry-body">
          <button class="copy-btn" onclick="copyJson(event, this)">Copy</button>
          <pre>${entry.json ? highlightJSON(entry.json) : escapeHtml(entry.rawJson || '')}</pre>
        </div>
      </div>
    `;
  }
  
  if (!html) {
    html = '<div class="empty-state">No log entries found</div>';
  }
  
  logContainer.innerHTML = html;
  
  document.getElementById('stat-total').textContent = `${total} messages`;
  document.getElementById('stat-in').textContent = `${inCount} in`;
  document.getElementById('stat-out').textContent = `${outCount} out`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function toggleEntry(el) {
  el.classList.toggle('expanded');
}

function expandAll() {
  document.querySelectorAll('.log-entry').forEach(el => el.classList.add('expanded'));
}

function collapseAll() {
  document.querySelectorAll('.log-entry').forEach(el => el.classList.remove('expanded'));
}

function copyJson(event, btn) {
  event.stopPropagation();
  const entry = btn.closest('.log-entry');
  const json = entry.dataset.json;
  navigator.clipboard.writeText(JSON.stringify(JSON.parse(json), null, 2));
  btn.textContent = 'Copied!';
  setTimeout(() => btn.textContent = 'Copy', 1500);
}

function populateMethodFilter() {
  const select = filterMethod;
  select.innerHTML = '<option value="all">All Methods</option>';
  [...methods].sort().forEach(m => {
    select.innerHTML += `<option value="${m}">${m}</option>`;
  });
}

async function loadLog() {
  logContainer.innerHTML = '<div class="loading">Loading log...</div>';
  
  try {
    const response = await fetch('mcp-traffic.log?t=' + Date.now());
    const text = await response.text();
    allEntries = parseLog(text).reverse(); // Newest first
    populateMethodFilter();
    render(allEntries);
  } catch (err) {
    logContainer.innerHTML = `<div class="empty-state">Failed to load log: ${err.message}<br><br>Make sure mcp-traffic.log exists in the same directory.</div>`;
  }
}

// Event listeners
searchInput.addEventListener('input', () => render(allEntries));
filterDirection.addEventListener('change', () => render(allEntries));
filterMethod.addEventListener('change', () => render(allEntries));

// Simple switch: ON = auto-refresh, OFF = nothing
window.isAutoOn = false;
window.timerId = null;
window.refreshCount = 0;

function toggleAutoRefresh() {
  const ind = document.querySelector('#auto-refresh .indicator');
  
  // Always stop any existing timer first
  if (window.timerId) {
    clearInterval(window.timerId);
    window.timerId = null;
  }
  
  // Flip the switch
  window.isAutoOn = !window.isAutoOn;
  
  if (window.isAutoOn) {
    // Switch is ON: start refreshing
    ind.className = 'indicator on';
    window.timerId = setInterval(() => {
      window.refreshCount++;
      loadLog();
    }, 5000);
  } else {
    // Switch is OFF: do nothing (timer already cleared above)
    ind.className = 'indicator off';
  }
}

// Initial load only
loadLog();
