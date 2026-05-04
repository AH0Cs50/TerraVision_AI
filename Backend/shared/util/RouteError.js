
// throw inside controller and services 
class RouteError extends Error {
  
    constructor(statusCode, message) {
      super(message);
  
      this.name = "RouteError";
      this.statusCode = statusCode;
      this.isOperational = true; // important for production error handling
  
      Error.captureStackTrace(this, this.constructor);
    }
}
  
export default RouteError;