import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";

import s3Client from "../shared/s3Client.cloud.js";

import { s3Config } from "../config/config.js";

/**
 * @description Low-level data access layer for AWS S3 operations. Wraps
 * the @aws-sdk/client-s3 commands (Put, Get, Delete, List) for use by
 * the S3CloudService.
 */
class S3Repository {
  constructor() {
    this.s3Client = s3Client;
  }

  /**
   * @description Uploads an object to S3 with the given key, body, and
   * content type.
   * @param {Object} params
   * @param {string} params.key - S3 object key
   * @param {Buffer|string} params.body - Object content
   * @param {string} params.contentType - MIME type of the content
   * @returns {Promise<{key: string}>}
   */
  async upload({ key, body, contentType }) {
    const command = new PutObjectCommand({
      Bucket: s3Config.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await this.s3Client.send(command);

    return { key };
  }

  /**
   * @description Retrieves an object from S3 by key.
   * @param {string} key - S3 object key
   * @returns {Promise<Object>} S3 GetObjectCommand output (includes Body stream)
   */
  async get(key) {
    const command = new GetObjectCommand({
      Bucket: s3Config.bucketName,
      Key: key,
    });

    return await this.s3Client.send(command);
  }

  /**
   * @description Deletes an object from S3 by key.
   * @param {string} key - S3 object key
   * @returns {Promise<Object>} S3 DeleteObjectCommand output
   */
  async delete(key) {
    const command = new DeleteObjectCommand({
      Bucket: s3Config.bucketName,
      Key: key,
    });

    return await this.s3Client.send(command);
  }

  /**
   * @description Verifies the S3 bucket is reachable. Throws on connectivity failure.
   * @returns {Promise<void>}
   */
  async healthCheck() {
    const command = new HeadBucketCommand({
      Bucket: s3Config.bucketName,
    });

    await this.s3Client.send(command);
  }

  /**
   * @description Returns the underlying S3 client instance for use with
   * pre-signed URL generation.
   * @returns {import("@aws-sdk/client-s3").S3Client}
   */
  getS3Client() {
    return this.s3Client;
  }

  /**
   * @description Lists S3 objects under a given key prefix.
   * @param {string} [prefix=""] - Key prefix to filter by
   * @returns {Promise<Array>} Array of S3 object metadata
   */
  async list(prefix = "") {
    const command = new ListObjectsV2Command({
      Bucket: s3Config.bucketName,
      Prefix: prefix,
    });

    const result = await this.s3Client.send(command);
    return result.Contents ?? [];
  }
}

export default S3Repository;
