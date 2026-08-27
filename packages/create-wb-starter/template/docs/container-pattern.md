# Container Behaviors Pattern

## Overview

Container behaviors are behaviors that can accept other behaviors as children. This enables building complex nested layouts like:

```
details
  └─ summary
  └─ div (content)
```

## Schema Definition

Container behaviors declare their capability in the schema:

```json
{
  "behavior": "details",
  "container": {
    "enabled": true,
    "dropZone": "div",
    "accepts": ["all"],
    "rejects": ["modal", "drawer"],
    "maxChildren": null,
    "childBehavior": "append"
  }
}
```

### Container Properties

| Property | Type | Description |
|----------|------|-------------|
| `enabled` | boolean | Whether this behavior accepts children |
| `dropZone` | string | CSS selector for the droppable area within the behavior |
| `accepts` | string[] | List of behaviors that can be dropped, or `["all"]` |
| `rejects` | string[] | List of behaviors that cannot be dropped |
| `maxChildren` | number\|null | Maximum number of children, or `null` for unlimited |
| `childBehavior` | string | `"append"` (add to end) or `"replace"` (replace content) |

## Builder Configuration

In `builder.js`, container behaviors are marked with `container: true`. The configuration uses abbreviated keys for compactness:

| Key | Full Name | Description |
|-----|-----------|-------------|
| `n` | Name | Display name in the behavior palette |
| `i` | Icon | Emoji or icon for the behavior |
| `b` | Behavior | The WB-Starter identifier |
| `d` | Data | Default properties object |

```javascript
{ 
  n: 'Details', 
  i: '▶️', 
  b: 'details', 
  d: { open: true },
  container: true,
  dropZone: 'div',
  accepts: ['all'],
  rejects: ['modal', 'drawer', 'offcanvas']
}
```

## Drop Zone Detection

When a behavior is dragged over the canvas, the builder checks:

1. Is the drop target inside a container behavior?
2. If yes, is the dragged behavior in the `accepts` list?
3. If yes, is `maxChildren` not exceeded?
4. If all pass, highlight the drop zone and allow drop

## Implementation

### Drop Handler

```javascript
function handleDrop(e, draggedComponent) {
  const target = e.target;
  
  // Check if dropping into a container
  const container = target.closest('[x-behavior][container]');
  
  if (container) {
    const dropZone = container.querySelector(container.dataset.dropZone || '[drop-zone]');
    
    if (dropZone) {
      // Append to container's drop zone
      addToContainer(draggedComponent, container, dropZone);
      return;
    }
  }
  
  // Default: add to canvas root
  add(draggedComponent);
}
```

### Container Behaviors List

Current container behaviors:
- `details` - Content area accepts children
- `tabs` - Each tab panel can contain any behaviors
- `card` - Main content area accepts children
- `modal` - Body content accepts children
- `drawer` - Content area accepts children
- `collapse` - Content area accepts children
- `grid` - Grid cells accept children
- `flex` - Flex items accept children
- `stack` - Stack items accept children

## Visual Feedback

When dragging over a container:
1. Container gets `drag-over-container` class
2. Drop zone gets `drop-zone-active` class
3. Visual indicator shows where behavior will be inserted

## CSS for Drop Zones

```css
[container] {
  position: relative;
}

[drop-zone] {
  min-height: 40px;
}

.drop-zone-active {
  outline: 2px dashed var(--primary);
  outline-offset: -2px;
  background: rgba(99, 102, 241, 0.1);
}

.drag-over-container {
  box-shadow: 0 0 0 2px var(--primary);
}
```

## Image Drop Special Handling

When an image is dropped into a container:
1. Image is **appended** as a child (not replacing content)
2. Image gets `x-image` behavior
3. Existing content remains intact

```javascript
if (draggedComponent.b === 'image' && container) {
  // Always append images, never replace
  appendImageToContainer(draggedComponent, container);
}
```
