import assert from "assert";
import { analyzeAndSavePlant } from "../../usecases/plant-analyser.usecase.js";
import { signup } from "../../usecases/auth.usecases.js";
import { createPlant } from "../../usecases/plant.usecase.js";
import { userRepo, plantRepo } from "../../shared/container.js";

async function runTests() {
  console.log("Running Plant Analyser UseCase Tests...\n");

  const testEmail = `test-analyser-${Date.now()}@example.com`;
  let user, plant;

  // Setup
  try {
    const signupResult = await signup({
      name: "Analyser Tester",
      email: testEmail,
      password: "TestPass123!",
      location: { city: "Gaza" },
    });
    user = { uuid: signupResult.user.uuid, role: signupResult.user.role };

    plant = await createPlant(
      {
        name: "Analyser Test Plant",
        category: "crop",
        family: "leafy_greens",
        growthStage: "vegetative",
        plantedAt: new Date(),
        soil: { type: "sandy", moisture: 60 },
        watering: { hoursSinceLastWatering: 5 },
      },
      user,
    );

    console.log("Setup: User and plant created");
  } catch (error) {
    console.error("Setup failed:", error.message);
    return;
  }

  // =========================
  // Test 1: Basic analysis returns status, tasks, scores
  // =========================
  try {
    const result = await analyzeAndSavePlant(plant.uuid, user);

    assert(result.status, "Result should have status");
    assert(
      typeof result.status.water === "string",
      "Water status should be string",
    );
    assert(
      typeof result.status.nutrients === "string",
      "Nutrients status should be string",
    );
    assert(
      typeof result.status.health === "string",
      "Health status should be string",
    );
    assert(
      typeof result.status.light === "string",
      "Light status should be string",
    );
    assert(Array.isArray(result.activeTasks), "activeTasks should be array");
    assert(result.scores, "Result should have scores");
    console.log("✅ Test 1 passed: Basic analysis returns complete result");
  } catch (error) {
    console.error("❌ Test 1 failed:", error.message);
  }

  // =========================
  // Test 2: Scores are within valid range [0.5, 2.0]
  // =========================
  try {
    const result = await analyzeAndSavePlant(plant.uuid, user);
    const { waterScore, fertilizerScore, pestRiskScore, lightScore } =
      result.scores;

    [waterScore, fertilizerScore, pestRiskScore, lightScore].forEach(
      (score, i) => {
        const names = ["waterScore", "fertilizerScore", "pestRiskScore", "lightScore"];
        assert(
          score >= 0.5 && score <= 2.0,
          `${names[i]} ${score} outside [0.5, 2.0]`,
        );
      },
    );
    console.log("✅ Test 2 passed: All scores within valid range [0.5, 2.0]");
  } catch (error) {
    console.error("❌ Test 2 failed:", error.message);
  }

  // =========================
  // Test 3: Re-analysis updates scores and status
  // =========================
  try {
    const first = await analyzeAndSavePlant(plant.uuid, user);
    const second = await analyzeAndSavePlant(plant.uuid, user);

    assert(second.status, "Second analysis should have status");
    assert(
      typeof second.scores.waterScore === "number",
      "waterScore should be number",
    );
    assert(
      typeof second.scores.fertilizerScore === "number",
      "fertilizerScore should be number",
    );
    console.log("✅ Test 3 passed: Re-analysis works without errors");
  } catch (error) {
    console.error("❌ Test 3 failed:", error.message);
  }

  // Cleanup
  try {
    const plants = await plantRepo.findByUserInternalId(
      (await userRepo.findByEmail(testEmail)).internalId,
    );
    for (const p of plants) {
      await plantRepo.deleteByUUID(p.uuid);
    }
    const u = await userRepo.findByEmail(testEmail);
    if (u) await userRepo.deleteByUUID(u.uuid);
  } catch {}

  console.log("\nPlant Analyser UseCase tests completed\n");
}

runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
