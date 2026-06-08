import RouteError from "../shared/util/RouteError.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";
import HttpResponse from "../shared/util/HttpResponse.js";

export function errorHandler(err, req, res, next) {
  console.error("Error from middleware:", err);

  if (err.name === "TokenExpiredError") {
    return res
      .status(401)
      .json(
        HttpResponse.error(
          "Access token expired",
          HttpStatusCodes.UNAUTHORIZED,
        ),
      );
  }

  if (err.name === "JsonWebTokenError") {
    return res
      .status(401)
      .json(HttpResponse.error("Invalid token", HttpStatusCodes.UNAUTHORIZED));
  }

  if (err instanceof RouteError) {
    const response = HttpResponse.error(err.message, err.statusCode);

    if (err.details) {
      response.details = err.details;
    }

    return res.status(err.statusCode).json(response);
  }

  return res
    .status(500)
    .json(
      HttpResponse.error(
        "Internal Server Error",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
      ),
    );
}
