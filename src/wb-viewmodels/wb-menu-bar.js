/**
 * <wb-menu-bar> Custom Element
 * Encapsulates the builder menu bar UI and logic for reuse.
 */
class WBMenuBar extends HTMLElement {
  constructor() {
    super();
  }

  async connectedCallback() {
    await this.loadView();
    this.attachEvents();
  }

  async loadView() {
    try {
      const res = await fetch('src/wb-views/menu-bar.html');
      if (res.ok) {
        this.innerHTML = await res.text();
      } else {
        this.innerHTML = '<div style="color:red">Menu bar failed to load.</div>';
      }
    } catch (e) {
      this.innerHTML = `<div style="color:red">Error loading menu bar: ${e.message}</div>`;
    }
  }

  attachEvents() {
    // Dropdown open/close logic
    this.addEventListener('click', e => {
      const item = e.target.closest('.menu-item');
      if (!item || !item.querySelector('.menu-dropdown')) return;
      if (e.target.closest('.menu-dropdown')) return;
      this.querySelectorAll('.menu-item.open').forEach(m => { if (m !== item) m.classList.remove('open'); });
      item.classList.toggle('open');
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('.menu-item')) this.querySelectorAll('.menu-item.open').forEach(m => m.classList.remove('open'));
    });
    this.querySelectorAll('.menu-action').forEach(a => a.addEventListener('click', () => {
      if (!a.classList.contains('menu-submenu')) {
        this.querySelectorAll('.menu-item.open').forEach(m => m.classList.remove('open'));
      }
    }));
  }
}

customElements.define('wb-menu-bar', WBMenuBar);
export default WBMenuBar;
