
# TIER 2 — DOMAIN GUIDES (Read When Working In That Area)

**Only load these when the task touches this domain.**  
**Don't read all of these every session — that defeats the purpose.**

---

## 🔧 CORE ARCHITECTURE

Read when: modifying `src/core/`, component registration, behavior system, or WB.js

| File | What It Covers |
|------|---------------|
| `docs/standards/V3-STANDARDS.md` | **THE** v3 spec — naming, file structure, syntax, BEM classes |
| `docs/architecture.md` | Overall architecture overview |
| `docs/architecture/standards/ATTRIBUTE-NAMING-STANDARD.md` | Why `x-*` for behaviors, clean names for properties |
| `docs/architecture/standards/SCHEMA-SPECIFICATION.md` | Schema JSON structure spec |
| `docs/WB_BEHAVIOR_SYSTEM.md` | How behaviors attach to elements |
| `docs/Auto-Injection.md` | How CSS/JS auto-loading works |
| `docs/container-pattern.md` | Container component pattern |
| `docs/escape-hatches.md` | How to override framework defaults |
| `docs/architecture/proposals/proposed-custom-elements.md` | Custom elements proposals |
| `docs/architecture/historical/X-PREFIX-MIGRATION-PHASE1.md` | X-prefix migration history |

---

## 🧩 COMPONENTS

Read when: working on a specific `<wb-*>` component or `x-*` behavior

| File | What It Covers |
|------|---------------|
| `docs/components/README.md` | Component catalog overview |
| `docs/components/cards/` | 20+ card variant specs (card, cardhero, cardimage, etc.) |
| `docs/components/semantic/` | Semantic HTML wrappers (address, article, aside, blockquote, etc.) |
| `docs/components/semantics/` | Form/interactive elements (button, checkbox, dialog, input, etc.) |
| `docs/components/effects/` | Visual effects (confetti, fireworks, snow) |
| `docs/components/feedback/` | Feedback components |
| `docs/components/forms/` | Form components |
| `docs/components/layout/` | Layout components |
| `docs/components/navigation/` | Navigation components |
| `docs/components/demo/` | Demo and showcase components |
| `docs/components/drawer.md` | Drawer component |
| `docs/components/tabs.md` | Tabs component |
| `docs/behaviors-reference.md` | All behaviors cross-reference |
| `docs/behavior-cross-reference.md` | Behavior ↔ component mapping |
| `docs/properties.md` | Component property patterns |

---


## 🧪 TESTING

Read when: writing tests, fixing test failures, or modifying test infrastructure

| File | What It Covers |
|------|---------------|
| `docs/testing-strategy.md` | Overall test approach and philosophy |
| `docs/testing-runbook.md` | Step-by-step test procedures |
| `docs/builder-testing.md` | Builder-specific test rules |
| `docs/test-schema-standard.md` | How to test schemas |
| `docs/schemaTestValue.md` | Test value conventions for schemas |
| `docs/ANNOUNCE_TEST_POLICY.md` | Test policy announcement |
| `data/FUNCTIONAL-TEST-ANALYSIS.md` | Analysis of test gaps |
| `docs/compliance/iso-42001-alignment.md` | Compliance alignment |
| `docs/audits/X-USAGE-AUDIT.md` | X-usage audit |

---

## 📐 SCHEMAS & MVVM

Read when: modifying schemas, schema-builder, or MVVM migration work

| File | What It Covers |
|------|---------------|
| **`docs/claude/SCHEMAS-GUIDE.md`** | **⭐ START HERE — Claude's guide to schemas: rules, mistakes to avoid, test workflow** |
| `docs/architecture/standards/SCHEMA-SPECIFICATION.md` | Full v3.0 schema spec with complete examples |
| `docs/schema.md` | Schema system overview |
| `docs/schema-first-architecture.md` | Schema-first design philosophy |
| `docs/schema.migration.md` | Schema migration patterns |
| `docs/MVVM-MIGRATION.md` | MVVM migration overview |
| `docs/MVVM-MIGRATION-PLAN.md` | MVVM migration detailed plan |
| `docs/architecture/WBVIEWS.md` | WB Views system ($view in schemas) |
| `docs/wb-parts-spec.md` | `<wb-part>` template system |
| `docs/property-viewer.md` | Property viewer panel |

