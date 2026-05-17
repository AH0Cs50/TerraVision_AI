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

function evaluate(input) {
  return engine.evaluateRules(input, allRules);
}

function evaluateByLayer(input) {
  const results = {};
  for (const l of LAYER_ORDER) {
    results[l.layer] = engine.evaluateRules(input, l.rules);
  }
  return { layers: results, final: engine.evaluateRules(input, allRules) };
}

function getRuleCount() {
  const counts = {};
  for (const l of LAYER_ORDER) {
    counts[l.layer] = l.rules.length;
  }
  counts.total = allRules.length;
  return counts;
}

export { evaluate, evaluateByLayer, getRuleCount, engine, LAYER_ORDER, allRules };
