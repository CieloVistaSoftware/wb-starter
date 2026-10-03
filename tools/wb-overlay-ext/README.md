# wb-starter Behavior Overlay (browser extension)

A Chrome extension (manifest v3) for developing wb-starter: on `localhost` pages it adds a toggle that highlights rendered behaviors and shows the model behind each one.

It lived in `packages/create-wb-starter/template/src/` by accident (swept in by `3cbb89d3`), so every site made with `npm create wb-starter` got a copy. It is a tool for working on wb-starter, not part of a new site, so it lives here (#1292).

**Load it:** Chrome → `chrome://extensions` → Developer mode → **Load unpacked** → choose this folder.
