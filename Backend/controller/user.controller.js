import { userService, emailService } from "../shared/container.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";
import HttpResponse from "../shared/util/HttpResponse.js";

// =========================
// GET /:id  — get user by UUID
// =========================
export async function getUser(req, res, next) {
  try {
    const { id } = req.params;

    if (req.user.uuid !== id && req.user.role !== "admin") {
      return res
        .status(HttpStatusCodes.FORBIDDEN)
        .json(HttpResponse.error("Forbidden", HttpStatusCodes.FORBIDDEN));
    }

    const user = await userService.findByUUID(id);

    if (!user) {
      return res
        .status(HttpStatusCodes.NOT_FOUND)
        .json(HttpResponse.error("User not found", HttpStatusCodes.NOT_FOUND));
    }

    const { uuid, name, email, role, isverified, location, createdAt } = user;
    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("User retrieved successfully", { uuid, name, email, role, isverified, location, createdAt }));
  } catch (error) {
    next(error);
  }
}

// =========================
// PUT /:id  — update user
// =========================
export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;

    if (req.user.uuid !== id && req.user.role !== "admin") {
      return res
        .status(HttpStatusCodes.FORBIDDEN)
        .json(HttpResponse.error("Forbidden", HttpStatusCodes.FORBIDDEN));
    }

    const updated = await userService.updateUser(id, req.body);
    const { uuid, name, email, role, isverified, location, createdAt } =
      updated;
    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("User updated successfully", { uuid, name, email, role, isverified, location, createdAt }));
  } catch (error) {
    next(error);
  }
}

// =========================
// DELETE /:id  — delete user (admin only)
// =========================
export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    if (req.user.uuid !== id && req.user.role !== "admin") {
      return res
        .status(HttpStatusCodes.FORBIDDEN)
        .json(HttpResponse.error("Forbidden", HttpStatusCodes.FORBIDDEN));
    }

    await userService.deleteUser(id);
    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("User deleted successfully"));
  } catch (error) {
    next(error);
  }
}

// =========================
// POST /email  — send verification email
// =========================
export async function sendVerificationEmail(req, res, next) {
  try {
    const token = await userService.setEmailToken(req.user.uuid);
    const user = await userService.findByUUID(req.user.uuid);

    try {
      await emailService.sendVerifyEmail(user.email, token);
    } catch (_emailErr) {
      // Email delivery failure is non-fatal
    }

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Verification email sent"));
  } catch (error) {
    next(error);
  }
}

// =========================
// GET /email/verify  — verify email with token
// =========================
export async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json(HttpResponse.error("Token is required", HttpStatusCodes.BAD_REQUEST));
    }

    const result = await userService.verifyEmailByToken(token);
    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Email verified successfully", result));
  } catch (error) {
    next(error);
  }
}

// =========================
// GET /email  — check email verification status
// =========================
export async function getEmailStatus(req, res, next) {
  try {
    const status = await userService.getEmailStatus(req.user.uuid);
    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Email verification status retrieved successfully", status));
  } catch (error) {
    next(error);
  }
}
