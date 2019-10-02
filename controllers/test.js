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
    //console.log(errors);
    const message = `Invalid input data. ${errors.join('.  ')}`;
    return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please, log in again.', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired. Please log in again.', 401)

const sendErrorDev = (err, req, res) => {
    // A) API
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }

    // B) RENDER WEBSITE    
    console.error('ERROR 💥', err);
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: err.message
    });
};

const sendErrorProd = (err, req, res) => {
    // A) API
    if (req.originalUrl.startsWith('/api')) {
        // A.1) Operational, trusted error : send message to  client
        //console.log(err); 
        //console.error('ERROR ******', err);
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        }
        // A.2) Programing or other unknow error: do not leak error details    
        // 1) Log error
        console.error('ERROR 💥', err);

        // 2) Send generic message
        return res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!'
        });
    }
    // B) RENDER WEBSITE    
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
        //console.log(err);
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: err.message
        });
    }
    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error('ERROR 💥', err);
    // 2) Send generic message
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: 'Please try again later.'
    });
};

module.exports = (err, req, res, next) => {
    //console.log(err.stack); // Where is the error
    //console.log(err.statusCode + '   ---   '+ err.status);
    err.statusCode = err.statusCode || 500; // Internal server error
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        //console.log('DEV');
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        //console.log('PROD');
        let error = { ...err }; // Destructuring
        error.message = err.message;

        // 127.0.0.1:3000/api/v1/tours/dfsdfsdf
        if (err.name === 'CastError') error = handleCastErroDB(err);
        // Create
        if (err.code == 11000) error = handleDuplicateField(err);
        // Update
        if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, req, res);
    }
}