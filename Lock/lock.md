# AI Coordination Lock System

**Created:** 2026-01-06  
**Purpose:** Prevent file conflicts between multiple AI assistants working on the project

---

## How This Works

The `/Lock` folder serves as a coordination mechanism between AI assistants. Before modifying any file, an AI should check this folder and follow the protocols below.

---

## Lock Protocol

### To Claim a File/Folder for Editing:

1. **Create a lock file** in `/Lock` named: `LOCKED-{filename-or-folder}.md`
2. **Include in the lock file:**
   - AI identifier (e.g., "Claude-Session-A", "GPT-Session-B")
   - Timestamp
   - What you're doing
   - Estimated completion time
3. **Delete the lock file** when done

### Unlocking & Notifications

1. **Delete the lock file** immediately upon task completion. This is the primary signal that the file is free.
2. **Verbal Confirmation:** If interacting with a user, explicitly state "I have released the lock on {filename}" in the chat.
3. **No Extra Files:** Do not create separate "UNLOCKED" notification files to avoid clutter.

### Before Editing Any File:

1. Check `/Lock` folder for existing locks
2. If a lock exists for your target file → **WAIT** or work on something else
3. If no lock exists → Create your lock, then proceed

### Cleaning up released or stale locks

- Use `npm run lock:prune -- --age 30` to detect lock files older than 30 days that contain an explicit `RELEASED` / `UNLOCKED` marker (detect-only).
- To remove matching files locally: `npm run lock:prune -- --age 30 --apply` (ensure your git tree is clean first).
- CI will run the detection step on every PR and fail if stale locks are present; use the above commands to fix the PR before merge.

---

## Cleanup Progress Log

### Batch 1 - Completed ✅

**Archived to `/archive/cleanup-2026-01-06/`:**
- `debug_behaviors.js`
- `repro_behaviors.js`
- `repro_dup.js`
- `repro_server_wrapper.js`
- `temp_check.js`

**Moved to proper docs locations:**
- `BUILDER-FIXES.md` → `docs/builder/BUILDER-FIXES.md`
- `proposedhtmlTag.md` → `docs/architecture/proposed-custom-elements.md`

**Updated `.gitignore`:**
- Added `.test-cache.json`
- Added `.test-results-temp.json`
- Added `archive/`

### Remaining Files to Review

| File | Status | Notes |
|------|--------|-------|
| `project-index.html` | Keep | Useful project directory page (needs v3.0 migration) |
| `global.d.ts` | Keep | TypeScript declarations |
| `server.js` | Keep | Server entry point |

---

## AI Assignment

### Claude (Primary Session)
- **Focus:** Main development tasks, test fixes, feature work
- **Cleanup responsibility:** Can work on cleanup as background task
- **Lock requirement:** YES - lock files before modifying

### Other AI (If Present)
- **Focus:** File organization, archiving, documentation cleanup
- **Lock requirement:** YES - check for locks before ANY file operation
- **Coordination:** Monitor `/Lock` folder every operation

---

## Lock File Template

```markdown
# LOCKED: {filename}

**AI:** {identifier}  
**Started:** {ISO timestamp}  
**Task:** {brief description}  
**ETA:** {estimated completion}  

---
Working on: {details}
```

---

## Critical Rules

1. **Never edit a locked file** - even for "quick fixes"
2. **Keep locks short** - release as soon as task completes
3. **One file = one lock** - don't batch-lock entire directories unless necessary
4. **Check before write** - always verify no lock exists before creating/editing
5. **Clean up locks** - delete your lock file immediately when done

---

## Communication

If you need to coordinate or have questions, add notes to:
- `/Lock/AI-NOTES.md` - General coordination notes
- This file will be monitored by all AI assistants

---

## Current Locks

*None active*

<!-- When you create a lock, add a quick reference here:
- [ ] LOCKED-filename.md - AI-Name - Task description
-->
