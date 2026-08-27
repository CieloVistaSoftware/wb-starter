# Form - wb-starter v3.0

Enhanced form with AJAX submission, validation, and auto-save.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<form>` |
| Behavior | `form` |
| Semantic | `<form>` |
| Root CSS Class | `x-form` |
| Category | Forms |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `action` | string | `""` | Form submission URL |
| `method` | string | `"POST"` | HTTP method |
| `ajax` | boolean | `false` | Enable AJAX submission |
| `validate` | boolean | `true` | Enable custom validation UI |
| `autoSave` | boolean | `false` | Save progress to localStorage |
| `loadingText` | string | `"Submitting..."` | Button text during submit |
| `successMessage` | string | `"Success!"` | Message on success |

Wrapped in `<div x-demo>`, so the live behavior renders below with its source shown underneath:

<div x-demo>
<form action="/api/submit">
  <div x-input
    name="email"
    label="Email"
    required>
  </div>
  <button type="submit">Submit</button>
</form>
</div>

## Usage

### Custom Element

```html
<form action="/api/submit">
  <div x-input
    name="email"
    label="Email"
    required>
  </div>
  <button type="submit">Submit</button>
</form>
```

### Native Form (Enhanced)

`x-form` alone (no `ajax`) only adds the `.x-form` class and a `wbForm` JS API (`getData()`/`reset()`/`submit()`) — the form still submits natively (full page navigation). Add `ajax` for the actual AJAX-submission enhancement.

```html
<form
  ajax
  action="/api/submit">
  <input
    name="email"
    required>
  <button type="submit">Send</button>
</form>
```

### AJAX Submission

```html
<form
  action="/api/contact"
  ajax>
  <div x-input
    name="email"
    label="Email"
    inputType="email"
    required>
  </div>
  <textarea
    name="message"
    label="Message"
    required>
  </textarea>
  <button
    label="Send Message"
    type="submit">
  </button>
</form>
```

### With Auto-Save

```html
<form
  action="/api/application"
  autoSave
  id="application-form">
  <div x-input
    name="name"
    label="Full Name">
  </div>
  <textarea
    name="bio"
    label="Biography">
  </textarea>
  <button
    label="Submit"
    type="submit">
  </button>
</form>
```

### Custom Success Message

```html
<form
  action="/api/newsletter"
  ajax
  successMessage="Thanks for subscribing!">
  <div x-input
    name="email"
    label="Email"
    inputType="email">
  </div>
  <button
    label="Subscribe"
    type="submit">
  </button>
</form>
```

## Generated Structure

```html
<form
  class="x-form"
  action="/api/submit"
  method="POST">
  <!-- Form fields -->
  <div class="x-form__message x-form__message--success"> Success! </div>
</form>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.x-form` | Always | Base styling |
| `.x-form--loading` | Submitting | Submission in progress |
| `.x-form--success` | Success | Successful submission |
| `.x-form--error` | Error | Submission failed |

## Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `submit()` | Submits the form | `Promise` |
| `reset()` | Resets all fields | - |
| `validate()` | Validates all fields | `boolean` |
| `getData()` | Gets form data | `FormData` |
| `setData(data)` | Sets form values | - |
| `clearAutoSave()` | Clears saved data | - |

```javascript
const form = document.querySelector('x-form');

// Submit programmatically
await form.submit();

// Validation
if (form.validate()) {
  console.log('Form is valid');
}

// Get/set data
const data = form.getData();
form.setData({ email: 'user@example.com' });

// Clear auto-saved data
form.clearAutoSave();
```

## Events

| Event | Description | Detail |
|-------|-------------|--------|
| `wb:form:submit` | Form submitted | `{ data: FormData }` |
| `wb:form:success` | Submission successful | `{ response: object }` |
| `wb:form:error` | Submission failed | `{ error: Error }` |
| `wb:form:validate` | Validation completed | `{ valid: boolean }` |

```javascript
form.addEventListener('wb:form:success', (e) => {
  console.log('Success:', e.detail.response);
});

form.addEventListener('wb:form:error', (e) => {
  console.error('Error:', e.detail.error);
});
```

## CSS API

| Variable | Default | Description |
|----------|---------|-------------|
| `--x-form-gap` | `1rem` | Gap between fields |
| `--x-form-message-padding` | `1rem` | Message padding |
| `--x-form-message-radius` | `4px` | Message border radius |
| `--x-form-success-bg` | `var(--success-light)` | Success message background |
| `--x-form-success-color` | `var(--success)` | Success message color |
| `--x-form-error-bg` | `var(--error-light)` | Error message background |
| `--x-form-error-color` | `var(--error)` | Error message color |

## Accessibility

The form behavior maintains native form accessibility:
- `novalidate` attribute when using custom validation
- ARIA attributes for validation states
- Focus management on validation errors
- Screen reader announcements for messages
