//repositories
import UserRepository from "../repositories/user.repository.js";
import PlantRepository from "../repositories/plant.repository.js";
import S3Repository from "../repositories/s3Cloud.repository.js";

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
import S3CloudService from "../service/s3Cloud.service.js";
import WeatherService from "../service/weather.service.js";

export const userService = new UserService(userRepo);
export const plantService = new PlantService(plantRepo, s3Repo);
export const diseaseDetectionService = new DiseaseDetectionService(plantRepo);
export const s3CloudService = new S3CloudService(s3Repo);
export const authService = new AuthService(
  tokenService,
  userService,
  passHasher,
);

export const weatherService = new WeatherService();
