# Repo Layout

Where every file in wb-starter goes. Enforced by
`tests/compliance/repo-layout.spec.ts`; a file that breaks a rule fails the gate.

John, 2026-09-29: "follow our standards for file name, folder placement etc. Move
unused files by putting them into an archive folder, no loose scripts, they all
must go in proper folder. Same goes with .png files. NO .txt files in root. Only
1 .html file in root. No .md docs but readme in root."

## The root

Only the site's entry points and project configuration:

| File | Why it is at the root |
|---|---|
| `index.html` | The one page at the root: the site's entry point. |
| `sw.js` | A service worker's scope is its own folder, so it must sit at the site root (CieloVistaStandards `build-deploy.md`, rule 2). |
| `manifest.json` | The web app manifest `index.html` links. |
| `server.js` | `npm start` runs it. |
| `README.md` | The only `.md` at the root. |
| `LICENSE`, `.gitignore`, `.nojekyll`, `.mcp.json` | Read from the root by GitHub, git, Pages and Claude. |
| `package.json`, `package-lock.json`, `eslint.config.js`, `tsconfig.json`, `jsconfig.json`, `playwright.config.ts`, `global.d.ts` | Tool configuration, read from the root. |

Never at the root: `.txt` or `.log` files (test output belongs in
`data/test-results/` or nowhere; `.gitignore` ignores `/*.txt` and `/*.log`), any
other `.html`, scripts, images, or other `.md` docs.

`CLAUDE.md` lives in `.claude/` and `CONTRIBUTING.md` in `.github/`, locations
Claude Code and GitHub both read.

## Folders

| Kind of file | Goes in |
|---|---|
| Scripts (`.mjs`, `.cjs`, `.ps1`, `.py`, `.sh`) | `scripts/`, or beside the code that runs them (`src/`, `tests/`, `server/`, `.husky/`, `.github/`) |
| Images (`.png`, `.jpg`, …) | `images/` (content) or `assets/` (icons, favicons) |
| Test media and test pages | `tests/fixtures/` |
| Standalone tool pages (doc viewer, error viewer, …) | `public/` |
| Site pages | `pages/` |
| Demos | `demos/` |
| Docs | `docs/`; standards in `docs/standards/` |
| Sample downloads for the file-card demos | `files/` |

## Names

kebab-case: `repo-layout.spec.ts`, `npx-commands.md`. Exceptions: files named
after a behavior's public identifier (`drawerLayout.schema.json` — renaming the
file renames the behavior), fixture copies of CDN files (their names are the
upstream URLs), and conventional names (`README.md`, `LICENSE`, `CODEOWNERS`).

## Unused files

Move them to `archive/`, keeping their original path (`scripts/fix-demos.mjs` →
`archive/scripts/fix-demos.mjs`). Nothing is deleted, and nothing in `archive/`
is loaded, tested or shipped. `archive/` is still in the public repo: archiving
does not make a file private.
