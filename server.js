const fs = require('fs');
const path = require('path');
const express = require('express');
const compression = require('compression');
const WebSocket = require('ws');
const { exec } = require('child_process');
const app = express();
const port = process.env.PORT || 3000;
const WS_PORT = 3001;

// Define project root (current directory)
const rootDir = __dirname;

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

// Start WebSocket Server (Optional)
const ENABLE_COLLAB = process.env.ENABLE_COLLAB === 'true';

if (ENABLE_COLLAB) {
  const wss = new WebSocket.Server({ port: WS_PORT });

  wss.on('connection', (ws) => {
    console.log('Client connected to collaboration server');
    
    ws.on('message', (message) => {
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
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
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
} : {
  maxAge: '0', // Disable cache for development
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
};

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
  
  console.log(`[Server] Logged ${issuesList.length} content issues`);
  res.json({ success: true, count: issuesList.length });
});

// HTMX Demo Endpoint
app.post("/clicked", (req, res) => {
  setTimeout(() => {
    res.send(`
      <button class="wb-btn-gradient" data-wb="ripple tooltip" data-tooltip="I was fetched from the server!" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
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

// Fallback - serve index.html for SPA routes
app.use((req, res, next) => {
  const staticExtensions = ['.js', '.css', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.map'];
  const ext = path.extname(req.path).toLowerCase();
  
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