import jwt from "jsonwebtoken";
import { jwtConfig } from "../../config/config.js";

/**
 * @description Value object representing the claims embedded in a JWT.
 */
export class TokenPayload {
  /**
   * @param {string} uuid - User UUID
   * @param {string} email - User email
   * @param {string} role - User role (e.g. "user", "admin")
   */
  constructor(uuid, email, role) {
    this.uuid = uuid;
    this.email = email;
    this.role = role;
  }
}

/**
 * @description Generates and verifies JWT access and refresh tokens using
 * secret keys and expiration durations from the application config.
 */
class TokenService {
  /**
   * Injects JWT secrets and expiration durations from application config
   */
  constructor() {
    this.accessSecret = jwtConfig.ACCESS_TOKEN_SECRET;
    this.refreshSecret = jwtConfig.REFRESH_TOKEN_SECRET;
    this.accessExpiresIn = jwtConfig.ACCESS_TOKEN_EXPIRES_IN;
    this.refreshExpiresIn = jwtConfig.REFRESH_TOKEN_EXPIRES_IN;
  }

  /**
   * @description Creates a short-lived JWT access token.
   * @param {Object} payload - Claims to embed in the token
   * @returns {string} Signed JWT string
   */
  generateAccessToken(payload) {
    return jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessExpiresIn,
    });
  }

  /**
   * @description Creates a long-lived JWT refresh token.
   * @param {Object} payload - Claims to embed in the token
   * @returns {string} Signed JWT string
   */
  generateRefreshToken(payload) {
    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshExpiresIn,
    });
  }

  /**
   * @description Verifies and decodes an access token.
   * @param {string} token - JWT access token
   * @returns {Object} Decoded payload
   * @throws {JsonWebTokenError|TokenExpiredError} If invalid or expired
   */
  verifyAccessToken(token) {
    return jwt.verify(token, this.accessSecret);
  }

  /**
   * @description Verifies and decodes a refresh token.
   * @param {string} token - JWT refresh token
   * @returns {Object} Decoded payload
   * @throws {JsonWebTokenError|TokenExpiredError} If invalid or expired
   */
  verifyRefreshToken(token) {
    return jwt.verify(token, this.refreshSecret);
  }
}

export default TokenService;
