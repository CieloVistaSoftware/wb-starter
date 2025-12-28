const fs = require('fs');
const path = require('path');
// simple static server for wb-starter that always serves index.html for root
const express = require('express');
const WebSocket = require('ws');
const app = express();
const port = process.env.PORT || 3000;
const WS_PORT = 3001;

// Define project root (one level up from server directory)
const rootDir = path.join(__dirname, '..');

// Request logging (for debugging)
app.use((req, res, next) => {
  if (req.path.endsWith('.js')) {
    res.on('finish', () => {
      // Only log if it's a fresh fetch (200) or error, ignore cached (304)
      if (res.statusCode !== 304) {
        console.log(`[Request] ${req.method} ${req.path} (${res.statusCode})`);
      }
    });
  }
  next();
});

// Start WebSocket Server
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on('connection', (ws) => {
  console.log('Client connected to collaboration server');
  
  ws.on('message', (message) => {
    // Broadcast to all clients
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

// Middleware
// Enable caching for static assets to ensure "single copy" behavior
// Serve from project root to allow access to src/, data/, public/, etc.
app.use(express.static(rootDir, {
  maxAge: '1h', // Cache files for 1 hour
  setHeaders: (res, path) => {
    // Don't cache HTML files to ensure latest content is always loaded
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb' }));

// ============================================
// FILE UPLOAD ENDPOINT - POST /api/upload
// ============================================
app.post('/api/upload', express.raw({ type: '*/*', limit: '50mb' }), (req, res) => {
  try {
    const contentType = req.headers['content-type'] || '';
    
    if (contentType.includes('multipart/form-data')) {
      const boundary = contentType.split('boundary=')[1];
      if (!boundary) {
        return res.status(400).json({ error: 'Missing boundary' });
      }
      
      const body = req.body.toString('binary');
      const parts = body.split('--' + boundary);
      
      let fileData = null;
      let fileName = 'upload';
      let fileType = 'file';
      
      for (const part of parts) {
        if (part.includes('filename=')) {
          const filenameMatch = part.match(/filename="([^"]+)"/);
          if (filenameMatch) fileName = filenameMatch[1];
          const contentStart = part.indexOf('\r\n\r\n');
          if (contentStart !== -1) {
            fileData = Buffer.from(part.slice(contentStart + 4).replace(/\r\n--$/, ''), 'binary');
          }
        } else if (part.includes('name="type"')) {
          const typeMatch = part.match(/\r\n\r\n(.+?)\r\n/);
          if (typeMatch) fileType = typeMatch[1].trim();
        }
      }
      
      if (!fileData) {
        return res.status(400).json({ error: 'No file data found' });
      }
      
      const uploadDirs = { 'image': 'uploads/images', 'audio': 'uploads/audio', 'video': 'uploads/video', 'file': 'uploads/files' };
      const uploadDir = uploadDirs[fileType] || 'uploads/files';
      const fullDir = path.join(rootDir, uploadDir);
      
      if (!fs.existsSync(fullDir)) fs.mkdirSync(fullDir, { recursive: true });
      
      const ext = path.extname(fileName) || '';
      const safeName = path.basename(fileName, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
      const uniqueName = `${safeName}-${Date.now()}${ext}`;
      const filePath = path.join(fullDir, uniqueName);
      
      fs.writeFileSync(filePath, fileData);
      
      res.json({ success: true, url: `/${uploadDir}/${uniqueName}`, path: `/${uploadDir}/${uniqueName}`, filename: uniqueName, originalName: fileName, size: fileData.length, type: fileType });
    } else {
      const data = JSON.parse(req.body.toString());
      const { file, filename, type = 'file' } = data;
      if (!file) return res.status(400).json({ error: 'No file data' });
      
      const base64Data = file.replace(/^data:[^;]+;base64,/, '');
      const fileBuffer = Buffer.from(base64Data, 'base64');
      
      const uploadDirs = { 'image': 'uploads/images', 'audio': 'uploads/audio', 'video': 'uploads/video', 'file': 'uploads/files' };
      const uploadDir = uploadDirs[type] || 'uploads/files';
      const fullDir = path.join(rootDir, uploadDir);
      
      if (!fs.existsSync(fullDir)) fs.mkdirSync(fullDir, { recursive: true });
      
      const ext = path.extname(filename) || '';
      const safeName = path.basename(filename, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
      const uniqueName = `${safeName}-${Date.now()}${ext}`;
      fs.writeFileSync(path.join(fullDir, uniqueName), fileBuffer);
      
      res.json({ success: true, url: `/${uploadDir}/${uniqueName}`, path: `/${uploadDir}/${uniqueName}`, filename: uniqueName, originalName: filename, size: fileBuffer.length, type });
    }
  } catch (error) {
    console.error('[Upload Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SAVE ENDPOINT - POST /api/save
// ============================================
app.post('/api/save', (req, res) => {
  try {
    const { location, data } = req.body;
    
    if (!location || data === undefined) {
      return res.status(400).json({ error: 'Missing location or data' });
    }

    // Security: prevent path traversal attacks
    const safePath = path.normalize(location).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = path.join(rootDir, safePath);
    
    // Ensure path is within project directory
    if (!fullPath.startsWith(rootDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Determine format
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

    // Check for duplicates - compare with existing file
    if (fs.existsSync(fullPath)) {
      const existingContent = fs.readFileSync(fullPath, 'utf8');
      if (existingContent === content) {
        return res.json({ 
          success: true,
          duplicate: true,
          message: 'No changes - file already up to date',
          location: safePath 
        });
      }
    }

    // Create directory if it doesn't exist
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, content, 'utf8');
    
    res.json({ 
      success: true,
      duplicate: false,
      message: `Saved to ${location}`,
      location: safePath 
    });
  } catch (error) {
    console.error('[Save Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// Root route - always serve index.html from public
app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'index.html'));
});

// Serve each page in public/pages as both /pages/file.html and /file
const pagesDir = path.join(rootDir, 'public', 'pages');
if (fs.existsSync(pagesDir)) {
  const pages = fs.readdirSync(pagesDir).filter(file => file.endsWith('.html'));

  pages.forEach(file => {
    const pageName = file.replace('.html', '');
    const filePath = path.join(pagesDir, file);
    
    // Route: /pages/about.html
    app.get(`/pages/${file}`, (req, res) => {
      res.sendFile(filePath);
    });
    
    // Clean URL: /about
    app.get(`/${pageName}`, (req, res) => {
      res.sendFile(filePath);
    });
  });
}

// Builder component - special route (opens in new tab)
app.get('/builder.html', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'builder.html'));
});

// Fallback - serve index.html for SPA routes (but NOT for static assets)
app.use((req, res, next) => {
  // Don't intercept requests for static files (js, css, json, images, etc.)
  const staticExtensions = ['.js', '.css', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.map'];
  const ext = path.extname(req.path).toLowerCase();
  
  if (staticExtensions.includes(ext)) {
    // Let it 404 properly so we can debug missing files
    return res.status(404).send(`File not found: ${req.path}`);
  }
  
  // For HTML/SPA routes, serve index.html
  res.sendFile(path.join(rootDir, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`WB Starter running at http://localhost:${port}`);
  console.log(`Collab Server running at ws://localhost:${WS_PORT}/collab`);
});
