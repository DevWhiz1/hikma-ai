import React from 'react';
import { authService } from '../services/authService';
import { NavLink, useLocation } from 'react-router-dom';
import { HomeIcon, ChatBubbleLeftRightIcon, GlobeAltIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import hikmahLogo from '../../assets/logo.png';
interface SidebarProps {
  isOpen: boolean;
  setActiveTab: (tab: string) => void;
  onNavigate?: () => void; // callback to close on mobile
}

const baseNavigationItems = [
  { name: 'Home', icon: HomeIcon, id: 'home', path: '/' },
  { name: 'Hikmah Chat', icon: ChatBubbleLeftRightIcon, id: 'chat', path: '/chat' },
  { name: 'Find Qibla', icon: GlobeAltIcon, id: 'qibla', path: '/qibla' },
  { name: 'Prayer Times', icon: GlobeAltIcon, id: 'prayer-times', path: '/prayer-times' },
  { name: 'Hadith Explorer', icon: BookOpenIcon, id: 'resources', path: '/hadith' },
  {name: 'Tasbih Counter', icon: GlobeAltIcon, id: 'tasbih', path: '/tasbih' },
  {name: 'Scholars', icon: BookOpenIcon, id: 'scholars', path: '/scholars'},
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setActiveTab, onNavigate }) => {
  const location = useLocation();
  const isDashboardPage = location.pathname.includes('/scholars/dashboard') || location.pathname.includes('/admin');
  
  console.log('Sidebar isOpen:', isOpen);
  
  const handleClick = (id: string) => {
    setActiveTab(id);
    onNavigate?.();
  };

  const user = authService.getUser();
  const navigationItems = React.useMemo(() => {
    const items = [...baseNavigationItems];
    if (user?.role === 'admin') {
      items.push({ name: 'Admin', icon: BookOpenIcon, id: 'admin', path: '/admin' });
    }
    if (user?.role === 'scholar') {
      items.push({ name: 'Scholar Dashboard', icon: BookOpenIcon, id: 'scholar-dashboard', path: '/scholars/dashboard' });
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
          <div className="flex items-center p-2 mb-6 select-none">
            <img src={`${hikmahLogo}`} alt="Islamic Scholar Logo" className="h-16 w-16" />
            <h2 className="text-xl font-bold text-amber-500 dark:text-emerald-400 ml-2">Hikmah</h2>
          </div>
          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => handleClick(item.id)}
                className={({ isActive }) => `group relative flex items-center w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200 no-underline hover:no-underline
                  ${isActive
                    ? 'text-[#FFFDF9] bg-blue-600 dark:bg-emerald-700 dark:text-gray-300'
                    : `text-[#FFFDF9] hover:bg-blue-700 ${isDashboardPage ? 'hover:[&_*]:text-white' : ''} dark:text-gray-300 dark:hover:bg-emerald-700 dark:hover:text-gray-300`}
                `}
              >
                {({ isActive }) => (
                  <>
                    <span className={`absolute left-0 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full ${isActive ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-transparent'}`} />
                    <item.icon className={`h-5 w-5 mr-3 ${isActive ? 'text-[#FFFDF9] dark:text-gray-300' : 'text-[#FFFDF9] dark:text-gray-300'}`} />
                    <span className={`font-medium truncate ${isActive ? 'dark:text-gray-300' : 'dark:text-gray-300'}`}>{item.name}</span>
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