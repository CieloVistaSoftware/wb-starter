# AI Coordination Protocol

**Last Updated:** 2026-02-06  
**Owner:** John (only human merges to main)

---

## Hard Rules (BOTH AIs must follow)

1. **Never force-push main.** Always `git pull origin main` before pushing.
2. **Never commit directly to main.** Create a branch, push it, John merges.
3. **Never switch branches without stashing/committing first.**
4. **Check `/Lock` folder before editing any file.**
5. **Maximum 2 branches per day per AI.** Keep things manageable — don't flood main with merges.

---

## How Questions Work

John is the relay. AIs cannot ping each other directly.

### Asking a Question

1. Write your question to `docs/_today/QUESTIONS.md` using the format below.
2. Commit and push to your current branch (or tell John the question verbally).
3. **Stop and wait.** John will relay it to the other AI.

### Answering a Question

1. John will paste or describe the question to you.
2. Do the work.
3. Write your answer to `docs/_today/ANSWERS.md` using the format below.
4. Commit and push to a branch.
5. Tell John you're done.

### Completing the Loop

1. John tells the original AI "check answers."
2. Original AI reads `docs/_today/ANSWERS.md` and continues.

---

## Question Format

```
### QID: q-YYYYMMDD-NN
**From:** claude | copilot
**Priority:** high | medium | low
**Title:** one-line summary
**Context:** file paths, PR numbers, branch names
**Question:** 1-2 sentences, clear and specific
**Expected output:** what artifacts should be produced
```

## Answer Format

```
### QID: q-YYYYMMDD-NN
**Answered by:** claude | copilot
**Status:** done | blocked | need-human
**Answer:** 1-3 lines
**Artifacts:** file paths, PR numbers, branch names
**Branch:** branch name where work was committed
```

---

## Example Flow

1. **Claude** writes to QUESTIONS.md:
   > QID: q-20260206-03 — Fix test-async.mjs detached process not releasing parent

2. **John** tells Copilot: "Read docs/_today/QUESTIONS.md, answer q-20260206-03"

3. **Copilot** does the work, writes to ANSWERS.md:
   > QID: q-20260206-03 — Done. Fixed pipe handling. Branch: fix/test-async-detach

4. **John** tells Claude: "Check answers"

5. **Claude** reads ANSWERS.md, pulls the branch, continues.

---

## What NOT To Do

- ❌ Don't assume the other AI is polling files
- ❌ Don't force-push any branch
- ❌ Don't rewrite history on shared branches
- ❌ Don't commit to main directly
- ❌ Don't switch branches while the other AI might be on the same branch
