import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface AppContentProps {
  children: React.ReactNode;
  setActiveTab: (tab: string) => void;
}

const AppContent: React.FC<AppContentProps> = ({ children, setActiveTab }) => {
  const location = useLocation();

  useEffect(() => {
    // Update the active tab based on the current route
    const path = location.pathname;
    if (path === '/') {
      setActiveTab('home');
    } else if (path === '/chat') {
      setActiveTab('chat');
    } else if (path === '/qibla') {
      setActiveTab('qibla');
    } else if (path === '/resources') {
      setActiveTab('resources');
    } else if (path === '/about') {
      setActiveTab('about');
    }
  }, [location, setActiveTab]);

  return <>{children}</>;
};

export default AppContent;
