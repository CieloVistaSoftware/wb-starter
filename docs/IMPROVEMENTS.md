# Potential Improvements for WB Behaviors

Based on the project assessment (Dec 2025), here are strategic improvements to consider for future iterations:

## 1. Architecture & Performance
- **"Lite" Version:** Create a build that only includes the core engine (`wb.js`) and allows users to import only specific behaviors. This reduces the initial download size for users who don't need the full suite of 235+ behaviors.
- **Tree-Shaking Support:** Ensure the module structure allows modern bundlers to remove unused behaviors automatically if a user chooses to build their project.

## 2. Developer Experience (DX)
- **CLI Tool:** A simple command-line interface (e.g., `npx create-wb-app`) to scaffold new projects, similar to the current "WB Starter" but automated.
- **VS Code Extension:** A dedicated extension that provides:
  - Autocomplete for `data-wb` attributes.
  - Hover documentation for behavior properties.
  - Snippets for common patterns.

## 3. Documentation & Learning
- **Interactive Playground:** A web-based REPL (like CodePen or the Svelte REPL) where users can try behaviors without downloading anything.
- **Video Tutorials:** Short, focused videos demonstrating how to build common layouts (Hero, Pricing Table, Contact Form) using the builder.

## 4. Ecosystem
- **Theme Marketplace:** Allow community contributions of themes (`site.json` + CSS variables).
- **Component Gallery:** A visual showcase of what's possible, beyond the current demos, perhaps featuring full page templates.

## 5. Testing & Stability
- **Automated Visual Regression Testing:** Since this is a UI library, automated screenshots of components across different themes would ensure updates don't break styles.
- **E2E Testing for Builder:** Automated tests to verify drag-and-drop functionality and property updates in the builder.
