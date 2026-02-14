# wb-starter Escape Hatches

Override or customize any Web Behaviors (WB) component behavior when defaults don't fit your needs.

## CSS Custom Properties

Every component respects CSS variables for styling overrides:

```css
/* Override card styling */
wb-card {
  --card-padding: 2rem;
  --card-radius: 0;
  --card-bg: transparent;
  --card-border: 2px solid red;
}

/* Override button styling */
button[x-behavior="button"] {
  --btn-padding: 1rem 2rem;
  --btn-radius: 999px;
}

/* Override any component's gap */
wb-grid {
  --gap: 2rem;
}
```

## Skip Auto-Injection

Prevent WB from automatically applying behaviors to elements:

```html
<!-- Skip specific element -->
<pre data-wb-skip>This won't get syntax highlighting</pre>

<!-- Ignore auto-injection for this element -->
<button x-ignore>Not enhanced by WB</button>

<!-- Skip all children -->
<div data-wb-skip-children>
  <code>Not highlighted</code>
  <button>Not enhanced</button>
</div>
```

## Override Behavior Options

Pass options via `data-*` attributes:

```html
<!-- Override mdhtml defaults -->
<wb-mdhtml 
  data-size="lg" 
  data-highlight="false"
  data-breaks="false">
</wb-mdhtml>

<!-- Override card variant -->
<wb-card data-variant="outline" data-size="sm">
</wb-card>

<!-- Override toast duration -->
<button x-behavior="toast" data-duration="10000">
  Show for 10 seconds
</button>
```

## Override Injected CSS

WB components inject minimal CSS. Override with higher specificity:

```css
/* Override injected styles */
wb-card.custom {
  all: unset; /* Nuclear option - removes ALL styles */
  display: block;
}

/* Or target specific properties */
[x-behavior="button"].my-button {
  background: var(--my-brand-color) !important;
}
```

## Disable Behaviors Programmatically

```javascript
// Remove a specific behavior
WB.remove(element, 'tooltip');

// Remove all behaviors from element
WB.remove(element);

// Check if behavior is applied
const applied = WB.applied.get(element);
console.log(applied); // [{ name: 'card', cleanup: fn }, ...]
```

## Use Raw Elements

Just don't use WB attributes/tags:

```html
<!-- This is just a regular div, WB doesn't touch it -->
<div class="my-card">
  <h3>Title</h3>
  <p>Content</p>
</div>

<!-- vs WB-enhanced -->
<wb-card>
  <h3>Title</h3>
  <p>Content</p>
</wb-card>
```

## Override Theme Variables

```css
:root {
  /* Override any theme variable */
  --primary: #ff6b6b;
  --bg-primary: #1a1a2e;
  --text-primary: #eee;
  --radius-md: 0; /* Square corners everywhere */
}
```

## Custom Behavior Registration

Add your own behaviors that override or extend built-ins:

```javascript
// In your app's init
import { WB } from '/src/core/wb-lazy.js';

// Register a custom card variant
WB.register('card-fancy', (element, options) => {
  // Your custom logic
  element.classList.add('fancy-card');
  
  // Return cleanup function
  return () => {
    element.classList.remove('fancy-card');
  };
});
```

## Debug Mode

Enable debug output to see what WB is doing:

```javascript
WB.init({
  debug: true,
  autoInject: true // See what gets auto-injected
});
```

## Force Re-scan

If dynamic content isn't getting behaviors:

```javascript
// Scan specific container
WB.scan(document.querySelector('#dynamic-content'));

// Or manually inject
WB.inject(myElement, 'card');
```
