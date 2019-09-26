const express = require('express');
// Import with decontructor way
const { getAllUsers, createUser, getUser, updateUser, deleteUser, updateMe, deleteMe, getMe } = require('../controllers/userController');
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
router.get('/me', getMe, getUser); // Asociate UserID to req.params.id
router.patch('/updateMe', updateMe);
//We dont delete the user from the DB. We update the property 'active' in UserModel to false
router.delete('/deleteMe', deleteMe);


// Restric to admin
router.use(autenticationController.restrictTo('admin'));

router.route('/')
    .get(getAllUsers)
    .post(createUser);
    
router.route('/:id')
    .get(getUser)
    .patch(updateUser)
    .delete(deleteUser);

module.exports = router;