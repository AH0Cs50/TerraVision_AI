import { createRequire } from "module";
const require = createRequire(import.meta.url);

import { GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEY } from "../config/config.js";
import RouteError from "../shared/util/RouteError.js";
import HttpStatusCode from "../shared/util/HttpStatusCodes.js";

const prompts = require("../shared/prompt.json");

export function fillPrompt(key, params = {}) {
  const template = prompts[key];
  if (!template) {
    throw new Error(`Prompt key "${key}" not found in prompt.json`);
  }
  return template.replace(/\{(\w+)\}/g, (_, name) => {
    const value = params[name];
    return value !== undefined && value !== null ? String(value) : _.toString();
  });
}

const MODEL = "gemini-2.5-flash";

export default class LLMService {
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }

  #processResponse(response) {
    const text = response?.text;
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
      const contents =
        typeof prompt === "object" && prompt.contents
          ? prompt.contents
          : prompt;

      const response = await this.ai.models.generateContent({
        model: MODEL,
        contents,
      });

      return this.#processResponse(response);
    } catch (error) {
      if (error instanceof RouteError) throw error;

      throw new RouteError(
        HttpStatusCode.InternalServerError,
        "Failed to generate response from LLM service",
        error.message,
      );
    }
  }

  async generateResponseWithImage(prompt, imageBase64, mimeType) {
    try {
      const response = await this.ai.models.generateContent({
        model: MODEL,
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: imageBase64 } },
            ],
          },
        ],
      });

      return this.#processResponse(response);
    } catch (error) {
      if (error instanceof RouteError) throw error;

      throw new RouteError(
        HttpStatusCode.InternalServerError,
        "Failed to generate response from LLM with image",
        error.message,
      );
    }
  }
}
