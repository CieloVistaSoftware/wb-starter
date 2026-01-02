# Card Button

A card with action buttons in the footer. Ideal for confirmations, dialogs, and interactive cards requiring user decisions.

## Overview

| Property | Value |
|----------|-------|
| Behavior | `cardbutton` |
| Semantic | `<article>` |
| Base Class | `wb-card` |
| Category | Cards |
| Icon | 🔘 |

## Inheritance

```
article (semantic) → card.base → cardbutton
```

Card Button **IS-A** card, inheriting semantic structure.
Card Button **HAS-A** button group in the footer.

## Properties

### Inherited from Card Base

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | `"Card with Actions"` | Card title |
| `elevated` | boolean | `false` | Add drop shadow |
| `hoverable` | boolean | `true` | Enable hover effects |

### Card Button Specific

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `content` | string | `""` | Card content/description |
| `primary` | string | **required** | Primary button text |
| `primaryHref` | string | `""` | Primary button link (makes it an `<a>`) |
| `secondary` | string | `""` | Secondary button text |
| `secondaryHref` | string | `""` | Secondary button link (makes it an `<a>`) |

## Usage

### Basic Action Card

<article data-wb="cardbutton"
         data-title="Confirm Action"
         data-primary="OK">
</article>

```html
<article data-wb="cardbutton"
         data-title="Confirm Action"
         data-primary="OK">
</article>
```

### Card with Content

<article data-wb="cardbutton"
         data-title="Delete Item"
         data-content="Are you sure you want to delete this item? This action cannot be undone."
         data-primary="Delete">
</article>

```html
<article data-wb="cardbutton"
         data-title="Delete Item"
         data-content="Are you sure you want to delete this item? This action cannot be undone."
         data-primary="Delete">
</article>
```

### Two Buttons

<article data-wb="cardbutton"
         data-title="Save Changes?"
         data-content="You have unsaved changes."
         data-primary="Save"
         data-secondary="Discard">
</article>

```html
<article data-wb="cardbutton"
         data-title="Save Changes?"
         data-content="You have unsaved changes."
         data-primary="Save"
         data-secondary="Discard">
</article>
```

### Link Buttons

<article data-wb="cardbutton"
         data-title="Get Started"
         data-content="Ready to begin your journey?"
         data-primary="Sign Up"
         data-primary-href="/signup"
         data-secondary="Learn More"
         data-secondary-href="/about">
</article>

```html
<article data-wb="cardbutton"
         data-title="Get Started"
         data-content="Ready to begin your journey?"
         data-primary="Sign Up"
         data-primary-href="/signup"
         data-secondary="Learn More"
         data-secondary-href="/about">
</article>
```

## Structure

<article class="wb-card">
  <!-- Header (when title is set) -->
  <header class="wb-card__header">
    <h3 class="wb-card__title">Confirm Action</h3>
  </header>
  
  <!-- Main content (when content is set) -->
  <main class="wb-card__main">
    <p>Are you sure?</p>
  </main>
  
  <!-- Footer with button group -->
  <footer class="wb-card__footer">
    <div class="wb-card__btn-group">
      <button class="wb-card__btn wb-card__btn--secondary">Cancel</button>
      <button class="wb-card__btn wb-card__btn--primary">Confirm</button>
    </div>
  </footer>
</article>

```html
<article class="wb-card">
  <!-- Header (when title is set) -->
  <header class="wb-card__header">
    <h3 class="wb-card__title">Confirm Action</h3>
  </header>
  
  <!-- Main content (when content is set) -->
  <main class="wb-card__main">
    <p>Are you sure?</p>
  </main>
  
  <!-- Footer with button group -->
  <footer class="wb-card__footer">
    <div class="wb-card__btn-group">
      <button class="wb-card__btn wb-card__btn--secondary">Cancel</button>
      <button class="wb-card__btn wb-card__btn--primary">Confirm</button>
    </div>
  </footer>
</article>
```

### With Link Buttons

<footer class="wb-card__footer">
  <div class="wb-card__btn-group">
    <a href="/about" class="wb-card__btn wb-card__btn--secondary">Learn More</a>
    <a href="/signup" class="wb-card__btn wb-card__btn--primary">Sign Up</a>
  </div>
</footer>

```html
<footer class="wb-card__footer">
  <div class="wb-card__btn-group">
    <a href="/about" class="wb-card__btn wb-card__btn--secondary">Learn More</a>
    <a href="/signup" class="wb-card__btn wb-card__btn--primary">Sign Up</a>
  </div>
</footer>
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.wb-card__footer` | Footer container |
| `.wb-card__btn-group` | Button group container |
| `.wb-card__btn` | Base button styling |
| `.wb-card__btn--primary` | Primary action button |
| `.wb-card__btn--secondary` | Secondary action button |

## Button Rendering

| Property | Has Href? | Renders As |
|----------|-----------|------------|
| `primary` | No | `<button>` |
| `primary` + `primaryHref` | Yes | `<a href="...">` |
| `secondary` | No | `<button>` |
| `secondary` + `secondaryHref` | Yes | `<a href="...">` |

## Events

### wb:cardbutton:primary

Fired when primary button is clicked (when no href).

```javascript
card.addEventListener('wb:cardbutton:primary', (e) => {
  console.log('Primary clicked:', e.detail.text);
});
```

