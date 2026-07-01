/**
 * HTTP status code constants used throughout the application.
 *
 * @constant {number} OK - 200
 * @constant {number} CREATED - 201
 * @constant {number} NO_CONTENT - 204
 * @constant {number} BAD_REQUEST - 400
 * @constant {number} UNAUTHORIZED - 401
 * @constant {number} FORBIDDEN - 403
 * @constant {number} NOT_FOUND - 404
 * @constant {number} CONFLICT - 409
 * @constant {number} INTERNAL_SERVER_ERROR - 500
 * @constant {number} SERVICE_UNAVAILABLE - 503
 */
const HttpStatusCodes = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
  
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
  
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
};
  
export default HttpStatusCodes;
