import React, { useState, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { notificationService, type Notification as NotificationType } from '../../services/notificationService';
import { useNavigate } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import { authService } from '../../services/authService';

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const navigate = useNavigate();

  // Initialize socket.io for real-time notifications
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const newSocket = io(API_URL, {
      auth: { token: localStorage.getItem('token') }
    });

    // Join user's personal notification room
    const user = authService.getUser();
    if (user?.id) {
      newSocket.emit('join-user-room', user.id);
    }

    // Listen for real-time notifications
    newSocket.on('notification', (notification: NotificationType) => {
      console.log('[NotificationBell] Received notification:', notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Optional: Show browser notification
      if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
        new window.Notification(notification.title, {
          body: notification.message,
          icon: '/logo.png'
        });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Check if we need to show permission modal (but don't auto-request)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = window.Notification.permission;
      const hasAskedBefore = localStorage.getItem('notification-permission-asked');
      
      // Show modal if permission is default and we haven't asked before
      if (permission === 'default' && !hasAskedBefore) {
        // Show modal after a short delay to avoid showing immediately on page load
        const timer = setTimeout(() => {
          setShowPermissionModal(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getAll(false, 1, 20);
      setNotifications(res.notifications);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadCount(res.unreadCount);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const handleMarkAsRead = async (notification: NotificationType) => {
    if (notification.read) return;

    try {
      await notificationService.markAsRead(notification._id);
      
      // Emit socket event
      if (socket) {
        socket.emit('mark-notification-read', notification._id);
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n => (n._id === notification._id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Navigate if link exists
      if (notification.link) {
        navigate(notification.link);
        setShowDropdown(false);
      }
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      // Optimistically mark all as read and ensure no unread remain visible
      setNotifications(prev =>
        prev
          .map(n => ({ ...n, read: true, readAt: new Date().toISOString() }))
          .filter(n => n.read)
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      fetchUnreadCount();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'quiz':
      case 'assignment':
        return '📝';
      case 'grade':
        return '📊';
      case 'meeting':
        return '📅';
      case 'message':
        return '💬';
      default:
        return '🔔';
    }
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  };

  const handleRequestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    try {
      const permission = await window.Notification.requestPermission();
      localStorage.setItem('notification-permission-asked', 'true');
      setShowPermissionModal(false);
      
      if (permission === 'granted') {
        // Optional: Show a success message or notification
        console.log('Notification permission granted');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const handleDeclinePermission = () => {
    localStorage.setItem('notification-permission-asked', 'true');
    setShowPermissionModal(false);
  };

  return (
    <>
      {/* Custom Notification Permission Modal */}
      {showPermissionModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleDeclinePermission}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                  <BellIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Enable Notifications
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Stay updated with important updates
                  </p>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Allow Hikmah AI to send you browser notifications so you never miss important messages, assignments, or meeting updates.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleRequestPermission}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  Allow Notifications
                </button>
                <button
                  onClick={handleDeclinePermission}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Not Now
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Notifications"
        >
          <BellIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-40 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <BellIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification._id}
                    onClick={() => handleMarkAsRead(notification)}
                    className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      !notification.read ? 'bg-emerald-50 dark:bg-emerald-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          <button
                            onClick={(e) => handleDelete(notification._id, e)}
                            className="text-gray-400 hover:text-red-500 flex-shrink-0"
                            aria-label="Delete"
                          >
                            ×
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
                <button
                  onClick={() => {
                    navigate('/notifications');
                    setShowDropdown(false);
                  }}
                  className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
      </div>
    </>
  );
};

export default NotificationBell;
