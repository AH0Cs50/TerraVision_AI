import assert from "assert";
import {
  getUserDashboard,
  getUserRecentActivity,
} from "../../usecases/dashboard.usecase.js";
import { signup } from "../../usecases/auth.usecases.js";
import {
  userRepo,
  plantRepo,
  plantCareRepo,
  actionLogRepo,
} from "../../shared/container.js";
import { createPlantTaskModel } from "../../model/plant-care.model.js";

async function runTests() {
  console.log("Running Dashboard UseCase Tests...\n");

  const testEmail = `test-dashboard-${Date.now()}@example.com`;
  let user, userDoc, plantA, plantB, plantC;

  // =========================
  // Setup: Create user and seed data
  // =========================
  try {
    const signupResult = await signup({
      name: "Dashboard Owner",
      email: testEmail,
      password: "TestPass123!",
      location: { city: "Gaza" },
    });
    user = { uuid: signupResult.user.uuid, role: signupResult.user.role };

    // Fetch full user doc to get internalId
    userDoc = await userRepo.findByUUID(user.uuid);
    if (!userDoc) throw new Error("User not found after signup");

    const userInternalId = userDoc.internalId;

    // Helper dates
    const now = new Date();
    const plus5Days = new Date(now.getTime() + 5 * 86400000);
    const plus30Days = new Date(now.getTime() + 30 * 86400000);

    // Plant A: Tomato (crop, vegetative, healthy, has harvest date)
    plantA = await plantRepo.create({
      name: "Tomato",
      category: "crop",
      family: "fruiting_nightshade",
      growthStage: "vegetative",
      userInternalId,
      plantedAt: now,
      expectedHarvestDate: plus5Days,
    });

    // Plant B: Basil (crop, vegetative, diseased)
    plantB = await plantRepo.create({
      name: "Basil",
      category: "crop",
      family: "herbs",
      growthStage: "vegetative",
      userInternalId,
      plantedAt: now,
      disease: {
        name: "powdery_mildew",
        confidence: 0.9,
        detectedAt: now,
      },
    });

    // Plant C: Apple (tree, flowering, healthy, has harvest date)
    plantC = await plantRepo.create({
      name: "Apple",
      category: "tree",
      family: "flowering_ornamentals",
      growthStage: "flowering",
      userInternalId,
      plantedAt: now,
      expectedHarvestDate: plus30Days,
    });

    console.log("✅ Setup: Created user and 3 seed plants");
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    return;
  }

  // =========================
  // Setup: Create care states
  // =========================
  try {
    // Care state for Tomato: thirsty, needs_feed, healthy, optimal
    await plantCareRepo.create({
      plantUUID: plantA.uuid,
      status: {
        water: "thirsty",
        nutrients: "needs_feed",
        health: "healthy",
        light: "optimal",
      },
      activeTasks: [
        createPlantTaskModel({
          taskId: "t1",
          type: "watering",
          title: "Water",
          priority: "high",
          status: "pending",
        }),
      ],
      completedTasks: [
        createPlantTaskModel({
          taskId: "t2",
          type: "fertilizing",
          title: "Fertilized",
          priority: "medium",
          status: "completed",
          completedAt: new Date(),
        }),
      ],
    });

    // Care state for Basil: satisfied, optimal, diseased, low
    await plantCareRepo.create({
      plantUUID: plantB.uuid,
      status: {
        water: "satisfied",
        nutrients: "optimal",
        health: "diseased",
        light: "low",
      },
      activeTasks: [
        createPlantTaskModel({
          taskId: "t3",
          type: "disease_treatment",
          title: "Treat",
          priority: "high",
          status: "pending",
        }),
      ],
      completedTasks: [
        createPlantTaskModel({
          taskId: "t4",
          type: "watering",
          title: "Watered",
          priority: "medium",
          status: "completed",
          completedAt: new Date(),
        }),
        createPlantTaskModel({
          taskId: "t5",
          type: "fertilizing",
          title: "Fertilized",
          priority: "low",
          status: "completed",
          completedAt: new Date(),
        }),
      ],
    });

    // Care state for Apple: low, optimal, healthy, optimal
    await plantCareRepo.create({
      plantUUID: plantC.uuid,
      status: {
        water: "low",
        nutrients: "optimal",
        health: "healthy",
        light: "optimal",
      },
      activeTasks: [],
      completedTasks: [],
    });

    console.log("✅ Setup: Created 3 care states");
  } catch (error) {
    console.error("❌ Setup care states failed:", error.message);
  }

  // =========================
  // Setup: Create action logs
  // =========================
  try {
    const userInternalId = userDoc.internalId;
    const now = new Date();

    await actionLogRepo.create({
      plantUUID: plantA.uuid,
      plantInternalId: plantA.internalId,
      userUUID: user.uuid,
      userInternalId,
      actionType: "watered",
      description: "Watered tomato plant",
      createdAt: now,
    });

    await actionLogRepo.create({
      plantUUID: plantA.uuid,
      plantInternalId: plantA.internalId,
      userUUID: user.uuid,
      userInternalId,
      actionType: "fertilized",
      description: "Fertilized tomato plant",
      createdAt: now,
    });

    console.log("✅ Setup: Created 2 action logs");
  } catch (error) {
    console.error("❌ Setup action logs failed:", error.message);
  }

  // =========================
  // Test 1: getUserDashboard returns all expected keys
  // =========================
  try {
    const result = await getUserDashboard(user);

    const expectedKeys = [
      "totalPlants",
      "diseasedPlants",
      "healthyPlants",
      "plantsByCategory",
      "plantsByGrowthStage",
      "careStatusDistribution",
      "healthPercentages",
      "thirsty",
      "needsFeed",
      "lowLight",
      "activeTasks",
      "completedTasks",
      "totalTasks",
      "efficiency",
      "upcomingHarvests",
      "aiReport",
      "recentActivity",
    ];

    for (const key of expectedKeys) {
      assert(
        Object.prototype.hasOwnProperty.call(result, key),
        `Missing key: ${key}`,
      );
    }

    console.log("✅ Test 1 passed: getUserDashboard returns all expected keys");
  } catch (error) {
    console.error("❌ Test 1 failed:", error.message);
  }

  // =========================
  // Test 2: Plant counts correct
  // =========================
  try {
    const result = await getUserDashboard(user);

    assert(result.totalPlants === 3, `Expected totalPlants=3, got ${result.totalPlants}`);
    assert(result.diseasedPlants === 1, `Expected diseasedPlants=1, got ${result.diseasedPlants}`);
    assert(result.healthyPlants === 2, `Expected healthyPlants=2, got ${result.healthyPlants}`);

    console.log("✅ Test 2 passed: Plant counts correct");
  } catch (error) {
    console.error("❌ Test 2 failed:", error.message);
  }

  // =========================
  // Test 3: Care distribution correct
  // =========================
  try {
    const result = await getUserDashboard(user);
    const health = result.careStatusDistribution.health;

    assert(health !== undefined, "careStatusDistribution.health missing");
    assert(health.healthy === 2, `Expected healthy=2, got ${health.healthy}`);
    assert(health.diseased === 1, `Expected diseased=1, got ${health.diseased}`);

    console.log("✅ Test 3 passed: Care distribution correct");
  } catch (error) {
    console.error("❌ Test 3 failed:", error.message);
  }

  // =========================
  // Test 4: Resource demand correct
  // =========================
  try {
    const result = await getUserDashboard(user);

    assert(result.thirsty === 1, `Expected thirsty=1, got ${result.thirsty}`);
    assert(result.needsFeed === 1, `Expected needsFeed=1, got ${result.needsFeed}`);
    assert(result.lowLight === 1, `Expected lowLight=1, got ${result.lowLight}`);

    console.log("✅ Test 4 passed: Resource demand correct");
  } catch (error) {
    console.error("❌ Test 4 failed:", error.message);
  }

  // =========================
  // Test 5: Task efficiency correct
  // =========================
  try {
    const result = await getUserDashboard(user);

    assert(result.activeTasks === 2, `Expected activeTasks=2, got ${result.activeTasks}`);
    assert(result.completedTasks === 3, `Expected completedTasks=3, got ${result.completedTasks}`);
    assert(result.totalTasks === 5, `Expected totalTasks=5, got ${result.totalTasks}`);
    assert(result.efficiency === 60.0, `Expected efficiency=60.0, got ${result.efficiency}`);

    console.log("✅ Test 5 passed: Task efficiency correct");
  } catch (error) {
    console.error("❌ Test 5 failed:", error.message);
  }

  // =========================
  // Test 6: Upcoming harvests
  // =========================
  try {
    const result = await getUserDashboard(user);

    assert(Array.isArray(result.upcomingHarvests), "upcomingHarvests should be an array");
    assert(result.upcomingHarvests.length === 2, `Expected 2 harvests, got ${result.upcomingHarvests.length}`);

    // Should be sorted by date: Tomato first (5 days), Apple second (30 days)
    const first = result.upcomingHarvests[0];
    const second = result.upcomingHarvests[1];

    assert(first.uuid, "First harvest missing uuid");
    assert(first.name === "Tomato", `Expected first=Tomato, got ${first.name}`);
    assert(typeof first.daysUntilHarvest === "number", "daysUntilHarvest should be a number");

    assert(second.uuid, "Second harvest missing uuid");
    assert(second.name === "Apple", `Expected second=Apple, got ${second.name}`);
    assert(typeof second.daysUntilHarvest === "number", "daysUntilHarvest should be a number");

    console.log("✅ Test 6 passed: Upcoming harvests correct");
  } catch (error) {
    console.error("❌ Test 6 failed:", error.message);
  }

  // =========================
  // Test 7: AI report has summary field
  // =========================
  try {
    const result = await getUserDashboard(user);

    assert(
      Object.prototype.hasOwnProperty.call(result.aiReport, "summary"),
      "aiReport missing summary field",
    );

    console.log("✅ Test 7 passed: AI report has summary field");
  } catch (error) {
    console.error("❌ Test 7 failed:", error.message);
  }

  // =========================
  // Test 8: Recent activity is array
  // =========================
  try {
    const result = await getUserDashboard(user);

    assert(Array.isArray(result.recentActivity), "recentActivity should be an array");
    assert(result.recentActivity.length >= 1, "recentActivity should have at least 1 entry");

    console.log("✅ Test 8 passed: Recent activity is array with entries");
  } catch (error) {
    console.error("❌ Test 8 failed:", error.message);
  }

  // =========================
  // Test 9: getUserRecentActivity returns logs
  // =========================
  try {
    const logs = await getUserRecentActivity(user, "10");

    assert(Array.isArray(logs), "getUserRecentActivity should return an array");
    assert(logs.length >= 1, "Should have at least 1 log entry");

    console.log("✅ Test 9 passed: getUserRecentActivity returns logs");
  } catch (error) {
    console.error("❌ Test 9 failed:", error.message);
  }

  // =========================
  // Test 10: getUserRecentActivity respects last param
  // =========================
  try {
    const logs = await getUserRecentActivity(user, "1");

    assert(Array.isArray(logs), "getUserRecentActivity should return an array");
    assert(logs.length <= 1, `Expected <= 1 log, got ${logs.length}`);

    console.log("✅ Test 10 passed: getUserRecentActivity respects last param");
  } catch (error) {
    console.error("❌ Test 10 failed:", error.message);
  }

  // =========================
  // Cleanup
  // =========================
  try {
    // Delete care states by plant UUID
    if (plantA) await plantCareRepo.deleteByPlantUUID(plantA.uuid);
    if (plantB) await plantCareRepo.deleteByPlantUUID(plantB.uuid);
    if (plantC) await plantCareRepo.deleteByPlantUUID(plantC.uuid);
  } catch {}

  try {
    // Delete plants
    if (plantA) await plantRepo.deleteByUUID(plantA.uuid);
    if (plantB) await plantRepo.deleteByUUID(plantB.uuid);
    if (plantC) await plantRepo.deleteByUUID(plantC.uuid);
  } catch {}

  try {
    // Delete user
    const u = await userRepo.findByEmail(testEmail);
    if (u) await userRepo.deleteByUUID(u.uuid);
  } catch {}

  console.log("\n✅ Dashboard UseCase tests completed\n");
}

runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
