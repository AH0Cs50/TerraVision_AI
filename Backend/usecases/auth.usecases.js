import User from "../entity/user.entity.js";
import RouteError from "../shared/util/RouteError.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";
import { userRepo, tokenService, passHasher } from "../shared/container.js";

export async function signup({ name, email, password, location }) {
  const existing = await userRepo.findByEmail(email);
  if (existing) {
    throw new RouteError(HttpStatusCodes.CONFLICT, "Email already exists");
  }

  const hashedPassword = await passHasher.hash(password);
  const rawUser = await userRepo.createUser({
    name,
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    location,
  });
  const user = new User(rawUser);

  const payload = { uuid: user.uuid, email: user.email, role: user.role };
  const accessToken = tokenService.generateAccessToken(payload);
  const refreshToken = tokenService.generateRefreshToken(payload);

  user.setRefreshToken(refreshToken);
  await userRepo.updateRefreshToken(user.internalId, user.getRefreshToken());

  return {
    user: user.toSafeObject(),
    tokens: { accessToken, refreshToken },
  };
}

export async function login({ email, password }) {
  const rawUser = await userRepo.findByEmail(email);
  if (!rawUser) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "User not found");
  }

  const user = new User(rawUser);
  const isValid = await passHasher.compare(password, user.getPassword());
  if (!isValid) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Invalid credentials");
  }

  const payload = { uuid: user.uuid, email: user.email, role: user.role };
  const accessToken = tokenService.generateAccessToken(payload);
  const refreshToken = tokenService.generateRefreshToken(payload);

  user.setRefreshToken(refreshToken);
  await userRepo.updateRefreshToken(user.internalId, user.getRefreshToken());

  return {
    user: user.toSafeObject(),
    tokens: { accessToken, refreshToken },
  };
}

export async function logout(userUUID) {
  const rawUser = await userRepo.findByUUID(userUUID);
  if (!rawUser) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "User not found");
  }

  const user = new User(rawUser);
  user.clearRefreshToken();
  await userRepo.updateRefreshToken(user.internalId, user.getRefreshToken());

  return { message: "Logged out successfully" };
}

export async function refresh(refreshToken) {
  const decoded = tokenService.verifyRefreshToken(refreshToken);
  const rawUser = await userRepo.findByUUID(decoded.uuid);
  if (!rawUser || rawUser.refreshToken !== refreshToken) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Refresh token invalid");
  }

  const user = new User(rawUser);
  const payload = { uuid: user.uuid, role: user.role };
  const newAccessToken = tokenService.generateAccessToken(payload);
  const newRefreshToken = tokenService.generateRefreshToken(payload);

  user.setRefreshToken(newRefreshToken);
  await userRepo.updateRefreshToken(user.internalId, user.getRefreshToken());

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
