const express = require('express');
// Import with decontructor way
const { getAllUsers, createUser, getUser, updateUser, deleteUser, updateMe, deleteMe } = require('../controllers/userController');
const autenticationController = require('../controllers/autenticationController');

const router = express.Router();

router.post('/signup', autenticationController.signup);
router.post('/login', autenticationController.login);

router.post('/forgotPassword', autenticationController.forgotPassword);
router.patch('/resetPassword/:token', autenticationController.resertPassword);

router.patch('/updateMyPassword', autenticationController.protect, autenticationController.updatePassword);
router.patch('/updateMe', autenticationController.protect, updateMe);
//We dont delete the user from the DB. We update the property 'active' in UserModel to false
router.delete('/deleteMe', autenticationController.protect, deleteMe);

router.route('/')
    .get(getAllUsers)
    .post(createUser);
    
router.route('/:id')
    .get(getUser)
    .patch(updateUser)
    .delete(deleteUser);

module.exports = router;