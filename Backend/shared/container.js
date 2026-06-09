//repositories
import UserRepository from "../repositories/user.repository.js";
import PlantRepository from "../repositories/plant.repository.js";
import S3Repository from "../repositories/s3Cloud.repository.js";
import PlantCareRepository from "../repositories/plant-care.repository.js";
import ActionLogRepository from "../repositories/action-log.repository.js";

export const userRepo = new UserRepository();
export const plantRepo = new PlantRepository();
export const s3Repo = new S3Repository();
export const plantCareRepo = new PlantCareRepository();
export const actionLogRepo = new ActionLogRepository();

//infrastructure services
import TokenService from "../service/common/token.service.js";
import PasswordHasher from "../service/common/passHash.service.js";
import EmailService from "../service/common/email.service.js";

export const tokenService = new TokenService();
export const passHasher = new PasswordHasher();
export const emailService = new EmailService();

//services
import AuthService from "../service/auth.service.js";
import UserService from "../service/user.service.js";
import PlantService from "../service/plant.service.js";
import DiseaseDetectionService from "../service/disease-detection.service.js";
import S3CloudService from "../service/s3Cloud.service.js";
import WeatherService, {
  WeatherDescriber,
} from "../service/weather.service.js";
import LLMService from "../service/llm.service.js";
import PlantAnalyserService from "../service/plant-analyser.service.js";
import PlantVisionService from "../service/plant-vision.service.js";
import PlantCareStateService from "../service/plant-care-state.service.js";
import { PlantTaskCareManager } from "../service/plant-care-task-manager.service.js";
import { PlantCareActionLogger } from "../service/plant-care-action-logger.service.js";
import { PlantCareTaskGenerator } from "../service/plant-care-task-generator.service.js";
import { PlantCareAiInsights } from "../service/plant-care-ai-insights.service.js";

export const userService = new UserService(userRepo);
export const llmService = new LLMService();
export const plantService = new PlantService(
  plantRepo,
  s3Repo,
  userService,
  llmService,
);

export const s3CloudService = new S3CloudService(s3Repo, userService);

export const diseaseDetectionService = new DiseaseDetectionService(
  plantRepo,
  userService,
  s3CloudService,
);

export const authService = new AuthService(
  tokenService,
  userService,
  passHasher,
);

export const weatherService = new WeatherService();
export const weatherDescriber = new WeatherDescriber();
export const plantVisionService = new PlantVisionService(
  s3CloudService,
  llmService,
);

export const plantAnalyserService = new PlantAnalyserService(
  weatherService,
  weatherDescriber,
  plantService,
  userService,
);

export const plantCareStateService = new PlantCareStateService(plantCareRepo);

export const plantCareTaskGenerator = new PlantCareTaskGenerator(llmService);

export const plantCareActionLogger = new PlantCareActionLogger(actionLogRepo, plantService);

export const plantTaskCareManager = new PlantTaskCareManager(
  plantCareRepo,
  plantCareTaskGenerator,
  plantCareActionLogger,
);

export const plantCareAiInsights = new PlantCareAiInsights(llmService);
