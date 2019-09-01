const express = require('express');
// Import with decontructor way
const { getAllUsers, createUser, getUser, updateUser, deleteUser } = require('../controllers/userController');

const router = express.Router();

router.route('/')
    .get(getAllUsers)
    .post(createUser);
    
router.route('/:id')
    .get(getUser)
    .patch(updateUser)
    .delete(deleteUser);

module.exports = router;