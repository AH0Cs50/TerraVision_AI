import RouteError from "../shared/util/RouteError.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";

class AuthService {
  constructor(tokenService, userService, passwordHasher) {
    this.tokenService = tokenService;
    this.userService = userService;
    this.passwordHasher = passwordHasher;
  }

  // =========================
  // SIGNUP
  // =========================
  async signup({ name, email, password, location }) {
    const existingUser = await this.userService.findByEmail(email);

    if (existingUser) {
      throw new RouteError(
        HttpStatusCodes.CONFLICT,
        "Email already exists"
      );
    }
  
    //security action 
    const hashedPassword = await this.passwordHasher.hash(password);

    const user = await this.userService.createUser({
      name,
      email,
      password: hashedPassword,
      location,
    });

    const payload = {
      internalId: user.internalId,
      uuid: user.uuid,
      email: user.email,
    };

    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);

    await this.userService.setRefreshToken(user.internalId, refreshToken);

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

  // =========================
  // LOGIN
  // =========================
  async login({ email, password }) {
    const user = await this.userService.findByEmail(email);

    const isValid = await this.passwordHasher.compare(
      password,
      user.password
    );

    if (!isValid) {
      throw new RouteError(
        HttpStatusCodes.UNAUTHORIZED,
        "Invalid credentials"
      );
    }

    const payload = {
      internalId: user.internalId,
      uuid: user.uuid,
      role: user.role,
    };

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

  // =========================
  // LOGOUT
  // =========================
  async logout(internalId) {
    await this.userService.clearRefreshToken(internalId);

    return {
      message: "Logged out successfully",
    };
  }

  // =========================
  // REFRESH TOKEN
  // =========================
  async refresh(refreshToken) {
    const decoded = this.tokenService.verifyRefreshToken(refreshToken);

    if (!decoded) {
      throw new RouteError(
        HttpStatusCodes.UNAUTHORIZED,
        "Invalid refresh token"
      );
    }

    const user = await this.userService.findByInternalId(decoded.internalId);

    if (!user || user.refreshToken !== refreshToken) {
      throw new RouteError(
        HttpStatusCodes.UNAUTHORIZED,
        "Refresh token invalid"
      );
    }

    const payload = {
      internalId: user.internalId,
      uuid: user.uuid,
      role: user.role,
    };

    const newAccessToken = this.tokenService.generateAccessToken(payload);
    const newRefreshToken = this.tokenService.generateRefreshToken(payload);

    await this.userService.setRefreshToken(
      user.internalId,
      newRefreshToken
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}

export default AuthService;