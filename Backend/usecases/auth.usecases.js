import User from "../entity/user.entity.js";
import RouteError from "../shared/util/RouteError.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";
import { userRepo, tokenService, passHasher } from "../shared/container.js";

/**
 * Registers a new user account
 * @param {{ name: string, email: string, password: string, location?: object }} data - User registration data
 * @returns {{ user: object, tokens: { accessToken: string, refreshToken: string } }} Created user and JWT tokens
 * @throws {RouteError} 409 if email already exists
 */
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

/**
 * Authenticates a user with email and password
 * @param {{ email: string, password: string }} credentials - Login credentials
 * @returns {{ user: object, tokens: { accessToken: string, refreshToken: string } }} Authenticated user and JWT tokens
 * @throws {RouteError} 404 if user not found
 * @throws {RouteError} 401 if invalid credentials
 */
export async function login({ email, password }) {
  // 1. Lookup user by email
  const rawUser = await userRepo.findByEmail(email);
  if (!rawUser) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "User not found");
  }

  // 2. Verify password
  const user = new User(rawUser);
  const isValid = await passHasher.compare(password, user.getPassword());
  if (!isValid) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Invalid credentials");
  }

  // 3. Generate JWT token pair
  const payload = { uuid: user.uuid, email: user.email, role: user.role };
  const accessToken = tokenService.generateAccessToken(payload);
  const refreshToken = tokenService.generateRefreshToken(payload);

  // 4. Store hashed refresh token for rotation
  user.setRefreshToken(refreshToken);
  await userRepo.updateRefreshToken(user.internalId, user.getRefreshToken());

  // 5. Return safe user + tokens
  return {
    user: user.toSafeObject(),
    tokens: { accessToken, refreshToken },
  };
}

/**
 * Logs out a user by clearing their refresh token
 * @param {string} userUUID - User's UUID
 * @returns {{ message: string }} Success message
 * @throws {RouteError} 404 if user not found
 */
export async function logout(userUUID) {
  // 1. Lookup user by UUID
  const rawUser = await userRepo.findByUUID(userUUID);
  if (!rawUser) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "User not found");
  }

  // 2. Clear refresh token from entity
  const user = new User(rawUser);
  user.clearRefreshToken();

  // 3. Persist cleared token
  await userRepo.updateRefreshToken(user.internalId, user.getRefreshToken());

  return { message: "Logged out successfully" };
}

/**
 * Rotates an expired access token using a refresh token
 * @param {string} refreshToken - JWT refresh token
 * @returns {{ accessToken: string, refreshToken: string }} New JWT token pair
 * @throws {RouteError} 401 if refresh token is invalid or mismatched
 */
/**
 * Changes a user's password after verifying the current password
 * @param {string} userUUID - User's UUID (from auth middleware)
 * @param {string} currentPassword - The user's current password
 * @param {string} newPassword - The new password to set
 * @returns {{ message: string }} Success message
 * @throws {RouteError} 404 if user not found
 * @throws {RouteError} 401 if current password is incorrect
 */
export async function changePassword(userUUID, currentPassword, newPassword) {
  const rawUser = await userRepo.findByUUID(userUUID);
  if (!rawUser) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "User not found");
  }

  const user = new User(rawUser);
  const isValid = await passHasher.compare(currentPassword, user.getPassword());
  if (!isValid) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Current password is incorrect");
  }

  const hashed = await passHasher.hash(newPassword);
  user.changePassword(hashed);
  await userRepo.updateByUUID(user.uuid, { password: user.getPassword() });

  user.clearRefreshToken();
  await userRepo.updateRefreshToken(user.internalId, user.getRefreshToken());

  return { message: "Password changed successfully" };
}

export async function refresh(refreshToken) {
  // 1. Verify refresh token and lookup user
  const decoded = tokenService.verifyRefreshToken(refreshToken);
  const rawUser = await userRepo.findByUUID(decoded.uuid);
  if (!rawUser || rawUser.refreshToken !== refreshToken) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Refresh token invalid");
  }

  // 2. Generate new token pair
  const user = new User(rawUser);
  const payload = { uuid: user.uuid, role: user.role };
  const newAccessToken = tokenService.generateAccessToken(payload);
  const newRefreshToken = tokenService.generateRefreshToken(payload);

  // 3. Persist new refresh token for rotation
  user.setRefreshToken(newRefreshToken);
  await userRepo.updateRefreshToken(user.internalId, user.getRefreshToken());

  // 4. Return new token pair
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
