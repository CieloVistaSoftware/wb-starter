# MCP + Playwright Architecture

## Layer Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLAUDE AI                                │
│                    (Claude Desktop App)                          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Tool Invocation                        │    │
│  │         npm-runner:npm_command("exec playwright...")     │    │
│  └──────────────────────────┬──────────────────────────────┘    │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              │ JSON-RPC over stdio
                              │ (MCP Protocol)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MCP SERVER LAYER                            │
│                                                                  │
│  ┌─────────────────────┐    ┌─────────────────────┐             │
│  │   npm-runner MCP    │    │  wb-filesystem MCP  │             │
│  │      Server         │    │      Server         │             │
│  │                     │    │                     │             │
│  │  • npm_command()    │    │  • read_file()      │             │
│  │  • npm_test()       │    │  • write_file()     │             │
│  │  • health()         │    │  • list_directory() │             │
│  └──────────┬──────────┘    └─────────────────────┘             │
└─────────────┼───────────────────────────────────────────────────┘
              │
              │ Spawns child process
              │ (node/npx)
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NODE.JS PROCESS LAYER                         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              npx playwright test                         │    │
│  │                                                          │    │
│  │  • Reads playwright.config.ts                           │    │
│  │  • Spawns worker processes (--workers=8)                │    │
│  │  • Manages test lifecycle                               │    │
│  └──────────────────────────┬──────────────────────────────┘    │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              │ Spawns browsers
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BROWSER LAYER                                │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Chromium │  │ Chromium │  │ Chromium │  │ Chromium │  ...   │
│  │ Worker 1 │  │ Worker 2 │  │ Worker 3 │  │ Worker 4 │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                  │
│  Each worker:                                                    │
│  • Launches browser instance                                     │
│  • Navigates to localhost:3000                                   │
│  • Executes test assertions                                      │
│  • Reports results back to Playwright                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP requests
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LOCAL DEV SERVER                              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Express Server (port 3000)                  │    │
│  │                                                          │    │
│  │  Serves: index.html, behaviors.html, builder.html, etc. │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Timeout Problem

```
┌────────────────────────────────────────────────────────────────┐
│                     TIMELINE VIEW                               │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  0s      Claude sends tool call                                │
│  │                                                              │
│  │       ──────► MCP Server receives request                   │
│  │                                                              │
│  │               ──────► Playwright starts                     │
│  │                                                              │
│  │                       ──────► Browsers launch               │
│  │                                                              │
│  │                               ──────► Tests running...      │
│  │                                                              │
│  30s     ⚠️ MCP TIMEOUT ⚠️                                     │
│  │       Connection dropped!                                    │
│  │                                                              │
│  │                               ...tests still running...     │
│  │                                                              │
│  60s                             Tests complete (no receiver)  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Solution Options

### Option 1: Increase MCP Timeout
```json
// claude_desktop_config.json
{
  "mcpServers": {
    "npm-runner": {
      "command": "node",
      "args": ["path/to/server.js"],
      "timeout": 180000  // 3 minutes
    }
  }
}
```

### Option 2: Run Smaller Test Batches
```bash
# Instead of all compliance tests:
npx playwright test --project=compliance --workers=8

# Run individual spec files:
npx playwright test tests/compliance/project-integrity.spec.ts
npx playwright test tests/compliance/schema.spec.ts
```

### Option 3: Background Execution
```bash
# Run tests in background, write results to file
npx playwright test --project=compliance --reporter=json > results.json &
```

## Data Flow Summary

```
Claude ──MCP──► npm-runner ──spawn──► Playwright ──spawn──► Browsers
                                                              │
                                                              ▼
                                                         Dev Server
                                                              │
Results flow back:                                            │
Claude ◄──MCP── npm-runner ◄──stdout── Playwright ◄──────────┘
```

## Questions to ask Claude 🤖
These are suggested, copy-paste friendly questions to ask Claude (the client/operator) so we can avoid timeouts and enable progress streaming.

1. Increase MCP timeout for long runs?
   - "Can you increase the `timeout` for the `npm-runner` MCP server from the current value to **600000 ms (10 minutes)** (or an even higher value)?"
   - Why: gives headroom beyond the 7min Playwright project timeout and prevents early MCP disconnects.

2. Accept JSON-RPC progress notifications?
   - "Can you accept JSON-RPC `notification` messages from `npm-runner` with method `progress.update` during a long-running test?"
   - If yes: do you prefer periodic summaries (every N seconds) or streaming per key event (test start/finish/fail)?

3. Subscribe to job-based updates or use WebSockets?
   - "Do you prefer subscribing to job updates via the MCP stdio JSON-RPC session, or should `npm-runner` also expose a WebSocket endpoint for UI subscriptions?"
   - Note: We'll implement both — MCP notifications for Claude and an optional WebSocket for dashboards.

4. Final result delivery
   - "Should I send a final `progress.complete` notification with a `resultUrl`/`filePath` (e.g., `data/test-results/{jobId}.json`), or should the client poll `/jobs/:id/result`?"

5. Job lifecycle controls
   - "Do you want the ability to cancel a running job from Claude (e.g., `npm-runner` receives `job.cancel`)?"

6. Security & tokens
   - "Are WebSocket connections permitted and should they accept the current bearer token mechanism? Or do you want a short-lived job token approach?"

### Suggested MCP notification schema (copyable)
```json
{
  "method": "progress.update",
  "params": {
    "jobId": "<jobId>",
    "status": "running|complete|failed|cancelled",
    "percent": 42,
    "testsPassed": 123,
    "testsFailed": 1,
    "lastLog": "Starting Playwright run..."
  }
}
```

### Suggested phrasing for a single Claude message
> "Please set `npm-runner` MCP server `timeout` to `600000`. Also subscribe to `progress.update` notifications during the run and accept a final `progress.complete` with a `resultUrl` pointing to the stored JSON output. If subscribed, I will stream updates every 5–10s and on key events (test start/finish/fail)."

---

Once you ask Claude and confirm which options to accept, I'll implement the server-side: job API (`/jobs`), MCP notifications, WebSocket broadcast, and final result persistence (and provide the exact API docs and example requests for Claude to use).
