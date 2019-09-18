const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/appError');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const tourRouter = require('./routes/tourRoutes');
const globalErrorHandler = require('./controllers/errorController');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const app = express();

// TODO: 1) GLOBAL MIDDLEWARES
// Set security HTTP headers
app.use(helmet());


// Development login
//console.log(`App: ${process.env.PORT}`);
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}


// Limit request from same API
// How many request per IP we are going to allow in a certain amount of time
const limiter = rateLimit({
    max: 100,  //numbers of request from the same IP
    windowMS: 60 * 60 * 1000,  // in 1h -> 60minutes * 60seconds * 1000milliseconds
    message: 'Too many request from this IP, please try again in an hour.'
});
app.use('/api', limiter); // Afect all of the routs that start with this '/api'


// Body parser, reading data from the body into req.body
app.use(express.json({ limit: '10kb'})); // Middleware -> Parse data from the body ... Limit 10kb from the req.body

// Data sanitization against NoSQL query injection
// From example: Login -> {"email": {"$gt": ""}, "password": "pass1234"} we had access
// Look the request body, request query string, and also at request params, and filter out all of the dollar sign s and dots.
app.use(mongoSanitize()); // Retun middleware function


// Data sanitization against XSS atack
app.use(xss()); //Clean html symbols injection
// Example:	"name": "<div id='bad-code>Name</div>" --->  "name": "&lt;div id='bad-code>Name&lt;/div>",


// Prevent parameter pollution
app.use(hpp({
    // whitelist -> Array for which we actually allow duplicates in the query string.
    whitelist: [ 'duration', 'ratingsAverage', 'ratingCuantity', 'maxGroupSize', 'difficulty', 'price']
}));
// Example: {{URL}}api/v1/tours?sort=duration&sort=price  -> Sort by 2 different types -> Solution: useing the lastone


// Open to the browser from the folder and no from the route 
// Serving stativ files
app.use(express.static(`${__dirname}/public`));
// http://localhost:3000/overview.html


// TEST middleware
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
app.use('/api/v1/reviews', reviewRouter);


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