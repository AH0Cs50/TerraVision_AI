import { req, log, resetCounts } from "./route-helpers/setup.js";
import { startServer, stopServer } from "./route-helpers/setup.js";
import { BASE_URL as DEFAULT_URL } from "./route-helpers/setup.js";
import { fileURLToPath } from "node:url";

export async function runTests(baseUrl, token, userUUID, plantUUID) {
  resetCounts();

  const auth = { Authorization: `Bearer ${token}` };

  console.log("\n\x1b[33m▓ Plant Care Route Tests\x1b[0m");

  let passed = 0;
  let failed = 0;

  function check(label, status, detail = "") {
    log(label, status, detail);
    if (status === "PASS") passed++;
    else failed++;
  }

  // 1. POST /plants/:id/analyze (200)
  {
    const r = await req("POST", `/plants/${plantUUID}/analyze`, {
      headers: auth,
    });
    const ok = r.status === 200;
    check("POST /plants/:id/analyze (200)", ok ? "PASS" : "FAIL", `\u2192 ${r.status}`);
  }

  // 2. GET /plants/:id/care-state (200 or 404)
  {
    const r = await req("GET", `/plants/${plantUUID}/care-state`, {
      headers: auth,
    });
    const ok = r.status === 200 || r.status === 404;
    check("GET /plants/:id/care-state (200/404)", ok ? "PASS" : "FAIL", `\u2192 ${r.status}`);
  }

  // 3. GET /plants/:id/logs (200)
  {
    const r = await req("GET", `/plants/${plantUUID}/logs?last=5`, {
      headers: auth,
    });
    const ok = r.status === 200;
    check("GET /plants/:id/logs ?last=5 (200)", ok ? "PASS" : "FAIL", `\u2192 ${r.status}`);
  }

  // 4. POST /plants/:id/logs (201)
  {
    const r = await req("POST", `/plants/${plantUUID}/logs`, {
      headers: auth,
      body: { actionType: "watered", description: "Manual watering" },
    });
    const ok = r.status === 201;
    check("POST /plants/:id/logs (201)", ok ? "PASS" : "FAIL", `\u2192 ${r.status}`);
  }

  // 5. PATCH /plants/:id/water (200)
  {
    const r = await req("PATCH", `/plants/${plantUUID}/water`, {
      headers: auth,
    });
    const ok = r.status === 200;
    check("PATCH /plants/:id/water (200)", ok ? "PASS" : "FAIL", `\u2192 ${r.status}`);
  }

  // 6. POST /plants/:id/fertilize (200)
  {
    const r = await req("POST", `/plants/${plantUUID}/fertilize`, {
      headers: auth,
    });
    const ok = r.status === 200;
    check("POST /plants/:id/fertilize (200)", ok ? "PASS" : "FAIL", `\u2192 ${r.status}`);
  }

  // 7. POST /plants/:id/harvest (200)
  {
    const r = await req("POST", `/plants/${plantUUID}/harvest`, {
      headers: auth,
    });
    const ok = r.status === 200;
    check("POST /plants/:id/harvest (200)", ok ? "PASS" : "FAIL", `\u2192 ${r.status}`);
  }

  // 8. PATCH /plants/:id/light (200)
  {
    const r = await req("PATCH", `/plants/${plantUUID}/light`, {
      headers: auth,
      body: { lightCondition: "partial_shade" },
    });
    const ok = r.status === 200;
    check("PATCH /plants/:id/light (200)", ok ? "PASS" : "FAIL", `\u2192 ${r.status}`);
  }

  // 9. GET /plants/:id/tasks (200)
  {
    const r = await req("GET", `/plants/${plantUUID}/tasks`, {
      headers: auth,
    });
    const ok = r.status === 200;
    check("GET /plants/:id/tasks (200)", ok ? "PASS" : "FAIL", `\u2192 ${r.status}`);
  }

  // 10. POST /plants/:id/tasks (201)
  {
    const r = await req("POST", `/plants/${plantUUID}/tasks`, {
      headers: auth,
      body: { type: "watering", title: "Water plants", priority: "high" },
    });
    const ok = r.status === 201;
    check("POST /plants/:id/tasks (201)", ok ? "PASS" : "FAIL", `\u2192 ${r.status}`);
  }

  // 11. POST /plants/:id/tasks/generate (200 or 404)
  {
    const r = await req("POST", `/plants/${plantUUID}/tasks/generate`, {
      headers: auth,
    });
    const ok = r.status === 200 || r.status === 404;
    check("POST /plants/:id/tasks/generate (200/404)", ok ? "PASS" : "FAIL", `\u2192 ${r.status}`);
  }

  // 12. GET /plants/:id/tasks/overdue (200)
  {
    const r = await req("GET", `/plants/${plantUUID}/tasks/overdue`, {
      headers: auth,
    });
    const ok = r.status === 200;
    check("GET /plants/:id/tasks/overdue (200)", ok ? "PASS" : "FAIL", `\u2192 ${r.status}`);
  }

  // 13. GET /plants/:id/tasks/pending (200)
  {
    const r = await req("GET", `/plants/${plantUUID}/tasks/pending`, {
      headers: auth,
    });
    const ok = r.status === 200;
    check("GET /plants/:id/tasks/pending (200)", ok ? "PASS" : "FAIL", `\u2192 ${r.status}`);
  }

  // 14. GET /plants/:id/tasks/prioritized (200)
  {
    const r = await req("GET", `/plants/${plantUUID}/tasks/prioritized`, {
      headers: auth,
    });
    const ok = r.status === 200;
    check("GET /plants/:id/tasks/prioritized (200)", ok ? "PASS" : "FAIL", `\u2192 ${r.status}`);
  }

  // 15. PATCH /plants/:id/tasks/complete (400) — empty taskId
  {
    const r = await req("PATCH", `/plants/${plantUUID}/tasks/complete`, {
      headers: auth,
      body: { taskId: "" },
    });
    const ok = r.status === 400;
    check("PATCH /plants/:id/tasks/complete empty taskId (400)", ok ? "PASS" : "FAIL", `\u2192 ${r.status}`);
  }

  // 16. DELETE /plants/:id/tasks/completed (200)
  {
    const r = await req("DELETE", `/plants/${plantUUID}/tasks/completed`, {
      headers: auth,
    });
    const ok = r.status === 200;
    check("DELETE /plants/:id/tasks/completed (200)", ok ? "PASS" : "FAIL", `\u2192 ${r.status}`);
  }

  // 17. PATCH /plants/:id/tasks/:taskId/cancel (404)
  {
    const r = await req("PATCH", `/plants/${plantUUID}/tasks/nonexistent-task-id/cancel`, {
      headers: auth,
    });
    const ok = r.status === 404;
    check("PATCH /plants/:id/tasks/:taskId/cancel (404)", ok ? "PASS" : "FAIL", `\u2192 ${r.status}`);
  }

  // 18. PATCH /plants/:id/tasks/:taskId/reopen (404)
  {
    const r = await req("PATCH", `/plants/${plantUUID}/tasks/nonexistent-task-id/reopen`, {
      headers: auth,
    });
    const ok = r.status === 404;
    check("PATCH /plants/:id/tasks/:taskId/reopen (404)", ok ? "PASS" : "FAIL", `\u2192 ${r.status}`);
  }

  // 19. POST /plants/:id/ai-insights (200 or 404)
  {
    const r = await req("POST", `/plants/${plantUUID}/ai-insights`, {
      headers: auth,
    });
    const ok = r.status === 200 || r.status === 404;
    check("POST /plants/:id/ai-insights (200/404)", ok ? "PASS" : "FAIL", `\u2192 ${r.status}`);
  }

  // 20. POST /plants/:id/ai-insights/ask (400) — no question
  {
    const r = await req("POST", `/plants/${plantUUID}/ai-insights/ask`, {
      headers: auth,
      body: {},
    });
    const ok = r.status === 400;
    check("POST /plants/:id/ai-insights/ask no question (400)", ok ? "PASS" : "FAIL", `\u2192 ${r.status}`);
  }

  // 21. POST /plants/:id/ai-insights/ask (200 or 404) — with question
  {
    const r = await req("POST", `/plants/${plantUUID}/ai-insights/ask`, {
      headers: auth,
      body: { question: "Is my plant healthy?" },
    });
    const ok = r.status === 200 || r.status === 404;
    check("POST /plants/:id/ai-insights/ask with question (200/404)", ok ? "PASS" : "FAIL", `\u2192 ${r.status}`);
  }

  // 22. DELETE /plants/:id/logs (200)
  {
    const r = await req("DELETE", `/plants/${plantUUID}/logs`, {
      headers: auth,
    });
    const ok = r.status === 200;
    check("DELETE /plants/:id/logs (200)", ok ? "PASS" : "FAIL", `\u2192 ${r.status}`);
  }

  const total = passed + failed;
  console.log(`\n  \x1b[36mPlant Care Route: ${passed}/${total} passed, ${failed}/${total} failed\x1b[0m\n`);
  return { passed, failed };
}

