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

    let weatherInput = null;
    let weatherWarning = null;
    const location = await this.userService.getUserLocation(userUUID);

    if (location) {
      try {
        weatherInput = await this.#buildEngineWeather(location);
      } catch (error) {
        weatherWarning = `Weather data unavailable: ${error.message}`;
        console.warn(weatherWarning);
      }
    }

    const result = evaluate({ weather: weatherInput, ...plantInput });

    if (weatherWarning) {
      result._weatherWarning = weatherWarning;
    }

    return result;
  }
}
