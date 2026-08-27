# Fireworks - wb-starter v3.0

Fireworks burst explosion effect.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-fireworks>` |
| Behavior | `fireworks` |
| Semantic | `<div>` |
| Root CSS Class | `x-fireworks` |
| Category | Effects |
| Schema | `src/wb-models/fireworks.schema.json` |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `count` | number | `30` | Particles per burst |
| `label` | string | `"Fireworks!"` | Button text |
| `showButton` | boolean | `true` | Show trigger button |
| `repeat` | boolean | `false` | Loop animation |
| `delay` | string | `"0s"` | Start delay |
| `duration` | string | `"1.5s"` | Animation duration |
| `colors` | string | `'["#ff0","#f00","#0ff","#f0f"]'` | Particle colors as JSON array |

Wrapped in `<div x-demo>`, so the live behavior renders below with its source shown underneath:

<div x-demo>
<div x-fireworks
  count="50"
  label="Celebrate!">
</div>
</div>

## Usage

### Custom Element

```html
<div x-fireworks
  count="50"
  label="Celebrate!">
</div>
```

### Data Attribute

```html
<div
  x-fireworks
  count="30">
</div>
```

### Auto-Trigger (No Button)

```html
<div x-fireworks
  count="40"
  showButton="false"
  delay="1s">
</div>
```

### Looping Animation

```html
<div x-fireworks
  count="20"
  repeat>
</div>
```

## Generated Structure

```html
<div class="x-fireworks">
  <!-- Button (when showButton is true) -->
  <button class="x-fireworks__button">Fireworks!</button>
  <!-- Particle container -->
  <div class="x-fireworks__container">
    <!-- Particles are dynamically created -->
  </div>
</div>
```

## Methods

| Method | Description |
|--------|-------------|
| `fire()` | Triggers fireworks animation |
| `stop()` | Stops the animation |

```javascript
const fireworks = document.querySelector('x-fireworks');

// Trigger fireworks
fireworks.fire();

// Stop animation
fireworks.stop();
```

## Events

| Event | Description |
|-------|-------------|
| `wb:fireworks:start` | Animation started |
| `wb:fireworks:end` | Animation ended |

```javascript
fireworks.addEventListener('wb:fireworks:start', () => {
  console.log('Fireworks launched!');
});

fireworks.addEventListener('wb:fireworks:end', () => {
  console.log('Fireworks finished!');
});
```

## CSS API

| Variable | Default | Description |
|----------|---------|-------------|
| `--x-fireworks-z-index` | `9999` | Z-index for overlay |

## Schema

Location: `src/wb-models/fireworks.schema.json`
