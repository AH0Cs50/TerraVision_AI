import * as AuthUseCases from "../usecases/auth.usecases.js";
import { UserDTO } from "../dto/user.dto.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";
import HttpResponse from "../shared/util/HttpResponse.js";

export async function signup(req, res, next) {
  try {
    const validatedUser = UserDTO.parse(req.body);
    const { name, email, password, location } = validatedUser;
    const result = await AuthUseCases.signup({ name, email, password, location });
    return res.status(HttpStatusCodes.CREATED).json(HttpResponse.success("User created", result, HttpStatusCodes.CREATED));
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await AuthUseCases.login({ email, password });
    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Login successful", result));
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    const result = await AuthUseCases.logout(req.user.uuid);
    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Logged out successfully", result));
  } catch (error) {
    next(error);
  }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const tokens = await AuthUseCases.refresh(refreshToken);
    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Token refreshed", tokens));
  } catch (error) {
    next(error);
  }
}
