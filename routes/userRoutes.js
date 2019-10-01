const express = require('express');
// Import with decontructor way
const userController = require('../controllers/userController');
const autenticationController = require('../controllers/autenticationController');

const router = express.Router();


router.post('/signup', autenticationController.signup);
router.post('/login', autenticationController.login);
router.get('/logout', autenticationController.logout);

router.post('/forgotPassword', autenticationController.forgotPassword);
router.patch('/resetPassword/:token', autenticationController.resertPassword);

// Protect all the routes that come after this point. Middleware run in secuence
router.use(autenticationController.protect);

router.patch('/updateMyPassword', autenticationController.updatePassword);
router.get('/me', userController.getMe, userController.getUser); // Asociate UserID to req.params.id
router.patch('/updateMe', userController.uploadUserPhoto, userController.resizeUserPhoto, userController.updateMe); // .single() because is an only file - 'photo' name of the field
//We dont delete the user from the DB. We update the property 'active' in UserModel to false
router.delete('/deleteMe', userController.deleteMe);


// Restric to admin
router.use(autenticationController.restrictTo('admin'));

router.route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser);
    
router.route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router;