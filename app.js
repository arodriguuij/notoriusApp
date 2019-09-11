const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/appError');

const tourRouter = require('./routes/tourRoutes');
const globalErrorHandler = require('./controllers/errorController');
const userRouter = require('./routes/userRoutes');

const app = express();

// TODO: 1) MIDDLEWARES
//console.log(`App: ${process.env.PORT}`);
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

app.use(express.json()); // Middleware -> Parse data from the body

// Open to the browser from the folder and no from the route 
// app.use(express.static(`${__dirname}/public`)); 
// http://localhost:3000/overview.html

// Declaration of our own middleware (next Function to execute)
app.use((req, res, next) => {
    //console.log('Hello from the middleware¡');

    // Add attribute to the request
    req.requestTime = new Date().toISOString();
    next();
});

// TODO: 2) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// Defaults routes
app.all('*', (req, res, next) => {
    /*
    res.status(404).json({
        status: 'fail',
        message: `Cannot find  ${req.originalUrl} on this server!`
    });

   const err = new Error(`Cannot find  ${req.originalUrl} on this server!`);
   err.status = 'fail';
   err.statusCode = 400;
    */

   // Any parameter we use in the "next()" method, express is gonna reconize as a err,
   // Then, skip all the other middleware in the stack and send the error to the global error habdling middleware
   next(new AppError(`Cannot find  ${req.originalUrl} on this server!`, 404));
});

// 4 arguments, express is gonna reconize automaticaly as a erron handler middleware
app.use(globalErrorHandler);

// TODO: 3) EXPORTS
module.exports = app;