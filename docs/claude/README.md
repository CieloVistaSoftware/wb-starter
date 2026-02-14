# AI Documentation Tier System

**Purpose:** Stop AI from drowning in 160+ docs and missing the things that matter.

## How It Works

| Tier | When To Read | File Count | Rule |
|------|-------------|------------|------|
| **Tier 1 — LAWS** | Every session, no exceptions | 1 file (~10 rules) | Violating these causes regressions |
| **Tier 2 — DOMAIN GUIDES** | Only when task touches that domain | ~80 files in 7 domains | Load the relevant domain, ignore the rest |
| **Tier 3 — REFERENCE** | Only when John points you there | ~40 files | History, articles, audits — not operational |

## Session Start Checklist

1. Read `docs/claude/TIER1-LAWS.md` — the 10 laws
2. Read `docs/_today/CURRENT-STATUS.md` — what's happening now
3. Check `/Lock` folder — what's off-limits
4. Use `recent_chats` — continue from last session
5. Identify the task domain → load only the relevant Tier 2 section
6. Start working

## Files

- [TIER1-LAWS.md](TIER1-LAWS.md) — 10 non-negotiable rules
- [TIER2-DOMAIN-GUIDES.md](TIER2-DOMAIN-GUIDES.md) — Domain-specific doc index
- [TIER3-REFERENCE.md](TIER3-REFERENCE.md) — Background/historical docs
