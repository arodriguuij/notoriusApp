const mongoose = require('mongoose');
const dotenv = require('dotenv');
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
app.listen(port, () => {
    console.log(`App running on the port ${port}`);
});