const __filename = fileURLToPath(import.meta.url);
const isMain = process.argv[1] === __filename;

if (isMain) {
  (async () => {
    await startServer();

    const email = `route-plantcare-${Date.now()}@example.com`;
    const password = "TestPass123!";

    const signup = await req("POST", "/auth/signup", {
      body: { name: "Plant Care Test", email, password, location: { city: "Gaza" } },
    });
    if (signup.status !== 201) {
      console.error("Signup failed, cannot continue");
      stopServer();
      process.exit(1);
    }

    const token = signup.data?.tokens?.accessToken;
    if (!token) {
      console.error("No access token from signup");
      stopServer();
      process.exit(1);
    }

    const userUUID = signup.data?.user?.uuid;
    if (!userUUID) {
      console.error("No user UUID from signup");
      stopServer();
      process.exit(1);
    }

    const plantRes = await req("POST", "/plants", {
      headers: { Authorization: `Bearer ${token}` },
      body: {
        name: "Test Lettuce",
        commonName: "Lettuce",
        category: "crop",
        family: "leafy_greens",
        growthStage: "vegetative",
        plantedAt: new Date().toISOString(),
      },
    });
    if (plantRes.status !== 201) {
      console.error("Plant creation failed, cannot continue");
      stopServer();
      process.exit(1);
    }

    const plantUUID = plantRes.data?.data?.uuid;
    if (!plantUUID) {
      console.error("No plant UUID from creation");
      stopServer();
      process.exit(1);
    }

    const { failed } = await runTests(DEFAULT_URL, token, userUUID, plantUUID);
    stopServer();
    if (failed > 0) process.exit(1);
  })().catch((e) => {
    console.error(e);
    stopServer();
    process.exit(1);
  });
}
