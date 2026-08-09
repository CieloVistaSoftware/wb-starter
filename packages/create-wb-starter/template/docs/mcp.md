# MCP Runner & Docs Access

## MCP Local Runner Overview
ny.

### Quick Start
- Background / restart helper: `npm run start:mcp` (recommended)
- Foreground (attached, for debugging): `npm run start:mcp -- --foreground` or `npm start -- mcp -- --foreground`
- Health probe: `npm run mcp:healthcheck -- 52100` or `node scripts/mcp-healthcheck.js 52100`

### Why MCP?
- `start:mcp` detects an existing MCP server on the configured health port, terminates it, waits for the port to free, and starts a fresh server.
- Cross-platform and safe for developer workflows and CI.

### Usage Examples
1. Restart background MCP on default port (52100):
   - `npm run start:mcp`
2. Restart MCP on a custom port and wait up to 30s for health:
   - `npm run start:mcp -- --port 52101 --wait 30`
3. Run MCP in foreground (logs stream to your terminal):
   - `npm run start:mcp -- --foreground`
   - Or: `npm start -- mcp -- --foreground`

### Health Checks (CI)
- Quick probe: `npm run mcp:healthcheck -- 52100` (or `node scripts/mcp-healthcheck.js 52100`)
- CI: Start MCP with `MCP_HEALTH_PORT` set, then run healthcheck before MCP-dependent tests.
- See `docs/testing-runbook.md` for CI integration examples.

### Port & Configuration Precedence
- Default health port: **52100**
- Precedence: `MCP_HEALTH_PORT` → `MCP_PORT` → `npm_config_mcp_health_port` → default `52100`
- Note: MCP may run over stdio (no TCP health endpoint) if `MCP_HEALTH_PORT` is not set.

### Quick Commands
- Start/restart MCP and wait for health:
  ```bash
  node scripts/mcp-restart.js --port 52100 --wait 20
  ```
- Verify HTTP health endpoint:
  ```bash
  node scripts/mcp-healthcheck.js 52100
  # or (curl)
  curl -fsS http://127.0.0.1:52100/health || echo 'no-health'
  ```

---

## Finding Specific Docs

Component documentation is organized by feature and location:

- **Component docs:** `docs/components/{category}/{component}.md`
- **Schemas:** `src/wb-models/{name}.schema.json`
- **Behaviors/logic:** `src/wb-viewmodels/{name}.js`
- **Styles:** `src/styles/behaviors/{name}.css`

To find docs for a specific component:
1. Identify the component name (e.g., `button`, `input`).
2. Look in `docs/components/` for the relevant category (e.g., `forms`, `layout`).
3. Open `{component}.md` for detailed usage, attributes, and examples.

For schema or behavior details, check the matching file in `src/wb-models/` or `src/wb-viewmodels/`.

If you need to locate a doc file quickly:
- Use workspace search for `{component}.md` or `{name}.schema.json`.
- Refer to the `WB_DOC_MAP` in `src/wb-viewmodels/demo-docmap.js` for doc mapping logic.

---
# MCP (Model Context Protocol) — local runner and health

This project includes a small MCP "npm-runner" (in `mcp-server/`) you can run locally to let tools/agents call npm tasks against this repository.

Quick overview ✅
- Background / restart helper: `npm run start:mcp` (recommended)
- Foreground (attached, for debugging): `npm run start:mcp -- --foreground` or `npm start -- mcp -- --foreground`
- Health probe: `npm run mcp:healthcheck -- 52100` or `node scripts/mcp-healthcheck.js 52100`

Why this new helper? 💡
- `start:mcp` will detect an existing MCP server on the configured health port, terminate it, wait for the port to free, and start a fresh server.
- It is cross-platform and safe for developer workflows and CI.

Usage examples
1) Restart background MCP on default port (52100):

   npm run start:mcp

2) Restart MCP on a custom port and wait up to 30s for health:

   npm run start:mcp -- --port 52101 --wait 30

3) Run MCP in foreground (useful for debugging; logs stream to your terminal):

   npm run start:mcp -- --foreground
   # or via npm start dispatch: npm start -- mcp -- --foreground

Health checks (CI)
- Quick probe: `npm run mcp:healthcheck -- 52100` (or `node scripts/mcp-healthcheck.js 52100`)
- CI recommendation: start MCP with `MCP_HEALTH_PORT` set, then run the healthcheck script before running MCP-dependent tests.
- See `docs/testing-runbook.md` for concrete examples showing how MCP is started/probed in CI and how to integrate MCP health checks into Playwright runs and artifact collection.

Port, configuration precedence, and quick checks 🔎
- Default health port: **52100**.
- Environment precedence (highest → lowest): `MCP_HEALTH_PORT` → `MCP_PORT` → `npm_config_mcp_health_port` → default `52100`.
- Important: the MCP process may still be running over stdio (no TCP health endpoint) if `MCP_HEALTH_PORT` is not set — absence of a TCP listener does not necessarily mean MCP is completely down.

Quick commands (copy/paste)
- Cross-platform health probe (recommended):

  ```bash
  # start (or restart) MCP on the default health port and wait for it to become healthy
  node scripts/mcp-restart.js --port 52100 --wait 20

  # verify the HTTP health endpoint (exits 0 when healthy)
  node scripts/mcp-healthcheck.js 52100
  # or (curl)
  curl -fsS http://127.0.0.1:52100/health || echo 'no-health'
  ```