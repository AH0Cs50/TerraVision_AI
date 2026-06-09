import RouteError from "../shared/util/RouteError.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";

/**
 * @description Handles user authentication operations including signup, login,
 * logout, and token refresh. Delegates token management, password hashing,
 * and user persistence to injected dependencies.
 */
class AuthService {
  constructor(tokenService, userService, passwordHasher) {
    this.tokenService = tokenService;
    this.userService = userService;
    this.passwordHasher = passwordHasher;
  }

  /**
   * @description Registers a new user. Checks for duplicate email, hashes the
   * password, creates the user, and returns JWT token pair.
   * @param {Object} params
   * @param {string} params.name - Display name
   * @param {string} params.email - User email (used as unique identifier)
   * @param {string} params.password - Raw password (hashed before storage)
   * @param {string} [params.location] - Optional user location
   * @returns {Promise<{user: {uuid: string, name: string, email: string, location: string}, tokens: {accessToken: string, refreshToken: string}}>}
   * @throws {RouteError} CONFLICT if email already exists
   */
  async signup({ name, email, password, location }) {
    let existingUser;
    try {
      existingUser = await this.userService.findByEmail(email);
    } catch {
      existingUser = null;
    }

    if (existingUser) {
      throw new RouteError(HttpStatusCodes.CONFLICT, "Email already exists");
    }

    //security action
    const hashedPassword = await this.passwordHasher.hash(password);

    const user = await this.userService.createUser({
      name,
      email,
      password: hashedPassword,
      location,
    });

    const payload = { uuid: user.uuid, email: user.email, role: user.role };

    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);

    await this.userService.setRefreshToken(user.internalId, refreshToken);
    //set email token here to user to verify their email

    return {
      user: {
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        location: user.location,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * @description Authenticates a user by email and password. Returns JWT
   * token pair on success.
   * @param {Object} params
   * @param {string} params.email - User email
   * @param {string} params.password - Raw password
   * @returns {Promise<{user: {uuid: string, name: string, email: string}, tokens: {accessToken: string, refreshToken: string}}>}
   * @throws {RouteError} UNAUTHORIZED if credentials are invalid
   */
  async login({ email, password }) {
    const user = await this.userService.findByEmail(email);

    const isValid = await this.passwordHasher.compare(password, user.password);

    if (!isValid) {
      throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Invalid credentials");
    }

    const payload = { uuid: user.uuid, email: user.email, role: user.role };

    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);

    await this.userService.setRefreshToken(user.internalId, refreshToken);

    return {
      user: {
        uuid: user.uuid,
        name: user.name,
        email: user.email,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * @description Logs out a user by clearing their stored refresh token.
   * @param {string} userUUID - UUID of the user to log out
   * @returns {Promise<{message: string}>}
   * @throws {RouteError} NOT_FOUND if user does not exist
   */
  async logout(userUUID) {
    const user = await this.userService.findByUUID(userUUID);
    await this.userService.clearRefreshToken(user.internalId);

    return {
      message: "Logged out successfully",
    };
  }

  /**
   * @description Verifies a refresh token, validates it against the stored
   * value, and issues a new JWT token pair (token rotation).
   * @param {string} refreshToken - The refresh token to validate and rotate
   * @returns {Promise<{accessToken: string, refreshToken: string}>}
   * @throws {RouteError} UNAUTHORIZED if token is invalid or does not match
   */
  async refresh(refreshToken) {
    const decoded = this.tokenService.verifyRefreshToken(refreshToken);

    const user = await this.userService.findByUUID(decoded.uuid);

    if (!user || user.refreshToken !== refreshToken) {
      throw new RouteError(
        HttpStatusCodes.UNAUTHORIZED,
        "Refresh token invalid",
      );
    }

    const payload = {
      uuid: user.uuid,
      role: user.role,
    };

    const newAccessToken = this.tokenService.generateAccessToken(payload);
    const newRefreshToken = this.tokenService.generateRefreshToken(payload);

    await this.userService.setRefreshToken(user.internalId, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}

export default AuthService;
