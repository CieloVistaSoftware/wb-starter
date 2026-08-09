// check-menu-links.mjs
// Post-deploy guardrail: verify every navigation-menu item in config/site.json
// resolves to a live page on the deployed site (HTTP 200).
//
// The site is a client-rendered SPA — every ?page=X route serves index.html, so
// a route-level 200 proves nothing. site-engine.js loads each page's content via
// `fetch('pages/{pageToLoad}.html')`, so THAT file is what must be reachable.
// This fetches the deployed pages/{pageToLoad}.html for each nav item and asserts
// 200. External menu links (http...) are fetched as-is.
//
// Usage:  node scripts/check-menu-links.mjs
// Base:   override with WB_PAGES_BASE=https://host/base  (default = GitHub Pages)
//
// Exit 0 = all links live. Exit 1 = one or more broken. On failure it prints a
// JSON {"systemMessage": ...} line to stdout so a PostToolUse hook surfaces it.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = (process.env.WB_PAGES_BASE || 'https://cielovistasoftware.github.io/wb-starter').replace(/\/+$/, '');

// Pages lags a push by ~1 min; retry failures a few times before giving up.
const ROUNDS = Number(process.env.WB_MENU_ROUNDS || 4);
const GAP_MS = Number(process.env.WB_MENU_GAP_MS || 20_000);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loadNav() {
  const cfg = JSON.parse(readFileSync(join(ROOT, 'config', 'site.json'), 'utf8'));
  const nav = Array.isArray(cfg.navigationMenu) ? cfg.navigationMenu : [];
  return nav.map((item) => {
    const label = item.menuItemText || item.menuItemId || item.pageToLoad || '(unnamed)';
    const href = item.menuItemHref || item.href;
    if (href && /^https?:\/\//i.test(href)) return { label, url: href };
    if (item.pageToLoad) return { label, url: `${BASE}/pages/${item.pageToLoad}.html` };
    return { label, url: null };
  });
}

async function status(url) {
  try {
    // HEAD first; some hosts don't allow it, fall back to GET.
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (res.status === 405 || res.status === 501) res = await fetch(url, { method: 'GET', redirect: 'follow' });
    return res.status;
  } catch (e) {
    return `ERR ${e.code || e.message}`;
  }
}

async function main() {
  const links = loadNav();
  const targets = [{ label: 'site root', url: `${BASE}/` }, ...links.filter((l) => l.url)];
  const skipped = links.filter((l) => !l.url);

  console.error(`[menu-links] checking ${targets.length} live URL(s) against ${BASE}`);

  let pending = targets;
  let results = [];
  for (let round = 1; round <= ROUNDS && pending.length; round++) {
    results = await Promise.all(pending.map(async (t) => ({ ...t, code: await status(t.url) })));
    const failed = results.filter((r) => r.code !== 200);
    for (const r of results) console.error(`  ${r.code === 200 ? '✓' : '✗'} ${r.code}  ${r.label} -> ${r.url}`);
    if (!failed.length) break;
    if (round < ROUNDS) {
      console.error(`[menu-links] ${failed.length} not 200 yet — Pages may be rebuilding, retry ${round + 1}/${ROUNDS} in ${GAP_MS / 1000}s`);
      await sleep(GAP_MS);
      pending = failed;
    } else {
      pending = failed;
    }
  }

  for (const s of skipped) console.error(`  ⚠ skipped (no resolvable link): ${s.label}`);

  const broken = results.filter((r) => r.code !== 200);
  if (broken.length) {
    const list = broken.map((b) => `${b.label} (${b.code})`).join(', ');
    console.log(JSON.stringify({ systemMessage: `⚠ Menu-link check: ${broken.length}/${targets.length} broken after deploy — ${list}` }));
    console.error(`[menu-links] FAIL — ${broken.length} broken`);
    // Set exitCode and let the event loop drain (undici keep-alive sockets close
    // on their own). Calling process.exit() here crashes Node on Windows with a
    // libuv UV_HANDLE_CLOSING assertion when sockets are still open.
    process.exitCode = 1;
    return;
  }
  console.error(`[menu-links] OK — all ${targets.length} menu links live (200)`);
  console.log(JSON.stringify({ suppressOutput: true }));
}

main();
