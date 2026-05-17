import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

import { s3Config } from "../config/config.js";

class S3CloudService {
  constructor(S3Repository) {
    this.s3Repo = S3Repository;
  }

  // =========================================
  // Validate Image MIME Type
  // =========================================
  validateImageMimeType(fileType) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    return allowedTypes.includes(fileType);
  }

  // =========================================
  // Build Plant Image Path
  // =========================================
  buildPlantImagePath({ userId, plantId, fileName }) {
    const safeName = fileName.replace(/\s+/g, "-").toLowerCase();

    return `plant/user_${userId}_plant_${plantId}/images/${Date.now()}-${safeName}`;
  }

  // =========================================
  // Validate Plant Image Key
  // =========================================
  validatePlantImageKey(key) {
    if (!key || typeof key !== "string") {
      return false;
    }

    /**
     * Expected format:
     * plant/user_<userId>_plant_<plantId>/images/<timestamp>-filename.ext
     */
    const keyPattern =
      /^plant\/user_[a-zA-Z0-9_-]+_plant_[a-zA-Z0-9_-]+\/images\/\d+-[a-zA-Z0-9._-]+$/;

    return keyPattern.test(key);
  }

  // =========================================
  // Generate Upload URL
  // =========================================
  async generateUploadUrl({ userId, plantId, fileName, fileType }) {
    if (!this.validateImageMimeType(fileType)) {
      throw new Error("INVALID_FILE_TYPE");
    }

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

    const uploadUrl = await getSignedUrl(this.s3Repo.s3Client, command, {
      expiresIn: s3Config.signedUrlExpiresIn,
    });

    return {
      uploadUrl,
      key,
      expiresIn: s3Config.signedUrlExpiresIn,
    };
  }

  // =========================================
  // Get Signed GET URL
  // =========================================
  async generateGetUrl(key) {
    const command = new GetObjectCommand({
      Bucket: s3Config.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Repo.s3Client, command, {
      expiresIn: s3Config.signedUrlExpiresIn,
    });
  }

  // =========================================
  // Delete File (via repository)
  // =========================================
  async deleteFile(key) {
    return await this.s3Repo.delete(key);
  }
}

export default S3CloudService;
