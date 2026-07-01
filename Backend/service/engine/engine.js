"use strict";

/**
 * Resolves a dot-notation path string against an object
 * @param {object} obj - The object to traverse
 * @param {string} pathStr - Dot-separated path (e.g. "plant.soil.moisture")
 * @returns {*} The value at the resolved path, or undefined if any segment is null/undefined
 */
function resolvePath(obj, pathStr) {
  const keys = pathStr.split(".");
  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    current = current[key];
  }
  return current;
}

/**
 * Evaluates whether the input satisfies all conditions in a rule condition object
 * @param {object} condition - Condition object mapping paths to constraints
 * @param {object} input - The input data to test against
 * @returns {boolean} True if all conditions are met
 */
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

/**
 * Evaluates a single comparison operator against a value and threshold
 * @param {string} op - Operator name: eq, gte, lte, gt, lt, neq
 * @param {*} value - The value to compare
 * @param {*} threshold - The threshold to compare against
 * @returns {boolean} True if the comparison passes
 */
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

/**
 * Creates the base evaluation state with default scores and multipliers of 1.0
 * @returns {object} Base state object with score and multiplier fields
 */
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

/**
 * Applies a single rule's effect to the state if its condition matches the input
 * @param {object} rule - The rule object with condition, effect, id, and layer properties
 * @param {object} input - The input data to evaluate conditions against
 * @param {object} state - The current evaluation state
 * @returns {object} Updated state after applying the rule (unchanged if condition not met)
 */
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

/**
 * Clamps a number between a minimum and maximum value
 * @param {number} value - The value to clamp
 * @param {number} min - The lower bound
 * @param {number} max - The upper bound
 * @returns {number} The clamped value
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Aggregates additive scores and multipliers into final clamped scores
 * @param {object} state - The evaluation state after all rules have been applied
 * @returns {{ waterScore: number, fertilizerScore: number, pestRiskScore: number, lightScore: number, _appliedRules: Array }} Final scores clamped to [0.5, 2.0]
 */
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

/**
 * Evaluates all rules against the given input and returns aggregated scores
 * @param {object} input - The engine input data (weather + plant)
 * @param {Array<object>} rules - Array of rule objects to evaluate
 * @returns {{ waterScore: number, fertilizerScore: number, pestRiskScore: number, lightScore: number, _appliedRules: Array }} The final computed scores
 */
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
