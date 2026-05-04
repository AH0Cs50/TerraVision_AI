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
    return this.transform(rawData);
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
        return this.fetchByCity(request.value);

      case "coordinates":
        return this.fetchByCoordinates(request.value);

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

  // =========================
  // Helpers
  // =========================
  static kelvinToCelsius(k) {
    if (k == null) return null;
    return +(k - 273.15).toFixed(2);
  }
}