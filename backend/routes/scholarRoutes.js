const express = require('express');
const { auth } = require('../middleware/auth');
const { applyScholar, listScholars, enrollScholar, leaveFeedback, myEnrollments, unenroll, getMyScholarProfile, updateMyScholarProfile, deleteMyScholarProfile, startDirectChat, getMyEnrolledStudents, startDirectChatWithStudent } = require('../controllers/scholarController');

const router = express.Router();
router.post('/apply', auth, applyScholar);
router.get('/list', listScholars);
router.post('/enroll', auth, enrollScholar);
router.post('/feedback', auth, leaveFeedback);
router.get('/my-enrollments', auth, myEnrollments);
router.post('/unenroll', auth, unenroll);
router.get('/me', auth, getMyScholarProfile);
router.put('/me', auth, updateMyScholarProfile);
router.delete('/me', auth, deleteMyScholarProfile);
router.post('/start-chat', auth, startDirectChat);
router.get('/enrolled-students', auth, getMyEnrolledStudents);
router.post('/start-chat-with-student', auth, startDirectChatWithStudent);

module.exports = router;


