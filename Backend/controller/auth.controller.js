// controllers/authController.js
//get the instance 
import { authService } from "./../shared/container.js";
import { UserDTO } from '../dto/user.dto.js';

// =========================
// SIGNUP
// =========================
export async function signup(req, res, next) {
  try {
    const validatedUser = UserDTO.parse(body); // add dto validation layer
    
    const { name, email, password, location } = validatedUser; 

    const result = await authService.signup({
      name,
      email,
      password,
      location
    });

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

// =========================
// LOGIN
// =========================
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const result = await authService.login({
      email,
      password,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// =========================
// LOGOUT
// =========================
export async function logout(req, res, next) {
  try {
    const internalId = req.user.internalId;

    const result = await authService.logout(internalId);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// =========================
// REFRESH TOKEN
// =========================
export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;

    const tokens = await authService.refresh(refreshToken);

    return res.status(200).json(tokens);
  } catch (error) {
    next(error);
  }
}