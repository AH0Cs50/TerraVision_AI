import { PlantCareModel } from "../model/plant-care.model.js";

/**
 * @description Data access layer for plant care state documents. Provides
 * CRUD operations plus specialised task mutations against
 * the MongoDB PlantCareModel.
 */
class PlantCareRepository {

  /**
   * @private
   * @description Retrieves the care state for a plant or returns null.
   * @param {string} plantUUID - UUID of the plant
   * @returns {Promise<Object|null>}
   */
  async #getCareStateOrNull(plantUUID) {
    const careState = await this.findByPlantUUID(plantUUID);
    if (!careState) return null;
    return careState;
  }

  /**
   * @private
   * @description Finds an item by taskId within an array and returns the
   * item and its index.
   * @param {Array} arr - Array of task objects
   * @param {string} taskId - Target task ID
   * @returns {{item: Object, index: number}|null}
   */
  #findInArray(arr, taskId) {
    const items = arr || [];
    const index = items.findIndex((t) => t.taskId === taskId);
    if (index === -1) return null;
    return { item: items[index], index };
  }

  /**
   * @private
   * @description Returns a new array with the element at the given index
   * removed (immutable operation).
   * @param {Array} arr - Source array
   * @param {number} index - Index to remove
   * @returns {Array} New array without the removed element
   */
  #removeByIndex(arr, index) {
    return [...arr.slice(0, index), ...arr.slice(index + 1)];
  }

  /**
   * @description Creates a new plant care state document.
   * @param {Object} data - Care state data
   * @returns {Promise<Object>} Created document (plain object)
   */
  async create(data) {
    const doc = new PlantCareModel(data);
    const saved = await doc.save();
    return saved.toObject();
  }

  /**
   * @description Finds a care state by its UUID.
   * @param {string} uuid - Care state UUID
   * @returns {Promise<Object|null>}
   */
  async findByUUID(uuid) {
    return await PlantCareModel.findOne({ uuid }).lean();
  }

  /**
   * @description Finds a care state by its internal ID.
   * @param {number} internalId - Internal care state ID
   * @returns {Promise<Object|null>}
   */
  async findByInternalId(internalId) {
    return await PlantCareModel.findOne({ internalId }).lean();
  }

  /**
   * @description Finds a care state by the associated plant's UUID.
   * @param {string} plantUUID - UUID of the associated plant
   * @returns {Promise<Object|null>}
   */
  async findByPlantUUID(plantUUID) {
    return await PlantCareModel.findOne({ plantUUID }).lean();
  }

  /**
   * @description Updates a care state by its UUID. Sets updatedAt automatically.
   * @param {string} uuid - Care state UUID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object|null>} Updated document or null if not found
   */
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

  /**
   * @description Updates a care state by the associated plant's UUID.
   * @param {string} plantUUID - UUID of the associated plant
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object|null>}
   */
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

  /**
   * @description Deletes a care state by its UUID.
   * @param {string} uuid - Care state UUID
   * @returns {Promise<number>} Number of deleted documents (0 or 1)
   */
  async deleteByUUID(uuid) {
    const result = await PlantCareModel.deleteOne({ uuid });
    return result.deletedCount;
  }

  /**
   * @description Deletes a care state by the associated plant's UUID.
   * @param {string} plantUUID - UUID of the associated plant
   * @returns {Promise<number>} Number of deleted documents
   */
  async deleteByPlantUUID(plantUUID) {
    const result = await PlantCareModel.deleteOne({ plantUUID });
    return result.deletedCount;
  }

  /**
   * @description Returns all care state documents.
   * @returns {Promise<Array>}
   */
  async findAll() {
    return await PlantCareModel.find({}).lean();
  }

  /**
   * @description Paginates through all care states, sorted by creation date
   * descending.
   * @param {Object} [options]
   * @param {number} [options.page=1] - Page number (1-based)
   * @param {number} [options.limit=20] - Items per page
   * @returns {Promise<Array>}
   */
  async paginate({ page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    return await PlantCareModel.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  /**
   * @description Finds a task within the active tasks array by its ID.
   * @param {string} plantUUID - UUID of the associated plant
   * @param {string} taskId - ID of the task to find
   * @returns {Promise<{task: Object, index: number, careState: Object}|null>}
   */
  async findTaskInActive(plantUUID, taskId) {
    const careState = await this.#getCareStateOrNull(plantUUID);
    if (!careState) return null;

    const found = this.#findInArray(careState.activeTasks, taskId);
    if (!found) return null;

    return { task: found.item, index: found.index, careState };
  }

  /**
   * @description Finds a task within the completed tasks array by its ID.
   * @param {string} plantUUID - UUID of the associated plant
   * @param {string} taskId - ID of the task to find
   * @returns {Promise<{task: Object, index: number, careState: Object}|null>}
   */
  async findTaskInCompleted(plantUUID, taskId) {
    const careState = await this.#getCareStateOrNull(plantUUID);
    if (!careState) return null;

    const found = this.#findInArray(careState.completedTasks, taskId);
    if (!found) return null;

    return { task: found.item, index: found.index, careState };
  }

  /**
   * @description Finds a task by ID in both active and completed arrays.
   * Returns the list name ("active" or "completed") along with the result.
   * @param {string} plantUUID - UUID of the associated plant
   * @param {string} taskId - ID of the task to find
   * @returns {Promise<{task: Object, index: number, careState: Object, list: string}|null>}
   */
  async findTaskById(plantUUID, taskId) {
    const inActive = await this.findTaskInActive(plantUUID, taskId);
    if (inActive) return { ...inActive, list: "active" };

    const inCompleted = await this.findTaskInCompleted(plantUUID, taskId);
    if (inCompleted) return { ...inCompleted, list: "completed" };

    return null;
  }

  /**
   * @description Removes a task from the completed tasks array.
   * @param {string} plantUUID - UUID of the associated plant
   * @param {string} taskId - ID of the task to remove
   * @returns {Promise<Object|null>} Updated care state or null
   */
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

  /**
   * @description Removes a task from the active tasks array.
   * @param {string} plantUUID - UUID of the associated plant
   * @param {string} taskId - ID of the task to remove
   * @returns {Promise<Object|null>} Updated care state or null
   */
  async removeFromActive(plantUUID, taskId) {
    const careState = await this.#getCareStateOrNull(plantUUID);
    if (!careState) return null;

    const found = this.#findInArray(careState.activeTasks, taskId);
    if (!found) return null;

    return await this.updateByPlantUUID(plantUUID, {
      activeTasks: this.#removeByIndex(careState.activeTasks, found.index),
    });
  }

  /**
   * @description Appends a task to the active tasks array.
   * @param {string} plantUUID - UUID of the associated plant
   * @param {Object} taskData - Task object to add
   * @returns {Promise<Object|null>} Updated care state or null
   */
  async pushToActive(plantUUID, taskData) {
    const careState = await this.#getCareStateOrNull(plantUUID);
    if (!careState) return null;

    return await this.updateByPlantUUID(plantUUID, {
      activeTasks: [...(careState.activeTasks || []), taskData],
    });
  }

  /**
   * @description Appends a task to the completed tasks array.
   * @param {string} plantUUID - UUID of the associated plant
   * @param {Object} taskData - Task object to add
   * @returns {Promise<Object|null>} Updated care state or null
   */
  async pushToCompleted(plantUUID, taskData) {
    const careState = await this.#getCareStateOrNull(plantUUID);
    if (!careState) return null;

    return await this.updateByPlantUUID(plantUUID, {
      completedTasks: [...(careState.completedTasks || []), taskData],
    });
  }

  /**
   * @description Paginates through tasks, optionally filtered by list type.
   * @param {string} plantUUID - UUID of the associated plant
   * @param {Object} [opts]
   * @param {number} [opts.type=0] - 0=all, 1=active only, 2=completed only
   * @param {number} [opts.page=1] - Page number (1-based)
   * @param {number} [opts.limit=20] - Items per page
   * @returns {Promise<{tasks: Array, total: number, page: number, limit: number}>}
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

}

export default PlantCareRepository;
