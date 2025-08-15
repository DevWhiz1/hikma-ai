import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ChatBot from './components/ChatBot';
import QiblaFinder from './components/QiblaFinder';
import AppContent from './components/AppContent';
import PrayerTimesPage from './components/PrayerTimes';
import TasbihCounter from './components/TasbihCounter';
import HadithExplorer from './components/HadithExplorer';
import { authService } from './services/authService';

interface MainAppProps {
  setIsAuthenticated: (value: boolean) => void;
}

function MainApp({ setIsAuthenticated }: MainAppProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // default light
  const location = useLocation();
  const isChatRoute = location.pathname.startsWith('/chat');

  // Toggle dark mode and save to localStorage
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(!isDarkMode));
  };

  // Load dark mode preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Handle resize to show sidebar on large screens automatically
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true); // keep open on desktop
      } else {
        setSidebarOpen(false); // closed by default on mobile
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
  };

  return (
    <>
      {/* mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className={`App min-h-screen ${isDarkMode ? 'dark' : ''}`}>
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
          <TopBar
            toggleSidebar={() => setSidebarOpen(prev => !prev)}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            onLogout={handleLogout}
          />
          <AppContent setActiveTab={() => {}}>
            <div className="flex flex-1 overflow-hidden">
              <Sidebar
                isOpen={sidebarOpen}
                setActiveTab={() => {}}
                onNavigate={() => {
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
              />
              <main className={`flex-1 ${isChatRoute ? 'overflow-hidden' : 'overflow-y-auto'} focus:outline-none`} tabIndex={-1}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/chat" element={<ChatBot />} />
                  <Route path="/chat/:sessionId" element={<ChatBot />} />
                  <Route path="/hadith" element={<HadithExplorer />} />
                  <Route path="/qibla" element={<QiblaFinder />} />
                  <Route path="/prayer-times" element={<PrayerTimesPage />} />
                  <Route path="/tasbih" element={<TasbihCounter />} />
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
    </>
  );
}

export default MainApp;
