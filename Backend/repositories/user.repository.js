import { UserModel } from "../model/user.model.js";

class UserRepository {
  // ==========================
  // Create User
  // ==========================
  async createUser(data) {
    const doc = await new UserModel(data).save();
    return doc.toObject();
  }

  // ==========================
  // Find by UUID
  // ==========================
  async findByUUID(uuid) {
    return await UserModel.findOne({ uuid }).lean();
  }

  // ==========================
  // Find by internalId
  // ==========================
  async findByInternalId(internalId) {
    return await UserModel.findOne({ internalId }).lean();
  }

  // ==========================
  // Find by Email
  // ==========================
  async findByEmail(email) {
    return await UserModel.findOne({
      email: email.toLowerCase(),
    }).lean();
  }

  // ==========================
  // Update by internalId
  // ==========================
  async updateByInternalId(internalId, data) {
    data.updatedAt = new Date();

    return await UserModel.findOneAndUpdate(
      { internalId },
      { $set: data },
      { returnDocument: "after" },
    ).lean();
  }

  // ==========================
  // Update Refresh Token
  // ==========================
  async updateRefreshToken(internalId, token) {
    return await this.updateByInternalId(internalId, {
      refreshToken: token,
    });
  }

  // ==========================
  // Update Email Token
  // ==========================
  async updateEmailToken(internalId, token) {
    return await this.updateByInternalId(internalId, {
      emailToken: token,
    });
  }

  // ==========================
  // Verify User
  // ==========================
  async verifyUser(internalId) {
    return await this.updateByInternalId(internalId, {
      isVerified: true,
    });
  }

  // ==========================
  // Find by Email Token
  // ==========================
  async findByEmailToken(token) {
    return await UserModel.findOne({ emailToken: token }).lean();
  }

  // ==========================
  // Update by UUID
  // ==========================
  async updateByUUID(uuid, data) {
    data.updatedAt = new Date();

    return await UserModel.findOneAndUpdate(
      { uuid },
      { $set: data },
      { returnDocument: "after" },
    ).lean();
  }

  // ==========================
  // Delete User
  // ==========================
  async deleteByInternalId(internalId) {
    const result = await UserModel.deleteOne({ internalId });
    return result.deletedCount;
  }

  async deleteByUUID(uuid) {
    const result = await UserModel.deleteOne({ uuid });
    return result.deletedCount;
  }
}

export default UserRepository;
