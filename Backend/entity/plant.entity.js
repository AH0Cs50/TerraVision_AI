class Plant {
  #data;

  constructor(data) {
    this.#data = { ...data };
  }

  get uuid() { return this.#data.uuid; }
  get internalId() { return this.#data.internalId; }
  get userInternalId() { return this.#data.userInternalId; }
  get name() { return this.#data.name; }
  get commonName() { return this.#data.commonName; }
  get category() { return this.#data.category; }
  get family() { return this.#data.family; }
  get growthStage() { return this.#data.growthStage; }
  get plantedAt() { return this.#data.plantedAt; }
  get expectedHarvestDate() { return this.#data.expectedHarvestDate; }
  get soil() { return this.#data.soil; }
  get watering() { return this.#data.watering; }
  get disease() { return this.#data.disease; }
  get diseaseHistory() { return this.#data.diseaseHistory; }
  get stress() { return this.#data.stress; }
  get cdn() { return this.#data.cdn; }
  get ageDays() { return this.#data.ageDays; }
  get hasDisease() { return this.#data.hasDisease; }
  get createdAt() { return this.#data.createdAt; }
  get updatedAt() { return this.#data.updatedAt; }

  getEnginePlantInput() {
    return {
      plant: {
        category: this.#data.category,
        family: this.#data.family,
        ageDays: this.#data.ageDays,
        growthStage: this.#data.growthStage,
      },
      soil: {
        type: this.#data.soil?.type,
        moisture: this.#data.soil?.moisture,
        hoursSinceLastFertilized: this.#data.soil?.lastFertilized
          ? Math.floor((Date.now() - new Date(this.#data.soil.lastFertilized).getTime()) / 3600000)
          : null,
      },
      watering: {
        hoursSinceLastWatering: this.#data.watering?.hoursSinceLastWatering,
      },
      stress: {
        diseaseType: this.#data.stress?.diseaseType,
        severity: this.#data.stress?.severity,
      },
    };
  }

  addImage(fileName) {
    return { "cdn.images": [...(this.#data.cdn?.images || []), fileName] };
  }

  removeImage(fileName) {
    return { "cdn.images": (this.#data.cdn?.images || []).filter(i => i !== fileName) };
  }

  setBasePath(basePath) {
    return { "cdn.basePath": basePath };
  }

  recordDiseaseDetection(prediction) {
    const record = {
      name: prediction.name || prediction.disease || "healthy",
      confidence: prediction.confidence ?? 1,
      detectedAt: prediction.detectedAt || new Date(),
    };
    return {
      disease: record,
      diseaseHistory: [...(this.#data.diseaseHistory || []), record],
    };
  }

  applyWatering(hoursSinceLastWatering) {
    return { "watering.hoursSinceLastWatering": hoursSinceLastWatering };
  }

  applyFertilizing() {
    return { "soil.lastFertilized": new Date() };
  }

  applyPruning() {
    return { "soil.lastPruned": new Date() };
  }

  applyDiseaseTreatment() {
    return {
      disease: { name: "healthy", confidence: 1 },
      "stress.diseaseType": "none",
      "stress.severity": "none",
      hasDisease: false,
    };
  }

  applyHarvest() {
    return { growthStage: "mature" };
  }

  applyTaskAction(taskType) {
    switch (taskType) {
      case "fertilizing": return this.applyFertilizing();
      case "pruning": return this.applyPruning();
      case "disease_treatment": return this.applyDiseaseTreatment();
      case "harvest": return this.applyHarvest();
      case "move_light": return {};
      default: return {};
    }
  }

  toJSON() {
    return { ...this.#data };
  }
}

export default Plant;
