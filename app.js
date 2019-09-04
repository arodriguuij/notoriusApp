const express = require('express');
const morgan = require('morgan');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// TODO: 1) MIDDLEWARES
//console.log(`App: ${process.env.PORT}`);
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

app.use(express.json()); // Middleware -> Parse data from the body

// Open to the browser from the folder and no from the route 
//app.use(express.static(`${__dirname}/public`)); 
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


// TODO: 3) EXPORTS
module.exports = app;