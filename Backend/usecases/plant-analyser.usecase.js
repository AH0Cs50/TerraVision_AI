import RouteError from "../shared/util/RouteError.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";
import { evaluate } from "../service/engine/index.js";
import {
  userRepo,
  weatherService,
  weatherDescriber,
  plantService,
  plantCareStateService,
  plantCareActionLogger,
} from "../shared/container.js";

async function buildEngineWeather(location) {
  const transformed = await weatherService.getWeather(location);
  const described = weatherDescriber.weatherDescribe(transformed);
  return weatherDescriber.weatherDescribeForEngine(described);
}

export async function analyzeAndSavePlant(plantUUID, user) {
  const plant = await plantService.verifyPlantAccess(
    plantUUID,
    user.uuid,
    user.role,
  );
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
      console.warn(weatherWarning);
    }
  }

  const engineResult = evaluate({ weather: weatherInput, ...plantInput });

  if (weatherWarning) {
    engineResult._weatherWarning = weatherWarning;
  }

  const careState = await plantCareStateService.saveEngineOutput(
    plantUUID,
    engineResult,
  );

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
