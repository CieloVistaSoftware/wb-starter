# Form Components

## Overview

WB Behaviors provides accessible, styled form controls with validation support.

---

## Input (`input`)

Text input field with various types.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | string | "text" | Input type |
| `placeholder` | string | "" | Placeholder text |
| `label` | string | "" | Label text |
| `value` | string | "" | Initial value |
| `required` | boolean | false | Required field |
| `disabled` | boolean | false | Disabled state |
| `readonly` | boolean | false | Read-only state |
| `pattern` | string | "" | Validation pattern |
| `minlength` | string | "" | Minimum length |
| `maxlength` | string | "" | Maximum length |

```html
<input data-wb="input" 
       data-type="email" 
       data-label="Email Address" 
       data-placeholder="you@example.com"
       data-required="true">
```

---

## Textarea (`textarea`)

Multi-line text input.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `placeholder` | string | "" | Placeholder text |
| `label` | string | "" | Label text |
| `rows` | string | "4" | Number of rows |
| `resize` | string | "vertical" | Resize: none, vertical, horizontal, both |
| `autosize` | boolean | false | Auto-grow height |

```html
<textarea data-wb="textarea" 
          data-label="Message" 
          data-rows="6" 
          data-autosize="true">
</textarea>
```

---

## Checkbox (`checkbox`)

Checkbox input with label.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | string | "" | Label text |
| `checked` | boolean | false | Checked state |
| `disabled` | boolean | false | Disabled state |
| `indeterminate` | boolean | false | Indeterminate state |

```html
<input data-wb="checkbox" 
       data-label="I agree to the terms" 
       data-checked="true">
```

---

## Radio (`radio`)

Radio button group.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | string | "" | Group name |
| `label` | string | "" | Label text |
| `value` | string | "" | Radio value |
| `checked` | boolean | false | Checked state |
| `disabled` | boolean | false | Disabled state |

```html
<input data-wb="radio" 
       data-name="plan" 
       data-label="Basic" 
       data-value="basic">
```

---

## Select (`select`)

Dropdown select.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | string | "" | Label text |
| `options` | string | "" | Comma-separated options |
| `placeholder` | string | "" | Placeholder option |
| `multiple` | boolean | false | Multi-select |
| `disabled` | boolean | false | Disabled state |

```html
<select data-wb="select" 
        data-label="Country" 
        data-options="USA,Canada,UK,Australia"
        data-placeholder="Select a country">
</select>
```

---

## Switch (`switch`)

Toggle switch (styled checkbox).

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | string | "" | Label text |
| `checked` | boolean | false | On state |
| `disabled` | boolean | false | Disabled state |
| `size` | string | "md" | Size: sm, md, lg |
| `color` | string | "" | Active color |

```html
<input data-wb="switch" 
       data-label="Enable notifications" 
       data-checked="true">
```

---

## Range (`range`)

Range slider input.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | string | "" | Label text |
| `min` | string | "0" | Minimum value |
| `max` | string | "100" | Maximum value |
| `step` | string | "1" | Step increment |
| `value` | string | "50" | Initial value |
| `showValue` | boolean | true | Show current value |

```html
<input data-wb="range" 
       data-label="Volume" 
       data-min="0" 
       data-max="100" 
       data-value="75">
```

---

## Datepicker (`datepicker`)

Date selection input.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | string | "" | Label text |
| `value` | string | "" | Initial date (YYYY-MM-DD) |
| `min` | string | "" | Minimum date |
| `max` | string | "" | Maximum date |
| `format` | string | "YYYY-MM-DD" | Display format |

```html
<input data-wb="datepicker" 
       data-label="Birth Date" 
       data-min="1900-01-01" 
       data-max="2024-12-31">
```

---

## Timepicker (`timepicker`)

Time selection input.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | string | "" | Label text |
| `value` | string | "" | Initial time (HH:MM) |
| `min` | string | "" | Minimum time |
| `max` | string | "" | Maximum time |
| `step` | string | "60" | Step in seconds |

```html
<input data-wb="timepicker" 
       data-label="Appointment Time" 
       data-min="09:00" 
       data-max="17:00">
```

---

## Colorpicker (`colorpicker`)

Color selection input.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | string | "" | Label text |
| `value` | string | "#000000" | Initial color |
| `showInput` | boolean | true | Show hex input |

```html
<input data-wb="colorpicker" 
       data-label="Theme Color" 
       data-value="#6366f1">
```

---

## File (`file`)

File upload input.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | string | "" | Label text |
| `accept` | string | "" | Accepted file types |
| `multiple` | boolean | false | Allow multiple files |
| `maxSize` | string | "" | Max file size (bytes) |
| `dropzone` | boolean | true | Show drop zone |

```html
<input data-wb="file" 
       data-label="Upload Files" 
       data-accept="image/*,.pdf" 
       data-multiple="true">
```

---

## Password (`password`)

Password input with visibility toggle.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | string | "" | Label text |
| `placeholder` | string | "" | Placeholder text |
| `showToggle` | boolean | true | Show visibility toggle |
| `minlength` | string | "" | Minimum length |
| `pattern` | string | "" | Validation pattern |

```html
<input data-wb="password" 
       data-label="Password" 
       data-minlength="8">
```

---

## OTP (`otp`)

One-time password input.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `length` | string | "6" | Code length |
| `type` | string | "numeric" | Type: numeric, alphanumeric |
| `separator` | string | "-" | Separator position |

```html
<input data-wb="otp" 
       data-length="6" 
       data-type="numeric">
```

---

## Autocomplete (`autocomplete`)

Auto-suggest input.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `placeholder` | string | "" | Placeholder text |
| `source` | string | "" | JSON array of options |
| `minLength` | string | "1" | Minimum chars before search |
| `maxResults` | string | "10" | Maximum suggestions |

```html
<input data-wb="autocomplete" 
       data-placeholder="Search..." 
       data-source='["Apple","Banana","Cherry"]'>
```

---

## Rating (`rating`)

Star rating input.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `max` | string | "5" | Maximum stars |
| `value` | string | "0" | Initial rating |
| `half` | boolean | false | Allow half stars |
| `readonly` | boolean | false | Read-only display |

```html
<input data-wb="rating" 
       data-max="5" 
       data-value="4" 
       data-half="true">
```

---

## Masked (`masked`)

Input with format mask.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | string | "" | Label text |
| `mask` | string | "" | Input mask pattern |
| `placeholder` | string | "" | Placeholder text |

**Mask Characters:**
- `9` - Digit (0-9)
- `a` - Letter (A-Z, a-z)
- `*` - Alphanumeric

```html
<input data-wb="masked" 
       data-label="Phone" 
       data-mask="(999) 999-9999">
```

---

## Form Validation

All form components support native HTML5 validation:

```html
<form data-wb="form">
  <input data-wb="input" 
         data-required="true" 
         data-pattern="[A-Za-z]+" 
         data-minlength="3">
  <button type="submit">Submit</button>
</form>
```

### Validation States

```css
.wb-input--valid { }
.wb-input--invalid { }
.wb-input__error { }
```

### Custom Validation Messages

```html
<input data-wb="input" 
       data-required="true"
       data-error-required="This field is required"
       data-error-pattern="Invalid format">
```

---

## Events

| Event | Description | Detail |
|-------|-------------|--------|
| `wb:input:change` | Value changed | `{ value, element }` |
| `wb:input:focus` | Input focused | `{ element }` |
| `wb:input:blur` | Input blurred | `{ element, valid }` |
| `wb:input:validate` | Validation run | `{ element, valid, errors }` |
| `wb:form:submit` | Form submitted | `{ form, data, valid }` |
