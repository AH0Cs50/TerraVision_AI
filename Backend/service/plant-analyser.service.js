import { evaluate } from "./engine/index.js";

export default class PlantAnalyserService {
  constructor(weatherService, weatherDescriber, plantService, userService) {
    this.weatherService = weatherService;
    this.weatherDescriber = weatherDescriber;
    this.plantService = plantService;
    this.userService = userService;
  }

  async #buildEngineWeather(location) {
    const transformed = await this.weatherService.getWeather(location);
    const described = this.weatherDescriber.weatherDescribe(transformed);
    return this.weatherDescriber.weatherDescribeForEngine(described);
  }

  async analyzePlant(plantUUID, userUUID) {
    const plantInput = await this.plantService.getEnginePlantInput(plantUUID);

    let weatherInput = null;
    try {
      const location = await this.userService.getUserLocation(userUUID);
      if (location) {
        weatherInput = await this.#buildEngineWeather(location);
      }
    } catch {
      // user has no saved location — skip weather
    }

    return evaluate({ weather: weatherInput, plant: plantInput });
  }
}
