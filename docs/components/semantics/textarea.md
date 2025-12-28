# Textarea Component Design & User Guide

## 1. Design Philosophy

The `textarea` component improves the multi-line text input experience. Standard textareas have a fixed height and offer no feedback on length limits. This component solves those issues with auto-sizing logic and a built-in character counter.

### Key Features
- **Auto-Size**: Automatically expands height to fit content.
- **Character Count**: Real-time counter with visual warning near limit.
- **Min/Max Rows**: Control the initial and maximum expansion height.

## 2. User Guide

### Basic Usage
Add `data-wb="textarea"` to a `<textarea>` element.

```html
<textarea data-wb="textarea"></textarea>
```

### Configuration Options
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-autosize` | Boolean | `false` | Enable auto-expanding height. |
| `data-show-count` | Boolean | `false` | Show character counter. |
| `data-max-length` | Number | `0` | Max characters (0 = unlimited). |
| `data-min-rows` | Number | `2` | Minimum height in rows. |
| `data-max-rows` | Number | `10` | Maximum height in rows before scrolling. |

## 3. Examples

### Example 1: Comment Box
An auto-expanding box for comments.

```html
<textarea 
  data-wb="textarea" 
  data-autosize="true" 
  placeholder="Write a comment..."></textarea>
```

### Example 2: Limited Bio
A bio field with a strict character limit.

```html
<textarea 
  data-wb="textarea" 
  data-show-count="true" 
  data-max-length="140" 
  placeholder="Short bio..."></textarea>
```

## 4. Why It Works
For auto-sizing, the component listens to the `input` event. On every keystroke, it resets the height to `auto` to correctly calculate the `scrollHeight`, then sets the height to that value (clamped by `maxRows`). The character counter is a separate `div` injected after the textarea, updated in real-time.
