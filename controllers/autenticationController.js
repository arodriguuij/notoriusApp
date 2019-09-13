const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError')

const signToken = id => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt
    });

    // process.env.JWT_SECRET -> secret key
    // Options: JWT_EXPIRES_IN
    const token = signToken(newUser._id);

    res.status(201).json({ // 201 to create
        status: 'success',
        token,
        data: {
            user: newUser
        }
    });
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }

    // 2) Check if user exist && password is correct
    // .select('+password'); in order to select the "no selected password" -> +
    const user = await User.findOne({ email: email }).select('+password');

    if (!user || ! await user.correctPassword(password, user.password)) {
        return next(new AppError('Incorrect email or password', 401));
    }
    // 3) If everything is ok, send token to client
    const token = signToken(user._id);
    res.status(200).json({
        status: 'success',
        token
    })
});


exports.protect = catchAsync(async (req, res, next) => {
    // 1) TODO: Getting token and check if it is there
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // token =
    // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
    // .eyJpZCI6IjVkN2E5NjE3OWY0NDdjMmY1MGY4OGU4OCIsImlhdCI6MTU2ODMxNDkyOSwiZXhwIjoxNTc2MDkwOTI5fQ
    // .scQxhjsgU-H1onSQ4Yo1VmNFJai2zwEeFiJIPjV0odQ
    //console.log(token);
    if (!token) {
        return next(new AppError('Your are not logged in. Please log in to get access.', 401));
    }

    // 2) TODO: Verification token 
    // jwt.verify(token, process.env.JWT_SECRET) promisify -> in order to promisify the function 'jwt.verify'
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // decoded = 
    // { id: '5d7a96179f447c2f50f88e88', iat: 1568314929, exp: 1576090929 }
    //console.log(decoded);

    // 3) TODO: Check if user still exists
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
        return next(new AppError('The token belonging to this token does no longer exist.', 401));
    }

    // 4) TODO: Check if user change password after the token was issued (emited)
    if (freshUser.changesPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password. PLease lo in again.', 401));
    }

    // Grant access to protected route
    req.user = freshUser;
    next();
});