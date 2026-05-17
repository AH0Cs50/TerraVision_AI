import { evaluate, evaluateByLayer, getRuleCount } from "../service/engine/index.js";

function fmt(n) {
  return typeof n === "number" ? n.toFixed(3) : n;
}

function runTestCase(label, input) {
  const result = evaluate(input);
  const layered = evaluateByLayer(input);
  const ruleIds = result._appliedRules.map((r) => r.id);

  console.log("\n" + "=".repeat(90));
  console.log(`  ${label}`);
  console.log("=".repeat(90));
  console.log(`  Input:`);
  console.log(`    Weather     : temp=${input.weather.temperature}°C, hum=${input.weather.humidity}%, cond=${input.weather.condition}, light=${input.weather.light}`);
  console.log(`    Soil        : type=${input.soil.type}, moisture=${input.soil.moisture}%`);
  console.log(`    Plant       : family=${input.plant.family}, stage=${input.plant.growthStage}, age=${input.plant.ageDays}d`);
  if (input.watering) console.log(`    Watering    : hrsSinceWatering=${input.watering.hoursSinceLastWatering}h`);
  if (input.stress) console.log(`    Stress      : disease=${input.stress.diseaseType}, severity=${input.stress.severity}`);
  console.log(`  ─────────────────────────────────────────`);
  console.log(`  Final Scores:`);
  console.log(`    waterScore       = ${fmt(result.waterScore)}`);
  console.log(`    fertilizerScore  = ${fmt(result.fertilizerScore)}`);
  console.log(`    pestRiskScore    = ${fmt(result.pestRiskScore)}`);
  console.log(`    lightScore       = ${fmt(result.lightScore)}`);
  console.log(`  ─────────────────────────────────────────`);
  console.log(`  Per-Layer Breakdown:`);
  for (const [layer, scores] of Object.entries(layered.layers)) {
    console.log(`    ${layer.padEnd(14)} water=${fmt(scores.waterScore).padStart(6)}  fert=${fmt(scores.fertilizerScore).padStart(6)}  pest=${fmt(scores.pestRiskScore).padStart(6)}  light=${fmt(scores.lightScore).padStart(6)}  rules=${scores._appliedRules.length}`);
  }
  console.log(`  ─────────────────────────────────────────`);
  console.log(`  Applied Rules (${ruleIds.length}):`);
  ruleIds.forEach((id) => console.log(`    • ${id}`));
  console.log("");

  return result;
}

console.log("╔══════════════════════════════════════════════════════════════════════════════╗");
console.log("║                AGRICULTURAL RULE ENGINE — COMPREHENSIVE TEST SUITE          ║");
console.log("╚══════════════════════════════════════════════════════════════════════════════╝");

// ─── Rule counts ─────────────────────────────────────────────────────────
console.log("\n▸ Rule Counts:");
const counts = getRuleCount();
for (const [k, v] of Object.entries(counts)) {
  console.log(`    ${k.padEnd(14)} ${v}`);
}

// ─── TEST CASE 1: Baseline / Optimal ─────────────────────────────────────
runTestCase("TC-01: Optimal / Baseline Conditions", {
  weather: { temperature: 25, humidity: 55, condition: "cloudy", light: "partial" },
  soil: { type: "loam", moisture: 50 },
  plant: { family: "leafy_greens", growthStage: "vegetative", ageDays: 30 },
  watering: { hoursSinceLastWatering: 18 },
  stress: { diseaseType: "none", severity: "none" },
});

// ─── TEST CASE 2: Extreme Heat + Low Humidity + Sandy ───────────────────
runTestCase("TC-02: Extreme Heat + Low Humidity + Sandy Soil + Drought", {
  weather: { temperature: 38, humidity: 25, condition: "sunny", light: "intense" },
  soil: { type: "sandy", moisture: 10 },
  plant: { family: "leafy_greens", growthStage: "vegetative", ageDays: 30 },
  watering: { hoursSinceLastWatering: 96 },
  stress: { diseaseType: "none", severity: "none" },
});

// ─── TEST CASE 3: Cold + Rainy + Clay ────────────────────────────────────
runTestCase("TC-03: Cold + Rainy + Alfisols (Clay) + Mature", {
  weather: { temperature: 8, humidity: 90, condition: "rainy", light: "shade" },
  soil: { type: "alfisols", moisture: 85 },
  plant: { family: "brassicas", growthStage: "mature", ageDays: 120 },
  watering: { hoursSinceLastWatering: 6 },
  stress: { diseaseType: "none", severity: "none" },
});

