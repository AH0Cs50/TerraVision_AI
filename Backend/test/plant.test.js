import assert from "assert";
import { plantService, userService } from "../shared/container.js";

async function runTests() {
  console.log("Running PlantService Tests...\n");

  // First, create a test user for plant operations
  const testUserData = {
    name: "Plant Owner",
    email: `plant-user-${Date.now()}@example.com`,
    password: "PlantPass123!",
    location: { city: "Gaza" },
  };

  let testUser = null;
  let testUserInternalId = null;

  // Setup: Create test user
  try {
    testUser = await userService.createUser(testUserData);
    testUserInternalId = testUser.internalId;
    console.log("✅ Setup: Test user created");
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    return;
  }

  // Test Plant Data
  const testPlantData = {
    name: "Tomato Plant",
    varietyName: "Cherry Tomato",
    plantType: "crop",
    family: "leafy_greens",
    growthStage: "vegetative",
    plantedAt: new Date(),
    userInternalId: testUserInternalId,
    soil: { type: "sandy", moisture: 60 },
  };

  let createdPlant = null;

  // =========================
  // Test 1: Create Plant
  // =========================
  try {
    createdPlant = await plantService.createPlant(testPlantData);

    assert(createdPlant.name === testPlantData.name, "Plant name mismatch");
    assert(createdPlant.plantType === testPlantData.plantType, "Plant type mismatch");
    assert(createdPlant.uuid, "Plant UUID not generated");
    assert(
      createdPlant.userInternalId === testUserInternalId,
      "User ID mismatch",
    );

    console.log("✅ Test 1 passed: Plant created successfully");
  } catch (error) {
    console.error("❌ Test 1 failed:", error.message);
  }

  // =========================
  // Test 2: Get Plant by UUID
  // =========================
  try {
    const foundPlant = await plantService.getPlantByUUID(createdPlant.uuid);

    assert(foundPlant.uuid === createdPlant.uuid, "Plant UUID mismatch");
    assert(
      foundPlant.name === testPlantData.name,
      "Plant name mismatch on get",
    );
    console.log("✅ Test 2 passed: Plant retrieved by UUID");
  } catch (error) {
    console.error("❌ Test 2 failed:", error.message);
  }

  // =========================
  // Test 3: Get User Plants
  // =========================
  try {
    const userPlants = await plantService.getUserPlants(testUserInternalId);

    assert(Array.isArray(userPlants), "Should return an array");
    assert(userPlants.length > 0, "Should have at least one plant");
    assert(
      userPlants.some((p) => p.uuid === createdPlant.uuid),
      "Created plant not found in user plants",
    );

    console.log("✅ Test 3 passed: User plants retrieved");
  } catch (error) {
    console.error("❌ Test 3 failed:", error.message);
  }

  // =========================
  // Test 4: Create Additional Plants for Pagination
  // =========================
  try {
      const plant2 = await plantService.createPlant({
        ...testPlantData,
        name: "Lettuce Plant",
        family: "leafy_greens",
      });

      const plant3 = await plantService.createPlant({
        ...testPlantData,
        name: "Pepper Plant",
        family: "fruiting_nightshade",
      });

    console.log(
      "✅ Test 4 passed: Additional plants created for pagination tests",
    );
  } catch (error) {
    console.error("❌ Test 4 failed:", error.message);
  }

  // =========================
  // Test 5: Update Plant
  // =========================
  try {
      const updateData = {
        growthStage: "flowering",
        watering: { hoursSinceLastWatering: 6 },
      };

      const updatedPlant = await plantService.updatePlant(
        createdPlant.uuid,
        updateData,
      );

      assert(
        updatedPlant.growthStage === updateData.growthStage,
        "Plant growthStage not updated",
      );
    assert(
      updatedPlant.uuid === createdPlant.uuid,
      "Plant UUID should remain same",
    );

    console.log("✅ Test 5 passed: Plant updated successfully");
  } catch (error) {
    console.error("❌ Test 5 failed:", error.message);
  }

  // =========================
  // Test 6: Get All Plants (Admin)
  // =========================
  try {
    const allPlants = await plantService.getAllPlants();

    assert(Array.isArray(allPlants), "Should return an array");
    assert(allPlants.length > 0, "Should have at least one plant");

    console.log(
      `✅ Test 6 passed: Retrieved all plants (${allPlants.length} total)`,
    );
  } catch (error) {
    console.error("❌ Test 6 failed:", error.message);
  }

  // =========================
  // Test 7: Paginate Plants
  // =========================
  try {
    const paginatedResult = await plantService.paginatePlants({
      page: 1,
      limit: 2,
    });

    assert(paginatedResult.data, "Should have data property");
    assert(paginatedResult.pagination, "Should have pagination property");
    assert(paginatedResult.pagination.page === 1, "Page number mismatch");
    assert(paginatedResult.pagination.limit === 2, "Limit mismatch");

    console.log("✅ Test 7 passed: Plants paginated successfully");
  } catch (error) {
    console.error("❌ Test 7 failed:", error.message);
  }

  // =========================
  // Test 8: Delete Plant
  // =========================
  try {
    const result = await plantService.deletePlant(createdPlant.uuid);

    assert(result === true, "Plant not deleted");
    console.log("✅ Test 8 passed: Plant deleted successfully");
  } catch (error) {
    console.error("❌ Test 8 failed:", error.message);
  }

  // =========================
  // Test 9: Get Deleted Plant (Should fail)
  // =========================
  try {
    await plantService.getPlantByUUID(createdPlant.uuid);
    console.log(
      "❌ Test 9 failed: Should have thrown error for non-existent plant",
    );
  } catch (error) {
    console.log("✅ Test 9 passed: Deleted plant correctly not found");
  }

  // Cleanup: Delete test user
  try {
    await userService.deleteUser(testUserInternalId);
    console.log("✅ Cleanup: Test user deleted");
  } catch (error) {
    console.error("⚠️ Cleanup warning:", error.message);
  }

  console.log("\n🎉 PlantService tests completed\n");
}

runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
