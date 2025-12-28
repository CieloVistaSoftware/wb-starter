# Rating Component Design & User Guide

> **Note**: This component is currently in early development (Alpha).

## 1. Design Philosophy

The `rating` component is designed to provide a star-based rating input. It will eventually support interactive voting, read-only display, and fractional stars.

## 2. User Guide

### Basic Usage
Add `data-wb="rating"` to a container.

```html
<div data-wb="rating"></div>
```

## 3. Examples

### Example 1: Basic Placeholder
Currently initializes the component class.

```html
<div data-wb="rating"></div>
```

## 4. Why It Works
Currently, this component only applies the `wb-rating` class and marks the element as ready. Future versions will inject the star icons and handle click/hover events.
