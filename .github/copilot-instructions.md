# WB Behaviors v3.0 - AI Developer Guide

## Session Start (DO THIS FIRST)

1. Read `docs/claude/TIER1-LAWS.md` — 10 non-negotiable rules that prevent regressions
2. Read `docs/_today/CURRENT-STATUS.md` — current project state
3. Check `/Lock` folder — don't edit locked files
4. Identify your task → load relevant section from `docs/claude/TIER2-DOMAIN-GUIDES.md`

## Documentation Tier System

All project docs are organized into 3 tiers. See `docs/claude/README.md` for the full index.

| Tier | When | What |
|------|------|------|
| **Tier 1 — LAWS** | Every session | 10 rules that prevent regressions |
| **Tier 2 — DOMAIN GUIDES** | When task touches that area | Component specs, testing, CSS, builder, schemas, etc. |
| **Tier 3 — REFERENCE** | Only if John points you there | Articles, audits, migration history |

## Quick Reference

**Owner:** John (Cielo Vista Software)  
**Architecture:** WBServices pattern, Light DOM only, proper HTMLElement inheritance  
**Project location:** `C:\Users\jwpmi\Downloads\AI\wb-starter`

### Core Stack
- **Frontend:** Vanilla JS Custom Elements (`<wb-*>`), no Shadow DOM, Native ESM
- **Backend:** Node.js + Express (`server.js`)
- **Data:** JSON-driven architecture (`data/`)

### File Structure
```
src/wb-models/{name}.schema.json   — Component schemas
src/wb-viewmodels/{name}.js        — Behavior/logic
src/styles/behaviors/{name}.css    — Styles
docs/claude/TIER1-LAWS.md          — Read every session
docs/_today/CURRENT-STATUS.md      — Current work status
```

### Critical Rules (see Tier 1 for full details)
- **Light DOM only** — never use Shadow DOM
- **ES Modules only** — never use `require()` or `module.exports`
- **Components:** `<wb-*>` custom element tags
- **Behaviors:** `x-*` attributes on existing elements
- **No build tools** — browser runs source code directly
- **Check `/Lock` folder** before editing any file
- **Never run tests synchronously** — use `npm run test:async` only

### Testing (Async Only)
```
npm run test:async                                    # full suite
npm run test:async -- --project=compliance            # filtered
npm run test:async -- tests/behaviors/badge.spec.ts   # single spec
```

If 3+ failures: STOP and diagnose root cause. Don't patch symptoms.
