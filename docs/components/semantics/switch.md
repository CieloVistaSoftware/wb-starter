# Switch Component Design & User Guide

> **Note**: This component is currently in early development (Alpha).

## 1. Design Philosophy

The `switch` component is intended to be a toggle-style replacement for checkboxes, commonly used for "On/Off" settings.

## 2. User Guide

### Basic Usage
Add `data-wb="switch"` to an element.

```html
<input type="checkbox" data-wb="switch">
```

## 3. Examples

### Example 1: Basic Placeholder
Currently initializes the component class.

```html
<input type="checkbox" data-wb="switch">
```

## 4. Why It Works
Currently, this component only applies the `wb-switch` class and marks the element as ready. Future versions will wrap the checkbox to create the visual "pill" toggle effect.
