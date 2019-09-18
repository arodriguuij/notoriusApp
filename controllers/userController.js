const User = require('../models/userModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handleFactory');

const filterObj = (obj, ...allowedFields) => {
    const newObj ={};
    // Object.keys(obj) return an array containing all the key names
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)){
            newObj[el] = obj[el];
        }
    });
    return newObj;
};

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};


exports.updateMe = catchAsync(async (req, res, next) => {
    // 1) Create erro if user POST password data
    if (req.body.password || req.body.passwordConfirm) {
        next(new AppError('This rout is not for password update. Please use /updateMyPassword.', 400));
    }

    // 2) Filtered out unwanted fields names that are not allowed to be updated (rol)
    const fiteredBody = filterObj(req.body, 'name', 'email');

    // 3) Update user document
    // We use .findByIdAndUpdate() insted of .save() in order to dont specify all the fields required in UserModel
    const updateUser = await User.findByIdAndUpdate(req.user.id, fiteredBody, { new: true, runValidators: true });  // {new: true} return the update object

    res.status(200).json({
        status: 'success',
        data: {
            user: updateUser
        }
    });
});


exports.deleteMe= catchAsync( async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, {active: false});

    res.status(204).json({
        status: 'success',
        data: null
    });
});


exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not defined. Please us /signup instead'
    })
};

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
// Do NOT update password with this due to doesnt have validations
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);