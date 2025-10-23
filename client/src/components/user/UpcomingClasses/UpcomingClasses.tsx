import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarIcon, 
  ClockIcon, 
  VideoCameraIcon, 
  UserIcon,
  BellIcon,
  PlusIcon,
  ChevronRightIcon,
  AcademicCapIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { getMyEnrollments } from '../../../services/scholarService';
import { authService } from '../../../services/authService';
import { meetingService } from '../../../services/meetingService';

interface Enrollment {
  _id: string;
  scholar: {
    _id: string;
    user: {
      name: string;
    };
    photoUrl?: string;
    specializations?: string[];
  };
  createdAt: string;
}

interface UpcomingClass {
  id: string;
  title: string;
  scholar: {
    name: string;
    photoUrl?: string;
  };
  date: string;
  time: string;
  duration: string;
  meetingLink?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  description?: string;
}

const UpcomingClasses = () => {
  const navigate = useNavigate();
  const user = authService.getUser();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [scholarMeetings, setScholarMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (user?.role === 'user') {
        const enrollments = await getMyEnrollments();
        setEnrollments(enrollments || []);
        
        // Mock upcoming classes data for users
        const mockClasses: UpcomingClass[] = [
          {
            id: '1',
            title: 'Quran Recitation Session',
            scholar: {
              name: 'Dr. Ahmed Hassan',
              photoUrl: 'https://via.placeholder.com/60x60?text=AH'
            },
            date: '2024-01-25',
            time: '10:00 AM',
            duration: '1 hour',
            meetingLink: 'https://meet.google.com/abc-defg-hij',
            status: 'scheduled',
            description: 'Learn proper Quran recitation techniques and tajweed rules.'
          },
          {
            id: '2',
            title: 'Islamic History Discussion',
            scholar: {
              name: 'Sheikh Fatima Al-Zahra',
              photoUrl: 'https://via.placeholder.com/60x60?text=FA'
            },
            date: '2024-01-27',
            time: '2:00 PM',
            duration: '1.5 hours',
            status: 'scheduled',
            description: 'Explore the golden age of Islamic civilization and its contributions.'
          }
        ];
        
        setUpcomingClasses(mockClasses);
      } else if (user?.role === 'scholar') {
        // Load scholar's scheduled meetings
        try {
          const dashboardData = await meetingService.getScholarDashboard();
          setScholarMeetings(dashboardData?.scheduled || []);
        } catch (error) {
          console.error('Failed to load scholar meetings:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = (classItem: UpcomingClass) => {
    if (classItem.meetingLink) {
      window.open(classItem.meetingLink, '_blank');
    } else {
      alert('Meeting link not available yet. Please contact your scholar.');
    }
  };

  const handleScheduleMeeting = () => {
    navigate('/scholars');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'in-progress':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading upcoming classes...</p>
        </div>
      </div>
    );
  }

  // Scholar view
  if (user?.role === 'scholar') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900/20">
        <div className="px-6 py-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Teaching Schedule</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your scheduled sessions with students
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                  <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Scheduled Sessions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{scholarMeetings.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl">
                  <UserGroupIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">--</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                  <AcademicCapIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed Sessions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">--</p>
                </div>
              </div>
            </div>
          </div>

          {/* Scholar Meetings */}
          {scholarMeetings.length > 0 ? (
            <div className="space-y-6">
              {scholarMeetings.map((meeting) => (
                <div key={meeting._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1">
                        <div className="flex items-start space-x-4 mb-4">
                          <img
                            src={meeting.student?.photoUrl || 'https://via.placeholder.com/60x60?text=Student'}
                            alt={meeting.student?.name || 'Student'}
                            className="w-12 h-12 rounded-full object-cover border-2 border-emerald-200 dark:border-emerald-700"
                          />
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                              Session with {meeting.student?.name || 'Student'}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-2">
                              {meeting.reason || 'General Islamic discussion'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            {meeting.scheduledTime ? formatDate(meeting.scheduledTime) : 'Not scheduled yet'}
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-2" />
                            {meeting.scheduledTime ? new Date(meeting.scheduledTime).toLocaleTimeString() : 'TBD'}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            meeting.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
                            meeting.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                          }`}>
                            {meeting.status || 'pending'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 lg:mt-0 lg:ml-6">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={() => navigate(`/chat/scholar/${meeting.chatId?._id}`)}
                            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg"
                          >
                            <UserIcon className="h-5 w-5 mr-2" />
                            Chat with Student
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
              <AcademicCapIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Scheduled Sessions</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                You don't have any scheduled sessions yet. Students will be able to request meetings with you.
              </p>
              <button
                onClick={() => navigate('/scholars/dashboard')}
                className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg mx-auto"
              >
                <AcademicCapIcon className="h-5 w-5 mr-2" />
                Go to Scholar Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // User view
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900/20">
      <div className="px-6 py-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Upcoming Classes</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your scheduled sessions with Islamic scholars
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Scheduled Classes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{upcomingClasses.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl">
                <UserIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Enrolled Scholars</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{enrollments.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                <BellIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Notifications</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">--</p>
              </div>
            </div>
          </div>
        </div>

        {/* Classes List */}
        {upcomingClasses.length > 0 ? (
          <div className="space-y-6">
            {upcomingClasses.map((classItem) => (
              <div key={classItem.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start space-x-4 mb-4">
                        <img
                          src={classItem.scholar.photoUrl || 'https://via.placeholder.com/60x60?text=Scholar'}
                          alt={classItem.scholar.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-emerald-200 dark:border-emerald-700"
                        />
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                            {classItem.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-2">
                            with {classItem.scholar.name}
                          </p>
                          {classItem.description && (
                            <p className="text-gray-500 dark:text-gray-500 text-sm">
                              {classItem.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {formatDate(classItem.date)}
                        </div>
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-2" />
                          {classItem.time} ({classItem.duration})
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(classItem.status)}`}>
                          {classItem.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 lg:mt-0 lg:ml-6">
                      <div className="flex flex-col sm:flex-row gap-3">
                        {classItem.status === 'scheduled' && classItem.meetingLink && (
                          <button
                            onClick={() => handleJoinClass(classItem)}
                            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg"
                          >
                            <VideoCameraIcon className="h-5 w-5 mr-2" />
                            Join Class
                          </button>
                        )}
                        <button
                          onClick={() => navigate('/chat/scholar')}
                          className="flex items-center justify-center px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          <UserIcon className="h-5 w-5 mr-2" />
                          Chat
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
            <CalendarIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Upcoming Classes</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              You don't have any scheduled classes yet. Schedule a meeting with your enrolled scholars to get started.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleScheduleMeeting}
                className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Schedule Meeting
              </button>
              <button
                onClick={() => navigate('/scholars')}
                className="flex items-center justify-center px-6 py-3 bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 font-semibold rounded-lg border-2 border-emerald-600 dark:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-200"
              >
                Find Scholars
                <ChevronRightIcon className="h-5 w-5 ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {enrollments.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Scholars</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment) => (
                <div key={enrollment._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center space-x-4 mb-4">
                    <img
                      src={enrollment.scholar.photoUrl || 'https://via.placeholder.com/60x60?text=Scholar'}
                      alt={enrollment.scholar.user.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-emerald-200 dark:border-emerald-700"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{enrollment.scholar.user.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Islamic Scholar</p>
                    </div>
                  </div>
                  {enrollment.scholar.specializations && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {enrollment.scholar.specializations.slice(0, 2).map((spec, index) => (
                        <span key={index} className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs rounded-full">
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate('/chat/scholar')}
                      className="flex-1 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Chat
                    </button>
                    <button
                      onClick={handleScheduleMeeting}
                      className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Schedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingClasses;
