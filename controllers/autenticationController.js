const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError')

const signToken = id => {
    return jwt.sign({ id: id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
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
    if(!email || !password){
        return next(new AppError('Please provide email and password!', 400));
    }

    // 2) Check if user exist && password is correct
    // .select('+password'); in order to select the "no selected password" -> +
    const user = await User.findOne({email: email}).select('+password');

    if(!user || ! await user.correctPassword(password, user.password)){
        return next( new AppError('Incorrect email or password', 401));
    }
    // 3) If everything is ok, send token to client
    const token = signToken(user._id);
    res.status(200).json({
        status: 'success',
        token
    })
});