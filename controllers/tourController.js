const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');

exports.aliasTopTours = (req, res, next) => {
    console.log('Middleware alias top5-cheap');

    req.query.limit = '5';
    req.query.sort = 'price,-ratingAverage,';
    req.query.fields = 'name,price,ratingAverage,summary,difficulty'
    next();
};


// export. export more than one thing
exports.getAllTours = async (req, res) => {    // v1 -> Version Api
    try {
        /*
                //BUILD QUERY
                //  TODO: 1A) Filtering
                const queryObj = {...req.query}; //structuring --> '...'  new object --> '{}'
                console.log(queryObj);
                const excludeFields = ['page', 'sort', 'limit', 'fields'];
                excludeFields.forEach(el => delete queryObj[el]);
        
                //  TODO: 1B) Advance filtering
                // 127.0.0.1:3000/api/v1/tours?duration[gte]=5&difficulty=easy&sort=3&limit=10
                let queryStr = JSON.stringify(queryObj);
        
                // gte, gt, lte, lt  ----> $gte, $gt, $lte, $lt
                // "\b" only the exact string, no more
                // "g" replace everyone
                queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`); 
                //console.log(JSON.parse(queryStr));
        
                // Transforming in a query to make aviable do more stuff
                let query = Tour.find(JSON.parse(queryStr));
        
                //  TODO: 2)Sorting
                // 127.0.0.1:3000/api/v1/tours?sort=price   Ascendent order
                // 127.0.0.1:3000/api/v1/tours?sort=-price,-ratingAverage  Descendent order and with second criteria
                if(req.query.sort){
                    const sortBy = req.query.sort.split(',').join(' '); // Delete "," and separate by space
                    console.log(sortBy);
                    query = query.sort(sortBy); // query.sort('-price -ratingAverage')
                } else {
                    query = query.sort('-createdAt');  //Default
                }
        
                //  TODO: 3) Field limiting
                // 127.0.0.1:3000/api/v1/tours?fields=name,duration,difficulty,price
                if(req.query.fields) {
                    const fields = req.query.fields.split(',').join(' ');
                    query = query.select(fields);
                } else {
                    // Exclude key      "__v": 0
                    query = query.select('-__v');  // exclude "-" + key
                }
        
                //  TODO: 4) Pagination
                const page = req.query.page * 1 || 1; // Convert string to number and default 1
                const limit = req.query.limit * 1 || 100;
                const skip = (page - 1) * limit;
        
                query = query.skip(skip).limit(limit);
        
                // Avoid the posibility to get page that doesnt exist
                if(req.query.page){
                    const numTours = await Tour.countDocuments(); //Number of documents
                    if(skip >= numTours) throw new Error('This page doest not exist!');  // Move on to the catch block
                }
        */
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
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: err
        })
    }
};

exports.getTour = async (req, res) => {    // :id parameter  -   :id? optional parameter  
    try {
        // Mogoose Way
        const tour = await Tour.findById(req.params.id);
        // MongBD way :Tour.findOne({ _id: req.params.id})

        res.status(200).json({
            status: 'success',
            data: {
                tour
            }
        });
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: err
        })
    }
};

exports.createTour = async (req, res) => {

    /* OPTION 1
        const newTour = new Tour({ //data });
        newTour.save();
    */

    // OPTION 2
    try {
        const newTour = await Tour.create(req.body);
        res.status(201).json({
            status: "success",
            data: {
                tour: newTour
            }
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }

};

exports.updateTour = async (req, res) => {
    try {
        const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // Return the modificated document
            runValidators: true // Run de validator again
        });
        res.status(200).json({
            status: 'success',
            data: {
                tour
            }
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};

exports.deleteTour = async (req, res) => {
    try {
        await Tour.findByIdAndRemove(req.params.id);

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};

// Agregation pipeline
exports.getTourStats = async (req, res) => {
    try{
        const stat = await Tour.aggregate([
             {
                 $match: { ratingAverage: { $gte: 4.5 } }
             },
             {
                 $group: {
                   // _id: null, // all the tours togeter
                    _id: { $toUpper: '$difficulty'},
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
    } catch (err){
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
}


exports.getMonthlyPlan = async (req, res) => {
    try{
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
    } catch(err){
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
}