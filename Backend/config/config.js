import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, 'config.env') });

const { PORT, ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRES_IN, 
    REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRES_IN
} = process.env;

//db config vars
const {DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT} = process.env;

export const dbConfig = {
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    DB_PORT
}

export { PORT,
    ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_EXPIRES_IN,
    WEATHER_API_KEY,
 };