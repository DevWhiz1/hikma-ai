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
import ScholarApplyForm from './components/ScholarApplyForm';
import ScholarsPage from './components/ScholarsPage';
import ScholarProfileEditor from './components/ScholarProfileEditor';
import ScholarDashboard from './components/ScholarDashboard';
import ScholarFeedbackManagement from './components/ScholarFeedbackManagement';
import AdminDashboard from './components/AdminDashboard';
import FeedbackButton from './components/FeedbackButton';
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
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem('darkMode', JSON.stringify(next));
    if (next) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  };

  // Load dark mode preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    const dark = saved === 'true';
    setIsDarkMode(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
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
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300 ease-in-out"
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
              <main className={`flex-1 transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-0 lg:ml-64' : 'ml-0'} ${isChatRoute ? 'overflow-hidden' : 'overflow-y-auto'} focus:outline-none`} tabIndex={-1}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/chat" element={<ChatBot />} />
                  <Route path="/chat/:sessionId" element={<ChatBot />} />
                  <Route path="/hadith" element={<HadithExplorer />} />
                  <Route path="/scholars" element={<ScholarsPage />} />
                  <Route path="/scholars/apply" element={<ScholarApplyForm />} />
                  <Route path="/scholars/profile/edit" element={<ScholarProfileEditor />} />
                  <Route path="/scholars/dashboard" element={<ScholarDashboard />} />
                  <Route path="/scholar/feedback" element={<ScholarFeedbackManagement />} />
                  <Route path="/admin" element={<AdminDashboard />} />
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
        
        {/* Feedback Button */}
        <FeedbackButton position="bottom-right" />
      </div>
    </>
  );
}

export default MainApp;
