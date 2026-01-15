/**
 * builder-preview.js
 * Preview mode functionality for the builder
 */

import { toast } from './builder-utils.js';

/**
 * Toggle preview mode on/off
 */
export function togglePreview() {
  const body = document.body;
  const isCurrentlyPreview = body.classList.contains('preview-mode');
  
  // If not in preview mode, check if there's content before allowing preview
  if (!isCurrentlyPreview) {
    const canvas = document.getElementById('canvas');
    const droppedComponents = canvas?.querySelectorAll('.dropped');
    
    if (!droppedComponents || droppedComponents.length === 0) {
      toast('Nothing to preview! Add components to Header, Main, or Footer first.');
      return;
    }
  }
  
  const isPreview = body.classList.toggle('preview-mode');
  
  // Handle page theme inheritance
  if (isPreview) {
    // Store builder theme
    window._builderTheme = document.documentElement.dataset.theme || 'dark';
    
    // Apply page theme to preview
    const canvasEl = document.getElementById('canvas');
    const pageTheme = canvasEl?.dataset?.pageTheme || 
                      localStorage.getItem('wb-page-theme') ||
                      window._builderTheme;
    
    document.documentElement.dataset.theme = pageTheme;
    document.body.style.background = 'var(--bg-color)';
    document.body.style.color = 'var(--text-primary)';
  } else {
    // Restore builder theme
    if (window._builderTheme) {
      document.documentElement.dataset.theme = window._builderTheme;
    }
    document.body.style.background = '';
    document.body.style.color = '';
  }
  
  // Update button state
  const btn = document.getElementById('previewBtn');
  if (btn) {
    if (isPreview) {
      btn.classList.add('active');
      btn.innerHTML = '<span id="previewIcon">✕</span> Exit Preview';
    } else {
      btn.classList.remove('active');
      btn.innerHTML = '<span id="previewIcon">👁️</span> Preview';
    }
  }
  
  // Add/Remove floating exit button
  let exitBtn = document.getElementById('previewExitBtn');
  if (isPreview) {
    if (!exitBtn) {
      exitBtn = document.createElement('button');
      exitBtn.id = 'previewExitBtn';
      exitBtn.className = 'preview-exit-btn';
      exitBtn.innerHTML = '✕ Exit Preview';
      exitBtn.style.cssText = `
        position: fixed;
        top: 16px;
        right: 16px;
        padding: 12px 24px;
        background: #6366f1;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: move;
        z-index: 99999;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      `;
      
      // Click handler (only fires if not dragging)
      let wasDragging = false;
      exitBtn.addEventListener('click', () => {
        if (!wasDragging) {
          togglePreview();
        }
        wasDragging = false;
      });
      
      // Make draggable
      exitBtn.addEventListener('mousedown', (e) => {
        const dragStartX = e.clientX;
        const dragStartY = e.clientY;
        
        const btnRect = exitBtn.getBoundingClientRect();
        const initialLeft = btnRect.left;
        const initialTop = btnRect.top;
        
        // Switch to left/top positioning
        exitBtn.style.right = 'auto';
        exitBtn.style.left = `${initialLeft}px`;
        exitBtn.style.top = `${initialTop}px`;
        exitBtn.style.cursor = 'grabbing';
        
        const onMouseMove = (moveEvent) => {
          const dx = moveEvent.clientX - dragStartX;
          const dy = moveEvent.clientY - dragStartY;
          
          // If moved more than 5px, consider it a drag
          if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            wasDragging = true;
          }
          
          exitBtn.style.left = `${initialLeft + dx}px`;
          exitBtn.style.top = `${initialTop + dy}px`;
        };
        
        const onMouseUp = () => {
          exitBtn.style.cursor = 'move';
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        
        e.preventDefault();
        e.stopPropagation();
      });
      
      document.body.appendChild(exitBtn);
    }
    exitBtn.style.display = 'block';
    toast('Preview Mode Active');
  } else {
    if (exitBtn) exitBtn.style.display = 'none';
  }
  
  // Trigger resize to fix layout issues
  window.dispatchEvent(new Event('resize'));
}

// Expose globally
window.togglePreview = togglePreview;
window.doPreview = togglePreview; // Alias
