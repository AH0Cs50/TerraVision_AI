import assert from "assert";
import { plantService, userService } from "../shared/container.js";

async function runTests() {
  console.log("Running PlantService Extra Tests...\n");

  // Setup: Create two users (owner + other)
  let ownerUUID, otherUUID, plantUUID;
  try {
    const owner = await userService.createUser({
      name: "Plant Owner",
      email: `owner-${Date.now()}@example.com`,
      password: "TestPass123!",
    });
    ownerUUID = owner.uuid;

    const other = await userService.createUser({
      name: "Other User",
      email: `other-${Date.now()}@example.com`,
      password: "TestPass456!",
    });
    otherUUID = other.uuid;

    const plant = await plantService.createPlant(
      {
        name: "Extra Test Plant",
        category: "crop",
        family: "leafy_greens",
        growthStage: "vegetative",
        plantedAt: new Date().toISOString(),
        soil: { type: "sandy", moisture: 50 },
        watering: { hoursSinceLastWatering: 8 },
      },
      ownerUUID,
    );
    plantUUID = plant.uuid;
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    return;
  }

  // =========================
  // T1: verifyPlantAccess - success (owner can access)
  // =========================
  try {
    const result = await plantService.verifyPlantAccess(plantUUID, ownerUUID, "user");
    assert(result.uuid === plantUUID, "Should return the plant");
    console.log("✅ T1 passed: verifyPlantAccess allows owner");
  } catch (error) {
    console.error("❌ T1 failed:", error.message);
  }

  // =========================
  // T2: verifyPlantAccess - forbidden (other user)
  // =========================
  try {
    await plantService.verifyPlantAccess(plantUUID, otherUUID, "user");
    console.log("❌ T2 failed: Should throw FORBIDDEN for other user");
  } catch (error) {
    assert(error.statusCode === 403, "Should be FORBIDDEN");
    console.log("✅ T2 passed: verifyPlantAccess rejects other user");
  }

  // =========================
  // T3: verifyPlantAccess - not found (non-existent plant)
  // =========================
  try {
    await plantService.verifyPlantAccess("nonexistent-uuid", ownerUUID, "user");
    console.log("❌ T3 failed: Should throw NOT_FOUND");
  } catch (error) {
    assert(error.statusCode === 404, "Should be NOT_FOUND");
    console.log("✅ T3 passed: verifyPlantAccess rejects missing plant");
  }

  // =========================
  // T4: verifyPlantAccess - admin bypass
  // =========================
  try {
    const result = await plantService.verifyPlantAccess(plantUUID, otherUUID, "admin");
    assert(result.uuid === plantUUID, "Admin should bypass ownership check");
    console.log("✅ T4 passed: verifyPlantAccess allows admin bypass");
  } catch (error) {
    console.error("❌ T4 failed:", error.message);
  }

  // =========================
  // T5: getEnginePlantInput - returns correct shape
  // =========================
  try {
    const input = await plantService.getEnginePlantInput(plantUUID);
    assert(input.plant, "Should have plant field");
    assert(input.plant.category === "crop", "Should include category");
    assert(input.plant.family === "leafy_greens", "Should include family");
    assert(input.plant.growthStage === "vegetative", "Should include growthStage");
    assert(input.soil, "Should have soil field");
    assert(input.soil.type === "sandy", "Should include soil type");
    assert(input.soil.moisture === 50, "Should include moisture");
    assert(input.watering, "Should have watering field");
    assert(input.watering.hoursSinceLastWatering === 8, "Should include watering");
    assert(input.stress, "Should have stress field");
    console.log("✅ T5 passed: getEnginePlantInput returns correct shape");
  } catch (error) {
    console.error("❌ T5 failed:", error.message);
  }

  // =========================
  // T6: getEnginePlantInput - throws for non-existent plant
  // =========================
  try {
    await plantService.getEnginePlantInput("nonexistent");
    console.log("❌ T6 failed: Should throw for missing plant");
  } catch (error) {
    assert(error.statusCode === 404, "Should be NOT_FOUND");
    console.log("✅ T6 passed: getEnginePlantInput throws for missing plant");
  }

  // =========================
  // T7: getInternalId - returns number for existing plant
  // =========================
  try {
    const internalId = await plantService.getInternalId(plantUUID);
    assert(typeof internalId === "number", "Should return a number");
    assert(internalId > 0, "Should be positive");
    console.log("✅ T7 passed: getInternalId returns numeric ID");
  } catch (error) {
    console.error("❌ T7 failed:", error.message);
  }

  // =========================
  // T8: getInternalId - returns null for non-existent
  // =========================
  try {
    const result = await plantService.getInternalId("nonexistent");
    assert(result === null, "Should return null");
    console.log("✅ T8 passed: getInternalId returns null for missing plant");
  } catch (error) {
    console.error("❌ T8 failed:", error.message);
  }

  // =========================
  // T9: updateWatering - resets hoursSinceLastWatering
  // =========================
  try {
    const updated = await plantService.updateWatering(plantUUID, 0);
    assert(updated, "Should return updated plant");
    const plant = await plantService.getPlantByUUID(plantUUID);
    assert(plant.watering.hoursSinceLastWatering === 0, "Should reset to 0");
    console.log("✅ T9 passed: updateWatering resets to 0");
  } catch (error) {
    console.error("❌ T9 failed:", error.message);
  }

  // =========================
  // T10: updateWatering - rejects negative values
  // =========================
  try {
    await plantService.updateWatering(plantUUID, -1);
    console.log("❌ T10 failed: Should throw for negative value");
  } catch (error) {
    assert(error.statusCode === 400, "Should be BAD_REQUEST");
    console.log("✅ T10 passed: updateWatering rejects negative");
  }

  // =========================
  // T11: updateWatering - throws for non-existent plant
  // =========================
  try {
    await plantService.updateWatering("nonexistent", 0);
    console.log("❌ T11 failed: Should throw for missing plant");
  } catch (error) {
    assert(error.statusCode === 404, "Should be NOT_FOUND");
    console.log("✅ T11 passed: updateWatering throws for missing plant");
  }

  // =========================
  // T12: applyFertilizing - sets soil.lastFertilized
  // =========================
  try {
    const updated = await plantService.applyFertilizing(plantUUID);
    assert(updated, "Should return updated plant");
    const plant = await plantService.getPlantByUUID(plantUUID);
    assert(plant.soil.lastFertilized, "Should set lastFertilized");
    console.log("✅ T12 passed: applyFertilizing sets lastFertilized");
  } catch (error) {
    console.error("❌ T12 failed:", error.message);
  }

  // =========================
  // T13: applyPruning - sets soil.lastPruned
  // =========================
  try {
    const updated = await plantService.applyPruning(plantUUID);
    assert(updated, "Should return updated plant");
    const plant = await plantService.getPlantByUUID(plantUUID);
    assert(plant.soil.lastPruned, "Should set lastPruned");
    console.log("✅ T13 passed: applyPruning sets lastPruned");
  } catch (error) {
    console.error("❌ T13 failed:", error.message);
  }

  // =========================
  // T14: applyDiseaseTreatment - resets disease fields
  // =========================
  try {
    const updated = await plantService.applyDiseaseTreatment(plantUUID);
    assert(updated, "Should return updated plant");
    const plant = await plantService.getPlantByUUID(plantUUID);
    assert(plant.disease.name === "healthy", "Should reset disease to healthy");
    assert(plant.stress.diseaseType === "none", "Should reset diseaseType");
    assert(plant.stress.severity === "none", "Should reset severity");
    assert(plant.hasDisease === false, "Should set hasDisease to false");
    console.log("✅ T14 passed: applyDiseaseTreatment resets disease fields");
  } catch (error) {
    console.error("❌ T14 failed:", error.message);
  }

  // =========================
  // T15: applyHarvest - sets growthStage to mature
  // =========================
  try {
    const updated = await plantService.applyHarvest(plantUUID);
    assert(updated, "Should return updated plant");
    const plant = await plantService.getPlantByUUID(plantUUID);
    assert(plant.growthStage === "mature", "Should set growthStage to mature");
    console.log("✅ T15 passed: applyHarvest sets growthStage to mature");
  } catch (error) {
    console.error("❌ T15 failed:", error.message);
  }

  // =========================
  // T16: addImage - adds image reference
  // =========================
  try {
    const s3Key = `plants/${ownerUUID}/${plantUUID}/images/${Date.now()}-test-image.jpg`;
    const updated = await plantService.addImage(plantUUID, s3Key);
    assert(updated, "Should return updated plant");
    assert(updated.cdn?.images?.length >= 1, "Should have at least 1 image");
    console.log("✅ T16 passed: addImage adds image reference");
  } catch (error) {
    console.error("❌ T16 failed:", error.message);
  }

  // =========================
  // T17: removeImage - removes exact stored image name
  // =========================
  try {
    const plant = await plantService.getPlantByUUID(plantUUID);
    const imgName = plant.cdn?.images?.[plant.cdn.images.length - 1];
    if (!imgName) throw new Error("No images to remove");

    const result = await plantService.removeImage(plantUUID, imgName);
    assert(typeof result === "object", "Should return updated plant object");
    const after = await plantService.getPlantByUUID(plantUUID);
    assert(
      !after.cdn?.images?.includes(imgName),
      "Should remove the image name",
    );
    console.log("✅ T17 passed: removeImage removes image reference");
  } catch (error) {
    console.error("❌ T17 failed:", error.message);
  }

  // =========================
  // T18: removeImage - returns "nothing to remove" for empty list
  // =========================
  try {
    // Remove all images first
    let plant2 = await plantService.getPlantByUUID(plantUUID);
    while (plant2.cdn?.images?.length) {
      for (const img of [...plant2.cdn.images]) {
        await plantService.removeImage(plantUUID, img);
      }
      plant2 = await plantService.getPlantByUUID(plantUUID);
    }

    const result = await plantService.removeImage(plantUUID, "ghost.jpg");
    assert(result === "nothing to remove", "Should return 'nothing to remove'");
    console.log("✅ T18 passed: removeImage returns 'nothing to remove'");
  } catch (error) {
    console.error("❌ T18 failed:", error.message);
  }

  // Cleanup
  try {
    await plantService.deletePlant(plantUUID);
    await userService.deleteUser(ownerUUID);
    await userService.deleteUser(otherUUID);
    console.log("✅ Cleanup: Test data deleted");
  } catch (error) {
    console.error("⚠️ Cleanup warning:", error.message);
  }

  console.log("\n🎉 PlantService extra tests completed\n");
}

runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
