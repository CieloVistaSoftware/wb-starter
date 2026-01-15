import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import compression from 'compression';
import { WebSocketServer } from 'ws';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const WS_PORT = 3001;

// Define project root (current directory)
const rootDir = __dirname;

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
let reloadTimeout;
const triggerReload = (eventType, filename) => {
  if (!filename) return;
  // Ignore git, node_modules, and temp files
  if (filename.includes('.git') || filename.includes('node_modules') || filename.includes('.tmp')) return;
  
  clearTimeout(reloadTimeout);
  reloadTimeout = setTimeout(() => {
    console.log(`[File Changed] ${filename} -> Reloading clients...`);
    broadcastReload();
  }, 100);
};

// Watch specific directories recursively
const watchDir = (dir) => {
  if (fs.existsSync(dir)) {
    fs.watch(dir, { recursive: true }, triggerReload);
  }
};

['pages', 'src', 'config', 'public'].forEach(d => watchDir(path.join(rootDir, d)));
watchDir(rootDir); // Watch root for index.html changes

// Request logging (for debugging)
app.use((req, res, next) => {
  if (req.path.endsWith('.js')) {
    res.on('finish', () => {
      if (res.statusCode !== 304) {
        console.log(`[Request] ${req.method} ${req.path} (${res.statusCode})`);
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
    WB.init();
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
  <style>body { padding: 2rem; max-width: 1200px; margin: 0 auto; }</style>
</head>
<body class="site">
  ${content}
</body>
</html>`;
      res.send(wrapped);
    });
  } else {
    // It's an SPA fetch (or other asset request), serve raw file
    next();
  }
});

app.use(express.static(rootDir, cacheConfig));
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb' }));

// Special Routes for HTML files in public/
app.get('/builder.html', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'builder.html'));
});

app.get('/schema-viewer.html', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'schema-viewer.html'));
});

app.get('/fix-viewer.html', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'fix-viewer.html'));
});

app.get('/errors-viewer.html', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'errors-viewer.html'));
});

app.get('/performance-dashboard.html', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'performance-dashboard.html'));
});

app.get('/doc-viewer.html', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'doc-viewer.html'));
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

  res.sendFile(path.join(rootDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`WB Starter running at http://localhost:${port}`);
  if (ENABLE_COLLAB) {
    console.log(`Collab Server running at ws://localhost:${WS_PORT}/collab`);
  } else {
    console.log(`Collab Server disabled. To enable: set ENABLE_COLLAB=true`);
  }
});
