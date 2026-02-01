# Confetti - wb-starter v3.0

Colorful confetti explosion effect.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-confetti>` |
| Behavior | `confetti` |
| Semantic | `<div>` |
| Base Class | `wb-confetti` |
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

## Usage

### Custom Element

```html
<wb-confetti count="100" label="Celebrate!"></wb-confetti>
```

### Data Attribute

```html
<div data-wb="confetti" data-wb-count="50" data-wb-label="Party!"></div>
```

### Auto-Trigger (No Button)

```html
<wb-confetti count="75" showButton="false" delay="1s"></wb-confetti>
```

### Looping Animation

```html
<wb-confetti count="30" repeat></wb-confetti>
```

## Generated Structure

```html
<div class="wb-confetti">
  <!-- Button (when showButton is true) -->
  <button class="wb-confetti__button">Fire Confetti!</button>
  
  <!-- Particle container -->
  <div class="wb-confetti__container">
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
const confetti = document.querySelector('wb-confetti');

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
| `--wb-confetti-z-index` | `9999` | Z-index for overlay |

## Schema

Location: `src/wb-models/confetti.schema.json`
