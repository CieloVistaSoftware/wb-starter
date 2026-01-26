# Server Commands

## Quick Reference

| Command | Use Case |
|---------|----------|
| `npm start` | **Recommended** - Full dev server with all features |
| `npm run dev` | Simple static file server (no API/WebSocket) |

---

## npm start (Recommended)

Runs `node scripts/start.js` → `server.js`

### Features

| Feature | Description |
|---------|-------------|
| HTTP Server | Express on port 3000 |
| WebSocket | Port 3001 (live reload, issue sync) |
| API Endpoints | `/api/pending-issues`, `/api/add-issue`, `/api/update-issue`, etc. |
| Port Cleanup | Automatically kills existing processes on 3000/3001 |
| Startup Tests | Runs `clean-empty-issues.test.mjs` |
| Unlock Jobs | Schedules stale lock cleanup |

### Live reload configuration

You can control the dev server's live-reload behavior with environment variables and a documented schema:

- LIVE_RELOAD (true|false) — disable live reload when `false`. Default: `true`.
- WATCH_ROOT (true|false) — opt-in to watching the repository root. Default: `false`.
- Debounce window — the server coalesces file change events; default is `500ms` to avoid noisy reloads during bursty file writes.
- Ignored paths — common noisy paths are ignored by default: `tests/`, `tmp_trace/`, `tmp/`, `data/`, `node_modules/`.

Schema: See `src/wb-models/server-config.schema.json` for the canonical schema for server runtime configuration and live-reload settings.

### Required For

- Issues system (🐛 button, issues-viewer.html)
- Live reload on file changes
- API-dependent features
- WebSocket communication

---

## npm run dev

Runs `npx serve . -p 3000`

### Features

| Feature | Description |
|---------|-------------|
| HTTP Server | Simple static file server on port 3000 |
| WebSocket | ❌ None |
| API Endpoints | ❌ None |
| Port Cleanup | ❌ None |

### Use Cases

- Quick static file preview
- When you don't need the issues system or API
- Lightweight alternative for simple testing

---

## Troubleshooting

### "Server offline" or "Failed to load issues"

The issues system requires the full server. Run:

```bash
npm start
```

### Port already in use

`npm start` automatically kills existing processes on ports 3000/3001. If you still have issues:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <pid> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

Then run `npm start` again.
