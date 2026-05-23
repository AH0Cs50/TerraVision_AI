import { tokenService } from "../shared/container.js";

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  const decoded = tokenService.verifyAccessToken(token);

  if (!decoded) {
    return res.status(403).json({ message: "Invalid token" });
  }

  req.user = decoded;
  next();
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Forbidden: insufficient permissions" });
    }

    next();
  };
};
