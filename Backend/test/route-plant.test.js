import { req, log, resetCounts, startServer, stopServer } from "./route-helpers/setup.js";
import { BASE_URL } from "./route-helpers/setup.js";
import { fileURLToPath } from "node:url";

export async function runTests(BASE_URL, token, userUUID, plantUUID) {
  resetCounts();

  let localPlantUUID = plantUUID || "";

  console.log("\n\x1b[33m▓ Plant Route Tests\x1b[0m");

  const auth = { Authorization: `Bearer ${token}` };

  let createdFromTest = false;

  if (!localPlantUUID) {
    const create = await req("POST", "/plants", {
      headers: auth,
      body: {
        name: "Temporary Test Plant",
        category: "crop",
        family: "leafy_greens",
        growthStage: "vegetative",
        plantedAt: new Date().toISOString(),
        soil: { type: "sandy" },
      },
    });
    if (create.status === 201) {
      localPlantUUID = create.data?.data?.uuid || "";
    }
    createdFromTest = true;
  }

  const createRes = await req("POST", "/plants", {
    headers: auth,
    body: {
      name: "Route Test Plant",
      category: "crop",
      family: "leafy_greens",
      growthStage: "vegetative",
      plantedAt: new Date().toISOString(),
      soil: { type: "sandy" },
    },
  });
  const createOk = createRes.status === 201 && !!(createRes.data?.data?.uuid);
  log("POST /plants (201 - create)", createOk ? "PASS" : "FAIL", `→ ${createRes.status}`);
  if (createOk && !localPlantUUID) {
    localPlantUUID = createRes.data.data.uuid;
  }
  if (createOk && createdFromTest) {
    localPlantUUID = createRes.data.data.uuid;
  }

  const listRes = await req("GET", "/plants", { headers: auth });
  const listOk = listRes.status === 200 && Array.isArray(listRes.data?.data);
  log("GET /plants (200 - list)", listOk ? "PASS" : "FAIL", `→ ${listRes.status}`);

  let plantIdForTests = localPlantUUID;
  if (!plantIdForTests) plantIdForTests = "placeholder";

  const getRes = await req("GET", `/plants/${plantIdForTests}`, { headers: auth });
  const getOk = getRes.status === 200 && (getRes.data?.data?.name || "").length > 0;
  log("GET /plants/:id (200 - get one)", getOk ? "PASS" : "FAIL", `→ ${getRes.status}`);

  const updateRes = await req("PUT", `/plants/${plantIdForTests}`, {
    headers: auth,
    body: { name: "Updated Plant Name" },
  });
  const updateOk = updateRes.status === 200 && (updateRes.data?.data?.name || "").includes("Updated");
  log("PUT /plants/:id (200 - update)", updateOk ? "PASS" : "FAIL", `→ ${updateRes.status}`);

  const uploadRes = await req("POST", `/plants/${plantIdForTests}/upload`, {
    headers: auth,
    body: { fileName: "test.jpg", fileType: "image/jpeg" },
  });
  const uploadOk = uploadRes.status === 200 && !!(uploadRes.data?.data?.uploadUrl);
  log("POST /plants/:id/upload (200)", uploadOk ? "PASS" : "FAIL", `→ ${uploadRes.status}`);

  const detectRes = await req("POST", `/plants/${plantIdForTests}/detect`, {
    headers: auth,
    body: { key: "test-key" },
  });
  const detectOk = detectRes.status === 200;
  log("POST /plants/:id/detect (200)", detectOk ? "PASS" : "FAIL", `→ ${detectRes.status}`);

  const extractRes = await req("POST", `/plants/${plantIdForTests}/image/extract`, {
    headers: auth,
    body: { key: "test-key" },
  });
  const extractOk = extractRes.status === 200;
  log("POST /plants/:id/image/extract (200)", extractOk ? "PASS" : "FAIL", `→ ${extractRes.status}`);

  const deleteTarget = await req("POST", "/plants", {
    headers: auth,
    body: {
      name: "Delete Target Plant",
      category: "crop",
      family: "leafy_greens",
      growthStage: "seedling",
      plantedAt: new Date().toISOString(),
      soil: { type: "sandy" },
    },
  });
  const deletePlantId = deleteTarget.status === 201 ? (deleteTarget.data?.data?.uuid || "") : "";
  const deleteRes = await req("DELETE", `/plants/${deletePlantId}`, {
    headers: auth,
  });
  const deleteOk = deleteRes.status === 200;
  log("DELETE /plants/:id (200 - delete)", deleteOk ? "PASS" : "FAIL", `→ ${deleteRes.status}`);

  const genUploadRes = await req("POST", "/plants/image/upload", {
    body: { fileName: "general.jpg", fileType: "image/jpeg" },
  });
  const genUploadOk = genUploadRes.status === 200 && !!(genUploadRes.data?.data?.uploadUrl);
  log("POST /plants/image/upload public (200)", genUploadOk ? "PASS" : "FAIL", `→ ${genUploadRes.status}`);

  const genDetectRes = await req("POST", "/plants/detect", {
    body: { key: "test-key" },
  });
  const genDetectOk = genDetectRes.status === 200;
  log("POST /plants/detect public (200)", genDetectOk ? "PASS" : "FAIL", `→ ${genDetectRes.status}`);
}

const __filename = fileURLToPath(import.meta.url);
const isMain = process.argv[1] === __filename;

if (isMain) {
  (async () => {
    await startServer();

    const email = `route-plant-${Date.now()}@example.com`;
    const signup = await req("POST", "/auth/signup", {
      body: { name: "Route Plant User", email, password: "TestPass123!", location: { city: "Gaza" } },
    });
    if (signup.status !== 201) {
      console.error("Failed to create test user");
      stopServer();
      process.exit(1);
    }

    const token = signup.data?.tokens?.accessToken || "";
    const userUUID = signup.data?.user?.uuid || "";

    const createPlant = await req("POST", "/plants", {
      headers: { Authorization: `Bearer ${token}` },
      body: {
        name: "Standalone Test Plant",
        category: "crop",
        family: "leafy_greens",
        growthStage: "vegetative",
        plantedAt: new Date().toISOString(),
        soil: { type: "sandy" },
      },
    });
    const plantUUID = createPlant.status === 201 ? (createPlant.data?.data?.uuid || "") : "";

    await runTests(BASE_URL, token, userUUID, plantUUID);

    stopServer();
  })().catch((e) => {
    console.error(e);
    stopServer();
    process.exit(1);
  });
}
