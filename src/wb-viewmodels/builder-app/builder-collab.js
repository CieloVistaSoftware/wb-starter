/**
 * Builder Collaboration Module
 * WebSocket-based real-time collaboration
 * 
 * @module builder-collab
 */

let collabSocket = null;
let collabConnected = false;
let collabRoom = null;

/**
 * Initialize collaboration WebSocket
 */
export function initCollaboration() {
  const wsUrl = `ws://${window.location.hostname}:3001/collab`;

  try {
    collabSocket = new WebSocket(wsUrl);

    collabSocket.onopen = () => {
      collabConnected = true;
      updateCollabStatus('connecting');

      collabSocket.userId = 'User-' + Math.random().toString(36).slice(2, 6);

      collabRoom = window.location.pathname + window.location.search;
      collabSocket.send(JSON.stringify({
        type: 'join',
        room: collabRoom,
        user: collabSocket.userId
      }));
    };

    collabSocket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleCollabMessage(msg);
      } catch (e) {
        console.warn('[Collab] Invalid message:', e);
      }
    };

    collabSocket.onclose = () => {
      collabConnected = false;
      updateCollabStatus('offline');
      if (localStorage.getItem('wb-collab-enabled') === 'true') {
        setTimeout(initCollaboration, 5000);
      }
    };

    collabSocket.onerror = () => {
      updateCollabStatus('offline');
    };
  } catch (e) {
    console.log('[Collab] WebSocket not available');
    updateCollabStatus('offline');
  }
}

/**
 * Update collaboration status indicator
 * @param {string} status - Status: 'online', 'connecting', 'offline'
 */
export function updateCollabStatus(status) {
  const statusEl = document.getElementById('collabStatus');
  if (!statusEl) return;

  const dot = statusEl.querySelector('.collab-dot');
  const text = statusEl.querySelector('.collab-text');

  if (dot) dot.className = 'collab-dot ' + status;

  if (text) {
    switch (status) {
      case 'online':
        text.textContent = 'Connected';
        statusEl.title = 'Collaboration: Connected';
        break;
      case 'connecting':
        text.textContent = 'Connecting...';
        statusEl.title = 'Collaboration: Connecting';
        break;
      default:
        text.textContent = 'Offline';
        statusEl.title = 'Collaboration: Offline (WebSocket server not running)';
    }
  }
}

/**
 * Handle incoming collaboration message
 * @param {Object} msg - Message object
 */
function handleCollabMessage(msg) {
  switch (msg.type) {
    case 'joined':
      updateCollabStatus('online');
      if (window.toast) window.toast(`Collaboration active: ${msg.users} user(s)`);
      break;
      
    case 'user-joined':
      if (window.toast) window.toast(`${msg.user} joined`);
      break;
      
    case 'user-left':
      if (window.toast) window.toast(`${msg.user} left`);
      break;
      
    case 'component-added':
      if (msg.userId !== collabSocket.userId) {
        syncComponent(msg.data);
      }
      break;
      
    case 'component-updated':
      if (msg.userId !== collabSocket.userId) {
        syncComponentUpdate(msg.id, msg.data);
      }
      break;
      
    case 'component-deleted':
      if (msg.userId !== collabSocket.userId) {
        const el = document.getElementById(msg.id);
        if (el) el.remove();
        if (window.upd) window.upd();
      }
      break;
  }
}

/**
 * Broadcast a change to collaborators
 * @param {string} type - Change type
 * @param {Object} data - Change data
 */
export function broadcastChange(type, data) {
  if (!collabConnected || !collabSocket) return;

  collabSocket.send(JSON.stringify({
    type,
    room: collabRoom,
    userId: collabSocket.userId,
    data
  }));
}

/**
 * Sync a component from another user
 * @param {Object} data - Component data
 */
function syncComponent(data) {
  if (window.dropComponent) {
    window.dropComponent(data).then(() => {
      if (window.upd) window.upd();
    });
  }
}

/**
 * Sync a component update from another user
 * @param {string} id - Component ID
 * @param {Object} data - Updated data
 */
function syncComponentUpdate(id, data) {
  const el = document.getElementById(id);
  if (!el) return;

  el.dataset.c = JSON.stringify(data);
  const inner = el.querySelector('[data-wb]');
  if (inner && data.d) {
    for (const [k, v] of Object.entries(data.d)) {
      inner.dataset[k] = v;
    }
  }
  if (window.WB) window.WB.scan(el);
}

/**
 * Check if collaboration is connected
 * @returns {boolean} Connection status
 */
export function isCollabConnected() {
  return collabConnected;
}

/**
 * Get collaboration room ID
 * @returns {string|null} Room ID
 */
export function getCollabRoom() {
  return collabRoom;
}

// Expose to window
window.broadcastChange = broadcastChange;
window.initCollaboration = initCollaboration;
window.updateCollabStatus = updateCollabStatus;
