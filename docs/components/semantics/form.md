# Form Component Design & User Guide

## 1. Design Philosophy

The `form` component modernizes the standard HTML `<form>` by adding features expected in Single Page Applications (SPAs) without the complexity of a framework. It handles AJAX submission, validation feedback, loading states, and even local auto-saving to prevent data loss.

### Key Features
- **AJAX Submission**: Intercepts standard submit to send data via `fetch`.
- **Auto-Save**: Persists form data to `localStorage` to survive page reloads.
- **Validation UI**: Visual feedback for valid/invalid fields.
- **Loading State**: Automatically disables the submit button and shows a spinner/text.
- **Feedback Messages**: In-form success/error notifications.

## 2. User Guide

### Basic Usage
Add `data-wb="form"` to a `<form>` element.

```html
<form data-wb="form" action="/api/submit">
  <input name="email" required>
  <button type="submit">Send</button>
</form>
```

### Configuration Options
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-ajax` | Boolean | `false` | Enable AJAX submission. |
| `data-validate` | Boolean | `true` | Enable custom validation UI. |
| `data-auto-save` | Boolean | `false` | Save progress to localStorage. |
| `data-loading-text` | String | `Submitting...` | Text to show on button during submit. |
| `data-success-message` | String | `Success!` | Message to show on success. |

### Events
- `wb:form:success`: Fired after successful AJAX submission.
- `wb:form:error`: Fired after failed submission.

## 3. Examples

### Example 1: AJAX Contact Form
A contact form that stays on the page and shows a success message.

```html
<form 
  data-wb="form" 
  data-ajax="true" 
  action="/api/contact" 
  data-success-message="Message sent!">
  <input type="email" name="email" required>
  <textarea name="message" required></textarea>
  <button type="submit">Send Message</button>
</form>
```

### Example 2: Auto-Saving Draft
A long form that saves progress.

```html
<form 
  data-wb="form" 
  data-auto-save="true" 
  id="long-application">
  <!-- fields... -->
</form>
```

## 4. Why It Works
The component intercepts the `submit` event. If `data-ajax` is true, it prevents the default page reload, gathers the data using `FormData`, and sends it via `fetch`. The `auto-save` feature listens for `input` events and serializes the form data to `localStorage` using a key derived from the form's ID.
