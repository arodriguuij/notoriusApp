const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handleFactory');

exports.aliasTopTours = (req, res, next) => {
    console.log('Middleware alias top5-cheap');

    req.query.limit = '5';
    req.query.sort = 'price,-ratingsAverage,';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty'
    next();
};

// export. export more than one thing
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, {path: 'reviews'});
exports.createTour = factory.createOne(Tour);
exports.updateTour= factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

// Agregation pipeline
exports.getTourStats = catchAsync(async (req, res, next) => {
    const stat = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                // _id: null, // all the tours togeter
                _id: { $toUpper: '$difficulty' },
                numTours: { $sum: 1 }, //Add 1 in each iteration
                numRatings: { $sum: '$ratingCuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            },
        },
        {
            $sort: { avgPrice: 1 } //Sort by avgPrice
        }
        //  },
        //  {
        //      $match: { _id: { $ne: 'EASY' } } //Excluding EASY documents
        //  }
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            stat
        }
    });
});


exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1;

    const plan = await Tour.aggregate([
        //startDates
        {
            // Deconstruc an array field from the info documents and then output one document,
            // for each element of the array.
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numToursStarts: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: {
                _id: 0 //No project 0 - project 1
            }
        },
        {
            $sort: { numToursStarts: -1 } // -1 Descendin, 1 Ascending
        },
        {
            $limit: 12 // Number of result
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            plan
        }
    });
});