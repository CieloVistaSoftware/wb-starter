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
      wss = null;
    }
  });
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
  // Ignore git, node_modules, data folder, and temp files
  if (filename.includes('.git') || filename.includes('node_modules') || filename.includes('.tmp') || filename.includes('data/') || filename.includes('data\\') || filename.startsWith('data')) return;
  
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

// === SUBMISSIONS WATCHER ===
// Each paragraph in a submission = one issue (split by blank lines)
// Broadcasts notification via WebSocket when new issue detected
const submissionsPath = path.join(rootDir, 'data', 'issues.json');
const pendingIssuesPath = path.join(rootDir, 'data', 'pending-issues.json');

const broadcastNewIssue = (issue) => {
  if (!wss) return;
  try {
    const desc = String((issue && (issue.description || issue.content || '')) || '').trim();
    const action = desc.substring(0, 100) + (desc.length > 100 ? '...' : '');
    const message = JSON.stringify({
      type: 'claude-response',
      data: {
        status: 'info',
        issue: '📝 Issue Received',
        action
      }
    });
    wss.clients.forEach(client => {
      if (client.readyState === 1) client.send(message);
    });
  } catch (e) {
    console.warn('[Broadcast New Issue] failed to send message', e && e.message);
  }
};

// Normalize description for duplicate checking
const normalizeDescription = (desc) => {
  return (desc || '').trim().toLowerCase().replace(/\s+/g, ' ');
};

const extractIssuesFromSubmissions = () => {
  try {
    if (!fs.existsSync(submissionsPath)) return;
    
    const submissionsData = JSON.parse(fs.readFileSync(submissionsPath, 'utf8'));
    const submissions = submissionsData.submissions || [];
    const issues = [];
    
    submissions.forEach(submission => {
      // Skip Claude responses
      if (submission.isClaudeResponse) return;
      
      // Remove timestamp line first
      const content = (submission.content || '')
        .split('\n')
        .filter(line => !line.match(/^\[.*?\]\s*(http|Page:)/i))
        .join('\n')
        .trim();
      
      // Split by double newlines (paragraphs)
      const paragraphs = content.split(/\n\s*\n/).map(p => p.trim()).filter(p => p);
      
      paragraphs.forEach((para, idx) => {
        issues.push({
          id: `${submission.id}-p${idx}`,
          description: para,
          status: 'pending',
          createdAt: submission.createdAt
        });
      });
    });
    
    // Read existing
    let existing = { issues: [], lastUpdated: null };
    if (fs.existsSync(pendingIssuesPath)) {
      try { existing = JSON.parse(fs.readFileSync(pendingIssuesPath, 'utf8')); } catch (e) {}
    }
    
    // Build set of existing IDs AND normalized descriptions for duplicate check
    const existingIds = new Set(existing.issues.map(i => i.id));
    const existingDescriptions = new Set(existing.issues.map(i => normalizeDescription(i.description)));
    
    // Filter out duplicates by ID or description content
    const newIssues = issues.filter(i => {
      const normalizedDesc = normalizeDescription(i.description);
      // Skip if ID exists OR if same description already exists
      if (existingIds.has(i.id) || existingDescriptions.has(normalizedDesc)) {
        return false;
      }
      // Add to set to prevent duplicates within the same batch
      existingDescriptions.add(normalizedDesc);
      return true;
    });
    
    if (newIssues.length > 0) {
      existing.issues.push(...newIssues);
      existing.lastUpdated = new Date().toISOString();
      fs.writeFileSync(pendingIssuesPath, JSON.stringify(existing, null, 2));
      
      // Broadcast each new issue via WebSocket
      newIssues.forEach(issue => broadcastNewIssue(issue));
      console.log(`  \x1b[33m●\x1b[0m ${newIssues.length} issue(s) received`);
    }
  } catch (e) {
    console.error('[Issue Watcher] Error:', e.message);
  }
};

// Watch issues.json specifically
if (fs.existsSync(path.join(rootDir, 'data'))) {
  fs.watch(path.join(rootDir, 'data'), (eventType, filename) => {
    if (filename === 'issues.json') {
      console.log('[Issue Watcher] issues.json changed, scanning for issues...');
      setTimeout(extractIssuesFromSubmissions, 100); // Debounce
    }
  });
}

// === CLAUDE STATUS UPDATES ===
// Real-time status broadcasting for Claude's work
const claudeStatusPath = path.join(rootDir, 'data', 'claude-status.json');

const broadcastClaudeStatus = (status) => {
  if (!wss) return;
  const message = JSON.stringify({
    type: 'claude-status',
    data: status
  });
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(message);
  });
};

