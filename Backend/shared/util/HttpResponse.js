class HttpResponse {
  static #sanitize(obj) {
    if (Array.isArray(obj)) return obj.map(HttpResponse.#sanitize);
    if (obj && typeof obj === "object" && !(obj instanceof Date)) {
      if (obj._bsontype === "ObjectId" || obj.constructor?.name === "ObjectId")
        return obj.toString();
      if (Buffer.isBuffer(obj)) return undefined;
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

  static success(message, data = null, statusCode = 200) {
    return {
      success: true,
      message,
      data: data !== null ? HttpResponse.#sanitize(data) : data,
      status: statusCode,
    };
  }

  static error(message, statusCode = 500) {
    return {
      success: false,
      message,
      status: statusCode,
    };
  }
}

export default HttpResponse;
