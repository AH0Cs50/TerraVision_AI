import assert from "assert";
import {
  waterPlant,
  fertilizePlant,
  harvestPlant,
  updateLight,
  treatDisease,
  prunePlant,
} from "../../usecases/plant-care-action.usecase.js";
import { signup } from "../../usecases/auth.usecases.js";
import { createPlant } from "../../usecases/plant.usecase.js";
import { userRepo, plantRepo, plantCareStateService, actionLogRepo } from "../../shared/container.js";

async function runTests() {
  console.log("Running Plant Care Action UseCase Tests...\n");

  const testEmail = `test-care-${Date.now()}@example.com`;
  let user, plant;

  try {
    const signupResult = await signup({
      name: "Care Taker",
      email: testEmail,
      password: "TestPass123!",
      location: { city: "Gaza" },
    });
    const rawUser = await userRepo.findByUUID(signupResult.user.uuid);
    user = { uuid: signupResult.user.uuid, role: signupResult.user.role, internalId: rawUser.internalId };
    console.log(`  Created user: ${user.uuid}`);

    plant = await createPlant({
      name: "Care Test Plant",
      category: "crop",
      family: "leafy_greens",
      growthStage: "vegetative",
      plantedAt: new Date().toISOString(),
    }, user);
    console.log(`  Created plant: ${plant.uuid}`);

    // Test 1: Water plant
    const waterResult = await waterPlant(plant.uuid, user);
    assert(waterResult, "Water should return a result");
    console.log("✅ Test 1 passed: Water plant");

    // Test 2: Fertilize plant
    const fertResult = await fertilizePlant(plant.uuid, user);
    assert(fertResult, "Fertilize should return a result");
    console.log("✅ Test 2 passed: Fertilize plant");

    // Test 3: Harvest plant
    const harvestResult = await harvestPlant(plant.uuid, user);
    assert(harvestResult, "Harvest should return a result");
    console.log("✅ Test 3 passed: Harvest plant");

    // Test 4: Update light
    const lightResult = await updateLight(plant.uuid, user, "partial_shade");
    assert(lightResult, "Light update should return a result");
    console.log("✅ Test 4 passed: Update light");

    // Test 5: Treat disease
    const treatResult = await treatDisease(plant.uuid, user);
    assert(treatResult, "Treat disease should return a result");
    console.log("✅ Test 5 passed: Treat disease");

    // Test 6: Prune plant
    const pruneResult = await prunePlant(plant.uuid, user);
    assert(pruneResult, "Prune should return a result");
    console.log("✅ Test 6 passed: Prune plant");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }

  // Cleanup
  try {
    if (plant) {
      await actionLogRepo.deleteByPlantUUID(plant.uuid);
      await plantCareStateService.deleteByPlantUUID(plant.uuid);
      const p = await plantRepo.findByUUID(plant.uuid);
      if (p) await plantRepo.deleteByUUID(plant.uuid);
    }
    const u = await userRepo.findByEmail(testEmail);
    if (u) await userRepo.deleteByUUID(u.uuid);
  } catch {}

  console.log("\n🎉 Plant Care Action tests completed\n");
}

runTests();