// Watch claude-status.json for live updates
if (fs.existsSync(path.join(rootDir, 'data'))) {
  fs.watch(path.join(rootDir, 'data'), (eventType, filename) => {
    if (filename === 'claude-status.json') {
      try {
        const data = JSON.parse(fs.readFileSync(claudeStatusPath, 'utf8'));
        if (data.status) {
          broadcastClaudeStatus(data);
          console.log(`[Claude] Status: ${data.status} - ${data.message || ''}`);
        }
      } catch (e) {}
    }
  });
}

// === CLAUDE RESPONSE NOTIFICATIONS ===
// Watch claude-responses.json and broadcast via WebSocket, then clear
const claudeResponsesPath = path.join(rootDir, 'data', 'claude-responses.json');

const broadcastClaudeResponse = (response) => {
  if (!wss) return;
  const message = JSON.stringify({
    type: 'claude-response',
    data: response
  });
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(message);
  });
  console.log(`[Claude] Broadcasted: ${response.status === 'success' ? '✅' : '❌'} ${response.issue.substring(0, 40)}...`);
};

// Watch for claude response changes - broadcast then clear
if (fs.existsSync(path.join(rootDir, 'data'))) {
  fs.watch(path.join(rootDir, 'data'), (eventType, filename) => {
    if (filename === 'claude-responses.json') {
      try {
        const data = JSON.parse(fs.readFileSync(claudeResponsesPath, 'utf8'));
        const responses = data.responses || [];
        if (responses.length > 0) {
          // Broadcast all responses
          responses.forEach(resp => broadcastClaudeResponse(resp));
          
          // Clear responses after broadcasting
          fs.writeFileSync(claudeResponsesPath, JSON.stringify({ responses: [], lastUpdated: new Date().toISOString() }, null, 2));
        }
      } catch (e) {}
    }
  });
}

// Request logging - disabled for cleaner output
// Uncomment for debugging
/*
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
*/

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

// Request logging for API endpoints (development helper)
app.use((req, res, next) => {
  if (req.path && req.path.startsWith('/api')) {
    const ct = req.headers['content-type'] || '';
    const accept = req.headers['accept'] || '';
    console.log(`[API Request] ${req.method} ${req.path} content-type=${ct} accept=${accept}`);
  }
  next();
});

// Convert body-parser JSON parse errors to JSON responses (avoid HTML error page)
app.use((err, req, res, next) => {
  if (err && (err.type === 'entity.parse.failed' || err instanceof SyntaxError)) {
    console.error('[Request Parse Error]', err.message);
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  next(err);
});

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

app.get('/claude-status.html', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'claude-status.html'));
});

