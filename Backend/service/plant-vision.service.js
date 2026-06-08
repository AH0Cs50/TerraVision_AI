import RouteError from "../shared/util/RouteError.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";
import { fillPrompt } from "./llm.service.js";

/**
 * @description Extracts structured plant data from images using an LLM
 * vision model. Downloads the image from S3, sends it to Gemini with a
 * data-extraction prompt, and stores the resulting image reference.
 */
export default class PlantVisionService {
  constructor(plantService, s3CloudService, llmService) {
    this.plantService = plantService;
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
   * plant data extraction, and saves the image reference to the plant.
   * @param {string} plantUUID - UUID of the target plant
   * @param {string} s3Key - S3 key of the uploaded image
   * @returns {Promise<Object>} Parsed plant data from the LLM
   * @throws {RouteError} NOT_FOUND if plant does not exist
   */
  async extractPlantDataFromImage(plantUUID, s3Key) {
    const plant = await this.plantService.getPlantByUUID(plantUUID);
    if (!plant) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "Plant not found");
    }

    const buffer = await this.s3CloudService.getObjectBuffer(s3Key);
    const base64 = buffer.toString("base64");
    const mimeType = this.#mimeFromKey(s3Key);

    const prompt = fillPrompt("EXTRACT_PLANT_DATA");
    const response = await this.llmService.generateResponseWithImage(
      prompt,
      base64,
      mimeType,
    );

    await this.plantService.addImage(plantUUID, s3Key);

    return typeof response === "object" && response !== null
      ? response
      : JSON.parse(response);
  }
}
