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

const tourSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true
    },
    rating: {
        type: Number,
        default: 4.5
    },
    price: {
        type: Number,
        require: [true, 'A tour must have a price']
    }
});
const Tour = mongoose.model('Tour', tourSchema);

const testTour = new Tour({
    name: "The Park",
    price: 497
});

testTour.save().then(doc => {
    console.log(doc);
}).catch(err => {
    console.log('Error '+err);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`App running on the port ${port}`);
});
