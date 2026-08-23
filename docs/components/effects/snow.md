# Snow - wb-starter v3.0

Falling snow animation effect.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-snow>` |
| Behavior | `snow` |
| Semantic | `<div>` |
| Root CSS Class | `<div x-snow>` |
| Category | Effects |
| Schema | `src/wb-models/snow.schema.json` |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `count` | number | `30` | Number of snowflakes |
| `label` | string | `"Let it Snow!"` | Button text |
| `showButton` | boolean | `true` | Show trigger button |
| `repeat` | boolean | `true` | Loop animation |
| `delay` | string | `"0s"` | Start delay |
| `duration` | string | `"8s"` | Fall duration |

Wrapped in `<wb-demo>`, so the live component renders below with its source shown underneath:

<wb-demo>
<wb-snow
  count="100"
  label="Snow!">
</div>
</wb-demo>

## Usage

### Custom Element

```html
<wb-snow
  count="100"
  label="Snow!">
</div>
```

### Data Attribute

```html
<div
  x-snow
  count="50">
</div>
```

### Background Snow (Auto-Start)

```html
<wb-snow
  count="100"
  showButton="false"
  repeat>
</div>
```

### Single Pass (No Loop)

```html
<wb-snow
  count="50"
  repeat="false">
</div>
```

## Generated Structure

```html
<div class="wb-snow">
  <!-- Button (when showButton is true) -->
  <button class="wb-snow__button">Let it Snow!</button>
  <!-- Snowflake container -->
  <div class="wb-snow__container">
    <!-- Snowflakes are dynamically created -->
  </div>
</div>
```

## Methods

| Method | Description |
|--------|-------------|
| `start()` | Starts snow animation |
| `stop()` | Stops snow animation |
| `toggle()` | Toggles snow on/off |

```javascript
const snow = document.querySelector('wb-snow');

// Start snow
snow.start();

// Stop snow
snow.stop();

// Toggle
snow.toggle();
```

## Events

| Event | Description |
|-------|-------------|
| `wb:snow:start` | Animation started |
| `wb:snow:stop` | Animation stopped |

```javascript
snow.addEventListener('wb:snow:start', () => {
  console.log('Snow started falling!');
});

snow.addEventListener('wb:snow:stop', () => {
  console.log('Snow stopped!');
});
```

## CSS API

| Variable | Default | Description |
|----------|---------|-------------|
| `--wb-snow-z-index` | `9999` | Z-index for overlay |
| `--wb-snow-color` | `#ffffff` | Snowflake color |

## Schema

Location: `src/wb-models/snow.schema.json`
