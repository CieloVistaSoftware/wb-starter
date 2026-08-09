
# Error Message Standard

> **Location:** docs/architecture/standards/ERROR-MESSAGE.md
> **Last Updated:** 2026-02-14

## Error Handling and Message Conventions

### Invalid Attribute Values
Behaviors should handle invalid values gracefully:

```javascript
// In behavior code
const size = element.getAttribute('size');
const validSizes = ['xs', 'sm', 'md', 'lg', 'xl'];
if (size && !validSizes.includes(size)) {
  console.warn(`[component] Invalid size "${size}". Using default "md".`);
}
```

### Missing Required Attributes
```javascript
// Warn but don't crash
const src = element.getAttribute('src');
if (!src) {
  console.warn(`[image-card] Missing required attribute "src"`);
  // Show placeholder or fallback
}
```

### Attribute Validation in Schema
```json
{
  "properties": {
    "variant": {
      "type": "string",
      "enum": ["primary", "secondary", "warning", "error"],
      "default": "primary",
      "errorMessage": "variant must be one of: primary, secondary, warning, error"
    }
  }
}
```

---


## Error Handler & Logging System

All errors are captured and logged using a global error handler and the error-logger system:

- Errors are logged with fields: `timestamp`, `type`, `context`, `message`, `stack`, `filename`, `lineno`, `colno`, `url`, `userAgent`, and now `to` (see src/index.js and src/core/error-logger.js).
- The `to` field is used to clarify where the error message was intended for (e.g., a handler, module, or UI component).
- Errors are displayed in a UI panel and saved to `data/errors.json`.
- All errors include context, file, line, stack trace, and (optionally) a `to` field for traceability.

### Example Error Object
```json
{
  "timestamp": "2026-02-14T18:00:00.000Z",
  "type": "UNCAUGHT_ERROR",
  "context": "window.onerror",
  "message": "Cannot read property 'foo' of undefined",
  "stack": "TypeError: Cannot read property...",
  "filename": "/src/main.js",
  "lineno": 42,
  "colno": 13,
  "to": "UserNotificationPanel",
  "url": "http://localhost:52100/",
  "userAgent": "Mozilla/5.0 ..."
}
```

### UI Display
- Errors are shown in a floating panel with copy/clear/close controls.
- Each error shows the message, file/line, and stack (if available).

---

- Always use clear, component-prefixed warnings (e.g., `[component] ...`).
- Never crash on user error—fallback or warn.
- Use the `errorMessage` property in schemas for validation errors.
- See this file for all error message conventions and the error-logger structure.
