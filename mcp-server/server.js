import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { spawn } from "child_process";
import { writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = join(__dirname, "..");

const server = new Server(
  {
    name: "npm-runner",
    version: "1.0.0",
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
        name: "npm_test",
        description: "Run npm test in the my-website project. Returns test results and writes them to data/test-results.json",
        inputSchema: {
          type: "object",
          properties: {
            filter: {
              type: "string",
              description: "Optional: filter to run specific tests (e.g., 'schema' or 'compliance')",
            },
            singleThread: {
              type: "boolean",
              description: "Run tests in single-threaded mode for easier debugging",
              default: false,
            },
          },
          required: [],
        },
      },
      {
        name: "npm_command",
        description: "Run any npm command in the my-website project",
        inputSchema: {
          type: "object",
          properties: {
            command: {
              type: "string",
              description: "The npm command to run (e.g., 'run build', 'install', 'run lint')",
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

  if (name === "npm_test") {
    return await runNpmTest(args?.filter, args?.singleThread);
  }

  if (name === "npm_command") {
    return await runNpmCommand(args.command);
  }

  return {
    content: [{ type: "text", text: `Unknown tool: ${name}` }],
    isError: true,
  };
});

async function runNpmTest(filter, singleThread) {
  const startTime = Date.now();
  
  let command = "npx";
  let cmdArgs = ["playwright", "test"];
  
  if (singleThread) {
    cmdArgs.push("--workers=1");
  }
  
  if (filter) {
    cmdArgs.push("--grep", filter);
  }

  try {
    const result = await runCommand(command, cmdArgs, PROJECT_DIR);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Parse results for summary
    const summary = parseTestOutput(result.stdout + result.stderr);
    
    // Write results to JSON file
    const jsonResult = {
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      exitCode: result.exitCode,
      summary,
      filter: filter || null,
      singleThread: singleThread || false,
      stdout: result.stdout,
      stderr: result.stderr,
    };
    
    const outputPath = join(PROJECT_DIR, "data", "test-results.json");
    await writeFile(outputPath, JSON.stringify(jsonResult, null, 2));

    return {
      content: [
        {
          type: "text",
          text: `## Test Results (${duration}s)\n\n` +
                `**Status:** ${result.exitCode === 0 ? "✅ PASSED" : "❌ FAILED"}\n` +
                `**Summary:** ${summary}\n\n` +
                `Results saved to: data/test-results.json\n\n` +
                `### Output:\n\`\`\`\n${result.stdout}\n\`\`\`\n` +
                (result.stderr ? `### Errors:\n\`\`\`\n${result.stderr}\n\`\`\`` : ""),
        },
      ],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error running tests: ${error.message}` }],
      isError: true,
    };
  }
}

async function runNpmCommand(command) {
  const startTime = Date.now();
  const parts = command.split(" ");
  
  try {
    const result = await runCommand("npm", parts, PROJECT_DIR);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    return {
      content: [
        {
          type: "text",
          text: `## npm ${command} (${duration}s)\n\n` +
                `**Exit Code:** ${result.exitCode}\n\n` +
                `### Output:\n\`\`\`\n${result.stdout}\n\`\`\`\n` +
                (result.stderr ? `### Stderr:\n\`\`\`\n${result.stderr}\n\`\`\`` : ""),
        },
      ],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error running npm ${command}: ${error.message}` }],
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

function parseTestOutput(output) {
  // Try to extract pass/fail counts from Playwright output
  const passMatch = output.match(/(\d+) passed/);
  const failMatch = output.match(/(\d+) failed/);
  const skipMatch = output.match(/(\d+) skipped/);
  
  const passed = passMatch ? parseInt(passMatch[1]) : 0;
  const failed = failMatch ? parseInt(failMatch[1]) : 0;
  const skipped = skipMatch ? parseInt(skipMatch[1]) : 0;
  
  if (passed || failed || skipped) {
    return `${passed} passed, ${failed} failed, ${skipped} skipped`;
  }
  
  return "Could not parse test summary";
}

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);