| Property | Type | Description |
|----------|------|-------------|
| `detail.text` | string | Button text |

### wb:cardbutton:secondary

Fired when secondary button is clicked (when no href).

```javascript
card.addEventListener('wb:cardbutton:secondary', (e) => {
  console.log('Secondary clicked:', e.detail.text);
});
```

| Property | Type | Description |
|----------|------|-------------|
| `detail.text` | string | Button text |

## Accessibility

| Element | Implementation |
|---------|----------------|
| Buttons | Native `<button>` or `<a>` elements |
| Focus | Tab order follows DOM order |
| Keyboard | Enter/Space activates buttons |

### Focus Order

1. Card (if focusable)
2. Secondary button (if present)
3. Primary button

## Builder Integration

### Sidebar

```
📁 Cards
└── 🔘 Card Button
```

### Property Panel

| Group | Properties |
|-------|------------|
| Content | title, content |
| Primary Action | primary, primaryHref |
| Secondary Action | secondary, secondaryHref |
| Style | elevated |

### Defaults

```json
{
  "title": "Card with Actions",
  "content": "",
  "primary": "Confirm",
  "primaryHref": "",
  "secondary": "",
  "secondaryHref": ""
}
```

## Test Matrix

| Combination | Expected |
|-------------|----------|
| `title="Test" primary="OK"` | Title and single button |
| `title="Test" primary="Submit" content="Text"` | With content |
| `title="Test" primary="Yes" secondary="No"` | Two buttons |
| `title="Test" primary="Go" primaryHref="/go"` | Primary as link |

## Examples

### Confirmation Dialog

<article data-wb="cardbutton"
         data-title="Delete Account"
         data-content="This will permanently delete your account and all associated data. This action cannot be undone."
         data-primary="Delete Account"
         data-secondary="Cancel"
         data-elevated="true">
</article>

```html
<article data-wb="cardbutton"
         data-title="Delete Account"
         data-content="This will permanently delete your account and all associated data. This action cannot be undone."
         data-primary="Delete Account"
         data-secondary="Cancel"
         data-elevated="true">
</article>
```

### Success Card

<article data-wb="cardbutton"
         data-title="Payment Successful!"
         data-content="Your order #12345 has been confirmed. You will receive an email confirmation shortly."
         data-primary="View Order"
         data-primary-href="/orders/12345"
         data-secondary="Continue Shopping"
         data-secondary-href="/shop">
</article>

```html
<article data-wb="cardbutton"
         data-title="Payment Successful!"
         data-content="Your order #12345 has been confirmed. You will receive an email confirmation shortly."
         data-primary="View Order"
         data-primary-href="/orders/12345"
         data-secondary="Continue Shopping"
         data-secondary-href="/shop">
</article>
```

### Simple Acknowledgment

<article data-wb="cardbutton"
         data-title="Terms Updated"
         data-content="We've updated our terms of service. Please review the changes."
         data-primary="I Understand">
</article>

```html
<article data-wb="cardbutton"
         data-title="Terms Updated"
         data-content="We've updated our terms of service. Please review the changes."
         data-primary="I Understand">
</article>
```

### Call to Action

<article data-wb="cardbutton"
         data-title="Upgrade to Pro"
         data-content="Get unlimited access to all features and priority support."
         data-primary="Upgrade Now"
         data-primary-href="/upgrade"
         data-secondary="Compare Plans"
         data-secondary-href="/pricing">
</article>

```html
<article data-wb="cardbutton"
         data-title="Upgrade to Pro"
         data-content="Get unlimited access to all features and priority support."
         data-primary="Upgrade Now"
         data-primary-href="/upgrade"
         data-secondary="Compare Plans"
         data-secondary-href="/pricing">
</article>
```

### Error Recovery

<article data-wb="cardbutton"
         data-title="Something Went Wrong"
         data-content="We couldn't process your request. Please try again or contact support."
         data-primary="Try Again"
         data-secondary="Contact Support"
         data-secondary-href="/support">
</article>

```html
<article data-wb="cardbutton"
         data-title="Something Went Wrong"
         data-content="We couldn't process your request. Please try again or contact support."
         data-primary="Try Again"
         data-secondary="Contact Support"
         data-secondary-href="/support">
</article>
```

## JavaScript Integration

### Handling Button Clicks

```javascript
const card = document.querySelector('[data-wb="cardbutton"]');

card.addEventListener('wb:cardbutton:primary', (e) => {
  // Handle primary action
  console.log('Primary action:', e.detail.text);
  
  // Example: Close a modal
  // modal.close();
  
  // Example: Submit a form
  // form.submit();
});

card.addEventListener('wb:cardbutton:secondary', (e) => {
  // Handle secondary action
  console.log('Secondary action:', e.detail.text);
  
  // Example: Cancel and close
  // modal.close();
});
```

### Programmatic Button State

```javascript
// Disable primary button
const primaryBtn = card.querySelector('.wb-card__btn--primary');
primaryBtn.disabled = true;
primaryBtn.textContent = 'Processing...';

// Re-enable after operation
setTimeout(() => {
  primaryBtn.disabled = false;
  primaryBtn.textContent = 'Confirm';
}, 2000);
```

## Related

- [Card](./card.md) - Base card component
- [Card Link](./cardlink.md) - Clickable card navigation
- [Modal](../modal.md) - Modal dialog
- [Button](../button.md) - Standalone button
