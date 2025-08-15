const express = require('express');
const { auth } = require('../middleware/auth');
const { getHistory, createSession, getSession, getSessions, deleteSession } = require('../controllers/chatController');
const router = express.Router();

router.get('/sessions', auth, getSessions);
router.post('/sessions', auth, createSession);
router.get('/sessions/:id', auth, getSession);
router.delete('/sessions/:id', auth, deleteSession);
router.get('/history', auth, getHistory); // Legacy endpoint

module.exports = router;