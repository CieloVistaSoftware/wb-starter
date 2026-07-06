# "inheritance" usage report — `.md` files

**Generated:** 2026-07-02
**Scope:** all `*.md` files in the wb-starter repo (case-insensitive match on `inheritance`)
**Total:** 31 occurrences across 13 files

> Note the tension worth reviewing: the CieloVista standard is *composition over
> inheritance* (Light DOM, no Shadow DOM), yet many docs assert "proper HTMLElement
> **inheritance**." Both can be true (components `extends HTMLElement` while behaviors
> favor composition), but the wording is worth aligning. Grouped below by theme.

---

## 1. "Proper HTMLElement inheritance" — architecture claims (14)

Statements that components extend `HTMLElement` / class-based architecture.

| File | Line | Text |
|------|------|------|
| `CLAUDE.md` | 39 | Architecture: WBServices pattern, Light DOM only, proper HTMLElement inheritance |
| `.github/copilot-instructions.md` | 23 | Architecture: WBServices pattern, Light DOM only, proper HTMLElement inheritance |
| `docs/claude/TIER1-LAWS.md` | 18 | Architecture v3.0 uses the WBServices pattern with proper HTMLElement inheritance. |
| `docs/components/components.md` | 6 | All components use proper HTMLElement inheritance and ES Modules. |
| `docs/components/components.md` | 12 | 3. HTMLElement Inheritance: Proper class-based architecture |
| `docs/components/README.md` | 5 | All components use proper HTMLElement inheritance and ES Modules. |
| `docs/components/README.md` | 28 | 3. HTMLElement Inheritance: Proper class-based architecture |
| `docs/pce-candidates.md` | 45 | \| HTMLElement Inheritance \| Components extend HTMLElement properly \| |
| `docs/components/cards/card.md` | 51 | ## Why Inheritance Matters |
| `docs/components/cards/card.md` | 53 | …use proper HTMLElement inheritance instead of a custom base class… |
| `docs/components/cards/card.md` | 59 | Performance: Native inheritance avoids extra indirection and complexity… |
| `docs/components/cards/card.md` | 62 | …Proper inheritance means your components are robust, maintainable… |
| `docs/components/cards/card.md` | 69 | Modern Web Standards: Uses proper HTMLElement inheritance, ES Modules… |
| `docs/wbservices.md` | 6 | …proper HTMLElement inheritance, and ES Modules… |

## 2. WBServices / behaviors — "NO inheritance" (composition) (6)

Statements that behaviors do **not** use OOP/class inheritance.

| File | Line | Text |
|------|------|------|
| `docs/wbservices.md` | 14 | Proper Inheritance: Components extend HTMLElement directly, not a custom base class. |
| `docs/wbservices.md` | 161 | …without requiring custom elements or class inheritance. |
| `docs/wbservices.md` | 193 | No class inheritance or custom element registration is required for behaviors. |
| `docs/WB_BEHAVIOR_SYSTEM.md` | 25 | ### NOT Class Inheritance |
| `docs/WB_BEHAVIOR_SYSTEM.md` | 27 | WB behaviors do NOT use traditional OOP inheritance like Web Components: |
| `docs/WB_BEHAVIOR_SYSTEM.md` | 909 | 3. No Inheritance — The browser provides inheritance; we just add features |

## 3. "Native / browser-provided inheritance" (2)

| File | Line | Text |
|------|------|------|
| `docs/WB_BEHAVIOR_SYSTEM.md` | 68 | ### The Browser Provides Inheritance |
| `docs/WB_BEHAVIOR_SYSTEM.md` | 87 | \| Behavior File \| Expects Element Type \| Native Inheritance \| |

## 4. Schema inheritance (schema hierarchy / `_inheritance.schema.json`) (9)

| File | Line | Text |
|------|------|------|
| `docs/claude/SCHEMAS-GUIDE.md` | 36 | Definition tier row — `_inheritance.schema.json, schema.schema.json` |
| `docs/claude/SCHEMAS-GUIDE.md` | 43 | …not inherited. They document structural expectations (inheritance rules…). |
| `docs/claude/SCHEMAS-GUIDE.md` | 93 | `semantic/_inheritance.schema.json` — missing properties, $view, $methods… |
| `docs/claude/SCHEMAS-GUIDE.md` | 102 | ## Schema Inheritance Hierarchy — The Lowest Wins |
| `docs/claude/SCHEMAS-GUIDE.md` | 104 | Schemas form an inheritance chain. The most specific (lowest) schema wins. |
| `docs/claude/SCHEMAS-GUIDE.md` | 135 | ### How Inheritance Works in Practice |
| `docs/schema.md` | 16 | Definition tier — `_inheritance.schema.json, schema.schema.json` |
| `docs/schema.migration.md` | 22 | `_base/` — Shared/base schemas for inheritance |
| `docs/components/semantic/article.md` | 103 | ## Inheritance Chain |

---

## By-file totals

| File | Count |
|------|-------|
| `docs/claude/SCHEMAS-GUIDE.md` | 6 |
| `docs/components/cards/card.md` | 5 |
| `docs/WB_BEHAVIOR_SYSTEM.md` | 5 |
| `docs/wbservices.md` | 4 |
| `docs/components/components.md` | 2 |
| `docs/components/README.md` | 2 |
| `CLAUDE.md` | 1 |
| `.github/copilot-instructions.md` | 1 |
| `docs/claude/TIER1-LAWS.md` | 1 |
| `docs/schema.md` | 1 |
| `docs/pce-candidates.md` | 1 |
| `docs/schema.migration.md` | 1 |
| `docs/components/semantic/article.md` | 1 |
| **Total** | **31** |
