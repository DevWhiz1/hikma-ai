const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { searchHadiths, listBooks, generateAnswer } = require('../controllers/hadithController');

router.get('/books', auth, listBooks);
router.post('/hadith/search', auth, searchHadiths);
router.post('/answer', auth, generateAnswer);

module.exports = router;
