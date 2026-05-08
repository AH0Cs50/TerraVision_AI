// repository/s3.repository.js

import {
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command
  } from "@aws-sdk/client-s3";
  
import s3Client from "../infrastructure/storage/s3.client.js";
  
import { s3Config } from "../config/s3.config.js";
  
class S3Repository {
  
    /**
     * Upload file
     */
    async upload({
      key,
      body,
      contentType
    }) {
  
      const command = new PutObjectCommand({
        Bucket: s3Config.bucketName,
  
        Key: key,
  
        Body: body,
  
        ContentType: contentType
      });
  
      await s3Client.send(command);
  
      return {
        key,
  
        bucket: s3Config.bucketName
      };
    }
  
    /**
     * Get file
     */
    async get(key) {
  
      const command = new GetObjectCommand({
        Bucket: s3Config.bucketName,
  
        Key: key
      });
  
      return await s3Client.send(command);
    }
  
    /**
     * Delete file
     */
    async delete(key) {
  
      const command = new DeleteObjectCommand({
        Bucket: s3Config.bucketName,
  
        Key: key
      });
  
      return await s3Client.send(command);
    }
  
    /**
     * List files
     */
    async list(prefix = "") {
  
      const command =
        new ListObjectsV2Command({
          Bucket: s3Config.bucketName,
  
          Prefix: prefix
        });
  
      const result =
        await s3Client.send(command);
  
      return result.Contents ?? [];
    }
  }
  
export default S3Repository;