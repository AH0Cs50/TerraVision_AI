import { PlantCareModel } from "../model/plant-care.model.js";

class PlantCareRepository {
  // ── HELPERS ────────────────────────────────────

  async #getCareStateOrNull(plantUUID) {
    const careState = await this.findByPlantUUID(plantUUID);
    if (!careState) return null;
    return careState;
  }

  #findInArray(arr, taskId) {
    const items = arr || [];
    const index = items.findIndex((t) => t.taskId === taskId);
    if (index === -1) return null;
    return { item: items[index], index };
  }

  #removeByIndex(arr, index) {
    return [...arr.slice(0, index), ...arr.slice(index + 1)];
  }

  // ── CRUD ───────────────────────────────────────

  async create(data) {
    const doc = new PlantCareModel(data);
    const saved = await doc.save();
    return saved.toObject();
  }

  async findByUUID(uuid) {
    return await PlantCareModel.findOne({ uuid }).lean();
  }

  async findByInternalId(internalId) {
    return await PlantCareModel.findOne({ internalId }).lean();
  }

  async findByPlantUUID(plantUUID) {
    return await PlantCareModel.findOne({ plantUUID }).lean();
  }

  async updateByUUID(uuid, updateData) {
    const current = await this.findByUUID(uuid);
    if (!current) return null;

    const field = { ...updateData, updatedAt: new Date() };

    return await PlantCareModel.findOneAndUpdate(
      { uuid },
      { $set: field },
      { returnDocument: "after" },
    ).lean();
  }

  async updateByPlantUUID(plantUUID, updateData) {
    const current = await this.findByPlantUUID(plantUUID);
    if (!current) return null;

    const field = { ...updateData, updatedAt: new Date() };

    return await PlantCareModel.findOneAndUpdate(
      { plantUUID },
      { $set: field },
      { returnDocument: "after" },
    ).lean();
  }

  async deleteByUUID(uuid) {
    const result = await PlantCareModel.deleteOne({ uuid });
    return result.deletedCount;
  }

  async deleteByPlantUUID(plantUUID) {
    const result = await PlantCareModel.deleteOne({ plantUUID });
    return result.deletedCount;
  }

  async findAll() {
    return await PlantCareModel.find({}).lean();
  }

  // ── TASK LOOKUP ────────────────────────────────

  async findTaskInActive(plantUUID, taskId) {
    const careState = await this.#getCareStateOrNull(plantUUID);
    if (!careState) return null;

    const found = this.#findInArray(careState.activeTasks, taskId);
    if (!found) return null;

    return { task: found.item, index: found.index, careState };
  }

  async findTaskInCompleted(plantUUID, taskId) {
    const careState = await this.#getCareStateOrNull(plantUUID);
    if (!careState) return null;

    const found = this.#findInArray(careState.completedTasks, taskId);
    if (!found) return null;

    return { task: found.item, index: found.index, careState };
  }

  async findTaskById(plantUUID, taskId) {
    const inActive = await this.findTaskInActive(plantUUID, taskId);
    if (inActive) return { ...inActive, list: "active" };

    const inCompleted = await this.findTaskInCompleted(plantUUID, taskId);
    if (inCompleted) return { ...inCompleted, list: "completed" };

    return null;
  }

  // ── TASK MUTATION ──────────────────────────────

  async removeFromCompleted(plantUUID, taskId) {
    const careState = await this.#getCareStateOrNull(plantUUID);
    if (!careState) return null;

    const found = this.#findInArray(careState.completedTasks, taskId);
    if (!found) return null;

    return await this.updateByPlantUUID(plantUUID, {
      completedTasks: this.#removeByIndex(
        careState.completedTasks,
        found.index,
      ),
    });
  }

  async removeFromActive(plantUUID, taskId) {
    const careState = await this.#getCareStateOrNull(plantUUID);
    if (!careState) return null;

    const found = this.#findInArray(careState.activeTasks, taskId);
    if (!found) return null;

    return await this.updateByPlantUUID(plantUUID, {
      activeTasks: this.#removeByIndex(careState.activeTasks, found.index),
    });
  }

  async pushToActive(plantUUID, taskData) {
    const careState = await this.#getCareStateOrNull(plantUUID);
    if (!careState) return null;

    return await this.updateByPlantUUID(plantUUID, {
      activeTasks: [...(careState.activeTasks || []), taskData],
    });
  }

  async pushToCompleted(plantUUID, taskData) {
    const careState = await this.#getCareStateOrNull(plantUUID);
    if (!careState) return null;

    return await this.updateByPlantUUID(plantUUID, {
      completedTasks: [...(careState.completedTasks || []), taskData],
    });
  }

  async pushActionLog(plantUUID, logData) {
    const careState = await this.#getCareStateOrNull(plantUUID);
    if (!careState) return null;

    return await this.updateByPlantUUID(plantUUID, {
      actionLogs: [...(careState.actionLogs || []), logData],
    });
  }

  // ── TASK PAGINATION ────────────────────────────

  /**
   * Paginate tasks by type.
   * @param {string} plantUUID
   * @param {object} opts
   * @param {number} opts.type  - 0=all tasks, 1=active only, 2=completed only
   * @param {number} opts.page  - page number (1-based, default 1)
   * @param {number} opts.limit - items per page (default 20)
   */
  async paginateTasks(plantUUID, { type = 0, page = 1, limit = 20 } = {}) {
    const careState = await this.#getCareStateOrNull(plantUUID);
    if (!careState) return { tasks: [], total: 0, page, limit };

    let allTasks;
    if (type === 1) {
      allTasks = careState.activeTasks || [];
    } else if (type === 2) {
      allTasks = careState.completedTasks || [];
    } else {
      allTasks = [
        ...(careState.activeTasks || []),
        ...(careState.completedTasks || []),
      ];
    }

    const skip = (page - 1) * limit;
    const paged = allTasks.slice(skip, skip + limit);

    return { tasks: paged, total: allTasks.length, page, limit };
  }

  async paginateActionLogs(plantUUID, { page = 1, limit = 20 } = {}) {
    const careState = await this.#getCareStateOrNull(plantUUID);
    if (!careState) return { logs: [], total: 0, page, limit };

    const allLogs = careState.actionLogs || [];
    const skip = (page - 1) * limit;
    const paged = allLogs.slice(skip, skip + limit);

    return { logs: paged, total: allLogs.length, page, limit };
  }
}

export default PlantCareRepository;
