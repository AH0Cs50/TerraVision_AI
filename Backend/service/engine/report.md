# Engine Test Report

## Overview

The deterministic scoring engine was tested with **12 test cases** covering all 6 layers (global, soil, plantFamily, growthStage, watering, pest) across diverse environmental, soil, plant, and stress conditions.

**Rule counts:** global=15, soil=16, plantFamily=24, growthStage=18, watering=6, pest=9 — **88 total rules**.

---

## Score Interpretation

| Value | Meaning    |
| ----- | ---------- |
| 0.5   | Low        |
| 1.0   | Baseline   |
| 1.5   | Elevated   |
| 2.0   | Severe     |

**Formula:** `final = clamp((1.0 + sum(additives)) × product(multipliers), 0.5, 2.0)`

---

## Test Results Summary

| TC  | Scenario                                              | Water | Fertilizer | Pest  | Rules Applied |
| :-: | ----------------------------------------------------- | :---: | :--------: | :---: | :-----------: |
| 01  | Optimal — Leafy greens, vegetative, loam, cloudy      | 2.000 | 1.700      | 1.000 | 7             |
| 02  | Extreme — Heat 38°C, sandy, drought 96h               | 2.000 | 2.000      | 2.000 | 16            |
| 03  | Cold — 8°C, rainy, alfisols, mature                   | 0.500 | 0.500      | 2.000 | 13            |
| 04  | Storm — Fungal, high severity, vertisols              | 1.498 | 2.000      | 2.000 | 13            |
| 05  | Desert — Succulent, aridisols, 168h drought           | 1.920 | 1.300      | 2.000 | 15            |
| 06  | Tropical — Entisols, rainy, germination               | 0.500 | 0.800      | 2.000 | 9             |
| 07  | Legumes — Vegetative, optimal, low fertilizer need    | 1.056 | 1.200      | 0.800 | 9             |
| 08  | Worst-case — Bacterial, heat 35°C, drought 120h       | 2.000 | 2.000      | 2.000 | 16            |
| 09  | Herbs — Flowering, pest-resistant                     | 1.109 | 1.500      | 0.600 | 9             |
| 10  | Storm — Vertisols, seedling, high moisture            | 1.056 | 1.400      | 2.000 | 13            |
| 11  | Grasses — Fungal medium severity, 48h drought         | 1.320 | 1.800      | 1.300 | 9             |
| 12  | Minimal — No watering/stress input, citrus, flowering | 1.573 | 1.500      | 1.000 | 7             |

---

## Detailed Per-Layer Breakdown

### TC-01: Optimal / Baseline Conditions
```
Input:        temp=25°C  hum=55%  cloudy  |  loam  moist=50%  |  leafy_greens  vegetative  30d  |  18h  |  none/none
Final:        water=2.000   fert=1.700   pest=1.000
  global      +0.0 water  +0.1 fert                            [optimal_temp_baseline]
  soil        -0.1 pest                                         [optimal_moisture]
  plantFamily ×1.3 water  +0.2 pest                             [water_sensitivity, pest_susceptibility]
  growthStage ×1.1×1.4 water  +0.3+0.3 fert                    [vegetative_water_demand, vegetative_leafy_greens]
  watering    (no rules matched)
  pest        -0.1 pest                                         [optimal_growth_suppression]
```
Leafy greens' ×1.3 water multiplier compounds with vegetative stage's ×1.1 and ×1.4 multipliers → high water score despite optimal weather.

---

### TC-02: Extreme Heat + Drought (Worst Case for Water)
```
Input:        temp=38°C  hum=25%  sunny  |  sandy  moist=10%  |  leafy_greens  vegetative  30d  |  96h  |  none/none
Final:        water=2.000   fert=2.000   pest=2.000
  global      +0.5 water  +0.4 water  +0.3 water  +0.2 water   [extreme_heat, dry_heat, low_humidity, sunny]
  soil        +0.3 water  +0.2 fert  -0.1 pest  +0.3 water     [sandy_water, sandy_fert, sandy_pest, low_moisture]
  plantFamily ×1.3 water  +0.2 pest
  growthStage ×1.1×1.4 water  +0.3+0.3 fert
  watering    +0.5 water  +0.7 water  +0.2 fert  +0.3 pest     [drought_high(>72h), drought_recovery(>96h), heat_drought_compound]
  pest        +0.2 pest  +0.2 water  +0.3 pest                 [heat_reproduction, stress_vulnerability]
```
All three scores hit cap (2.000). 16 rules matched — the highest in the suite. Every layer contributes significantly.

