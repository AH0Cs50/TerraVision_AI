import { evaluate } from "./engine/index.js";

/**
 * @description Coordinates full plant analysis by combining plant profile
 * data with current weather conditions, then running the rule-based engine
 * to produce water, nutrient, pest-risk, and light scores.
 */
export default class PlantAnalyserService {
  constructor(weatherService, weatherDescriber, plantService, userService) {
    this.weatherService = weatherService;
    this.weatherDescriber = weatherDescriber;
    this.plantService = plantService;
    this.userService = userService;
  }

  /**
   * @private
   * @description Fetches live weather data for the given location and
   * transforms it into the flattened format expected by the analysis engine.
   * @param {Object} location - Location object (city or coordinates)
   * @returns {Promise<{temperature: number, humidity: number, condition: string, light: string, windSpeed: number}>}
   */
  async #buildEngineWeather(location) {
    const transformed = await this.weatherService.getWeather(location);
    const described = this.weatherDescriber.weatherDescribe(transformed);
    return this.weatherDescriber.weatherDescribeForEngine(described);
  }

  /*
  ## why when try to make analysis for this plant engine data 
  Plant input for engine: {
  plant: {
    category: 'crop',
    family: 'fruiting_nightshade',
    ageDays: 10,
    growthStage: 'flowering'
  },
  soil: { type: 'sandy',
   moisture: null (make this optional in engine) },
  watering: { hoursSinceLastWatering: 25 },
  stress: { diseaseType: undefined,
   severity: undefined (make this optional in engine)}
}
User location: { city: 'Cairo' }
Weather input for engine: {
  temperature: 35.23,
  humidity: 17,
  condition: 'sunny',
  light: 'intense'
}

i got response tell me the plant overwatered even last watering was 25 hours ago and soil is sandy , moisture is null (unknown) and weather is sunny and intense which should increase water demand not decrease it
  {"success":true,"message":"Plant analysis completed","data":{"_id":"6a21523659269f949cafbfd9","plantUUID":"89cdd4ec-3f9d-4e43-b7d0-e78bf8204fc7","status":{"water":"overwatered","nutrients":"low","health":"warning","light":"burn_risk"},"engineScores":{"waterScore":2,"fertilizerScore":1,"pestRiskScore":1,"lightScore":1.8199999999999998,"appliedRules":[{"id":"global_extreme_heat_water_demand","layer":"global","explainKey":"global_extreme_heat_water_demand"},{"id":"global_low_humidity_increased_transpiration","layer":"global","explainKey":"global_low_humidity_increased_transpiration"},{"id":"global_dry_heat_combined","layer":"global","explainKey":"global_dry_heat_combined"},{"id":"global_sunny_condition_evaporation","layer":"global","explainKey":"global_sunny_condition_evaporation"},{"id":"light_general_intense","layer":"light","explainKey":"light_general_intense"}]},"activeTasks":[],"completedTasks":[],"actionLogs":[{"logId":"1be8dc5c-df5d-4f03-b979-a04fda02e547","actionType":"disease_scan","description":"Plant analysis completed","metadata":{"method":"analyze","engineResult":{"waterScore":1,"fertilizerScore":1,"pestRiskScore":1,"lightScore":1,"_appliedRules":[]}},"createdAt":"2026-06-04T10:23:50.650Z"},{"logId":"1c3eac65-c63a-4c35-a6ac-c6196b416aac","actionType":"disease_scan","description":"Plant analysis completed","metadata":{"method":"analyze","engineResult":{"waterScore":1,"fertilizerScore":1,"pestRiskScore":1,"lightScore":1,"_appliedRules":[]}},"createdAt":"2026-06-04T10:31:31.777Z"},{"logId":"9b97aad9-2abd-46d0-a70a-6be94c8e5ff2","actionType":"disease_scan","description":"Plant analysis completed","metadata":{"method":"analyze","engineResult":{"waterScore":2,"fertilizerScore":1,"pestRiskScore":1,"lightScore":1.8199999999999998,"_appliedRules":[{"id":"global_extreme_heat_water_demand","layer":"global","explainKey":"global_extreme_heat_water_demand"},{"id":"global_low_humidity_increased_transpiration","layer":"global","explainKey":"global_low_humidity_increased_transpiration"},{"id":"global_dry_heat_combined","layer":"global","explainKey":"global_dry_heat_combined"},{"id":"global_sunny_condition_evaporation","layer":"global","explainKey":"global_sunny_condition_evaporation"},{"id":"light_general_intense","layer":"light","explainKey":"light_general_intense"}]}},"createdAt":"2026-06-04T10:36:52.093Z"}],"updatedAt":"2026-06-04T11:02:12.584Z","internalId":1780568630570,"uuid":"bd6a4104-32e1-4e6a-95f9-9c5aa13df15d","createdAt":"2026-06-04T10:23:50.574Z","__v":0},"status":200}

  */

  /**
   * @description Runs a complete plant analysis. Retrieves the plant's engine
   * input, fetches the user's weather if available, and evaluates all rules.
   * Weather is optional — analysis proceeds without it if location is missing.
   * @param {string} plantUUID - UUID of the plant to analyse
   * @param {string} userUUID - UUID of the plant owner
   * @returns {Promise<{waterScore: number, fertilizerScore: number, pestRiskScore: number, lightScore: number, appliedRules: Array}>}
   */
  async analyzePlant(plantUUID, userUUID) {
    const plantInput = await this.plantService.getEnginePlantInput(plantUUID);

    console.log("Plant input for engine:", plantInput);

    let weatherInput = null;
    try {
      const location = await this.userService.getUserLocation(userUUID);
      console.log("User location:", location);
      if (!location) {
        throw new Error("No location found for user");
      }
      weatherInput = await this.#buildEngineWeather(location);
      console.log("Weather input for engine:", weatherInput);
    } catch (error) {
      console.error("Error occurred while fetching user location:", error);
      // user has no saved location — skip weather
    }

    return evaluate({ weather: weatherInput, ...plantInput });
  }
}
