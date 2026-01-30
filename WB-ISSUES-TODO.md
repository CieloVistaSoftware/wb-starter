# WB Framework Issues Todo List
**Generated:** January 29, 2026  
**Total Issues:** 24

---

## 🔴 BUGS (8 issues) - Fix First

| # | Issue | ID | Date |
|---|-------|-----|------|
| 1 | home page has many things not working | `note-1769445034341-p0` | 1/26 |
| 2 | doc button from builder doesn't navigate | `note-1769445369305-p0` | 1/26 |
| 3 | Issues viewer refresh button does not work | `issues-viewer-refresh-button` | 1/25 |
| 4 | semanticContextMenu broken | `note-1769302437975-p0` | 1/24 |
| 5 | Behavior category buttons don't scroll to section | `note-1769220751805-p0` | 1/23 |
| 6 | adding x-draggable changes element location even when not clicked | `note-1769212201021-p0` | 1/23 |
| 7 | theme override does not work | `note-1769211301098-p0` | 1/23 |
| 8 | context menu inspect does nothing | `note-1769194562447-p0` | 1/23 |

---

## 🟡 UI Issues (10 issues) - Visual/UX

| # | Issue | ID | Date |
|---|-------|-----|------|
| 1 | spinner sizes wrong on components page | `note-1769470023977-p0` | 1/26 |
| 2 | remove clicked toast in alerts section | `note-1769469995667-p0` | 1/26 |
| 3 | code sections not colored (use mdhtml) | `note-1769469912373-p0` | 1/26 |
| 4 | card footer missing on components page | `note-1769469867776-p0` | 1/26 |
| 5 | replace docs link with theme control (page/element modes) | `note-1769445571833-p0` | 1/26 |
| 6 | builder.html needs page level theme control | `note-1769445416198-p0` | 1/26 |
| 7 | issue header not visible on home page | `note-1769445232423-p0` | 1/26 |
| 8 | builder add component popup uneven rows | `note-1769306014994-p0` | 1/24 |
| 9 | remove issues button in builder bottom right | `note-1769305932956-p0` | 1/24 |
| 10 | remove wb-issues refs not in navbar | `note-1769212344261-p0` | 1/23 |

---

## 🟢 ENHANCEMENTS (5 issues) - Lower Priority

| # | Issue | ID | Date | Fixed |
|---|-------|-----|------|:-----:|
| 1 | unit tests for x-attribute add/remove | `note-1769212252713-p0` | 1/23 | `false` |
| 2 | Issues component publishable to npm | `note-1769194490447-p0` | 1/23 | `false` |
| 3 | require test link to resolve issue | `note-1769194412485-p0` | 1/23 | `false` |
| 4 | inform AI tests required before resolve | `note-1769194386465-p0` | 1/23 | `false` |
| 5 | issues viewer show full json record | `note-1769194331335-p0` | 1/23 | `false` |

---

## ⚪ OTHER (1 issue)

| # | Issue | ID | Date |
|---|-------|-----|------|
| 1 | Auto-generated issue for test | `note-1769293683522-p0` | 1/27 |

---

## Recommended Attack Order

### Phase 1: Critical Bugs (Today)
1. **Theme override** - Already investigated, needs proper fix
2. **x-draggable positioning** - Already investigated, WB.inject() failing
3. **context menu inspect** - Already investigated, click handler not working

### Phase 2: Navigation/Functionality Bugs
4. **home page issues** - Multiple things broken
5. **doc button navigation** - Builder doesn't navigate
6. **Issues viewer refresh** - Button non-functional
7. **Behavior category scroll** - Buttons don't scroll
8. **semanticContextMenu** - Broken

### Phase 3: UI Polish
9-18. All UI issues in order of date (newest first)

### Phase 4: Enhancements
19-23. All enhancements

---

## Notes from Last Session
- **x-draggable bug**: `WB.inject()` returns `data-wb-error="true"` - behavior initialization broken
- **context-menu-inspect**: Click handler not opening inspector panel
- Both were marked "fixed" but **tests were broken** and never validated the fixes
- Status was reverted to "pending" in `data/pending-issues.json`
