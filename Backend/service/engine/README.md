# Agri Rule Engine

Deterministic scoring engine for agricultural intelligence. Evaluates environmental, soil, plant, light, and pest inputs to compute four intensity scores: **waterScore**, **fertilizerScore**, **pestRiskScore**, and **lightScore**.

---

## Engine Structure

```
Backend/service/engine/
├── index.js           Entry point — layer ordering & public API
├── engine.js          Core engine — condition evaluation, rule application, score aggregation
├── global.js          Global weather-driven environment rules loader
├── soil.js            Soil modifier rules loader
├── plantFamilies.js   Plant family sensitivity rules loader
├── growthStages.js    Growth stage modifier rules loader
├── watering.js        Watering history modifier rules loader
├── pestDisease.js     Pest/disease cross-factor rules loader
├── light.js           Light exposure modifier rules loader
├── report.md           Engine test report
└── README.md          This file
```

**Rule data** lives separately in `Backend/shared/rules/`:

| Module            | Source file                              |
| ----------------- | ---------------------------------------- |
| `global.js`       | `weather_global_rules.json`              |
| `soil.js`         | `weather_soil_modifiers.json`            |
| `plantFamilies.js`| `weather_plant_family_modifiers.json`    |
| `growthStages.js` | `weather_growth_stage_modifiers.json`    |
| `watering.js`     | `weather_watering_history_modifiers.json`|
| `pestDisease.js`  | `weather_pest_disease_modifiers.json`    |
| `light.js`        | `weather_light_modifiers.json`           |

---

## Module Functions

### `index.js` — Entry Point

| Function              | Returns                                          |
| --------------------- | ------------------------------------------------ |
| `evaluate(input)`     | `{ waterScore, fertilizerScore, pestRiskScore, lightScore, _appliedRules }` |
| `evaluateByLayer(input)` | `{ layers: { global, soil, ... }, final: { ... } }` |
| `getRuleCount()`      | `{ global: 17, soil: 19, plantFamily: 35, growthStage: 18, watering: 7, pest: 9, light: 22, total: 127 }` |

### `engine.js` — Core Engine

| Function                  | Purpose                                         |
| ------------------------- | ----------------------------------------------- |
| `evaluateRules(input, rules)` | Evaluates all rules against input → aggregated scores |
| `applyRule(rule, input, state)` | Checks a single rule's condition; merges effects on match |
| `evaluateCondition(condition, input)` | Resolves nested paths & checks operators (AND logic) |
| `createBaseState()`       | Returns base state with all scores/multipliers at 1.0 |
| `aggregateScores(state)`  | Applies formula + clamp → final scores           |

### Layer Loaders (e.g. `global.js`, `soil.js`, ...)

Each loader:
1. Imports its JSON rule file via `createRequire(import.meta.url)`
2. Maps raw rules into engine-ready objects (`id`, `layer`, `factor`, `condition`, `effect`, `weight`, `explainKey`)
3. Exports `layer` (string name) and `rules` (array)

---

## How It Works — Evaluation Flow

Rules are evaluated in a fixed **7-layer order**:

```
1. Global        (broad weather/environment)
2. Soil          (weather-soil interactions)
3. Plant Family  (family sensitivity modifiers)
4. Growth Stage  (family + stage specific)
5. Watering      (recency & drought/overwatering risk)
6. Pest/Disease  (disease & pest pressure modifiers)
7. Light         (light exposure modifiers)
→ Aggregation
```

This ordering reflects the dependency chain from broad environment → soil → plant → stress.

### Condition Evaluation

Each rule has a `condition` object with nested path keys (e.g. `weather.temperature`). Supported operators:

| Operator | Meaning      |
| -------- | ------------ |
| `eq`     | equals       |
| `neq`    | not equals   |
| `gte`    | >=           |
| `lte`    | <=           |
| `gt`     | >            |
| `lt`     | <            |

- Multiple operators on one key = AND
- Multiple keys in a condition = AND
- All conditions must pass for a rule to apply

### Rule Application

When a rule's condition passes, its `effects` are merged into the scoring state:

- **Additive** keys: `waterScore`, `fertilizerScore`, `pestRiskScore`, `lightScore` — added to current value
- **Multiplier** keys: `waterMultiplier`, `fertilizerMultiplier`, `pestMultiplier`, `lightMultiplier` — multiplied with current value

---

## Final Score Calculation

### Formula

```
finalScore = clamp((1.0 + sum(additives)) × product(multipliers), 0.5, 2.0)
```

### Base State

All scores start at `1.0`, all multipliers start at `1.0`:

```js
{
  waterScore: 1.0,
  fertilizerScore: 1.0,
  pestRiskScore: 1.0,
  lightScore: 1.0,
  waterMultiplier: 1.0,
  fertilizerMultiplier: 1.0,
  pestMultiplier: 1.0,
  lightMultiplier: 1.0
}
```

### Clamping

Final scores are clamped between **0.5** and **2.0**.

### Score Interpretation

