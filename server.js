import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import compression from 'compression';
import { WebSocketServer } from 'ws';
import { exec, execSync, execFileSync } from 'child_process';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
// #518: derived from `port`, not a second independent hardcode -- an
// isolated test run on a non-default PORT (WB_TEST_PORT in
// playwright.config.ts) previously always collided with WHATEVER server
// already held 3001 (normally the main checkout's own live-reload
// socket), live-reload degrading silently instead of actually using its
// own isolated port the way the whole point of the override intended.
// Number(port) first -- `port` can be the STRING from process.env.PORT,
// and `+ 1` on a string is concatenation ("3995" + 1 -> "39951"), not
// arithmetic.
const WS_PORT = Number(port) + 1;

// Define project root (current directory)
const rootDir = __dirname;

// === PORT POLICY ===
// John: "if parallel worktrees need port 3000 and it's already being used
// then use next available port." This used to force-kill whatever process
// was listening on 3000 before binding -- with many parallel agent
// worktrees each launching their own copy of this server, every startup
// murdered every other running instance (including the main checkout's),
// causing a full day of stale-server whack-a-mole. Now: if the preferred
// port is busy, fall through to the next free one (see tryListen at the
// bottom of this file). Nothing gets killed.

// === LIVE RELOAD SYSTEM ===
let wss;
try {
  wss = new WebSocketServer({ port: WS_PORT });
  wss.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log(`[Live Reload] Port ${WS_PORT} is busy. Live reload will be disabled for this session.`);
      wss = null;
    } else {
      console.error('[Live Reload] Server error:', e);
    }
  });
  console.log(`Live Reload Server running on port ${WS_PORT}`);
} catch (e) {
  console.log(`[Live Reload] Failed to initialize: ${e.message}`);
}

// Broadcast reload to all connected clients
const broadcastReload = () => {
  if (!wss) return;
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send('reload');
  });
};

// Watch for file changes (Debounced)
// Top-level dirs whose changes must NEVER trigger a live reload: generated
// reports, runtime status files, test artifacts, build output. The recursive
// root watch (watchDir(rootDir)) would otherwise reload on every data/ write —
// e.g. data/bg-health.json is rewritten every ~30s by the CieloVista Tools
// extension, causing an endless "Reloading clients..." loop (#221).
const RELOAD_IGNORE_DIRS = new Set([
  '.git', 'node_modules', '.vscode',
  // 'tests' itself (not just its output dirs below) -- a spec file changing
  // has no bearing on what's rendered in the browser, and Windows'
  // recursive fs.watch is well-documented to fire spurious 'change' events
  // for files that were merely READ/stat'd, not modified. Running
  // `npx playwright test` does a full discovery pass that reads every
  // .spec.ts file under tests/ -- each run was spuriously triggering a
  // full-page reload (and full module re-fetch) per file, even though none
  // of their mtimes had actually changed. Confirmed live: a burst of
  // "[File Changed] tests\components\*.spec.ts" messages during test runs,
  // none of which had been edited (user-reported, read as "bogged down
  // network").
  'tests',
  'data', 'test-results', 'playwright-report', '.playwright-artifacts',
  'coverage', 'dist', 'out',
]);
let reloadTimeout;
const triggerReload = (eventType, filename) => {
  if (!filename) return;
  // Normalize separators so the checks work identically on Windows + POSIX.
  const normalized = filename.replace(/\\/g, '/');
  // Ignore temp files and anything inside a generated/runtime/build directory.
  if (normalized.includes('.tmp')) return;
  if (normalized.split('/').some(seg => RELOAD_IGNORE_DIRS.has(seg))) return;

  clearTimeout(reloadTimeout);
  // 100ms wasn't enough to coalesce a burst of several real changes (e.g. a
  // bulk edit/generation script touching a dozen files a few hundred ms
  // apart) into one reload -- each spilled out as its own separate full
  // page reload. 400ms absorbs realistic burst gaps while still feeling
  // instant for a single edit.
  reloadTimeout = setTimeout(() => {
    console.log(`[File Changed] ${filename} -> Reloading clients...`);
    broadcastReload();
  }, 400);
};

