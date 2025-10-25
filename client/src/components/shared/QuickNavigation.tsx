import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  SparklesIcon, 
  ChartBarIcon, 
  ClockIcon, 
  BellIcon, 
  ExclamationTriangleIcon, 
  HeartIcon,
  CalendarIcon,
  UsersIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

interface QuickNavigationProps {
  userRole?: 'user' | 'scholar' | 'admin';
}

const QuickNavigation: React.FC<QuickNavigationProps> = ({ userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const scholarQuickLinks = [
    {
      name: 'Smart Scheduler',
      path: '/scholar/smart-scheduler',
      icon: SparklesIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'AI Smart Scheduler',
      path: '/scholar/ai-smart-scheduler',
      icon: SparklesIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      name: 'Broadcast Management',
      path: '/scholar/broadcast-management',
      icon: UsersIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Scheduler Analytics',
      path: '/scholar/scheduler-analytics',
      icon: ChartBarIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      name: 'AI Analytics',
      path: '/scholar/ai-analytics',
      icon: ChartBarIcon,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100'
    },
    {
      name: 'Recurring Meetings',
      path: '/scholar/recurring-meetings',
      icon: ClockIcon,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    },
    {
      name: 'Smart Notifications',
      path: '/scholar/smart-notifications',
      icon: BellIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      name: 'Conflict Resolver',
      path: '/scholar/conflict-resolver',
      icon: ExclamationTriangleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      name: 'Personalization',
      path: '/scholar/personalization',
      icon: HeartIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      name: 'AI Agent Dashboard',
      path: '/scholar/ai-agent',
      icon: AcademicCapIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    }
  ];

  const userQuickLinks = [
    {
      name: 'Available Meetings',
      path: '/available-meetings',
      icon: CalendarIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Chat with Scholars',
      path: '/chat',
      icon: UsersIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Upcoming Classes',
      path: '/upcoming-classes',
      icon: ClockIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  const quickLinks = userRole === 'scholar' ? scholarQuickLinks : userQuickLinks;
  const dashboardPath = userRole === 'scholar' ? '/scholars/dashboard' : '/';

  const isCurrentPage = (path: string) => {
    return location.pathname === path;
  };

  if (quickLinks.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Quick Navigation</h3>
        <button
          onClick={() => navigate(dashboardPath)}
          className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <HomeIcon className="h-4 w-4 mr-2" />
          Dashboard
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          const isActive = isCurrentPage(link.path);
          
          return (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                isActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center mb-2">
                <div className={`p-2 rounded-full mr-3 ${link.bgColor}`}>
                  <Icon className={`h-4 w-4 ${link.color}`} />
                </div>
                <span className={`text-sm font-medium ${
                  isActive ? 'text-blue-900' : 'text-gray-900'
                }`}>
                  {link.name}
                </span>
              </div>
              {isActive && (
                <div className="text-xs text-blue-600 font-medium">
                  Current Page
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickNavigation;