| Value | Meaning       |
| ----- | ------------- |
| 0.5   | Low intensity |
| 1.0   | Baseline      |
| 1.5   | Elevated      |
| 2.0   | Severe (max)  |

---

## Input Object Structure

Only `weather` and `plant` are required. All other objects and their sub-fields are **optional** — omitting them simply skips the related rules, producing a coarser but still valid score.

```ts
{
  // ── Required ──────────────────────────────────────────────
  weather: {
    temperature: number,      // °C
    humidity: number,         // 0–100
    condition: string,        // "sunny" | "cloudy" | "rainy" | "storm"
    light: string,            // "shade" | "indirect" | "partial" | "full_sun" | "intense"
    windSpeed?: number        // m/s; omit → wind rules skip (optional)
  },

  plant: {
    category?: string,        // "crop" | "tree" | "flower" — triggers category-specific rules
    family: string,           // see Plant Families table
    ageDays: number,          // days since planted
    growthStage: string       // "germination" | "seedling" | "vegetative"
                              // | "flowering" | "fruiting" | "mature"
  },

  // ── Optional — improves accuracy when provided ────────────
  soil?: {                    // omit → all soil & moisture rules skip
    type: string,             // see Soil Types table
    moisture?: number         // 0–100; omit → only type-based rules fire
  },

  watering?: {                // omit → all watering history rules skip
    hoursSinceLastWatering: number  // hours
  },

  stress?: {                  // omit → all disease & severity rules skip
    diseaseType: string,      // "none" | "fungal" | "bacterial"
    severity?: string         // "none" | "medium" | "high"; omit → disease-type rules fire, severity rules skip
  }
}
```

### Optional Fields Behaviour

| Scenario | What fires | Accuracy |
|---|---|---|
| `soil` omitted entirely | No soil-layer rules | Baseline |
| `soil: { type }` only | Only type-based rules (e.g. `soil_sandy_water_leaching`) | Partial |
| `soil: { type, moisture }` | Type rules + moisture rules (e.g. `soil_low_moisture_drought_stress`) | Full |
| `watering` omitted entirely | No watering-layer rules | Baseline |
| `watering: { hoursSinceLastWatering }` only | Watering history rules (e.g. `watering_mild_drought`) | Partial |
| `watering + soil.moisture` | Over-saturation rules also fire (e.g. `watering_over_saturation_risk`) | Full |
| `stress` omitted entirely | No pest-layer disease/severity rules | Baseline |
| `stress: { diseaseType }` only | Only disease-type rules (e.g. `pest_fungal_humidity_high`) | Partial |
| `stress: { diseaseType, severity }` | Disease-type + severity rules (e.g. `pest_high_severity_amplification`) | Full |
| `weather.windSpeed` omitted | No wind rules fire | Baseline |
| `weather.windSpeed` provided | Wind ET rules fire (≥5.5 m/s, ≥11 m/s) | Improved water accuracy |

Each sub-field independently unlocks its own set of rules. Providing partial data gives **more accuracy than omitting the whole object**, but less than providing all sub-fields.

---

## Output Object Structure

### `evaluate(input)`

```js
{
  waterScore: 2.0,        // 0.5 – 2.0
  fertilizerScore: 1.8,   // 0.5 – 2.0
  pestRiskScore: 1.4,     // 0.5 – 2.0
  lightScore: 1.2,        // 0.5 – 2.0
  _appliedRules: [        // rules that matched
    { id: "rule_id", layer: "global", explainKey: "rule_id" },
    ...
  ]
}
```

### `evaluateByLayer(input)`

```js
{
  layers: {
    global:     { waterScore, fertilizerScore, pestRiskScore, lightScore, _appliedRules },
    soil:       { ... },
    plantFamily:{ ... },
    growthStage:{ ... },
    watering:   { ... },
    pest:       { ... },
    light:      { ... }
  },
  final: { waterScore, fertilizerScore, pestRiskScore, lightScore, _appliedRules }
}
```

### `getRuleCount()`

```js
{ global: 17, soil: 19, plantFamily: 35, growthStage: 18, watering: 7, pest: 9, light: 22, total: 127 }
```

---

## Rule JSON Schema

Each rule file contains a `rules` array. A single rule:

```json
{
  "id": "unique_id",
  "explainKey": "unique_id",
  "factor": "weather",
  "condition": {
    "weather.temperature": { "gte": 30, "lt": 35 },
    "soil.type": { "eq": "sandy" },
    "plant.family": { "eq": "leafy_greens" }
  },
  "effects": {
    "waterScore": 0.3,
    "waterMultiplier": 1.2,
    "fertilizerScore": 0.2,
    "pestRiskScore": 0.4
  },
  "weight": 0.5,
  "explanation": "Human-readable description"
}
```

### Field Reference

| Field         | Description                            |
| ------------- | -------------------------------------- |
| `id`          | Unique string identifier               |
| `factor`      | Descriptive category (e.g. "weather")  |
| `condition`   | Nested path → operator → threshold map |
| `effects`     | Additive & multiplier score changes    |
| `weight`      | Numeric weight from source data        |
| `explanation` | Human-readable rationale               |
| `explainKey`  | Short identifier for client-side i18n mapping   |

