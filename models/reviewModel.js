// review - rating - createAt - ref to tout - ref to user
const mongoose = require('mongoose');
const Tour = require('../models/tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
 
// Each conbination of tour and user has always to be unique -> One user cannot write more than 1 review per tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

// We create this method as statics method because we needed to call the aggregate function on the module.
// So in a static method to 'this' variable calls exactly to a method.
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([// this -> Model
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  //console.log(stats);
  // [ { _id: 5d8260cfb188e1340cc56d02, nRating: 2, avgRating: 3.5 } ]

  // Update
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingCuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingCuantity: 0, //default
      ratingsAverage: 4.5 //default
    });
  }

};

// findById
// After a new review has been created
reviewSchema.post('save', function () {
  // this -> current Review
  // this.constructor -> because this is what point to the current model
  this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndUpdate  -> behind the scenes, it is only just a shorthand for findOneAndUpdate with the current ID
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // this -> current query
  this.r = await this.findOne();  // We save in this.r in order to have access in the future
  //console.log(this);  // In order to find de TourId
  /*
  { _id: 5d8262435e65381460dfd295,
  review: 'Cras mollis and more... Oo',
  rating: 5,
  tour: 5d8260cfb188e1340cc56d02,  <---------------------------- tourId
  user:
   { _id: 5c8a1ec62f8fb814b56fa183,
     name: 'Ayla Cornell',
     photo: 'user-4.jpg' },
  createdAt: 2019-09-18T16:58:43.601Z,
  __v: 0,
  id: '5d8262435e65381460dfd295' }
  */
  next();
});
// Now we can use call 'calcAverageRatings' method due if we use en .pre, the underlying data would not have been updated
// at that point and so the calculated stadistics would not really be up to date. 
reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne(); -- Does NOT work here, query has already excuted
  if(this.r)
    await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;