import { composeCard } from './card.js';
import { readAttr } from '../core/read-attr.js';
import { mdhtml } from './mdhtml.js';
import { ensureBehaviorCss } from '../core/style-loader.js';
import { centralDate } from '../core/central-time.js';

/**
 * Fix Card Component
 * -----------------------------------------------------------------------------
 * Special card for displaying fix details.
 * 
 * Custom Tag: <div x-fix-card>
 * -----------------------------------------------------------------------------
 */
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return unsafe;
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getLanguage(fix) {
  if (fix.fix && fix.fix.file) {
    if (fix.fix.file.endsWith('.css')) return 'css';
    if (fix.fix.file.endsWith('.html')) return 'html';
    if (fix.fix.file.endsWith('.json')) return 'json';
  }
  return 'js';
}

/**
 * Render one fix record into `host`, using `card` (the composeCard() base the
 * host was composed with) to build the header/main structure.
 *
 * A module function so the SAME renderer serves both authoring forms: the
 * <x-fix-card> tag and <div x-fix-card>. Both reach it through fixCard() at
 * the bottom (#789). While it lived only on a class, the attribute form --
 * the one 4.0.0 made canonical -- had no way to reach it at all.
 */
function renderFixCard(host, card, fix) {
  if (!fix || !card) return;
  
  let statusDisplay = fix.status || 'INCOMPLETE';
  let statusClass = `status-${(statusDisplay).toLowerCase().replace(/\s+/g, '-')}`;

  // Enforce test requirement: No test = Failed (unless Pending)
  if (!fix.testRun && statusDisplay.toUpperCase() !== 'PENDING') {
    statusDisplay = 'TEST MISSING';
    statusClass = 'status-failed'; // Or status-test-missing if preferred, but CSS uses status-failed
  }

  const dateStr = centralDate(fix.date);
  
  const hasCause = fix.cause && fix.cause.trim().length > 0;
  const isMissingBehavior = fix.errorSignature && fix.errorSignature.includes('Unknown behavior');
  const redHoverText = isMissingBehavior ? 'title="CRITICAL: This error indicates a missing behavior file or registration issue, which prevents the component from functioning entirely."' : '';
  
  const causeHtml = hasCause 
    ? `<div class="detail-content ${isMissingBehavior ? 'glow-red' : ''}" ${redHoverText}>${escapeHtml(fix.cause)}</div>`
    : `<div class="detail-content violation">VIOLATION: No cause specified. Fix requirements mandate a known cause.</div>`;

  const errorSignature = (() => {
    const sig = fix.errorSignature;
    if (!sig) return '';   // no signature recorded for this shape of fix — say nothing rather than something wrong
    if (sig.includes('Enhancement')) {
      // Try to find a component doc link - use direct path for simplicity
      // `behavior` is canonical since the components removal -- fix-viewer.html
      // already groups on fix.behavior (line 431). This read still said
      // fix.component, so the two halves of the same page disagreed about
      // what the field is called (#911).
      const compName = (fix.behavior || fix.component || '').split('/').pop().replace('.js', '');
      if (compName) {
        // docs/components/semantics/ does not exist -- the docs live in
        // docs/behaviors/ since the components removal, so every
        // enhancement link in the viewer 404'd (#911).
        return `<a href="/docs/behaviors/${escapeHtml(compName)}.md" target="_blank" class="fix-enhancement-link">Enhancement: See ${escapeHtml(compName)}.md</a>`;
      }
      return escapeHtml(sig);
    }
    return escapeHtml(sig);
  })();

  // Prepare Header Content.
  // Only emit a status id when errorId is present — otherwise multiple cards
  // collapse to a duplicate id="status-undefined" (compliance: unique IDs).
  const errorIdSafe = (fix.errorId != null && String(fix.errorId).length > 0)
    ? escapeHtml(String(fix.errorId))
    : '';
  // `issue` is an issue NUMBER on some records and free text on others --
  // fix-viewer.html falls back to title + problem when a record has none, and
  // tests it with /^[0-9]+$/ before treating it as a number. Prefixing '#'
  // unconditionally turned a text issue into "#Regression check".
  const issueText = fix.issue == null ? '' : String(fix.issue).trim();
  const issueLabel = /^[0-9]+$/.test(issueText) ? `#${issueText}` : issueText;
  const headerContent = `
    <div class="card-header">
      <div class="header-top">
        <div class="fix-id">${errorIdSafe || '—'}</div>
        <span ${errorIdSafe ? `id="status-${errorIdSafe}"` : ''} class="fix-status ${statusClass}">${escapeHtml(statusDisplay)}</span>
      </div>
      <h3 class="fix-title">${escapeHtml(fix.title || issueLabel || 'Untitled fix')}</h3>
    </div>
  `;

  // Prepare Main Content
  const mainContent = `
    <div class="fix-meta">
      <div class="meta-item">
        <span>📦</span> ${escapeHtml(fix.component || 'Global')}
      </div>
      <div class="meta-item">
        <span>📅</span> ${dateStr}
      </div>
    </div>

    <div class="fix-details">
      <div class="detail-row">
        <span class="detail-label">Error Signature</span>
        <div class="signature-block">${errorSignature}</div>
      </div>

      ${fix.stackTrace ? `
        <div class="detail-row">
          <span class="detail-label">Stack Trace</span>
          <div class="stack-trace">${escapeHtml(fix.stackTrace)}</div>
        </div>
      ` : ''}

      <div class="detail-row">
        <span class="detail-label">Cause</span>
        ${causeHtml}
      </div>

      <div class="detail-row">
        <span class="detail-label">Action Taken</span>
        <div class="detail-content">${escapeHtml(fix.fix && fix.fix.action ? fix.fix.action : 'No action specified')}</div>
      </div>

      ${fix.fix && fix.fix.code ? `
        <div class="detail-row">
          <span class="detail-label detail-label--spaced">Code Change</span>
          <div class="detail-content">
            <div class="fix-code-block">${escapeHtml("```" + getLanguage(fix) + "\n" + fix.fix.code + "\n```")}</div>
          </div>
        </div>
      ` : ''}

      <div class="detail-row">
        <span class="detail-label">File</span>
        ${fix.fix && fix.fix.file ? `
          <code class="fix-file">${escapeHtml(fix.fix.file)}</code>
        ` : '<span class="fix-none">None specified</span>'}
      </div>

      <div class="detail-row">
        <span class="detail-label">Test Status</span>
        <div class="detail-content fix-test-status">
          <div class="fix-test-row">
            <span class="fix-test-key">Test Run:</span>
            <span class="fix-test-run ${fix.testRun ? 'status-fixed fix-test-run--yes' : 'status-pending fix-test-run--no'}">${fix.testRun === true ? 'TRUE' : 'FALSE'}</span>
          </div>
          <div class="fix-test-row">
            <span class="fix-test-key fix-test-key--fixed">Test Name:</span>
            ${fix.testName ? `<code class="fix-test-name">${escapeHtml(fix.testName)}</code>` : '<span class="fix-none">None specified</span>'}
          </div>
        </div>
      </div>
    </div>
  `;

  // Use card() to build the structure
  // We pass showHeader: true explicitly, and provide content
  const { main } = card.buildStructure({
    headerContent: headerContent,
    mainContent: mainContent,
    showHeader: true,
    showMain: true,
    showFooter: false // No footer for now
  });

  // Initialize mdhtml on code blocks
  const codeBlocks = host.querySelectorAll('.fix-code-block');
  codeBlocks.forEach(block => mdhtml(block));

  // Let CSS handle max-height constraints (750px in injected styles)
  // this.style.maxHeight is NOT overridden here to respect the CSS limit

  // Ensure the main content area expands
  if (main) {
    // overflow/flex are .x-fix-card__main in fix-card.css (#779).
    main.classList.add('x-fix-card__main');
    
    // Also ensure internal code blocks don't take up too much space individually
    // (Though the global card scroll handles the overflow, keeping these small helps UX)
    const internalBlocks = main.querySelectorAll('code, .stack-trace, .signature-block');
    internalBlocks.forEach(block => {
      // Only apply scroll container class to non-fix-code blocks (stack trace etc)
      if (!block.closest('.fix-code-block')) {
          // max-height/overflow/display come with the class (fix-card.css, #779).
          block.classList.add('x-fix-card-scroll-container');
      }
    });
  }
}

