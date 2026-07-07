/**
 * Plant entity. Wraps raw plant data in a private #data field.
 * All mutations flow through entity methods that return a delta object
 * consumed by the repo layer — fields are never written directly.
 */
class Plant {
  #data;

  /**
   * @param {object} data - Raw plant record from the DB
   */
  constructor(data) {
    this.#data = { ...data };
  }

  /**
   * Estimates soil moisture percentage based on soil type and hours since last watering
   * @param {string} soilType - One of the SOIL_TYPES (e.g. "sandy", "vertisols")
   * @param {number} hoursSinceLastWatering - Hours elapsed since the last watering
   * @returns {number|null} Estimated moisture percentage (0-100), or null if inputs are invalid
   */
  static estimateMoisture(soilType, hoursSinceLastWatering) {
    if (hoursSinceLastWatering == null || !soilType) return null;

    const fieldCapacity = {
      sandy: 80, alfisols: 85, aridisols: 75,
      entisols: 80, inceptisols: 85, vertisols: 95,
    };
    const drainRate = {
      sandy: 3, alfisols: 1.5, aridisols: 2,
      entisols: 2.5, inceptisols: 1, vertisols: 0.5,
    };

    const capacity = fieldCapacity[soilType];
    const rate = drainRate[soilType];
    if (capacity == null || rate == null) return null;

    const estimated = capacity - rate * hoursSinceLastWatering;
    return Math.max(0, Math.min(100, Math.round(estimated)));
  }

