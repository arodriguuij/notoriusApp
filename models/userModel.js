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
            validator: function(el){//We cannot use the arrow function because we need to use disk keyword
                return el === this.password;
            },
            message: 'The password must be the same'
        }
    }
});


// The encryption gonna be happen between the moment that we receive that data and 
// the moment where it is actually persisted to the database
userSchema.pre('save', async function(next){
    // Only run this function if password was actually modified
    if(!this.isModified('password')) return next(); // this => User
    
    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    // Delete the passwordConfirm. We only need passwordConfirm to create the User
    this.passwordConfirm = undefined; 
    next();
})

// Intance method -> is aviable in all tocuments of a centain collection
userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
    return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);
module.exports = User;