// Watch specific directories safely (CI/runners may not support recursive fs.watch)
const setupPerDirWatch = (root) => {
  const stack = [root];
  while (stack.length) {
    const cur = stack.pop();
    try {
      fs.watch(cur, triggerReload).on('error', () => {});
    } catch (e) {
      // ignore individual watch errors
    }

    let entries = [];
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch (e) {
      continue;
    }

    for (const ent of entries) {
      if (ent.isDirectory()) stack.push(path.join(cur, ent.name));
    }
  }
};

const watchDir = (dir) => {
  if (!fs.existsSync(dir)) return;

  // Allow consumers (CI) to disable watching entirely
  if (process.env.CI === 'true' || process.env.DISABLE_WATCH === 'true') {
    console.log(`[Watch] skipping fs.watch for ${dir} (CI or DISABLE_WATCH)`);
    return;
  }

  // Prefer native recursive watch when available (Windows/macOS). If it fails, fall back.
  try {
    const w = fs.watch(dir, { recursive: true }, triggerReload);
    w.on('error', (err) => {
      console.warn(`[Watch] recursive fs.watch failed for ${dir}: ${err && err.message}. falling back to per-dir watchers.`);
      setupPerDirWatch(dir);
    });
    return;
  } catch (err) {
    console.warn(`[Watch] recursive fs.watch not supported for ${dir}: ${err && err.message}. falling back to per-dir watchers.`);
  }

  // Fallback: walk the tree and attach non-recursive watchers (cross-platform)
  setupPerDirWatch(dir);
};

['pages', 'src', 'config', 'public'].forEach(d => watchDir(path.join(rootDir, d)));
watchDir(rootDir); // Watch root for index.html changes

