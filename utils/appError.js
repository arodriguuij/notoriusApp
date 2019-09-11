class AppError  extends Error{
    constructor(message, statusCode){
        super(message); // already set the message here 

        //this.message = message;
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        //this.statusCode = `${statusCode}`.startsWith('4') ? statusCode : 'error'; // 500 -> Error,  else -> fail
        //console.log(this.statusCode + '     '+ statusCode+'      '+ `${statusCode}`.startsWith('4'));
        this.isOperational = true; // Our errors, not programming error or bugs

        Error.captureStackTrace(this, this.constructor); // Not appear in the stack trace
    }
}

module.exports = AppError; 