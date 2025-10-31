const express = require('express');
const { auth } = require('../middleware/auth');
const { submitRatingReview, getScholarOverview, getScholarReviews } = require('../controllers/ratingReviewController');

const router = express.Router();

router.post('/submit', auth, submitRatingReview);
router.get('/overview/:scholarId', getScholarOverview);
router.get('/reviews/:scholarId', getScholarReviews);

module.exports = router;


