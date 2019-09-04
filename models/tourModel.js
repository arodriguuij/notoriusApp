const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true,
        trim: true
    },
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty']
    },
    ratingAverage: {
        type: Number,
        default: 4.5
    },
    ratingCuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    discount: Number,
    summary: {
        type: String,
        trim: true,  // Delete all the spaces at the begining and the finish
        required: [true, 'A tour must have a summary']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required:  [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false // cannot be projected
    },
    startDates: [Date],
    slug: String,  // name: Test 4 -> slug: "test-4"  used to the url
    secretTour: {
        type: Boolean,
        default: false
    }
}, {
    toJSON: { virtuals: true }, //get output as a JSON
    toObject: { virtuals: true }   //get output as a Object
});

// Use a regular function in order to be able to use "this"
// this --> pinted at the current document
// durationWeeks isnt gonna be persistant in the dataBase but its gonna be there as soon as we get the data
tourSchema.virtual('durationWeeks').get(function(){ 
    return this.duration / 7;
});


// TODO: DOCUMENT MIDDLEWARE: run before .save() and .create() "mongoose method"
// The function will be called before and actual document is save to the DB
tourSchema.pre('save', function(next){
     //console.log(this);
      // Add new property (slug) to the document with slugify(property, opt)
     this.slug = slugify(this.name, { lower: true });  // This = current document
     next(); // If there is more middleware in the stack
});

/* We can have more than 1 pre middelware for the same action (save in this case)
tourSchema.pre('save', function(next){
    console.log('Will save document...');
    next();
});

// DOCUMENT MIDDLEWARE: run after .save() and .create() "mongoose method"
tourSchema.post('save', function(doc, next){ // Final doc
     //console.log(doc);
     next();
});
*/


// TODO: QUERY MIDDLEWARE. Pre:before the query is excute --- Pro:after the query is execute
// Return every tour is not secretTour
tourSchema.pre(/^find/, function(next){ // /^find/ all the commands that begin by (find) "Example: findById"
//tourSchema.pre('find', function(next){
    this.find({ secretTour: { $ne: true } });
    this.start = Date.now();
    next();
});

/* bad quality
tourSchema.pre('findOne', function(next){
    this.find({ secretTour: { $ne: true } })
    next();
});
*/

tourSchema.post(/^find/, function(docs, next){
    console.log(`Query took ${Date.now()-this.start} milliseconds!`);
    //console.log(docs);
    next();
});


// AGGREGATION MIDDLEWARE
// Fixed the problem of use the secrect tour in the statistics with the aggregates pipelane
tourSchema.pre('aggregate', function(next){
    //console.log(this.pipeline());  // this : Current aggregation object
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); //.unshift() at the begining of the array
    next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;