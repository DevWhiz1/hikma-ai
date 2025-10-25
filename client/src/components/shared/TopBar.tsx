import React from 'react';
import { Bars3Icon, MoonIcon, SunIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { authService } from '../../services/authService';
import WebSocketStatus from './WebSocketStatus';

interface TopBarProps {
  toggleSidebar: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onLogout: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ toggleSidebar, isDarkMode, toggleDarkMode, onLogout }) => {
  const user = authService.getUser();
  
  return (
    <div className="sticky top-0 z-50 flex items-center justify-between bg-white dark:bg-gray-900 shadow-md px-4 py-2 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <button
          onClick={() => {
            console.log('Hamburger clicked');
            toggleSidebar();
          }}
          className="p-2 rounded-md text-gray-700 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50"
          aria-label="Toggle sidebar"
          type="button"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
        <h1 className="ml-4 text-xl font-bold text-emerald-600">
          Hikmah AI
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        <WebSocketStatus />
        {user && (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Welcome, {user.name}
          </span>
        )}
        <button
          onClick={toggleDarkMode}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="relative p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-gray-700 focus:outline-none transition"
        >
          <span className={`block transform transition-transform duration-500 ${isDarkMode ? 'rotate-180' : 'rotate-0'}`}>
            {isDarkMode ? (
              <SunIcon className="h-5 w-5 text-emerald-600" />
            ) : (
              <MoonIcon className="h-5 w-5 text-gray-600" />
            )}
          </span>
        </button>
        <button
          onClick={onLogout}
          className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-gray-700 focus:outline-none"
          title="Logout"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default TopBar;
