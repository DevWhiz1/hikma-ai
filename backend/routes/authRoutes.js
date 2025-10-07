const express = require('express');
const { signup, login, seedScholar } = require('../controllers/authController');
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
// one-time seed route guarded by secret query param
router.post('/seed-scholar', seedScholar);

module.exports = router;