### Effect Types

| Key                    | Type           | Effect                       |
| ---------------------- | -------------- | ---------------------------- |
| `waterScore`           | additive       | +/– to water score           |
| `fertilizerScore`      | additive       | +/– to fertilizer score      |
| `pestRiskScore`        | additive       | +/– to pest risk score       |
| `waterMultiplier`      | multiplicative | × factor on water score      |
| `fertilizerMultiplier` | multiplicative | × factor on fertilizer score |
| `pestMultiplier`       | multiplicative | × factor on pest risk score  |
| `lightScore`           | additive       | +/– to light score           |
| `lightMultiplier`      | multiplicative | × factor on light score      |

---

## Reference Tables

### Plant Families

| Family                | Water Sensitivity | Nutrient Demand | Pest Susceptibility |
| --------------------- | :---------------: | :-------------: | :-----------------: |
| leafy_greens          |       1.3×        |    baseline     |        +0.2         |
| fruiting_nightshade   |       1.2×        |      +0.2       |      baseline       |
| succulent             |       0.5×        |    baseline     |        -0.2         |
| root_crops            |       1.1×        |      +0.1       |      baseline       |
| brassicas             |       1.2×        |    baseline     |        +0.3         |
| legumes               |       0.8×        |      -0.2       |      baseline       |
| herbs                 |       0.7×        |    baseline     |        -0.2         |
| tropical              |       1.4×        |    baseline     |        +0.2         |
| citrus                |       1.1×        |    baseline     |        +0.2         |
| vines                 |       1.0×        |    baseline     |        +0.2         |
| grasses               |       0.8×        |      +0.2       |      baseline       |
| flowering_ornamentals |       1.0×        |    baseline     |        +0.2         |
| **cucurbits**         |     **1.3×**      |    **+0.2**     |      **+0.3**       |
| **alliums**           |     **0.9×**      |    **+0.2**     |      **-0.1**       |
| **berries**           |     **1.2×**      |    **+0.2**     |      **+0.2**       |
| **palm**              |     **0.8×**      |    **+0.1**     |      baseline       |

### Light Levels

| Level      | Description                                    |
| ---------- | ---------------------------------------------- |
| shade      | Deep shade — minimal direct light              |
| indirect   | Indirect / filtered light — under canopy       |
| partial    | Partial sun — 3-6 hours direct light           |
| full_sun   | Full sun — 6+ hours direct light               |
| intense    | Intense direct sunlight — midday desert-like   |

### Soil Types

| Type        | Water Effect | Fertilizer Effect | Pest Effect |
| ----------- | :----------: | :---------------: | :---------: |
| sandy       |     +0.3     |       +0.2        |    -0.1     |
| aridisols   |     +0.5     |       +0.3        |      —      |
| entisols    |     -0.1     |       -0.2        |      —      |
| inceptisols |     +0.1     |       +0.2        |      —      |
| alfisols    |     -0.2     |       -0.1        |      —      |
| vertisols   |     +0.3     |       +0.1        |      —      |
| **loam**    |  **+0.0**    |     **-0.1**      |      —      |
| **clay**    |  **-0.2**    |     **-0.1**      |      —      |
| **silt**    |  **+0.1**    |     **+0.1**      |      —      |

---

## Usage Example

```js
import { evaluate, evaluateByLayer, getRuleCount } from "./engine/index.js";

// Full input — all optional fields provided
const full = {
  weather: { temperature: 32, humidity: 35, condition: "sunny", light: "full_sun", windSpeed: 4.2 },
  soil: { type: "sandy", moisture: 15 },
  plant: { category: "crop", family: "leafy_greens", ageDays: 30, growthStage: "vegetative" },
  watering: { hoursSinceLastWatering: 48 },
  stress: { diseaseType: "none", severity: "none" },
};
console.log(evaluate(full));
// { waterScore: 2.0, fertilizerScore: 1.8, pestRiskScore: 1.4, ... }

// Minimal input — only required fields
const minimal = {
  weather: { temperature: 20, humidity: 50, condition: "cloudy", light: "indirect" },
  plant: { category: "tree", family: "citrus", growthStage: "flowering", ageDays: 200 },
};
console.log(evaluate(minimal));
// Still returns valid scores (fewer rules fire, less accurate)

const layered = evaluateByLayer(full);
console.log(layered.layers.global);
console.log(layered.final);

console.log(getRuleCount());
// { global: 17, soil: 19, plantFamily: 35, growthStage: 18, watering: 7, pest: 9, light: 22, total: 127 }
```

---

## Extending the Engine

**To add a new factor (e.g. `nutrient`):**
1. Create `rules/weather_nutrient_modifiers.json`
2. Create `engine/nutrient.js`
3. Register it in `engine/index.js` `LAYER_ORDER`

**To add a new soil type / plant family:** add rules to the corresponding JSON file.

**To add a new layer:** create the module, import in `index.js`, add to `LAYER_ORDER`.

---

## Requirements

- Node.js >= 20.x
- No external dependencies
