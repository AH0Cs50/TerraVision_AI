import User from "../entity/user.entity.js";
import crypto from "crypto";
import RouteError from "../shared/util/RouteError.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";
import { userRepo, emailService } from "../shared/container.js";

/**
 * Retrieves a user by UUID with access control
 * @param {string} uuid - Target user's UUID
 * @param {{ uuid: string, role: string }} user - Authenticated user making the request
 * @returns {object|null} User safe object or null if not found
 * @throws {RouteError} 403 if requester is not the target user or an admin
 */
export async function getUser(uuid, user) {
  // 1. Check access permission
  if (user.uuid !== uuid && user.role !== "admin") {
    throw new RouteError(HttpStatusCodes.FORBIDDEN, "Forbidden");
  }
  // 2. Lookup user by UUID
  const rawUser = await userRepo.findByUUID(uuid);
  if (!rawUser) return null;
  // 3. Return safe user object
  return new User(rawUser).toSafeObject();
}

/**
 * Updates a user's profile fields (password, role, internalId, uuid are stripped)
 * @param {string} uuid - Target user's UUID
 * @param {object} data - Fields to update
 * @param {{ uuid: string, role: string }} user - Authenticated user making the request
 * @returns {object|null} Updated user safe object or null if not found
 * @throws {RouteError} 403 if requester is not the target user or an admin
 */
export async function updateUser(uuid, data, user) {
  // 1. Check access permission
  if (user.uuid !== uuid && user.role !== "admin") {
    throw new RouteError(HttpStatusCodes.FORBIDDEN, "Forbidden");
  }
  // 2. Strip protected fields from update data
  const allowed = { ...data };
  delete allowed.password;
  delete allowed.role;
  delete allowed.internalId;
  delete allowed.uuid;

  // 3. Update user in database
  const updated = await userRepo.updateByUUID(uuid, allowed);
  if (!updated) return null;
  // 4. Return safe user object
  return new User(updated).toSafeObject();
}

/**
 * Deletes a user by UUID with access control
 * @param {string} uuid - Target user's UUID
 * @param {{ uuid: string, role: string }} user - Authenticated user making the request
 * @returns {Promise<object>} Deletion result from repo
 * @throws {RouteError} 403 if requester is not the target user or an admin
 */
export async function deleteUser(uuid, user) {
  // 1. Check access permission
  if (user.uuid !== uuid && user.role !== "admin") {
    throw new RouteError(HttpStatusCodes.FORBIDDEN, "Forbidden");
  }
  // 2. Delete user from database
  return await userRepo.deleteByUUID(uuid);
}

/**
 * Generates an email verification token and sends a verification email
 * @param {string} uuid - User's UUID
 * @returns {{ message: string }} Confirmation message
 * @throws {RouteError} 404 if user not found
 */
export async function sendVerificationEmail(uuid) {
  // 1. Lookup user by UUID
  const rawUser = await userRepo.findByUUID(uuid);
  if (!rawUser) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "User not found");
  }

  // 2. Generate verification token
  const user = new User(rawUser);
  const token = crypto.randomBytes(32).toString("hex");

  // 3. Persist token on user record
  await userRepo.updateEmailToken(user.internalId, token);

  // 4. Send verification email (swallow send failures)
  try {
    await emailService.sendVerifyEmail(user.email, token);
  } catch (_emailErr) {
  }

  return { message: "Verification email sent" };
}

/**
 * Verifies a user's email using the verification token
 * @param {string} token - Email verification token
 * @returns {object|null} Success message or null if token invalid
 */
export async function verifyEmail(token) {
  // 1. Lookup user by verification token
  const rawUser = await userRepo.findByEmailToken(token);
  if (!rawUser) return null;

  // 2. Mark user as verified
  await userRepo.verifyUser(rawUser.internalId);
  // 3. Clear verification token
  await userRepo.updateEmailToken(rawUser.internalId, null);

  return { message: "Email verified successfully" };
}

/**
 * Returns the email address and verification status for a user
 * @param {string} uuid - User's UUID
 * @returns {object|null} Object with email and isVerified fields, or null if not found
 */
export async function getEmailStatus(uuid) {
  const rawUser = await userRepo.findByUUID(uuid);
  if (!rawUser) return null;

  return { email: rawUser.email, isVerified: rawUser.isVerified ?? false };
}
