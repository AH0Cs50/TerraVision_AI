//repositories
import UserRepository from "../repository/user.repository.js";
import PlantRepository from "../repository/plant.repository.js";
import S3Repository from "../repository/s3Cloud.repository.js";

export const userRepo = new UserRepository();
export const plantRepo = new PlantRepository();
export const s3Repo = new S3Repository();

//infrastructure services
import TokenService from "../service/common/token.service.js";
import PasswordHasher from "../service/common/passHash.service.js";

export const tokenService = new TokenService();
export const passHasher = new PasswordHasher();

//services
import AuthService from "../service/auth.service.js";
import UserService from "../service/user.service.js";
import PlantService from "../service/plant.service.js";
import DiseaseDetectionService from "../service/disease-detection.service.js";
import UploadService from "../service/upload.service.js";
import WeatherService from "../service/weather.service.js";

export const userService = new UserService();
export const plantService = new PlantService();
export const diseaseDetectionService = new DiseaseDetectionService();
export const uploadService = new UploadService(s3Repo);
export const authService = new AuthService(
  tokenService,
  userService,
  passHasher,
);

export const weatherService = new WeatherService();
