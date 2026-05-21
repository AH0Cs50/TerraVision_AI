import assert from "assert";
import { weatherService } from "../shared/container.js";

async function runTests() {
  console.log("Running WeatherService (container test)...\n");
  let passed = 0;

  // =========================
  // Test 1: Invalid input (no city or coordinates)
  // =========================
  try {
    await weatherService.getWeather({});
    console.log("❌ Test 1 failed: Should throw for empty input");
  } catch {
    console.log("✅ Test 1 passed: Empty input correctly rejected");
    passed++;
  }

  // =========================
  // Test 2: Invalid location type
  // =========================
  try {
    await weatherService.getWeather("Gaza");
    console.log("❌ Test 2 failed: Should throw for string input");
  } catch {
    console.log("✅ Test 2 passed: String input correctly rejected");
    passed++;
  }

  console.log(`\n${passed}/2 tests passed (skipping live API tests)\n`);
}

runTests();
