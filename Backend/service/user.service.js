import crypto from "crypto";
import RouteError from "../shared/util/RouteError.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";

/**
 * @description Manages user data operations including CRUD, authentication
 * helpers (refresh tokens, email tokens, verification), and location queries.
 * Delegates persistence to an injected repository.
 */
class UserService {
  constructor(Repository = null) {
    this.UserRepository = Repository;
  }

  /**
   * @description Retrieves a user by their UUID.
   * @param {string} uuid - User UUID
   * @returns {Promise<Object>} User document
   * @throws {RouteError} NOT_FOUND if no user matches
   */
  async findByUUID(uuid) {
    const user = await this.UserRepository.findByUUID(uuid);

    if (!user) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "User not found");
    }

    return user;
  }

  /**
   * @description Retrieves a user by their internal numeric ID.
   * @param {number} internalId - Internal user ID
   * @returns {Promise<Object>} User document
   * @throws {RouteError} NOT_FOUND if no user matches
   */
  async findByInternalId(internalId) {
    const user = await this.UserRepository.findByInternalId(internalId);

    if (!user) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "User not found");
    }

    return user;
  }

  /**
   * @description Retrieves a user by their email (case-insensitive, trimmed).
   * @param {string} email - User email
   * @returns {Promise<Object>} User document
   * @throws {RouteError} NOT_FOUND if no user matches
   */
  async findByEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.UserRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "User not found");
    }

    return user;
  }

  /**
   * @description Creates a new user record. Validates required fields and
   * checks for duplicate email before persisting.
   * @param {Object} data - User creation payload
   * @param {string} data.email - User email
   * @param {string} data.password - Hashed password
   * @returns {Promise<Object>} Created user document
   * @throws {RouteError} BAD_REQUEST if email/password missing, CONFLICT if email exists
   */
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

  /**
   * @description Stores or clears the refresh token for a user.
   * @param {number} internalId - Internal user ID
   * @param {string|null} token - Refresh token value (null to clear)
   * @returns {Promise<Object>} Updated user document
   */
  async setRefreshToken(internalId, token) {
    await this._ensureUserExists(internalId);
    return await this.UserRepository.updateRefreshToken(internalId, token);
  }

  /**
   * @description Generates a cryptographically random email verification
   * token and stores it against the user.
   * @param {string} userUUID - User UUID
   * @returns {Promise<string>} Generated token
   */
  async setEmailToken(userUUID) {
    const user = await this.findByUUID(userUUID);
    const token = crypto.randomBytes(32).toString("hex");
    await this.UserRepository.updateEmailToken(user.internalId, token);
    return token;
  }

  /**
   * @description Clears the stored refresh token, effectively logging out
   * the user.
   * @param {number} internalId - Internal user ID
   * @returns {Promise<Object>} Updated user document
   */
  async clearRefreshToken(internalId) {
    await this._ensureUserExists(internalId);
    return await this.UserRepository.updateRefreshToken(internalId, null);
  }

  /**
   * @description Marks a user as verified.
   * @param {number} internalId - Internal user ID
   * @returns {Promise<Object>} Updated user document
   */
  async verifyUser(internalId) {
    await this._ensureUserExists(internalId);
    return await this.UserRepository.verifyUser(internalId);
  }

  /**
   * @description Updates user profile fields. Blocks modification of
   * sensitive fields (password, role, internalId, uuid).
   * @param {string} userUUID - User UUID
   * @param {Object} data - Fields to update
   * @returns {Promise<Object>} Updated user document
   * @throws {RouteError} NOT_FOUND if user does not exist
   */
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

  /**
   * @description Verifies a user's email using a verification token.
   * Invalidates the token after successful verification.
   * @param {string} token - Email verification token
   * @returns {Promise<{message: string}>}
   * @throws {RouteError} BAD_REQUEST if token is invalid or expired
   */
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

  /**
   * @description Returns the email address and verification status for a user.
   * @param {string} userUUID - User UUID
   * @returns {Promise<{email: string, isVerified: boolean}>}
   */
  async getEmailStatus(userUUID) {
    const user = await this.findByUUID(userUUID);
    return { email: user.email, isVerified: user.isVerified ?? false };
  }

  /**
   * @description Deletes a user by their UUID.
   * @param {string} userUUID - User UUID
   * @returns {Promise<number>} Number of deleted documents
   * @throws {RouteError} NOT_FOUND if no user matches
   */
  async deleteUser(userUUID) {
    const deletedCount = await this.UserRepository.deleteByUUID(userUUID);
    if (deletedCount === 0)
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "User not found");
    return deletedCount;
  }

  /**
   * @description Returns the stored location for a user.
   * @param {string} userUUID - User UUID
   * @returns {Promise<Object|null>} User's location object or null
   */
  async getUserLocation(userUUID) {
    const User = await this.findByUUID(userUUID);
    return User.location;
  }

  /**
   * @private
   * @description Ensures a user exists by their internal ID. Throws if not found.
   * @param {number} internalId - Internal user ID
   * @returns {Promise<Object>} User document
   * @throws {RouteError} NOT_FOUND if no user matches
   */
  async _ensureUserExists(internalId) {
    const user = await this.UserRepository.findByInternalId(internalId);

    if (!user) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "User not found");
    }

    return user;
  }
}

export default UserService;
