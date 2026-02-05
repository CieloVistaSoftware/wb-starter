/**
 * Favorites system for quick access to starred components.
 * - Star/unstar, localStorage persistence.
 */
export function cc() {}

import { toast } from './builder-utils.js';

// Get favorites from localStorage
let favorites = JSON.parse(localStorage.getItem('wb-favorites') || '[]');

/**
 * Get current favorites list
 * @returns {string[]} Array of behavior names
 */
export function getFavorites() {
  return favorites;
}

/**
 * Render favorites section in sidebar
 * @param {Object} componentsList - The C.All components list
 */
export function renderFavorites(componentsList = null) {
  const section = document.getElementById('favoritesSection');
  const list = document.getElementById('favoritesList');

  if (!section || !list) return;

  if (favorites.length === 0) {
    section.classList.remove('has-items');
    return;
  }

  section.classList.add('has-items');
  list.innerHTML = '';

  // Get components list from window if not provided
  const allComponents = componentsList || (window.C && window.C.All) || [];

  favorites.forEach(behavior => {
    const comp = allComponents.find(c => c.b === behavior);
    if (!comp) return;

    const item = document.createElement('div');
    item.className = 'comp-item favorite';
    item.draggable = true;
    item.dataset.c = JSON.stringify(comp);
    item.innerHTML = `
      <span class="comp-icon">${comp.i}</span>
      <span class="comp-name">${comp.n}</span>
      <button class="comp-fav" onclick="event.stopPropagation(); toggleFavorite('${comp.b}')" title="Remove from favorites">★</button>
    `;

    item.ondragstart = (e) => {
      e.dataTransfer.setData('c', JSON.stringify(comp));
      e.dataTransfer.effectAllowed = 'copy';
    };

    list.appendChild(item);
  });
}

/**
 * Toggle a behavior as favorite
 * @param {string} behavior - The behavior name to toggle
 */
export function toggleFavorite(behavior) {
  const idx = favorites.indexOf(behavior);
  if (idx >= 0) {
    favorites.splice(idx, 1);
    toast(`Removed from favorites`);
  } else {
    favorites.push(behavior);
    toast(`Added to favorites`);
  }
  localStorage.setItem('wb-favorites', JSON.stringify(favorites));
  renderFavorites();
  
  // Re-render main list to update star states
  if (window.renderList) window.renderList();
}

/**
 * Clear all favorites
 */
export function clearFavorites() {
  if (confirm('Clear all favorites?')) {
    favorites = [];
    localStorage.setItem('wb-favorites', JSON.stringify(favorites));
    renderFavorites();
    if (window.renderList) window.renderList();
    toast('Favorites cleared');
  }
}

/**
 * Check if a behavior is favorited
 * @param {string} behavior - The behavior name
 * @returns {boolean}
 */
export function isFavorite(behavior) {
  return favorites.includes(behavior);
}

// Expose globally
window.toggleFavorite = toggleFavorite;
window.clearFavorites = clearFavorites;
window.renderFavorites = renderFavorites;
window.getFavorites = getFavorites;
window.isFavorite = isFavorite;
