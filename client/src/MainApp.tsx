import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import TopBar from './components/shared/TopBar';
import Sidebar from './components/shared/Sidebar';
import UserDashboard from './components/user/Dashboard/UserDashboard';
import ScholarProfileView from './components/user/ScholarProfile/ScholarProfileView';
import AIChat from './components/user/Chat/EnhancedAIChat';
import ScholarChat from './components/user/Chat/EnhancedScholarChat';
import UpcomingClasses from './components/user/UpcomingClasses/UpcomingClasses';
import QiblaFinder from './components/features/QiblaFinder';
import AppContent from './components/shared/AppContent';
import PrayerTimesPage from './components/features/PrayerTimes';
import TasbihCounter from './components/features/TasbihCounter';
import HadithExplorer from './components/features/HadithExplorer';
import ScholarApplyForm from './components/scholar/ScholarApplyForm';
import ScholarsPage from './components/user/EnhancedScholarsPage';
import ScholarProfileEditor from './components/scholar/ScholarProfileEditor';
import ScholarDashboard from './components/scholar/ScholarDashboard';
import ScholarFeedbackManagement from './components/scholar/ScholarFeedbackManagement';
import AdminDashboard from './components/admin/AdminDashboard';
import FeedbackButton from './components/shared/FeedbackButton';
import PaymentTracking from './components/user/PaymentTracking/PaymentTracking';
import ScholarPaymentTracking from './components/scholar/PaymentTracking/ScholarPaymentTracking';
import BroadcastMeetings from './components/user/BroadcastMeetings';
import SmartScheduler from './components/scholar/SmartScheduler';
import BroadcastManagement from './components/scholar/BroadcastManagement';
import { authService } from './services/authService';

// Enhanced Feature Pages
import SmartSchedulerPage from './pages/scholar/SmartSchedulerPage';
import AISmartSchedulerPage from './pages/scholar/AISmartSchedulerPage';
import BroadcastManagementPage from './pages/scholar/BroadcastManagementPage';
import SchedulerAnalyticsPage from './pages/scholar/SchedulerAnalyticsPage';
import AIAnalyticsPage from './pages/scholar/AIAnalyticsPage';
import RecurringMeetingsPage from './pages/scholar/RecurringMeetingsPage';
import SmartNotificationsPage from './pages/scholar/SmartNotificationsPage';
import ConflictResolverPage from './pages/scholar/ConflictResolverPage';
import PersonalizationPage from './pages/scholar/PersonalizationPage';
import AIAgentDashboardPage from './pages/scholar/AIAgentDashboardPage';
import AvailableMeetingsPage from './pages/user/AvailableMeetingsPage';
import AssignmentsPage from './pages/scholar/AssignmentsPage';
import AssignmentCreatePage from './pages/scholar/AssignmentCreatePage';
import AssignmentSubmissionsPage from './pages/scholar/AssignmentSubmissionsPage';
import SubmissionsInboxPage from './pages/scholar/SubmissionsInboxPage';
import TakeAssignmentPage from './pages/user/TakeAssignmentPage';
import MySubmissionsPage from './pages/user/MySubmissionsPage';
import AvailableAssignmentsPage from './pages/user/AvailableAssignmentsPage';
import AvailableQuizzesPage from './pages/user/AvailableQuizzesPage';
import AssignmentBuilderPage from './pages/scholar/AssignmentBuilderPage';

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

  // Check if current route is admin
  const isAdminRoute = location.pathname.startsWith('/admin');

  // If admin route, render AdminDashboard without main layout
  if (isAdminRoute) {
    return (
      <div className={`App min-h-screen ${isDarkMode ? 'dark' : ''}`}>
        <AdminDashboard />
      </div>
    );
  }

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
                  <Route path="/" element={<UserDashboard />} />
                  <Route path="/chat" element={<AIChat />} />
                  <Route path="/chat/ai" element={<AIChat />} />
                  <Route path="/chat/ai/:sessionId" element={<AIChat />} />
                  <Route path="/chat/scholar" element={<ScholarChat />} />
                  <Route path="/chat/scholar/:sessionId" element={<ScholarChat />} />
                  <Route path="/scholar/:id" element={<ScholarProfileView />} />
                  <Route path="/upcoming-classes" element={<UpcomingClasses />} />
                  <Route path="/hadith" element={<HadithExplorer />} />
                  <Route path="/scholars" element={<ScholarsPage />} />
                  <Route path="/scholars/apply" element={<ScholarApplyForm />} />
                  <Route path="/scholars/profile/edit" element={<ScholarProfileEditor />} />
                  <Route path="/scholars/dashboard" element={<ScholarDashboard />} />
                  <Route path="/scholar/feedback" element={<ScholarFeedbackManagement />} />
                  {/* Enhanced Feature Pages */}
                  <Route path="/scholar/smart-scheduler" element={<SmartSchedulerPage />} />
                  <Route path="/scholar/ai-smart-scheduler" element={<AISmartSchedulerPage />} />
                  <Route path="/scholar/broadcast-management" element={<BroadcastManagementPage />} />
                  <Route path="/scholar/scheduler-analytics" element={<SchedulerAnalyticsPage />} />
                  <Route path="/scholar/ai-analytics" element={<AIAnalyticsPage />} />
                  <Route path="/scholar/recurring-meetings" element={<RecurringMeetingsPage />} />
                  <Route path="/scholar/smart-notifications" element={<SmartNotificationsPage />} />
                  <Route path="/scholar/conflict-resolver" element={<ConflictResolverPage />} />
                  <Route path="/scholar/personalization" element={<PersonalizationPage />} />
                  <Route path="/scholar/ai-agent" element={<AIAgentDashboardPage />} />
                  <Route path="/available-meetings" element={<AvailableMeetingsPage />} />
                  {/* Assignments */}
                  <Route path="/quizzes" element={<AvailableQuizzesPage />} />
                  <Route path="/assignments" element={<AvailableAssignmentsPage />} />
                  <Route path="/scholar/assignments" element={<AssignmentsPage />} />
                  <Route path="/scholar/assignments/new" element={<AssignmentCreatePage />} />
                  <Route path="/scholar/assignments/:id/builder" element={<AssignmentBuilderPage />} />
                  <Route path="/scholar/assignments/:id/submissions" element={<AssignmentSubmissionsPage />} />
                  <Route path="/scholar/submissions" element={<SubmissionsInboxPage />} />
                  <Route path="/assignments/:id/take" element={<TakeAssignmentPage />} />
                  <Route path="/me/submissions" element={<MySubmissionsPage />} />
                  <Route path="/qibla" element={<QiblaFinder />} />
                  <Route path="/prayer-times" element={<PrayerTimesPage />} />
                  <Route path="/tasbih" element={<TasbihCounter />} />
                  <Route path="/payments" element={<PaymentTracking />} />
                  <Route path="/scholar/payments" element={<ScholarPaymentTracking />} />
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
