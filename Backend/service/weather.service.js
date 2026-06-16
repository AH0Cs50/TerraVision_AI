import axios from "axios";
import { WEATHER_API_KEY } from "../config/config.js";

/**
 * @description Fetches live weather data from the OpenWeatherMap API.
 * Supports city name and geographic coordinates as location inputs.
 * Transforms the raw API response into a structured, client-friendly format
 * with temperatures converted from Kelvin to Celsius.
 */
export default class WeatherService {
  static BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

  /**
   * @description Public entry point. Resolves the location, fetches raw
   * weather data, and transforms it into a normalised format.
   * @param {Object} location - Location object with `city` or `coordinates`
   * @returns {Promise<Object>} Transformed weather data
   */
  async getWeather(location) {
    const request = this.resolveLocation(location);
    try {
      const rawData = await this.fetchWeather(request);
      return WeatherService.transform(rawData);
    } catch (error) {
      console.error("Weather API call failed:", error.message);
      throw error;
    }
  }

  /**
   * @description Determines whether to query by city name or coordinates
   * based on the input shape.
   * @param {Object} location - Location input
   * @returns {{type: string, value: string|{lat: number, lon: number}}}
   * @throws {Error} If neither city nor coordinates are provided
   */
  resolveLocation(location) {
    if (!location || typeof location !== "object") {
      throw new Error("Location must be an object");
    }

    const { city, coordinates } = location;

    if (city) {
      return { type: "city", value: city };
    }

    if (coordinates) {
      return { type: "coordinates", value: coordinates };
    }

    throw new Error("Location must contain city or coordinates");
  }

  /**
   * @description Dispatches the weather API request based on the resolved
   * location type.
   * @param {{type: string, value: *}} request - Resolved location request
   * @returns {Promise<Object>} Raw API response
   */
  async fetchWeather(request) {
    switch (request.type) {
      case "city":
        return WeatherService.fetchByCity(request.value);

      case "coordinates":
        return WeatherService.fetchByCoordinates(request.value);

      default:
        throw new Error("Invalid request type");
    }
  }

  /**
   * @description Fetches weather data for a given city name.
   * @param {string} city - City name
   * @returns {Promise<Object>} Raw API response
   */
  static async fetchByCity(city) {
    const response = await axios.get(this.BASE_URL, {
      params: {
        q: city.trim(),
        appid: WEATHER_API_KEY,
      },
    });

    return response.data;
  }

  /**
   * @description Fetches weather data for a set of geographic coordinates.
   * @param {{lat: number, lon: number}} coordinates - Latitude and longitude
   * @returns {Promise<Object>} Raw API response
   * @throws {Error} If coordinates are invalid
   */
  static async fetchByCoordinates(coordinates) {
    const { lat, lon } = coordinates;

    const parsedLat = Number(lat);
    const parsedLon = Number(lon);

    if (Number.isNaN(parsedLat) || Number.isNaN(parsedLon)) {
      throw new Error("Invalid coordinates");
    }

    const response = await axios.get(this.BASE_URL, {
      params: {
        lat: parsedLat,
        lon: parsedLon,
        appid: WEATHER_API_KEY,
      },
    });

    return response.data;
  }

  /**
   * @description Converts a temperature from Kelvin to Celsius, rounded
   * to two decimal places.
   * @param {number|null} k - Temperature in Kelvin
   * @returns {number|null} Temperature in Celsius, or null
   */
  static kelvinToCelsius(k) {
    return k != null ? +(k - 273.15).toFixed(2) : null;
  }

