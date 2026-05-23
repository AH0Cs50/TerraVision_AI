import { userService, emailService } from "../shared/container.js";
import { HttpStatusCodes } from "../shared/util/HttpStatusCodes.js";

// =========================
// GET /:id  — get user by UUID
// =========================
export async function getUser(req, res, next) {
  try {
    const { id } = req.params;

    if (req.user.uuid !== id && req.user.role !== "admin") {
      return res
        .status(HttpStatusCodes.FORBIDDEN)
        .json({ message: "Forbidden" });
    }

    const user = await userService.findByUUID(id);

    if (!user) {
      return res
        .status(HttpStatusCodes.NOT_FOUND)
        .json({ message: "User not found" });
    }

    const { uuid, name, email, role, isverified, location, createdAt } = user;
    return res.status(HttpStatusCodes.OK).json({
      success: true,
      message: "User retrieved successfully",
      data: { uuid, name, email, role, isverified, location, createdAt },
    });
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
        .json({ message: "Forbidden" });
    }

    const updated = await userService.updateUser(id, req.body);
    const { uuid, name, email, role, isverified, location, createdAt } =
      updated;
    return res.status(HttpStatusCodes.OK).json({
      success: true,
      message: "User updated successfully",
      data: { uuid, name, email, role, isverified, location, createdAt },
    });
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

    if (req.user.role !== "admin") {
      return res
        .status(HttpStatusCodes.FORBIDDEN)
        .json({ message: "Admin only" });
    }

    await userService.deleteUser(id);
    return res.status(HttpStatusCodes.OK).json({
      success: true,
      message: "User deleted successfully",
    });
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

    await emailService.sendVerifyEmail(user.email, token);
    return res.status(HttpStatusCodes.OK).json({
      success: true,
      message: "Verification email sent",
    });
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
        .json({ message: "Token is required" });
    }

    const result = await userService.verifyEmailByToken(token);
    return res.status(HttpStatusCodes.OK).json({
      success: true,
      message: "Email verified successfully",
      data: result,
    });
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
    return res.status(HttpStatusCodes.OK).json({
      success: true,
      message: "Email verification status retrieved successfully",
      data: status,
    });
  } catch (error) {
    next(error);
  }
}
