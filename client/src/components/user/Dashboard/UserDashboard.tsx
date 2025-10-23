import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../../services/authService';
import { getMyEnrollments } from '../../../services/scholarService';
import PaymentSummary from '../../shared/PaymentSummary/PaymentSummary';
import { 
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  BookOpenIcon,
  GlobeAltIcon,
  HandRaisedIcon,
  UserGroupIcon,
  ChevronRightIcon,
  ChartBarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

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

const UserDashboard = () => {
  const user = authService.getUser();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  useEffect(() => {
    if (user?.role === 'user') {
      loadEnrollments();
    }
  }, [user?.role]);

  const loadEnrollments = async () => {
    try {
      const enrollments = await getMyEnrollments();
      setEnrollments(enrollments || []);
    } catch (error) {
      console.error('Failed to load enrollments:', error);
    }
  };

  // Redirect scholars to their dashboard
  if (user?.role === 'scholar') {
    navigate('/scholars/dashboard');
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting to Scholar Dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect admins to their dashboard
  if (user?.role === 'admin') {
    navigate('/admin');
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting to Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  const userFeatures = [
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'AI Scholar Chat',
      description: 'Get instant Islamic guidance from our AI assistant',
      link: '/chat',
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-600'
    },
    {
      icon: UserGroupIcon,
      title: 'Connect with Scholars',
      description: 'Find and enroll with qualified Islamic scholars',
      link: '/scholars',
      color: 'green',
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      icon: CalendarIcon,
      title: 'Prayer Times',
      description: 'Never miss a prayer with accurate timings',
      link: '/prayer-times',
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      icon: GlobeAltIcon,
      title: 'Qibla Finder',
      description: 'Find the direction to the Kaaba',
      link: '/qibla',
      color: 'indigo',
      gradient: 'from-indigo-500 to-purple-600'
    },
    {
      icon: HandRaisedIcon,
      title: 'Tasbih Counter',
      description: 'Track your dhikr and remembrance',
      link: '/tasbih',
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      icon: BookOpenIcon,
      title: 'Hadith Explorer',
      description: 'Search and explore authentic hadith',
      link: '/hadith',
      color: 'teal',
      gradient: 'from-teal-500 to-emerald-600'
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Payment Tracking',
      description: 'Track your payments and spending history',
      link: '/payments',
      color: 'lime',
      gradient: 'from-lime-500 to-emerald-600'
    },
  ];


  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">

      <div className="px-6 pb-12 pt-6 max-w-7xl mx-auto">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/50 rounded-xl">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-400">Active Chats</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">--</p>
              </div>
            </div>
          </div>
           <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
            <div className="flex items-center">
               <div className="p-3 bg-emerald-50 dark:bg-emerald-900/50 rounded-xl">
                 <UserGroupIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="ml-4">
                 <p className="text-sm font-medium text-gray-700 dark:text-gray-400">Enrolled Scholars</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{enrollments.length}</p>
              </div>
            </div>
          </div>
           <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
            <div className="flex items-center">
               <div className="p-3 bg-emerald-50 dark:bg-emerald-900/50 rounded-xl">
                 <CalendarIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="ml-4">
                 <p className="text-sm font-medium text-gray-700 dark:text-gray-400">Prayer Streak</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">--</p>
              </div>
            </div>
          </div>
           <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
            <div className="flex items-center">
               <div className="p-3 bg-emerald-50 dark:bg-emerald-900/50 rounded-xl">
                 <ChartBarIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="ml-4">
                 <p className="text-sm font-medium text-gray-700 dark:text-gray-400">Learning Progress</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">--</p>
              </div>
            </div>
          </div>
        </div>

        {/* My Enrollments Section */}
        {enrollments.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Scholars</h2>
              <Link 
                to="/scholars" 
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium flex items-center"
              >
                View All <ChevronRightIcon className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment) => (
                <div key={enrollment._id} className="bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 overflow-hidden">
                  <div className="p-6">
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
                        onClick={() => navigate('/chat')}
                        className="flex-1 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        Chat
                      </button>
                      <button
                        onClick={() => navigate('/scholars')}
                        className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Summary */}
        <div className="mb-12">
          <PaymentSummary 
            isScholar={false}
            onViewDetails={() => navigate('/payments')}
          />
        </div>

        {/* Features Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Explore Our Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Link
                  key={index}
                  to={feature.link}
                  className="group block"
                >
                  <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 h-full">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} mb-4 shadow-lg`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                    <div className="mt-4 flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                      Get Started <ChevronRightIcon className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Upcoming Classes Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Upcoming Classes</h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center py-12">
              <CalendarIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Upcoming Classes</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Schedule a meeting with your enrolled scholars to see upcoming classes here.
              </p>
              <button
                onClick={() => navigate('/scholars')}
                className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Schedule a Meeting
              </button>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Begin Your Journey?</h2>
          <p className="text-xl mb-6 opacity-90">
            Join thousands of Muslims learning and growing in their faith with Hikma AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/chat')}
              className="px-8 py-4 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
            >
              Start Chatting
            </button>
            <button
              onClick={() => navigate('/scholars')}
              className="px-8 py-4 bg-emerald-700 text-white font-semibold rounded-xl hover:bg-emerald-800 transition-colors shadow-lg"
            >
              Find Scholars
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
