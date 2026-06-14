import assert from "assert";
import { detectAndSaveDisease } from "../../usecases/disease-detection.usecase.js";
import { signup } from "../../usecases/auth.usecases.js";
import { createPlant } from "../../usecases/plant.usecase.js";
import { userRepo, plantRepo } from "../../shared/container.js";

async function runTests() {
  console.log("Running Disease Detection UseCase Tests...\n");

  const testEmail = `test-disease-${Date.now()}@example.com`;
  let user, plant;

  // Setup: create user + plant
  try {
    const signupResult = await signup({
      name: "Disease Tester",
      email: testEmail,
      password: "TestPass123!",
      location: { city: "Gaza" },
    });
    user = { uuid: signupResult.user.uuid, role: signupResult.user.role };

    plant = await createPlant(
      {
        name: "Disease Test Plant",
        category: "crop",
        family: "leafy_greens",
        growthStage: "vegetative",
        plantedAt: new Date(),
      },
      user,
    );

    console.log("Setup: User and plant created");
  } catch (error) {
    console.error("Setup failed:", error.message);
    return;
  }

  // =========================
  // Test 1: detectAndSaveDisease – ML fallback
  // =========================
  try {
    const key = `plants/${user.uuid}/${plant.uuid}/images/${Date.now()}-test.jpg`;
    const result = await detectAndSaveDisease({
      key,
      userId: user.uuid,
      plantId: plant.uuid,
      expectedPlant: plant.name,
    });

    assert(result.disease, "Result should have disease field");
    assert(result.disease.name === "healthy", "Fallback should be healthy");
    assert(result.disease.confidence === 1, "Fallback confidence should be 1");
    assert(
      Array.isArray(result.diseaseHistory),
      "diseaseHistory should be array",
    );
    assert(result.diseaseHistory.length >= 1, "Should have at least 1 history entry");
    console.log("✅ Test 1 passed: detectAndSaveDisease fallback returns healthy");
  } catch (error) {
    console.error("❌ Test 1 failed:", error.message);
  }

  // =========================
  // Test 2: Disease history accumulates
  // =========================
  try {
    const key2 = `plants/${user.uuid}/${plant.uuid}/images/${Date.now()}-test2.jpg`;
    const result2 = await detectAndSaveDisease({
      key: key2,
      userId: user.uuid,
      plantId: plant.uuid,
      expectedPlant: plant.name,
    });

    assert(result2.diseaseHistory.length >= 2, "Should have 2+ history entries");
    const lastEntry = result2.diseaseHistory[result2.diseaseHistory.length - 1];
    assert(lastEntry.name === "healthy", "Last history entry should be healthy");
    console.log("✅ Test 2 passed: Disease history accumulates correctly");
  } catch (error) {
    console.error("❌ Test 2 failed:", error.message);
  }

  // =========================
  // Test 3: detectAndSaveDisease with nonexistent plant
  // =========================
  try {
    const fakeUUID = "00000000-0000-0000-0000-000000000000";
    await detectAndSaveDisease({
      key: `plants/${user.uuid}/${fakeUUID}/images/${Date.now()}-test.jpg`,
      userId: user.uuid,
      plantId: fakeUUID,
      expectedPlant: "unknown",
    });
    console.log(
      "❌ Test 4 failed: Should have thrown for nonexistent plant",
    );
  } catch (error) {
    assert(error.statusCode === 404, "Should return 404");
    console.log("✅ Test 4 passed: Nonexistent plant throws 404");
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
  } catch { /* cleanup best-effort */ }

  console.log("\nDisease Detection UseCase tests completed\n");
}

runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
