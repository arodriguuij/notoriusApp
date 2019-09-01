const express = require('express');
// Import with the normal way
const tourController = require('../controllers/tourController');

const router = express.Router();

router.route('/')
    .get(tourController.getAllTours)
    .post(tourController.createTour);
    router.route('/:id')
    .get(tourController.getTour)
    .patch(tourController.updateTour)
    .delete(tourController.deleteTour);

module.exports = router; // if there is only one thing to export