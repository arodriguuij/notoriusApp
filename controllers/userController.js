const User = require('../models/userModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handleFactory');
const multer = require('multer');
const sharp = require('sharp');

/* 
// Save in the disk
const multerStorage = multer.diskStorage({
    destination: (req, file, callBackFunction) => {
        callBackFunction(null, 'public/img/users') // 1st argument -> Error --- 2nd -> Destination
    },
    filename: (req, file, callBackFunction) => {
        // user-76784847asvd87sdf-534523462345.jpge (user-id-timeStamp.extension)
        const extension = file.mimetype.split('/')[1];  //file{... , mimetype: 'image/jpge' , ...}
        callBackFunction(null, `user-${req.user.id}-${Date.now()}.${extension}`);
    }
});
*/

// Sve in memory
const multerStorage = multer.memoryStorage();


// Validate if the file is a image -> disponible in req.file.buffer
const multerFilter = (req, file, callBackFunction) => {
    if (file.mimetype.startsWith('image')) {
        callBackFunction(null, true);
    } else {
        callBackFunction(new AppError('Not an image! Please upload only images.', 400), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async(req, res, next) => {
    if (!req.file) return next();

    req.file.filename =  `user-${req.user.id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${req.file.filename}`); // Save in disk

    next();
});

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    // Object.keys(obj) return an array containing all the key names
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) {
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
    //    console.log(req.file);
    //    console.log(req.body);
    // 1) Create erro if user POST password data
    if (req.body.password || req.body.passwordConfirm) {
        next(new AppError('This rout is not for password update. Please use /updateMyPassword.', 400));
    }

    // 2) Filtered out unwanted fields names that are not allowed to be updated (rol)
    const fiteredBody = filterObj(req.body, 'name', 'email');
    // Add photo property to the object that is going to be updated here
    if (req.file) fiteredBody.photo = req.file.filename;

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


exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

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