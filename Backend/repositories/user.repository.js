import { UserModel } from "../model/user.model.js";

/**
 * @description Data access layer for user documents. Provides CRUD
 * operations plus authentication-token and email-verification helpers
 * against the MongoDB UserModel.
 */
class UserRepository {

  /**
   * @description Creates a new user document.
   * @param {Object} data - User creation payload
   * @returns {Promise<Object>} Created document (plain object)
   */
  async createUser(data) {
    const doc = await new UserModel(data).save();
    return doc.toObject();
  }

  /**
   * @description Finds a user by their UUID.
   * @param {string} uuid - User UUID
   * @returns {Promise<Object|null>}
   */
  async findByUUID(uuid) {
    return await UserModel.findOne({ uuid }).lean();
  }

  /**
   * @description Finds a user by their internal numeric ID.
   * @param {number} internalId - Internal user ID
   * @returns {Promise<Object|null>}
   */
  async findByInternalId(internalId) {
    return await UserModel.findOne({ internalId }).lean();
  }

  /**
   * @description Finds a user by their email (case-insensitive).
   * @param {string} email - User email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    return await UserModel.findOne({
      email: email.toLowerCase(),
    }).lean();
  }

  /**
   * @description Updates a user by their internal ID. Sets updatedAt
   * automatically.
   * @param {number} internalId - Internal user ID
   * @param {Object} data - Fields to update
   * @returns {Promise<Object|null>} Updated document or null
   */
  async updateByInternalId(internalId, data) {
    data.updatedAt = new Date();

    return await UserModel.findOneAndUpdate(
      { internalId },
      { $set: data },
      { returnDocument: "after" },
    ).lean();
  }

  /**
   * @description Stores or clears the refresh token for a user.
   * @param {number} internalId - Internal user ID
   * @param {string|null} token - Refresh token value (null to clear)
   * @returns {Promise<Object|null>} Updated user document
   */
  async updateRefreshToken(internalId, token) {
    return await this.updateByInternalId(internalId, {
      refreshToken: token,
    });
  }

  /**
   * @description Stores or clears the email verification token for a user.
   * @param {number} internalId - Internal user ID
   * @param {string|null} token - Email verification token
   * @returns {Promise<Object|null>} Updated user document
   */
  async updateEmailToken(internalId, token) {
    return await this.updateByInternalId(internalId, {
      emailToken: token,
    });
  }

  /**
   * @description Marks a user's email as verified.
   * @param {number} internalId - Internal user ID
   * @returns {Promise<Object|null>} Updated user document
   */
  async verifyUser(internalId) {
    return await this.updateByInternalId(internalId, {
      isVerified: true,
    });
  }

  /**
   * @description Finds a user by their email verification token.
   * @param {string} token - Email verification token
   * @returns {Promise<Object|null>}
   */
  async findByEmailToken(token) {
    return await UserModel.findOne({ emailToken: token }).lean();
  }

  /**
   * @description Updates a user by their UUID. Sets updatedAt automatically.
   * @param {string} uuid - User UUID
   * @param {Object} data - Fields to update
   * @returns {Promise<Object|null>} Updated document or null
   */
  async updateByUUID(uuid, data) {
    data.updatedAt = new Date();

    return await UserModel.findOneAndUpdate(
      { uuid },
      { $set: data },
      { returnDocument: "after" },
    ).lean();
  }

  /**
   * @description Deletes a user by their internal ID.
   * @param {number} internalId - Internal user ID
   * @returns {Promise<number>} Number of deleted documents (0 or 1)
   */
  async deleteByInternalId(internalId) {
    const result = await UserModel.deleteOne({ internalId });
    return result.deletedCount;
  }

  /**
   * @description Deletes a user by their UUID.
   * @param {string} uuid - User UUID
   * @returns {Promise<number>} Number of deleted documents (0 or 1)
   */
  async deleteByUUID(uuid) {
    const result = await UserModel.deleteOne({ uuid });
    return result.deletedCount;
  }
}

export default UserRepository;
