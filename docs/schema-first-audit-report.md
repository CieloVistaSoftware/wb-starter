# Schema-First Architecture Audit Report
[Edit this file](vscode://file/c:/Users/jwpmi/Downloads/AI/wb-starter/docs/schema-first-audit-report.md)

This report identifies components that need to be refactored to comply with the **Schema-First Architecture**.
The goal is to ensure that JavaScript behaviors act as **Enhancers** (hydrating existing DOM) rather than **Builders** (overwriting DOM).

| Attribute Name | File Location | Schema Update Needed | Steps to Convert |
| :--- | :--- | :---: | :--- |
| **Card** | `src/behaviors/js/card.js` | **TRUE** | 1. **Decouple Validation**: Update `validateSemanticContainer` to allow standard tags (`ARTICLE`, `SECTION`, `DIV`) OR any Custom Element (tag with hyphen), removing the hardcoded allowlist.<br>2. **MVVM/Enhancer Pattern**: Refactor `cardBase` to check for existing structure (`header`, `main`, `footer`) and *bind* to it (Enhancer) instead of injecting new elements (Builder), unless the structure is completely missing.<br>3. Update all variants to check for existing semantic structure before building. |
| **Collapse** | `src/behaviors/js/collapse.js` | **TRUE** | 1. Check if `.wb-collapse__trigger` and `.wb-collapse__content` already exist.<br>2. If they exist, attach event listeners to them.<br>3. Only build structure from scratch if they are missing. |
| **Tabs** | `src/behaviors/js/tabs.js` | **TRUE** | 1. Check if `.wb-tabs__nav` and `.wb-tabs__panels` already exist.<br>2. If they exist, attach event listeners.<br>3. Only build from `element.children` if the structure is missing. |
| **Dropdown** | `src/behaviors/js/dropdown.js` | **TRUE** | 1. Check if `.wb-dropdown__trigger` and `.wb-dropdown__menu` already exist.<br>2. If they exist, attach event listeners.<br>3. Only build structure if missing. |
| **Tooltip** | `src/behaviors/js/tooltip.js` | FALSE | None (Already compliant). |
| **Hero** | `src/behaviors/js/hero.js` | **TRUE** | 1. Check if `.wb-hero__content` exists.<br>2. If it exists, enhance it.<br>3. Only build from scratch if content is missing. |
| **Footer** | `src/behaviors/js/footer.js` | **TRUE** | 1. Check if `.wb-footer__left`, `.wb-footer__center`, or `.wb-footer__right` exist.<br>2. If they exist, preserve them.<br>3. Only build structure if missing. |
| **Header** | `src/behaviors/js/header.js` | **TRUE** | 1. Check if `.wb-header__left`, `.wb-header__center`, or `.wb-header__right` exist.<br>2. If they exist, preserve them.<br>3. Only build structure if missing. |
| **Navigation** | `src/behaviors/js/navigation.js` | **TRUE** | 1. For Sidebar, Menu, Pagination, Steps, Treeview, and Statusbar: Check for existing structure before building.<br>2. If structure exists, attach listeners/enhance.<br>3. Navbar, BackToTop, and Link are already compliant. |
| **Overlay** | `src/behaviors/js/overlay.js` | FALSE | None (Already compliant). |
| **WBCard** | `src/behaviors/js/wb-card.js` | **TRUE** | 1. Check if element has children in `connectedCallback`.<br>2. If children exist, skip `buildStructure()`.<br>3. Ensure `cardBase` logic supports enhancing existing content. |

## Next Steps
1.  **Implement MVVM Directory Structure** (Layered Architecture selected to support Behavior Modules):
    *   **`src/wb-models/`**: Create this folder to hold JSON Schemas (e.g., `parts.schema.json`, `audio.schema.json`).
    *   **`src/wb-views/`**: Rename `src/parts/` to `src/wb-views/`. This will hold the HTML templates.
    *   **`src/wb-viewmodels/`**: Move behavior logic from `src/behaviors/js/` to `src/wb-viewmodels/`.
    *   *Note: Update `src/behaviors/index.js` to import from `../wb-viewmodels/` instead of `./js/`.*
2.  **Rename Concepts**:
    *   `WB Parts` → `WB Views`.
    *   Attribute `<template wb-part="...">` → `<template wb-view="...">`.
3.  **Centralize Templates**: Move all `<template wb-view="...">` definitions to `src/templates/` (or keep in `wb-views` if they are file-based).
4.  **Refactor Components**: Systematically go through the "TRUE" items above and implement the "Steps to Convert".
5.  **Verify**: Run tests to ensure that manually written HTML (matching the schema) is correctly enhanced without being destroyed.
