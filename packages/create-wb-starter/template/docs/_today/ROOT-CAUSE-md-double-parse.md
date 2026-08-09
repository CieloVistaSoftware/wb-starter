# Root cause: doc-viewer collapsed multi-line code blocks (markdown double-parse)

**Date:** 2026-07-05
**Symptom:** In the doc-viewer, multi-line fenced code blocks rendered collapsed —
e.g. the V3-GUIDE "Quick start" `<!DOCTYPE html>` example showed `<head>` and its
children crammed onto one wrapping line instead of one tag per line. `white-space:
pre` was correct, so the *newlines were actually missing* from the DOM (7 newlines
rendered vs ~30 in the source).

## Root cause

**Markdown was being formatted twice.** `mdhtml` (the client-side `<wb-mdhtml>`
renderer) is the single source of markdown→HTML formatting — it fetches a `.md` URL
and runs `marked` on it. But the server's `/docs/*.md` route was *also* running
`marked(mdContent)` and returning **pre-rendered HTML** to the fetch. So mdhtml
received HTML, treated it as markdown, and ran `marked` on it **a second time**.

Re-parsing already-rendered HTML is mostly lossless for prose, but for a
`<pre><code>` block `marked`'s HTML-block handling reflowed the escaped content and
dropped the interior newlines — hence the collapse. It only showed up on code with
deep nesting / void tags (`<meta>`, `<link>`), which is why most docs looked fine.

**The over-engineering:** the server had no business formatting markdown at all.
mdhtml does the formatting. The server route was redundant work that actively broke
the renderer downstream.

## The fix (server.js `/docs/*.md` route)

The server never formats markdown for `/docs` anymore:

- **Direct browser navigation** (`Sec-Fetch-Dest: document`) → **302 redirect** to
  `/public/doc-viewer.html?file=<path>`. The doc-viewer renders it — themed,
  syntax-highlighted, path-linked, with live `<wb-demo>`s. (Still honors "never
  render a `.md` without the theme" — the doc-viewer is themed.)
- **Everything else** (mdhtml `fetch()`, tooling, curl) → **raw markdown**. mdhtml
  parses it exactly once.

Result: the V3-GUIDE code block went from 7 rendered newlines to 37 — one tag per
line, children indented under their parent.

## "Undo this effect everywhere" — audit

Every place that could double-parse (server pre-renders markdown → mdhtml re-parses):

| Location | Fed to mdhtml? | Action |
|----------|----------------|--------|
| `server.js` `/docs/*.md` (fetch) | **Yes** — the doc-viewer | **Fixed** → serves raw markdown |
| `server.js` `/docs/*.md` (direct nav) | No (bare page) | **Fixed** → redirects to the doc-viewer |
| `server.js` `/api/markdown` (GET/POST) | No — only a test harness reads it as HTML by design | Left as-is (documented API, not a double-parse path) |
| `<wb-mdhtml src="x.md">` in articles/ + demos/ | Yes | Already correct — those `.md` are served **raw** by static (not through the `/docs` route) |
| `<wb-mdhtml>…inline…</wb-mdhtml>` | Yes | Already correct — inline path, no fetch |

**Rule going forward:** anything that hands content to `mdhtml` must give it **raw
markdown**, never pre-rendered HTML. mdhtml owns markdown formatting.