// API Endpoint to post Claude's fix response back to submissions
app.post("/api/claude-response", (req, res) => {
  try {
    const { issueId, status, message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Missing message' });
    }
    
    const submissionsPathLocal = path.join(rootDir, 'data', 'issues.json');
    let submissionsData = { submissions: [], lastUpdated: null };
    
    if (fs.existsSync(submissionsPathLocal)) {
      try { submissionsData = JSON.parse(fs.readFileSync(submissionsPathLocal, 'utf8')); } catch (e) {}
    }
    
    // Add Claude's response as a new submission
    const responseSubmission = {
      id: 'claude-' + Date.now(),
      content: `[CLAUDE ${status === 'success' ? '✅' : '❌'}] ${message}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isClaudeResponse: true,
      status: status // 'success' or 'error'
    };
    
    submissionsData.submissions.unshift(responseSubmission); // Add to top
    submissionsData.lastUpdated = new Date().toISOString();
    
    fs.writeFileSync(submissionsPathLocal, JSON.stringify(submissionsData, null, 2));
    
    console.log(`[Claude Response] ${status === 'success' ? '✅' : '❌'} ${message.substring(0, 50)}...`);
    res.json({ success: true, submission: responseSubmission });
  } catch (error) {
    console.error('[Claude Response Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// API Endpoint to update issue status
app.post("/api/update-issue", (req, res) => {
  try {
    const { issueId, status, resolution } = req.body;
    
    if (!issueId || !status) {
      return res.status(400).json({ error: 'Missing issueId or status' });
    }
    
    const pendingIssuesPath = path.join(rootDir, 'data', 'pending-issues.json');
    
    if (!fs.existsSync(pendingIssuesPath)) {
      return res.status(404).json({ error: 'No pending issues file found' });
    }
    
    const data = JSON.parse(fs.readFileSync(pendingIssuesPath, 'utf8'));
    const issue = data.issues.find(i => i.id === issueId);
    
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    issue.status = status;
    if (status === 'resolved' || status === 'fixed') {
      // When Claude marks as fixed, set to pending-review for user approval
      issue.status = 'pending-review';
      issue.claimedFixedAt = new Date().toISOString();
      issue.resolution = resolution || 'Fixed by Claude';
    } else if (status === 'approved') {
      // User approved the fix
      issue.status = 'resolved';
      issue.resolvedAt = new Date().toISOString();
    } else if (status === 'rejected') {
      // User rejected the fix, back to pending
      issue.status = 'pending';
      issue.claimedFixedAt = null;
      issue.resolution = null;
    }
    
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(pendingIssuesPath, JSON.stringify(data, null, 2));
    
    console.log(`[Issue Update] ${issueId} -> ${status}`);
    res.json({ success: true, issue });
  } catch (error) {
    console.error('[Issue Update Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// API Endpoint to get pending issues
app.get("/api/pending-issues", (req, res) => {
  try {
    const pendingIssuesPath = path.join(rootDir, 'data', 'pending-issues.json');
    
    if (!fs.existsSync(pendingIssuesPath)) {
      return res.json({ issues: [], lastChecked: null, lastUpdated: null });
    }
    
    const data = JSON.parse(fs.readFileSync(pendingIssuesPath, 'utf8'));
    
    // Dedupe issues by normalized description (keep first occurrence)
    const seenDescriptions = new Set();
    const dedupedIssues = (data.issues || []).filter(issue => {
      const normalized = normalizeDescription(issue.description);
      if (seenDescriptions.has(normalized)) {
        return false;
      }
      seenDescriptions.add(normalized);
      return true;
    });
    
    // Update lastChecked
    data.lastChecked = new Date().toISOString();
    
    // If duplicates were removed, save the cleaned data
    if (dedupedIssues.length !== data.issues.length) {
      data.issues = dedupedIssues;
      data.lastUpdated = new Date().toISOString();
    }
    
    fs.writeFileSync(pendingIssuesPath, JSON.stringify(data, null, 2));
    
    // If ?all=true, return all issues; otherwise just pending
    if (req.query.all === 'true') {
      res.json({ issues: dedupedIssues, lastUpdated: data.lastUpdated });
    } else {
      const pending = dedupedIssues.filter(i => i.status === 'pending');
      res.json({ issues: pending, total: dedupedIssues.length, lastUpdated: data.lastUpdated });
    }
  } catch (error) {
    console.error('[Pending Issues Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// API Endpoint to update issue details (description and resolution)
app.post("/api/update-issue-details", (req, res) => {
  try {
    const { issueId, description, resolution } = req.body;
    
    if (!issueId) {
      return res.status(400).json({ error: 'Missing issueId' });
    }
    
    const pendingIssuesPath = path.join(rootDir, 'data', 'pending-issues.json');
    
    if (!fs.existsSync(pendingIssuesPath)) {
      return res.status(404).json({ error: 'No pending issues file found' });
    }
    
    const data = JSON.parse(fs.readFileSync(pendingIssuesPath, 'utf8'));
    const issue = data.issues.find(i => i.id === issueId);
    
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    if (description !== undefined) issue.description = description;
    if (resolution !== undefined) issue.resolution = resolution;
    
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(pendingIssuesPath, JSON.stringify(data, null, 2));
    
    console.log(`[Issue Details] ${issueId} updated`);
    res.json({ success: true, issue });
  } catch (error) {
    console.error('[Issue Details Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// API Endpoint to delete a single issue
app.post("/api/delete-issue", (req, res) => {
  try {
    const { issueId } = req.body;
    
    if (!issueId) {
      return res.status(400).json({ error: 'Missing issueId' });
    }
    
    const pendingIssuesPath = path.join(rootDir, 'data', 'pending-issues.json');
    
    if (!fs.existsSync(pendingIssuesPath)) {
      return res.status(404).json({ error: 'No pending issues file found' });
    }
    
    const data = JSON.parse(fs.readFileSync(pendingIssuesPath, 'utf8'));
    const idx = data.issues.findIndex(i => i.id === issueId);
    
    if (idx === -1) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    data.issues.splice(idx, 1);
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(pendingIssuesPath, JSON.stringify(data, null, 2));
    
    console.log(`[Issue Delete] ${issueId} removed`);
    res.json({ success: true });
  } catch (error) {
    console.error('[Issue Delete Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// API Endpoint to clear all resolved issues
app.post("/api/clear-resolved-issues", (req, res) => {
  try {
    const pendingIssuesPath = path.join(rootDir, 'data', 'pending-issues.json');
    
    if (!fs.existsSync(pendingIssuesPath)) {
      return res.json({ success: true, cleared: 0 });
    }
    
    const data = JSON.parse(fs.readFileSync(pendingIssuesPath, 'utf8'));
    const originalCount = data.issues.length;
    
    // Identify resolved issues to clear
    const resolvedIssues = data.issues.filter(i => i.status === 'resolved');
    const resolvedIds = new Set(resolvedIssues.map(i => i.id));

    // Remove resolved from pending list
    data.issues = data.issues.filter(i => i.status !== 'resolved');
    const cleared = originalCount - data.issues.length;

    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(pendingIssuesPath, JSON.stringify(data, null, 2));

    // Also remove originating submissions for resolved issues (to prevent them being re-parsed)
    try {
      const subsPath = path.join(rootDir, 'data', 'issues.json');
      if (fs.existsSync(subsPath)) {
        const subsData = JSON.parse(fs.readFileSync(subsPath, 'utf8'));
        const remainingSubmissions = (subsData.submissions || []).filter(sub => {
          // If any resolved issue is derived from this submission, remove the submission
          const derivedIdPrefix = `${sub.id}-p`;
          const hasResolved = resolvedIssues.some(ri => ri.id.startsWith(derivedIdPrefix));
          return !hasResolved;
        });
        if (remainingSubmissions.length !== (subsData.submissions || []).length) {
          subsData.submissions = remainingSubmissions;
          subsData.lastUpdated = new Date().toISOString();
          fs.writeFileSync(subsPath, JSON.stringify(subsData, null, 2));
          // Re-run extraction to ensure no re-adding
          extractIssuesFromSubmissions();
        }
      }
    } catch (e) {
      console.warn('[Issue Clear] Failed to prune originating submissions:', e && e.message);
    }

    console.log(`[Issue Clear] ${cleared} resolved issues removed`);
    res.json({ success: true, cleared });
  } catch (error) {
    console.error('[Issue Clear Error]', error);
    res.status(500).json({ error: error.message });
  }
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

// API Endpoint to add a single user issue submission to data/issues.json and trigger parsing
app.post('/api/add-issue', (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Missing content' });

    const submissionsPathLocal = path.join(rootDir, 'data', 'issues.json');
    let submissionsData = { submissions: [], lastUpdated: null };

    if (fs.existsSync(submissionsPathLocal)) {
      try { submissionsData = JSON.parse(fs.readFileSync(submissionsPathLocal, 'utf8')); } catch (e) {
        // If file is a legacy single object, convert it into submissions array
        try {
          const raw = JSON.parse(fs.readFileSync(submissionsPathLocal, 'utf8'));
          if (raw && typeof raw === 'object') {
            submissionsData = { submissions: [ raw ], lastUpdated: new Date().toISOString() };
          }
        } catch (err) {
          submissionsData = { submissions: [], lastUpdated: null };
        }
      }
    }

    const now = new Date().toISOString();
    const submission = {
      id: `note-${Date.now()}`,
      content: content,
      createdAt: now,
      updatedAt: now,
      isClaudeResponse: false
    };

    submissionsData.submissions = submissionsData.submissions || [];
    submissionsData.submissions.unshift(submission);
    submissionsData.lastUpdated = now;

    // Ensure dir
    const dir = path.dirname(submissionsPathLocal);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(submissionsPathLocal, JSON.stringify(submissionsData, null, 2), 'utf8');

    // Immediately parse and add to pending-issues.json by reusing extractIssuesFromSubmissions
    try { extractIssuesFromSubmissions(); } catch (e) { console.warn('[Add Issue] extractIssuesFromSubmissions failed', e); }

    // Broadcast a quick notification
    broadcastNewIssue(submission);

    res.json({ success: true, submission });
  } catch (error) {
    console.error('[Add Issue Error]', error);
    res.status(500).json({ error: error.message });
  }
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
    
    // Only log non-routine saves
    if (!location.includes('errors.json')) {
      console.log(`  \x1b[32m✓\x1b[0m Saved: ${location}`);
    }
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
  console.log('');
  console.log('  \x1b[32m\x1b[1m WB Starter \x1b[0m');
  console.log('');
  console.log('  \x1b[2m-\x1b[0m Local:    \x1b[36mhttp://localhost:' + port + '\x1b[0m');
  console.log('  \x1b[2m-\x1b[0m WebSocket: \x1b[36mws://localhost:' + WS_PORT + '\x1b[0m');
  console.log('');
  if (wss) {
    console.log('  \x1b[32m●\x1b[0m Live Reload enabled');
    console.log('  \x1b[32m●\x1b[0m Claude Notify enabled');
  }
  console.log('  \x1b[32m●\x1b[0m Issue Watcher enabled');
  console.log('');
  console.log('  \x1b[2mPress Ctrl+C to stop\x1b[0m');
  console.log('');
});
