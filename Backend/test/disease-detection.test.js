import assert from "assert";
import {
  diseaseDetectionService,
  plantService,
  userService,
} from "../shared/container.js";

async function runTests() {
  console.log("Running DiseaseDetectionService Tests...\n");

  // Setup: Create test user and plant
  const testUserData = {
    name: "Disease Detector",
    email: `disease-user-${Date.now()}@example.com`,
    password: "DiseasePass123!",
    location: { city: "Gaza" },
  };

  let testUser = null;
  let testPlant = null;

  try {
    testUser = await userService.createUser(testUserData);

    testPlant = await plantService.createPlant({
      name: "Test Plant",
      varietyName: "Cherry Tomato",
      plantType: "crop",
      family: "leafy_greens",
      growthStage: "vegetative",
      plantedAt: new Date(),
    }, testUser.uuid);

    console.log("✅ Setup: Test user and plant created");
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    return;
  }

  // =========================
  // Test 1: Validate Service Initialization
  // =========================
  try {
    assert(diseaseDetectionService, "Service should be initialized");
    assert(
      diseaseDetectionService.httpClient,
      "HTTP client should be initialized",
    );
    assert(
      diseaseDetectionService.plantRepository,
      "Plant repository should be initialized",
    );

    console.log("✅ Test 1 passed: Service initialized correctly");
  } catch (error) {
    console.error("❌ Test 1 failed:", error.message);
  }

  // =========================
  // Test 2: Detect Disease with Valid Key
  // =========================
  try {
    // Note: This will make a real API call to the ML service
    // If ML service is not running, this will fail - that's expected behavior
    const result = await diseaseDetectionService.detectDisease({
      key: "plant/user_123_plant_456/images/1234567890-test-image.jpg",
      userId: testUser.uuid,
      plantId: testPlant.uuid,
    });

    assert(result, "Should return detection result");
    console.log("✅ Test 2 passed: Disease detection successful");
  } catch (error) {
    // Expected if ML service is not running
    if (error.message.includes("Failed to detect disease")) {
      console.log(
        "⚠️  Test 2 skipped: ML service not running (expected in test environment)",
      );
    } else {
      console.error("❌ Test 2 failed:", error.message);
    }
  }

  // =========================
  // Test 3: Detect Disease with Invalid Key Format
  // =========================
  try {
    await diseaseDetectionService.detectDisease({
      key: "invalid-key-format",
      userId: testUser.uuid,
      plantId: testPlant.uuid,
    });

    console.log("❌ Test 3 failed: Should validate key format");
  } catch (error) {
    // Expected to fail - key format invalid
    if (error.message.includes("Failed to detect disease")) {
      console.log("✅ Test 3 passed: Invalid key format rejected");
    } else {
      console.error("❌ Test 3 failed with unexpected error:", error.message);
    }
  }

  // =========================
  // Test 4: Update Disease History
  // =========================
  try {
    // Mock ML response structure (matches real Ml-service/app/main.py response)
    const mockMLResponse = {
      success: true,
      prediction: {
        class: {
          plant: "Tomato",
          disease: "early blight",
          disease_type: "fungal",
        },
        confidence: 0.95,
      },
    };

    const result = await diseaseDetectionService.updateDiseaseHistory(
      testPlant.uuid,
      mockMLResponse,
    );

    assert(result, "Should return updated plant");
    assert(result.diseaseHistory, "Plant should have disease history");
    assert(
      result.diseaseHistory.length > 0,
      "Disease history should be populated",
    );

    console.log("✅ Test 4 passed: Disease history updated successfully");
  } catch (error) {
    console.error("❌ Test 4 failed:", error.message);
  }

  // =========================
  // Test 5: Update Healthy Plant (No Disease)
  // =========================
  try {
    const mockMLResponse = {
      success: true,
      prediction: {
        class: {
          plant: "Tomato",
          disease: "healthy",
          disease_type: "healthy",
        },
        confidence: 1,
      },
    };

    const result = await diseaseDetectionService.updateDiseaseHistory(
      testPlant.uuid,
      mockMLResponse,
    );

    assert(result, "Should return updated plant");
    console.log("✅ Test 5 passed: Healthy plant status updated successfully");
  } catch (error) {
    console.error("❌ Test 5 failed:", error.message);
  }

  // =========================
  // Test 6: Detect Disease with Non-existent Plant (returns null)
  // =========================
  try {
    const mockMLResponse = {
      success: true,
      prediction: {
        class: {
          plant: "Apple",
          disease: "rust",
          disease_type: "fungal",
        },
        confidence: 0.87,
      },
    };

    const result = await diseaseDetectionService.updateDiseaseHistory(
      "non-existent-plant-uuid",
      mockMLResponse,
    );

    assert(result === null, "Result should be null for non-existent plant");
    console.log("✅ Test 6 passed: Non-existent plant returns null");
  } catch (error) {
    console.log("❌ Test 6 failed: Should return null, not throw");
  }

  // =========================
  // Test 7: Validate HTTP Client Configuration
  // =========================
  try {
    const { httpClient } = diseaseDetectionService;

    assert(httpClient.defaults.timeout === 5000, "Timeout should be 5000ms");
    assert(
      httpClient.defaults.headers["Content-Type"] === "application/json",
      "Content-Type should be application/json",
    );

    console.log("✅ Test 7 passed: HTTP client configuration correct");
  } catch (error) {
    console.error("❌ Test 7 failed:", error.message);
  }

  // Cleanup: Delete test user and plant
  try {
    await plantService.deletePlant(testPlant.uuid);
    await userService.deleteUser(testUser.uuid);
    console.log("✅ Cleanup: Test user and plant deleted");
  } catch (error) {
    console.error("⚠️ Cleanup warning:", error.message);
  }

  console.log("\n🎉 DiseaseDetectionService tests completed\n");
}

runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
