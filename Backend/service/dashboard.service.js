class DashboardService {
  /**
   * @param {object} plantRepo - Repository for plant persistence
   * @param {object} plantCareRepo - Repository for plant care state persistence
   */
  constructor(plantRepo, plantCareRepo) {
    this.plantRepo = plantRepo;
    this.plantCareRepo = plantCareRepo;
  }

  /**
   * @private
   * @description Fetches all plants belonging to a user
   * @param {object} userDoc - The authenticated user document
   * @returns {Promise<object[]>} Array of plant entities
   */
  async #getPlants(userDoc) {
    return this.plantRepo.findByUserInternalId(userDoc.internalId);
  }

  /**
   * @private
   * @description Fetches care states for a set of plants
   * @param {object[]} plants - Array of plant entities
   * @returns {Promise<object[]>} Array of care state documents
   */
  async #getCareStates(plants) {
    const plantUUIDs = plants.map((p) => p.uuid);
    return plantUUIDs.length
      ? await this.plantCareRepo.findByPlantUUIDs(plantUUIDs)
      : [];
  }

  /**
   * Returns aggregated plant statistics for the user
   * @param {object} userDoc - The authenticated user document
   * @returns {Promise<object>} Object with totalPlants, diseasedPlants, healthyPlants,
   * plantsByCategory, and plantsByGrowthStage
   */
  async getPlantStats(userDoc) {
    const plants = await this.#getPlants(userDoc);
    return {
      totalPlants: plants.length,
      diseasedPlants: plants.filter((p) => p.hasDisease).length,
      healthyPlants: plants.filter((p) => !p.hasDisease).length,
      plantsByCategory: this.#countBy(plants, "category"),
      plantsByGrowthStage: this.#countBy(plants, "growthStage"),
    };
  }

  /**
   * Returns the care status distribution and health percentages across the user's plants
   * @param {object} userDoc - The authenticated user document
   * @returns {Promise<object>} Object with careStatusDistribution and healthPercentages
   */
  async getCareDistribution(userDoc) {
    const plants = await this.#getPlants(userDoc);
    const careStates = await this.#getCareStates(plants);
    return {
      careStatusDistribution: this.#computeCareDistribution(careStates),
      healthPercentages: this.#computeHealthPercentages(careStates),
    };
  }

  /**
   * Returns counts of plants needing water, fertilizer, or more light
   * @param {object} userDoc - The authenticated user document
   * @returns {Promise<object>} Object with resourceDemand breakdown
   */
  async getResourceDemand(userDoc) {
    const plants = await this.#getPlants(userDoc);
    const careStates = await this.#getCareStates(plants);
    return { resourceDemand: this.#computeResourceDemand(careStates) };
  }

  /**
   * Returns task efficiency metrics across the user's plants
   * @param {object} userDoc - The authenticated user document
   * @returns {Promise<object>} Object with taskEfficiency including activeTasks,
   * completedTasks, totalTasks, and efficiency percentage
   */
  async getTaskEfficiency(userDoc) {
    const plants = await this.#getPlants(userDoc);
    const careStates = await this.#getCareStates(plants);
    return { taskEfficiency: this.#computeTaskEfficiency(careStates) };
  }

  /**
   * Returns the next upcoming harvests for the user's plants
   * @param {object} userDoc - The authenticated user document
   * @param {number} [limit=3] - Maximum number of harvests to return
   * @returns {Promise<object>} Object with upcomingHarvests array
   */
  async getUpcomingHarvests(userDoc, limit = 3) {
    const plants = await this.#getPlants(userDoc);
    return { upcomingHarvests: this.#computeUpcomingHarvests(plants, limit) };
  }

  /**
   * Returns a comprehensive dashboard merging plant stats, care distribution,
   * resource demand, task efficiency, and upcoming harvests
   * @param {object} userDoc - The authenticated user document
   * @returns {Promise<object>} Aggregated dashboard data
   */
  async getUserStats(userDoc) {
    const [stats, careDist, resourceDemand, taskEff, harvests] =
      await Promise.all([
        this.getPlantStats(userDoc),
        this.getCareDistribution(userDoc),
        this.getResourceDemand(userDoc),
        this.getTaskEfficiency(userDoc),
        this.getUpcomingHarvests(userDoc, 3),
      ]);

    return {
      ...stats,
      ...careDist,
      ...resourceDemand,
      ...taskEff,
      ...harvests,
    };
  }

  /**
   * @private
   * @description Groups items by a given key and returns counts
   * @param {object[]} items - Array of objects
   * @param {string} key - The property key to group by
   * @returns {object} Object mapping each value to its count
   */
  #countBy(items, key) {
    const counts = {};
    for (const item of items) {
      const val = item[key];
      counts[val] = (counts[val] || 0) + 1;
    }
    return counts;
  }

  /**
   * @private
   * @description Computes the distribution of water, nutrients, health, and light statuses
   * @param {object[]} careStates - Array of care state documents
   * @returns {object} Distribution object with counts per status per category
   */
  #computeCareDistribution(careStates) {
    const dist = { water: {}, nutrients: {}, health: {}, light: {} };
    for (const cs of careStates) {
      if (!cs.status) continue;
      for (const key of ["water", "nutrients", "health", "light"]) {
        const val = cs.status[key];
        if (val) dist[key][val] = (dist[key][val] || 0) + 1;
      }
    }
    return dist;
  }

  /**
   * @private
   * @description Computes the percentage breakdown of health statuses
   * @param {object[]} careStates - Array of care state documents
   * @returns {object} Object mapping health status to percentage
   */
  #computeHealthPercentages(careStates) {
    const healthCounts = {};
    for (const cs of careStates) {
      const val = cs.status?.health;
      if (val) healthCounts[val] = (healthCounts[val] || 0) + 1;
    }
    const total = Object.values(healthCounts).reduce((a, b) => a + b, 0) || 1;
    const percentages = {};
    for (const [key, count] of Object.entries(healthCounts)) {
      percentages[key] = +((count / total) * 100).toFixed(1);
    }
    return percentages;
  }

  /**
   * @private
   * @description Counts plants needing water, fertilizer, or more light
   * @param {object[]} careStates - Array of care state documents
   * @returns {object} Object with thirsty, needsFeed, and lowLight counts
   */
  #computeResourceDemand(careStates) {
    let thirsty = 0;
    let needsFeed = 0;
    let lowLight = 0;
    for (const cs of careStates) {
      if (cs.status?.water === "thirsty") thirsty++;
      if (cs.status?.nutrients === "needs_feed") needsFeed++;
      if (cs.status?.light === "low") lowLight++;
    }
    return { thirsty, needsFeed, lowLight };
  }

  /**
   * @private
   * @description Computes task efficiency from active/completed task counts
   * @param {object[]} careStates - Array of care state documents
   * @returns {object} Object with activeTasks, completedTasks, totalTasks, and efficiency percentage
   */
  #computeTaskEfficiency(careStates) {
    let activeTasks = 0;
    let completedTasks = 0;
    for (const cs of careStates) {
      activeTasks += (cs.activeTasks || []).length;
      completedTasks += (cs.completedTasks || []).length;
    }
    const totalTasks = activeTasks + completedTasks;
    const efficiency = totalTasks > 0 ? +((completedTasks / totalTasks) * 100).toFixed(1) : 100;
    return { activeTasks, completedTasks, totalTasks, efficiency };
  }

  /**
   * @private
   * @description Finds the closest upcoming harvest dates for plants
   * @param {object[]} plants - Array of plant entities
   * @param {number} limit - Maximum number of harvests to return
   * @returns {object[]} Sorted array of upcoming harvest info with daysUntilHarvest
   */
  #computeUpcomingHarvests(plants, limit) {
    return plants
      .filter((p) => p.expectedHarvestDate)
      .sort((a, b) => new Date(a.expectedHarvestDate) - new Date(b.expectedHarvestDate))
      .slice(0, limit)
      .map((p) => {
        const now = Date.now();
        const harvest = new Date(p.expectedHarvestDate).getTime();
        const daysUntilHarvest = Math.max(0, Math.ceil((harvest - now) / 86400000));
        return {
          uuid: p.uuid,
          name: p.name,
          expectedHarvestDate: p.expectedHarvestDate,
          daysUntilHarvest,
        };
      });
  }
}

export default DashboardService;
