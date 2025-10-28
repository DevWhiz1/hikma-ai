const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/notificationController');

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

module.exports = router;
