import { ActionLogModel } from "../../model/action-log.model.js";

/**
 * Data access layer for action log documents. Provides
 * paginated queries and bulk-delete operations against the
 * MongoDB ActionLogModel.
 */
class ActionLogRepository {

  /**
   * Creates a new action log entry
   * @param {Object} data - Action log data payload
   * @returns {Promise<Object>} Created document (plain object)
   */
  async create(data) {
    const doc = new ActionLogModel(data);
    const saved = await doc.save();
    return saved.toObject();
  }

  /**
   * Finds action logs by plant UUID with pagination, sorted by newest first
   * @param {string} plantUUID - UUID of the plant
   * @param {Object} [options] - Optional pagination parameters
   * @param {number} [options.page=1] - Page number (1-based)
   * @param {number} [options.limit=20] - Items per page
   * @returns {Promise<{logs: Array, total: number, page: number, limit: number}>}
   */
  async findByPlantUUID(plantUUID, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      ActionLogModel.find({ plantUUID })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActionLogModel.countDocuments({ plantUUID }),
    ]);
    return { logs, total, page, limit };
  }

  /**
   * Finds action logs by plant internal ID with pagination
   * @param {number} plantInternalId - Internal ID of the plant
   * @param {Object} [options] - Optional pagination parameters
   * @param {number} [options.page=1] - Page number (1-based)
   * @param {number} [options.limit=20] - Items per page
   * @returns {Promise<{logs: Array, total: number, page: number, limit: number}>}
   */
  async findByPlantInternalId(plantInternalId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      ActionLogModel.find({ plantInternalId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActionLogModel.countDocuments({ plantInternalId }),
    ]);
    return { logs, total, page, limit };
  }

  /**
   * Finds action logs by user UUID with pagination
   * @param {string} userUUID - UUID of the user
   * @param {Object} [options] - Optional pagination parameters
   * @param {number} [options.page=1] - Page number (1-based)
   * @param {number} [options.limit=20] - Items per page
   * @returns {Promise<{logs: Array, total: number, page: number, limit: number}>}
   */
  async findByUserUUID(userUUID, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      ActionLogModel.find({ userUUID })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActionLogModel.countDocuments({ userUUID }),
    ]);
    return { logs, total, page, limit };
  }

  /**
   * Finds action logs by plant internal ID and action type with pagination
   * @param {number} plantInternalId - Internal ID of the plant
   * @param {string} actionType - Type of action to filter by
   * @param {Object} [options] - Optional pagination parameters
   * @param {number} [options.page=1] - Page number (1-based)
   * @param {number} [options.limit=20] - Items per page
   * @returns {Promise<{logs: Array, total: number, page: number, limit: number}>}
   */
  async findByType(plantInternalId, actionType, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      ActionLogModel.find({ plantInternalId, actionType })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActionLogModel.countDocuments({ plantInternalId, actionType }),
    ]);
    return { logs, total, page, limit };
  }

  /**
   * Returns the most recent action logs for a plant
   * @param {string} plantUUID - UUID of the plant
   * @param {number} [last=5] - Number of recent logs to fetch
   * @returns {Promise<Array>} Array of recent log documents
   */
  async getRecent(plantUUID, last = 5) {
    return await ActionLogModel.find({ plantUUID })
      .sort({ createdAt: -1 })
      .limit(last)
      .lean();
  }

  /**
   * Counts total action logs for a plant
   * @param {string} plantUUID - UUID of the plant
   * @returns {Promise<number>} Total log count
   */
  async countByPlantUUID(plantUUID) {
    return await ActionLogModel.countDocuments({ plantUUID });
  }

  /**
   * Deletes all action logs for a plant
   * @param {string} plantUUID - UUID of the plant
   * @returns {Promise<number>} Number of deleted documents
   */
  async deleteByPlantUUID(plantUUID) {
    const result = await ActionLogModel.deleteMany({ plantUUID });
    return result.deletedCount;
  }

  /**
   * Deletes action logs for a plant older than a given date
   * @param {string} plantUUID - UUID of the plant
   * @param {Date|string} date - Cutoff date; logs older than this are deleted
   * @returns {Promise<number>} Number of deleted documents
   */
  async deleteOlderThan(plantUUID, date) {
    const cutoff = new Date(date);
    const result = await ActionLogModel.deleteMany({
      plantUUID,
      createdAt: { $lt: cutoff },
    });
    return result.deletedCount;
  }
}

export default ActionLogRepository;
