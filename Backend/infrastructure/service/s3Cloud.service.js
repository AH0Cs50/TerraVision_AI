import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

import { s3Config } from "../../config/config.js";
import RouteError from "../../shared/util/RouteError.js";
import HttpStatusCodes from "../../shared/util/HttpStatusCodes.js";

/**
 * @description Provides S3 operations for image upload, download, and
 * deletion. Generates pre-signed URLs for direct PUT uploads, validates
 * image keys and MIME types, and supports both plant-specific and
 * general-purpose image paths.
 */
class S3CloudService {
  /**
   * @param {Object} S3Repository - S3 repository instance for low-level ops
   */
  constructor(S3Repository) {
    this.s3Repo = S3Repository;
  }

  /**
   * @description Checks that the provided MIME type is one of the allowed
   * image types (jpeg, png, webp).
   * @param {string} fileType - MIME type string
   * @returns {boolean} True if the type is allowed
   */
  validateImageMimeType(fileType) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    return allowedTypes.includes(fileType);
  }

  /**
   * @description Constructs an S3 key for a plant image with the format
   * `plants/{userId}/{plantId}/images/{timestamp}-{safeName}`.
   * @param {Object} params
   * @param {string} params.userId - User UUID
   * @param {string} params.plantId - Plant UUID
   * @param {string} params.fileName - Original file name (sanitised)
   * @returns {string} S3 object key
   */
  buildPlantImagePath({ userId, plantId, fileName }) {
    const safeName = fileName
      .replace(/[^a-zA-Z0-9.-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();

    return `plants/${userId}/${plantId}/images/${Date.now()}-${safeName}`;
  }

  /**
   * @description Validates that a plant image key matches the expected
   * pattern for plant-scoped images and optionally verifies the embedded
   * plant UUID matches the expected plant.
   * @param {string} key - S3 object key to validate
   * @param {string} [expectedPlantUUID] - Expected plant UUID embedded in key
   * @returns {boolean} True if the key format is valid and UUID matches
   */
  validatePlantImageKey(key, expectedPlantUUID) {
    if (!key || typeof key !== "string") {
      return false;
    }

    const keyPattern =
      /^plants\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+\/images\/\d+-[a-zA-Z0-9._-]+$/;

    if (!keyPattern.test(key)) return false;

    if (expectedPlantUUID) {
      const keyPlantUUID = key.split("/")[2];
      return keyPlantUUID === expectedPlantUUID;
    }

    return true;
  }

  /**
   * Validates that a user image key matches the expected pattern for
   * user-scoped images (`users/{userId}/images/{timestamp}-{safeName}`).
   * @param {string} key - S3 object key to validate
   * @returns {boolean} True if the key format is valid
   */
  validateUserImageKey(key) {
    if (!key || typeof key !== "string") {
      return false;
    }

    const keyPattern =
      /^users\/[a-zA-Z0-9-]+\/images\/\d+-[a-zA-Z0-9._-]+$/;

    return keyPattern.test(key);
  }

  /**
   * @description Constructs an S3 key for a user-scoped (pre-plant) image
   * with the format `users/{userId}/images/{timestamp}-{safeName}`.
   * @param {Object} params
   * @param {string} params.userId - User UUID
   * @param {string} params.fileName - Original file name (sanitised)
   * @returns {string} S3 object key
   */
  buildUserImagePath({ userId, fileName }) {
    const safeName = fileName
      .replace(/[^a-zA-Z0-9.-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();
    return `users/${userId}/images/${Date.now()}-${safeName}`;
  }

  /**
   * @private
   * @description Throws a RouteError if the MIME type is not allowed.
   * @param {string} fileType - MIME type to validate
   * @throws {RouteError} BAD_REQUEST if type is invalid
   */
  #throwIfInvalidMime(fileType) {
    if (!this.validateImageMimeType(fileType)) {
      throw new RouteError(HttpStatusCodes.BAD_REQUEST, "INVALID_FILE_TYPE");
    }
  }

  /**
   * @private
   * @description Verifies S3 connectivity before an operation. Throws
   * RouteError(SERVICE_UNAVAILABLE) if the S3 bucket is unreachable.
   * @throws {RouteError} SERVICE_UNAVAILABLE if S3 is not reachable
   */
  async ensureConnected() {
    try {
      await this.s3Repo.healthCheck();
    } catch {
      throw new RouteError(
        HttpStatusCodes.SERVICE_UNAVAILABLE,
        "S3 storage service is unavailable",
      );
    }
  }

  /**
   * @description Generates a pre-signed PUT URL for uploading a plant image
   * directly to S3. Validates the MIME type before generating the URL.
   * @param {Object} params
   * @param {string} params.userId - User UUID
   * @param {string} params.plantId - Plant UUID
   * @param {string} params.fileName - Original file name
   * @param {string} params.fileType - MIME type of the file
   * @returns {Promise<{uploadUrl: string, key: string, expiresIn: number}>}
   * @throws {RouteError} BAD_REQUEST if MIME type is invalid
   */
  async generateUploadUrl({ userId, plantId, fileName, fileType }) {
    await this.ensureConnected();
    this.#throwIfInvalidMime(fileType);

    const key = this.buildPlantImagePath({
      userId,
      plantId,
      fileName,
    });

    const command = new PutObjectCommand({
      Bucket: s3Config.bucketName,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(this.s3Repo.getS3Client(), command, {
      expiresIn: s3Config.signedUrlExpiresIn,
    });

    return {
      uploadUrl,
      key,
      expiresIn: s3Config.signedUrlExpiresIn,
    };
  }

  /**
   * @description Generates a pre-signed PUT URL for uploading a user-scoped
   * (pre-plant) image directly to S3.
   * @param {Object} params
   * @param {string} params.userId - User UUID
   * @param {string} params.fileName - Original file name
   * @param {string} params.fileType - MIME type of the file
   * @returns {Promise<{uploadUrl: string, key: string, expiresIn: number}>}
   * @throws {RouteError} BAD_REQUEST if MIME type is invalid
   */
  async generateUserUploadUrl({ userId, fileName, fileType }) {
    await this.ensureConnected();
    this.#throwIfInvalidMime(fileType);

    const key = this.buildUserImagePath({ userId, fileName });

    const command = new PutObjectCommand({
      Bucket: s3Config.bucketName,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(this.s3Repo.getS3Client(), command, {
      expiresIn: s3Config.signedUrlExpiresIn,
    });

    return {
      uploadUrl,
      key,
      expiresIn: s3Config.signedUrlExpiresIn,
    };
  }

  /**
   * @description Generates a pre-signed GET URL for reading an S3 object.
   * @param {string} key - S3 object key
   * @returns {Promise<string>} Pre-signed download URL
   */
  async generateGetUrl(key) {
    await this.ensureConnected();
    const command = new GetObjectCommand({
      Bucket: s3Config.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Repo.getS3Client(), command, {
      expiresIn: s3Config.signedUrlExpiresIn,
    });
  }

  /**
   * @description Retrieves an S3 object and returns its contents as a Buffer.
   * @param {string} key - S3 object key
   * @returns {Promise<Buffer>} Object content as a buffer
   */
  async getObjectBuffer(key) {
    await this.ensureConnected();
    const { Body } = await this.s3Repo.get(key);
    const chunks = [];
    for await (const chunk of Body) {
      chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  /**
   * @description Deletes an S3 object by key. Failures are logged but
   * not thrown (non-fatal).
   * @param {string} key - S3 object key to delete
   * @returns {Promise<void>}
   */
  async deleteFile(key) {
    await this.ensureConnected();
    try {
      return await this.s3Repo.delete(key);
    } catch (error) {
      console.error("S3 delete failed (non-fatal):", error.message);
    }
  }
}

export default S3CloudService;
