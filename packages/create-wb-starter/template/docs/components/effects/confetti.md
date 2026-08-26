# Confetti - wb-starter v3.0

Colorful confetti explosion effect.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-confetti>` |
| Behavior | `confetti` |
| Semantic | `<div>` |
| Root CSS Class | `x-confetti` |
| Category | Effects |
| Schema | `src/wb-models/confetti.schema.json` |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `count` | number | `50` | Number of particles |
| `label` | string | `"Fire Confetti!"` | Button text |
| `showButton` | boolean | `true` | Show trigger button |
| `repeat` | boolean | `false` | Loop animation |
| `delay` | string | `"0s"` | Start delay |
| `duration` | string | `"3s"` | Animation duration |
| `colors` | string | `'["#ff0","#f0f","#0ff","#0f0","#f00"]'` | Particle colors as JSON array |

Wrapped in `<div x-demo>`, so the live component renders below with its source shown underneath:

<div x-demo>
<div x-confetti
  count="100"
  label="Celebrate!">
</div>
</div>

## Usage

### Custom Element

```html
<div x-confetti
  count="100"
  label="Celebrate!">
</div>
```

### Data Attribute

```html
<div
  x-confetti
  count="50"
  label="Party!">
</div>
```

### Auto-Trigger (No Button)

```html
<div x-confetti
  count="75"
  showButton="false"
  delay="1s">
</div>
```

### Looping Animation

```html
<div x-confetti
  count="30"
  repeat>
</div>
```

## Generated Structure

```html
<div class="x-confetti">
  <!-- Button (when showButton is true) -->
  <button class="x-confetti__button">Fire Confetti!</button>
  <!-- Particle container -->
  <div class="x-confetti__container">
    <!-- Particles are dynamically created -->
  </div>
</div>
```

## Methods

| Method | Description |
|--------|-------------|
| `fire()` | Triggers confetti animation |
| `stop()` | Stops the animation |

```javascript
const confetti = document.querySelector('x-confetti');

// Trigger confetti
confetti.fire();

// Stop animation
confetti.stop();
```

## Events

| Event | Description |
|-------|-------------|
| `wb:confetti:start` | Animation started |
| `wb:confetti:end` | Animation ended |

```javascript
confetti.addEventListener('wb:confetti:start', () => {
  console.log('Confetti started!');
});

confetti.addEventListener('wb:confetti:end', () => {
  console.log('Confetti finished!');
});
```

## CSS API

| Variable | Default | Description |
|----------|---------|-------------|
| `--x-confetti-z-index` | `9999` | Z-index for overlay |

## Schema

Location: `src/wb-models/confetti.schema.json`
