import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import HomePage from './components/HomePage';
import ChatBot from './components/ChatBot';
import QiblaFinder from './components/QiblaFinder';
import AppContent from './components/AppContent';
import PrayerTimesPage from './components/PrayerTimes';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Toggle dark mode and save to localStorage
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(!isDarkMode));
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setIsDarkMode(JSON.parse(savedDarkMode));
    } else {
      // Check user's system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, []);

  // Apply dark mode to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <Router>
      <div className={`App min-h-screen ${isDarkMode ? 'dark' : ''}`}>
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
          <TopBar
            toggleSidebar={toggleSidebar}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
          />
          
          <AppContent setActiveTab={setActiveTab}>
            <div className="flex flex-1 overflow-hidden">
              <Sidebar
                isOpen={sidebarOpen}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
              
              <main className="flex-1 overflow-y-auto">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/chat" element={<ChatBot />} />
                  <Route path="/qibla" element={<QiblaFinder />} />
                  <Route path="/prayer-times" element={<PrayerTimesPage />} />
                  <Route path="/resources" element={
                    <div className="p-6">
                      <h1 className="text-2xl font-bold mb-4">Islamic Resources</h1>
                      <p>Resources section coming soon...</p>
                    </div>
                  } />
                  <Route path="/about" element={
                    <div className="p-6">
                      <h1 className="text-2xl font-bold mb-4">About Us</h1>
                      <p>About section coming soon...</p>
                    </div>
                  } />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </AppContent>
        </div>
      </div>
    </Router>
  );
}

export default App;