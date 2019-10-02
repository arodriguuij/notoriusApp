const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handleFactory');
const AppError = require('../utils/appError');
const multer = require('multer');
const sharp = require('sharp');

// Sve in memory
const multerStorage = multer.memoryStorage();

// Validate if the file is a image -> disponible in req.file.buffer
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! Please upload only images.', 400), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([ // Mix single and multiple
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3 }
]);
//upload.single('image'); // Single
//upload.array('images', 5); // Multiple with the same name

exports.resizeTourImages = catchAsync(async (req, res, next) => {
    if (!req.files.imageCover || !req.files.images) return next();

    // 1) Cover image
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${req.body.imageCover}`); // Save in disk

    // 2) Images
    req.body.images = [];

    /*req.files.images.forEach(async(file, index) => {  });*/  // Problem with async inside of forEach, that doest avoid calling 'next()' -> Sution .map()

    // Map -> Save an array of all of these promises. And then we can use Promise.all to await for all of them 
    await Promise.all(req.files.images.map(async(file, index) => {
        const fileName = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;

        await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${fileName}`); // Save in disk

        req.body.images.push(fileName);
    }));

    //console.log(req.body);  
    next();
});




exports.aliasTopTours = (req, res, next) => {
    //console.log('Middleware alias top5-cheap');

    req.query.limit = '5';
    req.query.sort = 'price,-ratingsAverage,';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty'
    next();
};

// export. export more than one thing
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
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


// tours-within/:distance/center/:latlng/unit/:unit
// tours-within/45/center/51.500636,-0.119973/unit/km
exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; // Convert

    if (!lat || !lng) {
        next(new AppError('Please provide latitude and longitude in the format lat,lng.', 400));
    }
    const tours = await Tour.find({
        startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
    });

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours
        }
    });
});

exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    if (!lat || !lng) {
        next(
            new AppError(
                'Please provide latitutr and longitude in the format lat,lng.',
                400
            )
        );
    }
    //console.log(lng, lat);
    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }]);

    res.status(200).json({
        status: 'success',
        data: {
            data: distances
        }
    });
});
