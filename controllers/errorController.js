const AppError = require('../utils/appError');

const handleCastErroDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

//TODO: create level of importances depends on the error (field)
const handleDuplicateField = err => {
    // errmsg: 'E11000 duplicate key error collection: natours.tours index: name_1 dup key: { : "Secret2Secret2331233" }',
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];  // "Secret2Secret2331233",",3
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    console.log(errors);
    const message = `Invalid input data. ${errors.join('.  ')}`;
    return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

const sendErrorProd = (err, res) => {
    //Operational, trusted error : send message to  client
    //console.log(err); 

    //console.error('ERROR ******', err);

    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
        // Programing or other unknow error: do not leak error details    
    } else {
        // 1) Log error
        console.error('ERROR ******', err);

        // 2) Send generic message
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!'
        });
    }
};

module.exports = (err, req, res, next) => {
    //console.log(err.stack); // Where is the error
    //console.log(err.statusCode + '   ---   '+ err.status);
    err.statusCode = err.statusCode || 500; // Internal server error
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        console.log('DEV');
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        console.log('PROD');
        let error = { ...err }; // Destructuring

        if (err.name === 'CastError') {  // 127.0.0.1:3000/api/v1/tours/dfsdfsdf
            error = handleCastErroDB(err);
            //console.log(error);
            error.isOperational = true;
        } else if (err.code == 11000) { // Create
            error = handleDuplicateField(err);
            error.isOperational = true;

        } else if (err.name === 'ValidationError') { // Update
            error = handleValidationErrorDB(err);
            error.isOperational = true;
        }

        sendErrorProd(error, res);
    }
}