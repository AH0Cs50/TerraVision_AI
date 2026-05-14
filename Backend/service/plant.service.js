class PlantService {

    constructor(plantRepository) {
      this.plantRepository = plantRepository;
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
      return await this.plantRepository.findByUserInternalId(
        userInternalId
      );
    }
  
    // =========================================
    // Update Plant
    // =========================================
    async updatePlant(uuid, updateData) {
      return await this.plantRepository.updateByUUID(
        uuid,
        updateData
      );
    }
  
    // =========================================
    // Delete Plant
    // =========================================
    async deletePlant(uuid) {
      return await this.plantRepository.deleteByUUID(
        uuid
      );
    }
  
    // =========================================
    // Add Image (S3 key)
    // =========================================
    async addPlantImageKey (uuid, imageKey) {
      return await this.plantRepository.addImage(
        uuid,
        imageKey
      );
    }
  
    // =========================================
    // Remove Image
    // =========================================
    async removePlantImage(uuid, imageKey) {
      return await this.plantRepository.removeImage(
        uuid,
        imageKey
      );
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
  }
  
  export default PlantService;