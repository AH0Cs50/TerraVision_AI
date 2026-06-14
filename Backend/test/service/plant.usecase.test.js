import assert from "assert";
import {
  createPlant,
  getPlant,
  updatePlant,
  deletePlant,
  getUserPlants,
} from "../../usecases/plant.usecase.js";
import { signup } from "../../usecases/auth.usecases.js";
import { userRepo, plantRepo } from "../../shared/container.js";

async function runTests() {
  console.log("Running Plant UseCase Tests...\n");

  const testEmail = `test-plant-${Date.now()}@example.com`;
  let user, plant;

  // =========================
  // Test 1: Create plant
  // =========================
  try {
    const signupResult = await signup({
      name: "Plant Owner",
      email: testEmail,
      password: "TestPass123!",
      location: { city: "Gaza" },
    });
    user = { uuid: signupResult.user.uuid, role: signupResult.user.role };

    plant = await createPlant(
      {
        name: "Test Plant",
        category: "crop",
        family: "leafy_greens",
        growthStage: "vegetative",
        plantedAt: new Date(),
      },
      user,
    );

    assert(plant.name === "Test Plant", "Name mismatch");
    assert(plant.uuid, "UUID not generated");
    assert(plant.internalId, "Internal ID not generated");
    console.log("✅ Test 1 passed: Create plant");
  } catch (error) {
    console.error("❌ Test 1 failed:", error.message);
    return;
  }

  // =========================
  // Test 2: Get plant by UUID
  // =========================
  try {
    const found = await getPlant(plant.uuid, user);
    assert(found.uuid === plant.uuid, "UUID mismatch");
    assert(found.name === plant.name, "Name mismatch on get");
    console.log("✅ Test 2 passed: Get plant");
  } catch (error) {
    console.error("❌ Test 2 failed:", error.message);
  }

  // =========================
  // Test 3: Update plant
  // =========================
  try {
    const updated = await updatePlant(plant.uuid, user, { name: "Updated Plant" });
    assert(updated.name === "Updated Plant", "Update failed");
    assert(updated.uuid === plant.uuid, "UUID changed on update");
    console.log("✅ Test 3 passed: Update plant");
  } catch (error) {
    console.error("❌ Test 3 failed:", error.message);
  }

  // =========================
  // Test 4: Get user plants
  // =========================
  try {
    const plants = await getUserPlants(user);
    assert(Array.isArray(plants), "getUserPlants should return array");
    assert(plants.length >= 1, "Should have at least 1 plant");
    const found = plants.find((p) => p.uuid === plant.uuid);
    assert(found, "Created plant should be in user plants");
    console.log("✅ Test 4 passed: Get user plants");
  } catch (error) {
    console.error("❌ Test 4 failed:", error.message);
  }

  // =========================
  // Test 5: Delete plant
  // =========================
  try {
    await deletePlant(plant.uuid, user);
    const deleted = await plantRepo.findByUUID(plant.uuid);
    assert(!deleted, "Plant should be deleted");
    console.log("✅ Test 5 passed: Delete plant");
  } catch (error) {
    console.error("❌ Test 5 failed:", error.message);
  }

  // =========================
  // Test 6: Get deleted plant (should throw)
  // =========================
  try {
    await getPlant(plant.uuid, user);
    console.log("❌ Test 6 failed: Should have thrown for deleted plant");
  } catch (error) {
    assert(error.statusCode === 404, "Should return 404 for deleted plant");
    console.log("✅ Test 6 passed: Deleted plant correctly throws 404");
  }

  // Cleanup
  try {
    const u = await userRepo.findByEmail(testEmail);
    if (u) await userRepo.deleteByUUID(u.uuid);
  } catch {}

  console.log("\nPlant UseCase tests completed\n");
}

runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
