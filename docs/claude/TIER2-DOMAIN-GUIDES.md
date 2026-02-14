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
| `docs/architecture/ATTRIBUTE-NAMING-STANDARD.md` | Why `x-*` for behaviors, clean names for properties |
| `docs/architecture/SCHEMA-SPECIFICATION.md` | Schema JSON structure spec |
| `docs/WB_BEHAVIOR_SYSTEM.md` | How behaviors attach to elements |
| `docs/Auto-Injection.md` | How CSS/JS auto-loading works |
| `docs/container-pattern.md` | Container component pattern |
| `docs/escape-hatches.md` | How to override framework defaults |

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
| `docs/components/drawer.md` | Drawer component |
| `docs/components/tabs.md` | Tabs component |
| `docs/components/feedback/` | Feedback components |
| `docs/components/forms/` | Form components |
| `docs/components/layout/` | Layout components |
| `docs/components/navigation/` | Navigation components |
| `docs/behaviors-reference.md` | All behaviors cross-reference |
| `docs/behavior-cross-reference.md` | Behavior ↔ component mapping |
| `docs/properties.md` | Component property patterns |

---

## 🏗️ BUILDER

Read when: John explicitly asks you to work on builder (remember: AI already broke it, Tier 1 says don't touch without permission)

| File | What It Covers |
|------|---------------|
| `docs/builder.md` | Builder overview |
| `docs/builder/BUILDER-FIXES.md` | Known builder bugs and fixes |
| `docs/builder/builder-tree.md` | Builder DOM tree panel |
| `docs/builder/pages.md` | Builder page management |
| `docs/builder-interaction-rules.md` | How builder handles user interactions |
| `docs/builder-onboarding-flow.md` | Builder first-run experience |
| `docs/builder-properties.md` | Builder properties panel |
| `docs/builder-section-focus.md` | Builder section focus behavior |
| `docs/builder-testing.md` | Builder-specific testing rules |
| `docs/builder-workflow.md` | Builder workflow patterns |
| `docs/builder.todo.md` | Builder backlog |
| `docs/PAGE-BUILDER-RULES.md` | Page builder constraints |
| `docs/USER-PAGE-BUILDER-PLAN.md` | User-facing page builder plan |
| `PageBuilder_Specs.md` | Full page builder specification |
| `EDITMODE_GUIDE.md` | Edit mode usage guide |
| `EDITMODE_SETUP.md` | Edit mode setup |
| `EDITOR_PANEL_GUIDE.md` | Editor panel guide |

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

---

## 📐 SCHEMAS & MVVM

Read when: modifying schemas, schema-builder, or MVVM migration work

| File | What It Covers |
|------|---------------|
| `docs/schema.md` | Schema system overview |
| `docs/schema-first-architecture.md` | Schema-first design philosophy |
| `docs/architecture/SCHEMA-SPECIFICATION.md` | Schema JSON structure (also in Core) |
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
| `docs/_today/CSS-OWNERSHIP-MIGRATION.md` | Current CSS migration status |

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

---

## How To Use This

1. John says "fix the badge component" → Read **Components** (badge docs) + **Testing**
2. John says "work on CSS migration" → Read **CSS & Styles** 
3. John says "fix a test" → Read **Testing** + check if the component has docs in **Components**
4. John says "schema issue" → Read **Schemas & MVVM**
5. John says "builder work" → Read **Builder** (and remember Tier 1: don't touch without permission)
6. John says "generate a showcase" → Read **Page Generation**
7. MCP not responding → Read **MCP & Tooling**
