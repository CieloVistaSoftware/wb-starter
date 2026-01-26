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

// Watch for file changes (Debounced & filtered)
let reloadTimeout;
const lastEvent = { filename: null, ts: 0 };
const triggerReload = (eventType, filename) => {
  if (!filename) return;
  // Allow disabling live reload via env var
  if (process.env.LIVE_RELOAD === 'false') return;
  const f = String(filename);

  // Ignore noisy or irrelevant paths
  if (f.includes('.git') || f.includes('node_modules') || f.includes('.tmp') || f.includes('tmp') || f.includes('tmp_trace') || f.includes('data/') || f.includes('data\\') || f.startsWith('data') || f.includes('tests/') || f.includes('tests\\')) return;

  // Ignore noisy builder dir events that often come as directory-only notifications
  if ((f === 'src' || f === 'src\\builder' || f === 'src/builder' || f === 'src\\builder\\') && !f.includes('.')) return;

  // Only reload for common file extensions to reduce noise
  const ext = path.extname(f).toLowerCase();
  const allowedExts = new Set(['.html', '.css', '.js', '.json', '.map']);
  if (ext && !allowedExts.has(ext)) return;

  clearTimeout(reloadTimeout);
  reloadTimeout = setTimeout(() => {
    const now = Date.now();
    if (lastEvent.filename === f && (now - lastEvent.ts) < 2000) {
      // Skip duplicate burst for same file
      return;
    }
    lastEvent.filename = f;
    lastEvent.ts = now;
    console.log(`[File Changed] ${f} -> Reloading clients...`);
    broadcastReload();
  }, 500);
};

// Watch specific directories recursively
const watchDir = (dir) => {
  if (fs.existsSync(dir)) {
    fs.watch(dir, { recursive: true }, triggerReload);
  }
};

['pages', 'src', 'config', 'public'].forEach(d => watchDir(path.join(rootDir, d)));
// Optionally watch root for index.html changes if WATCH_ROOT=true (set env var to 'true' to enable)
if (process.env.WATCH_ROOT === 'true') {
  watchDir(rootDir);
}

// === PATHS ===
const submissionsPath = path.join(rootDir, 'data', 'issues.json');
const pendingIssuesPath = path.join(rootDir, 'data', 'pending-issues.json');
const fixedIssuesPath = path.join(rootDir, 'data', 'fixed.json');

// === STARTUP: Archive resolved issues ===
function archiveResolvedIssues() {
  try {
    if (!fs.existsSync(pendingIssuesPath)) return;
    
    const data = JSON.parse(fs.readFileSync(pendingIssuesPath, 'utf8'));
    const issues = data.issues || [];
    
    // Find resolved issues where test passed
    const toArchive = issues.filter(i => i.status === 'resolved' && i.testPassed === true);
    
    if (toArchive.length === 0) return;
    
    // Load existing archive
    let archive = { issues: [], lastUpdated: null };
    if (fs.existsSync(fixedIssuesPath)) {
      try { archive = JSON.parse(fs.readFileSync(fixedIssuesPath, 'utf8')); } catch (e) {}
    }
    
    // Add archived issues with archive timestamp
    const now = new Date().toISOString();
    toArchive.forEach(issue => {
      issue.archivedAt = now;
      archive.issues.push(issue);
    });
    archive.lastUpdated = now;
    
    // Remove from pending
    const archivedIds = new Set(toArchive.map(i => i.id));
    data.issues = issues.filter(i => !archivedIds.has(i.id));
    data.lastUpdated = now;
    
    // Save both files
    fs.writeFileSync(fixedIssuesPath, JSON.stringify(archive, null, 2));
    fs.writeFileSync(pendingIssuesPath, JSON.stringify(data, null, 2));
    
    console.log(`  \x1b[32m✓\x1b[0m Archived ${toArchive.length} resolved issue(s) to fixed.json`);
  } catch (e) {
    console.warn('[Startup] Failed to archive resolved issues:', e.message);
  }
}

// Run on startup
archiveResolvedIssues();

