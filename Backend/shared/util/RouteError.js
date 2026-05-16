// throw inside controller and services
class RouteError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);

    this.name = "RouteError";
    this.statusCode = statusCode;
    this.isOperational = true; // important for production error handling
    this.details = details; // optional additional error details
    Error.captureStackTrace(this, this.constructor);
  }
}

export default RouteError;