// #365 / #660: the behavior for the attribute form, <div x-fix-card>.
//
// This used to add one class and return, on the claim that "the real work
// happens in WBFixCard's connectedCallback via the native custom-element
// upgrade that importing this module triggers". That upgrade only ever
// happens to an element whose TAG is x-fix-card. A <div> cannot be upgraded
// to a custom element class, so on the canonical 4.0.0 form -- the one the
// schema's examples and tests/regression/schema-tags-render-audit.spec.ts use --
// nothing added .x-fix-card, no card was composed, and `.data = fix` created a
// plain property that rendered nothing. The behavior was inert while its
// comments said it was live.
//
// Composition instead of a class (Tier 1: capability is applied by a
// behavior function, never acquired by subclassing): compose the card base on
// the element, then give the element a `data` accessor wired to the renderer.
// The <x-fix-card> tag gets exactly this too, through the shim at the bottom.

// Elements this behavior is attached to, so the tag shim and WB.scan() reaching
// the same <x-fix-card> compose one card, not two.
const attached = new WeakSet();

export default function fixCard(element) {
  element.classList.add('x-fix-card');
  if (attached.has(element)) return () => {};
  attached.add(element);

  ensureBehaviorCss('fix-card');
  const base = composeCard(element, {
    ...element.dataset,
    behavior: element.getAttribute('behavior') || 'card',
    variant: element.getAttribute('variant') || 'default',
    title: element.getAttribute('title') || readAttr(element, 'title'),
    subtitle: element.getAttribute('subtitle') || readAttr(element, 'subtitle'),
    footer: element.getAttribute('footer') || readAttr(element, 'footer'),
  });

  // A value assigned before the behavior attached (the element existed, the
  // lazy-loader had not reached it yet) is a plain own property; honour it
  // rather than shadow it with an accessor that starts empty.
  let fixData = Object.prototype.hasOwnProperty.call(element, 'data') ? element.data : null;
  Object.defineProperty(element, 'data', {
    configurable: true,
    enumerable: true,
    get: () => fixData,
    set: (fix) => { fixData = fix; renderFixCard(element, base, fixData); },
  });
  if (fixData) renderFixCard(element, base, fixData);

  return () => {
    attached.delete(element);
    delete element.data;
    if (base && typeof base.cleanup === 'function') base.cleanup();
    element.classList.remove('x-fix-card');
  };
}

