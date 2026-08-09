# create-wb-starter

Scaffold a full copy of [wb-starter](https://github.com/CieloVistaSoftware/wb-starter) — zero-build web components, schema-first MVVM — into a new project directory.

## Usage

```bash
npx create-wb-starter my-site
cd my-site
npm install
npm start
```

This copies the whole site — `pages/`, `demos/`, `docs/`, `src/`, `config/`, `tests/`, everything — as your own editable project. It's zero-build: no bundler, no compile step. Edit any file and reload.

## Updating the bundled template

The template shipped in `template/` is a snapshot, not a live link back to the main repo. Before publishing a new version of this package, resync it:

```bash
node scripts/sync-template.mjs
```

This copies the current allowlisted contents of the wb-starter repo root into `template/`, and regenerates `template/package.json` (name/version reset, everything else carried over).
