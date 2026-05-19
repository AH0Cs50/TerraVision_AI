export default class PlantAnalyserService {
  constructor(
    UserService,
    WeatherService,
    WeatherDescribe,
    PlantService,
    Engine,
  ) {
    this.UserService = UserService;
    this.WeatherService = WeatherService;
    this.WeatherDescribe = WeatherDescribe;
    this.PlantService = PlantService;
    this.Engine = Engine;
  }

  async #getEngineWeatherInput(userUUID) {
    const location = await this.UserService.getUserLocation(userUUID);
    const weatherResponse = await this.WeatherService.getWeather(location);
    const description =
      await this.WeatherDescribe.weatherDescribe(weatherResponse);
    description.light =
      await this.WeatherService.weatherLightDescribe(weatherResponse);
    return await this.WeatherDescribe.weatherDescribeForEngine(description);
  }

  async analyzePlant(plantUUID, userUUID) {
    const plantInput = await this.PlantService.getEnginePlantInput(plantUUID);
    const weatherInput = await this.#getEngineWeatherInput(userUUID);
    const EngineInput = {
      weather: weatherInput,
      plant: plantInput,
    };
    const engineOutput = await this.Engine.evaluate(EngineInput);

    return engineOutput;
  }
}
