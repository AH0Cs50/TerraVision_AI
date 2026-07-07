import { evaluate } from "../service/engine/index.js";
import {
  plantCareActionLogger,
  plantCareStateService,
  plantService,
  plantTaskCareManager,
  userRepo,
  weatherDescriber,
  weatherService,
} from "../shared/container.js";
import { detectAndSaveDisease } from "./disease-detection.usecase.js";

/**
 * Fetches weather data for a location and transforms it into the engine's expected format
 * @param {{ city?: string, lat?: number, lon?: number }} location - User's location object
 * @returns {Promise<object>} Engine-formatted weather input
 */
async function buildEngineWeather(location) {
  const transformed = await weatherService.getWeather(location);
  const described = weatherDescriber.weatherDescribe(transformed);
  return weatherDescriber.weatherDescribeForEngine(described);
}

/**
 * Auto-detects disease on the latest plant image if no disease history exists.
 * Used only by analyzeAndSavePlant (full analysis route).
 * @param {object} plant - Plant entity
 * @param {string} plantUUID - Plant's UUID
 * @param {{ uuid: string }} user - Authenticated user
 * @returns {Promise<object>} Updated plant entity after detection
 */
async function autoDetectDisease(plant, plantUUID, user) {
  if (!plant.diseaseHistory?.length && plant.cdn?.images?.length) {
    const latestImage = plant.cdn.images[plant.cdn.images.length - 1];
    const fullKey = (plant.cdn.basePath || "") + latestImage;
    await detectAndSaveDisease({
      key: fullKey,
      userId: user.uuid,
      plantId: plantUUID,
      expectedPlant: plant.commonName || plant.name,
    });
    return await plantService.verifyPlantAccess(
      plantUUID,
      user.uuid,
      user.role,
    );
  }
  return plant;
}

/**
 * Pure engine evaluation: runs the 131-rule engine with plant data and weather,
 * saves scores to the care state. No disease detection, no task generation, no logging.
 * Shared by analyzeAndSavePlant and performAction.
 * @param {object} plant - Plant entity (must be verified by caller)
 * @param {{ uuid: string }} user - Authenticated user
 * @returns {Promise<{ status: object, activeTasks: Array, scores: object, _weatherWarning?: string, plant: object, rawUser: object }>}
 */
export async function evaluatePlantEngine(plant, user) {
  const plantInput = plant.getEnginePlantInput();
  let weatherInput = null;
  let weatherWarning = null;
  const rawUser = await userRepo.findByUUID(user.uuid);
  const location = rawUser?.location;

  if (location) {
    try {
      weatherInput = await buildEngineWeather(location);
    } catch (error) {
      weatherWarning = `Weather data unavailable: ${error.message}`;
    }
  }

  const engineResult = evaluate({ weather: weatherInput, ...plantInput });

  if (weatherWarning) {
    engineResult._weatherWarning = weatherWarning;
  }

  const careState = await plantCareStateService.saveEngineOutput(
    plant.uuid,
    engineResult,
  );

  const {
    waterScore,
    fertilizerScore,
    pestRiskScore,
    lightScore,
    _weatherWarning: ww,
  } = engineResult;

  return {
    status: careState.status,
    activeTasks: careState.activeTasks || [],
    scores: { waterScore, fertilizerScore, pestRiskScore, lightScore },
    _weatherWarning: ww,
    plant,
    rawUser,
  };
}

/**
 * Full pipeline: verifies access, auto-detects disease, runs engine,
 * generates tasks if none exist, and logs. Used by POST /:id/analyze.
 * @param {string} plantUUID - Plant's UUID
 * @param {{ uuid: string, role: string }} user - Authenticated user
 * @returns {Promise<{ status: object, activeTasks: Array, scores: object, _weatherWarning?: string }>}
 */
export async function analyzeAndSavePlant(plantUUID, user) {
  let plant = await plantService.verifyPlantAccess(
    plantUUID,
    user.uuid,
    user.role,
  );
  plant = await autoDetectDisease(plant, plantUUID, user);

  let { status, activeTasks, scores, _weatherWarning, rawUser } =
    await evaluatePlantEngine(plant, user);

  if (!activeTasks?.length) {
    await plantTaskCareManager.generateTasksFromStatus(plantUUID, user);
    const updated = await plantCareStateService.getByPlantUUID(plantUUID);
    if (updated) activeTasks = updated.activeTasks || [];
  }

  const metadata = { scores };
  if (_weatherWarning) metadata.weatherWarning = _weatherWarning;

  await plantCareActionLogger.logPlantAnalysis(
    plantUUID,
    user.uuid,
    rawUser.internalId,
    plant.internalId,
    "Plant analysis completed",
    metadata,
  );

  return { status, activeTasks, scores, _weatherWarning };
}
