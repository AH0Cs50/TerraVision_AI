"use strict";

function resolvePath(obj, pathStr) {
  const keys = pathStr.split(".");
  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    current = current[key];
  }
  return current;
}

function evaluateCondition(condition, input) {
  for (const [key, constraint] of Object.entries(condition)) {
    const value = resolvePath(input, key);

    if (constraint !== null && typeof constraint === "object" && !Array.isArray(constraint)) {
      for (const [op, threshold] of Object.entries(constraint)) {
        if (!evaluateOperator(op, value, threshold)) return false;
      }
    } else {
      if (value !== constraint) return false;
    }
  }
  return true;
}

function evaluateOperator(op, value, threshold) {
  switch (op) {
    case "eq": return value === threshold;
    case "gte": return typeof value === "number" && value >= threshold;
    case "lte": return typeof value === "number" && value <= threshold;
    case "gt": return typeof value === "number" && value > threshold;
    case "lt": return typeof value === "number" && value < threshold;
    case "neq": return value !== threshold;
    default: return false;
  }
}

const ADDITIVE_KEYS = ["waterScore", "fertilizerScore", "pestRiskScore", "lightScore"];
const MULTIPLIER_KEYS = ["waterMultiplier", "fertilizerMultiplier", "pestMultiplier", "lightMultiplier"];

function createBaseState() {
  return {
    waterScore: 1.0,
    fertilizerScore: 1.0,
    pestRiskScore: 1.0,
    lightScore: 1.0,
    waterMultiplier: 1.0,
    fertilizerMultiplier: 1.0,
    pestMultiplier: 1.0,
    lightMultiplier: 1.0,
    _appliedRules: []
  };
}

function applyRule(rule, input, state) {
  const conditionMet = evaluateCondition(rule.condition, input);
  if (!conditionMet) return state;

  const effect = rule.effect || {};
  const newState = { ...state, _appliedRules: [...state._appliedRules] };

  for (const key of ADDITIVE_KEYS) {
    if (effect[key] !== undefined) {
      newState[key] = (newState[key] || 0) + effect[key];
    }
  }

  for (const key of MULTIPLIER_KEYS) {
    if (effect[key] !== undefined) {
      newState[key] = (newState[key] || 1) * effect[key];
    }
  }

  newState._appliedRules.push({
    id: rule.id,
    layer: rule.layer,
    explainKey: rule.explainKey || rule.id
  });

  return newState;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function aggregateScores(state) {
  const final = {};

  final.waterScore = clamp(
    (1.0 + (state.waterScore - 1.0)) * state.waterMultiplier,
    0.5, 2.0
  );

  final.fertilizerScore = clamp(
    (1.0 + (state.fertilizerScore - 1.0)) * state.fertilizerMultiplier,
    0.5, 2.0
  );

  final.pestRiskScore = clamp(
    (1.0 + (state.pestRiskScore - 1.0)) * state.pestMultiplier,
    0.5, 2.0
  );

  final.lightScore = clamp(
    (1.0 + (state.lightScore - 1.0)) * state.lightMultiplier,
    0.5, 2.0
  );

  final._appliedRules = state._appliedRules;

  return final;
}

function evaluateRules(input, rules) {
  let state = createBaseState();
  for (const rule of rules) {
    state = applyRule(rule, input, state);
  }
  return aggregateScores(state);
}

export {
  evaluateRules,
  applyRule,
  evaluateCondition,
  createBaseState,
  aggregateScores
};
