const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError'); 

exports.aliasTopTours = (req, res, next) => {
    console.log('Middleware alias top5-cheap');

    req.query.limit = '5';
    req.query.sort = 'price,-ratingAverage,';
    req.query.fields = 'name,price,ratingAverage,summary,difficulty'
    next();
};

// export. export more than one thing
exports.getAllTours = catchAsync(async (req, res, next) => {    // v1 -> Version Api
    //EXECUTE THE QUERY
    //It works because we return the object itself
    console.log(req.query);
    const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().pagination();
    const tours = await features.query;
    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            tours
        }
    });
});

exports.getTour = catchAsync(async (req, res, next) => {    // :id parameter  -   :id? optional parameter  
    // Mogoose Way
    const tour = await Tour.findById(req.params.id);
    // MongBD way :Tour.findOne({ _id: req.params.id})

    if(!tour) {
        return next(new AppError('No tour found with that ID', 404)); // return in orden to no continue executing the rest code
    }

    res.status(200).json({
        status: 'success',
        data: {
            tour
        }
    });
});

exports.createTour = catchAsync(async (req, res, next) => {
    const newTour = await Tour.create(req.body);
    res.status(201).json({
        status: "success",
        data: {
            tour: newTour
        }
    });
});

exports.updateTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
        new: true, // Return the modificated document
        runValidators: true // Run de validator again
    });

    if(!tour) {
        return next(new AppError('No tour found with that ID', 404)); // return in orden to no continue executing the rest code
    }

    res.status(200).json({
        status: 'success',
        data: {
            tour
        }
    });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndRemove(req.params.id);

    if(!tour) {
        return next(new AppError('No tour found with that ID', 404)); // return in orden to no continue executing the rest code
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Agregation pipeline
exports.getTourStats = catchAsync(async (req, res, next) => {
    const stat = await Tour.aggregate([
        {
            $match: { ratingAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                // _id: null, // all the tours togeter
                _id: { $toUpper: '$difficulty' },
                numTours: { $sum: 1 }, //Add 1 in each iteration
                numRatings: { $sum: '$ratingCuantity' },
                avgRating: { $avg: '$ratingAverage' },
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