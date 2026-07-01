"use strict";

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const raw = require("../../shared/rules/weather_soil_modifiers.json");

/**
 * Infers the factor category from a rule's effects object
 * @param {object} effects - The effects object from a rule
 * @returns {string} The inferred factor: "water", "pestRisk", or "fertilizer"
 */
function inferFactor(effects) {
  if (effects.waterScore !== undefined || effects.waterMultiplier !== undefined)
    return "water";
  if (effects.pestRiskScore !== undefined) return "pestRisk";
  if (effects.fertilizerScore !== undefined) return "fertilizer";
  return "water";
}

const rules = raw.rules.map((r, i) => ({
  id: r.id,
  layer: "soil",
  factor: inferFactor(r.effects),
  priority: i + 1,
  condition: r.condition,
  effect: r.effects,
  weight: r.weight,
  explainKey: r.id,
}));

export const layer = "soil";
export { rules };
