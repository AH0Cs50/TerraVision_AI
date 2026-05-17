import db from "../shared/db/index.js";
import { createUserModel } from "../model/user.model.js";

class UserRepository {
  // ==========================
  // Create User
  // ==========================
  async createUser(data) {
    const user = createUserModel(data); // validate + build
    return await db.users.insert(user); // persist
  }

  // ==========================
  // Find by UUID
  // ==========================
  async findByUUID(uuid) {
    return await db.users.findOne({ uuid });
  }

  // ==========================
  // Find by internalId
  // ==========================
  async findByInternalId(internalId) {
    return await db.users.findOne({ internalId });
  }

  // ==========================
  // Find by Email
  // ==========================
  async findByEmail(email) {
    return await db.users.findOne({
      email: email.toLowerCase(),
    });
  }

  // ==========================
  // Update by internalId
  // ==========================
  async updateByInternalId(internalId, data) {
    data.updatedAt = new Date();

    await db.users.update({ internalId }, { $set: data });

    return this.findByInternalId(internalId);
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
  // Delete User
  // ==========================
  async deleteByInternalId(internalId) {
    return await db.users.remove({ internalId });
  }
}

export default UserRepository;
