/**
 * WB Page Builder - State Management
 * Centralized state for pages, components, and global sections
 */

// Component tracking
export let draggedComponent = null;
export let selectedComponent = null;
export let components = [];
export let componentIdCounter = 0;

// Global sections (shared header/footer)
export const globalSections = {
  header: [],
  footer: []
};

// Page management
export let pages = [
  { 
    id: 'home', 
    name: 'Home', 
    slug: 'index.html', 
    main: [{
      id: 'comp-home-hero',
      type: 'hero',
      section: 'main',
      html: `<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 4rem 2rem; text-align: center; color: white; border-radius: 8px;">
        <h2 style="font-size: 2.5rem; margin: 0 0 1rem 0;">Welcome to Your Site</h2>
        <p style="font-size: 1.1rem; margin: 0;">Your value proposition goes here</p>
      </div>`,
      data: {}
    }]
  }
];

export let currentPageId = 'home';

// Builder settings
export const builderSettings = {
  snapToGrid: true,
  gridSize: 8,
  showGrid: false,
  autoSave: true
};

// State setters
export function setDraggedComponent(value) { draggedComponent = value; }
export function setSelectedComponent(value) { selectedComponent = value; }
export function setComponents(value) { components = value; }
export function incrementComponentId() { return componentIdCounter++; }
export function setCurrentPageId(value) { currentPageId = value; }
export function setPages(value) { pages = value; }
export function getCurrentPage() { return pages.find(p => p.id === currentPageId); }
export function getPageById(id) { return pages.find(p => p.id === id); }
export function addPage(page) { pages.push(page); }
export function removePage(pageId) { pages = pages.filter(p => p.id !== pageId); }
export function addComponent(component) { components.push(component); }
export function removeComponent(id) { components = components.filter(c => c.id !== id); }
export function getComponentById(id) { return components.find(c => c.id === id); }
export function updateSetting(key, value) { builderSettings[key] = value; }
