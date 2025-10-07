import React from 'react';
import { authService } from '../services/authService';
import { NavLink } from 'react-router-dom';
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
    return items;
  }, [user?.role]);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out
      ${isOpen ? 'translate-x-0 lg:w-64' : '-translate-x-full lg:w-0 lg:border-transparent'} lg:relative lg:inset-auto overflow-hidden`}
      aria-label="Primary"
    >
      <div className="flex flex-col h-full">
        <div className="p-4 overflow-y-auto">
          <div className="flex items-center p-2 mb-6 select-none">
            <img src={`${hikmahLogo}`} alt="Islamic Scholar Logo" className="h-16 w-16" />
            <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Hikmah</h2>
          </div>
          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => handleClick(item.id)}
                className={({ isActive }) => `flex items-center w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200
                  ${isActive ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span className="font-medium truncate">{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;