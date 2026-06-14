import User from "../entity/user.entity.js";
import crypto from "crypto";
import RouteError from "../shared/util/RouteError.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";
import { userRepo, emailService } from "../shared/container.js";

export async function getUser(uuid, user) {
  if (user.uuid !== uuid && user.role !== "admin") {
    throw new RouteError(HttpStatusCodes.FORBIDDEN, "Forbidden");
  }
  const rawUser = await userRepo.findByUUID(uuid);
  if (!rawUser) return null;
  return new User(rawUser).toSafeObject();
}

export async function updateUser(uuid, data, user) {
  if (user.uuid !== uuid && user.role !== "admin") {
    throw new RouteError(HttpStatusCodes.FORBIDDEN, "Forbidden");
  }
  const allowed = { ...data };
  delete allowed.password;
  delete allowed.role;
  delete allowed.internalId;
  delete allowed.uuid;

  const updated = await userRepo.updateByUUID(uuid, allowed);
  if (!updated) return null;
  return new User(updated).toSafeObject();
}

export async function deleteUser(uuid, user) {
  if (user.uuid !== uuid && user.role !== "admin") {
    throw new RouteError(HttpStatusCodes.FORBIDDEN, "Forbidden");
  }
  return await userRepo.deleteByUUID(uuid);
}

export async function sendVerificationEmail(uuid) {
  const rawUser = await userRepo.findByUUID(uuid);
  if (!rawUser) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "User not found");
  }

  const user = new User(rawUser);
  const token = crypto.randomBytes(32).toString("hex");
  await userRepo.updateEmailToken(user.internalId, token);

  try {
    await emailService.sendVerifyEmail(user.email, token);
  } catch (_emailErr) {
  }

  return { message: "Verification email sent" };
}

export async function verifyEmail(token) {
  const rawUser = await userRepo.findByEmailToken(token);
  if (!rawUser) return null;

  await userRepo.verifyUser(rawUser.internalId);
  await userRepo.updateEmailToken(rawUser.internalId, null);

  return { message: "Email verified successfully" };
}

export async function getEmailStatus(uuid) {
  const rawUser = await userRepo.findByUUID(uuid);
  if (!rawUser) return null;

  return { email: rawUser.email, isVerified: rawUser.isVerified ?? false };
}
