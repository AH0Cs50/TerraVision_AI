import RouteError from "../shared/util/RouteError.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";

class UserService {
  constructor(Repository = null) {
    this.UserRepository = Repository;
  }

  // ==========================
  // Get user by UUID
  // ==========================
  async findByUUID(uuid) {
    const user = await this.UserRepository.findByUUID(uuid);

    if (!user) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "User not found");
    }

    return user;
  }

  // ==========================
  // Get user by internal ID
  // ==========================
  async findByInternalId(internalId) {
    const user = await this.UserRepository.findByInternalId(internalId);

    if (!user) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "User not found");
    }

    return user;
  }

  // ==========================
  // Get user by email
  // ==========================
  async findByEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.UserRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "User not found");
    }

    return user;
  }

  // ==========================
  // Create user
  // ==========================
  async createUser(data) {
    // basic service-level validation (beyond schema)
    if (!data?.email || !data?.password) {
      throw new RouteError(
        HttpStatusCodes.BAD_REQUEST,
        "Email and password are required",
      );
    }

    const existingUser = await this.UserRepository.findByEmail(data.email);

    if (existingUser) {
      throw new RouteError(HttpStatusCodes.CONFLICT, "Email already in use");
    }

    return await this.UserRepository.createUser({
      ...data,
      email: data.email.toLowerCase().trim(),
    });
  }

  // ==========================
  // Refresh token
  // ==========================
  async setRefreshToken(internalId, token) {
    await this._ensureUserExists(internalId);
    return await this.UserRepository.updateRefreshToken(internalId, token);
  }

  // =============================
  // Email token
  // =============================

  async setEmailToken(internalId) {
    await this._ensureUserExists(internalId);
    const token = ""; //generate email token here
    return await this.UserRepository.updateEmailToken(internalId, token);
  }

  // ==========================
  // Logout (clear token)
  // ==========================
  async clearRefreshToken(internalId) {
    await this._ensureUserExists(internalId);
    return await this.UserRepository.updateRefreshToken(internalId, null);
  }

  // ==========================
  // Verify user
  // ==========================
  async verifyUser(internalId) {
    await this._ensureUserExists(internalId);
    return await this.UserRepository.verifyUser(internalId);
  }

  // ==========================
  // Delete user
  // ==========================
  async deleteUser(internalId) {
    await this._ensureUserExists(internalId);
    return await this.UserRepository.deleteByInternalId(internalId);
  }

  // ==========================
  // Private helper
  // ==========================
  async _ensureUserExists(internalId) {
    const user = await this.UserRepository.findByInternalId(internalId);

    if (!user) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "User not found");
    }

    return user;
  }
}

export default UserService;
