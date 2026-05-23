import axios from "axios";
import { LLM_SERVICE_URL, ApiKey } from "../config/config.js";
import RouteError from "../shared/util/RouteError.js";
import { HttpStatusCode } from "axios";

export default class LLMService {
  constructor() {
    this.httpClient = axios.create({
      baseURL: LLM_SERVICE_URL,
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": ApiKey,
      },
    });
  }

  async #responseHandler(response) {
    if (!response || !response.candidates || !response.candidates.length) {
      throw new RouteError(
        HttpStatusCode.InternalServerError,
        "Invalid LLM response: no candidates",
      );
    }

    const parts = response.candidates[0]?.content?.parts;
    if (!parts || !parts.length) {
      throw new RouteError(
        HttpStatusCode.InternalServerError,
        "Invalid LLM response: no content parts",
      );
    }

    let text = parts
      .map((p) => p.text || "")
      .join("")
      .trim();
    if (!text) {
      throw new RouteError(
        HttpStatusCode.InternalServerError,
        "Invalid LLM response: empty text",
      );
    }

    if (text.startsWith("{") || text.startsWith("[")) {
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }

    return text;
  }

  async generateResponse(prompt) {
    try {
      const response = await this.httpClient.post("/", { prompt });

      if (response.status < 200 || response.status >= 300) {
        throw new RouteError(
          response.status,
          `LLM API error: ${response.statusText}`,
        );
      }

      return await this.#responseHandler(response.data);
    } catch (error) {
      if (error instanceof RouteError) throw error;

      throw new RouteError(
        HttpStatusCode.InternalServerError,
        "Failed to generate response from LLM service",
        error.message,
      );
    }
  }
}
