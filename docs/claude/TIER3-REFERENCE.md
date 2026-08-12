# TIER 3 — REFERENCE (Don't Read Unless Specifically Needed)

**These docs exist for historical context, audits, or external publishing.**  
**Never read these at session start. Only pull them in if John points you here or the task explicitly requires it.**

---

## 📰 ARTICLES & EXTERNAL CONTENT

Published or draft content — not operational docs.

| File | What It Is |
|------|-----------|
| `articles/resilience-through-separation-code.md` | Article draft |
| `articles/resilience-through-separation-decoupled.md` | Article draft |
| `docs/linkedin-framework-agnostic.md` | LinkedIn article draft |
| `docs/linkedin-standards-article.md` | LinkedIn article draft |

---

## 📊 AUDITS & REPORTS

Historical snapshots — useful for understanding past decisions, not for current work.

| File | What It Is |
|------|-----------|
| `docs/schema-first-audit-report.md` | Audit of schema-first compliance |
| `docs/semantic-audit.md` | Semantic HTML audit results |
| `docs/audits/X-USAGE-AUDIT.md` | x-attribute usage audit |
| `docs/pce-candidates.md` | Proposed custom element candidates |
| `SITE_VALIDATION_REPORT.md` | Site validation snapshot |
| `CUSTOMER_READY.md` | Customer readiness checklist |

---

## 📜 MIGRATION HISTORY

Documents decisions already made. Don't re-read unless revisiting a migration.

| File | What It Is |
|------|-----------|
| `docs/NOTES-V3-GUIDE.md` | V3 migration notes |
| `docs/semantic-standard.md` | Semantic HTML standard (established) |
| `docs/code-examples-standard.md` | Code example conventions |
| `docs/CommittingFixes.md` | Git commit conventions |
| `docs/BRANCH_PROTECTION.md` | Branch protection rules |

---

## 🚀 DEPLOYMENT & OPS

Only relevant when deploying or configuring infrastructure.

| File | What It Is |
|------|-----------|
| `docs/deploying-wb-starter-to-render.md` | Render deployment guide |
| `docs/performance.md` | Performance profiling notes |

---

## 📖 COMPONENT DEEP-DIVES (Specific)

Individual component docs that are only relevant if working on that exact component. Most of these duplicate info in the component folder READMEs.

| File | What It Is |
|------|-----------|
| `docs/card.md` | Card component deep-dive |
| `docs/pricecard.md` | Price card specifics |
| `docs/audio.md` | Audio component |
| `docs/search.md` | Search component |
| `docs/inline-editing.md` | Inline editing feature |
| `docs/templates.md` | Template system |
| `demos/code.md` | Code demo notes |
| `demos/wb-views-demo.md` | Views demo notes |

---

## 📋 COMPLIANCE & GOVERNANCE

Enterprise compliance docs — not relevant to daily development.

| File | What It Is |
|------|-----------|
| `docs/compliance/iso-42001-alignment.md` | ISO 42001 AI compliance alignment |
| `CONTRIBUTING.md` | Contribution guidelines |

---

## 📁 IMPROVEMENT TRACKING

Wishlists and improvement ideas — not active work items.

| File | What It Is |
|------|-----------|
| `docs/IMPROVEMENTS.md` | Improvement ideas backlog |
| `WB-ISSUES-TODO.md` | Issues tracking (root level) |

---

## 🗄️ ROOT-LEVEL MISC

| File | What It Is |
|------|-----------|
| `README.md` | Project README |
| `docs/index.md` | Docs index page |
| `docs/guides/search-index.md` | Search index for docs site |

---

## 📂 SAFELY IGNORABLE

These folders/files can always be ignored:

| Path | Why |
|------|-----|
| `tmp/` | Temporary files, integration runs, playwright artifacts |
| `archive/` | Archived old files |
| `data/test-results/*/error-context.md` | Auto-generated test failure context (dozens of files) |

---

## The Rule

**If you're reading a Tier 3 doc during a normal session, you're probably going too deep.** These docs exist so John doesn't lose institutional knowledge, not so AI reads them every time. Stick to Tier 1 (always) and Tier 2 (when relevant to the task).