// Registration shim for the <x-fix-card> TAG (#911, #789).
//
// Without a definition the Custom Elements API leaves every <x-fix-card> inert:
// nothing composes the card and `.data = fix` renders nothing. The fix-card
// behavior itself is reachable as <div x-fix-card> through tag-map.js,
// wb-viewmodels/index.js, behavior-css-manifest.js and wb-lazy.js's eager list.
//
// #789: this used to be `class WBFixCard extends WBCard`, a variant subclassing
// another component -- the two-level hierarchy Tier 1 §2 forbids. It is now the
// shape §2 permits: a class the Custom Elements API requires, extending only
// HTMLElement and holding no behavior logic. It applies fixCard() to itself
// on connect, exactly as WB.scan() applies it to a <div x-fix-card>, so the two
// forms cannot drift. tests/compliance/no-component-inheritance-in-source.spec.ts
// fails if a class extends anything but a platform base again.
class XFixCardElement extends HTMLElement {
  connectedCallback() {
    // Composed once, on first connect, and kept: a move (disconnect, then
    // connect elsewhere) keeps the card and its record. card.js's cleanup does
    // not remove the DOM it built, so tearing down and composing again on
    // every move stacked a second header on the card. A record set while
    // detached (createElement, .data =, append) is an own property, which
    // fixCard() picks up; fixCard() also ignores a second call on one element.
    fixCard(this);
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('x-fix-card')) {
  customElements.define('x-fix-card', XFixCardElement);
}
