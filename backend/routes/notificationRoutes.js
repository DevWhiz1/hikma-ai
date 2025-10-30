const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/notificationController');
const rules = require('../controllers/notificationRuleController');

// Standard notification routes
// Get all notifications for user
router.get('/', auth, ctrl.getMyNotifications);

// Get unread count
router.get('/unread-count', auth, ctrl.getUnreadCount);

// Mark single notification as read
router.put('/:id/read', auth, ctrl.markAsRead);

// Mark all notifications as read
router.put('/all/read', auth, ctrl.markAllAsRead);

// Delete notification
router.delete('/:id', auth, ctrl.deleteNotification);

// Smart notification routes (from main branch)
// Send smart notifications from scholar to students (bulk or selected)
router.post('/smart', auth, ctrl.sendSmartNotification);

// Rules CRUD
router.get('/rules', auth, rules.listRules);
router.post('/rules', auth, rules.createRule);
router.put('/rules/:id', auth, rules.updateRule);
router.delete('/rules/:id', auth, rules.deleteRule);
router.post('/rules/run', auth, rules.runDueRules);
router.post('/rules/run-all', auth, rules.runAllNow);

module.exports = router;
