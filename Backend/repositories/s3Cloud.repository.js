import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command
} from "@aws-sdk/client-s3";

import s3Client from "s3Client.cloud.js";

import { s3Config } from "../config/config.js";

class S3Repository {
  constructor() {
    this.s3Client = s3Client;
  }

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

  async get(key) {
    const command = new GetObjectCommand({
      Bucket: s3Config.bucketName,
      Key: key,
    });

    return await this.s3Client.send(command);
  }

  async delete(key) {
    const command = new DeleteObjectCommand({
      Bucket: s3Config.bucketName,
      Key: key,
    });

    return await this.s3Client.send(command);
  }

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