# Card Draggable Component

## Overview
The `carddraggable` component allows users to move the card around the screen using a drag handle in the header. It implements a custom drag-and-drop logic without external dependencies.

## Internals & Lifecycle

### Initialization
1.  **Positioning**: Sets `position: relative` on the card to allow coordinate manipulation.
2.  **Header Injection**:
    - Adds a drag handle icon (`⋮⋮`) to the header.
    - Sets the cursor to `grab` on the header.
3.  **Event Binding**:
    - `mousedown` (Header): Initiates drag. Records initial `clientX/Y` and element `offsetLeft/Top`. Changes cursor to `grabbing`.
    - `mousemove` (Document): Calculates delta (current mouse pos - start mouse pos) and updates `element.style.left` and `element.style.top`.
    - `mouseup` (Document): Ends drag state. Resets cursor.

### DOM Structure

<article class="wb-card wb-card--draggable" style="position: relative; left: ...; top: ...;">
  <!-- Header with Handle -->
  <header class="wb-card__header wb-card__drag-handle" style="cursor: grab;">
    <span>⋮⋮</span>
    <h3 class="wb-card__title">Title</h3>
  </header>
  
  <!-- Content -->
  <main class="wb-card__main">...</main>
</article>

```html
<article class="wb-card wb-card--draggable" style="position: relative; left: ...; top: ...;">
  <!-- Header with Handle -->
  <header class="wb-card__header wb-card__drag-handle" style="cursor: grab;">
    <span>⋮⋮</span>
    <h3 class="wb-card__title">Title</h3>
  </header>
  
  <!-- Content -->
  <main class="wb-card__main">...</main>
</article>
```

## Attributes
This component primarily uses the base card attributes. It does not have unique configuration attributes beyond the standard title/content.

## Usage Example

<div data-wb="carddraggable" 
     data-title="Drag Me" 
     data-content="Grab the header to move this card around.">
</div>

```html
<div data-wb="carddraggable" 
     data-title="Drag Me" 
     data-content="Grab the header to move this card around.">
</div>
```
