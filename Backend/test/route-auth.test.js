import { req, log, resetCounts, startServer, stopServer } from "./route-helpers/setup.js";
import { BASE_URL } from "./route-helpers/setup.js";
import { fileURLToPath } from "node:url";

export async function runTests() {
  resetCounts();

  const email = `route-auth-${Date.now()}@example.com`;
  const password = "Password123";
  let accessToken = "";
  let refreshToken = "";

  console.log("\n\x1b[33m▓ Auth Route Tests\x1b[0m");

  const signup = await req("POST", "/auth/signup", {
    body: { name: "Route Auth Test", email, password, location: { city: "Cairo" } },
  });
  const signupOk = signup.status === 201;
  log("POST /auth/signup (201)", signupOk ? "PASS" : "FAIL", `→ ${signup.status}`);
  if (signupOk) {
    accessToken = signup.data?.tokens?.accessToken || "";
    refreshToken = signup.data?.tokens?.refreshToken || "";
  }

  const dupSignup = await req("POST", "/auth/signup", {
    body: { name: "Route Auth Dup", email, password, location: { city: "Cairo" } },
  });
  const dupOk = dupSignup.status === 409;
  log("POST /auth/signup duplicate (409)", dupOk ? "PASS" : "FAIL", `→ ${dupSignup.status} ${dupSignup.data?.message || ""}`);

  const login = await req("POST", "/auth/login", {
    body: { email, password },
  });
  const loginOk = login.status === 200 && login.data?.tokens?.accessToken;
  log("POST /auth/login (200)", loginOk ? "PASS" : "FAIL", `→ ${login.status}`);
  if (loginOk) {
    accessToken = login.data.tokens.accessToken;
    refreshToken = login.data.tokens.refreshToken;
  }

  const loginBad = await req("POST", "/auth/login", {
    body: { email, password: "WrongPassword" },
  });
  const loginBadOk = loginBad.status === 401;
  log("POST /auth/login wrong password (401)", loginBadOk ? "PASS" : "FAIL", `→ ${loginBad.status}`);

  const prevAccess = accessToken;
  const refreshRes = await req("POST", "/auth/refresh", {
    body: { refreshToken },
  });
  const refreshOk = refreshRes.status === 200 && refreshRes.data?.accessToken && refreshRes.data?.accessToken !== prevAccess;
  log("POST /auth/refresh (200)", refreshOk ? "PASS" : "FAIL", `→ ${refreshRes.status}`);
  if (refreshOk) {
    accessToken = refreshRes.data.accessToken;
    refreshToken = refreshRes.data.refreshToken;
  }

  const logout = await req("POST", "/auth/logout", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const logoutOk = logout.status === 200;
  log("POST /auth/logout (200)", logoutOk ? "PASS" : "FAIL", `→ ${logout.status}`);
}

const __filename = fileURLToPath(import.meta.url);
const isMain = process.argv[1] === __filename;

if (isMain) {
  (async () => {
    await startServer();
    await runTests();
    stopServer();
  })().catch((e) => {
    console.error(e);
    stopServer();
    process.exit(1);
  });
}
