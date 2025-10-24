import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PaperAirplaneIcon, ArrowPathIcon, UserIcon } from '@heroicons/react/24/outline';
import { chatService, ChatSession, ChatMessage } from '../../../services/chatService';
import { startDirectChat, getMyEnrollments, getScholars } from '../../../services/scholarService';
import ChatHistory from '../../shared/ChatHistory';

const ScholarChat = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [showHistory, setShowHistory] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768) ? false : true);
  const [showScholarPicker, setShowScholarPicker] = useState(false);
  const [scholarOptions, setScholarOptions] = useState<{ id: string; name: string }[]>([]);
  const isMobile = useRef(false);
  const skipNextLoad = useRef(false);

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
      const mobile = window.innerWidth < 768;
      isMobile.current = mobile;
      if (mobile) {
        setShowHistory(false);
      } else {
        setShowHistory(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadSessions = async () => {
    try {
      const { sessions } = await chatService.getSessions();
      // Filter only direct chat sessions (scholar chats)
      const directSessions = sessions.filter(session => session.kind === 'direct');
      setSessions(directSessions);
      setCurrentSession(prev => prev ? directSessions.find(s => s._id === prev._id) || prev : prev);
    } catch (e) { 
      console.error('Failed to load sessions:', e); 
    }
  };

  const loadSession = async (id: string) => {
    try {
      const { session } = await chatService.getSession(id);
      setCurrentSession(session);
      setMessages(session.messages || []);
    } catch (e) {
      console.error('Failed to load session:', e); 
      navigate('/chat/scholar');
    }
  };

  const handleNewChat = async () => {
    try {
      let enrs = await getMyEnrollments().catch(() => []);
      let options = Array.isArray(enrs) ? enrs.map((e:any) => ({ id: e?.scholar?._id, name: e?.scholar?.user?.name || 'Scholar' })).filter(o => o.id) : [];
      
      if (!options.length) {
        try {
          const idsRaw = localStorage.getItem('enrolled_scholar_ids');
          const ids = idsRaw ? new Set<string>(JSON.parse(idsRaw)) : new Set<string>();
          if (ids.size) {
            const sch = await getScholars();
            options = sch.filter((s:any) => ids.has(s._id)).map((s:any) => ({ id: s._id, name: s?.user?.name || 'Scholar' }));
          }
        } catch {}
      }
      setScholarOptions(options);
      setShowScholarPicker(true);
    } catch (e) { 
      console.error('Failed to create session:', e); 
    }
  };

  const pickScholar = async (id: string) => {
    try {
      setShowScholarPicker(false);
      const res = await startDirectChat(id);
      const sid = res?.studentSessionId;
      if (sid) navigate(`/chat/scholar/${sid}`);
    } catch (e) { 
      console.error('Failed to start scholar chat:', e); 
    }
  };

  const handleSelectSession = (id: string) => {
    navigate(`/chat/scholar/${id}`);
  };

  const handleDeleteSession = async (id: string) => {
    try {
      // Direct chats cannot be deleted
      alert('Direct chats with scholars cannot be deleted');
    } catch (error) {
      console.error('Failed to delete session:', error);
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
        // Cannot create a direct chat without selecting a scholar
        alert('Please select a scholar to start chatting');
        setIsLoading(false);
        return;
      }
      
      const nextUserMessage: ChatMessage = { role: 'user', content: userMessage };
      const nextMessages = [...messages, nextUserMessage];
      setMessages(nextMessages);
      
      await chatService.sendDirectMessage(activeSessionId!, userMessage);
      setSessions(prev => prev.map(s => s._id === activeSessionId ? { ...s, lastActivity: new Date().toISOString() } : s));
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages(prev => prev.slice(0, -1));
    } finally { 
      setIsLoading(false); 
    }
  };

  return (
    <div className="relative flex h-full w-full">
      {showHistory && (
        isMobile.current ? (
          <div className="fixed inset-0 z-40 flex">
            <div className="w-64 h-full bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 shadow-xl flex flex-col">
              <ChatHistory
                sessions={sessions}
                currentSessionId={sessionId}
                onSelectSession={(id) => { setShowHistory(false); handleSelectSession(id); }}
                onNewChat={() => { setShowHistory(false); handleNewChat(); }}
                onDeleteSession={handleDeleteSession}
                showScholarPicker={showScholarPicker}
                scholarOptions={scholarOptions}
                onPickScholar={(id) => pickScholar(id)}
                onToggleScholarPicker={() => setShowScholarPicker(s => !s)}
              />
            </div>
            <div className="flex-1 bg-black/40" onClick={() => setShowHistory(false)} />
          </div>
        ) : (
          <ChatHistory
            sessions={sessions}
            currentSessionId={sessionId}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewChat}
            onDeleteSession={handleDeleteSession}
            showScholarPicker={showScholarPicker}
            scholarOptions={scholarOptions}
            onPickScholar={(id) => pickScholar(id)}
            onToggleScholarPicker={() => setShowScholarPicker(s => !s)}
          />
        )
      )}
      
      <div className="flex flex-col flex-1 max-w-4xl mx-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {currentSession?.title || 'Chat with Scholar'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Connect directly with your enrolled Islamic scholars
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(s => !s)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm"
              >
                {showHistory ? (isMobile.current ? 'Close' : 'Hide History') : 'History'}
              </button>
              <button
                onClick={handleNewChat}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center gap-1"
              >
                <ArrowPathIcon className="h-5 w-5" />
                <span className="text-sm">New Chat</span>
              </button>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/50 flex items-center justify-center mb-4 shadow-lg">
                <UserIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Chat with Your Scholar
              </h3>
              <p className="text-gray-600 dark:text-gray-300 max-w-md mb-6">
                Start a conversation with your enrolled Islamic scholar. Ask questions, seek guidance, or discuss Islamic topics.
              </p>
              <button
                onClick={handleNewChat}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
              >
                Select a Scholar to Chat
              </button>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                      : 'bg-white border border-gray-300 dark:bg-gray-700 text-black dark:text-white'
                  }`}
                >
                  <p>{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-4 bg-white border border-gray-300 dark:bg-gray-700">
                <div className="flex space-x-2 text-black dark:text-white">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message to the scholar..."
              disabled={isLoading || !currentSession}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !message.trim() || !currentSession}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ScholarChat;
