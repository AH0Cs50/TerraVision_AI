import { tokenService } from "../shared/container.js";
import HttpResponse from "../shared/util/HttpResponse.js";
import { HttpStatusCodes } from "../shared/util/HttpStatusCodes.js";
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(HttpStatusCodes.UNAUTHORIZED)
      .json(HttpResponse.error("Unauthorized", HttpStatusCodes.UNAUTHORIZED));
  }

  const token = authHeader.split(" ")[1];
  const decoded = tokenService.verifyAccessToken(token);

  if (!decoded) {
    return res
      .status(HttpStatusCodes.FORBIDDEN)
      .json(HttpResponse.error("Invalid token", HttpStatusCodes.FORBIDDEN));
  }

  req.user = decoded;
  next();
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(HttpStatusCodes.UNAUTHORIZED)
        .json(HttpResponse.error("Unauthorized", HttpStatusCodes.UNAUTHORIZED));
    }

    if (!roles.includes(req.user.role)) {
      return res
        .status(HttpStatusCodes.FORBIDDEN)
        .json(
          HttpResponse.error(
            "Forbidden: insufficient permissions",
            HttpStatusCodes.FORBIDDEN,
          ),
        );
    }

    next();
  };
};