---

## 🎨 CSS & STYLES

Read when: modifying CSS files, style extraction, or theme work

| File | What It Covers |
|------|---------------|
| `docs/css-standards.md` | CSS naming and organization rules |
| `docs/styles.md` | Style system overview |
| `docs/themes.md` | Theme system and CSS variables |
| `docs/_today/CSS-OWNERSHIP-MIGRATION.PLAN.md` | Current CSS migration status |
| `docs/_today/CSS-OWNERSHIP-MIGRATION.md` | (legacy) CSS migration status |

---

## 📄 PAGE GENERATION

Read when: generating demo pages, creating showcases, working with `.page.json` schemas, or running `auto-showcase.mjs`

| File | What It Covers |
|------|---------------|
| `docs/claude/PAGE-GENERATION.md` | Full pipeline guide — validate, generate, auto-showcase |

Scripts: `scripts/validate-page-schema.mjs`, `scripts/generate-page.mjs`, `scripts/auto-showcase.mjs`

---

## 🔌 MCP & TOOLING

Read when: MCP server issues, npm scripts, or dev tooling

| File | What It Covers |
|------|---------------|
| `docs/mcp.md` | MCP server documentation |
| `mcp-server/README.md` | MCP server setup and API |
| `docs/DATA-FILES.md` | What lives in `data/` and why |
| `docs/INTELLISENSE-TOOLTIPS.md` | IDE intellisense generation |
| `vscode/README.md` | VS Code extension/config |
| `.github/copilot-instructions.md` | GitHub Copilot instructions |

---

## 📋 OPERATIONAL (_today)

Read when: starting a session (CURRENT-STATUS.md is Tier 1), or when John points you here

| File | What It Covers |
|------|---------------|
| `docs/_today/CURRENT-STATUS.md` | **Tier 1** — always read at session start |
| `docs/_today/TODO.md` | Active task backlog |
| `docs/_today/QUESTIONS.md` | Open questions for AI agents |
| `docs/_today/ANSWERS.md` | Answered questions |
| `docs/_today/MERGE-PLAN.md` | Branch merge status |
| `docs/_today/AI-COORDINATION.md` | Multi-AI coordination rules |
| `docs/_today/BEHAVIORS-TODO.md` | Behavior-specific backlog |
| `docs/_today/PAGE-REPAIR-PLAN.md` | Page repair plan |
| `docs/_today/REPAIR-PLAN-021526.md` | Repair plan 021526 |
| `docs/_today/021426FIXPLAN.md` | 021426 Fix Plan |
| `docs/_today/CSS-OWNERSHIP-MIGRATION.PLAN.md` | CSS migration plan |

---


## 🪄 WIZARD (Builder Replacement)

The legacy builder is deprecated. The new workflow for guided component/page creation is the **Component Wizard**:

- **docs/wizard.md** — Full user guide for the wizard system
- **demos/wizard.html** — Visual tool for assembling, configuring, and previewing WB custom elements (open in browser)

Use the wizard for:
- Visual, no-code assembly of components
- Live property editing and preview
- Exporting HTML for use in your project

See docs/wizard.md for full instructions and workflow.

---

## How To Use This

1. John says "fix the badge component" → Read **Components** (badge docs) + **Testing**
2. John says "work on CSS migration" → Read **CSS & Styles** 
3. John says "fix a test" → Read **Testing** + check if the component has docs in **Components**
4. John says "schema issue" → Read **Schemas & MVVM**
5. John says "builder work" → Read **Builder** (and remember Tier 1: don't touch without permission)
6. John says "generate a showcase" → Read **Page Generation**
7. MCP not responding → Read **MCP & Tooling**
