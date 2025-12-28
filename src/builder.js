// builder.js
// Auto-generated from builder.schema.json
// Unified builder system for managing components on the builder canvas

const builderState = {
  components: [],
  meta: {}
};

function findComponentIndex(id, components = builderState.components) {
  for (let i = 0; i < components.length; i++) {
    if (components[i].id === id) return i;
    if (components[i].children) {
      const idx = findComponentIndex(id, components[i].children);
      if (idx !== -1) return idx;
    }
  }
  return -1;
}

function findComponentById(id, components = builderState.components) {
  for (const comp of components) {
    if (comp.id === id) return comp;
    if (comp.children) {
      const found = findComponentById(id, comp.children);
      if (found) return found;
    }
  }
  return null;
}

window.builderAPI = {
  add(component, parentId) {
    if (!component || !component.id) throw new Error('Component must have an id');
    if (parentId) {
      const parent = findComponentById(parentId);
      if (!parent) throw new Error('Parent not found');
      parent.children = parent.children || [];
      parent.children.push(component);
    } else {
      builderState.components.push(component);
    }
    renderBuilder();
    return document.querySelector(`[data-builder-id="${component.id}"]`);
  },
  remove(id) {
    function removeFrom(components) {
      const idx = components.findIndex(c => c.id === id);
      if (idx !== -1) {
        components.splice(idx, 1);
        return true;
      }
      for (const c of components) {
        if (c.children && removeFrom(c.children)) return true;
      }
      return false;
    }
    const removed = removeFrom(builderState.components);
    if (removed) renderBuilder();
    return removed;
  },
  update(id, props) {
    const comp = findComponentById(id);
    if (!comp) return null;
    comp.props = { ...comp.props, ...props };
    renderBuilder();
    return document.querySelector(`[data-builder-id="${id}"]`);
  },
  reset() {
    builderState.components = [];
    renderBuilder();
    return true;
  },
  get(id) {
    return document.querySelector(`[data-builder-id="${id}"]`);
  }
};

function renderComponent(comp) {
  // Simple renderer: just a div with type and id, and children
  const el = document.createElement('div');
  el.setAttribute('data-builder-id', comp.id);
  el.className = `builder-comp builder-${comp.type}`;
  el.innerText = `${comp.type} (${comp.id})`;
  if (Array.isArray(comp.children)) {
    for (const child of comp.children) {
      el.appendChild(renderComponent(child));
    }
  }
  return el;
}

function renderBuilder() {
  const root = document.querySelector('[data-wb="builder"]');
  if (!root) return;
  root.innerHTML = '';
  for (const comp of builderState.components) {
    root.appendChild(renderComponent(comp));
  }
}

document.addEventListener('DOMContentLoaded', renderBuilder);
