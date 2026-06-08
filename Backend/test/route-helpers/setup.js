import axios from "axios";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = process.env.SERVER_URL || "http://localhost:5500";
export const BASE_URL = `${SERVER_ROOT}/api/v1`;

export let managedServer = null;

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stopManagedServer() {
  if (managedServer && !managedServer.killed) {
    managedServer.kill();
    managedServer = null;
  }
}

export async function isServerReady() {
  try {
    const res = await axios.get(`${SERVER_ROOT}/`, {
      timeout: 1000,
      validateStatus: () => true,
    });
    return res.status >= 200 && res.status < 500;
  } catch {
    return false;
  }
}

export async function startServer() {
  if (await isServerReady()) {
    console.log("  \x1b[33mServer already running\x1b[0m");
    return;
  }

  console.log(`\x1b[33mStarting backend server at ${SERVER_ROOT}...\x1b[0m`);
  managedServer = spawn("node", ["app.js"], {
    cwd: path.resolve(__dirname, "../.."),
    env: { ...process.env, PORT: "5500" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  managedServer.stdout.on("data", (d) => process.stdout.write(`[server] ${d}`));
  managedServer.stderr.on("data", (d) => process.stderr.write(`[server:err] ${d}`));
  managedServer.on("exit", () => { stopManagedServer(); });

  for (let attempt = 0; attempt < 40; attempt++) {
    if (managedServer.exitCode !== null) {
      throw new Error("Backend server exited early");
    }
    if (await isServerReady()) {
      return;
    }
    await sleep(500);
  }

  stopManagedServer();
  throw new Error("Backend server did not become ready");
}

export function stopServer() {
  stopManagedServer();
}

export async function req(method, urlPath, opts = {}) {
  try {
    const headers = { ...opts.headers };
    if (opts.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    const res = await axios({
      method,
      url: `${BASE_URL}${urlPath}`,
      data: opts.body,
      headers,
      validateStatus: () => true,
    });
    return { status: res.status, data: res.data, headers: res.headers };
  } catch (e) {
    return { status: 0, data: { message: e.message }, error: true };
  }
}

let _passed = 0;
let _failed = 0;
let _skipped = 0;

export function resetCounts() {
  _passed = 0;
  _failed = 0;
  _skipped = 0;
}

export function log(label, status, detail = "") {
  const icon =
    status === "PASS"
      ? "\x1b[32m[PASS]\x1b[0m"
      : status === "SKIP"
        ? "\x1b[33m[SKIP]\x1b[0m"
        : "\x1b[31m[FAIL]\x1b[0m";
  console.log(`  ${icon} ${label}${detail ? ` - ${detail}` : ""}`);
  if (status === "PASS") _passed++;
  else if (status === "SKIP") _skipped++;
  else _failed++;
}

export function printSummary(label) {
  const total = _passed + _failed;
  console.log(`\n  \x1b[36m${label}: ${_passed}/${total} passed, ${_failed}/${total} failed, ${_skipped} skipped\x1b[0m\n`);
}

export function getCounts() {
  return { passed: _passed, failed: _failed, skipped: _skipped };
}

const __filename = fileURLToPath(import.meta.url);
const isMain = process.argv[1] === __filename;
if (isMain) {
  console.log("Shared route test utilities — import this module, don't run directly.");
}
