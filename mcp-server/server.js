import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { spawn } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = join(__dirname, "..");

const server = new Server(
  {
    name: "npm-runner",
    version: "2.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "npm_test_async",
        description:
          "Launch tests ASYNCHRONOUSLY via npm run test:async. Returns immediately. " +
          "Only ONE test run at a time (enforced by lock file). " +
          "Poll data/test-status.json to monitor. Final results in data/test-results.json.",
        inputSchema: {
          type: "object",
          properties: {
            filter: {
              type: "string",
              description:
                "Optional: Playwright args passed through (e.g., '--grep compliance' or '--workers=1')",
            },
          },
          required: [],
        },
      },
      {
        name: "npm_command",
        description: "Run any npm command in the wb-starter project (NOT for tests)",
        inputSchema: {
          type: "object",
          properties: {
            command: {
              type: "string",
              description:
                "The npm command to run (e.g., 'run build', 'install', 'run lint')",
            },
          },
          required: ["command"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "npm_test_async") {
    return await launchTestsAsync(args?.filter);
  }

  if (name === "npm_command") {
    return await runNpmCommand(args.command);
  }

  return {
    content: [{ type: "text", text: `Unknown tool: ${name}` }],
    isError: true,
  };
});

/**
 * Launches npm run test:async — the script handles lock files,
 * status updates, and everything else. We just call it and return.
 */
async function launchTestsAsync(filter) {
  const parts = ["run", "test:async"];
  if (filter) {
    parts.push("--", ...filter.split(" "));
  }

  try {
    const result = await runCommand("npm", parts, PROJECT_DIR);

    // The script returns immediately, so this should be fast.
    // Check if it was blocked by the lock.
    if (result.exitCode === 1 && result.stderr.includes("already running")) {
      return {
        content: [
          {
            type: "text",
            text: `\u274c ${result.stderr.trim()}\n\nPoll \`data/test-status.json\` to monitor the active run.`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: result.stdout.trim() + "\n\nPoll `data/test-status.json` to check progress.",
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        { type: "text", text: `Error launching tests: ${error.message}` },
      ],
      isError: true,
    };
  }
}

async function runNpmCommand(command) {
  // Guard: block test commands — use npm_test_async instead
  const lowerCmd = command.toLowerCase();
  if (
    lowerCmd.includes("playwright test") ||
    lowerCmd.match(/run\s+test/) ||
    lowerCmd.match(/^test$/)
  ) {
    return {
      content: [
        {
          type: "text",
          text: "\u274c BLOCKED: Tests must run via npm_test_async only. Only John can run sync tests at the console.",
        },
      ],
      isError: true,
    };
  }

  const startTime = Date.now();
  const parts = command.split(" ");

  try {
    const result = await runCommand("npm", parts, PROJECT_DIR);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    return {
      content: [
        {
          type: "text",
          text:
            `## npm ${command} (${duration}s)\n\n` +
            `**Exit Code:** ${result.exitCode}\n\n` +
            `### Output:\n\`\`\`\n${result.stdout}\n\`\`\`\n` +
            (result.stderr
              ? `### Stderr:\n\`\`\`\n${result.stderr}\n\`\`\``
              : ""),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        { type: "text", text: `Error running npm ${command}: ${error.message}` },
      ],
      isError: true,
    };
  }
}

function runCommand(command, args, cwd) {
  return new Promise((resolve) => {
    const proc = spawn(command, args, {
      cwd,
      shell: true,
      env: { ...process.env, FORCE_COLOR: "0" },
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (exitCode) => {
      resolve({ stdout, stderr, exitCode });
    });

    proc.on("error", (err) => {
      resolve({ stdout, stderr: err.message, exitCode: 1 });
    });
  });
}

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);

// --- Ensure a TCP /health endpoint when MCP_HEALTH_PORT is configured ---
// This allows external tooling (CI, healthcheck scripts, wrappers) to
// reliably detect that the MCP npm-runner is up even when the primary
// transport is stdio. The wrapper `scripts/start-mcp.js` relies on this.
const healthPort = Number(process.env.MCP_HEALTH_PORT || process.env.MCP_PORT || 0);
if (healthPort) {
  try {
    const { createServer } = await import('http');

    const healthServer = createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', pid: process.pid, ts: new Date().toISOString() }));
        return;
      }
      res.writeHead(404);
      res.end();
    });

    healthServer.listen(healthPort, '127.0.0.1', () => {
      console.log(`[mcp-server] health endpoint available at http://127.0.0.1:${healthPort}/health`);
    });

    healthServer.on('error', (err) => {
      console.error('[mcp-server] health server error:', err && err.message);
    });

    // Best-effort cleanup on exit/signals
    const _closeHealth = () => {
      try { healthServer.close(); } catch (e) {}
    };
    ['exit','SIGINT','SIGTERM','SIGHUP'].forEach(ev => process.on(ev, _closeHealth));
  } catch (err) {
    console.error('[mcp-server] failed to start health endpoint:', err && err.message);
  }
}
