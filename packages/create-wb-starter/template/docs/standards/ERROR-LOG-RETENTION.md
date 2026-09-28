# Error Log Retention — 30 Days

**Rule, from John (2026-09-05):** *"all of our error logs must stay on the system
for 30 days."* Stated after a session in which the test suite destroyed 26+ real
errors he was reading, silently, seventeen times over (#1027).

## The rule

1. **No code deletes an error log.** Anything that clears, caps, resets or
   rotates one must ARCHIVE the entries first and print where they went.
2. **Archives live for at least 30 days**, on the machine, in
   `data/error-log-archive/`. They are never removed automatically — not by a
   test run, not by a build, not by a cleanup task.
3. **Removing an archive is a deliberate, announced act.**
   `scripts/prune-error-archives.mjs` is the only thing that deletes one. It is
   a dry run without `--confirm`, refuses any window shorter than 30 days, and
   names every file it removes with its age and entry count.
4. **An agent does not delete a log at all** — including archives it created
   itself, and including ones that look like test data. See
   [`CLAUDE.md`](../../CLAUDE.md) and the session rule: a log is evidence, and
   whether it looks like junk is not the deleter's call.

## Where the entries live

| Path | What it is | Cleared by | Archived first? |
|---|---|---|---|
| `data/errors.json` | the live runtime log the viewer reads | test reporter `onBegin`, `/api/error-log/clear`, the 100-entry cap | yes — all three (#1027) |
| `data/error-log-archive/errors-<ts>[-reason].json` | every batch removed from the live log | nothing automatic | n/a |

`data/error-log-archive/` is gitignored: the archives are machine-local
forensics, not repo content. "On the system" is the requirement, not "in git".

## Reasons recorded on an archive

- `cleared-from-viewer` — someone pressed **Clear Log** in the errors viewer.
- `overflow` — the live log hit its 100-entry cap and the oldest entries rolled
  off. Before #1027 these were dropped by a bare `.slice(-100)` and lost.
- *(no suffix)* — a test run cleared the log at `onBegin` (#562's clean slate).

## Checking

```bash
node scripts/prune-error-archives.mjs        # what exists, what is in-window, deletes nothing
```

The test reporter prints one line per wipe, e.g.

```
[WBTestReporter] data/errors.json held 26 error(s); archived to
data/error-log-archive/errors-2026-09-05T22-40-42-996Z.json before clearing it for this run.
```

If that line is absent on a run that cleared a non-empty log, the archive failed
— and it says so instead of proceeding quietly.
