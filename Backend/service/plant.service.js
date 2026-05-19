class PlantService {
  constructor(plantRepository, s3CloudRepository) {
    this.plantRepository = plantRepository;
    this.s3CloudRepository = s3CloudRepository;
  }

  // =========================================
  // Create Plant
  // =========================================
  async createPlant(data) {
    return await this.plantRepository.create(data);
  }

  // =========================================
  // Get Plant by UUID
  // =========================================
  async getPlantByUUID(uuid) {
    return await this.plantRepository.findByUUID(uuid);
  }

  // =========================================
  // Get User Plants
  // =========================================
  async getUserPlants(userInternalId) {
    return await this.plantRepository.findByUserInternalId(userInternalId);
  }

  // =========================================
  // Update Plant
  // =========================================
  async updatePlant(uuid, updateData) {
    return await this.plantRepository.updateByUUID(uuid, updateData);
  }

  // =========================================
  // Delete Plant
  // =========================================
  async deletePlant(uuid) {
    return await this.plantRepository.deleteByUUID(uuid);
  }

  // =========================================
  // Get All Plants (Admin)
  // =========================================
  async getAllPlants() {
    return await this.plantRepository.findAll();
  }

  // =========================================
  // Paginate Plants
  // =========================================
  async paginatePlants({ page, limit }) {
    return await this.plantRepository.paginate({
      page,
      limit,
    });
  }

  async calculateExpectedHarvestDate(plantedAt, plantType) {
    // use plant name to determine the expected harvest time
    //using AI service to calculate the expected harvest time with expected prompt
  }

  async getEnginePlantInput(plantUUID) {
    const Plant = await this.getPlantByUUID(plantUUID);
    return {
      plant: {
        family: Plant.family,
        ageDays: Plant.ageDays,
        growthStage: Plant.growthStage,
      },
      soil: {
        type: Plant.soil?.type,
        moisture: Plant.soil?.moisture,
      },
      watering: {
        hoursSinceLastWatering: Plant.watering?.hoursSinceLastWatering,
      },
      stress: {
        diseaseType: Plant.stress?.diseaseType,
        severity: Plant.stress?.severity,
      },
    };
  }
}

export default PlantService;