  /**
   * @description Transforms the raw OpenWeatherMap API response into a
   * normalised structure with location, weather, temperature (in °C),
   * humidity, pressure, wind, clouds, and visibility fields.
   * @param {Object} data - Raw API response
   * @returns {Object} Normalised weather object
   */
  static transform(data) {
    return {
      location: {
        name: data.name,
        country: data.sys?.country,
        coordinates: {
          lat: data.coord?.lat,
          lon: data.coord?.lon,
        },
      },

      weather: {
        main: data.weather?.[0]?.main,
        description: data.weather?.[0]?.description,
        icon: data.weather?.[0]?.icon,
      },

      temperature: {
        current: this.kelvinToCelsius(data.main?.temp),
        feelsLike: this.kelvinToCelsius(data.main?.feels_like),
        min: this.kelvinToCelsius(data.main?.temp_min),
        max: this.kelvinToCelsius(data.main?.temp_max),
      },

      humidity: data.main?.humidity,
      pressure: data.main?.pressure,

      wind: {
        speed: data.wind?.speed,
        deg: data.wind?.deg,
      },

      clouds: data.clouds?.all,

      visibility: data.visibility,

      timestamp: data.dt,
    };
  }
}

/**
 * @description Adds human-readable category classifications to already-
 * transformed weather data. Provides temperature, humidity, visibility,
 * and wind categories, plus light condition prediction and engine-friendly
 * output formatting.
 */
export class WeatherDescriber {
  /**
   * @description Adds categorical labels (e.g. hot, dry, excellent) to
   * the numeric fields of previously transformed weather data.
   * @param {Object} transformed - Output from WeatherService.transform()
   * @returns {Object} Weather data with added category fields
   */
  weatherDescribe(transformed) {
    const temp = transformed.temperature;
    const humidity = transformed.humidity;
    const visibility = transformed.visibility;
    const wind = transformed.wind;
    const icon = transformed.weather?.icon;

    const tempCategory =
      temp.current >= 35
        ? "extreme_heat"
        : temp.current >= 30
          ? "hot"
          : temp.current >= 20
            ? "warm"
            : temp.current >= 10
              ? "cool"
              : temp.current >= 5
                ? "cold"
                : "freezing";

    const humidityCategory =
      humidity >= 80
        ? "very_humid"
        : humidity >= 60
          ? "humid"
          : humidity >= 40
            ? "moderate"
            : "dry";

    const visibilityCategory =
      visibility >= 10000
        ? "excellent"
        : visibility >= 5000
          ? "good"
          : visibility >= 1000
            ? "poor"
            : "very_poor";

    const windCategory =
      wind.speed >= 10 ? "strong" : wind.speed >= 5 ? "moderate" : "light";

    return {
      location: transformed.location,
      weather: {
        main: transformed.weather.main,
        description: transformed.weather.description,
        icon,
        isDay: icon?.endsWith("d"),
      },
      temperature: { ...temp, category: tempCategory },
      humidity: { value: humidity, category: humidityCategory },
      pressure: transformed.pressure,
      visibility: { value: visibility, category: visibilityCategory },
      wind: { ...wind, category: windCategory },
      clouds: transformed.clouds,
      timestamp: transformed.timestamp,
    };
  }

