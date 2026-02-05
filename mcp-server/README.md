# MCP NPM Runner

An MCP server that allows Claude to run npm commands in your project, with full traffic logging on a dedicated thread.

## Setup

### 1. Install Dependencies

```powershell
cd C:\Users\jwpmi\Downloads\AI\wb-starter\mcp-server
npm install
```

### 2. Add to Claude Desktop Config

Open your Claude Desktop config file:
```
%APPDATA%\Claude\claude_desktop_config.json
```

Add this server to the `mcpServers` section:

```json
{
  "mcpServers": {
    "npm-runner": {
      "command": "node",
      "args": ["C:\\Users\\jwpmi\\Downloads\\AI\\wb-starter\\mcp-server\\server.js"]
    }
  }
}
```

### 3. Start the Server

**Auto-start (via Claude Desktop):**
Claude Desktop launches the server automatically based on the config above. Just restart Claude Desktop.

**Manual start (for testing/debugging):**
```powershell
cd C:\Users\jwpmi\Downloads\AI\wb-starter\mcp-server
node server.js
```

**Via npm script (from project root):**
```powershell
cd C:\Users\jwpmi\Downloads\AI\wb-starter
npm run start:mcp
```

After any changes to server.js or log-worker.js, restart Claude Desktop to pick them up.

## Files

| File | Purpose |
|------|---------|
| `server.js` | MCP server — tool definitions, handlers, and LoggingTransport wrapper |
| `log-worker.js` | Dedicated Worker thread for logging — isolated from MCP message processing |

## Available Tools

### `npm_test`
Run the Playwright test suite.

**Parameters:**
- `filter` (optional): Run specific tests matching this pattern
- `singleThread` (optional): Run in single-threaded mode for debugging

### `npm_command`
Run any npm command.

**Parameters:**
- `command` (required): The npm command to run (e.g., "run build", "install")

## Traffic Logging

All MCP traffic is logged with direction indicators:

| Symbol | Meaning |
|--------|---------|
| `<-` | Inbound request from Claude Desktop |
| `->` | Outbound response from server |
| `--` | Lifecycle event (start, close) |

### Where logs go

- **stderr** — compact one-liners visible in Claude Desktop dev logs
- **`mcp-server/logs/mcp-traffic.log`** — full JSON detail, created automatically

### Tail the log in PowerShell

```powershell
Get-Content -Wait .\mcp-server\logs\mcp-traffic.log
```

### Example output

```
[2026-02-03T01:15:00.000Z] <- [id:1] tools/list
[2026-02-03T01:15:00.005Z] -> [id:1] tools [2 tools]
[2026-02-03T01:15:02.100Z] <- [id:2] tools/call npm_test {"filter":"schema"}
[2026-02-03T01:15:14.300Z] -> [id:2] result [1523 chars]
```

## Output

Test results are automatically saved to:
```
wb-starter/data/test-results.json
```
