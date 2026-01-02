# Deploying WB Starter to Render: A Complete Guide

**Live Demo:** [https://wb-starter.onrender.com](https://wb-starter.onrender.com)

---

## What is WB Starter?

WB Starter is a modern website starter kit powered by WB Behaviors. It's config-driven, requires zero build steps, and includes 23 themes out of the box. Unlike typical static site generators, WB Starter includes a full Node.js/Express backend that enables:

- **Visual Builder** - Edit your site in real-time
- **API Endpoints** - Save configurations, log issues, run tests
- **WebSocket Support** - Real-time collaboration (optional)
- **Content Management** - Dynamic page loading and theming

---

## The Architecture

### Frontend (Browser)
- Pure HTML5 semantic elements
- WB Behaviors auto-inject functionality
- Config-driven navigation and theming
- Zero build step required

### Backend (Node.js/Express)
- Static file serving with compression
- API endpoints for saving and logging
- WebSocket server for collaboration
- SPA fallback routing

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  index.html │  │ WB Behaviors│  │ site.json   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Express Server                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Static Files│  │  API Routes │  │  WebSocket  │     │
│  │ (port 3000) │  │ /api/save   │  │ (port 3001) │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

---

## Local Development

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Quick Start

```powershell
# Clone the repository
git clone https://github.com/CieloVistaSoftware/wb-starter.git
cd wb-starter

# Install dependencies
npm install

# Start the development server
npm start
```

Your site runs at **http://localhost:3000**

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Full server with all features |
| `npm run dev` | Lightweight static server |
| `npm test` | Run Playwright test suite |
| `npm run test:ui` | Playwright interactive UI |

---

## Why Render for Hosting?

When choosing a hosting platform for a Node.js/Express application, several options exist. Here's why Render stands out:

| Factor | Render | Vercel | Netlify | Railway |
|--------|--------|--------|---------|---------|
| Express support | ✅ Native | ⚠️ Serverless | ⚠️ Functions | ✅ Native |
| Free tier | ✅ No CC required | ✅ | ✅ | ⚠️ $5 credit |
| Auto-deploy | ✅ On push | ✅ | ✅ | ✅ |
| Persistent server | ✅ Yes | ❌ Serverless | ❌ Serverless | ✅ Yes |
| WebSocket support | ✅ Yes | ❌ Limited | ❌ Limited | ✅ Yes |

**Render wins** because WB Starter needs a persistent Express server, not serverless functions.

---

## Deploying to Render

### Step 1: Create a Render Account

1. Go to [render.com](https://render.com)
2. Click **Get Started for Free**
3. Sign up with your **GitHub account** (recommended for auto-deploy)

### Step 2: Create a New Web Service

1. From your Render dashboard, click **New +**
2. Select **Web Service**
3. Connect your GitHub repository: `CieloVistaSoftware/wb-starter`

### Step 3: Configure the Service

| Setting | Value |
|---------|-------|
| **Name** | `wb-starter` |
| **Region** | Choose closest to your users |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | `Free` |

> **Important:** Set the Start Command to `node server.js` directly, not `npm start`. This avoids issues with the pre-start script.

### Step 4: Environment Variables (Optional)

| Variable | Value | Purpose |
|----------|-------|---------|
| `NODE_ENV` | `production` | Enable caching |
| `ENABLE_COLLAB` | `true` | Enable WebSocket collaboration |

### Step 5: Deploy

Click **Create Web Service** and watch the magic happen!

Render will:
1. Clone your repository
2. Run `npm install`
3. Execute `node server.js`
4. Assign your permanent URL

---

## Your Live URL

Once deployed, your site is available at:

```
https://wb-starter.onrender.com
```

This URL is:
- ✅ **Permanent** - Always the same
- ✅ **Public** - Anyone can access it
- ✅ **Auto-updating** - Redeploys on every git push
- ✅ **SSL secured** - HTTPS by default

---

## How the Backend Works on Render

### The Server

```javascript
// server.js - Key components

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;  // Render sets PORT automatically

// Static files with compression
app.use(compression());
app.use(express.static(rootDir, cacheConfig));

// API endpoints
app.post("/api/save", (req, res) => { /* Save files */ });
app.post("/api/log-issues", (req, res) => { /* Log content issues */ });

// SPA fallback
app.use((req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`WB Starter running at http://localhost:${port}`);
});
```

### Port Configuration

Render automatically sets the `PORT` environment variable. The server respects this:

```javascript
const port = process.env.PORT || 3000;
```

- **Locally:** Uses port 3000
- **On Render:** Uses whatever port Render assigns (usually 10000)

Render then proxies external traffic to your internal port seamlessly.

---

## Troubleshooting

### Problem: 502 Bad Gateway Errors

**Cause:** The server crashed or failed to start.

**Solution:**
1. Check Render logs for error messages
2. Ensure Start Command is `node server.js`
3. Verify all dependencies are in `package.json`

### Problem: "Failed to fetch dynamically imported module"

**Cause:** Server not serving static files correctly.

**Solution:**
1. Check that `express.static()` points to the correct directory
2. Verify file paths in your HTML match the actual file structure

### Problem: Site Works Locally But Not on Render

**Cause:** Usually environment differences.

**Solution:**
1. Don't use `npm start` if it runs pre-scripts that fail
2. Use `node server.js` as the direct start command
3. Check for hardcoded `localhost` references

### Problem: Slow Initial Load

**Cause:** Free tier instances sleep after 15 minutes of inactivity.

**Solution:**
- This is expected on the free tier
- First request after sleep takes 30-60 seconds
- Upgrade to paid tier for always-on instances

---

## Automatic Deployments

Every time you push to your `main` branch, Render automatically:

1. Detects the new commit
2. Pulls the latest code
3. Runs `npm install`
4. Restarts the server
5. Routes traffic to the new version

No manual intervention required!

---

## Project Structure Reference

```
wb-starter/
├── index.html              # Main entry point
├── server.js               # Express backend
├── package.json            # Dependencies and scripts
├── config/
│   └── site.json           # Site configuration
├── pages/
│   ├── home.html           # Page content
│   ├── features.html
│   └── ...
├── src/
│   ├── core/               # WB engine
│   │   ├── wb.js
│   │   ├── theme.js
│   │   └── events.js
│   └── behaviors/          # UI behaviors
├── styles/
│   └── site.css
└── public/
    ├── builder.html        # Visual builder
    └── schema-viewer.html  # Schema documentation
```

---

## Summary

| What | Where |
|------|-------|
| **Source Code** | [github.com/CieloVistaSoftware/wb-starter](https://github.com/CieloVistaSoftware/wb-starter) |
| **Live Site** | [wb-starter.onrender.com](https://wb-starter.onrender.com) |
| **Hosting** | Render.com (Free Tier) |
| **Backend** | Node.js + Express |
| **Auto-Deploy** | On every push to main |

---

## Next Steps

1. **Customize your site** - Edit `config/site.json` to change branding
2. **Add pages** - Create new `.html` files in the `pages/` directory
3. **Change themes** - 23 themes available, set in `site.json`
4. **Use the Visual Builder** - Visit `/builder.html` to edit visually

---

*Article created: January 2, 2026*
*Author: CieloVista Software*
