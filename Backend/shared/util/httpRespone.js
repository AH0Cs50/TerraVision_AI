class HttpResponse {
    constructor(statusCode, message, data = null) {
      this.statusCode = statusCode;
      this.message = message;
      this.success = statusCode < 400;
      this.data = data;
      this.timestamp = new Date().toISOString();
    }
    // factory methods 
    static success(message, data = null, statusCode = 200) {
      return new HttpResponse(statusCode, message, data);
    }
  
    static error(message, statusCode = 500) {
      return new HttpResponse(statusCode, message, null);
    }
}
  
export default HttpResponse;