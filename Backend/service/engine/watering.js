"use strict";

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const raw = require("../../shared/db/rules/weather_watering_history_modifiers.json");

function inferFactor(effects) {
  if (effects.waterScore !== undefined || effects.waterMultiplier !== undefined)
    return "water";
  if (effects.pestRiskScore !== undefined) return "pestRisk";
  if (effects.fertilizerScore !== undefined) return "fertilizer";
  return "water";
}

const rules = raw.rules.map((r, i) => ({
  id: r.id,
  layer: "watering",
  factor: inferFactor(r.effects),
  priority: i + 1,
  condition: r.condition,
  effect: r.effects,
  weight: r.weight,
  explainKey: r.id,
}));

export const layer = "watering";
export { rules };
