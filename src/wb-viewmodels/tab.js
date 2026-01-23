/**
 * WB Tab Behavior
 * -----------------------------------------------------------------------------
 * Individual tab panel for use inside <wb-tabs>
 * 
 * Custom Tag: <wb-tab>
 * Parent: <wb-tabs>
 * -----------------------------------------------------------------------------
 * 
 * Properties:
 *   title     - Tab button label text (required)
 *   icon      - Icon (emoji or icon class) shown before title
 *   disabled  - Tab cannot be selected
 *   closable  - Shows close button on tab
 *   badge     - Badge text/count shown on tab
 *   lazy      - Content only renders when tab is first activated
 *   active    - Tab is initially active
 * 
 * Usage:
 *   <wb-tabs>
 *     <wb-tab title="First">Content 1</wb-tab>
 *     <wb-tab title="Second" icon="📊">Content 2</wb-tab>
 *     <wb-tab title="Third" disabled>Content 3</wb-tab>
 *   </wb-tabs>
 * -----------------------------------------------------------------------------
 */
export function tab(element, options = {}) {
  element.classList.add('wb-tab');
  element.dataset.wbReady = 'tab';
  
  // The <wb-tab> element is processed by its parent <wb-tabs>.
  // This behavior just marks it as ready and adds the base class.
  // All tab functionality (activation, events, etc.) is handled by wb-tabs.
  
  return () => {
    element.classList.remove('wb-tab');
  };
}

export default tab;
