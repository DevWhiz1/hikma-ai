import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  PaperAirplaneIcon, 
  ArrowPathIcon, 
  SparklesIcon,
  LightBulbIcon,
  BookOpenIcon,
  GlobeAltIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { enhancedChatService, ChatSession, ChatMessage } from '../../../services/enhancedChatService';
import { authService } from '../../../services/authService';
import AIChatHistory from '../../shared/AIChatHistory';

const EnhancedAIChat = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const user = authService.getUser();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [showHistory, setShowHistory] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768) ? false : true);
  const isMobile = useRef(false);
  const skipNextLoad = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Load specific session when sessionId changes
  useEffect(() => {
    if (sessionId) {
      if (skipNextLoad.current) {
        skipNextLoad.current = false;
        return;
      }
      loadSession(sessionId);
    } else {
      setMessages([]);
      setCurrentSession(null);
    }
  }, [sessionId]);

  useEffect(() => {
    const handleResize = () => {
      isMobile.current = window.innerWidth < 768;
      if (isMobile.current) setShowHistory(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSessions = async () => {
    try {
      const response = await enhancedChatService.getSessions('ai');
      setSessions(response.sessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const loadSession = async (id: string) => {
    try {
      const response = await enhancedChatService.getSession(id);
      if (response.session) {
        setCurrentSession(response.session);
        setMessages(response.session.messages || []);
      } else {
        navigate('/chat/ai');
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      navigate('/chat/ai');
    }
  };

  const handleNewChat = async () => {
    try {
      const response = await enhancedChatService.createSession();
      setMessages([]);
      setCurrentSession(response.session);
      skipNextLoad.current = true;
      navigate(`/chat/ai/${response.session._id}`);
      await loadSessions();
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleSelectSession = (id: string) => {
    navigate(`/chat/ai/${id}`);
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await enhancedChatService.deleteSession(id);
      await loadSessions();
      if (currentSession?._id === id) {
        navigate('/chat/ai');
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('This chat cannot be deleted');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);
    let activeSessionId = sessionId as string | undefined;
    
    try {
      if (!activeSessionId) {
        const { session } = await chatService.createSession();
        activeSessionId = session._id;
        skipNextLoad.current = true;
        setCurrentSession(session);
        setMessages([]);
        navigate(`/chat/ai/${activeSessionId}`);
        await loadSessions();
      }
      
      const nextUserMessage: ChatMessage = { role: 'user', content: userMessage };
      const nextMessages = [...messages, nextUserMessage];
      setMessages(nextMessages);
      
      const response = await enhancedChatService.sendMessage({ 
        message: userMessage, 
        conversation: nextMessages, 
        sessionId: activeSessionId! 
      });
      
      const assistantMessage: ChatMessage = { role: 'assistant', content: response.generated_text };
      setMessages(prev => [...prev, assistantMessage]);
      
      if (response.session) {
        setSessions(prev => {
          const exists = prev.some(s => s._id === response.session._id);
          return exists ? prev.map(s => s._id === response.session._id ? { ...s, ...response.session } : s) : [response.session, ...prev];
        });
        setCurrentSession(prev => prev && prev._id === response.session._id ? { ...prev, ...response.session } : prev);
      } else if (activeSessionId) {
        setSessions(prev => prev.map(s => s._id === activeSessionId ? { ...s, lastActivity: new Date().toISOString() } : s));
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages(prev => prev.slice(0, -1));
    } finally { 
      setIsLoading(false); 
    }
  };

  const quickSend = (text: string) => {
    setMessage(text);
  };

  const suggestedQuestions = [
    {
      icon: BookOpenIcon,
      question: "What are the five pillars of Islam?",
      description: "Learn about the fundamental practices"
    },
    {
      icon: HeartIcon,
      question: "How do I perform Wudu correctly?",
      description: "Step-by-step purification guide"
    },
    {
      icon: GlobeAltIcon,
      question: "What is the meaning of Ramadan?",
      description: "Understanding the holy month"
    },
    {
      icon: LightBulbIcon,
      question: "Can you explain Zakat in Islam?",
      description: "Learn about charitable giving"
    }
  ];

  return (
    <div className="relative flex h-full w-full">
      {/* Chat History Sidebar */}
      {showHistory && (
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Chats</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="lg:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              New AI Chat
            </button>
          </div>
          
          <AIChatHistory
            sessions={sessions}
            currentSessionId={currentSession?._id}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewChat}
            onDeleteSession={handleDeleteSession}
          />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {!showHistory && (
                <button
                  onClick={() => setShowHistory(true)}
                  className="lg:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
              )}
              <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/50 rounded-full flex items-center justify-center">
                <SparklesIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">AI Islamic Scholar</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get instant answers about Islam from our AI assistant
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="hidden lg:flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {showHistory ? 'Hide History' : 'Show History'}
              </button>
              <button
                onClick={handleNewChat}
                className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
              >
                New Chat
              </button>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mb-6">
                <SparklesIcon className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ask Your Question</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
                I'm an AI Islamic scholar assistant. Ask me anything about Islamic teachings, history, practices, or interpretations.
              </p>
              
              {/* Suggested Questions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
                {suggestedQuestions.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => quickSend(item.question)}
                    className="p-4 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/70 transition-colors">
                        <item.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white mb-1">
                          {item.question}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <div className="text-xs opacity-70 mt-1">
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                  <span className="text-sm">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about Islam..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAIChat;