// ─── TEST CASE 4: Fungal Disease + High Humidity + Storm ─────────────────
runTestCase("TC-04: Fungal Disease + High Humidity + Storm", {
  weather: { temperature: 28, humidity: 88, condition: "storm", light: "shade" },
  soil: { type: "vertisols", moisture: 75 },
  plant: { family: "fruiting_nightshade", growthStage: "fruiting", ageDays: 60 },
  watering: { hoursSinceLastWatering: 12 },
  stress: { diseaseType: "fungal", severity: "high" },
});

// ─── TEST CASE 5: Succulent + Aridisols + Optimal ────────────────────────
runTestCase("TC-05: Succulent + Aridisols (Desert) — Low Demand", {
  weather: { temperature: 33, humidity: 15, condition: "sunny", light: "intense" },
  soil: { type: "aridisols", moisture: 8 },
  plant: { family: "succulent", growthStage: "mature", ageDays: 365 },
  watering: { hoursSinceLastWatering: 168 },
  stress: { diseaseType: "none", severity: "none" },
});

// ─── TEST CASE 6: Tropical + Entisols + Germination ──────────────────────
runTestCase("TC-06: Tropical + Entisols (River) + Germination", {
  weather: { temperature: 30, humidity: 75, condition: "rainy", light: "indirect" },
  soil: { type: "entisols", moisture: 70 },
  plant: { family: "tropical", growthStage: "germination", ageDays: 5 },
  watering: { hoursSinceLastWatering: 4 },
  stress: { diseaseType: "none", severity: "none" },
});

// ─── TEST CASE 7: Legumes + Vegetative + Optimal ─────────────────────────
runTestCase("TC-07: Legumes + Vegetative — Low Fertilizer Demand", {
  weather: { temperature: 22, humidity: 60, condition: "cloudy", light: "partial" },
  soil: { type: "inceptisols", moisture: 45 },
  plant: { family: "legumes", growthStage: "vegetative", ageDays: 25 },
  watering: { hoursSinceLastWatering: 24 },
  stress: { diseaseType: "none", severity: "none" },
});

// ─── TEST CASE 8: Bacterial Disease + Heat + Drought Stress ──────────────
runTestCase("TC-08: Bacterial Disease + Heat + Severe Drought", {
  weather: { temperature: 35, humidity: 72, condition: "sunny", light: "intense" },
  soil: { type: "sandy", moisture: 5 },
  plant: { family: "fruiting_nightshade", growthStage: "fruiting", ageDays: 70 },
  watering: { hoursSinceLastWatering: 120 },
  stress: { diseaseType: "bacterial", severity: "high" },
});

// ─── TEST CASE 9: Herbs + Flowering + Dry ────────────────────────────────
runTestCase("TC-09: Herbs + Flowering — Pest Resistant", {
  weather: { temperature: 26, humidity: 40, condition: "sunny", light: "full_sun" },
  soil: { type: "sandy", moisture: 30 },
  plant: { family: "herbs", growthStage: "flowering", ageDays: 45 },
  watering: { hoursSinceLastWatering: 36 },
  stress: { diseaseType: "none", severity: "none" },
});

// ─── TEST CASE 10: Storm + Vertisols + Seedling ──────────────────────────
runTestCase("TC-10: Storm + Vertisols (Cracking Clay) + Seedling", {
  weather: { temperature: 34, humidity: 82, condition: "storm", light: "shade" },
  soil: { type: "vertisols", moisture: 90 },
  plant: { family: "root_crops", growthStage: "seedling", ageDays: 10 },
  watering: { hoursSinceLastWatering: 8 },
  stress: { diseaseType: "none", severity: "none" },
});

// ─── TEST CASE 11: Medium Severity Pest ──────────────────────────────────
runTestCase("TC-11: Grasses + Inceptisols + Medium Severity", {
  weather: { temperature: 27, humidity: 65, condition: "cloudy", light: "full_sun" },
  soil: { type: "inceptisols", moisture: 55 },
  plant: { family: "grasses", growthStage: "vegetative", ageDays: 40 },
  watering: { hoursSinceLastWatering: 48 },
  stress: { diseaseType: "fungal", severity: "medium" },
});

// ─── TEST CASE 12: No input stress/watering (should still work) ──────────
runTestCase("TC-12: Minimal Input — No Watering or Stress", {
  weather: { temperature: 20, humidity: 50, condition: "cloudy", light: "indirect" },
  soil: { type: "sandy", moisture: 40 },
  plant: { family: "citrus", growthStage: "flowering", ageDays: 200 },
});

console.log("═".repeat(90));
console.log("  ALL TESTS COMPLETE\n");
