import RouteError from "../shared/util/RouteError.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";

class PlantService {
  constructor(plantRepository, userRepo) {
    this.plantRepository = plantRepository;
    this.userRepo = userRepo;
  }

  async #resolveUserInternalId(userUUID) {
    const user = await this.userRepo.findByUUID(userUUID);
    return user.internalId;
  }

  async verifyPlantAccess(plantUUID, userUUID, role) {
    const plant = await this.plantRepository.findByUUID(plantUUID);
    if (!plant)
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "Plant not found");
    if (role === "admin") return plant;
    const userInternalId = await this.#resolveUserInternalId(userUUID);
    if (plant.userInternalId !== userInternalId)
      throw new RouteError(HttpStatusCodes.FORBIDDEN, "Forbidden");
    return plant;
  }

  async getInternalId(plantUUID) {
    const plant = await this.plantRepository.findByUUID(plantUUID);
    return plant ? plant.internalId : null;
  }
}

export default PlantService;
