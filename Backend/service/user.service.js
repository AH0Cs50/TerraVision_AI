import crypto from "crypto";
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

  async setEmailToken(userUUID) {
    const user = await this.findByUUID(userUUID);
    const token = crypto.randomBytes(32).toString("hex");
    await this.UserRepository.updateEmailToken(user.internalId, token);
    return token;
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
  // Update user
  // ==========================
  async updateUser(userUUID, data) {
    const allowed = { ...data };
    delete allowed.password;
    delete allowed.role;
    delete allowed.internalId;
    delete allowed.uuid;

    const updated = await this.UserRepository.updateByUUID(userUUID, allowed);
    if (!updated)
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "User not found");
    return updated;
  }

  // ==========================
  // Email verification
  // ==========================
  async verifyEmailByToken(token) {
    const user = await this.UserRepository.findByEmailToken(token);
    if (!user) {
      throw new RouteError(
        HttpStatusCodes.BAD_REQUEST,
        "Invalid or expired verification token",
      );
    }

    await this.UserRepository.verifyUser(user.internalId);
    await this.UserRepository.updateEmailToken(user.internalId, null);

    return { message: "Email verified successfully" };
  }

  async getEmailStatus(userUUID) {
    const user = await this.findByUUID(userUUID);
    return { email: user.email, isVerified: user.isVerified ?? false };
  }

  // ==========================
  // Delete user
  // ==========================
  async deleteUser(userUUID) {
    const deletedCount = await this.UserRepository.deleteByUUID(userUUID);
    if (deletedCount === 0)
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "User not found");
    return deletedCount;
  }

  async getUserLocation(userUUID) {
    const User = await this.findByUUID(userUUID);
    return User.location;
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
