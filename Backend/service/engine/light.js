"use strict";

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const raw = require("../../shared/db/rules/weather_light_modifiers.json");

function inferFactor(effects) {
  if (effects.lightScore !== undefined || effects.lightMultiplier !== undefined)
    return "light";
  if (effects.pestRiskScore !== undefined) return "pestRisk";
  if (effects.fertilizerScore !== undefined) return "fertilizer";
  if (effects.waterScore !== undefined || effects.waterMultiplier !== undefined)
    return "water";
  return "light";
}

const rules = raw.rules.map((r, i) => ({
  id: r.id,
  layer: "light",
  factor: inferFactor(r.effects),
  priority: i + 1,
  condition: r.condition,
  effect: r.effects,
  weight: r.weight,
  explainKey: r.id,
}));

export const layer = "light";
export { rules };
