import { WBCard } from './wb-card.js';
import { mdhtml } from './mdhtml.js';

/**
 * Fix Card Component
 * -----------------------------------------------------------------------------
 * Special card for displaying fix details.
 * 
 * Custom Tag: <wb-fix-card>
 * -----------------------------------------------------------------------------
 */
export class WBFixCard extends WBCard {
  constructor() {
    super();
    this.fixData = null;
  }

  set data(fix) {
    this.fixData = fix;
    this.render();
  }

  connectedCallback() {
    super.connectedCallback();
    this.classList.add('fix-card');
    
    // Inject styles for hiding scrollbars if not present
    if (!document.getElementById('wb-fix-card-styles')) {
      const style = document.createElement('style');
      style.id = 'wb-fix-card-styles';
      style.textContent = `
        .wb-fix-card-scroll-container::-webkit-scrollbar {
          display: none;
        }
        .wb-fix-card-scroll-container {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        /* Ensure text wraps nicely */
        .fix-card .detail-content, 
        .fix-card .fix-title,
        .fix-card .fix-id,
        .fix-card .detail-label {
          white-space: pre-wrap !important;
          word-break: break-word !important;
          overflow-wrap: anywhere !important;
        }
        
        /* MDHTML / Code Block Overrides - NO SCROLLBARS, NO GAPS, FIT PARENT */
        .fix-card .fix-code-block,
        .fix-card .fix-code-block * {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
        }
        .fix-card .fix-code-block *::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
        }

        .fix-card .fix-code-block pre {
          margin: 0 !important;
          padding: 0.5rem !important;
          background: rgba(0,0,0,0.2) !important;
          border-radius: 4px !important;
          white-space: pre-wrap !important;
          word-break: break-word !important;
          overflow-wrap: anywhere !important;
          overflow-x: hidden !important;
          overflow-y: hidden !important;
          max-height: none !important;
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        
        .fix-card .fix-code-block code {
          padding: 0 !important;
          margin: 0 !important;
          background: transparent !important;
          white-space: pre-wrap !important;
          overflow: visible !important;
          max-height: none !important;
          border: none !important;
          width: 100% !important;
          box-sizing: border-box !important;
          display: block !important;
        }

        .fix-card .x-code {
            white-space: pre-wrap !important;
            word-break: break-word !important;
            overflow-wrap: anywhere !important;
            display: block !important;
            width: 100% !important;
            box-sizing: border-box !important;
            overflow: visible !important;
        }

        /* Hide the WB Code Behavior chrome (language badge, copy button) */
        .fix-card .x-code__header,
        .fix-card .x-code__language,
        .fix-card .x-code__copy,
        .fix-card .x-pre__copy,
        .fix-card .x-pre__language,
        .fix-card .x-pre__line-numbers {
          display: none !important;
        }
        
        /* Reset the wrapper injected by code/pre behavior */
        .fix-card .x-code-wrapper,
        .fix-card .x-pre-wrapper {
          margin: 0 !important;
          padding: 0 !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          width: 100% !important;
          max-width: 100% !important;
          overflow: visible !important;
          max-height: none !important;
        }
        
        .fix-card .signature-block,
        .fix-card .stack-trace {
          font-family: monospace;
          background: rgba(0,0,0,0.2);
          padding: 0.5rem;
          border-radius: 4px;
          overflow-x: auto;
          overflow-y: auto;
          max-height: 150px;
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        /* Constrain overall card height to prevent massive cards */
        .fix-card {
          max-height: 750px;
          overflow-y: auto;
        }
        
        .glow-red {
          color: #ff4444 !important;
          text-shadow: 0 0 8px rgba(255, 0, 0, 0.5);
          font-weight: 600;
          animation: pulse-red 2s infinite;
        }
        @keyframes pulse-red {
          0% { text-shadow: 0 0 5px rgba(255, 0, 0, 0.4); }
          50% { text-shadow: 0 0 12px rgba(255, 0, 0, 0.7); }
          100% { text-shadow: 0 0 5px rgba(255, 0, 0, 0.4); }
        }
      `;
      document.head.appendChild(style);
    }

    // If data was set before connection, render now
    if (this.fixData) {
      this.render();
    }
  }

  escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  getLanguage(fix) {
    if (fix.fix && fix.fix.file) {
      if (fix.fix.file.endsWith('.css')) return 'css';
      if (fix.fix.file.endsWith('.html')) return 'html';
      if (fix.fix.file.endsWith('.json')) return 'json';
    }
    return 'js';
  }

  render() {
    if (!this.fixData || !this.card) return;
    const fix = this.fixData;
    
    let statusDisplay = fix.status || 'INCOMPLETE';
    let statusClass = `status-${(statusDisplay).toLowerCase().replace(/\s+/g, '-')}`;

    // Enforce test requirement: No test = Failed (unless Pending)
    if (!fix.testRun && statusDisplay.toUpperCase() !== 'PENDING') {
      statusDisplay = 'TEST MISSING';
      statusClass = 'status-failed'; // Or status-test-missing if preferred, but CSS uses status-failed
    }

    const dateStr = new Date(fix.date).toLocaleDateString();
    
    const hasCause = fix.cause && fix.cause.trim().length > 0;
    const isMissingBehavior = fix.errorSignature && fix.errorSignature.includes('Unknown behavior');
    const redHoverText = isMissingBehavior ? 'title="CRITICAL: This error indicates a missing behavior file or registration issue, which prevents the component from functioning entirely."' : '';
    
    const causeHtml = hasCause 
      ? `<div class="detail-content ${isMissingBehavior ? 'glow-red' : ''}" ${redHoverText}>${this.escapeHtml(fix.cause)}</div>`
      : `<div class="detail-content violation" style="color: var(--danger); border: 1px dashed var(--danger); background: rgba(239, 68, 68, 0.1);">VIOLATION: No cause specified. Fix requirements mandate a known cause.</div>`;

    const errorSignature = (() => {
      const sig = fix.errorSignature || 'No signature provided';
      if (sig.includes('Enhancement')) {
        // Try to find a component doc link - use direct path for simplicity
        const compName = (fix.component || '').split('/').pop().replace('.js', '');
        if (compName) {
          return `<a href="/docs/components/semantics/${this.escapeHtml(compName)}.md" target="_blank" style="color: var(--primary); text-decoration: none; border-bottom: 1px dashed var(--primary);">Enhancement: See ${this.escapeHtml(compName)}.md</a>`;
        }
        return this.escapeHtml(sig);
      }
      return this.escapeHtml(sig);
    })();

    // Prepare Header Content
    const headerContent = `
      <div class="card-header" style="border:none;padding:0;margin:0;">
        <div class="header-top" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
          <div class="fix-id" style="font-family:monospace;color:var(--text-secondary);background:rgba(0,0,0,0.3);padding:0.2rem 0.4rem;border-radius:4px;">${this.escapeHtml(fix.errorId)}</div>
          <span id="status-${this.escapeHtml(fix.errorId)}" class="fix-status ${statusClass}" style="padding:0.25rem 0.5rem;border-radius:4px;font-size:0.75rem;font-weight:bold;text-transform:uppercase;">${this.escapeHtml(statusDisplay)}</span>
        </div>
        <h3 class="fix-title" style="margin:0;font-size:1.1rem;color:var(--text-primary);">${this.escapeHtml(fix.issue || 'Unknown Issue')}</h3>
      </div>
    `;

    // Prepare Main Content
    const mainContent = `
      <div class="fix-meta" style="display:flex;gap:1rem;margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid var(--border-color);">
        <div class="meta-item" style="display:flex;align-items:center;gap:0.5rem;font-size:0.9rem;color:var(--text-secondary);">
          <span>📦</span> ${this.escapeHtml(fix.component || 'Global')}
        </div>
        <div class="meta-item" style="display:flex;align-items:center;gap:0.5rem;font-size:0.9rem;color:var(--text-secondary);">
          <span>📅</span> ${dateStr}
        </div>
      </div>

      <div class="fix-details" style="display:flex;flex-direction:column;gap:1rem;">
        <div class="detail-row">
          <span class="detail-label" style="display:block;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);margin-bottom:0.25rem;">Error Signature</span>
          <div class="signature-block">${errorSignature}</div>
        </div>

        ${fix.stackTrace ? `
          <div class="detail-row">
            <span class="detail-label" style="display:block;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);margin-bottom:0.25rem;">Stack Trace</span>
            <div class="stack-trace">${this.escapeHtml(fix.stackTrace)}</div>
          </div>
        ` : ''}

        <div class="detail-row">
          <span class="detail-label" style="display:block;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);margin-bottom:0.25rem;">Cause</span>
          ${causeHtml}
        </div>

        <div class="detail-row">
          <span class="detail-label" style="display:block;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);margin-bottom:0.25rem;">Action Taken</span>
          <div class="detail-content">${this.escapeHtml(fix.fix && fix.fix.action ? fix.fix.action : 'No action specified')}</div>
        </div>

        ${fix.fix && fix.fix.code ? `
          <div class="detail-row">
            <span class="detail-label" style="display:block;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);margin-bottom:1rem;">Code Change</span>
            <div class="detail-content">
              <div class="fix-code-block">${this.escapeHtml("```" + this.getLanguage(fix) + "\n" + fix.fix.code + "\n```")}</div>
            </div>
          </div>
        ` : ''}

        <div class="detail-row">
          <span class="detail-label" style="display:block;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);margin-bottom:0.25rem;">File</span>
          ${fix.fix && fix.fix.file ? `
            <code style="background:rgba(0,0,0,0.2);padding:0.2rem 0.4rem;border-radius:3px;display:block;max-height:100px;overflow-y:auto;">${this.escapeHtml(fix.fix.file)}</code>
          ` : '<span style="color: var(--text-muted); font-style: italic; font-size: 0.8rem;">None specified</span>'}
        </div>

        <div class="detail-row">
          <span class="detail-label" style="display:block;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);margin-bottom:0.25rem;">Test Status</span>
          <div class="detail-content" style="display: flex; flex-direction: column; gap: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="color: var(--text-muted); font-size: 0.8rem;">Test Run:</span>
              <span class="${fix.testRun ? 'status-fixed' : 'status-pending'}" style="font-family: monospace; font-size: 0.8rem; color:${fix.testRun ? 'var(--success)' : 'var(--warning)'};">${fix.testRun === true ? 'TRUE' : 'FALSE'}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="color: var(--text-muted); font-size: 0.8rem; flex-shrink: 0;">Test Name:</span>
              ${fix.testName ? `<code style="background:rgba(0,0,0,0.2);padding:0.2rem 0.4rem;border-radius:3px;display:block;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;flex:1;min-width:0;">${this.escapeHtml(fix.testName)}</code>` : '<span style="color: var(--text-muted); font-style: italic; font-size: 0.8rem;">None specified</span>'}
            </div>
          </div>
        </div>
      </div>
    `;

    // Use the base card to build the structure
    // We pass showHeader: true explicitly, and provide content
    const { main } = this.card.buildStructure({
      headerContent: headerContent,
      mainContent: mainContent,
      showHeader: true,
      showMain: true,
      showFooter: false // No footer for now
    });

    // Initialize mdhtml on code blocks
    const codeBlocks = this.querySelectorAll('.fix-code-block');
    codeBlocks.forEach(block => mdhtml(block));

    // Let CSS handle max-height constraints (750px in injected styles)
    // this.style.maxHeight is NOT overridden here to respect the CSS limit

    // Ensure the main content area expands
    if (main) {
      main.style.overflowY = 'visible';
      main.style.flex = '1 1 auto';
      
      // Also ensure internal code blocks don't take up too much space individually
      // (Though the global card scroll handles the overflow, keeping these small helps UX)
      const internalBlocks = main.querySelectorAll('code, .stack-trace, .signature-block');
      internalBlocks.forEach(block => {
        // Only apply scroll container class to non-fix-code blocks (stack trace etc)
        if (!block.closest('.fix-code-block')) {
            block.classList.add('wb-fix-card-scroll-container');
            block.style.maxHeight = '100px';
            block.style.overflowY = 'auto';
            block.style.display = 'block';
        }
      });
    }
  }
}

customElements.define('wb-fix-card', WBFixCard);
