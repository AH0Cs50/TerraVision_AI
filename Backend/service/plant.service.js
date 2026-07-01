import RouteError from "../shared/util/RouteError.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";

class PlantService {
  /**
   * @param {object} plantRepository - Repository for plant persistence
   * @param {object} userRepo - Repository for user persistence
   */
  constructor(plantRepository, userRepo) {
    this.plantRepository = plantRepository;
    this.userRepo = userRepo;
  }

  /**
   * @private
   * @description Resolves a user's internal ID from their public UUID
   * @param {string} userUUID - The user's public UUID
   * @returns {Promise<number>} The user's internal ID
   */
  async #resolveUserInternalId(userUUID) {
    const user = await this.userRepo.findByUUID(userUUID);
    return user.internalId;
  }

  /**
   * Verifies that the authenticated user has access to the given plant.
   * Admins bypass ownership checks. Throws 404 if plant is missing or
   * the user does not own it.
   * @param {string} plantUUID - The plant's public UUID
   * @param {string} userUUID - UUID of the authenticated user
   * @param {string} role - User's role ("user" or "admin")
   * @returns {Promise<object>} The plant entity if access is granted
   * @throws {RouteError} 404 if plant not found or user is not the owner
   */
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

  /**
   * Retrieves the internal numeric ID for a plant by its public UUID
   * @param {string} plantUUID - The plant's public UUID
   * @returns {Promise<number|null>} The plant's internal ID, or null if not found
   */
  async getInternalId(plantUUID) {
    const plant = await this.plantRepository.findByUUID(plantUUID);
    return plant ? plant.internalId : null;
  }
}

export default PlantService;
