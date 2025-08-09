import React from 'react';
import { Bars3Icon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';

interface TopBarProps {
  toggleSidebar: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ toggleSidebar, isDarkMode, toggleDarkMode }) => {
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between bg-white dark:bg-gray-900 shadow-md px-4 py-2">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white focus:outline-none"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
        <h1 className="ml-4 text-xl font-bold text-emerald-600 dark:text-emerald-400">
          Islamic Scholar AI
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
        >
          {isDarkMode ? (
            <SunIcon className="h-5 w-5 text-yellow-500" />
          ) : (
            <MoonIcon className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </div>
    </div>
  );
};

export default TopBar;
