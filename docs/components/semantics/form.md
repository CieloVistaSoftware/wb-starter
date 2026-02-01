# Form - wb-starter v3.0

Enhanced form with AJAX submission, validation, and auto-save.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-form>` |
| Behavior | `form` |
| Semantic | `<form>` |
| Base Class | `wb-form` |
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

## Usage

### Custom Element

```html
<wb-form action="/api/submit">
  <wb-input name="email" label="Email" required></wb-input>
  <wb-button label="Submit" type="submit"></wb-button>
</wb-form>
```

### Native Form (Enhanced)

```html
<form data-wb="form" action="/api/submit">
  <input name="email" required>
  <button type="submit">Send</button>
</form>
```

### AJAX Submission

```html
<wb-form action="/api/contact" ajax>
  <wb-input name="email" label="Email" inputType="email" required></wb-input>
  <wb-textarea name="message" label="Message" required></wb-textarea>
  <wb-button label="Send Message" type="submit"></wb-button>
</wb-form>
```

### With Auto-Save

```html
<wb-form action="/api/application" autoSave id="application-form">
  <wb-input name="name" label="Full Name"></wb-input>
  <wb-textarea name="bio" label="Biography"></wb-textarea>
  <wb-button label="Submit" type="submit"></wb-button>
</wb-form>
```

### Custom Success Message

```html
<wb-form 
  action="/api/newsletter" 
  ajax 
  successMessage="Thanks for subscribing!">
  <wb-input name="email" label="Email" inputType="email"></wb-input>
  <wb-button label="Subscribe" type="submit"></wb-button>
</wb-form>
```

## Generated Structure

```html
<form class="wb-form" action="/api/submit" method="POST">
  <!-- Form fields -->
  <div class="wb-form__message wb-form__message--success">
    Success!
  </div>
</form>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-form` | Always | Base styling |
| `.wb-form--loading` | Submitting | Submission in progress |
| `.wb-form--success` | Success | Successful submission |
| `.wb-form--error` | Error | Submission failed |

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
const form = document.querySelector('wb-form');

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
| `--wb-form-gap` | `1rem` | Gap between fields |
| `--wb-form-message-padding` | `1rem` | Message padding |
| `--wb-form-message-radius` | `4px` | Message border radius |
| `--wb-form-success-bg` | `var(--success-light)` | Success message background |
| `--wb-form-success-color` | `var(--success)` | Success message color |
| `--wb-form-error-bg` | `var(--error-light)` | Error message background |
| `--wb-form-error-color` | `var(--error)` | Error message color |

## Accessibility

The form component maintains native form accessibility:
- `novalidate` attribute when using custom validation
- ARIA attributes for validation states
- Focus management on validation errors
- Screen reader announcements for messages
