import { fillPrompt } from "./llm.service.js";

/**
 * @description Extracts structured plant data from images using an LLM
 * vision model. Downloads the image from S3, sends it to Gemini with a
 * data-extraction prompt, and returns the parsed result. No side effects
 * on plant documents — callers are responsible for persisting.
 */
export default class PlantVisionService {
  constructor(s3CloudService, llmService) {
    this.s3CloudService = s3CloudService;
    this.llmService = llmService;
  }

  /**
   * @private
   * @description Maps a file extension from an S3 key to its MIME type.
   * Defaults to image/jpeg if the extension is unknown.
   * @param {string} key - S3 object key
   * @returns {string} MIME type string
   */
  #mimeFromKey(key) {
    const ext = key.split(".").pop()?.toLowerCase();
    const map = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
    };
    return map[ext] || "image/jpeg";
  }

  /**
   * @description Downloads the image from S3, sends it to the LLM for
   * plant data extraction, and returns the parsed result. Pure extraction
   * with no database side effects.
   * @param {string} s3Key - S3 key of the uploaded image
   * @returns {Promise<Object>} Parsed plant data from the LLM
   */
  async extractImageData(s3Key) {
    try {
      const buffer = await this.s3CloudService.getObjectBuffer(s3Key);
      const base64 = buffer.toString("base64");
      const mimeType = this.#mimeFromKey(s3Key);

      const prompt = fillPrompt("EXTRACT_PLANT_DATA");
      const response = await this.llmService.generateResponseWithImage(
        prompt,
        base64,
        mimeType,
      );

      return typeof response === "object" && response !== null
        ? response
        : JSON.parse(response);
    } catch (error) {
      console.error("Image extraction failed:", error?.message || "unknown");
      throw error;
    }
  }
}
