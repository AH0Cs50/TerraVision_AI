/**
 * Standard JSON response builder. All controller responses use these static methods
 * to produce a consistent envelope: { success, message, data?, status }.
 */
class HttpResponse {
  /**
   * Recursively strips sensitive fields (_id, __v, internalId, plantInternalId, userInternalId, password)
   * and converts ObjectId / Date / Buffer instances to their string representations.
   * @param {*} obj - The value to sanitize
   * @returns {*} Sanitized value
   */
  static #sanitize(obj) {
    if (Array.isArray(obj)) return obj.map(HttpResponse.#sanitize);
    if (obj && typeof obj === "object" && !(obj instanceof Date)) {
      if (obj._bsontype === "ObjectId" || obj.constructor?.name === "ObjectId")
        return obj.toString();
      if (Buffer.isBuffer(obj)) return undefined;
      if (typeof obj.toJSON === "function") obj = obj.toJSON();
      if (obj == null) return null;
      const sensitive = new Set([
        "internalId",
        "plantInternalId",
        "userInternalId",
        "__v",
        "password",
        "_id",
      ]);
      const clean = {};
      for (const [k, v] of Object.entries(obj)) {
        if (!sensitive.has(k)) clean[k] = HttpResponse.#sanitize(v);
      }
      return clean;
    }
    return obj;
  }

  /**
   * Builds a success response envelope
   * @param {string} message - Success message
   * @param {*} [data=null] - Response payload (will be sanitized)
   * @param {number} [statusCode=200] - HTTP status code
   * @returns {{ success: boolean, message: string, data: *|null, status: number }}
   */
  static success(message, data = null, statusCode = 200) {
    return {
      success: true,
      message,
      data: data !== null ? HttpResponse.#sanitize(data) : data,
      status: statusCode,
    };
  }

  /**
   * Builds an error response envelope
   * @param {string} message - Error message
   * @param {number} [statusCode=500] - HTTP status code
   * @returns {{ success: boolean, message: string, status: number }}
   */
  static error(message, statusCode = 500) {
    return {
      success: false,
      message,
      status: statusCode,
    };
  }
}

export default HttpResponse;
