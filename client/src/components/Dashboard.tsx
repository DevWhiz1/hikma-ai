import { authService } from '../services/authService';
import { 
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  BookOpenIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  GlobeAltIcon,
  HandRaisedIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const user = authService.getUser();
  
  const userFeatures = [
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Chat with AI Scholar',
      description: 'Get Islamic guidance and answers',
      link: '/chat',
      color: 'emerald'
    },
    {
      icon: CalendarIcon,
      title: 'Prayer Times',
      description: 'View and track your daily prayers',
      link: '/prayer-times',
      color: 'blue'
    },
    {
      icon: GlobeAltIcon,
      title: 'Qibla Finder',
      description: 'Find direction towards the Kaaba',
      link: '/qibla',
      color: 'indigo'
    },
    {
      icon: HandRaisedIcon,
      title: 'Tasbih Counter',
      description: 'Track dhikr counts with ease',
      link: '/tasbih',
      color: 'orange'
    },
    {
      icon: BookOpenIcon,
      title: 'Hadith Explorer',
      description: 'Search hadith & get AI summaries',
      link: '/hadith',
      color: 'purple'
    },
  ];

  const scholarFeatures = [
    // {
    //   icon: UserGroupIcon,
    //   title: 'Student Management',
    //   description: 'Manage your students and sessions',
    //   link: '/scholar/students',
    //   color: 'indigo'
    // },
    // {
    //   icon: CalendarIcon,
    //   title: 'Schedule Meetings',
    //   description: 'Set up consultation sessions',
    //   link: '/scholar/schedule',
    //   color: 'orange'
    // },
    {
      icon: Cog6ToothIcon,
      title: 'Edit Scholar Profile',
      description: 'Update your approved profile details',
      link: '/scholars/profile/edit',
      color: 'emerald'
    },
    // {
    //   icon: ChartBarIcon,
    //   title: 'Analytics',
    //   description: 'View your teaching statistics',
    //   link: '/scholar/analytics',
    //   color: 'green'
    // }
  ];

  const adminFeatures = [
    {
      icon: UserGroupIcon,
      title: 'User Management',
      description: 'Manage all users and scholars',
      link: '/admin/users',
      color: 'red'
    },
    {
      icon: Cog6ToothIcon,
      title: 'System Settings',
      description: 'Configure platform settings',
      link: '/admin/settings',
      color: 'gray'
    },
    {
      icon: ChartBarIcon,
      title: 'Platform Analytics',
      description: 'Monitor platform usage',
      link: '/admin/analytics',
      color: 'blue'
    }
  ];

  const getFeatures = () => {
    switch (user?.role) {
      case 'scholar':
        return [...userFeatures, ...scholarFeatures];
      case 'admin':
        return [...userFeatures, ...scholarFeatures, ...adminFeatures];
      default:
        return userFeatures;
    }
  };

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: string } = {
      emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
      orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
      green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
      red: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
      gray: 'bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800'
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
       <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to <span className="text-emerald-600 dark:text-emerald-400">Islamic Scholar AI</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          Explore Islamic knowledge with our AI-powered scholar assistant. Get answers to your questions, find your Qibla direction, and access reliable Islamic resources.
        </p>
        {/* <div className="relative rounded-xl overflow-hidden h-64 md:h-48 shadow-xl">
          <img 
            src="https://media.istockphoto.com/id/1011940756/photo/muslim-men-praying-during-ramadan.webp?a=1&b=1&s=612x612&w=0&k=20&c=cCDd3Yj5WHUqmq5YElnhZacyMwEMKIbVXdrMDOPkx2c=" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end justify-center pb-8">
            <h2 className="text-white text-2xl font-semibold px-4 text-center">
              "The key to Paradise is Salat, and the key to Salat is Wudu"
            </h2>
          </div>
        </div> */}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getFeatures().map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <Link
              key={index}
              to={feature.link}
              className={`
                block p-6 rounded-xl border-2 transition-all duration-200 
                hover:scale-105 hover:shadow-lg
                ${getColorClasses(feature.color)}
              `}
            >
              <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                <IconComponent className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm opacity-80">{feature.description}</p>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats Section (placeholder for future analytics) */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Chats</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">--</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Prayer Streak</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">--</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Learning Progress</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">--</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
