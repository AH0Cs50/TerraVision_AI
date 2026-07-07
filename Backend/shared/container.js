//repositories
import UserRepository from "../infrastructure/repo/user.repository.js";
import PlantRepository from "../infrastructure/repo/plant.repository.js";
import S3Repository from "../infrastructure/repo/s3Cloud.repository.js";
import PlantCareRepository from "../infrastructure/repo/plant-care.repository.js";
import ActionLogRepository from "../infrastructure/repo/action-log.repository.js";

export const userRepo = new UserRepository();
export const plantRepo = new PlantRepository();
export const s3Repo = new S3Repository();
export const plantCareRepo = new PlantCareRepository();
export const actionLogRepo = new ActionLogRepository();

//infrastructure services
import TokenService from "../infrastructure/service/token.service.js";
import PasswordHasher from "../infrastructure/service/passHash.service.js";
import EmailService from "../service/email.service.js";

export const tokenService = new TokenService();
export const passHasher = new PasswordHasher();
export const emailService = new EmailService();

//services
import PlantService from "../service/plant.service.js";
import S3CloudService from "../infrastructure/service/s3Cloud.service.js";
import WeatherService, {
  WeatherDescriber,
} from "../service/weather.service.js";
import LLMService from "../infrastructure/service/llm.service.js";
import PlantVisionService from "../service/plant-vision.service.js";
import PlantCareStateService from "../service/plant-care-state.service.js";
import { PlantTaskCareManager } from "../service/plant-care-task-manager.service.js";
import { PlantCareActionLogger } from "../service/plant-care-action-logger.service.js";
import { PlantCareTaskGenerator } from "../service/plant-care-task-generator.service.js";
import { PlantCareAiInsights } from "../service/plant-care-ai-insights.service.js";
import DashboardService from "../service/dashboard.service.js";

export const llmService = new LLMService();
export const plantService = new PlantService(plantRepo, userRepo);

export const s3CloudService = new S3CloudService(s3Repo, userRepo);

export const weatherService = new WeatherService();
export const weatherDescriber = new WeatherDescriber();
export const plantVisionService = new PlantVisionService(
  s3CloudService,
  llmService,
);

export const plantCareStateService = new PlantCareStateService(plantCareRepo);
export const plantCareTaskGenerator = new PlantCareTaskGenerator(llmService);

export const plantCareActionLogger = new PlantCareActionLogger(
  actionLogRepo,
  userRepo,
  plantService,
);

export const plantTaskCareManager = new PlantTaskCareManager(
  plantCareRepo,
  plantCareTaskGenerator,
  plantCareActionLogger,
);

export const plantCareAiInsights = new PlantCareAiInsights(llmService);

export const dashboardService = new DashboardService(plantRepo, plantCareRepo);
