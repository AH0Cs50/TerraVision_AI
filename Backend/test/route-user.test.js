import { req, log, resetCounts, startServer, stopServer } from "./route-helpers/setup.js";
import { BASE_URL } from "./route-helpers/setup.js";
import { fileURLToPath } from "node:url";

export async function runTests(BASE_URL, token, userUUID) {
  resetCounts();

  let passed = 0;
  let failed = 0;

  console.log("\n\x1b[33m▓ User Route Tests\x1b[0m");

  const getUser = await req("GET", `/users/${userUUID}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (getUser.status === 200 && getUser.data?.data?.uuid) {
    log("GET /users/:id (200)", "PASS", `→ ${getUser.status}`);
    passed++;
  } else {
    log("GET /users/:id (200)", "FAIL", `→ ${getUser.status}`);
    failed++;
  }

  const newName = `Updated User ${Date.now()}`;
  const updateUser = await req("PUT", `/users/${userUUID}`, {
    headers: { Authorization: `Bearer ${token}` },
    body: { name: newName },
  });
  if (updateUser.status === 200 && updateUser.data?.data?.name === newName) {
    log("PUT /users/:id (200)", "PASS", `→ ${updateUser.status}`);
    passed++;
  } else {
    log("PUT /users/:id (200)", "FAIL", `→ ${updateUser.status}`);
    failed++;
  }

  const sendEmail = await req("POST", "/users/email", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (sendEmail.status === 200) {
    log("POST /users/email (200)", "PASS", `→ ${sendEmail.status}`);
    passed++;
  } else {
    log("POST /users/email (200)", "FAIL", `→ ${sendEmail.status}`);
    failed++;
  }

  const emailStatus = await req("GET", "/users/email", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (emailStatus.status === 200) {
    log("GET /users/email (200)", "PASS", `→ ${emailStatus.status}`);
    passed++;
  } else {
    log("GET /users/email (200)", "FAIL", `→ ${emailStatus.status}`);
    failed++;
  }

  const verify = await req("GET", "/users/email/verify?token=bad-token");
  if (verify.status === 200 || verify.status === 400) {
    log("GET /users/email/verify (200/400)", "PASS", `→ ${verify.status}`);
    passed++;
  } else {
    log("GET /users/email/verify (200/400)", "FAIL", `→ ${verify.status}`);
    failed++;
  }

  const deleteUser = await req("DELETE", `/users/${userUUID}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (deleteUser.status === 200) {
    log("DELETE /users/:id (200)", "PASS", `→ ${deleteUser.status}`);
    passed++;
  } else {
    log("DELETE /users/:id (200)", "FAIL", `→ ${deleteUser.status}`);
    failed++;
  }

  return { passed, failed };
}

const __filename = fileURLToPath(import.meta.url);
const isMain = process.argv[1] === __filename;

if (isMain) {
  (async () => {
    await startServer();
    const email = `route-user-${Date.now()}@example.com`;
    const signup = await req("POST", "/auth/signup", {
      body: { name: "Route User Test", email, password: "TestPass123!", location: { city: "Gaza" } },
    });
    if (signup.status !== 201) {
      console.error(`Signup failed: ${signup.status}`);
      stopServer();
      process.exit(1);
    }
    const token = signup.data.tokens.accessToken;
    const userUUID = signup.data.user.uuid;
    await runTests(BASE_URL, token, userUUID);
    stopServer();
  })().catch((e) => {
    console.error(e);
    stopServer();
    process.exit(1);
  });
}