---

### TC-03: Cold + Rainy + Clay (Worst Case for Pest)
```
Input:        temp=8°C  hum=90%  rainy  |  alfisols  moist=85%  |  brassicas  mature  120d  |  6h  |  none/none
Final:        water=0.500   fert=0.500   pest=2.000
  global      -0.2 water  -0.2 fert  -0.3 water  +0.4 pest     [cold, high_humidity, rainy, fungal_risk]
  soil        -0.2 water  -0.1 fert  +0.2 water  +0.3 pest     [alfisols_drainage, alfisols_waterlogging, high_moisture]
  plantFamily ×1.2 water  +0.3 pest
  growthStage ×0.8 water  -0.2 fert  +0.2 pest                 [mature_reduced, mature_senescence]
  watering    -0.2 water  +0.1 pest                             [recently_watered]
  pest        +0.3 pest                                         [soil_borne_moisture]
```
Water and fertilizer crash to 0.500 (cold + rainy saturate soil). Pest hits 2.000 (high humidity + clay waterlogging + brassicas susceptibility + senescence).

---

### TC-04: Fungal Disease + Storm
```
Input:        temp=28°C  hum=88%  storm  |  vertisols  moist=75%  |  fruiting_nightshade  fruiting  60d  |  12h  |  fungal/high
Final:        water=1.498   fert=2.000   pest=2.000
  global      -0.4 water  +0.2 pest  +0.4 pest  +0.3 pest      [storm, fungal_risk, heat_humidity_pest]
  soil        +0.3 water  +0.1 fert  +0.4 pest                 [vertisols_cracking, vertisols_waterlogged]
  plantFamily ×1.2 water  +0.2 fert
  growthStage ×1.2×1.3 water  +0.3+0.3 fert  +0.2 pest        [fruiting_water, fruiting_nightshade]
  watering    (no rules matched)
  pest        +0.5 pest  +0.5 pest  +0.2 water                 [fungal_humidity_high, high_severity]
```
Fungal disease at high severity + 88% humidity triggers `pest_fungal_humidity_high` (+0.5 pest). Storm on vertisols → `vertisols_waterlogged` (+0.4 pest).

---

### TC-05: Desert Conditions with Succulent
```
Input:        temp=33°C  hum=15%  sunny  |  aridisols  moist=8%  |  succulent  mature  365d  |  168h  |  none/none
Final:        water=1.920   fert=1.300   pest=2.000
  global      +0.3 water  +0.3 water  +0.4 water  +0.2 water   [high_heat, low_humidity, dry_heat, sunny]
  soil        +0.5 water  +0.3 fert  +0.3 water                [aridisols_desert, low_moisture]
  plantFamily ×0.5 water  -0.2 pest                             [succulent_low_water, pest_resistance]
  growthStage ×0.8 water  -0.2 fert  +0.2 pest                 [mature_reduced, senescence]
  watering    +0.5 water  +0.7 water  +0.2 fert  +0.3 pest     [drought_high, drought_recovery, heat_drought]
  pest        +0.2 pest  +0.2 water  +0.3 pest                 [heat_reproduction, stress_vulnerability]
```
Succulent's ×0.5 water multiplier partially offsets desert drought signals. Pest still hits 2.000 from combined heat/drought stress despite succulent's natural pest resistance (-0.2).

---

