# WB Behaviors v3.0 - AI Developer Guide

## 🚨 CRITICAL PROTOCOL: FILE LOCKING
**You MUST follow this before editing ANY file:**
1. Check the `Lock/` directory. If a lock exists for your target file, **DO NOT EDIT**.
2. Create a lock file `Lock/LOCKED-{filename}.md` containing your ID and timestamp.
3. Perform your edits.
4. **Delete the lock file immediately** upon completion.
*Failure to follow this will result in conflicts in this multi-agent environment.*

## 🏗 Project Architecture
This is a **Modern Native Web** project (No-Build, Light DOM, ES Modules).

### Core Stack
- **Frontend:** Vanilla JS Custom Elements (`<wb-*>`), no Shadow DOM, Native ESM.
- **Backend:** Node.js + Express (`server.js`).
- **Data:** JSON-driven architecture (`data/` contains site config, pages, and schemas).
- **Communication:** WebSocket (Live Reload) & MCP (Model Context Protocol).

### Directory Structure & Responsibilities
- `src/wb-models/*.schema.json`: Data schemas for components.
- `src/wb-viewmodels/*.js`: Business logic and behavior implementations.
- `src/wb-views/`: UI renderers.
- `src/styles/components/`: Component-specific CSS (loaded globally).
- `pages/*.html`: HTML fragments. Accessed via browser, `server.js` wraps them with the site shell automatically.
- `data/`: The "Database" of the site. `site.json` (config), `content-issues.json` (logs).

## 🧩 Development Patterns
1. **ES Modules Only:** Never use `require()` or `module.exports`. Use `import`/`export`.
2. **Component Naming:** Custom elements must be prefixed with `wb-`.
   - Examples: `<wb-card>`, `<wb-navigation>`.
3. **Behaviors:** Implemented as `x-*` attributes on elements (e.g., `<div x-fade-in>`).
4. **Error Handling:** Client errors are captured, logged to `localStorage`, and synced to `data/content-issues.json` via `/api/log-issues`.

## 🧪 Testing Strategy (Playwright)
Tests are strictly tiered. Lower tiers MUST pass before higher tiers run.
**Run via Terminal:**
1. `npm run test:compliance` (Tier 1: Static analysis, schema checks) - **FAST, run frequently.**
2. `npm run test:base` (Tier 2: Base execution) - Runs compliance + base behavior.
3. `npm run test:behaviors` (Tier 3: Full component suite) - The main dev standard.
4. `npm run test:all` (Full Suite: Tsiers 1-6 including regression & performance).

**Debugging Tests:**
- Use `npx playwright test --ui` for interactive debugging.
- Trace files are saved in `data/test-results/`.

## 🛠 Common Tasks & Workflows
- **Start Dev Server:** `npm start` (Runs Express + Live Reload + Docs Update).
- **New Component:**
  1. Create schema in `src/wb-models/`.
  2. Implement viewmodel in `src/wb-viewmodels/`.
  3. Add styles in `src/styles/components/`.
- **Pages:** Create HTML fragments in `pages/`. The server handles the layout wrapper.

## ⚠️ Important Constraints
- **Do not use build tools** like Webpack or Vite. The browser runs source code directly.
- **Do not use Shadow DOM**. Styles are global or scoped via extensive CSS nesting/methodologies.
- **Do not mix CommonJS** anywhere in the project.
