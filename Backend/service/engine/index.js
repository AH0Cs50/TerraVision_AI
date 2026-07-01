"use strict";

import * as engine from "./engine.js";
import { rules as globalRules, layer as globalLayer } from "./global.js";
import { rules as soilRules, layer as soilLayer } from "./soil.js";
import { rules as plantFamilyRules, layer as plantFamilyLayer } from "./plantFamilies.js";
import { rules as growthStageRules, layer as growthStageLayer } from "./growthStages.js";
import { rules as wateringRules, layer as wateringLayer } from "./watering.js";
import { rules as pestDiseaseRules, layer as pestLayer } from "./pestDisease.js";
import { rules as lightRules, layer as lightLayer } from "./light.js";

const LAYER_ORDER = [
  { layer: globalLayer, rules: globalRules },
  { layer: soilLayer, rules: soilRules },
  { layer: plantFamilyLayer, rules: plantFamilyRules },
  { layer: growthStageLayer, rules: growthStageRules },
  { layer: wateringLayer, rules: wateringRules },
  { layer: pestLayer, rules: pestDiseaseRules },
  { layer: lightLayer, rules: lightRules }
];

const allRules = LAYER_ORDER.flatMap((l) => l.rules);

/**
 * Evaluates all rules against the input and returns aggregated scores
 * @param {object} input - The engine input data (weather + plant)
 * @returns {{ waterScore: number, fertilizerScore: number, pestRiskScore: number, lightScore: number }} The computed scores
 */
function evaluate(input) {
  return engine.evaluateRules(input, allRules);
}

/**
 * Evaluates rules layer-by-layer and returns per-layer results plus a final aggregate
 * @param {object} input - The engine input data (weather + plant)
 * @returns {{ layers: object, final: { waterScore: number, fertilizerScore: number, pestRiskScore: number, lightScore: number } }} Per-layer and final scores
 */
function evaluateByLayer(input) {
  const results = {};
  for (const l of LAYER_ORDER) {
    results[l.layer] = engine.evaluateRules(input, l.rules);
  }
  return { layers: results, final: engine.evaluateRules(input, allRules) };
}

/**
 * Returns the rule count per layer and total
 * @returns {object} Object mapping layer names to rule counts, with a `total` property
 */
function getRuleCount() {
  const counts = {};
  for (const l of LAYER_ORDER) {
    counts[l.layer] = l.rules.length;
  }
  counts.total = allRules.length;
  return counts;
}

export { evaluate, evaluateByLayer, getRuleCount, engine, LAYER_ORDER, allRules };
