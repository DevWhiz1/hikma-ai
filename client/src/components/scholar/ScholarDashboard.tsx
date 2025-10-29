import { useEffect, useState } from 'react';
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
  StarIcon,
  PencilIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { meetingService } from '../../services/meetingService';
import { authService } from '../../services/authService';
import { getMyScholarProfile, getMyEnrolledStudents } from '../../services/scholarService';

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
  const [error, setError] = useState<string | null>(null);
  const [schedulingMeeting, setSchedulingMeeting] = useState<string | null>(null);
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedEnrolledChatId, setSelectedEnrolledChatId] = useState<string | null>(null);

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
      const [dashboardData, profileData, enrolledStudentsData] = await Promise.all([
        meetingService.getScholarDashboard(),
        getMyScholarProfile(),
        getMyEnrolledStudents().catch(() => []) // Fallback if this fails
      ]);
      
      // Debug: Log the data to see what we're getting (remove in production)
      console.log('Dashboard data:', dashboardData);
      console.log('Enrolled students from dashboard:', dashboardData.enrolledStudents);
      console.log('Enrolled students from service:', enrolledStudentsData);
      
      // Use enrolled students from the dedicated service if dashboard doesn't have them
      if (dashboardData.enrolledStudents && dashboardData.enrolledStudents.length > 0) {
        setData(dashboardData);
      } else if (enrolledStudentsData && enrolledStudentsData.length > 0) {
        // Use the fallback data
        setData({
          ...dashboardData,
          enrolledStudents: enrolledStudentsData
        });
      } else {
        setData(dashboardData);
      }
      
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Streamlined Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {profile?.user?.name || user?.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your teaching schedule and student interactions
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link 
                to="/scholar/ai-agent" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <SparklesIcon className="h-4 w-4 mr-2" />
                AI Assistant
              </Link>
              <Link 
                to="/scholars/profile/edit" 
                className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Key Metrics - Simplified */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <UserGroupIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Students</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{data.enrolledStudents.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                <BellIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Requests</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{data.requested.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Scheduled</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{data.scheduled.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <VideoCameraIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{data.linkSent.length}</p>
              </div>
            </div>
          </div>
        </div>


        {/* Quick Actions - Most Important */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/scholar/smart-scheduler')}
              className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 text-left group"
            >
              <div className="flex items-center mb-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/70 transition-colors">
                  <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <span className="font-semibold text-gray-900 dark:text-white">Schedule Meeting</span>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Create new meeting</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Schedule a meeting with your students</p>
            </button>
            
            <button
              onClick={() => navigate('/chat/scholar')}
              className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 text-left group"
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
            
            <button
              onClick={() => navigate('/scholar/broadcast-management')}
              className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 text-left group"
            >
              <div className="flex items-center mb-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/70 transition-colors">
                  <VideoCameraIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <span className="font-semibold text-gray-900 dark:text-white">Broadcast</span>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Manage broadcasts</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Create meeting broadcasts for students</p>
            </button>
          </div>
        </div>

        {/* Enrolled Students Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Enrolled Students</h2>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-sm font-medium rounded-full">
              {data.enrolledStudents.length} students
            </span>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            {data.enrolledStudents.length > 0 ? (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.enrolledStudents.map((student: any) => (
                    <div key={student.chatId} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                              {student.student?.name?.charAt(0) || 'S'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{student.student?.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Last activity: {new Date(student.lastActivity).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedEnrolledChatId(student.chatId)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                          title="Schedule meeting"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/chat/scholar?student=${student.chatId}`)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Chat
                        </button>
                        <button
                          onClick={() => setSelectedEnrolledChatId(student.chatId)}
                          className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Schedule
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <UserGroupIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Enrolled Students</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Students will appear here once they enroll with you.
                </p>
                <button
                  onClick={() => navigate('/scholars')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Scholar Profiles
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Meeting Requests - Priority Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Meeting Requests</h2>
                  {data.requested.length > 0 && (
                    <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300 text-sm font-medium rounded-full">
                      {data.requested.length} pending
                    </span>
                  )}
                </div>
              </div>
              <div className="p-6">
                {data.requested.length > 0 ? (
                  <div className="space-y-4">
                    {data.requested.slice(0, 3).map((meeting: any) => (
                      <div key={meeting._id} className="p-4 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{meeting.studentId?.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Requested: {new Date(meeting.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300 text-xs font-medium rounded-full">
                            Pending
                          </span>
                        </div>
                        
                        {schedulingMeeting === meeting._id ? (
                          <div className="p-3 bg-white dark:bg-gray-700 rounded-lg border">
                            <div className="text-sm font-medium mb-2 text-gray-900 dark:text-white">Schedule Meeting</div>
                            <div className="flex gap-2 items-center">
                              <input
                                type="datetime-local"
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800"
                              />
                              <button
                                onClick={() => handleScheduleMeeting(meeting._id)}
                                disabled={!scheduledTime}
                                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                Schedule
                              </button>
                              <button
                                onClick={() => {
                                  setSchedulingMeeting(null);
                                  setScheduledTime('');
                                }}
                                className="px-3 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSchedulingMeeting(meeting._id)}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Schedule Meeting
                          </button>
                        )}
                      </div>
                    ))}
                    {data.requested.length > 3 && (
                      <button className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                        View all {data.requested.length} requests
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BellIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No Meeting Requests</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Meeting requests from students will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                      <StarIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">Rating</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">4.8/5.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                      <CheckCircleIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">Completion</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">94%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                      <CurrencyDollarIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">Earnings</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">$2,450</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">New student enrolled</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Meeting completed</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">4 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <StarIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">New feedback received</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">1 day ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Tools */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Tools</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <button
              onClick={() => navigate('/scholar/smart-scheduler')}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 text-center group"
            >
              <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Scheduler</span>
            </button>
            
            <button
              onClick={() => navigate('/scholar/feedback')}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 text-center group"
            >
              <StarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Feedback</span>
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
            
            <button
              onClick={() => navigate('/scholar/recurring-meetings')}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 text-center group"
            >
              <ClockIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Recurring</span>
            </button>
            
            <button
              onClick={() => navigate('/scholars/profile/edit')}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 text-center group"
            >
              <PencilIcon className="h-6 w-6 text-gray-600 dark:text-gray-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Profile</span>
            </button>
          </div>
        </div>

        {/* Meeting Scheduling Modal */}
        {selectedEnrolledChatId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Schedule Meeting</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      if (!scheduledTime) return;
                      try {
                        await meetingService.scheduleMeeting(selectedEnrolledChatId, scheduledTime);
                        setScheduledTime('');
                        setSelectedEnrolledChatId(null);
                        loadData();
                      } catch (err) {
                        console.error('Schedule failed:', err);
                        alert('Failed to schedule meeting');
                      }
                    }}
                    disabled={!scheduledTime}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Schedule
                  </button>
                  <button
                    onClick={() => { setSelectedEnrolledChatId(null); setScheduledTime(''); }}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScholarDashboard;
