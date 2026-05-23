import jwt from "jsonwebtoken";
import { jwtConfig } from "../../config/config.js";

export class TokenPayload {
  constructor(uuid, email, role) {
    this.uuid = uuid;
    this.email = email;
    this.role = role;
  }
}

class TokenService {
  constructor() {
    this.accessSecret = jwtConfig.ACCESS_TOKEN_SECRET;
    this.refreshSecret = jwtConfig.REFRESH_TOKEN_SECRET;
    this.accessExpiresIn = jwtConfig.ACCESS_TOKEN_EXPIRES_IN;
    this.refreshExpiresIn = jwtConfig.REFRESH_TOKEN_EXPIRES_IN;
  }

  // Generate Access Token (short-lived)
  generateAccessToken(payload) {
    return jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessExpiresIn,
    });
  }

  // Generate Refresh Token (long-lived)
  generateRefreshToken(payload) {
    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshExpiresIn,
    });
  }

  // Verify Access Token
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.accessSecret);
    } catch (err) {
      return err;
    }
  }

  // Verify Refresh Token
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.refreshSecret);
    } catch (err) {
      return err;
    }
  }
}

export default TokenService;
