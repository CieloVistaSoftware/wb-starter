// temporary builder
const fs = require("fs");
const out = "mcp-server/logs/log-viewer.js";
const lines = [];
function w(s){lines.push(s)}

w(`import { readFileSync, watchFile, existsSync, statSync, openSync, readSync, closeSync } from "fs";`);
w(`import { join, dirname } from "path";`);
w(`import { fileURLToPath } from "url";`);
w(``);
w(`const __dirname = dirname(fileURLToPath(import.meta.url));`);
w(`const LOG_FILE = join(__dirname, "mcp-traffic.log");`);
w(``);

fs.writeFileSync(out, lines.join("\n"), "utf8");
console.log("stub created:", fs.statSync(out).size);
