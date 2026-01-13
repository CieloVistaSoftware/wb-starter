# Property Viewer (Right Panel)

## Overview

The **Property Viewer** refers to the dynamic right-hand panel in the Web Behaviors (WB) Builder interface. Historically separated into distinct tabs, the listener interfaces have been unified into a **Split View** to improve workflow efficiency.

## Split View UX

Instead of toggling between the Component Tree and Properties Panel, the default "Tree" view (🌳) now displays **both simultaneously**:

1.  **Top Section (Component Tree)**:
    *   Occupies the upper 50% of the panel (flex-grow).
    *   Scrolls independently.
    *   Shows the hierarchy of all components on the page.
    *   Allows for drag-and-drop reordering.

2.  **Bottom Section (Properties Panel)**:
    *   Occupies the lower 50% of the panel.
    *   Scrolls independently.
    *   **Dynamic State**:
        *   **Empty State**: Shows "Select a component" when nothing is selected.
        *   **Active State**: Instantly populates with controls when a component is clicked in the Tree or Canvas.

## Key Features

*   **Unified Context**: Users can see where an element lives in the hierarchy while editing its properties.
*   **Persistent Visibility**: The properties panel does not hide when navigating the tree.
*   **Independent Scrolling**: Large trees and complex property lists do not conflict; each has its own scroll container.
*   **Visual Separation**: A border divider helps distinguish the navigation area from the editing area.

## Technical Implementation

### Controller Logic (`src/wb-viewmodels/builder-app/index.js`)

The core logic resides in `window.switchPanelTab`. When the `'tree'` tab is activated, the system enforces a flex-column layout:

```javascript
// src/wb-viewmodels/builder-app/index.js

window.switchPanelTab = (tab) => {
  // ...
  if (tab === 'tree') {
    // 1. Activate Tree
    treeTab?.classList.add('active');
    componentList.style.display = 'flex'; // Top half

    // 2. Force Properties Panel Visibility
    if (propsPanel) {
      propsPanel.style.display = 'flex';
      propsPanel.classList.add('open');
      propsPanel.style.flex = '1';       // Share vertical space evenly
      propsPanel.style.overflowY = 'auto'; // scrollable
      propsPanel.style.minHeight = '0';  // prevent flex overflow
    }
    
    // 3. Render contents if selection exists
    if (window.sel) {
      renderProps(window.sel);
    }
  }
  // ...
};
```

### Rendering Logic (`renderProps`)

The rendering function manages the "subtitle" state to keep the UI clean:

```javascript
function renderProps(w, scrollToProperty = null) {
  // ...
  // Hide the "Select a component" subtitle when content is loaded
  const propsHeader = document.getElementById('propsHeader');
  if (propsHeader) {
     const subtitle = propsHeader.querySelector('span');
     if (subtitle) subtitle.style.display = 'none';
  }
  // ...
}
```

Conversely, deselecting (via `resetCanvas` or `Escape` key) restores the empty state and subtitle.

## CSS Architecture

The split view relies on the parent container `#panelRight` having:
*   `display: flex`
*   `flex-direction: column`
*   `height: 100%`

The children (`.panel-right-list` for tree, `.props-panel` for properties) use:
*   `flex: 1` (or specific basis)
*   `overflow-y: auto`
*   `min-height: 0` (Crucial for nested flex scrolling)

## Future Improvements

*   **Resizable Split**: Add a drag handle between the Tree and Properties sections to allow users to adjust the 50/50 split.
*   **Collapse State**: Allow double-clicking the divider to collapse the tree temporarily.