// CORS - Allow cross-origin requests from dev servers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Request logging (for debugging)
app.use((req, res, next) => {
  if (req.path.endsWith('.js')) {
    res.on('finish', () => {
      if (res.statusCode !== 304) {
          const referer = req.headers['referer'] || 'unknown';
          console.log(`[Request] ${req.method} ${req.path} (${res.statusCode}) [Referer: ${referer}]`);
      }
    });
  }
  next();
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start WebSocket Server (Optional)
const ENABLE_COLLAB = process.env.ENABLE_COLLAB === 'true';

if (ENABLE_COLLAB) {
  const wss = new WebSocketServer({ port: WS_PORT });

  wss.on('connection', (ws) => {
    console.log('Client connected to collaboration server');
    
    ws.on('message', (message) => {
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === ws.OPEN) {
          client.send(message);
        }
      });
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
}

// Middleware
app.use(compression());
const isProduction = process.env.NODE_ENV === 'production';
const cacheConfig = isProduction ? {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
} : {
  maxAge: '0', // Disable cache for development
  setHeaders: (res, filePath) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
};
// Serve wb-models for schema viewer
app.use('/src/wb-models', express.static(path.join(rootDir, 'src', 'wb-models'), cacheConfig));
// Auto-wrap /pages/*.html when accessed directly (Browser Navigation)
// This allows "pure" HTML fragments in /pages/ to be viewed standalone
app.get('/pages/:page', (req, res, next) => {
  const pageName = req.params.page;
  if (!pageName.endsWith('.html')) return next();

  // Detect direct browser navigation vs SPA fetch
  // Sec-Fetch-Mode: 'navigate' is the modern standard
  // Fallback: Check Accept header for text/html
  const isNavigation = req.headers['sec-fetch-mode'] === 'navigate' || 
                       (req.headers['accept'] && req.headers['accept'].includes('text/html'));

  if (isNavigation) {
    const filePath = path.join(rootDir, 'pages', pageName);
    
    // Security: Ensure we don't traverse out of pages dir (though express params usually prevent slashes)
    if (pageName.includes('/') || pageName.includes('\\')) return next();

    // Read config/site.json to support dynamic theme/title
    let theme = 'dark';
    let siteName = 'WB Site';
    
    try {
      const configPath = path.join(rootDir, 'config', 'site.json');
      if (fs.existsSync(configPath)) {
        const siteConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        // Support both old schema (site.theme) and new schema (branding.colorTheme)
        if (siteConfig.site) {
             theme = siteConfig.site.theme || theme;
             siteName = siteConfig.site.name || siteName;
        } else if (siteConfig.branding) {
             theme = siteConfig.branding.colorTheme || theme;
             siteName = siteConfig.branding.companyName || siteName;
        }
      }
    } catch (e) {
      console.warn('Failed to read dynamic site config:', e);
    }

    fs.readFile(filePath, 'utf8', (err, content) => {
      if (err) return next(); // File not found, pass to static handler

      // #486: pages/*.html fragments are written root-relative (no leading
      // "/" or "../") in href/src -- correct for their PRODUCTION consumer,
      // the SPA shell, which fetches the fragment and injects it via
      // innerHTML at the site root (src/core/site-engine.js loadPage()), so
      // a root-relative URL resolves against the shell's own document base.
      // This standalone wrap is a DIFFERENT consumer with a DIFFERENT base:
      // the fragment's raw markup (including any embedded <link>/<script>
      // tags) is dropped into a page actually served AT /pages/<name>.html,
      // so that same root-relative URL instead resolves against /pages/ and
      // 404s (confirmed live: pages/behaviors.html's own
      // "src/styles/pages/behaviors.css" link resolved to
      // /pages/src/styles/pages/behaviors.css here, so the page's dedicated
      // stylesheet silently never loaded under direct navigation, even
      // though the exact same markup is correct once injected by the shell).
      // Rewrite root-relative resource refs to domain-root-absolute ONLY in
      // this wrap (matching how themes.css/site.css above are already
      // loaded absolute) -- the source file on disk stays root-relative,
      // correct for its real production consumer.
      //
      // #542: the original #486 fix only listed native tag names, so
      // <wb-audio src="demos/sample.wav"> (pages/home.html) never matched --
      // <wb-audio isn't <audio -- and stayed unrewritten, 404ing under this
      // standalone wrap (confirmed by dark-mode.spec.ts, which navigates
      // directly here) while working fine via the real SPA-injection
      // consumer. Added a generic wb-[a-z0-9-]+ alternative so every
      // src/href-bearing <wb-*> component (wb-audio, wb-avatar, wb-cardimage,
      // wb-cardvideo today, any future one) is covered, not just today's
      // known offenders.
      const RESOURCE_REF = /(<(?:link|script|img|source|audio|video|wb-[a-z0-9-]+)\b[^>]*?\b(?:href|src)\s*=\s*")([^"]+)(")/gi;
      const rewritten = content.replace(RESOURCE_REF, (full, pre, ref, post) => {
        if (/^(https?:|data:|mailto:|#|\/)/i.test(ref) || ref.startsWith('//')) return full;
        return pre + '/' + ref + post;
      });

      const wrapped = `<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageName.replace('.html', '')} - ${siteName}</title>
  <link rel="stylesheet" href="/src/styles/themes.css">
  <link rel="stylesheet" href="/src/styles/site.css">
  <script type="module">
    import WB from '/src/core/wb-lazy.js';
    // Mirror scripts/generate-site.mjs's production init exactly (#374) --
    // the dev server used to call bare WB.init(), which scans lazily
    // (IntersectionObserver-gated). Production has always scanned eagerly,
    // so any x-* behavior below the fold (e.g. Lightbox in
    // pages/behaviors.html's Overlays section) silently never activated in
    // local dev while working fine once deployed -- clicking did nothing,
    // with no console error, because the click handler was simply never
    // attached yet.
    await WB.init({ autoInject: true });
    await WB.scan(document.body, { eager: true });
  </script>
  <!-- Live Reload Client -->
  <script>
    (function() {
      const ws = new WebSocket('ws://' + window.location.hostname + ':3001');
      ws.onmessage = (msg) => {
        if (msg.data === 'reload') window.location.reload();
      };
      console.log('Live Reload connected');
    })();
  </script>
</head>
<body class="site">
  <div class="demo-page">
    ${rewritten}
  </div>
</body>
</html>`;
      res.send(wrapped);
    });
  } else {
    // It's an SPA fetch (or other asset request), serve raw file
    next();
  }
});

// ============================================
// DOCS MARKDOWN ROUTE - Convert .md to HTML
// Intercepts /docs/*.md requests before static
// ============================================
app.use((req, res, next) => {
  if (!req.path.startsWith('/docs/') || !req.path.endsWith('.md')) return next();
  if (req.method !== 'GET') return next();

  // Security: prevent path traversal
  const safePath = path.normalize(req.path).replace(/^(\.\.[/\\])+/, '');
  const fullPath = path.join(rootDir, safePath);

  // Ensure path stays within project
  if (!fullPath.startsWith(rootDir)) {
    return res.status(403).send('Access denied');
  }

  if (!fs.existsSync(fullPath)) {
    return res.status(404).send(`<div class="error-container">
  <h1>Unable to Load Document</h1>
  <p>The file <code>${req.path}</code> was not found.</p>
  <h2>Troubleshooting</h2>
  <ul>
    <li>Check the file path for typos</li>
    <li>Ensure the file exists in the docs directory</li>
    <li>Verify the filename and extension are correct</li>
  </ul>
</div>`);
  }

  try {
    // The server never formats markdown itself — mdhtml (the doc-viewer) does all
    // of it. A DIRECT browser navigation to /docs/x.md (Sec-Fetch-Dest: document)
    // is redirected to the doc-viewer, which renders it themed, highlighted,
    // path-linked, with live <wb-demo>s. Everything else (the doc-viewer's
    // fetch(), tooling, curl) gets the RAW MARKDOWN. Server-side pre-rendering
    // caused a double-parse — mdhtml re-rendered the HTML and collapsed multi-line
    // code blocks (the V3-GUIDE quick-start bug).
    if ((req.get('sec-fetch-dest') || '') === 'document') {
      const rel = req.path.replace(/^\/+/, '');
      return res.redirect(302, '/public/doc-viewer.html?file=' + encodeURIComponent(rel));
    }
    res.type('text/markdown; charset=utf-8').send(fs.readFileSync(fullPath, 'utf8'));
  } catch (err) {
    console.error(`[Docs] Error converting ${req.path}:`, err);
    return res.status(500).send(`<div class="error-container">
  <h1>Unable to Load Document</h1>
  <p>Error reading <code>${req.path}</code>: ${err.message}</p>
  <h2>Troubleshooting</h2>
  <ul>
    <li>The file may be corrupted or unreadable</li>
    <li>Check server logs for details</li>
  </ul>
</div>`);
  }
});

// ============================================
// MARKDOWN API - GET /api/markdown?file=path
// ============================================
app.get('/api/markdown', (req, res) => {
  const file = req.query.file;
  if (!file) {
    return res.status(400).send('<p>Missing <code>file</code> query parameter</p>');
  }

  // Security: prevent path traversal
  const safePath = path.normalize(file).replace(/^(\.\.[/\\])+/, '');
  const fullPath = path.join(rootDir, safePath);

  if (!fullPath.startsWith(rootDir)) {
    return res.status(403).send('Access denied');
  }

  if (!fs.existsSync(fullPath)) {
    return res.status(404).send(`<div class="error-container">
  <h1>Unable to Load Document</h1>
  <p>The file <code>${file}</code> was not found.</p>
  <h2>Troubleshooting</h2>
  <ul>
    <li>Check the file path for typos</li>
    <li>Ensure the file exists</li>
    <li>Verify the filename and extension are correct</li>
  </ul>
</div>`);
  }

  try {
    const mdContent = fs.readFileSync(fullPath, 'utf8');
    const html = marked(mdContent);
    res.type('text/html').send(html);
  } catch (err) {
    console.error(`[API Markdown] Error converting ${file}:`, err);
    res.status(500).send(`<div class="error-container">
  <h1>Unable to Load Document</h1>
  <p>Error reading <code>${file}</code>: ${err.message}</p>
  <h2>Troubleshooting</h2>
  <ul>
    <li>The file may be corrupted or unreadable</li>
    <li>Check server logs for details</li>
  </ul>
</div>`);
  }
});

// ============================================
// MARKDOWN API - POST /api/markdown (raw MD)
// ============================================
app.post('/api/markdown', express.text({ type: '*/*' }), (req, res) => {
  try {
    const html = marked.parse(req.body || '');
    res.type('text/html').send(html);
  } catch (err) {
    res.status(500).send('Markdown conversion error');
  }
});

app.use(express.static(rootDir, cacheConfig));
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb' }));

// Special Routes for HTML files in public/
//
// `root` is passed explicitly (not folded into an absolute path via
// path.join) because `send` (Express's sendFile backend) runs its dotfile
// security check against every segment of whatever path it's given when no
// `root` option is present -- including the server's own ancestor
// directories. Any checkout living under a dot-prefixed path (this repo's
// own `.claude/worktrees/<name>/` convention for agent worktrees) then
// 404s on every one of these routes, because `.claude` itself matches the
// check. Passing `root` scopes the check to the relative path under it,
// which is what these routes actually intend.
app.get('/schema-viewer.html', (req, res) => {
  res.sendFile('schema-viewer.html', { root: path.join(rootDir, 'public') });
});

app.get('/fix-viewer.html', (req, res) => {
  res.sendFile('fix-viewer.html', { root: path.join(rootDir, 'public') });
});

app.get('/errors-viewer.html', (req, res) => {
  res.sendFile('errors-viewer.html', { root: path.join(rootDir, 'public') });
});

app.get('/errors-viewer', (req, res) => {
  res.sendFile('errors-viewer.html', { root: path.join(rootDir, 'public') });
});

app.get('/performance-dashboard.html', (req, res) => {
  res.sendFile('performance-dashboard.html', { root: path.join(rootDir, 'public') });
});

app.get('/doc-viewer.html', (req, res) => {
  res.sendFile('doc-viewer.html', { root: path.join(rootDir, 'public') });
});

// API Endpoint to log content issues
app.post("/api/log-issues", (req, res) => {
  const payload = req.body;
  const issuesList = payload.issues || [];
  const logFile = path.join(rootDir, "data", "content-issues.json");
  
  let logs = { lastUpdated: new Date().toISOString(), issues: [] };
  if (fs.existsSync(logFile)) {
    try {
      logs = JSON.parse(fs.readFileSync(logFile, "utf8"));
    } catch (e) {
      console.error("Error reading content-issues.json:", e);
    }
  }
  
  logs.lastUpdated = new Date().toISOString();
  logs.issues = issuesList;
  
  // Ensure directory exists
  const dir = path.dirname(logFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
  
  if (issuesList.length > 0) {
    console.log(`[Server] Logged ${issuesList.length} content issues`);
  }
  res.json({ success: true, count: issuesList.length });
});

// HTMX Demo Endpoint
app.post("/clicked", (req, res) => {
  setTimeout(() => {
    res.send(`
      <button class="wb-btn-gradient" data-tooltip="I was fetched from the server!" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
        ✓ Swapped!
      </button>
    `);
  }, 500); // Artificial delay to show loading state if desired
});

// API Endpoint to save generic data
// Dedicated error-log endpoints (#382): the old approach had error-logger.js
// keep a per-page in-memory `errors` array and POST the WHOLE array to the
// generic /api/save on every new error, which does a blind fs.writeFileSync
// overwrite -- under N concurrent pages (e.g. an 8-worker Playwright run),
// two pages' overwrites race and the second clobbers whatever the first just
// logged (lost-update). Node's request handlers never interleave mid-execution
// as long as a handler stays fully synchronous (no `await` between the read
// and the write) -- so doing the read-modify-write HERE, server-side, in one
// synchronous pass, is naturally atomic per request without needing an
// explicit lock.
const ERROR_LOG_REL_PATH = 'data/errors.json';

function readErrorLog() {
  const fullPath = path.join(rootDir, ERROR_LOG_REL_PATH);
  if (!fs.existsSync(fullPath)) return { errors: [] };
  try {
    const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    return { errors: Array.isArray(parsed.errors) ? parsed.errors : [] };
  } catch {
    return { errors: [] };
  }
}

function writeErrorLog(errors) {
  const fullPath = path.join(rootDir, ERROR_LOG_REL_PATH);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify({
    lastUpdated: new Date().toISOString(),
    count: errors.length,
    errors
  }, null, 2), 'utf8');
}

app.post("/api/error-log/append", (req, res) => {
  try {
    const { error } = req.body;
    if (!error) return res.status(400).json({ error: 'Missing error' });
    const current = readErrorLog();
    const errors = [...current.errors, error].slice(-100);
    writeErrorLog(errors);
    res.json({ success: true, count: errors.length });
  } catch (e) {
    console.error('[Error Log Append]', e);
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/error-log/clear", (req, res) => {
  try {
    writeErrorLog([]);
    res.json({ success: true });
  } catch (e) {
    console.error('[Error Log Clear]', e);
    res.status(500).json({ error: e.message });
  }
});

// Dedicated notes-append endpoint (#382-class fix) -- notes.js used to fetch
// data/notes.json, append client-side, then POST the whole array back via
// the generic /api/save (a blind overwrite). Under concurrent writers that's
// the exact same lost-update race #382 found in the old error-logger: two
// saves in flight both read the same "before" state, and the second's
// overwrite silently discards the first's append. Doing the read-modify-
// write HERE, synchronously, in one request handler, is atomic per request
// with no explicit lock needed (Node never interleaves a handler that has
// no `await` between its read and its write).
const NOTES_REL_PATH = 'data/notes.json';

function readNotesLog() {
  const fullPath = path.join(rootDir, NOTES_REL_PATH);
  if (!fs.existsSync(fullPath)) return { notes: [] };
  try {
    const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    return { notes: Array.isArray(parsed.notes) ? parsed.notes : [] };
  } catch {
    return { notes: [] };
  }
}

function writeNotesLog(notes) {
  const fullPath = path.join(rootDir, NOTES_REL_PATH);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify({ notes, lastUpdated: new Date().toISOString() }, null, 2), 'utf8');
}

function normalizeNoteContent(str) {
  return String(str).trim().replace(/\r\n/g, '\n').replace(/\s+/g, ' ');
}

// Every saved note becomes a real, tracked GitHub issue -- otherwise notes
// just sit in data/notes.json where nobody reviews them, disconnected from
// the actual issue-tracking workflow. Best-effort: `gh` requiring auth/
// network is common in this environment (this route is dev-server-only
// anyway, same as every other data/*.json-writing route -- there is no
// server on the deployed GitHub Pages site), so a failure here must never
// block the note itself from saving. execFileSync (array args, no shell)
// avoids command injection from arbitrary note text.
// Every note's content starts with notes.js's own auto-generated
// "[date, time] Page: X" (or a bare URL) header line -- useless as an
// issue title (every note's title would read as a timestamp) and not
// itself real content, so a note that's ONLY this header line (the "New"
// button was clicked but nothing was actually typed) isn't a real report.
const HEADER_LINE_RE = /^\[[^\]]+\]\s/;

function createIssueFromNote(note) {
  try {
    const lines = String(note.content).split('\n').map((l) => l.trim()).filter(Boolean);
    const realLines = lines.filter((l) => !HEADER_LINE_RE.test(l));
    if (!realLines.length) return null; // header-only save -- nothing to report

    const title = realLines[0].slice(0, 80);
    const bodyParts = [
      note.content,
      '',
      '---',
      note.page ? `Page: ${note.page}` : null,
      note.selectedElement ? `Element: ${JSON.stringify(note.selectedElement)}` : null,
      `Created: ${note.createdAt}`
    ].filter(Boolean);

    const out = execFileSync(
      'gh',
      ['issue', 'create', '--title', title, '--body', bodyParts.join('\n'), '--label', 'from-notes'],
      { cwd: rootDir, encoding: 'utf8', timeout: 15000 }
    );
    return out.trim(); // gh issue create prints the new issue's URL
  } catch (error) {
    console.warn('[Notes -> Issue] Failed to auto-create issue (note was still saved):', error.message);
    return null;
  }
}

app.post("/api/notes/append", (req, res) => {
  try {
    const { note } = req.body;
    if (!note || !note.content) {
      return res.status(400).json({ error: 'Missing note or note.content' });
    }

    const { notes } = readNotesLog();
    const normalized = normalizeNoteContent(note.content);
    const isDuplicate = notes.some((n) => normalizeNoteContent(n.content) === normalized);
    if (isDuplicate) {
      return res.json({ success: true, duplicate: true, notes });
    }

    // tests/components/notes*.spec.ts drives every notes test against this
    // SAME dev server (demos/test-harness.html), not an isolated instance --
    // without this guard, every test run would spam a real GitHub issue per
    // test note. The test harness is the only real-world caller whose
    // Referer ever contains this path.
    const isTestHarness = (req.headers.referer || '').includes('/demos/test-harness.html');
    const issueUrl = isTestHarness ? null : createIssueFromNote(note);
    note.issueUrl = issueUrl;

    notes.push(note);
    writeNotesLog(notes);
    res.json({ success: true, duplicate: false, notes, issueUrl });
  } catch (error) {
    console.error('[Notes Append Error]', error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/notes", (req, res) => {
  try {
    res.json(readNotesLog());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/save-image", (req, res) => {
  try {
    const { location, dataUrl } = req.body;

    if (!location || !dataUrl) {
      return res.status(400).json({ error: 'Missing location or dataUrl' });
    }

    const match = /^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/.exec(dataUrl);
    if (!match) {
      return res.status(400).json({ error: 'dataUrl must be a base64 image data URL' });
    }

    const safePath = path.normalize(location).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = path.join(rootDir, safePath);

    if (!fullPath.startsWith(rootDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, Buffer.from(match[1], 'base64'));

    console.log(`[Server] Saved image to ${location}`);
    res.json({ success: true, location });
  } catch (error) {
    console.error('[Save Image Error]', error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/save", (req, res) => {
  try {
    const { location, data } = req.body;
    
    if (!location || data === undefined) {
      return res.status(400).json({ error: 'Missing location or data' });
    }

    const safePath = path.normalize(location).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = path.join(rootDir, safePath);
    
    if (!fullPath.startsWith(rootDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const ext = path.extname(fullPath).toLowerCase();
    let content = data;
    
    if (ext === '.json') {
      if (typeof data === 'string') {
        try {
          JSON.parse(data);
          content = data;
        } catch {
          content = JSON.stringify({ data, timestamp: new Date().toISOString() }, null, 2);
        }
      } else {
        content = JSON.stringify(data, null, 2);
      }
    }

    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, content, 'utf8');
    
    console.log(`[Server] Saved data to ${location}`);
    res.json({ success: true, message: `Saved to ${location}` });
  } catch (error) {
    console.error('[Save Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// API Endpoint to run performance tests
app.post("/api/run-perf-tests", (req, res) => {
  console.log('[Server] Starting performance tests...');
  
  // Set a long timeout for the request if possible, though client-side timeout matters more
  req.setTimeout(300000); // 5 minutes

  exec('npm run test:performance', { cwd: rootDir }, (error, stdout, stderr) => {
    // Note: error will be non-null if tests fail (exit code 1), which is expected for failed tests
    console.log('[Server] Tests finished');
    if (error) {
      console.log(`[Server] Test command exit code: ${error.code}`);
    }
    
    // We return success even if tests "failed" because we want to show the results
    res.json({ 
      success: true, 
      output: stdout,
      details: stderr,
      exitCode: error ? error.code : 0
    });
  });
});

// API Endpoint to rename a page
app.post("/api/rename-page", (req, res) => {
  const { oldName, newName } = req.body;

  if (!oldName || !newName) {
    return res.status(400).json({ error: 'Missing oldName or newName' });
  }

  // Sanitize names (simple check)
  const safeOld = path.basename(oldName, '.html');
  const safeNew = path.basename(newName, '.html');

  const oldHtmlPath = path.join(rootDir, 'pages', `${safeOld}.html`);
  const newHtmlPath = path.join(rootDir, 'pages', `${safeNew}.html`);
  const oldJsonPath = path.join(rootDir, 'data', 'pages', `${safeOld}.json`);
  const newJsonPath = path.join(rootDir, 'data', 'pages', `${safeNew}.json`);

  if (!fs.existsSync(oldHtmlPath)) {
    return res.status(404).json({ error: `Page ${safeOld}.html not found` });
  }

  if (fs.existsSync(newHtmlPath)) {
    return res.status(409).json({ error: `Page ${safeNew}.html already exists` });
  }

  try {
    // Rename HTML file
    fs.renameSync(oldHtmlPath, newHtmlPath);
    console.log(`[Server] Renamed page: ${safeOld}.html -> ${safeNew}.html`);

    // Rename JSON data file if it exists
    if (fs.existsSync(oldJsonPath)) {
      fs.renameSync(oldJsonPath, newJsonPath);
      console.log(`[Server] Renamed data: ${safeOld}.json -> ${safeNew}.json`);
    }

    res.json({ success: true, message: `Renamed ${safeOld} to ${safeNew}` });
  } catch (error) {
    console.error('[Rename Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// Fallback - serve index.html for SPA routes
app.use((req, res, next) => {
  const staticExtensions = ['.js', '.css', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.map'];
  const ext = path.extname(req.path).toLowerCase();

  // Allow .json files from /src/wb-models/ to be served
  if (ext === '.json' && req.path.startsWith('/src/wb-models/')) {
    return res.sendFile(path.join(rootDir, req.path));
  }

  if (staticExtensions.includes(ext)) {
    return res.status(404).send(`File not found: ${req.path}`);
  }

  // Explicit .html file requests must point at a real file. Falling back to the
  // SPA shell (index.html) for a MISSING .html masked broken links — they
  // returned 200 with the home page instead of 404, so neither users nor tests
  // could tell the page didn't exist. (#125 follow-up)
  if (ext === '.html') {
    const filePath = path.join(rootDir, req.path);
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    return res.status(404).send(`File not found: ${req.path}`);
  }

  res.sendFile(path.join(rootDir, 'index.html'));
});

// Bind to the preferred port, falling through to the next free one when
// it's taken (up to +20) instead of killing the current occupant -- see the
// PORT POLICY comment at the top of this file.
function tryListen(p, attemptsLeft) {
  const server = app.listen(p, () => onListening(p));
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      console.log(`[port] :${p} in use -- trying :${p + 1}`);
      tryListen(p + 1, attemptsLeft - 1);
    } else {
      throw err;
    }
  });
}

function onListening(p) {
  console.log(`WB Starter running at http://localhost:${p}`);
  if (ENABLE_COLLAB) {
    console.log(`Collab Server running at ws://localhost:${WS_PORT}/collab`);
  } else {
    console.log(`Collab Server disabled. To enable: set ENABLE_COLLAB=true`);
  }

  // Open the site in the default browser on `npm start`. Skipped in CI and when
  // WB_NO_OPEN=1 (set by Playwright's webServer) so tests never pop a browser.
  if (!process.env.CI && process.env.WB_NO_OPEN !== '1') {
    const url = `http://localhost:${p}`;
    const cmd = process.platform === 'win32' ? `start "" "${url}"`
      : process.platform === 'darwin' ? `open "${url}"`
      : `xdg-open "${url}"`;
    exec(cmd, (err) => {
      if (err) console.log(`Open your browser at ${url} (auto-open failed: ${err.message})`);
    });
  }
}

tryListen(port, 20);
