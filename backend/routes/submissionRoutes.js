const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/submissionController');

// Start quiz attempt
router.post('/assignment/:id/start', auth, ctrl.startAttempt);

// Student submit answers
router.post('/assignment/:id/submit', auth, ctrl.submitAnswers);

// Scholar/admin actions on submissions
router.post('/:id/grade', auth, ctrl.gradeSubmissionAI);
router.post('/:id/override', auth, ctrl.overrideGrade);
router.post('/:id/manual-grade', auth, ctrl.manualGradeSubmission);

// Listings
router.get('/assignment/:id', auth, ctrl.listSubmissionsForAssignment);
router.get('/me', auth, ctrl.listMySubmissions);
router.get('/inbox', auth, ctrl.listSubmissionsInbox);

module.exports = router;
