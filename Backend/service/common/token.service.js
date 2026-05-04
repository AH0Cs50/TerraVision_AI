import jwt from 'jsonwebtoken';
import {
  ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRES_IN
} from './../config/config.js';

class TokenService {
  constructor() {
    this.accessSecret = ACCESS_TOKEN_SECRET;
    this.refreshSecret = REFRESH_TOKEN_SECRET;
    this.accessExpiresIn = ACCESS_TOKEN_EXPIRES_IN;
    this.refreshExpiresIn = REFRESH_TOKEN_EXPIRES_IN;
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
      return null;
    }
  }

  // Verify Refresh Token
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.refreshSecret);
    } catch (err) {
      return null;
    }
  }
}

export default TokenService;
