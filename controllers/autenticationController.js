const crypto = require('crypto');
const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError')
const Email = require('../utils/email');

const signToken = id => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const createSentToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        // * 24 * 60 * 60 * 1000 converting to milisecond 
        // secure: true -> Cookie only be send on an encypted connection (HTTPS)
        // httpOnly: true -> Cookie cannot be accessed or modified in any way by the browser 
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
    }

    res.cookie('jwt', token, cookieOptions);

    // Remove the password from the output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create(req.body);
    const url = `${req.protocol}://${req.get('host')}/me`;
    console.log(url);
    await new Email(newUser, url).sendWellcome();
    // process.env.JWT_SECRET -> secret key
    // Options: JWT_EXPIRES_IN
    createSentToken(newUser, 201, res);
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
    console.log(user);
    if (!user || ! await user.correctPassword(password, user.password)) {
        return next(new AppError('Incorrect email or password', 401));
    }
    // 3) If everything is ok, send token to client
    createSentToken(user, 200, res);
});

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000), // 10 seconds
        httpOnly: true
    });
    res.status(200).json({
        status: 'success'
    });
};

exports.protect = catchAsync(async (req, res, next) => {
    // 1) TODO: Getting token and check if it is there
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
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
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError('The token belonging to this token does no longer exist.', 401));
    }

    // 4) TODO: Check if user change password after the token was issued (emited)
    if (currentUser.changesPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password. PLease lo in again.', 401));
    }

    // Grant access to protected route, Example: in restrictTo, because it is execute after this methed
    req.user = currentUser;
    res.locals.user = currentUser; // Pug template will have access to the response .locals -> Passing data into a template
    next();
});

// Only for render pages, no errors
exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies && req.cookies.jwt) {
        try {
            // 1) verify token
            // Remove 'catchAsync' to dotnt send the error down  to all global error handling middleware, 
            // because 'jwt.verify' verify the cookie jwt that we give the value 'loggedout' in order to log out the user.
            // Solution: catch it locally
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET
            );

            // 2) TODO: Check if user still exists
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }

            // 3) TODO: Check if user change password after the token was issued (emited)
            if (currentUser.changesPasswordAfter(decoded.iat)) {
                return next();
            }

            // There is a logged in User
            res.locals.user = currentUser; // Pug template will have access to the response .locals -> Passing data into a template
            return next();
        } catch (err) {
            return next();
        }
    }
    next();
};


exports.restrictTo = (...roles) => { //wrap into a function in order to have access to the parameters
    return (req, res, next) => {
        // roles is an Array ['admin', 'lead-guide']
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perfom this action', 403)); //403 -> forbidden
        }
        next();
    };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on POST email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('There is no user with that email address.', 404))
    }

    // 2) Generate the randon reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });  // We do not specify all of the mandatory data, because we marked field as required

    // 3) Send it to user's email
    // TryCatch method insted of catchAsync due to we want to do more things than only send a response to the client
    // Reset both the token and the expired property
    try {
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        await new Email(user, resetURL).sendPasswordReset();

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email.'
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('There was an error sending the email. Try again later.', 500));
    }
});

exports.resertPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on the token
    const hasedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
        passwordResetToken: hasedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    // 2) If token has not expired, and there is a user, set the new password
    if (!user) {
        next(new AppError('Token is invalid or has expired.', 400));
    }
    user.password = req.body.password; // User send the new password in the request's body
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // We use .save() insted of .update() in order to validate the password and passwordConfirm
    await user.save(); // We dont have to turn off the validators, because we want to validate.

    // 3) Update changePassword property for the user
    // This funcionality is done in the user middleware (Save)

    // 4) Log the user in, sent JWT
    createSentToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password'); // req.user.id setted in 'protec' middleware

    // 2) Check if POST current password is correct
    // user.password -> Actual password
    // req.body.passwordConfirm -> New password
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong.', 401));
    }

    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfim;
    console.log(user);
    await user.save();
    // we use .save() insted of .findByIdAndUpdate()   -> No use update for anything related with passwords
    // 1. Validation PasswordConfirm in model is going to work
    // 2. Pre save middleware are also not going to work
    // 2.1. Password would not be encrypted (1st middleware userModel)
    // 2.2. PasswordChangedAt timestamp would also not be set. (2nd middleware userModel)

    // 4) Log user in, send JWT
    createSentToken(user, 200, res);
});