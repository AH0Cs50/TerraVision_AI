import { createRequire } from "module";
const require = createRequire(import.meta.url);

import { GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEY } from "../config/config.js";
import RouteError from "../shared/util/RouteError.js";
import HttpStatusCode from "../shared/util/HttpStatusCodes.js";

const prompts = require("../shared/prompt.json");

/**
 * @description Retrieves a prompt template from `prompt.json` by key and
 * replaces `{placeholder}` tokens with the provided params.
 * @param {string} key - Key in prompt.json
 * @param {Object} [params={}] - Values to interpolate into the template
 * @returns {string} Filled prompt string
 * @throws {Error} If the prompt key is not found
 */
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

/**
 * @description Wraps the Google GenAI SDK to provide text-only and
 * text-with-image generation via Gemini models. Handles prompt construction,
 * response parsing (JSON / plain text), and error wrapping.
 */
export default class LLMService {
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }

  /**
   * @private
   * @description Extracts text from a GenAI response and attempts to parse it
   * as JSON if the text starts with `{` or `[`.
   * @param {Object} response - Raw GenAI response object
   * @returns {Object|string} Parsed JSON object/array, or plain text
   * @throws {RouteError} If response text is empty
   */
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

  /**
   * @description Sends a text-only prompt to the Gemini model and returns
   * the parsed response.
   * @param {string|{contents: Array}} prompt - Plain text or structured
   * contents object for the model
   * @returns {Promise<Object|string>} Parsed response
   * @throws {RouteError} If the LLM call fails
   */
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

  /**
   * @description Sends a prompt paired with a base64-encoded image to the
   * Gemini model. Useful for vision tasks like plant identification.
   * @param {string} prompt - Text instruction for the model
   * @param {string} imageBase64 - Base64-encoded image data
   * @param {string} mimeType - MIME type of the image (e.g. image/jpeg)
   * @returns {Promise<Object|string>} Parsed response
   * @throws {RouteError} If the LLM call fails
   */
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
