import { startServer, stopServer, resetCounts, getCounts, BASE_URL, req, log, printSummary } from "./route-helpers/setup.js";

async function createSharedUser() {
  const email = `route-test-${Date.now()}@example.com`;
  const signup = await req("POST", "/auth/signup", {
    body: {
      name: "Route Test User",
      email,
      password: "TestPass123!",
      location: { city: "Gaza" },
    },
  });

  if (signup.status !== 201) {
    throw new Error(`Failed to create test user: ${signup.status} ${JSON.stringify(signup.data)}`);
  }

  return {
    token: signup.data.tokens.accessToken,
    userUUID: signup.data.user.uuid,
    email,
  };
}

async function createSharedPlant(token) {
  const create = await req("POST", "/plants", {
    headers: { Authorization: `Bearer ${token}` },
    body: {
      name: "Route Test Plant",
      category: "crop",
      family: "leafy_greens",
      growthStage: "vegetative",
      plantedAt: new Date().toISOString(),
      soil: { type: "sandy" },
    },
  });

  if (create.status !== 201) {
    throw new Error(`Failed to create test plant: ${create.status} ${JSON.stringify(create.data)}`);
  }

  return create.data.data.uuid;
}

async function run() {
  console.log("\n\x1b[36m═══════════════════════════════════════\x1b[0m");
  console.log("\x1b[36m   Route Integration Test Runner\x1b[0m");
  console.log("\x1b[36m═══════════════════════════════════════\x1b[0m\n");

  await startServer();

  const { token, userUUID, email } = await createSharedUser();
  console.log(`  \x1b[33mShared user created: ${email} (${userUUID})\x1b[0m\n`);

  const plantUUID = await createSharedPlant(token);
  console.log(`  \x1b[33mShared plant created: ${plantUUID}\x1b[0m\n`);

  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  const modules = [
    { name: "Auth", file: "./route-auth.test.js" },
    { name: "Plant", file: "./route-plant.test.js" },
    { name: "Plant Care", file: "./route-plant-care.test.js" },
    { name: "User", file: "./route-user.test.js" },
  ];

  for (const mod of modules) {
    resetCounts();
    try {
      const { runTests } = await import(mod.file);
      await runTests(BASE_URL, token, userUUID, plantUUID);
      const c = getCounts();
      totalPassed += c.passed;
      totalFailed += c.failed;
      totalSkipped += c.skipped;
      printSummary(`${mod.name} Route Tests`);
    } catch (err) {
      console.error(`\x1b[31mError loading ${mod.file}: ${err.message}\x1b[0m`);
      totalFailed++;
    }
  }

  stopServer();

  const grandTotal = totalPassed + totalFailed;
  console.log("\x1b[36m═══════════════════════════════════════\x1b[0m");
  console.log(`  \x1b[36mTotal:  ${totalPassed}/${grandTotal} passed,  ${totalFailed}/${grandTotal} failed,  ${totalSkipped} skipped\x1b[0m`);
  console.log("\x1b[36m═══════════════════════════════════════\x1b[0m\n");
}

run().catch((err) => {
  console.error("\x1b[31mFatal error:\x1b[0m", err.message);
  stopServer();
  process.exit(1);
});
