# wb-starter Escape Hatches

Override or customize any WB-Starter behavior behavior when defaults don't fit your needs.

## CSS Custom Properties

Every behavior respects CSS variables for styling overrides:

```css
/* Override card styling */
x-card {
  --card-padding: 2rem;
  --card-radius: 0;
  --card-bg: transparent;
  --card-border: 2px solid red;
}

/* Override button styling */
button {
  --btn-padding: 1rem 2rem;
  --btn-radius: 999px;
}

/* Override any behavior's gap */
x-grid {
  --gap: 2rem;
}
```

## Skip Auto-Injection

Prevent WB from automatically applying behaviors to an element with
`x-ignore`. It opts that one element out of every behavior, the one its tag
would inject and any `x-*` it carries (#1168); its children are still enhanced.
There is no `skip` or `skip-children` attribute.

<div x-demo>
<button x-ignore>Not enhanced by WB</button>
<button>Enhanced</button>
</div>

## Override Behavior Options

Pass options as plain attributes on the element, named as the behavior's
schema names them:

<div x-demo>
<article
  title="Compact card"
  variant="bordered"
  size="sm">
  Small and outlined.
</article>
<button
  x-toast
  message="This stays for 10 seconds"
  duration="10000">
  Show for 10 seconds
</button>
</div>

## Override Injected CSS

WB behaviors inject minimal CSS. Override with higher specificity:

```css
/* Override injected styles */
x-card.custom {
  all: unset; /* Nuclear option - removes ALL styles */
  display: block;
}

/* Or target specific properties */
button.my-button {
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
<article>
  <h3>Title</h3>
  <p>Content</p>
</article>
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
