# Web Behaviors (WB) Builder – The Heart of the Framework (2026)

> **Version:** 3.1.0  
> **Last Updated:** 2026-01-18  
> **Status:** Active

---

## Overview

WB Builder is the architectural core of WB Framework v3.0. It enables a no-build, schema-driven, Light DOM approach for modern web development. All UI, logic, and styling are defined by JSON schemas, ESM viewmodels, and global CSS.

---

## Page Builder Interface

### Layout Structure

<diagram and content omitted for brevity>

---

## References

- `docs/builder-properties.md` - Property panel details
- `docs/PAGE-BUILDER-RULES.md` - Content rules
- `docs/MVVM-MIGRATION.md` - Architecture
- `BUILDER_SPECS.md` - Full specification

---

## Overwrite-detection and trackedFunctions (developer note)

The builder includes a runtime overwrite-detection mechanism (see `src/builder/builder-init.js`) that helps catch accidental duplicate global function definitions. A few important rules:

- Do NOT add functions to `trackedFunctions` that are intentionally non-configurable (Design-by-Contract) or that are implemented as getters/setters on `BuilderState`.
- Functions protected by DBC often have `configurable: false` and will cause false-positive warnings if tracked.
- If a function must be excluded from tracking, document the reason (DBC / accessor / stub) in the code and in this guide.

Example: `toggleXBehavior`, `updateElementTheme` and several API-entry functions are intentionally excluded from overwrite-detection because they are protected by DBC or implemented by `BuilderState`.

This reduces noisy console warnings and focuses overwrite-detection on truly unprotected globals.

---

**Welcome to the No-Build Revolution.**
