import axios from "axios";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "http://localhost:5500/api/v1";
const SERVER_ROOT = BASE.replace(/\/api\/v1$/, "");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLANT_UPLOAD_IMAGE = path.resolve(
  __dirname,
  "../Ml-service/test_images/potato_early_blight.jpg",
);
const PLANT_UPLOAD_FILE_NAME = path.basename(PLANT_UPLOAD_IMAGE);
const PLANT_UPLOAD_FILE_TYPE = "image/jpeg";

let token = "";
let plantId = "";
let userId = "";

let passed = 0;
let failed = 0;
let skipped = 0;
let managedServer = null;

function log(label, status, detail = "") {
  const icon =
    status === "PASS"
      ? "\x1b[32m[PASS]\x1b[0m"
      : status === "SKIP"
        ? "\x1b[33m[SKIP]\x1b[0m"
        : "\x1b[31m[FAIL]\x1b[0m";
  console.log(`  ${icon} ${label}${detail ? ` - ${detail}` : ""}`);
  if (status === "PASS") passed++;
  else if (status === "SKIP") skipped++;
  else failed++;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isServerReady() {
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

async function startServerIfNeeded() {
  if (await isServerReady()) {
    return;
  }

  console.log(`\x1b[33mStarting backend server at ${SERVER_ROOT}...\x1b[0m`);
  const logs = [];
  managedServer = spawn("node", ["app.js"], {
    cwd: __dirname,
    env: { ...process.env, PORT: "5500" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const capture = (chunk) => {
    const text = chunk.toString();
    logs.push(text);
    if (logs.length > 20) logs.shift();
  };

  managedServer.stdout.on("data", capture);
  managedServer.stderr.on("data", capture);

  for (let attempt = 0; attempt < 40; attempt++) {
    if (managedServer.exitCode !== null) {
      throw new Error(`Backend server exited early:\n${logs.join("")}`);
    }
    if (await isServerReady()) {
      return;
    }
    await sleep(500);
  }

  stopManagedServer();
  throw new Error(`Backend server did not become ready at ${SERVER_ROOT}.\n${logs.join("")}`);
}

function stopManagedServer() {
  if (!managedServer || managedServer.killed) {
    return;
  }

  managedServer.kill();
  managedServer = null;
}

async function req(method, path, opts = {}) {
  try {
    const headers = { ...opts.headers };
    if (opts.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
    const res = await axios({ method, url: `${BASE}${path}`, data: opts.body, headers, validateStatus: () => true });
    return { status: res.status, data: res.data, headers: res.headers };
  } catch (e) {
    return { status: 0, data: { message: e.message }, error: true };
  }
}

async function uploadFileToSignedUrl(uploadUrl, filePath, fileType) {
  try {
    const image = await readFile(filePath);
    const res = await axios.put(uploadUrl, image, {
      headers: { "Content-Type": fileType },
      maxBodyLength: Infinity,
      validateStatus: () => true,
    });

    return { status: res.status, data: res.data, headers: res.headers };
  } catch (e) {
    return { status: 0, data: { message: e.message }, error: true };
  }
}

async function uploadFileToSignedPost(uploadUrl, fields, filePath, fileType) {
  try {
    const image = await readFile(filePath);
    const formData = new FormData();

    for (const [key, value] of Object.entries(fields)) {
      formData.append(key, value);
    }

    formData.append(
      "file",
      new Blob([image], { type: fileType }),
      path.basename(filePath),
    );

    const res = await axios.post(uploadUrl, formData, {
      maxBodyLength: Infinity,
      validateStatus: () => true,
    });

    return { status: res.status, data: res.data, headers: res.headers };
  } catch (e) {
    return { status: 0, data: { message: e.message }, error: true };
  }
}

async function uploadFileToSignedTarget(target, filePath, fileType) {
  if (target?.fields) {
    return uploadFileToSignedPost(
      target.uploadUrl,
      target.fields,
      filePath,
      fileType,
    );
  }

  return uploadFileToSignedUrl(target.uploadUrl, filePath, fileType);
}

async function run() {
  await startServerIfNeeded();
  console.log("\n\x1b[36m═══════════════════════════════════════\x1b[0m");
  console.log("\x1b[36m   TerraVisionAI - API Route Tester\x1b[0m");
  console.log("\x1b[36m═══════════════════════════════════════\x1b[0m\n");

  // ─── Auth ─────────────────────────────────────────────────
  console.log("\x1b[33m▓ Auth Endpoints\x1b[0m");

  const signup = await req("POST", "/auth/signup", {
    body: { name: "Test User", email: `test${Date.now()}@example.com`, password: "Password123", location: { city: "Cairo" } }
  });
  log("POST /auth/signup", signup.status === 201 || signup.status === 200 ? "PASS" : "FAIL",
    `→ ${signup.status} ${signup.data?.message || ""}`);
  token = signup.data?.tokens?.accessToken || "";

  const login = await req("POST", "/auth/login", {
    body: { email: signup.data?.user?.email || `test${Date.now()}@example.com`, password: "Password123" }
  });
  log("POST /auth/login", login.status === 200 ? "PASS" : "FAIL", `→ ${login.status}`);
  if (login.data?.tokens?.accessToken) token = login.data.tokens.accessToken;
  if (login.data?.user?.uuid) userId = login.data.user.uuid;

  const refresh = await req("POST", "/auth/refresh", {
    headers: { Authorization: `Bearer ${token}` },
    body: { refreshToken: login.data?.tokens?.refreshToken || "" }
  });
  log("POST /auth/refresh", refresh.status === 200 ? "PASS" : "FAIL", `→ ${refresh.status}`);

  // ─── Plants ───────────────────────────────────────────────
  console.log("\n\x1b[33m▓ Plant Endpoints\x1b[0m");

  if (!token) { console.log("  \x1b[31m[Skipped] No auth token available\x1b[0m"); failed += 9; }
  else {
    const create = await req("POST", "/plants", {
      headers: { Authorization: `Bearer ${token}` },
      body: { name: "Tomato Plant", category: "crop", family: "fruiting_nightshade", growthStage: "vegetative", plantedAt: new Date().toISOString(), ageDays: 0 }
    });
    log("POST /plants", create.status === 201 ? "PASS" : "FAIL", `→ ${create.status}`);
    plantId = create.data?.data?.uuid || create.data?.data?._id || "";

    const getAll = await req("GET", "/plants", { headers: { Authorization: `Bearer ${token}` } });
    log("GET /plants", getAll.status === 200 ? "PASS" : "FAIL", `→ ${getAll.status}`);

    if (plantId) {
      const getOne = await req("GET", `/plants/${plantId}`, { headers: { Authorization: `Bearer ${token}` } });
      log("GET /plants/:id", getOne.status === 200 ? "PASS" : "FAIL", `→ ${getOne.status}`);

      const update = await req("PUT", `/plants/${plantId}`, {
        headers: { Authorization: `Bearer ${token}` },
        body: { name: "Updated Tomato Plant" }
      });
      log("PUT /plants/:id", update.status === 200 ? "PASS" : "FAIL", `→ ${update.status}`);

      const upload = await req("POST", `/plants/${plantId}/upload`, {
        headers: { Authorization: `Bearer ${token}` },
        body: { fileName: PLANT_UPLOAD_FILE_NAME, fileType: PLANT_UPLOAD_FILE_TYPE }
      });
      log("POST /plants/:id/upload", upload.status === 200 ? "PASS" : "FAIL", `→ ${upload.status}`);

      const uploadedImageKey = upload.data?.data?.key || "test-key";
      if (upload.data?.data?.uploadUrl) {
        const fileUpload = await uploadFileToSignedTarget(
          upload.data.data,
          PLANT_UPLOAD_IMAGE,
          PLANT_UPLOAD_FILE_TYPE,
        );
        const uploadStatus =
          fileUpload.status >= 200 && fileUpload.status < 300
            ? "PASS"
            : fileUpload.status === 404
              ? "SKIP"
              : "FAIL";
        const uploadDetail =
          fileUpload.status === 404
            ? `→ 404 S3 bucket not available (${path.relative(__dirname, PLANT_UPLOAD_IMAGE)})`
            : `→ ${fileUpload.status} (${path.relative(__dirname, PLANT_UPLOAD_IMAGE)})`;

        log(
          "PUT signed plant image upload URL",
          uploadStatus,
          uploadDetail,
        );
      } else {
        log("PUT signed plant image upload URL", "FAIL", "→ missing uploadUrl");
      }

      const detect = await req("POST", `/plants/${plantId}/detect`, {
        headers: { Authorization: `Bearer ${token}` },
        body: { key: uploadedImageKey }
      });
      log("POST /plants/:id/detect", detect.status === 200 ? "PASS" : "FAIL", `→ ${detect.status}`);

      const delImg = await req("DELETE", `/plants/${plantId}/images`, {
        headers: { Authorization: `Bearer ${token}` },
        body: { key: uploadedImageKey }
      });
      log("DELETE /plants/:id/images", delImg.status === 200 ? "PASS" : "FAIL", `→ ${delImg.status}`);
    } else {
      console.log("  \x1b[33m[Skipped] 5 plant sub-routes (no plantId)\x1b[0m"); failed += 5;
    }

    const uploadGen = await req("POST", "/plants/upload", {
      headers: { Authorization: `Bearer ${token}` },
      body: { fileName: "general.jpg", fileType: "image/jpeg" }
    });
    log("POST /plants/upload", uploadGen.status === 200 ? "PASS" : "FAIL", `→ ${uploadGen.status}`);

    const generalUploadKey = uploadGen.data?.data?.key || "";
    if (uploadGen.data?.data?.uploadUrl) {
      const generalFileUpload = await uploadFileToSignedTarget(
        uploadGen.data.data,
        PLANT_UPLOAD_IMAGE,
        PLANT_UPLOAD_FILE_TYPE,
      );
      const generalUploadStatus =
        generalFileUpload.status >= 200 && generalFileUpload.status < 300
          ? "PASS"
          : generalFileUpload.status === 404
            ? "SKIP"
            : "FAIL";
      log(
        "PUT signed general image upload URL",
        generalUploadStatus,
        `→ ${generalFileUpload.status}`,
      );
    } else {
      log("PUT signed general image upload URL", "FAIL", "→ missing uploadUrl");
    }

    const detectGen = await req("POST", "/plants/detect", {
      headers: { Authorization: `Bearer ${token}` },
      body: { key: generalUploadKey || "test-key" }
    });
    log("POST /plants/detect", detectGen.status === 200 ? "PASS" : "FAIL", `→ ${detectGen.status}`);

    // ─── Plant Care ───────────────────────────────────────
    console.log("\n\x1b[33m▓ Plant Care Endpoints\x1b[0m");

    if (plantId) {
      const analyze = await req("POST", `/plants/${plantId}/analyze`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      log("POST /plants/:id/analyze", analyze.status === 200 ? "PASS" : "FAIL", `→ ${analyze.status}`);

      const careState = await req("GET", `/plants/${plantId}/care-state`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      log("GET /plants/:id/care-state", careState.status === 200 ? "PASS" : "FAIL", `→ ${careState.status}`);

      const logs = await req("GET", `/plants/${plantId}/logs?last=3`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      log("GET /plants/:id/logs", logs.status === 200 ? "PASS" : "FAIL", `→ ${logs.status}`);

      const addLog = await req("POST", `/plants/${plantId}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
        body: { actionType: "watering", description: "Watered the plant" }
      });
      log("POST /plants/:id/logs", addLog.status === 201 ? "PASS" : "FAIL", `→ ${addLog.status}`);

      const tasks = await req("GET", `/plants/${plantId}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      log("GET /plants/:id/tasks", tasks.status === 200 ? "PASS" : "FAIL", `→ ${tasks.status}`);

      const addTask = await req("POST", `/plants/${plantId}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
        body: { type: "watering", title: "Water the plant", priority: "high" }
      });
      log("POST /plants/:id/tasks", addTask.status === 201 ? "PASS" : "FAIL", `→ ${addTask.status}`);

      const aiInsights = await req("POST", `/plants/${plantId}/ai-insights`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      log("POST /plants/:id/ai-insights", aiInsights.status === 200 ? "PASS" : "FAIL", `→ ${aiInsights.status}`);

      const completeTask = await req("PATCH", `/plants/${plantId}/tasks/complete`, {
        headers: { Authorization: `Bearer ${token}` },
        body: { taskId: "" }
      });
      log("PATCH /plants/:id/tasks/complete", completeTask.status === 400 ? "PASS" : "FAIL",
        `→ ${completeTask.status} (expected 400 - no taskId)`);

      const deletePlant = await req("DELETE", `/plants/${plantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      log("DELETE /plants/:id", deletePlant.status === 200 ? "PASS" : "FAIL", `→ ${deletePlant.status}`);
    } else {
      console.log("  \x1b[33m[Skipped] 9 plant-care sub-routes (no plantId)\x1b[0m"); failed += 9;
    }

    // ─── Users ────────────────────────────────────────────
    console.log("\n\x1b[33m▓ User Endpoints\x1b[0m");

    if (userId) {
      const getUser = await req("GET", `/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      log("GET /users/:id", getUser.status === 200 ? "PASS" : "FAIL", `→ ${getUser.status}`);

      const updateUser = await req("PUT", `/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        body: { name: "Updated Test User" }
      });
      log("PUT /users/:id", updateUser.status === 200 ? "PASS" : "FAIL", `→ ${updateUser.status}`);

      const sendEmail = await req("POST", "/users/email", {
        headers: { Authorization: `Bearer ${token}` }
      });
      log("POST /users/email", sendEmail.status === 200 ? "PASS" : "FAIL", `→ ${sendEmail.status}`);

      const emailStatus = await req("GET", "/users/email", {
        headers: { Authorization: `Bearer ${token}` }
      });
      log("GET /users/email", emailStatus.status === 200 ? "PASS" : "FAIL", `→ ${emailStatus.status}`);

      const verifyEmail = await req("GET", "/users/email/verify?token=bad-token");
      log("GET /users/email/verify", verifyEmail.status === 200 || verifyEmail.status === 400 ? "PASS" : "FAIL",
        `→ ${verifyEmail.status}`);

      const deleteUser = await req("DELETE", `/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      log("DELETE /users/:id", deleteUser.status === 200 ? "PASS" : "FAIL", `→ ${deleteUser.status}`);
    } else {
      console.log("  \x1b[33m[Skipped] 6 user sub-routes (no userId)\x1b[0m"); failed += 6;
    }
  }

  // ─── Summary ─────────────────────────────────────────────
  const total = passed + failed;
  console.log("\n\x1b[36m═══════════════════════════════════════\x1b[0m");
  console.log(`  \x1b[36mResults:  ${passed}/${total} passed,  ${failed}/${total} failed,  ${skipped} skipped\x1b[0m`);
  console.log("\x1b[36m═══════════════════════════════════════\x1b[0m\n");
}

run();
