const express = require('express');
const autenticationController = require('../controllers/autenticationController');
// Import with the normal way
const tourController = require('../controllers/tourController');
const reviewRouter = require('../routes/reviewRoutes');

const router = express.Router();

// Middleware for the expecific parameter
//router.param('id', tourController.checkID);

//Nested route
router.use('/:tourId/reviews', reviewRouter);

router.route('/tour-start')
    .get(tourController.getTourStats);
router.route('/monthly-plan/:year')
    .get(autenticationController.protect, autenticationController.restrictTo('user'), tourController.getMonthlyPlan);
router.route('/top5-cheap')
    .get(tourController.aliasTopTours, tourController.getAllTours); // Use middlewre before one particular method
router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin);
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router.route('/')
    .get(tourController.getAllTours)
    .post(autenticationController.protect, autenticationController.restrictTo('admin', 'lead-guide'), tourController.createTour);

router.route('/:id')
    .get(tourController.getTour)
    .patch(autenticationController.protect, 
        autenticationController.restrictTo('admin', 'lead-guide'), 
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.updateTour)
    .delete(autenticationController.protect, autenticationController.restrictTo('admin', 'lead-guide'), tourController.deleteTour);

module.exports = router; // if there is only one thing to export