# TODO List

**Created**: 2024-12-31
**Source**: CURRENT-STATUS.md

---

## 🔴 High Priority - Builder Integration

- [ ] **Fix any issues from `npm test`**
  - Run tests and resolve failures

- [ ] **Integrate `builder-drop-handler.js` into `builder.js`**
  - Wire up smart drop handling
  - Connect visual feedback system

- [ ] **Add visual feedback during drag**
  - Implement `getDragFeedback()` calls
  - Show drop zone indicators

- [ ] **Add effects dropdown to property panel**
  - List available modifiers for selected element
  - Allow applying/removing effects

---

## 🟡 Medium Priority - Native Element Migrations

- [ ] **`progressbar` → native `<progress>`**
  - Use `<progress value="..." max="100">`
  - Maintain existing API/attributes

- [ ] **`search` → native `<search>` wrapper**
  - HTML5 2023 semantic element
  - Wrap existing search functionality

- [ ] **`highlight` → native `<mark>`**
  - Replace custom highlighting with `<mark>` element
  - Preserve styling options

- [ ] **`clock/countdown` → native `<time>`**
  - Use `<time datetime="...">`
  - Add machine-readable timestamps

---

## 🟢 Completed This Session ✅

- [x] Builder Sidebar Category System
- [x] Builder Architecture Refactor (event hygiene)
- [x] `autocomplete` → native `<datalist>`
- [x] Created `src/behaviorMeta.js` (155+ behaviors)
- [x] Created `src/builder-drop-handler.js`

---

## Quick Reference

```bash
npm start    # http://localhost:3000/builder.html
npm test     # Run tests
```