  /**
   * @description Takes the raw OpenWeatherMap API response, transforms it,
   * and adds descriptive categories. Also resolves the weather condition
   * ID group (e.g. Thunderstorm, Rain, Clear).
   * @param {Object} weatherResponse - Raw API response
   * @returns {Promise<Object>} Fully described weather object
   */
  async weatherApiDescribe(weatherResponse) {
    const normalized = WeatherService.transform(weatherResponse);

    const id = weatherResponse.weather?.[0]?.id;
    const main = normalized.weather.main;
    const icon = normalized.weather.icon;
    const clouds = normalized.clouds;

    let idGroup = "Unknown";
    if (id >= 200 && id <= 232) idGroup = "Thunderstorm";
    else if (id >= 300 && id <= 321) idGroup = "Drizzle";
    else if (id >= 500 && id <= 531) idGroup = "Rain";
    else if (id >= 600 && id <= 622) idGroup = "Snow";
    else if (id >= 701 && id <= 781) idGroup = "Atmosphere";
    else if (id === 800) idGroup = "Clear";
    else if (id >= 801 && id <= 804) idGroup = "Clouds";

    const isDay = icon?.endsWith("d");

    const tempCategory =
      normalized.temperature.current >= 35
        ? "extreme_heat"
        : normalized.temperature.current >= 30
          ? "hot"
          : normalized.temperature.current >= 20
            ? "warm"
            : normalized.temperature.current >= 10
              ? "cool"
              : normalized.temperature.current >= 5
                ? "cold"
                : "freezing";

    const humidityCategory =
      normalized.humidity >= 80
        ? "very_humid"
        : normalized.humidity >= 60
          ? "humid"
          : normalized.humidity >= 40
            ? "moderate"
            : "dry";

    const visibilityCategory =
      normalized.visibility >= 10000
        ? "excellent"
        : normalized.visibility >= 5000
          ? "good"
          : normalized.visibility >= 1000
            ? "poor"
            : "very_poor";

    const windCategory =
      normalized.wind.speed >= 10
        ? "strong"
        : normalized.wind.speed >= 5
          ? "moderate"
          : "light";

    return {
      location: normalized.location,
      weather: {
        main,
        idGroup,
        description: normalized.weather.description,
        icon,
        isDay,
      },
      temperature: {
        ...normalized.temperature,
        category: tempCategory,
      },
      humidity: {
        value: normalized.humidity,
        category: humidityCategory,
      },
      pressure: normalized.pressure,
      visibility: {
        value: normalized.visibility,
        category: visibilityCategory,
      },
      wind: {
        ...normalized.wind,
        category: windCategory,
      },
      clouds,
      timestamp: normalized.timestamp,
    };
  }
  /**
   * @description Predicts the light condition from the raw API response.
   * Returns one of: intense, full_sun, partial, indirect, shade.
   * Based on cloud cover percentage, weather main category, and day/night.
   * @param {Object} weatherResponse - Raw API response
   * @returns {Promise<string>} Light condition label
   */
  async weatherLightDescribe(weatherResponse) {
    const clouds = weatherResponse.clouds?.all;
    const icon = weatherResponse.weather?.[0]?.icon;
    const main = weatherResponse.weather?.[0]?.main;
    const isDay = icon?.endsWith("d");

    if (!isDay) return "indirect";

    if (main === "Thunderstorm" || main === "Rain" || main === "Drizzle") {
      return "shade";
    }

    if (clouds == null) {
      if (main === "Clear") return "full_sun";
      if (main === "Clouds") return "partial";
      return "indirect";
    }

    if (clouds < 10) return "intense";
    if (clouds < 20) return "full_sun";
    if (clouds < 50) return "partial";
    if (clouds < 80) return "indirect";
    return "shade";
  }
  /**
   * @description Produces a flat weather object in the format expected by
   * the rule-based analysis engine. Includes temperature, humidity,
   * condition, light, and windSpeed.
   * @param {Object} weatherDescription - Output from weatherDescribe()
   * @returns {Promise<{temperature: number, humidity: number, condition: string, light: string, windSpeed: number}>}
   */
  async weatherDescribeForEngine(weatherDescription) {
    const conditionMap = {
      Thunderstorm: "storm",
      Drizzle: "rainy",
      Rain: "rainy",
      Snow: "cloudy",
      Clear: "sunny",
      Clouds: "cloudy",
      Mist: "cloudy",
      Smoke: "cloudy",
      Haze: "cloudy",
      Dust: "cloudy",
      Fog: "cloudy",
      Sand: "cloudy",
      Ash: "cloudy",
      Squall: "storm",
      Tornado: "storm",
      Atmosphere: "cloudy",
    };

    const condition = conditionMap[weatherDescription.weather.main] || "cloudy";

    let light = weatherDescription.light;
    if (!light) {
      const clouds = weatherDescription.clouds;
      const isDay = weatherDescription.weather.isDay;
      if (!isDay) {
        light = "indirect";
      } else if (clouds < 10) {
        light = "intense";
      } else if (clouds < 20) {
        light = "full_sun";
      } else if (clouds < 50) {
        light = "partial";
      } else if (clouds < 80) {
        light = "indirect";
      } else {
        light = "shade";
      }
    }

    return {
      temperature: weatherDescription.temperature.current,
      humidity: weatherDescription.humidity.value,
      condition,
      light,
      windSpeed: weatherDescription.wind?.speed,
    };
  }
}
