import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, History } from 'lucide-react';
import FeedbackModal from './FeedbackModal';
import FeedbackHistory from '../user/FeedbackHistory';

interface FeedbackButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  variant?: 'floating' | 'inline';
  className?: string;
}

const FeedbackButton: React.FC<FeedbackButtonProps> = ({ 
  position = 'bottom-right', 
  variant = 'floating',
  className = ''
}) => {
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Check if we're on a chat route
  const isChatRoute = location.pathname.startsWith('/chat');

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  // Hide feedback button on chat routes
  if (isChatRoute) {
    return null;
  }

  if (variant === 'inline') {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className={`inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors ${className}`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Feedback</span>
        </button>
        <FeedbackModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        <FeedbackHistory isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      </>
    );
  }

  return (
    <>
      {/* Floating Feedback Button with Menu */}
      <div className={`fixed ${positionClasses[position]} z-40 feedback-floating !bg-transparent`}>
        {/* Menu */}
        {showMenu && (
          <div className="absolute bottom-16 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[200px]">
            <button
              onClick={() => {
                setIsModalOpen(true);
                setShowMenu(false);
              }}
              className="feedback-menu-item w-full px-4 py-3 text-left hover:bg-emerald-50 dark:hover:bg-gray-700 flex items-center space-x-3 rounded-lg"
            >
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <span className="text-gray-900 dark:text-white">Submit Feedback</span>
            </button>
            <button
              onClick={() => {
                setIsHistoryOpen(true);
                setShowMenu(false);
              }}
              className="feedback-menu-item w-full px-4 py-3 text-left hover:bg-emerald-50 dark:hover:bg-gray-700 flex items-center space-x-3 rounded-lg"
            >
              <History className="w-5 h-5 text-blue-600" />
              <span className="text-gray-900 dark:text-white">View History</span>
            </button>
          </div>
        )}

        {/* Main Button */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          title="Feedback Menu"
        >
          <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Modals */}
      <FeedbackModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <FeedbackHistory isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </>
  );
};

export default FeedbackButton;
