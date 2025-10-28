const Notification = require('../models/Notification');

// Get all notifications for the authenticated user
async function getMyNotifications(req, res) {
  try {
    const { page = 1, limit = 50, unreadOnly = false } = req.query;

    const query = { userId: req.user._id };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });

    res.json({
      ok: true,
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}

// Mark notification as read
async function markAsRead(req, res) {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ ok: false, error: 'Notification not found' });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ ok: true, notification });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}

// Mark all notifications as read
async function markAllAsRead(req, res) {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    res.json({ ok: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}

// Delete a notification
async function deleteNotification(req, res) {
  try {
    const { id } = req.params;

    const result = await Notification.deleteOne({
      _id: id,
      userId: req.user._id
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ ok: false, error: 'Notification not found' });
    }

    res.json({ ok: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}

// Get unread count
async function getUnreadCount(req, res) {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      read: false
    });

    res.json({ ok: true, unreadCount: count });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
};
