import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, 'config.env') });

const { PORT, ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRES_IN, 
    REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRES_IN,
    WEATHER_API_KEY
} = process.env;


// //db config vars
// const {DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT} = process.env;

export {
  PORT,
  WEATHER_API_KEY,
  DISEASE_DETECTION_URL
}


export const jwtConfig = {
  ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRES_IN,
};

 // config/s3.config.js

export const s3Config = {

    region: process.env.S3_REGION,
  
    bucketName: process.env.S3_BUCKET_NAME,
  
    endpoint: process.env.S3_ENDPOINT || undefined,
  
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
  
      secretAccessKey:
        process.env.S3_SECRET_KEY
    },

    forcePathStyle:
      process.env.S3_FORCE_PATH_STYLE === "true",

    signedUrlExpiresIn:
      process.env.SignedUrlExpiresIn || 300,
};

export const emailConfig = {
  
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  from: `TerraVision AI <${process.env.EMAIL_USER}>`,
};

export default emailConfig;