class HttpResponse {
  static success(message, data = null, statusCode = 200) {
    return {
      success: true,
      message,
      data,
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