### TC-06: Tropical Germination in Rainy River Basin
```
Input:        temp=30°C  hum=75%  rainy  |  entisols  moist=70%  |  tropical  germination  5d  |  4h  |  none/none
Final:        water=0.500   fert=0.800   pest=2.000
  global      +0.3 water  -0.5 water  +0.3 pest                [high_heat, rainy, heat_humidity_pest]
  soil        -0.1 water  -0.2 fert  -0.3 water  +0.3 pest     [entisols_fertility, entisols_flood_risk]
  plantFamily ×1.4 water  +0.2 pest
  growthStage (no rules — no germination rules for tropical)
  watering    -0.2 water  +0.1 pest                             [recently_watered]
  pest        +0.2 pest                                         [heat_reproduction]
```
Rainy condition (-0.5 water) + entisols flood risk (-0.3 water) push water to 0.500. Pest elevated by flood risk + tropical humidity requirement + heat reproduction.

---

### TC-07: Legumes with Low Fertilizer Demand
```
Input:        temp=22°C  hum=60%  cloudy  |  inceptisols  moist=45%  |  legumes  vegetative  25d  |  24h  |  none/none
Final:        water=1.056   fert=1.200   pest=0.800
  global      +0.0 water  +0.1 fert                             [optimal_temp_baseline]
  soil        +0.1 water  +0.2 fert  -0.1 pest                 [inceptisols, optimal_moisture]
  plantFamily ×0.8 water  -0.2 fert                             [legumes_low_water, nitrogen_fixation]
  growthStage ×1.1 water  +0.3 fert  -0.2 fert                 [vegetative_demand, legumes_nitrogen]
  watering    +0.1 water                                        [mild_drought]
  pest        -0.1 pest                                         [optimal_growth_suppression]
```
Legumes fix nitrogen → `fertilizerScore` reduced by -0.2 (family) and -0.2 (growth stage). Pest stays low (0.800) due to optimal conditions suppression.

---

### TC-08: Bacterial Disease + Extreme Heat + Drought
```
Input:        temp=35°C  hum=72%  sunny  |  sandy  moist=5%  |  fruiting_nightshade  fruiting  70d  |  120h  |  bacterial/high
Final:        water=2.000   fert=2.000   pest=2.000
  global      +0.5 water  +0.2 water  +0.3 pest                [extreme_heat, sunny, heat_humidity_pest]
  soil        +0.3 water  +0.2 fert  -0.1 pest  +0.3 water     [sandy_water, sandy_fert, sandy_pest, low_moisture]
  plantFamily ×1.2 water  +0.2 fert
  growthStage ×1.2×1.3 water  +0.3+0.3 fert  +0.2 pest        [fruiting, nightshade_fruiting]
  watering    +0.5 water  +0.7 water  +0.2 fert  +0.3 pest     [drought_high, drought_recovery, heat_drought]
  pest        +0.4 pest  +0.5 pest  +0.2 water  +0.3 pest      [bacterial_heat, high_severity, stress_vulnerability]
```
Triple cap (all 2.000). Bacterial disease at 35°C + 72% humidity + high severity → extreme pest risk. 16 rules matched.

---

### TC-09: Herbs with Pest Resistance
```
Input:        temp=26°C  hum=40%  sunny  |  sandy  moist=30%  |  herbs  flowering  45d  |  36h  |  none/none
Final:        water=1.109   fert=1.500   pest=0.600
  global      +0.0 water  +0.1 fert  +0.2 water                [optimal_temp, sunny]
  soil        +0.3 water  +0.2 fert  -0.1 pest                 [sandy_water, sandy_fert, sandy_pest]
  plantFamily ×0.7 water  -0.2 pest                             [herbs_low_water, pest_resistance]
  growthStage ×1.1 water  +0.2 fert  ×0.9 water  -0.1 pest    [flowering_demand, herbs_aromatic]
  watering    +0.1 water                                        [mild_drought]
  pest        (no rules matched)
```
Lowest pest score in the suite (0.600). Herbs' natural pest resistance (-0.2) + aromatic flowering (-0.1) + sandy soil (-0.1) stack to reduce pest risk significantly. No pest-layer rules matched.

---

