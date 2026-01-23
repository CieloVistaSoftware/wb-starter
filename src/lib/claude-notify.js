/**
 * Claude Notification System
 * - Green dot = WebSocket connected
 * - Toast notification with issue + answer on new line
 */
(function() {
  const WS_PORT = 3001;
  let ws;
  let statusDot;
  
  function createStatusDot() {
    statusDot = document.createElement('div');
    statusDot.id = 'claude-status-dot';
    statusDot.title = 'Claude: Disconnected';
    statusDot.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #ef4444;
      box-shadow: 0 0 8px #ef4444;
      z-index: 9999;
      cursor: pointer;
      transition: all 0.3s ease;
    `;
    document.body.appendChild(statusDot);
    
    statusDot.onclick = () => {
      if (ws && ws.readyState === 1) {
        showNotification({ status: 'info', issue: 'Claude connection active', action: 'Listening for responses...' });
      } else {
        connect();
      }
    };
  }
  
  function setConnected(connected) {
    if (!statusDot) return;
    if (connected) {
      statusDot.style.background = '#22c55e';
      statusDot.style.boxShadow = '0 0 8px #22c55e';
      statusDot.title = 'Claude: Connected';
    } else {
      statusDot.style.background = '#ef4444';
      statusDot.style.boxShadow = '0 0 8px #ef4444';
      statusDot.title = 'Claude: Disconnected';
    }
  }
  
  function connect() {
    ws = new WebSocket(`ws://${window.location.hostname}:${WS_PORT}`);
    
    ws.onopen = () => {
      console.log('[Claude] ● Connected');
      setConnected(true);
    };
    
    ws.onmessage = (event) => {
      // Handle live reload
      if (event.data === 'reload') {
        window.location.reload();
        return;
      }
      
      // Handle Claude responses
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'claude-response') {
          showNotification(msg.data);
        }
      } catch (e) {}
    };
    
    ws.onclose = () => {
      console.log('[Claude] ○ Disconnected');
      setConnected(false);
      setTimeout(connect, 2000);
    };
    
    ws.onerror = () => ws.close();
  }
  
  function showNotification(response) {
    const isSuccess = response.status === 'success';
    const isError = response.status === 'error';
    const isInfo = response.status === 'info';
    
    // Determine color
    let bgColor = '#065f46'; // green
    let borderColor = '#10b981';
    let icon = '✅';
    
    if (isError) {
      bgColor = '#991b1b';
      borderColor = '#ef4444';
      icon = '❌';
    } else if (isInfo) {
      bgColor = '#1e40af';
      borderColor = '#3b82f6';
      icon = '🤖';
    }
    
    // Create toast container if not exists
    let container = document.getElementById('claude-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'claude-toast-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.style.cssText = `
      background: ${bgColor};
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.4);
      max-width: 420px;
      min-width: 300px;
      pointer-events: auto;
      animation: claudeSlideIn 0.3s ease;
      border-left: 4px solid ${borderColor};
      cursor: pointer;
    `;
    
    toast.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <span style="font-size:1.3rem;">${icon}</span>
        <strong style="font-size:0.95rem;">${response.issue || 'Claude Response'}</strong>
      </div>
      ${response.action ? `<div style="font-size:0.85rem;opacity:0.95;padding-left:28px;line-height:1.4;">${response.action}</div>` : ''}
    `;
    
    container.appendChild(toast);
    
    // Pulse the status dot
    if (statusDot) {
      statusDot.style.transform = 'scale(1.5)';
      setTimeout(() => statusDot.style.transform = 'scale(1)', 300);
    }
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      toast.style.animation = 'claudeSlideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 10000);
    
    // Click to dismiss
    toast.onclick = () => {
      toast.style.animation = 'claudeSlideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    };
  }
  
  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes claudeSlideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes claudeSlideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  
  // Initialize
  function init() {
    createStatusDot();
    connect();
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Expose for testing
  window.claudeNotify = {
    test: () => showNotification({ 
      status: 'success', 
      issue: 'Test notification', 
      action: 'This is the answer explaining what was done to fix the issue.' 
    }),
    testError: () => showNotification({ 
      status: 'error', 
      issue: 'Test error', 
      action: 'Something went wrong while trying to fix this.' 
    })
  };
})();
