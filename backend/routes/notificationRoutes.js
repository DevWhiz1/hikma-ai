const express = require('express');
const { auth } = require('../middleware/auth');
const { sendSmartNotification } = require('../controllers/notificationController');
const rules = require('../controllers/notificationRuleController');

const router = express.Router();

// Send smart notifications from scholar to students (bulk or selected)
router.post('/smart', auth, sendSmartNotification);

// Rules CRUD
router.get('/rules', auth, rules.listRules);
router.post('/rules', auth, rules.createRule);
router.put('/rules/:id', auth, rules.updateRule);
router.delete('/rules/:id', auth, rules.deleteRule);
router.post('/rules/run', auth, rules.runDueRules);
router.post('/rules/run-all', auth, rules.runAllNow);

module.exports = router;


