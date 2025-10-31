import React from 'react';
import { authService } from '../../services/authService';
import { NavLink } from 'react-router-dom';
import { 
  HomeIcon, 
  ChatBubbleLeftRightIcon, 
  GlobeAltIcon, 
  BookOpenIcon, 
  UserGroupIcon, 
  CalendarIcon,
  AcademicCapIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import hikmahLogo from '../../../assets/logo.png';
import { Button } from '@/components/ui/button';
interface SidebarProps {
  isOpen: boolean;
  setActiveTab: (tab: string) => void;
  onNavigate?: () => void; // callback to close on mobile
}

const baseNavigationItems = [
  { name: 'Dashboard', icon: HomeIcon, id: 'home', path: '/' },
  { name: 'AI Chat', icon: ChatBubbleLeftRightIcon, id: 'ai-chat', path: '/chat/ai' },
  { name: 'Chat', icon: UserGroupIcon, id: 'scholar-chat', path: '/chat/scholar' },
  { name: 'Scholars', icon: AcademicCapIcon, id: 'scholars', path: '/scholars' },
  { name: 'Payment Tracking', icon: CurrencyDollarIcon, id: 'payments', path: '/payments' },
  { name: 'Upcoming Classes', icon: CalendarIcon, id: 'upcoming-classes', path: '/upcoming-classes' },
  { name: 'Prayer Times', icon: ClockIcon, id: 'prayer-times', path: '/prayer-times' },
  { name: 'Find Qibla', icon: GlobeAltIcon, id: 'qibla', path: '/qibla' },
  { name: 'Hadith Explorer', icon: BookOpenIcon, id: 'hadith', path: '/hadith' },
  { name: 'Tasbih Counter', icon: GlobeAltIcon, id: 'tasbih', path: '/tasbih' },
  { name: 'Settings', icon: Cog6ToothIcon, id: 'settings', path: '/settings' },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setActiveTab, onNavigate }) => {
  const handleClick = (id: string) => {
    setActiveTab(id);
    onNavigate?.();
  };

  const user = authService.getUser();
  const navigationItems = React.useMemo(() => {
    const items = [...baseNavigationItems];
    
    // Replace payment tracking with role-specific versions
    if (user?.role === 'scholar') {
      // Remove Prayer Times and Tasbih for scholars
      const hiddenForScholar = new Set(['prayer-times', 'tasbih']);
      for (let i = items.length - 1; i >= 0; i--) {
        if (hiddenForScholar.has(items[i].id)) items.splice(i, 1);
      }

      const paymentIndex = items.findIndex(item => item.id === 'payments');
      if (paymentIndex !== -1) {
        items[paymentIndex] = { 
          name: 'Earnings & Payments', 
          icon: CurrencyDollarIcon, 
          id: 'scholar-payments', 
          path: '/scholar/payments' 
        };
      }
      items.push({ name: 'Scholar Dashboard', icon: BookOpenIcon, id: 'scholar-dashboard', path: '/scholars/dashboard' });
  items.push({ name: 'Assignments', icon: BookOpenIcon, id: 'scholar-assignments', path: '/scholar/assignments' });
  items.push({ name: 'Create Assignment', icon: BookOpenIcon, id: 'scholar-assignments-new', path: '/scholar/assignments/new' });
    }

    // Student menu (default users)
    if (!user || user.role === 'user') {
      items.push({ name: 'Quizzes', icon: BookOpenIcon, id: 'quizzes', path: '/quizzes' });
      items.push({ name: 'Assignments', icon: BookOpenIcon, id: 'assignments', path: '/assignments' });
      items.push({ name: 'My Submissions', icon: BookOpenIcon, id: 'my-submissions', path: '/me/submissions' });
    }
    
    if (user?.role === 'admin') {
      items.push({ name: 'Admin', icon: BookOpenIcon, id: 'admin', path: '/admin' });
    }
    
    
    return items;
  }, [user?.role]);

  return (
    <aside
      className={`sidebar fixed top-14 left-0 bottom-0 z-30 w-64 transform bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out
      ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'} overflow-hidden`}
      aria-label="Primary"
    >
      <div className="flex flex-col h-full">
        <div className="p-4 overflow-y-auto">
          <div className="flex items-center p-2 mb-4 select-none">
            <img src={`${hikmahLogo}`} alt="Islamic Scholar Logo" className="h-16 w-16" />
            <h2 className="text-xl font-bold text-emerald-600 ml-2">Hikmah</h2>
          </div>
          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 px-3 mb-2">Main</div>
          <nav className="space-y-1 list-none mb-4">
            {navigationItems.slice(0, 5).map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => handleClick(item.id)}
                className={({ isActive }) => `group relative flex items-center w-full px-3 py-2 rounded-xl transition-colors duration-200 no-underline hover:no-underline border
                  ${isActive
                    ? 'border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#1C2623] text-emerald-700 dark:text-emerald-200 shadow-sm'
                    : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/80 text-gray-800 dark:text-gray-300'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`h-5 w-5 mr-3 ${isActive ? 'text-emerald-700 dark:text-emerald-200' : 'text-gray-800 dark:text-gray-300'}`} />
                    <span className={`font-medium truncate ${isActive ? 'text-emerald-700 dark:text-emerald-200' : 'text-gray-800 dark:text-gray-300'}`}>{item.name}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 px-3 mb-2">Explore</div>
          <nav className="space-y-1 list-none">
            {navigationItems.slice(5).map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => handleClick(item.id)}
                className={({ isActive }) => `group relative flex items-center w-full px-3 py-2 rounded-xl transition-colors duration-200 no-underline hover:no-underline border
                  ${isActive
                    ? 'border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#1C2623] text-emerald-700 dark:text-emerald-200 shadow-sm'
                    : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/80 text-gray-800 dark:text-gray-300'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`h-5 w-5 mr-3 ${isActive ? 'text-emerald-700 dark:text-emerald-200' : 'text-gray-800 dark:text-gray-300'}`} />
                    <span className={`font-medium truncate ${isActive ? 'text-emerald-700 dark:text-emerald-200' : 'text-gray-800 dark:text-gray-300'}`}>{item.name}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;