### TC-10: Storm on Vertisols with Seedling
```
Input:        temp=34°C  hum=82%  storm  |  vertisols  moist=90%  |  root_crops  seedling  10d  |  8h  |  none/none
Final:        water=1.056   fert=1.400   pest=2.000
  global      +0.3 water  -0.3 water  -0.4 water  +0.2 pest    [high_heat, high_humidity, storm, heat_humidity_pest]
  soil        +0.3 water  +0.1 fert  +0.4 water  +0.4 pest     [vertisols, dry_cracking, waterlogged, high_moisture_sat]
  plantFamily ×1.1 water  +0.1 fert
  growthStage ×1.2 water  +0.2 fert  +0.2 pest                 [seedling_vulnerability]
  watering    -0.2 water  +0.1 pest                             [recently_watered]
  pest        +0.2 pest                                         [heat_reproduction]
```
Storm + vertisols + high moisture → `vertisols_waterlogged` (+0.4 pest) + `high_moisture_saturation` (+0.3 pest). Seedling vulnerability adds +0.2 pest. Pest hits 2.000.

---

### TC-11: Fungal Medium Severity on Grasses
```
Input:        temp=27°C  hum=65%  cloudy  |  inceptisols  moist=55%  |  grasses  vegetative  40d  |  48h  |  fungal/medium
Final:        water=1.320   fert=1.800   pest=1.300
  global      +0.0 water  +0.1 fert                             [optimal_temp]
  soil        +0.1 water  +0.2 fert  -0.1 pest                 [inceptisols, optimal_moisture]
  plantFamily ×0.8 water  +0.2 fert                             [grasses, grasses_nutrient]
  growthStage ×1.1 water  +0.3 fert                             [vegetative_demand]
  watering    +0.3 water                                        [drought_moderate]
  pest        +0.2 pest  +0.2 pest  +0.1 water                 [fungal_moderate, medium_severity]
```
Moderate stress scenario. Fungal at 65% humidity triggers moderate (+0.2) rather than high (+0.5) fungal risk. Medium severity adds +0.2 pest.

---

### TC-12: Minimal Input — No Watering or Stress
```
Input:        temp=20°C  hum=50%  cloudy  |  sandy  moist=40%  |  citrus  flowering  200d  |  (none)  |  (none)
Final:        water=1.573   fert=1.500   pest=1.000
  global      +0.0 water  +0.1 fert                             [optimal_temp]
  soil        +0.3 water  +0.2 fert  -0.1 pest  -0.1 pest      [sandy_water, sandy_fert, sandy_pest, optimal_moisture]
  plantFamily ×1.1 water  +0.2 pest                             [citrus_water, citrus_pest]
  growthStage ×1.1 water  +0.2 fert                             [flowering_demand]
  watering    (no rules — no watering input)
  pest        (no rules — no stress input)
```
Engine gracefully handles missing `watering` and `stress` keys. 7 rules matched — all from weather, soil, plantFamily, growthStage layers. Pest stays at 1.000 baseline.

---

## Key Observations

1. **All three scores can hit 2.000 (cap)** simultaneously under extreme conditions (TC-02, TC-08). The cap prevents unbounded scores.

2. **Pest risk is the easiest score to max out** — combinations of high humidity, waterlogged soil, plant family susceptibility, and disease severity compound rapidly.

3. **The succulent family (×0.5 water multiplier)** provides the strongest single-rule water demand reduction, but can be overwhelmed by multiple additive water signals from other layers.

4. **The engine handles missing optional keys gracefully** (TC-12) — no crash when `watering` or `stress` are absent. Layers with no matching rules simply pass through unchanged scores.

5. **Cold + rainy scenarios** drive water and fertilizer scores down to 0.500 (minimum) while pest risk climbs (TC-03).

6. **Legumes' nitrogen fixation** (-0.2 fertilizerScore) is correctly applied at both the plant family layer and the vegetative growth stage layer.

7. **Layer stacking** — additive effects accumulate across layers, then multipliers compound at the end. This means a high multiplier early (e.g., plantFamily ×1.4 for tropical) amplifies all subsequent additive effects from later layers.

8. **No watering layer rules match when `watering` is undefined** (TC-12), showing the engine correctly short-circuits condition evaluation on undefined paths.
