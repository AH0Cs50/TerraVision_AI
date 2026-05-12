// infrastructure/storage/s3.client.js

import { S3Client } from "@aws-sdk/client-s3";

import { s3Config } from "../config/config.js";

const s3Client = new S3Client({
  region: s3Config.region,

  endpoint: s3Config.endpoint,

  credentials: s3Config.credentials,

  forcePathStyle:
    s3Config.forcePathStyle
});

export default s3Client;