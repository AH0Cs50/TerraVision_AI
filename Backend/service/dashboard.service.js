class DashboardService {
  constructor(plantRepo, plantCareRepo) {
    this.plantRepo = plantRepo;
    this.plantCareRepo = plantCareRepo;
  }

  async #getPlants(userDoc) {
    return this.plantRepo.findByUserInternalId(userDoc.internalId);
  }

  async #getCareStates(plants) {
    const plantUUIDs = plants.map((p) => p.uuid);
    return plantUUIDs.length
      ? await this.plantCareRepo.findByPlantUUIDs(plantUUIDs)
      : [];
  }

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

  async getCareDistribution(userDoc) {
    const plants = await this.#getPlants(userDoc);
    const careStates = await this.#getCareStates(plants);
    return {
      careStatusDistribution: this.#computeCareDistribution(careStates),
      healthPercentages: this.#computeHealthPercentages(careStates),
    };
  }

  async getResourceDemand(userDoc) {
    const plants = await this.#getPlants(userDoc);
    const careStates = await this.#getCareStates(plants);
    return { resourceDemand: this.#computeResourceDemand(careStates) };
  }

  async getTaskEfficiency(userDoc) {
    const plants = await this.#getPlants(userDoc);
    const careStates = await this.#getCareStates(plants);
    return { taskEfficiency: this.#computeTaskEfficiency(careStates) };
  }

  async getUpcomingHarvests(userDoc, limit = 3) {
    const plants = await this.#getPlants(userDoc);
    return { upcomingHarvests: this.#computeUpcomingHarvests(plants, limit) };
  }

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

  #countBy(items, key) {
    const counts = {};
    for (const item of items) {
      const val = item[key];
      counts[val] = (counts[val] || 0) + 1;
    }
    return counts;
  }

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
