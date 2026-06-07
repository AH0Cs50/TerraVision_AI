import axios from "axios";
import { WEATHER_API_KEY } from "../config/config.js";

export default class WeatherService {
  static BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

  // =========================
  // Public Entry Point
  // =========================
  async getWeather(location) {
    const request = this.resolveLocation(location);
    const rawData = await this.fetchWeather(request);
    return WeatherService.transform(rawData);
  }

  // =========================
  // Resolve Location Strategy
  // =========================
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

  // =========================
  // API Dispatcher
  // =========================
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

  // =========================
  // City API Call
  // =========================
  static async fetchByCity(city) {
    const response = await axios.get(this.BASE_URL, {
      params: {
        q: city.trim(),
        appid: WEATHER_API_KEY,
      },
    });

    return response.data;
  }

  // =========================
  // Coordinates API Call
  // =========================
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

  // =========================
  // Helpers
  // =========================
  static kelvinToCelsius(k) {
    return k != null ? +(k - 273.15).toFixed(2) : null;
  }

  // =========================
  // Transformer (Normalize API Response)
  // =========================
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

export class WeatherDescriber {
  // Takes already-transformed weather (output of WeatherService.getWeather())
  // and adds human-readable category classifications.
  weatherDescribe(transformed) {
    const temp = transformed.temperature;
    const humidity = transformed.humidity;
    const visibility = transformed.visibility;
    const wind = transformed.wind;
    const icon = transformed.weather?.icon;

    const tempCategory =
      temp.current >= 35 ? "extreme_heat"
        : temp.current >= 30 ? "hot"
          : temp.current >= 20 ? "warm"
            : temp.current >= 10 ? "cool"
              : temp.current >= 5 ? "cold"
                : "freezing";

    const humidityCategory =
      humidity >= 80 ? "very_humid"
        : humidity >= 60 ? "humid"
          : humidity >= 40 ? "moderate"
            : "dry";

    const visibilityCategory =
      visibility >= 10000 ? "excellent"
        : visibility >= 5000 ? "good"
          : visibility >= 1000 ? "poor"
            : "very_poor";

    const windCategory =
      wind.speed >= 10 ? "strong"
        : wind.speed >= 5 ? "moderate"
          : "light";

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

  // this function take the raw weather api response and change some unclear fields to clear text value based on API DOCS
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
  // predict the light condition based on the weather api response and the rules defined in the engine and return the light condition as string ( intense , full_sun , partial , indirect , shade )
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
  // get the weather description for the engine based on the rules defined in the engine and return the weather description as object that contain the temperature , humidity , condition and light
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
