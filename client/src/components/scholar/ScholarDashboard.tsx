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
import SchedulerAnalytics from './SchedulerAnalytics';
import RecurringMeetings from './RecurringMeetings';
import SmartNotifications from './SmartNotifications';
import AISmartScheduler from './AISmartScheduler';
import AIAnalytics from './AIAnalytics';
import IntelligentConflictResolver from './IntelligentConflictResolver';
import PersonalizationEngine from './PersonalizationEngine';
import AIAgentDashboard from './AIAgentDashboard';

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'recurring' | 'notifications' | 'ai-scheduler' | 'ai-analytics' | 'conflict-resolver' | 'personalization' | 'ai-agent'>('dashboard');

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
                to="/scholar/ai-agent" 
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg"
              >
                <SparklesIcon className="h-5 w-5 mr-2" />
                AI Assistant
              </Link>
              <Link 
                to="/scholar/smart-scheduler" 
                className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-lg"
              >
                <CalendarIcon className="h-5 w-5 mr-2" />
                Smart Scheduler
              </Link>
              <Link 
                to="/scholars/profile/edit" 
                className="flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-lg"
              >
                <PencilIcon className="h-5 w-5 mr-2" />
                Edit Profile
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

        {/* Primary Actions - Most Important */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Primary Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/scholar/smart-scheduler')}
              className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-200 text-left group"
            >
              <div className="flex items-center mb-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/70 transition-colors">
                  <SparklesIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <span className="font-semibold text-gray-900 dark:text-white">Smart Scheduler</span>
                  <p className="text-sm text-blue-600 dark:text-blue-400">AI-powered scheduling</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Create and manage meetings with AI assistance</p>
            </button>
            
            <button
              onClick={() => navigate('/scholar/broadcast-management')}
              className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-200 text-left group"
            >
              <div className="flex items-center mb-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/70 transition-colors">
                  <VideoCameraIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <span className="font-semibold text-gray-900 dark:text-white">Broadcast Management</span>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Manage broadcasts</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Create and manage meeting broadcasts for students</p>
            </button>
            
            <button
              onClick={() => navigate('/chat/scholar')}
              className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-200 text-left group"
            >
              <div className="flex items-center mb-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/70 transition-colors">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <span className="font-semibold text-gray-900 dark:text-white">Student Chat</span>
                  <p className="text-sm text-green-600 dark:text-green-400">Communicate</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Chat with your enrolled students</p>
            </button>
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Access</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <button
              onClick={() => navigate('/upcoming-classes')}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 text-center group"
            >
              <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Schedule</span>
            </button>
            
            <button
              onClick={() => navigate('/scholar/feedback')}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 text-center group"
            >
              <StarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Feedback</span>
            </button>
            
            <button
              onClick={() => navigate('/available-meetings')}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 text-center group"
            >
              <EyeIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Available</span>
            </button>
            
            <button
              onClick={() => navigate('/scholars/profile/edit')}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 text-center group"
            >
              <PencilIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Profile</span>
            </button>
            
            <button
              onClick={() => navigate('/scholar/scheduler-analytics')}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 text-center group"
            >
              <ChartBarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Analytics</span>
            </button>
            
            <button
              onClick={() => navigate('/scholar/ai-agent')}
              className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-center group shadow-lg"
            >
              <SparklesIcon className="h-6 w-6 text-white mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-white">AI Agent</span>
            </button>
          </div>
        </div>

        {/* AI-Powered Features */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI-Powered Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/scholar/ai-smart-scheduler')}
              className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-200 text-center group"
            >
              <SparklesIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-gray-900 dark:text-white block mb-1">AI Scheduler</span>
              <p className="text-xs text-gray-600 dark:text-gray-400">Natural language scheduling</p>
            </button>

            <button
              onClick={() => navigate('/scholar/ai-analytics')}
              className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-200 text-center group"
            >
              <ChartBarIcon className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-gray-900 dark:text-white block mb-1">AI Analytics</span>
              <p className="text-xs text-gray-600 dark:text-gray-400">Smart insights & predictions</p>
            </button>

            <button
              onClick={() => navigate('/scholar/conflict-resolver')}
              className="p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-200 dark:border-red-800 hover:shadow-lg transition-all duration-200 text-center group"
            >
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-gray-900 dark:text-white block mb-1">Conflict Resolver</span>
              <p className="text-xs text-gray-600 dark:text-gray-400">Smart conflict resolution</p>
            </button>

            <button
              onClick={() => navigate('/scholar/personalization')}
              className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-lg border border-pink-200 dark:border-pink-800 hover:shadow-lg transition-all duration-200 text-center group"
            >
              <HeartIcon className="h-8 w-8 text-pink-600 dark:text-pink-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-gray-900 dark:text-white block mb-1">Personalization</span>
              <p className="text-xs text-gray-600 dark:text-gray-400">Personalized scheduling</p>
            </button>
          </div>
        </div>

        {/* Advanced Tools */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Advanced Tools</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/scholar/recurring-meetings')}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 text-left group"
            >
              <div className="flex items-center mb-2">
                <ClockIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mr-3" />
                <span className="font-medium text-gray-900 dark:text-white">Recurring Meetings</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Set up automated meeting series</p>
            </button>

            <button
              onClick={() => navigate('/scholar/smart-notifications')}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 text-left group"
            >
              <div className="flex items-center mb-2">
                <BellIcon className="h-6 w-6 text-pink-600 dark:text-pink-400 mr-3" />
                <span className="font-medium text-gray-900 dark:text-white">Smart Notifications</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Intelligent notification management</p>
            </button>

            <button
              onClick={() => navigate('/scholar/scheduler-analytics')}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 text-left group"
            >
              <div className="flex items-center mb-2">
                <ChartBarIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mr-3" />
                <span className="font-medium text-gray-900 dark:text-white">Scheduler Analytics</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Detailed scheduling insights</p>
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          {/* Enrolled Students */}
          <div className="lg:col-span-3">
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

          {/* Scheduled Meetings */}
          <div className="lg:col-span-1">
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

          {/* Notifications Sidebar */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Notifications</h2>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div key={notification.id} className={`p-4 rounded-lg border ${
                      notification.read 
                        ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600' 
                        : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {notification.time}
                          </p>
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
          </div>
        </div>

        {/* Meetings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Scheduled Meetings */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Scheduled Meetings</h2>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              {data.scheduled.length > 0 ? (
                <div className="p-6 space-y-4">
                  {data.scheduled.map((meeting: any) => (
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

        {/* Enhanced Features Content */}
      </div>
    </div>
  );
};

export default ScholarDashboard;
