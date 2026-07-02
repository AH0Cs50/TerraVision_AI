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
  // 1. Fetch weather data from API
  const transformed = await weatherService.getWeather(location);
  // 2. Generate human-readable weather description
  const described = weatherDescriber.weatherDescribe(transformed);
  // 3. Transform for engine consumption
  return weatherDescriber.weatherDescribeForEngine(described);
}

/**
 * Runs a full plant analysis: runs disease detection on latest image, evaluates engine rules with weather data, saves care state, generates tasks and AI insights
 * @param {string} plantUUID - Plant's UUID
 * @param {{ uuid: string, role: string }} user - Authenticated user
 * @returns {Promise<{ status: object, activeTasks: Array, scores: { waterScore: number, fertilizerScore: number, pestRiskScore: number, lightScore: number }, _weatherWarning?: string }>} Analysis results
 */
export async function analyzeAndSavePlant(plantUUID, user) {
  // 1. Verify plant access
  let plant = await plantService.verifyPlantAccess(
    plantUUID,
    user.uuid,
    user.role,
  );

  // 2. Auto-detect disease on latest image if no history exists
  if (!plant.diseaseHistory?.length && plant.cdn?.images?.length) {
    const latestImage = plant.cdn.images[plant.cdn.images.length - 1];
    const fullKey = (plant.cdn.basePath || "") + latestImage;
    await detectAndSaveDisease({
      key: fullKey,
      userId: user.uuid,
      plantId: plantUUID,
      expectedPlant: plant.commonName || plant.name,
    });
    plant = await plantService.verifyPlantAccess(
      plantUUID,
      user.uuid,
      user.role,
    );
  }

  // 3. Build engine inputs (plant data + weather)
  const plantInput = plant.getEnginePlantInput();
  console.log("Engine input for plant analysis:", plantInput);
  let weatherInput = null;
  let weatherWarning = null;
  const rawUser = await userRepo.findByUUID(user.uuid);
  const location = rawUser?.location;

  if (location) {
    try {
      weatherInput = await buildEngineWeather(location);
    } catch (error) {
      weatherWarning = `Weather data unavailable: ${error.message}`;
      console.warn(weatherWarning);
    }
  }

  // 4. Run engine evaluation
  const engineResult = evaluate({ weather: weatherInput, ...plantInput });

  if (weatherWarning) {
    engineResult._weatherWarning = weatherWarning;
  }

  // 5. Save care state from engine output
  const careState = await plantCareStateService.saveEngineOutput(
    plantUUID,
    engineResult,
  );

  // 6. Generate tasks if none exist
  if (!careState.activeTasks?.length) {
    await plantTaskCareManager.generateTasksFromStatus(plantUUID, user);
    const updated = await plantCareStateService.getByPlantUUID(plantUUID);
    if (updated) careState.activeTasks = updated.activeTasks;
  }

  // 7. Log analysis and return result
  const {
    waterScore,
    fertilizerScore,
    pestRiskScore,
    lightScore,
    _weatherWarning: ww,
  } = engineResult;
  const metadata = {
    scores: { waterScore, fertilizerScore, pestRiskScore, lightScore },
  };
  if (ww) metadata.weatherWarning = ww;

  await plantCareActionLogger.logPlantAnalysis(
    plantUUID,
    user.uuid,
    rawUser.internalId,
    plant.internalId,
    "Plant analysis completed",
    metadata,
  );

  return {
    status: careState.status,
    activeTasks: careState.activeTasks || [],
    scores: { waterScore, fertilizerScore, pestRiskScore, lightScore },
    _weatherWarning: ww,
  };
}
