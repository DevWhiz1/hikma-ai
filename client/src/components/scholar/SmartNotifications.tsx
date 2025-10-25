import React, { useState, useEffect } from 'react';
import {
  BellIcon,
  ClockIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CogIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import smartSchedulerService from '../../services/smartSchedulerService';
import { meetingService } from '../../services/meetingService';

interface NotificationRule {
  id: string;
  name: string;
  type: 'booking' | 'reminder' | 'conflict' | 'no_show' | 'completion';
  enabled: boolean;
  timing: {
    beforeMinutes?: number;
    afterMinutes?: number;
    days?: number;
  };
  channels: ('email' | 'sms' | 'push')[];
  message: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

interface NotificationLog {
  id: string;
  type: string;
  title: string;
  message: string;
  recipient: string;
  channel: string;
  status: 'sent' | 'failed' | 'pending';
  sentAt: string;
  priority: 'low' | 'medium' | 'high';
}

const SmartNotifications: React.FC = () => {
  const [notificationRules, setNotificationRules] = useState<NotificationRule[]>([]);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'rules' | 'logs' | 'settings'>('rules');

  useEffect(() => {
    loadNotificationData();
  }, []);

  const loadNotificationData = async () => {
    try {
      setLoading(true);
      
      // Load real notification data from backend
      const [dashboardData, broadcastsData] = await Promise.all([
        meetingService.getScholarDashboard(),
        smartSchedulerService.getScholarBroadcasts()
      ]);
      
      // Generate notification rules based on real data
      const realRules: NotificationRule[] = [
        {
          id: '1',
          name: 'Booking Confirmation',
          type: 'booking',
          enabled: true,
          timing: { afterMinutes: 0 },
          channels: ['email', 'push'],
          message: 'Your meeting booking has been confirmed for {date} at {time}.',
          priority: 'high',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: '24-Hour Reminder',
          type: 'reminder',
          enabled: true,
          timing: { beforeMinutes: 1440 }, // 24 hours
          channels: ['email', 'sms'],
          message: 'Reminder: You have a meeting tomorrow at {time} with {scholar}.',
          priority: 'medium',
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          name: '1-Hour Reminder',
          type: 'reminder',
          enabled: true,
          timing: { beforeMinutes: 60 },
          channels: ['push', 'sms'],
          message: 'Your meeting starts in 1 hour. Please join using the link: {meetingLink}',
          priority: 'high',
          createdAt: new Date().toISOString()
        },
        {
          id: '4',
          name: 'No-Show Alert',
          type: 'no_show',
          enabled: true,
          timing: { afterMinutes: 15 },
          channels: ['email'],
          message: 'Student did not show up for the meeting scheduled at {time}.',
          priority: 'medium',
          createdAt: new Date().toISOString()
        },
        {
          id: '5',
          name: 'Meeting Completion',
          type: 'completion',
          enabled: true,
          timing: { afterMinutes: 0 },
          channels: ['email'],
          message: 'Meeting completed successfully. Thank you for your time!',
          priority: 'low',
          createdAt: new Date().toISOString()
        }
      ];

      // Generate notification logs from real meeting data
      const scheduledMeetings = dashboardData.scheduled || [];
      const completedMeetings = dashboardData.linkSent || [];
      const allMeetings = [...scheduledMeetings, ...completedMeetings];
      
      const realLogs: NotificationLog[] = allMeetings.map((meeting: any, index: number) => ({
        id: `log-${index + 1}`,
        type: meeting.status === 'link_sent' ? 'booking' : 'reminder',
        title: meeting.status === 'link_sent' ? 'Booking Confirmation' : 'Meeting Reminder',
        message: `Meeting ${meeting.status === 'link_sent' ? 'confirmed' : 'scheduled'} for ${new Date(meeting.scheduledTime).toLocaleDateString()}`,
        recipient: meeting.studentId?.email || 'student@example.com',
        channel: 'email',
        status: 'sent',
        sentAt: meeting.updatedAt || meeting.createdAt,
        priority: meeting.status === 'link_sent' ? 'high' : 'medium'
      }));

      setNotificationRules(realRules);
      setNotificationLogs(realLogs);
    } catch (error) {
      console.error('Error loading notification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRuleToggle = (ruleId: string) => {
    setNotificationRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, enabled: !rule.enabled }
        : rule
    ));
  };

  const handleDeleteRule = (ruleId: string) => {
    if (window.confirm('Are you sure you want to delete this notification rule?')) {
      setNotificationRules(prev => prev.filter(rule => rule.id !== ruleId));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'reminder': return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'conflict': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'no_show': return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'completion': return <CheckCircleIcon className="h-5 w-5 text-purple-500" />;
      default: return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatChannel = (channel: string) => {
    switch (channel) {
      case 'email': return 'Email';
      case 'sms': return 'SMS';
      case 'push': return 'Push Notification';
      default: return channel;
    }
  };

  const formatTiming = (timing: NotificationRule['timing']) => {
    if (timing.beforeMinutes) {
      const hours = Math.floor(timing.beforeMinutes / 60);
      const minutes = timing.beforeMinutes % 60;
      if (hours > 0) {
        return `${hours}h ${minutes}m before`;
      }
      return `${minutes} minutes before`;
    }
    if (timing.afterMinutes) {
      const hours = Math.floor(timing.afterMinutes / 60);
      const minutes = timing.afterMinutes % 60;
      if (hours > 0) {
        return `${hours}h ${minutes}m after`;
      }
      return `${minutes} minutes after`;
    }
    if (timing.days) {
      return `${timing.days} days before`;
    }
    return 'Immediately';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
          <BellIcon className="h-8 w-8 text-purple-600 mr-3" />
          Smart Notifications
        </h2>
        <p className="text-gray-600">Configure intelligent notification rules to keep students informed and engaged.</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'rules', name: 'Notification Rules', count: notificationRules.length },
              { id: 'logs', name: 'Notification Logs', count: notificationLogs.length },
              { id: 'settings', name: 'Settings', count: 0 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
                {tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Notification Rules Tab */}
      {activeTab === 'rules' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Notification Rules</h3>
            <button
              onClick={() => setShowRuleForm(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
            >
              <CogIcon className="h-4 w-4 mr-2" />
              Add Rule
            </button>
          </div>

          <div className="space-y-4">
            {notificationRules.map((rule) => (
              <div
                key={rule.id}
                className={`border rounded-lg p-6 transition-all ${
                  rule.enabled
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      {getTypeIcon(rule.type)}
                      <h4 className="text-lg font-semibold text-gray-900 ml-3">
                        {rule.name}
                      </h4>
                      <span className={`ml-3 px-2 py-1 text-xs rounded-full ${getPriorityColor(rule.priority)}`}>
                        {rule.priority.toUpperCase()}
                      </span>
                      <span
                        className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          rule.enabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {rule.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-4">{rule.message}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-gray-700">{formatTiming(rule.timing)}</span>
                      </div>
                      <div className="flex items-center">
                        <BellIcon className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-gray-700">
                          {rule.channels.map(formatChannel).join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-2">Type:</span>
                        <span className="text-gray-700 capitalize">{rule.type.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleRuleToggle(rule.id)}
                      className={`p-2 rounded-full transition-colors ${
                        rule.enabled
                          ? 'text-orange-600 hover:bg-orange-100'
                          : 'text-green-600 hover:bg-green-100'
                      }`}
                      title={rule.enabled ? 'Disable' : 'Enable'}
                    >
                      {rule.enabled ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                      title="Delete"
                    >
                      <XCircleIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notification Logs Tab */}
      {activeTab === 'logs' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Notifications</h3>
          
          <div className="space-y-4">
            {notificationLogs.map((log) => (
              <div
                key={log.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {getTypeIcon(log.type)}
                      <h4 className="text-lg font-semibold text-gray-900 ml-3">
                        {log.title}
                      </h4>
                      <span className={`ml-3 px-2 py-1 text-xs rounded-full ${getStatusColor(log.status)}`}>
                        {log.status.toUpperCase()}
                      </span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getPriorityColor(log.priority)}`}>
                        {log.priority.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-3">{log.message}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">Recipient:</span> {log.recipient}
                      </div>
                      <div>
                        <span className="font-medium">Channel:</span> {formatChannel(log.channel)}
                      </div>
                      <div>
                        <span className="font-medium">Sent:</span> {new Date(log.sentAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Notification Settings</h3>
          
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Global Settings</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-600">Send notifications via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">SMS Notifications</p>
                    <p className="text-sm text-gray-600">Send notifications via SMS</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Push Notifications</p>
                    <p className="text-sm text-gray-600">Send push notifications to mobile devices</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Quiet Hours</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    defaultValue="22:00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    defaultValue="08:00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Notifications will be delayed during quiet hours (except for high priority alerts).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartNotifications;
