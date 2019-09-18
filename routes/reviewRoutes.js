const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/autenticationController');

const router = express.Router({ mergeParams: true });
// { mergeParams: true } -> Acces to the parameter to the other routes (in this case, tourId)

router.use(authController.protect)
// POST /tours/:tourId/reviews
// GET /tours/:tourId/reviews
// POST /reviews
router.route('/')
    .get(reviewController.getAllReviews)
    .post(authController.restrictTo('user'), reviewController.setTourUserIds, reviewController.createReview);

router.route('/:id')
    .get(reviewController.getReview)
    .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
    .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview);

module.exports = router;