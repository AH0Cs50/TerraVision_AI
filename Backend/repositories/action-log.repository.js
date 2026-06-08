import { ActionLogModel } from "../model/action-log.model.js";

class ActionLogRepository {

  async create(data) {
    const doc = new ActionLogModel(data);
    const saved = await doc.save();
    return saved.toObject();
  }

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

  async getRecent(plantUUID, last = 5) {
    return await ActionLogModel.find({ plantUUID })
      .sort({ createdAt: -1 })
      .limit(last)
      .lean();
  }

  async countByPlantUUID(plantUUID) {
    return await ActionLogModel.countDocuments({ plantUUID });
  }

  async deleteByPlantUUID(plantUUID) {
    const result = await ActionLogModel.deleteMany({ plantUUID });
    return result.deletedCount;
  }

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
