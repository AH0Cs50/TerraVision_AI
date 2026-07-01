"use strict";

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const raw = require("../../shared/rules/weather_pest_disease_modifiers.json");

/**
 * Infers the factor category from a rule's effects object
 * @param {object} effects - The effects object from a rule
 * @returns {string} The inferred factor: "pestRisk", "water", or "fertilizer"
 */
function inferFactor(effects) {
  if (effects.pestRiskScore !== undefined) return "pestRisk";
  if (effects.waterScore !== undefined || effects.waterMultiplier !== undefined)
    return "water";
  if (effects.fertilizerScore !== undefined) return "fertilizer";
  return "pestRisk";
}

const rules = raw.rules.map((r, i) => ({
  id: r.id,
  layer: "pest",
  factor: inferFactor(r.effects),
  priority: i + 1,
  condition: r.condition,
  effect: r.effects,
  weight: r.weight,
  explainKey: r.id,
}));

export const layer = "pest";
export { rules };
