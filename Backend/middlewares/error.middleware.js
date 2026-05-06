import { RouteError } from "../shared/util/RouteError";
import HttpStatusCodes from "../shared/util/HttpStatusCodes";
import HttpResponse from '../shared/util/HttpResponse'


export function errorHandler(err, req, res, next) {
  console.error(err); // log the erorr 

  // Handle known operational errors
  if (err instanceof RouteError) {
    return res
      .status(err.statusCode)
      .json(HttpResponse.error(err.message, err.statusCode));
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