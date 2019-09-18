const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndRemove(req.params.id);

    if (!document) {
        return next(new AppError('No document found with that ID', 404)); // return in orden to no continue executing the rest code
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.updateOne = Model => catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true, // Return the modificated document
        runValidators: true // Run de validator again
    });

    if (!document) {
        return next(new AppError('No document found with that ID', 404)); // return in orden to no continue executing the rest code
    }

    res.status(200).json({
        status: 'success',
        data: {
            data: document
        }
    });
});

exports.createOne = Model => catchAsync(async (req, res, next) => {
    const document = await Model.create(req.body);

    res.status(201).json({
        status: "success",
        data: {
            data: document
        }
    });
});

exports.getOne = (Model,populationOptions) => catchAsync(async (req, res, next) => {    // :id parameter  -   :id? optional parameter  
    // Mogoose Way
    let query = Model.findById(req.params.id);
    if(populationOptions) query = query.populate(populationOptions);
    const document = await query;

    // MongBD way :Model.findOne({ _id: req.params.id})

    if (!document) {
        return next(new AppError('No document found with that ID', 404)); // return in orden to no continue executing the rest code
    }

    res.status(200).json({
        status: 'success',
        data: {
            data: document
        }
    });
});

exports.getAll = Model => catchAsync(async (req, res, next) => {    // v1 -> Version Api
    // To allow for mested GET reviews on tour (hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    //EXECUTE THE QUERY
    //It works because we return the object itself
    //console.log(req.query);
    const features = new APIFeatures(Model.find(filter), req.query).filter().sort().limitFields().pagination();
    const document = await features.query; // .explain() -> stadiscits
    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        results: document.length,
        data: {
            data: document
        }
    });
});