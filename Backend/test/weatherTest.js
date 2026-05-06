import { weatherService } from './shared/container.js';

async function runTests() {
  console.log("Running WeatherService (container test)...\n");

  // =========================
  // Test 1: City
  // =========================
  const result1 = await weatherService.getWeather({
    city: "Gaza",
    coordinates: null,
  });

  assert(result1.location.name === "Gaza", "City name incorrect");
  assert(result1.weather.main === "Clear", "Weather main incorrect");

  console.log("✅ Test 1 passed");

  // =========================
  // Test 2: Coordinates
  // =========================
  const result2 = await weatherService.getWeather({
    city: null,
    coordinates: { lat: 31.5, lon: 34.47 },
  });

  assert(result2.location.coordinates.lat === 31.5, "Lat mismatch");

  console.log("✅ Test 2 passed");

  // =========================
  // Test 3: Invalid input
  // =========================
  try {
    await weatherService.getWeather({});
    console.log("❌ Test 3 failed");
  } catch {
    console.log("✅ Test 3 passed");
  }

  console.log("\n🎉 All tests passed");
}

runTests();