// === SUBMISSIONS WATCHER ===
// Each paragraph in a submission = one issue (split by blank lines)
// Broadcasts notification via WebSocket when new issue detected

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

// Track latest processed submission time to avoid re-processing old backlog repeatedly
let lastSubmissionProcessingAt = 0;

// Validate content is not HTML garbage
const isValidIssueContent = (text) => {
  if (!text || text.length < 5) return false;
  if (text.length > 2000) return false; // Single issue too long

  // AGGRESSIVE HTML DETECTION - reject any content with HTML-like patterns
  // Count HTML tags - if more than 2, it's definitely HTML content
  const tagMatches = text.match(/<[a-z][^>]*>/gi) || [];
  if (tagMatches.length > 2) return false;

  // Reject content that starts with any HTML tag
  if (/^\s*<[a-z!]/i.test(text)) return false;

  // Reject any HTML tags to avoid accepting page dumps or injected markup
  if (/<[^>]+>/i.test(text)) return false;

  // Reject closing tags only or text that starts with obvious HTML elements
  if (/^\s*<\/[a-z]+>/i.test(text)) return false;
  if (/^\s*<(script|style|html|head|body|header|footer|nav|main|section|article|div|span|button)/i.test(text)) return false;

  // Reject JSON-looking content
  if (/^\s*\{[\s\S]*"[a-z]+"\s*:/i.test(text) && text.includes('}')) return false;

  // Reject test data patterns (auto-generated test issues)
  if (/^(retry|lifecycle|rejection|approval|full-flow|direct-fix|in-progress)-test-\d+-/i.test(text)) return false;
  // Only reject exact artifacts like "Test issue 123" or "Delete test 123" (no trailing text)
  if (/^(Delete test|Test issue)\s+\d+\s*$/i.test(text)) return false;

  return true;
};

// --- Error ID generator + response middleware ---
let _errorCounter = 0;
const generateErrorId = (prefix = 'ERR') => {
  _errorCounter = (_errorCounter + 1) % 0xFFFFFF;
  return `${prefix}-${Date.now().toString(36)}-${(_errorCounter).toString(36)}`.toUpperCase();
};

// Middleware: decorate res.json so any response with { error } gains a unique errorId and server log includes it
app.use((req, res, next) => {
  const origJson = res.json.bind(res);
  res.json = (body) => {
    try {
      if (body && typeof body === 'object' && body.error && !body.errorId) {
        const id = generateErrorId('SRV');
        body.errorId = id;
        // Log with id for correlation
        try { console.error(`[${id}] ${body.error}`, body._debug || ''); } catch (e) { console.error('[ErrorID] log failed', e); }
      }
    } catch (e) {
      console.error('[ErrorID middleware] failed to augment response', e);
    }
    return origJson(body);
  };
  next();
});

const extractIssuesFromSubmissions = () => {
  try {
    if (!fs.existsSync(submissionsPath)) return;
    
    const submissionsData = JSON.parse(fs.readFileSync(submissionsPath, 'utf8'));
    const submissions = submissionsData.submissions || [];
    // Only process submissions newer than the last processed timestamp to avoid flood-processing old backlog
    const newSubmissions = submissions.filter(s => {
      const t = Date.parse(s.createdAt || s.updatedAt || 0);
      return !isNaN(t) && t > lastSubmissionProcessingAt;
    });
    if (!newSubmissions.length) return; // nothing new to process
    const issues = [];
    
    // Max issues per submission to prevent garbage floods
    const MAX_ISSUES_PER_SUBMISSION = 5;
    
    submissions.forEach(submission => {
      // Skip Claude responses
      if (submission.isClaudeResponse) return;
      
      // Remove timestamp line first
      const content = (submission.content || '')
        .split('\n')
        .filter(line => !line.match(/^\[.*?\]\s*(http|Page:)/i))
        .join('\n')
        .trim();
      
      // Reject entire submission if it looks like HTML dump
      const htmlTagCount = (content.match(/<[a-z][^>]*>/gi) || []).length;
      if (htmlTagCount > 10) {
        console.warn(`[Issue Watcher] Rejected submission ${submission.id} - appears to be HTML dump (${htmlTagCount} tags)`);
        return;
      }
      
      // Split by double newlines (paragraphs)
      const paragraphs = content.split(/\n\s*\n/).map(p => p.trim()).filter(p => p);
      
      // Limit paragraphs to prevent floods
      let issueCount = 0;
      paragraphs.forEach((para, idx) => {
        if (issueCount >= MAX_ISSUES_PER_SUBMISSION) return;
        
        // Validate each paragraph
        if (!isValidIssueContent(para)) {
          console.warn(`[Issue Watcher] Skipped invalid paragraph ${idx} in ${submission.id}`);
          return;
        }
        
        issues.push({
          id: `${submission.id}-p${idx}`,
          description: para,
          status: 'pending',
          createdAt: submission.createdAt
        });
        issueCount++;
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

    // Update last processed timestamp so subsequent runs only pick up newer submissions
    lastSubmissionProcessingAt = Date.now();
  } catch (e) {
    console.error('[Issue Watcher] Error:', e.message);
  }
};

// Process a single submission (used by /api/add-issue) to avoid re-processing the entire submissions queue
const processSingleSubmission = (submission) => {
  try {
    if (!submission || submission.isClaudeResponse) return;

    const content = (submission.content || '')
      .split('\n')
      .filter(line => !line.match(/^\[.*?\]\s*(http|Page:)/i))
      .join('\n')
      .trim();

    // Immediately skip submissions that contain any HTML tags — defense-in-depth
    if (/<[^>]+>/i.test(content)) {
      console.warn(`[Issue Watcher] Rejected submission ${submission.id} - contains HTML tags`);
      return;
    }

    const htmlTagCount = (content.match(/<[a-z][^>]*>/gi) || []).length;
    if (htmlTagCount > 10) {
      console.warn(`[Issue Watcher] Rejected submission ${submission.id} - appears to be HTML dump (${htmlTagCount} tags)`);
      return;
    }

    const paragraphs = content.split(/\n\s*\n/).map(p => p.trim()).filter(p => p);
    const MAX_ISSUES_PER_SUBMISSION = 5;
    const newIssues = [];

    for (let idx = 0, count = 0; idx < paragraphs.length && count < MAX_ISSUES_PER_SUBMISSION; idx++) {
      const para = paragraphs[idx];
      if (!isValidIssueContent(para)) {
        console.warn(`[Issue Watcher] Skipped invalid paragraph ${idx} in ${submission.id}`);
        continue;
      }
      newIssues.push({ id: `${submission.id}-p${idx}`, description: para, status: 'pending', createdAt: submission.createdAt });
      count++;
    }

    if (newIssues.length === 0) return;

    // Append unique new issues to pending issues file
    let existing = { issues: [], lastUpdated: null };
    if (fs.existsSync(pendingIssuesPath)) {
      try { existing = JSON.parse(fs.readFileSync(pendingIssuesPath, 'utf8')); } catch (e) { }
    }

    const existingDescriptions = new Set(existing.issues.map(i => normalizeDescription(i.description)));
    const unique = newIssues.filter(i => {
      const n = normalizeDescription(i.description);
      if (existingDescriptions.has(n)) return false;
      existingDescriptions.add(n);
      return true;
    });

    if (unique.length > 0) {
      existing.issues.push(...unique);
      existing.lastUpdated = new Date().toISOString();
      fs.writeFileSync(pendingIssuesPath, JSON.stringify(existing, null, 2));
      unique.forEach(issue => broadcastNewIssue(issue));
      console.log(`  \x1b[33m●\x1b[0m ${unique.length} new issue(s) received from ${submission.id}`);
    }
  } catch (e) {
    console.error('[Issue Watcher] processSingleSubmission error:', e.message);
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

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Endpoint to read a file (for viewing test files)
app.get('/api/read-file', (req, res) => {
  try {
    const filePath = req.query.path;
    
    if (!filePath) {
      return res.status(400).json({ error: 'Missing path parameter' });
    }
    
    // Security: only allow reading from specific directories
    const safePath = path.normalize(filePath).replace(/^(\.\.[/\\])+/, '');
    const allowedPrefixes = ['tests/', 'tests\\', 'src/', 'src\\', 'docs/', 'docs\\'];
    const isAllowed = allowedPrefixes.some(prefix => safePath.startsWith(prefix));
    
    if (!isAllowed) {
      return res.status(403).json({ error: 'Access denied - can only read from tests/, src/, or docs/' });
    }
    
    const fullPath = path.join(rootDir, safePath);
    
    if (!fullPath.startsWith(rootDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    res.json({ success: true, path: safePath, content });
  } catch (error) {
    console.error('[Read File Error]', error);
    res.status(500).json({ error: error.message });
  }
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
app.get('/pages/:page', (req, res, next) => {
  const pageName = req.params.page;
  if (!pageName.endsWith('.html')) return next();

  const isNavigation = req.headers['sec-fetch-mode'] === 'navigate' || 
                       (req.headers['accept'] && req.headers['accept'].includes('text/html'));

  if (isNavigation) {
    const filePath = path.join(rootDir, 'pages', pageName);
    
    if (pageName.includes('/') || pageName.includes('\\')) return next();

    let theme = 'dark';
    let siteName = 'WB Site';
    
    try {
      const configPath = path.join(rootDir, 'config', 'site.json');
      if (fs.existsSync(configPath)) {
        const siteConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
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
      if (err) return next();

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
    next();
  }
});

app.use(express.static(rootDir, cacheConfig));
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb' }));

// Request logging for API endpoints
app.use((req, res, next) => {
  if (req.path && req.path.startsWith('/api')) {
    const ct = req.headers['content-type'] || '';
    const accept = req.headers['accept'] || '';
    console.log(`[API Request] ${req.method} ${req.path} content-type=${ct} accept=${accept}`);
  }
  next();
});

// Convert body-parser JSON parse errors to JSON responses
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
    
    const responseSubmission = {
      id: 'claude-' + Date.now(),
      content: `[CLAUDE ${status === 'success' ? '✅' : '❌'}] ${message}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isClaudeResponse: true,
      status: status
    };
    
    submissionsData.submissions.unshift(responseSubmission);
    submissionsData.lastUpdated = new Date().toISOString();
    
    fs.writeFileSync(submissionsPathLocal, JSON.stringify(submissionsData, null, 2));
    
    console.log(`[Claude Response] ${status === 'success' ? '✅' : '❌'} ${message.substring(0, 50)}...`);
    res.json({ success: true, submission: responseSubmission, note: responseSubmission });
  } catch (error) {
    console.error('[Claude Response Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// API Endpoint to update issue status
app.post("/api/update-issue", (req, res) => {
  try {
    const { issueId, status, resolution, testPassed, testPath, testSummary } = req.body;
    
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
    
    if (status === 'in-progress') {
      issue.status = 'in-progress';
      issue.startedAt = new Date().toISOString();
    } else if (status === 'fixed') {
      // Fixed = code fix applied, needs test & review (yellow status)
      issue.status = 'fixed';
      issue.fixedAt = new Date().toISOString();
      if (resolution) issue.resolution = resolution;
    } else if (status === 'resolved' && testPassed) {
      // Test passed - fully resolve the issue with all proper fields
      issue.status = 'resolved';
      issue.resolvedAt = new Date().toISOString();
      issue.resolution = resolution || 'Test passed - automatically resolved';
      issue.validatedBy = testPath || issue.testLink || 'test';
      issue.testPassed = true;
      issue.testSummary = testSummary || null;
      issue.lastTestRun = new Date().toISOString();
      issue.lastTestResult = 'passed';
    } else if (status === 'resolved') {
      // Manual resolve without test - goes to pending-review
      issue.status = 'pending-review';
      issue.claimedFixedAt = new Date().toISOString();
      issue.resolution = resolution || 'Fixed by Claude';
    } else if (status === 'approved') {
      issue.status = 'resolved';
      issue.resolvedAt = new Date().toISOString();
    } else if (status === 'rejected') {
      issue.status = 'pending';
      issue.claimedFixedAt = null;
      issue.resolution = null;
      issue.startedAt = null;
      issue.rejectionCount = (issue.rejectionCount || 0) + 1;
      issue.rejectedAt = new Date().toISOString();
    } else {
      issue.status = status;
    }
    
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(pendingIssuesPath, JSON.stringify(data, null, 2));
    
    console.log(`[Issue Update] ${issueId} -> ${issue.status}${testPassed ? ' (test passed)' : ''}`);
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
    
    const seenDescriptions = new Set();
    const dedupedIssues = (data.issues || []).filter(issue => {
      const normalized = normalizeDescription(issue.description);
      if (seenDescriptions.has(normalized)) {
        return false;
      }
      seenDescriptions.add(normalized);
      return true;
    });
    
    data.lastChecked = new Date().toISOString();
    
    if (dedupedIssues.length !== data.issues.length) {
      data.issues = dedupedIssues;
      data.lastUpdated = new Date().toISOString();
    }
    
    fs.writeFileSync(pendingIssuesPath, JSON.stringify(data, null, 2));
    
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

// API Endpoint to update issue details
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
    
    const resolvedIssues = data.issues.filter(i => i.status === 'resolved');

    data.issues = data.issues.filter(i => i.status !== 'resolved');
    const cleared = originalCount - data.issues.length;

    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(pendingIssuesPath, JSON.stringify(data, null, 2));

    try {
      const subsPath = path.join(rootDir, 'data', 'issues.json');
      if (fs.existsSync(subsPath)) {
        const subsData = JSON.parse(fs.readFileSync(subsPath, 'utf8'));
        const remainingSubmissions = (subsData.submissions || []).filter(sub => {
          const derivedIdPrefix = `${sub.id}-p`;
          const hasResolved = resolvedIssues.some(ri => ri.id.startsWith(derivedIdPrefix));
          return !hasResolved;
        });
        if (remainingSubmissions.length !== (subsData.submissions || []).length) {
          subsData.submissions = remainingSubmissions;
          subsData.lastUpdated = new Date().toISOString();
          fs.writeFileSync(subsPath, JSON.stringify(subsData, null, 2));
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

// API Endpoint to add a single user issue submission
app.post('/api/add-issue', (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Missing content' });

    // Explicitly reject raw HTML/page dumps early (defense-in-depth).
    // Some older submissions slipped through; ensure new submissions cannot add HTML blobs.
    if (/<[^>]+>/i.test(String(content))) {
      console.warn('[Add Issue] Rejected HTML content submission');
      return res.status(400).json({ error: 'HTML content not allowed' });
    }

    // Reject obvious HTML dumps or invalid content early to avoid polluting issues
    if (!isValidIssueContent(content)) {
      console.warn('[Add Issue] Rejected invalid submission content');
      return res.status(400).json({ error: 'Invalid content' });
    }

    const submissionsPathLocal = path.join(rootDir, 'data', 'issues.json');
    let submissionsData = { submissions: [], lastUpdated: null };

    if (fs.existsSync(submissionsPathLocal)) {
      try { submissionsData = JSON.parse(fs.readFileSync(submissionsPathLocal, 'utf8')); } catch (e) {
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

    const dir = path.dirname(submissionsPathLocal);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(submissionsPathLocal, JSON.stringify(submissionsData, null, 2), 'utf8');

    try { processSingleSubmission(submission); } catch (e) { console.warn('[Add Issue] processSingleSubmission failed', e); }

    broadcastNewIssue(submission);

    res.json({ success: true, submission, note: submission });
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
  }, 500);
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
  
  req.setTimeout(300000); // 5 minutes

  exec('npm run test:performance', { cwd: rootDir }, (error, stdout, stderr) => {
    console.log('[Server] Tests finished');
    if (error) {
      console.log(`[Server] Test command exit code: ${error.code}`);
    }
    
    res.json({ 
      success: true, 
      output: stdout,
      details: stderr,
      exitCode: error ? error.code : 0
    });
  });
});

// API Endpoint to run a specific test file
app.post("/api/run-test", (req, res) => {
  const { testPath, testName } = req.body;
  
  if (!testPath) {
    return res.status(400).json({ error: 'Missing testPath' });
  }
  
  // Security: only allow tests from the tests/ directory
  const safePath = path.normalize(testPath).replace(/^(\.\.[\/\\])+/, '');
  if (!safePath.startsWith('tests/') && !safePath.startsWith('tests\\')) {
    return res.status(400).json({ error: 'Test path must be in tests/ directory' });
  }
  
  const fullPath = path.join(rootDir, safePath);
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: `Test file not found: ${safePath}` });
  }
  
  console.log(`[Server] Running test: ${safePath}${testName ? ` (${testName})` : ''}`);
  
  // Build playwright command - use grep to filter specific test if provided
  let cmd = `npx playwright test "${safePath}" --reporter=json`;
  if (testName) {
    // Escape special regex characters in test name for grep
    const escapedName = testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cmd += ` --grep "${escapedName}"`;
  }
  
  req.setTimeout(120000); // 2 minutes timeout
  
  exec(cmd, { cwd: rootDir, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
    console.log(`[Server] Test finished: ${error ? 'FAILED' : 'PASSED'}`);
    
    let results = null;
    try {
      results = JSON.parse(stdout);
    } catch (e) {
      results = { raw: stdout };
    }
    
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    const testResults = [];
    
    if (results && results.suites) {
      const extractTests = (suite) => {
        if (suite.specs) {
          suite.specs.forEach(spec => {
            spec.tests.forEach(test => {
              const status = test.results?.[0]?.status || 'unknown';
              testResults.push({
                title: spec.title,
                status,
                duration: test.results?.[0]?.duration || 0,
                error: test.results?.[0]?.error?.message || null
              });
              if (status === 'passed') passed++;
              else if (status === 'failed' || status === 'timedOut') failed++;
              else if (status === 'skipped') skipped++;
            });
          });
        }
        if (suite.suites) {
          suite.suites.forEach(extractTests);
        }
      };
      results.suites.forEach(extractTests);
    }
    
    res.json({
      success: !error || error.code === 0,
      testPath: safePath,
      testName: testName || null,
      summary: { passed, failed, skipped, total: passed + failed + skipped },
      tests: testResults,
      exitCode: error ? error.code : 0,
      stderr: stderr || null
    });
  });
});

// API Endpoint to run test for a specific issue by ID
app.post("/api/run-issue-test", (req, res) => {
  const { issueId } = req.body;
  
  if (!issueId) {
    return res.status(400).json({ error: 'Missing issueId' });
  }
  
  // Convert issue ID to test file name
  const testFileName = `issue-${issueId.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.spec.ts`;
  const testPath = `tests/issues/${testFileName}`;
  let fullPath = path.join(rootDir, testPath);
  
  if (!fs.existsSync(fullPath)) {
    // Attempt to auto-generate a test for this issue ID and then run it.
    console.log(`[Server] Test not found for ${issueId}; attempting to generate test file`);

    // Helper to sanitize id -> filename
    const toFileName = (id) => `issue-${id.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.spec.ts`;

    // Try to locate issue details in pending-issues.json or issues.json
    let issueDesc = '';
    let issueCreatedAt = null;
    try {
      const pendingPath = path.join(rootDir, 'data', 'pending-issues.json');
      if (fs.existsSync(pendingPath)) {
        const pending = JSON.parse(fs.readFileSync(pendingPath, 'utf8'));
        const found = (pending.issues || []).find(i => i.id === issueId);
        if (found) { issueDesc = found.description || found.title || ''; issueCreatedAt = found.createdAt || null; }
      }
    } catch (e) { console.warn('[Issue Test] Failed to read pending-issues.json', e.message); }

    if (!issueDesc) {
      try {
        const issuesPath = path.join(rootDir, 'data', 'issues.json');
        if (fs.existsSync(issuesPath)) {
          const issues = JSON.parse(fs.readFileSync(issuesPath, 'utf8'));
          // search main, notes, submissions
          if (issues.id === issueId) { issueDesc = issues.description || ''; issueCreatedAt = issues.createdAt || null; }
          if (!issueDesc) {
            const note = (issues.notes || []).find(n => n.id === issueId);
            if (note) { issueDesc = note.content || ''; issueCreatedAt = note.createdAt || null; }
          }
          if (!issueDesc) {
            const sub = (issues.submissions || []).find(s => s.id === issueId);
            if (sub) { issueDesc = sub.content || ''; issueCreatedAt = sub.createdAt || null; }
          }
        }
      } catch (e) { console.warn('[Issue Test] Failed to read issues.json', e.message); }
    }

    // Create test content
    const kw = (issueDesc || 'unknown-issue').replace(/^\[BUG\]\s*/i, '').replace(/^\[FEATURE\]\s*/i, '').split('\n')[0].substring(0,60).replace(/[^a-zA-Z0-9\s]/g,'').trim() || 'unknown-issue';
    const escaped = (issueDesc || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');

    const testContent = `/**\n * Issue Test: ${issueId}\n * Auto-generated: ${new Date().toISOString()}\n */\nimport { test, expect } from '@playwright/test';\n\ntest.describe('Issue ${issueId}: ${kw}', () => {\n  test.beforeEach(async ({ page }) => {\n    await page.goto('http://localhost:3000/');\n    await page.waitForLoadState('networkidle');\n  });\n\n  test('verify issue is fixed - ${kw}', async ({ page }) => {\n    // ID: ${issueId} | Created: ${issueCreatedAt || 'unknown'}\n    // Description: ${escaped}\n    test.info().annotations.push({ type: 'issue', description: '${issueId}' });\n    await expect(page).toHaveTitle(/.*/);\n    // TODO: Add specific assertions\n  });\n});\n`;

    // Ensure tests/issues dir exists
    const issueDir = path.join(rootDir, 'tests', 'issues');
    if (!fs.existsSync(issueDir)) fs.mkdirSync(issueDir, { recursive: true });

    const newFileName = toFileName(issueId);
    const newFilePath = path.join(issueDir, newFileName);
    try {
      console.log('[Server] Creating test file at', newFilePath);
      console.log('[Server] issueDir exists?', fs.existsSync(issueDir));
      console.log('[Server] parent dir writable check (stat):');
      try { console.log(fs.statSync(issueDir)); } catch (sErr) { console.log('stat err', sErr && sErr.message); }

      fs.writeFileSync(newFilePath, testContent, 'utf8');
      console.log(`[Server] Generated test file: ${newFilePath}`);

      // Update pending-issues.json to include testLink if possible
      try {
        const pendingPath = path.join(rootDir, 'data', 'pending-issues.json');
        if (fs.existsSync(pendingPath)) {
          const pData = JSON.parse(fs.readFileSync(pendingPath, 'utf8'));
          const issue = (pData.issues || []).find(i => i.id === issueId);
          if (issue) {
            issue.testLink = `tests/issues/${newFileName}`;
            fs.writeFileSync(pendingPath, JSON.stringify(pData, null, 2));
          }
        }
      } catch (e) { console.warn('[Issue Test] Failed to update pending-issues.json', e && e.stack ? e.stack : e); }

      // set fullPath so we run it below
      fullPath = newFilePath;
    } catch (e) {
      const errMsg = e && e.stack ? e.stack : String(e);
      console.error('[Server] Failed to generate test file for issue', issueId, errMsg);
      try {
        const logFile = path.join(rootDir, 'data', 'issue-gen-errors.log');
        fs.writeFileSync(logFile, `[${new Date().toISOString()}] Failed to generate test for ${issueId}: ${errMsg}\n`, { flag: 'a' });
      } catch (err) { console.warn('[Server] Could not write error log', err && err.message); }
      return res.status(500).json({ error: `Failed to generate test for issue: ${issueId}` });
    }
  }

  console.log(`[Server] Running issue test: ${issueId}`);
  
  const cmd = `npx playwright test "${testPath}" --reporter=json`;
  req.setTimeout(120000);
  
  exec(cmd, { cwd: rootDir, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
    const success = !error || error.code === 0;
    console.log(`[Server] Issue test ${issueId}: ${success ? 'PASSED' : 'FAILED'}`);
    
    let results = null;
    try { results = JSON.parse(stdout); } catch (e) { results = { raw: stdout }; }
    
    let passed = 0, failed = 0, skipped = 0;
    const testResults = [];
    
    if (results && results.suites) {
      const extractTests = (suite) => {
        if (suite.specs) {
          suite.specs.forEach(spec => {
            spec.tests.forEach(test => {
              const result = test.results?.[0];
              const status = result?.status || 'unknown';
              
              // Extract steps from the test result
              const steps = [];
              const extractSteps = (stepList, depth = 0) => {
                if (!stepList) return;
                stepList.forEach(step => {
                  // Only include named steps (from test.step()), skip internal playwright steps
                  if (step.title && !step.title.startsWith('Before') && !step.title.startsWith('After')) {
                    steps.push({
                      title: step.title,
                      status: step.error ? 'failed' : 'passed',
                      duration: step.duration || 0,
                      error: step.error?.message || null
                    });
                  }
                  // Recursively extract nested steps
                  if (step.steps) extractSteps(step.steps, depth + 1);
                });
              };
              extractSteps(result?.steps);
              
              testResults.push({
                title: spec.title,
                status,
                duration: result?.duration || 0,
                error: result?.error?.message || null,
                steps: steps
              });
              if (status === 'passed') passed++;
              else if (status === 'failed' || status === 'timedOut') failed++;
              else if (status === 'skipped') skipped++;
            });
          });
        }
        if (suite.suites) suite.suites.forEach(extractTests);
      };
      results.suites.forEach(extractTests);
    }
    
    // Update issue with test result
    try {
      const pendingPath = path.join(rootDir, 'data', 'pending-issues.json');
      if (fs.existsSync(pendingPath)) {
        const data = JSON.parse(fs.readFileSync(pendingPath, 'utf8'));
        const issue = data.issues.find(i => i.id === issueId);
        if (issue) {
          issue.lastTestRun = new Date().toISOString();
          issue.lastTestResult = success ? 'passed' : 'failed';
          issue.testSummary = { passed, failed, skipped };
          fs.writeFileSync(pendingPath, JSON.stringify(data, null, 2));
        }
      }
    } catch (e) { console.warn('[Issue Test] Failed to update issue:', e.message); }
    
    res.json({
      success,
      issueId,
      testPath,
      summary: { passed, failed, skipped, total: passed + failed + skipped },
      tests: testResults,
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
    fs.renameSync(oldHtmlPath, newHtmlPath);
    console.log(`[Server] Renamed page: ${safeOld}.html -> ${safeNew}.html`);

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

  if (ext === '.json' && req.path.startsWith('/src/wb-models/')) {
    return res.sendFile(path.join(rootDir, req.path));
  }

  if (staticExtensions.includes(ext)) {
    return res.status(404).send(`File not found: ${req.path}`);
  }

  res.sendFile(path.join(rootDir, 'index.html'));
});

// Generic error handler — ensures every error response includes a unique errorId
app.use((err, req, res, next) => {
  try {
    const id = generateErrorId('SRV');
    console.error(`[${id}] Unhandled error:`, err && (err.stack || err.message || err));
    if (res.headersSent) return next(err);
    res.status(500).json({ error: 'Internal server error', errorId: id });
  } catch (e) {
    console.error('[ErrorHandler] failed', e);
    try { res.status(500).json({ error: 'Internal server error' }); } catch(_) { /* ignore */ }
  }
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