  /**
   * The plant's public UUID
   * @returns {string}
   */
  get uuid() { return this.#data.uuid; }
  /**
   * The plant's internal numeric ID (FK target)
   * @returns {number}
   */
  get internalId() { return this.#data.internalId; }
  /**
   * FK referencing the owning user's internalId
   * @returns {number}
   */
  get userInternalId() { return this.#data.userInternalId; }
  /**
   * The plant's display name
   * @returns {string}
   */
  get name() { return this.#data.name; }
  /**
   * The plant's common name (e.g. "Tomato", "Rose")
   * @returns {string}
   */
  get commonName() { return this.#data.commonName; }
  /**
   * The plant category ("crop" | "tree" | "flower")
   * @returns {string}
   */
  get category() { return this.#data.category; }
  /**
   * The plant's botanical family
   * @returns {string}
   */
  get family() { return this.#data.family; }
  /**
   * Current growth stage ("germination" | "seedling" | "vegetative" | "flowering" | "fruiting" | "mature")
   * @returns {string}
   */
  get growthStage() { return this.#data.growthStage; }
  /**
   * Date the plant was planted
   * @returns {Date}
   */
  get plantedAt() { return this.#data.plantedAt; }
  /**
   * Expected harvest date
   * @returns {Date}
   */
  get expectedHarvestDate() { return this.#data.expectedHarvestDate; }
  /**
   * Soil information (type, moisture, lastFertilized, lastPruned)
   * @returns {object}
   */
  get soil() { return this.#data.soil; }
  /**
   * Watering information (hoursSinceLastWatering)
   * @returns {object}
   */
  get watering() { return this.#data.watering; }
  /**
   * Current disease record (name, confidence, detectedAt)
   * @returns {object}
   */
  get disease() { return this.#data.disease; }
  /**
   * History of all disease detections
   * @returns {Array}
   */
  get diseaseHistory() { return this.#data.diseaseHistory; }
  /**
   * Stress information (diseaseType, severity)
   * @returns {object}
   */
  get stress() { return this.#data.stress; }
  /**
   * CDN information (basePath, images[])
   * @returns {object}
   */
  get cdn() { return this.#data.cdn; }
  /**
   * The plant's age in days (computed field)
   * @returns {number}
   */
  get coverImage() { return this.#data.coverImage; }
  get ageDays() { return this.#data.ageDays; }
  /**
   * Whether the plant has an active disease
   * @returns {boolean}
   */
  get hasDisease() { return this.#data.hasDisease; }
  /**
   * Timestamp when the plant record was created
   * @returns {Date}
   */
  get createdAt() { return this.#data.createdAt; }
  /**
   * Timestamp when the plant record was last updated
   * @returns {Date}
   */
  get updatedAt() { return this.#data.updatedAt; }

  /**
   * Builds the plant input object consumed by the Engine evaluator
   * Falls back to static estimateMoisture when soil.moisture is missing
   * @returns {{ plant: object, soil: object, watering: object, stress: object }}
   */
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
        moisture: this.#data.soil?.moisture
          ?? Plant.estimateMoisture(this.#data.soil?.type, this.#data.watering?.hoursSinceLastWatering),
        hoursSinceLastFertilized: this.#data.soil?.lastFertilized
          ? Math.floor((Date.now() - new Date(this.#data.soil.lastFertilized).getTime()) / 3600000)
          : null,
      },
      watering: {
        hoursSinceLastWatering: this.#data.watering?.hoursSinceLastWatering,
      },
      stress: {
        diseaseType: this.#data.stress?.diseaseType ?? "none",
        severity: this.#data.stress?.severity ?? "healthy",
      },
    };
  }

  /**
   * Adds a file name to the plant's CDN images array
   * @param {string} fileName - The file name to add
   * @returns {{ "cdn.images": string[] }} The delta to merge into DB
   */
  addImage(fileName) {
    return { "cdn.images": [...(this.#data.cdn?.images || []), fileName] };
  }

  /**
   * Removes a file name from the plant's CDN images array
   * @param {string} fileName - The file name to remove
   * @returns {{ "cdn.images": string[] }} The delta to merge into DB
   */
  removeImage(fileName) {
    return { "cdn.images": (this.#data.cdn?.images || []).filter(i => i !== fileName) };
  }

  /**
   * Sets the CDN base path for the plant's images
   * @param {string} basePath - The S3/CDN base path
   * @returns {{ "cdn.basePath": string }} The delta to merge into DB
   */
  setBasePath(basePath) {
    return { "cdn.basePath": basePath };
  }

  /**
   * Records a disease detection prediction and returns the full delta update
   * @param {{ name?: string, disease?: string, confidence?: number, detectedAt?: Date, diseaseType?: string }} prediction - The ML prediction result
   * @returns {{ disease: object, diseaseHistory: Array, "stress.diseaseType": string, "stress.severity": string }} The delta to merge into DB
   */
  recordDiseaseDetection(prediction) {
    const record = {
      name: prediction.name || prediction.disease || "healthy",
      confidence: prediction.confidence ?? 1,
      detectedAt: prediction.detectedAt || new Date(),
    };

    const dt = prediction.diseaseType || "none";
    const diseaseType = dt === "healthy" ? "none"
      : ["bacterial", "fungal", "viral"].includes(dt) ? dt
      : "fungal";
    const severity = record.name === "healthy" ? "healthy" : "medium";

    return {
      disease: record,
      diseaseHistory: [...(this.#data.diseaseHistory || []), record],
      "stress.diseaseType": diseaseType,
      "stress.severity": severity,
    };
  }

  /**
   * Applies watering action and returns the delta update
   * @param {number} hoursSinceLastWatering - Hours since plant was watered (resets to 0 after watering)
   * @returns {{ "watering.hoursSinceLastWatering": number }} The delta to merge into DB
   */
  applyWatering(hoursSinceLastWatering) {
    return { "watering.hoursSinceLastWatering": hoursSinceLastWatering };
  }

  /**
   * Applies fertilizing action and returns the delta update
   * @returns {{ "soil.lastFertilized": Date }} The delta to merge into DB
   */
  applyFertilizing() {
    return { "soil.lastFertilized": new Date() };
  }

  /**
   * Applies pruning action and returns the delta update
   * @returns {{ "soil.lastPruned": Date }} The delta to merge into DB
   */
  applyPruning() {
    return { "soil.lastPruned": new Date() };
  }

  /**
   * Applies disease treatment action, clearing the disease and resetting stress
   * @returns {{ disease: { name: string, confidence: number }, "stress.diseaseType": string, "stress.severity": string, hasDisease: boolean }} The delta to merge into DB
   */
  applyDiseaseTreatment() {
    return {
      disease: { name: "healthy", confidence: 1 },
      "stress.diseaseType": "none",
      "stress.severity": "healthy",
      hasDisease: false,
    };
  }

  /**
   * Applies harvest action, advancing growth stage to "mature"
   * @returns {{ growthStage: string }} The delta to merge into DB
   */
  applyHarvest() {
    return { growthStage: "mature" };
  }

  /**
   * Routes a task type to the corresponding apply* method
   * @param {string} taskType - One of "fertilizing" | "pruning" | "disease_treatment" | "harvest" | "move_light"
   * @returns {object} The delta from the matching apply method, or an empty object for unknown task types
   */
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

  /**
   * Returns a shallow copy of all internal data
   * @returns {object}
   */
  toJSON() {
    return { ...this.#data };
  }
}

export default Plant;
