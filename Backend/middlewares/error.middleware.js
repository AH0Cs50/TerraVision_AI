import RouteError from "../shared/util/RouteError.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";
import HttpResponse from '../shared/util/HttpResponse.js'


export function errorHandler(err, req, res, next) {
  console.error(err); // log the error 

  // Handle known operational errors
  if (err instanceof RouteError) {
    const response = HttpResponse.error(err.message, err.statusCode);
    if (err.details) {
      response.details = err.details;
    }
    return res
      .status(err.statusCode)
      .json(response);
  }

  // Unknown errors
  return res
    .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
    .json(
      HttpResponse.error(
        "Internal Server Error",
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    );
}