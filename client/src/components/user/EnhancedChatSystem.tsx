import React, { useState, useEffect } from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  UserGroupIcon, 
  SparklesIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  VideoCameraIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { getMyEnrollments } from '../../services/scholarService';

interface Enrollment {
  _id: string;
  scholar: {
    _id: string;
    user: {
      name: string;
      email: string;
    };
    photoUrl?: string;
    specializations: string[];
    isActive: boolean;
  };
  enrolledAt: string;
}

interface ChatSession {
  _id: string;
  type: 'ai' | 'scholar';
  title: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  scholar?: {
    name: string;
    photoUrl?: string;
  };
}

const EnhancedChatSystem: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ai' | 'scholar'>('all');
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const enrollmentsData = await getMyEnrollments();
      setEnrollments(enrollmentsData || []);

      // Generate real chat sessions from enrollment data
      const realSessions: ChatSession[] = [
        {
          _id: 'ai-1',
          type: 'ai',
          title: 'AI Islamic Assistant',
          lastMessage: 'How can I help you with Islamic knowledge today?',
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0
        },
        ...(enrollmentsData || []).map((enrollment: Enrollment) => ({
          _id: `scholar-${enrollment.scholar._id}`,
          type: 'scholar' as const,
          title: `Chat with ${enrollment.scholar.user.name}`,
          lastMessage: 'Chat session available',
          lastMessageAt: enrollment.updatedAt || enrollment.createdAt,
          unreadCount: 0, // Could be enhanced with real unread count
          scholar: {
            name: enrollment.scholar.user.name,
            photoUrl: enrollment.scholar.user.photoUrl
          }
        }))
      ];

      setChatSessions(realSessions);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = chatSessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || session.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getSessionIcon = (session: ChatSession) => {
    if (session.type === 'ai') {
      return <SparklesIcon className="h-6 w-6 text-purple-600" />;
    }
    return <UserGroupIcon className="h-6 w-6 text-emerald-600" />;
  };

  const getSessionStatus = (session: ChatSession) => {
    if (session.unreadCount > 0) {
      return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
    }
    return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
  };

  const formatLastMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900/20">
      <div className="px-6 py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Chat System</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Connect with AI assistant or your enrolled scholars for guidance and learning
              </p>
            </div>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Chat
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/chat/ai"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center mb-4">
              <SparklesIcon className="h-8 w-8 text-purple-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Chat</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Get instant answers about Islamic teachings, history, and practices from our AI assistant.
            </p>
            <div className="flex items-center text-purple-600 dark:text-purple-400 font-medium">
              Start Chatting
              <PaperAirplaneIcon className="h-4 w-4 ml-2" />
            </div>
          </Link>

          <Link
            to="/chat/scholar"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center mb-4">
              <UserGroupIcon className="h-8 w-8 text-emerald-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Scholar Chat</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Connect directly with your enrolled Islamic scholars for personalized guidance.
            </p>
            <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
              Chat with Scholars
              <PaperAirplaneIcon className="h-4 w-4 ml-2" />
            </div>
          </Link>

          <Link
            to="/upcoming-classes"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center mb-4">
              <CalendarIcon className="h-8 w-8 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Classes</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              View your scheduled sessions and upcoming classes with scholars.
            </p>
            <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium">
              View Schedule
              <CalendarIcon className="h-4 w-4 ml-2" />
            </div>
          </Link>
        </div>

        {/* Chat Sessions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Chats</h2>
              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search chats..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'ai' | 'scholar')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Chats</option>
                  <option value="ai">AI Chats</option>
                  <option value="scholar">Scholar Chats</option>
                </select>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredSessions.map((session) => (
              <div
                key={session._id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => {
                  if (session.type === 'ai') {
                    window.location.href = '/chat/ai';
                  } else {
                    window.location.href = '/chat/scholar';
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {session.type === 'scholar' && session.scholar?.photoUrl ? (
                        <img
                          src={session.scholar.photoUrl}
                          alt={session.scholar.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                          {getSessionIcon(session)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {session.title}
                        </h3>
                        {getSessionStatus(session)}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {session.lastMessage}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {session.lastMessageAt && formatLastMessageTime(session.lastMessageAt)}
                        </span>
                        {session.unreadCount > 0 && (
                          <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 rounded-full">
                            {session.unreadCount} new
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {session.type === 'scholar' && (
                      <div className="flex items-center space-x-1">
                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="Video Call">
                          <VideoCameraIcon className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-green-600 transition-colors" title="Voice Call">
                          <PhoneIcon className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-purple-600 transition-colors" title="Schedule Meeting">
                          <CalendarIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    <div className="text-right">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {session.type === 'ai' ? 'AI Assistant' : 'Scholar Chat'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredSessions.length === 0 && (
            <div className="p-12 text-center">
              <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Chats Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm ? 'No chats match your search criteria.' : 'Start a new conversation to get started.'}
              </p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                Start New Chat
              </button>
            </div>
          )}
        </div>

        {/* New Chat Modal */}
        {showNewChatModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Start New Chat</h3>
                  <button
                    onClick={() => setShowNewChatModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <Link
                    to="/chat/ai"
                    className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setShowNewChatModal(false)}
                  >
                    <SparklesIcon className="h-8 w-8 text-purple-600 mr-4" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">AI Islamic Assistant</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Get instant answers about Islam</p>
                    </div>
                  </Link>

                  <Link
                    to="/chat/scholar"
                    className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setShowNewChatModal(false)}
                  >
                    <UserGroupIcon className="h-8 w-8 text-emerald-600 mr-4" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Chat with Scholar</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Connect with your enrolled scholars</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedChatSystem;
