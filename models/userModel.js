const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        require: [true, 'Please tell us your name']
    },
    email: {
        type: String,
        require: [true, 'Please tell us your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valir email']
    },
    photo: String,
    role: {
        type: String,
        default: 'user',
        enum: {
            values: ['user', 'guide', 'lead-guide', 'admin']
        }
    },
    password: {
        type: String,
        require: [true, 'Please provide your password'],
        minlength: [8, 'A tour name must have more or equal 8 characters'],  // Validator
        select: false //Doest appear
    },
    passwordConfirm: {
        type: String,
        require: [true, 'Please confirm your password'], // Required input
        validate: { // TODO: This only work on CREATE and SAVE
            validator: function (el) {//We cannot use the arrow function because we need to use disk keyword
                console.log(el, this.password);
                return el === this.password;
            },
            message: 'The password must be the same'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,  // Time in order to reset your password
    active: {
        type: Boolean,
        default: true,
        select: false //Doest appear
    }
});

// TODO: Comment the next 2 middleware (save) when we read users.json in order to sent to the DB. Becasuse the password are already encrypted
/*
// The encryption gonna be happen between the moment that we receive that data and 
// the moment where it is actually persisted to the database
userSchema.pre('save', async function (next) {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) return next(); // this => User
    //console.log(this);
    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    // Delete the passwordConfirm. We only need passwordConfirm to create the User
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) {
        return next();
    }
    //- 1000 -> Because sometimes, save is slower than create token
    // ensure that the token is always created after the password has been changed
    this.passwordChangedAt = Date.now() - 1000;
    next();
});
*/
userSchema.pre(/^find/, function (next) { // /^find/... every query that start by 'find'
    // This point to the current query
    this.find({ active: { $ne: false } });
    next();
});

// Intance method -> is aviable in all tocuments of a centain collection
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changesPasswordAfter = function (JWTTImeStamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        //console.log(changedTimeStamp, JWTTImeStamp);
        return JWTTImeStamp < changedTimeStamp;
    }
    return false; // User has not change the password
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    console.log({ resetToken }, this.passwordResetToken);

    // The user is modificated but it needs to be saved afeter this method
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;  //10 * 60 * 1000 -> 10 minutes

    return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
