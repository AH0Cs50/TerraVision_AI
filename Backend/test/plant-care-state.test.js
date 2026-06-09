import assert from "assert";
import PlantCareStateService from "../service/plant-care-state.service.js";
import { PlantCareTaskGenerator } from "../service/plant-care-task-generator.service.js";
import { PlantTaskCareManager } from "../service/plant-care-task-manager.service.js";
import { PlantCareActionLogger } from "../service/plant-care-action-logger.service.js";

// ── PlantCareTaskGenerator tests ──────────────────

async function testTaskGenerator() {
  console.log("Running PlantCareTaskGenerator Tests...\n");
  let passed = 0, failed = 0;

  // Test 1: Returns parsed tasks from valid LLM array response
  try {
    const mockLLM = { generateResponse: async () => JSON.stringify([{ type: "watering", title: "Water", priority: "high", dueDate: null }]) };
    const gen = new PlantCareTaskGenerator(mockLLM);
    const tasks = await gen.generateTasksFromStatus({ water: "low", nutrients: "low", health: "warning", light: "optimal" }, { waterScore: 0.8, fertilizerScore: 1.0, pestRiskScore: 1.0, lightScore: 1.0 });
    assert(Array.isArray(tasks), "Should return array");
    assert(tasks.length === 1, "Should have 1 task");
    assert(tasks[0].type === "watering");
    assert(tasks[0].taskId, "Should have taskId");
    assert(tasks[0].status === "pending");
    assert(tasks[0].generatedBy === "ai");
    console.log("✅ Test 1 passed: Tasks parsed from valid LLM response");
    passed++;
  } catch (err) { console.error("❌ Test 1 failed:", err.message); failed++; }

  // Test 2: Returns empty array on non-array LLM response
  try {
    const mockLLM = { generateResponse: async () => "not an array" };
    const gen = new PlantCareTaskGenerator(mockLLM);
    const tasks = await gen.generateTasksFromStatus({ water: "ok", nutrients: "optimal", health: "healthy", light: "full_sun" }, { waterScore: 1.0, fertilizerScore: 1.0, pestRiskScore: 1.0, lightScore: 1.0 });
    assert(Array.isArray(tasks), "Should return array");
    assert(tasks.length === 0, "Should be empty");
    console.log("✅ Test 2 passed: Non-array response returns []");
    passed++;
  } catch (err) { console.error("❌ Test 2 failed:", err.message); failed++; }

  // Test 3: Returns empty array on LLM error
  try {
    const mockLLM = { generateResponse: async () => { throw new Error("LLM down"); } };
    const gen = new PlantCareTaskGenerator(mockLLM);
    const tasks = await gen.generateTasksFromStatus({ water: "ok", nutrients: "optimal", health: "healthy", light: "full_sun" }, { waterScore: 1.0, fertilizerScore: 1.0, pestRiskScore: 1.0, lightScore: 1.0 });
    assert(Array.isArray(tasks), "Should return array");
    assert(tasks.length === 0, "Should be empty on error");
    console.log("✅ Test 3 passed: LLM error returns []");
    passed++;
  } catch (err) { console.error("❌ Test 3 failed:", err.message); failed++; }

  // Test 4: Filters out tasks with invalid types
  try {
    const mockLLM = { generateResponse: async () => JSON.stringify([{ type: "invalid_type", title: "Bad", priority: "low" }]) };
    const gen = new PlantCareTaskGenerator(mockLLM);
    const tasks = await gen.generateTasksFromStatus({ water: "ok", nutrients: "optimal", health: "healthy", light: "full_sun" }, { waterScore: 1.0, fertilizerScore: 1.0, pestRiskScore: 1.0, lightScore: 1.0 });
    assert(Array.isArray(tasks), "Should return array");
    assert(tasks.length === 0, "Invalid type should be filtered");
    console.log("✅ Test 4 passed: Invalid task types filtered");
    passed++;
  } catch (err) { console.error("❌ Test 4 failed:", err.message); failed++; }

  console.log(`\nPlantCareTaskGenerator: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

// ── PlantCareActionLogger tests (mock repo) ──────

async function testActionLogger() {
  console.log("Running PlantCareActionLogger Tests...\n");
  let passed = 0, failed = 0;

  // Test 1: Logs an action
  try {
    let pushed = null;
    const mockRepo = { create: async (data) => { pushed = data; return data; } };
    const mockUserService = { findByUUID: async () => ({ internalId: 99 }) };
    const mockPlantService = { getInternalId: async () => 1, userService: mockUserService };
    const logger = new PlantCareActionLogger(mockRepo, mockPlantService);
    await logger.addActionLog("plant-1", { uuid: "user-1" }, { actionType: "watered", description: "Watered plant" });
    assert(pushed.plantUUID === "plant-1");
    assert(pushed.actionType === "watered");
    assert(pushed.userUUID === "user-1");
    console.log("✅ Test 1 passed: Action logged successfully");
    passed++;
  } catch (err) { console.error("❌ Test 1 failed:", err.message); failed++; }

  // Test 2: Convenience method logWatering
  try {
    let pushed = null;
    const mockRepo = { create: async (data) => { pushed = data; return data; } };
    const mockUserService = { findByUUID: async () => ({ internalId: 99 }) };
    const mockPlantService = { getInternalId: async () => 1, userService: mockUserService };
    const logger = new PlantCareActionLogger(mockRepo, mockPlantService);
    await logger.logWatering("plant-2", { uuid: "user-1" });
    assert(pushed.actionType === "watered");
    console.log("✅ Test 2 passed: logWatering convenience method");
    passed++;
  } catch (err) { console.error("❌ Test 2 failed:", err.message); failed++; }

  // Test 3: getRecentLogs returns last N logs
  try {
    const mockRepo = { getRecent: async (uuid, last) => [{ createdAt: new Date(1) }, { createdAt: new Date(2) }, { createdAt: new Date(3) }].slice(-last) };
    const mockPlantService = { getInternalId: async () => 1 };
    const logger = new PlantCareActionLogger(mockRepo, mockPlantService);
    const logs = await logger.getRecentLogs("plant-3", 2);
    assert(logs.length === 2, "Should return last 2 logs");
    console.log("✅ Test 3 passed: getRecentLogs returns correct count");
    passed++;
  } catch (err) { console.error("❌ Test 3 failed:", err.message); failed++; }

  console.log(`\nPlantCareActionLogger: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

// ── PlantCareStateService tests (mock repo) ──────

async function testStateService() {
  console.log("Running PlantCareStateService Tests...\n");
  let passed = 0, failed = 0;

  // Test 1: Creates a new care state
  try {
    let created = null;
    const mockRepo = {
      create: async (data) => { created = data; return { ...data, uuid: "new-uuid" }; },
      findByPlantUUID: async () => null,
    };
    const service = new PlantCareStateService(mockRepo);
    const result = await service.saveEngineOutput("plant-1", { waterScore: 1.0, fertilizerScore: 1.0, pestRiskScore: 1.0, lightScore: 1.0, _appliedRules: [] });
    assert(result.uuid === "new-uuid");
    assert(created.plantUUID === "plant-1");
    console.log("✅ Test 1 passed: New care state created");
    passed++;
  } catch (err) { console.error("❌ Test 1 failed:", err.message); failed++; }

  // Test 2: Updates existing care state
  try {
    let updated = null;
    const mockRepo = {
      findByPlantUUID: async () => ({ plantUUID: "plant-2", status: {}, engineScores: {} }),
      updateByPlantUUID: async (uuid, data) => { updated = data; return { plantUUID: uuid, ...data }; },
    };
    const service = new PlantCareStateService(mockRepo);
    await service.saveEngineOutput("plant-2", { waterScore: 2.0, fertilizerScore: 1.5, pestRiskScore: 0.8, lightScore: 1.2, _appliedRules: [] });
    assert(updated.status, "Should update status");
    assert(updated.engineScores, "Should update engineScores");
    console.log("✅ Test 2 passed: Existing care state updated");
    passed++;
  } catch (err) { console.error("❌ Test 2 failed:", err.message); failed++; }

  console.log(`\nPlantCareStateService: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

// ── PlantTaskCareManager tests (mock repo) ──────

async function testTaskManager() {
  console.log("Running PlantTaskCareManager Tests...\n");
  let passed = 0, failed = 0;

  // Test 1: addTaskToPlant pushes to active
  try {
    let pushed = null;
    const mockRepo = { pushToActive: async (uuid, task) => { pushed = task; return task; } };
    const manager = new PlantTaskCareManager(mockRepo, null, { logTaskCompleted: async () => {} });
    await manager.addTaskToPlant("plant-1", { type: "watering", title: "Water", priority: "high" });
    assert(pushed.type === "watering");
    assert(pushed.status === "pending");
    assert(pushed.taskId, "Should have taskId");
    console.log("✅ Test 1 passed: Task added to plant");
    passed++;
  } catch (err) { console.error("❌ Test 1 failed:", err.message); failed++; }

  // Test 2: completeTask moves from active to completed
  try {
    const taskId = "task-123";
    const mockRepo = {
      findTaskInActive: async () => ({ task: { taskId, type: "watering", title: "Water", status: "pending" } }),
      removeFromActive: async () => true,
      pushToCompleted: async () => true,
      findByPlantUUID: async () => ({ plantUUID: "plant-1" }),
    };
    const mockLogger = { logTaskCompleted: async () => {} };
    const manager = new PlantTaskCareManager(mockRepo, null, mockLogger);
    const result = await manager.completeTask("plant-1", taskId, { uuid: "user-1" });
    assert(result.task.status === "completed");
    assert(result.task.taskId === taskId);
    assert(result.task.completedAt instanceof Date);
    console.log("✅ Test 2 passed: Task completed successfully");
    passed++;
  } catch (err) { console.error("❌ Test 2 failed:", err.message); failed++; }

  // Test 3: completeTask returns null for non-existent task
  try {
    const mockRepo = { findTaskInActive: async () => null };
    const manager = new PlantTaskCareManager(mockRepo, null, { logTaskCompleted: async () => {} });
    const result = await manager.completeTask("plant-1", "nonexistent");
    assert(result === null, "Should return null");
    console.log("✅ Test 3 passed: Non-existent task returns null");
    passed++;
  } catch (err) { console.error("❌ Test 3 failed:", err.message); failed++; }

  console.log(`\nPlantTaskCareManager: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

// ── Run all ──────────────────────────────────────

async function main() {
  const results = await Promise.all([
    testTaskGenerator(),
    testActionLogger(),
    testStateService(),
    testTaskManager(),
  ]);
  const allPassed = results.every(Boolean);
  console.log("=".repeat(40));
  console.log(allPassed ? "ALL PLANT-CARE-STATE TESTS PASSED" : "SOME TESTS FAILED");
  console.log("=".repeat(40));
  if (!allPassed) process.exit(1);
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
