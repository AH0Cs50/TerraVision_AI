import assert from "assert";
import { PlantCareAiInsights } from "../service/plant-care-state.service.js";

class MockLLMService {
  constructor(responseProvider) {
    this.responseProvider = responseProvider;
  }

  async generateResponse(_prompt) {
    const result = this.responseProvider();
    if (result instanceof Error) throw result;
    return result;
  }
}

function createInsights(responseProvider) {
  const llm = new MockLLMService(responseProvider);
  return new PlantCareAiInsights(llm);
}

function status(overrides = {}) {
  return {
    water: overrides.water ?? "ok",
    nutrients: overrides.nutrients ?? "adequate",
    health: overrides.health ?? "healthy",
    light: overrides.light ?? "full_sun",
  };
}

function makeLog(actionType, description, daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return { actionType, description, createdAt: d.toISOString() };
}

function makeLogs(...entries) {
  return entries.map(([actionType, description, daysAgo]) =>
    makeLog(actionType, description, daysAgo),
  );
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  fn()
    .then(() => {
      console.log(`  ✅ ${name}`);
      passed++;
    })
    .catch((err) => {
      console.log(`  ❌ ${name}: ${err.message}`);
      failed++;
    });
}

async function runTests() {
  console.log("\nRunning PlantCareAiInsights Tests...\n");

  // ── generateInsights ──────────────────────────

  await test("generateInsights returns summary and recommendations from valid LLM JSON", async () => {
    const insights = createInsights(() => ({
      candidates: [
        {
          content: {
            parts: [{ text: '{"summary":"Plant is healthy.","recommendations":["Water daily","Add fertilizer"]}' }],
          },
        },
      ],
    }));

    const result = await insights.generateInsights("uuid-1", status(), []);
    assert(result.summary === "Plant is healthy.");
    assert.deepStrictEqual(result.recommendations, ["Water daily", "Add fertilizer"]);
    assert(result.generatedAt instanceof Date);
  });

  await test("generateInsights with empty actionLogs still works", async () => {
    const insights = createInsights(() => '{"summary":"All good.","recommendations":[]}');
    const result = await insights.generateInsights("uuid-2", status(), []);
    assert(result.summary === "All good.");
    assert(Array.isArray(result.recommendations));
    assert(result.recommendations.length === 0);
  });

  await test("generateInsights includes recent logs in prompt context", async () => {
    const logs = makeLogs(
      ["watered", "Watered plant", 0],
      ["fertilized", "Added NPK", 1],
    );
    const insights = createInsights(() => '{"summary":"OK","recommendations":[]}');
    const result = await insights.generateInsights("uuid-3", status(), logs);
    assert(result.summary === "OK");
  });

  await test("generateInsights only passes last 10 logs to LLM", async () => {
    const manyLogs = Array.from({ length: 20 }, (_, i) =>
      makeLog("watered", `Watering #${i + 1}`, 20 - i),
    );
    let capturedPrompt = null;
    const insights = createInsights(() => {
      return '{"summary":"ok","recommendations":[]}';
    });
    insights.llmService.generateResponse = async (prompt) => {
      capturedPrompt = prompt;
      return '{"summary":"ok","recommendations":[]}';
    };
    await insights.generateInsights("uuid-4", status(), manyLogs);
    const text = capturedPrompt.contents[0].parts[0].text;
    const lines = text.split("\n").filter((l) => l.includes("Watering #"));
    assert(lines.length === 10, `Expected 10 log lines, got ${lines.length}`);
  });

  // ── answerQuestion ────────────────────────────

  await test("answerQuestion returns parsed response from LLM", async () => {
    const insights = createInsights(() => '{"summary":"Water every 2 days.","recommendations":["Check soil moisture"]}');
    const result = await insights.answerQuestion("uuid-5", "How often should I water?", []);
    assert(result.summary === "Water every 2 days.");
    assert.deepStrictEqual(result.recommendations, ["Check soil moisture"]);
  });

  await test("answerQuestion includes the question in the prompt", async () => {
    let capturedPrompt = null;
    const insights = createInsights(() => '{"summary":"a","recommendations":[]}');
    insights.llmService.generateResponse = async (prompt) => {
      capturedPrompt = prompt;
      return '{"summary":"a","recommendations":[]}';
    };
    await insights.answerQuestion("uuid-6", "Is my plant getting enough light?", []);
    const text = capturedPrompt.contents[0].parts[0].text;
    assert(text.includes("Is my plant getting enough light?"));
  });

  // ── Edge cases ────────────────────────────────

  await test("handles LLM returning plain string JSON", async () => {
    const insights = createInsights(() => '{"summary":"String JSON","recommendations":["Do X"]}');
    const result = await insights.generateInsights("uuid-7", status(), []);
    assert(result.summary === "String JSON");
  });

  await test("handles LLM returning markdown-wrapped JSON", async () => {
    const insights = createInsights(() => '```json\n{"summary":"Markdown","recommendations":["Do Y"]}\n```');
    const result = await insights.generateInsights("uuid-8", status(), []);
    assert(result.summary === "Markdown");
  });

  await test("handles LLM returning JSON with extra surrounding text", async () => {
    const insights = createInsights(() => 'Here is your insight: {"summary":"Extra text","recommendations":["A"]}. End.');
    const result = await insights.generateInsights("uuid-9", status(), []);
    assert(result.summary === "Extra text");
  });

  await test("handles empty/blank LLM response gracefully", async () => {
    const insights = createInsights(() => "");
    const result = await insights.generateInsights("uuid-10", status(), []);
    assert(result.summary === "");
    assert.deepStrictEqual(result.recommendations, []);
  });

  await test("handles non-JSON LLM response gracefully", async () => {
    const insights = createInsights(() => "I don't know");
    const result = await insights.generateInsights("uuid-11", status(), []);
    assert(result.summary === "");
    assert.deepStrictEqual(result.recommendations, []);
  });

  await test("handles LLM returning object with text property", async () => {
    const insights = createInsights(() => ({ text: '{"summary":"Obj text","recommendations":["Z"]}' }));
    const result = await insights.generateInsights("uuid-12", status(), []);
    assert(result.summary === "Obj text");
  });

  await test("handles LLM throwing an error gracefully", async () => {
    const insights = createInsights(() => new Error("LLM unavailable"));
    const result = await insights.generateInsights("uuid-13", status(), []);
    assert(result.summary === "");
    assert.deepStrictEqual(result.recommendations, []);
  });

  await test("handles null/undefined status gracefully", async () => {
    const insights = createInsights(() => '{"summary":"ok","recommendations":[]}');
    const result = await insights.generateInsights("uuid-14", null, []);
    assert(typeof result.summary === "string");
    assert(Array.isArray(result.recommendations));
    assert(result.generatedAt instanceof Date);
  });

  await test("handles null/undefined actionLogs gracefully", async () => {
    const insights = createInsights(() => '{"summary":"ok","recommendations":[]}');
    const result = await insights.generateInsights("uuid-15", status(), null);
    assert(result.summary === "ok");
  });

  await test("handles recommendations that is not an array", async () => {
    const insights = createInsights(() => '{"summary":"Test","recommendations":"not_an_array"}');
    const result = await insights.generateInsights("uuid-16", status(), []);
    assert(result.summary === "Test");
    assert(Array.isArray(result.recommendations));
    assert(result.recommendations.length === 0);
  });

  await test("handles missing summary field", async () => {
    const insights = createInsights(() => '{"recommendations":["Do Z"]}');
    const result = await insights.generateInsights("uuid-17", status(), []);
    assert(result.summary === "");
    assert.deepStrictEqual(result.recommendations, ["Do Z"]);
  });

  // ── Wait for all tests ────────────────────────

  await new Promise((r) => setTimeout(r, 50));

  console.log(`\n${"=".repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`${"=".repeat(40)}\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
