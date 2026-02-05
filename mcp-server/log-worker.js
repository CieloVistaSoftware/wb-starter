import { parentPort, workerData } from "worker_threads";
import { createWriteStream, mkdirSync, existsSync } from "fs";
import { join } from "path";

const { logDir } = workerData;
if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });

const logFile = join(logDir, "mcp-traffic.log");
const stream = createWriteStream(logFile, { flags: "a" });

// Startup banner
const banner =
  "\n" +
  "=".repeat(50) +
  "\n" +
  `  MCP npm-runner started: ${new Date().toISOString()}\n` +
  "=".repeat(50) +
  "\n";
stream.write(banner);
process.stderr.write(banner);

parentPort.on("message", ({ timestamp, direction, summary, detail }) => {
  // Compact one-liner to stderr (visible in Claude Desktop dev logs)
  const consoleLine = `[${timestamp}] ${direction} ${summary}\n`;
  process.stderr.write(consoleLine);

  // Full detail to log file (tail with: Get-Content -Wait logs/mcp-traffic.log)
  const fileLine =
    `[${timestamp}] ${direction} ${summary}\n` +
    `${detail}\n` +
    "\u2500".repeat(40) +
    "\n";
  stream.write(fileLine);
});

process.on("exit", () => stream.end());
