import * as UserUseCases from "../usecases/user.usecases.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";
import HttpResponse from "../shared/util/HttpResponse.js";

export async function getUser(req, res, next) {
  try {
    const { id } = req.params;
    const user = await UserUseCases.getUser(id, req.user);
    if (!user) {
      return res.status(HttpStatusCodes.NOT_FOUND).json(HttpResponse.error("User not found", HttpStatusCodes.NOT_FOUND));
    }
    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("User retrieved successfully", user));
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await UserUseCases.updateUser(id, req.body, req.user);
    if (!updated) {
      return res.status(HttpStatusCodes.NOT_FOUND).json(HttpResponse.error("User not found", HttpStatusCodes.NOT_FOUND));
    }
    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("User updated successfully", updated));
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const deletedCount = await UserUseCases.deleteUser(id, req.user);
    if (deletedCount === 0) {
      return res.status(HttpStatusCodes.NOT_FOUND).json(HttpResponse.error("User not found", HttpStatusCodes.NOT_FOUND));
    }
    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("User deleted successfully"));
  } catch (error) {
    next(error);
  }
}

export async function sendVerificationEmail(req, res, next) {
  try {
    const result = await UserUseCases.sendVerificationEmail(req.user.uuid);
    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Verification email sent", result));
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json(HttpResponse.error("Token is required", HttpStatusCodes.BAD_REQUEST));
    }
    const result = await UserUseCases.verifyEmail(token);
    if (!result) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json(HttpResponse.error("Invalid or expired verification token", HttpStatusCodes.BAD_REQUEST));
    }
    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Email verified successfully", result));
  } catch (error) {
    next(error);
  }
}

export async function getEmailStatus(req, res, next) {
  try {
    const status = await UserUseCases.getEmailStatus(req.user.uuid);
    if (!status) {
      return res.status(HttpStatusCodes.NOT_FOUND).json(HttpResponse.error("User not found", HttpStatusCodes.NOT_FOUND));
    }
    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Email verification status retrieved successfully", status));
  } catch (error) {
    next(error);
  }
}
