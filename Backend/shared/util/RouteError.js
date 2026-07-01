/**
 * Operational error class for controller and service layers.
 * Thrown by use cases and caught by the error middleware to produce a JSON error response.
 */
class RouteError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 404, 400, 500)
   * @param {string} message - Human-readable error message
   * @param {object|null} [details=null] - Optional additional error details
   */
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
