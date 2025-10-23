import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  UserGroupIcon, 
  CalendarIcon, 
  ChatBubbleLeftRightIcon, 
  VideoCameraIcon,
  ChartBarIcon,
  BellIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  StarIcon,
  EyeIcon,
  PencilIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  HeartIcon,
  BookOpenIcon,
  GlobeAltIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { meetingService } from '../../services/meetingService';
import { authService } from '../../services/authService';
import { getMyScholarProfile } from '../../services/scholarService';
import PaymentSummary from '../shared/PaymentSummary/PaymentSummary';
import PaymentHistory from '../shared/PaymentHistory/PaymentHistory';

interface DashboardData {
  enrolledStudents: any[];
  requested: any[];
  scheduled: any[];
  linkSent: any[];
}

interface ScholarProfile {
  _id: string;
  user: { name: string };
  bio?: string;
  specializations?: string[];
  languages?: string[];
  experienceYears?: number;
  qualifications?: string;
  demoVideoUrl?: string;
  photoUrl?: string;
  approved: boolean;
}

const ScholarDashboard = () => {
  const navigate = useNavigate();
  const user = authService.getUser();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardData>({ 
    enrolledStudents: [], 
    requested: [], 
    scheduled: [], 
    linkSent: [] 
  });
  const [profile, setProfile] = useState<ScholarProfile | null>(null);
  const [analytics, setAnalytics] = useState({
    totalStudents: 0,
    totalSessions: 0,
    averageRating: 0,
    monthlyEarnings: 0,
    completionRate: 0
  });
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'new_enrollment', message: 'New student enrolled in your course', time: '2 hours ago', read: false },
    { id: 2, type: 'meeting_request', message: 'Meeting request from Sarah Ahmed', time: '4 hours ago', read: false },
    { id: 3, type: 'feedback', message: 'New feedback received from student', time: '1 day ago', read: true }
  ]);
  const [error, setError] = useState<string | null>(null);
  const [schedulingMeeting, setSchedulingMeeting] = useState<string | null>(null);
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedEnrolledChatId, setSelectedEnrolledChatId] = useState<string | null>(null);
  const [rescheduleTime, setRescheduleTime] = useState('');

  // Check if user is a scholar
  if (user?.role !== 'scholar') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900/20 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-emerald-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">This dashboard is only available to approved scholars.</p>
          <Link 
            to="/" 
            className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboardData, profileData] = await Promise.all([
        meetingService.getScholarDashboard(),
        getMyScholarProfile()
      ]);
      setData(dashboardData);
      setProfile(profileData);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load scholar dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleScheduleMeeting = async (meetingId: string) => {
    if (!scheduledTime) return;
    
    try {
      const meeting = data.requested.find((m: any) => m._id === meetingId);
      if (!meeting) return;
      
      await meetingService.scheduleMeeting(meeting.chatId._id, scheduledTime);
      setSchedulingMeeting(null);
      setScheduledTime('');
      loadData();
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      alert('Failed to schedule meeting');
    }
  };

  const handleRespondReschedule = async (chatId: string, decision: 'accept'|'reject'|'propose') => {
    try {
      await meetingService.respondReschedule(chatId, decision, decision !== 'reject' ? rescheduleTime : undefined);
      setRescheduleTime('');
      loadData();
    } catch (error) {
      console.error('Error responding to reschedule:', error);
      alert('Failed to respond');
    }
  };

  const handleCancelMeeting = async (chatId: string) => {
    try {
      await meetingService.cancelMeeting(chatId);
      loadData();
    } catch (error) {
      console.error('Error cancelling meeting:', error);
      alert('Failed to cancel');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading scholar dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900/20 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-emerald-600 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={loadData}
            className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900/20">
      <div className="px-6 py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Scholar Dashboard
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Welcome back, {profile?.user?.name || user?.name}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 mt-4 lg:mt-0">
              <Link 
                to="/scholar/feedback" 
                className="flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-lg"
              >
                <StarIcon className="h-5 w-5 mr-2" />
                View Feedback
              </Link>
              <Link 
                to="/scholars/profile/edit" 
                className="flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-lg"
              >
                <PencilIcon className="h-5 w-5 mr-2" />
                Edit Profile
              </Link>
              <Link 
                to="/" 
                className="flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors shadow-lg"
              >
                <ArrowRightIcon className="h-5 w-5 mr-2" />
                Main App
              </Link>
            </div>
          </div>
        </div>

        {/* Profile Status Card */}
        {profile && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-6">
              <img
                src={profile.photoUrl || 'https://via.placeholder.com/80x80?text=Scholar'}
                alt={profile.user.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-emerald-200 dark:border-emerald-700"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.user.name}</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    profile.approved 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                      : 'bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-300'
                  }`}>
                    {profile.approved ? 'Approved' : 'Pending Approval'}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-2">{profile.bio}</p>
                <div className="flex flex-wrap gap-2">
                  {profile.specializations?.slice(0, 3).map((spec, index) => (
                    <span key={index} className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs rounded-full">
                      {spec}
                    </span>
                  ))}
                  {profile.specializations && profile.specializations.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                      +{profile.specializations.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
                <UserGroupIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Enrolled Students</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.enrolledStudents.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-teal-100 dark:bg-teal-900/50 rounded-xl">
                <BellIcon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Meeting Requests</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.requested.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl">
                <CalendarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Scheduled Meetings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.scheduled.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-lime-100 dark:bg-lime-900/50 rounded-xl">
                <VideoCameraIcon className="h-6 w-6 text-lime-600 dark:text-lime-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Meetings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.linkSent.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Analytics</h3>
              <ChartBarIcon className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                    <StarIcon className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">Average Rating</span>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">4.8/5.0</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">Completion Rate</span>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">94%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-teal-100 dark:bg-teal-900/50 rounded-lg">
                    <BookOpenIcon className="h-4 w-4 text-teal-600" />
                  </div>
                  <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">Total Sessions</span>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">127</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-lime-100 dark:bg-lime-900/50 rounded-lg">
                    <CurrencyDollarIcon className="h-4 w-4 text-lime-600" />
                  </div>
                  <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">Monthly Earnings</span>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">$2,450</span>
              </div>
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
              <BellIcon className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="space-y-3">
              {notifications.slice(0, 4).map((notification) => (
                <div key={notification.id} className={`p-3 rounded-lg border ${
                  notification.read 
                    ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600' 
                    : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">{notification.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.time}</p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-emerald-500 rounded-full ml-2"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium">
              View All Notifications
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/scholars/profile/edit')}
              className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 text-left"
            >
              <div className="flex items-center mb-2">
                <PencilIcon className="h-5 w-5 text-emerald-600 mr-2" />
                <span className="font-medium text-gray-900 dark:text-white">Edit Profile</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Update your bio and specializations</p>
            </button>
            
            <button
              onClick={() => navigate('/scholar/feedback')}
              className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 text-left"
            >
              <div className="flex items-center mb-2">
                <StarIcon className="h-5 w-5 text-teal-600 mr-2" />
                <span className="font-medium text-gray-900 dark:text-white">View Feedback</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Check student reviews and ratings</p>
            </button>
            
            <button
              onClick={() => navigate('/upcoming-classes')}
              className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 text-left"
            >
              <div className="flex items-center mb-2">
                <CalendarIcon className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-gray-900 dark:text-white">Schedule</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Manage your teaching schedule</p>
            </button>
            
            <button
              onClick={() => navigate('/chat/scholar')}
              className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 text-left"
            >
              <div className="flex items-center mb-2">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-lime-600 mr-2" />
                <span className="font-medium text-gray-900 dark:text-white">Chat</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Communicate with students</p>
            </button>
          </div>
        </div>

        {/* Enrolled Students */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Enrolled Students</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {data.enrolledStudents.length} total students
            </span>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            {data.enrolledStudents.length > 0 ? (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.enrolledStudents.map((student: any) => (
                    <div
                      key={student.chatId}
                      className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      {selectedEnrolledChatId === student.chatId ? (
                        <div className="space-y-3">
                          <div className="text-sm text-gray-700 dark:text-gray-200 mb-2">
                            Schedule a meeting with {student.student?.name}
                          </div>
                          <input
                            type="datetime-local"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                if (!scheduledTime) return;
                                try {
                                  await meetingService.scheduleMeeting(student.chatId, scheduledTime);
                                  setScheduledTime('');
                                  setSelectedEnrolledChatId(null);
                                  loadData();
                                } catch (err) {
                                  console.error('Schedule failed:', err);
                                  alert('Failed to schedule meeting');
                                }
                              }}
                              disabled={!scheduledTime}
                              className="flex-1 px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                              Schedule
                            </button>
                            <button
                              onClick={() => { setSelectedEnrolledChatId(null); setScheduledTime(''); }}
                              className="flex-1 px-3 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div onClick={() => setSelectedEnrolledChatId(student.chatId)} className="cursor-pointer">
                          <div className="font-medium text-gray-900 dark:text-white mb-1">{student.student?.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Last activity: {new Date(student.lastActivity).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <UserGroupIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Enrolled Students</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Students will appear here once they enroll with you.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Meeting Requests */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Meeting Requests</h2>
            {data.requested.length > 0 && (
              <span className="px-3 py-1 bg-lime-100 dark:bg-lime-900/50 text-lime-800 dark:text-lime-300 text-sm font-medium rounded-full">
                {data.requested.length} pending
              </span>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            {data.requested.length > 0 ? (
              <div className="p-6 space-y-4">
                {data.requested.map((meeting: any) => (
                  <div key={meeting._id} className="p-4 rounded-xl border border-lime-200 bg-lime-50 dark:bg-lime-900/20 dark:border-lime-800">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{meeting.studentId?.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Chat ID: {meeting.chatId?._id}
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-lime-100 dark:bg-lime-900/50 text-lime-800 dark:text-lime-300 text-sm font-medium rounded-full">
                        Pending
                      </span>
                    </div>
                    
                    {schedulingMeeting === meeting._id ? (
                      <div className="p-4 bg-white dark:bg-gray-700 rounded-lg border">
                        <div className="text-sm font-medium mb-3 text-gray-900 dark:text-white">Schedule Meeting</div>
                        <div className="flex gap-3 items-center">
                          <input
                            type="datetime-local"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-800"
                          />
                          <button
                            onClick={() => handleScheduleMeeting(meeting._id)}
                            disabled={!scheduledTime}
                            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Schedule
                          </button>
                          <button
                            onClick={() => {
                              setSchedulingMeeting(null);
                              setScheduledTime('');
                            }}
                            className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSchedulingMeeting(meeting._id)}
                        className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        Schedule Meeting
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <BellIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Meeting Requests</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Meeting requests from students will appear here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Scheduled & Active Meetings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scheduled Meetings */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Scheduled Meetings</h2>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              {data.scheduled.length > 0 ? (
                <div className="p-6 space-y-4">
                  {data.scheduled.map((meeting: any) => (
                    <div key={meeting._id} className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{meeting.studentId?.name}</div>
                          <div className="text-sm text-emerald-700 dark:text-emerald-300">
                            {meeting.scheduledTime ? new Date(meeting.scheduledTime).toLocaleString() : 'TBD'}
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-sm font-medium rounded-full">
                          Scheduled
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {meeting.link && (
                          <a 
                            className="inline-block px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
                            href={meeting.link} 
                            target="_blank" 
                            rel="noreferrer"
                          >
                            Open Meeting
                          </a>
                        )}
                        <button
                          onClick={() => handleCancelMeeting(meeting.chatId._id)}
                          className="px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <CalendarIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Scheduled Meetings</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Scheduled meetings will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Active Meetings */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Active Meetings</h2>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              {data.linkSent.length > 0 ? (
                <div className="p-6 space-y-4">
                  {data.linkSent.map((meeting: any) => (
                    <div key={meeting._id} className="p-4 rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{meeting.studentId?.name}</div>
                          <div className="text-sm text-green-700 dark:text-green-300">
                            {meeting.scheduledTime ? new Date(meeting.scheduledTime).toLocaleString() : 'Now'}
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-sm font-medium rounded-full">
                          Active
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {meeting.link && (
                          <a 
                            className="inline-block px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
                            href={meeting.link} 
                            target="_blank" 
                            rel="noreferrer"
                          >
                            Join Meeting
                          </a>
                        )}
                        <button
                          onClick={() => handleCancelMeeting(meeting.chatId._id)}
                          className="px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <VideoCameraIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Active Meetings</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Active meetings will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="mb-8">
          <PaymentSummary 
            isScholar={true}
            onViewDetails={() => navigate('/scholar/payments')}
          />
        </div>
      </div>
    </div>
  );
};

export default ScholarDashboard;
