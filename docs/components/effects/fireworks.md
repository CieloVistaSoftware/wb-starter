# Fireworks - WB Framework v3.0

Fireworks burst explosion effect.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-fireworks>` |
| Behavior | `fireworks` |
| Semantic | `<div>` |
| Base Class | `wb-fireworks` |
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

## Usage

### Custom Element

```html
<wb-fireworks count="50" label="Celebrate!"></wb-fireworks>
```

### Data Attribute

```html
<div data-wb="fireworks" data-wb-count="30"></div>
```

### Auto-Trigger (No Button)

```html
<wb-fireworks count="40" showButton="false" delay="1s"></wb-fireworks>
```

### Looping Animation

```html
<wb-fireworks count="20" repeat></wb-fireworks>
```

## Generated Structure

```html
<div class="wb-fireworks">
  <!-- Button (when showButton is true) -->
  <button class="wb-fireworks__button">Fireworks!</button>
  
  <!-- Particle container -->
  <div class="wb-fireworks__container">
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
const fireworks = document.querySelector('wb-fireworks');

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
| `--wb-fireworks-z-index` | `9999` | Z-index for overlay |

## Schema

Location: `src/wb-models/fireworks.schema.json`
