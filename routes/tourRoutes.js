const express = require('express');
// Import with the normal way
const tourController = require('../controllers/tourController');

const router = express.Router();

// Middleware for the expecific parameter
//router.param('id', tourController.checkID);

router.route('/tour-start').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);
router.route('/top5-cheap').get(tourController.aliasTopTours ,tourController.getAllTours);// Use middlewre before one particular method

router.route('/')
    .get(tourController.getAllTours)
    .post(tourController.createTour);

router.route('/:id')
    .get(tourController.getTour)
    .patch(tourController.updateTour)
    .delete(tourController.deleteTour);

module.exports = router; // if there is only one thing to export