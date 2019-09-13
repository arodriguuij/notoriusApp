const express = require('express');
// Import with decontructor way
const { getAllUsers, createUser, getUser, updateUser, deleteUser } = require('../controllers/userController');
const autenticationController = require('../controllers/autenticationController');

const router = express.Router();

router.post('/signup', autenticationController.signup);
router.post('/login', autenticationController.login);

router.route('/')
    .get(autenticationController.protect, getAllUsers)
    .post(createUser);
    
router.route('/:id')
    .get(getUser)
    .patch(updateUser)
    .delete(deleteUser);

module.exports = router;