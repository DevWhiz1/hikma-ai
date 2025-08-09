import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon, ChatBubbleLeftRightIcon, GlobeAltIcon, BookOpenIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navigationItems = [
    { name: 'Home', icon: HomeIcon, id: 'home', path: '/' },
    { name: 'Chat with Scholar', icon: ChatBubbleLeftRightIcon, id: 'chat', path: '/chat' },
    { name: 'Find Qibla', icon: GlobeAltIcon, id: 'qibla', path: '/qibla' },
      {name: 'Prayer Times', icon: GlobeAltIcon, id: 'prayer-times', path: '/prayer-times' },
      { name: 'Islamic Resources', icon: BookOpenIcon, id: 'resources', path: '/resources' },
    { name: 'About', icon: QuestionMarkCircleIcon, id: 'about', path: '/about' },
    
  
  ];

  return (
    <div
      className={`fixed inset-y-0 left-0 z-20 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto`}
    >
      <div className="flex flex-col h-full">
        <div className="p-4">
          <div className="flex items-center justify-center p-2 mb-6">
            <img 
              src="/assets/logo.png" 
              alt="Islamic Scholar Logo" 
              className="h-10 w-10 mr-2" 
            />
            <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              IslamicAI
            </h2>
          </div>
          
          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => setActiveTab(item.id)}
                className={({ isActive }) => `flex items-center w-full px-4 py-3 text-left rounded-lg ${
                  isActive
                    ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                } transition-colors duration-200`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        
        {/* <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 p-3">
            <h3 className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              Prayer Times
            </h3>
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex justify-between py-1">
                <span>Fajr</span>
                <span>4:30 AM</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Dhuhr</span>
                <span>12:30 PM</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Asr</span>
                <span>4:45 PM</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Maghrib</span>
                <span>7:15 PM</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Isha</span>
                <span>8:45 PM</span>
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Sidebar;
