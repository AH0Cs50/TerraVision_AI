import UserRepository from "../repositories/user.repository.js";
import { RouteError } from "../shared/uitl/routeError.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";

class UserService {
  
  // ==========================
  // Get user by UUID
  // ==========================
  async findByUUID(uuid) {
    const user = await UserRepository.findByUUID(uuid);

    if (!user) {
      throw new RouteError(
        HttpStatusCodes.NOT_FOUND,
        "User not found"
      );
    }

    return user;
  }

  // ==========================
  // Get user by internal ID
  // ==========================
  async findByInternalId(internalId) {
    const user = await UserRepository.findByInternalId(internalId);

    if (!user) {
      throw new RouteError(
        HttpStatusCodes.NOT_FOUND,
        "User not found"
      );
    }

    return user;
  }

  // ==========================
  // Get user by email
  // ==========================
  async findByEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await UserRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw new RouteError(
        HttpStatusCodes.NOT_FOUND,
        "User not found"
      );
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
        "Email and password are required"
      );
    }

    const existingUser = await UserRepository.findByEmail(data.email);

    if (existingUser) {
      throw new RouteError(
        HttpStatusCodes.CONFLICT,
        "Email already in use"
      );
    }

    return await UserRepository.createUser({
      ...data,
      email: data.email.toLowerCase().trim(),
    });
  }

  // ==========================
  // Refresh token
  // ==========================
  async setRefreshToken(internalId, token) {
    await this._ensureUserExists(internalId);
    return await UserRepository.updateRefreshToken(internalId, token);
  }

  // ==========================
  // Logout (clear token)
  // ==========================
  async clearRefreshToken(internalId) {
    await this._ensureUserExists(internalId);
    return await UserRepository.updateRefreshToken(internalId, null);
  }

  // ==========================
  // Verify user
  // ==========================
  async verifyUser(internalId) {
    await this._ensureUserExists(internalId);
    return await UserRepository.verifyUser(internalId);
  }

  // ==========================
  // Delete user
  // ==========================
  async deleteUser(internalId) {
    await this._ensureUserExists(internalId);
    return await UserRepository.deleteByInternalId(internalId);
  }

  // ==========================
  // Private helper
  // ==========================
  async _ensureUserExists(internalId) {
    const user = await UserRepository.findByInternalId(internalId);

    if (!user) {
      throw new RouteError(
        HttpStatusCodes.NOT_FOUND,
        "User not found"
      );
    }

    return user;
  }
}

export default UserService;