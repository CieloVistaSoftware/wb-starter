# MCP NPM Runner

An MCP server that allows Claude to run npm commands in your project.

## Setup

### 1. Install Dependencies

```powershell
cd C:\Users\jwpmi\Downloads\AI\my-website\mcp-server
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
      "args": ["C:\\Users\\jwpmi\\Downloads\\AI\\my-website\\mcp-server\\server.js"]
    }
  }
}
```

### 3. Restart Claude Desktop

Close and reopen Claude Desktop to load the new MCP server.

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

## Output

Test results are automatically saved to:
```
my-website/data/test-results.json
```
