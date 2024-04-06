class ApiError extends Error {
    constructor(message = "something went wrong", statusCode, error = [], stack = "") {
        super(message);
        this.statusCode = statusCode;
        this.error = error;
        this.data = null;
        this.message = message
        this.success = false
        this.errors = errors

        if (stack) {
            this.stack = stack;
        } else {
            Error.stackTrace(this, this.constructor)
        }
    }
}


export { ApiError }