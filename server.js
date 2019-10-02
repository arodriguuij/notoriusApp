const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
    console.log('UNCAUGTH EXCEPTION!... Shutting down...');
    console.log(err);
    //server.close(() => {  // Give to the server time to finish all the request that are pending or being handled at the time 
    process.exit(1); // 1 uncaught exception - 0 successful
    //});
});
// In oder to prevent error like the next one
// console.log(x);  // x not defined


dotenv.config( {path: './config.env'} ); //Read config.env  

const app = require('./app');
//console.log(process.env);

// TODO: Connect with de the DB and create Schemas and models
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => console.log('DB connection successful!'));


const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App running on the port ${port}`);
});


// Handler unhandled rejections
process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION!💥 ... Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {  // Give to the server time to finish all the request that are pending or being handled at the time 
        process.exit(1); // 1 uncaught exception - 0 successful
    });
});

// Event received by heroky to satitaze the app each 24h (shutting down), its could be abrupt and shut down the app with request pending
process.on('SIGTERM', () => {
    console.log('SIGTERM RECEIVED. Shutting down gracefully.....');
    server.close(() => {
        console.log('Process terminated!')
    });
});