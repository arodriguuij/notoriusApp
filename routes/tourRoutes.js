const express = require('express');
// Import with the normal way
const tourController = require('../controllers/tourController');

const router = express.Router();

// Middleware for the expecific parameter
//router.param('id', tourController.checkID);

router.route('/top5-cheap').get(tourController.aliasTopTours ,tourController.getAllTours);

router.route('/')
    .get(tourController.getAllTours)
    //.post(tourController.checkBody, tourController.createTour); // Use middlewre before one particular method
    .post(tourController.createTour);

router.route('/:id')
    .get(tourController.getTour)
    .patch(tourController.updateTour)
    .delete(tourController.deleteTour);

module.exports = router; // if there is only one thing to export