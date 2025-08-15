import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PaperAirplaneIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { chatService, ChatSession, ChatMessage } from '../services/chatService';
import ChatHistory from './ChatHistory';
import ReactMarkdown from 'react-markdown';

const ChatBot = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [showHistory, setShowHistory] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768) ? false : true);
  const isMobile = useRef(false);
  const skipNextLoad = useRef(false);
  const DEFAULT_TITLE = 'New Chat';
  const provisionalTitlesRef = useRef<Record<string,string>>({});

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Load specific session when sessionId changes
  useEffect(() => {
    if (sessionId) {
      if (skipNextLoad.current) {
        // Skip automatic load because we already have local optimistic messages
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
        // Do not auto-open on mobile
        setShowHistory(false);
      } else {
        // Ensure sidebar visible when leaving mobile
        setShowHistory(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadSessions = async () => {
    try {
      const { sessions } = await chatService.getSessions();
      // Apply provisional titles where server still has default
      const patched = sessions.map(s => {
        const prov = provisionalTitlesRef.current[s._id];
        if (prov && (s.title === DEFAULT_TITLE || !s.title)) {
          return { ...s, title: prov };
        }
        // If server now has a real title, drop provisional
        if (prov && s.title && s.title !== DEFAULT_TITLE && s.title !== prov) {
          delete provisionalTitlesRef.current[s._id];
        }
        return s;
      });
      setSessions(patched);
      // Update currentSession if needed
      setCurrentSession(prev => {
        if (!prev) return prev;
        const updated = patched.find(p => p._id === prev._id);
        if (!updated) return prev;
        // Keep provisional if server still default
        const prov = provisionalTitlesRef.current[prev._id];
        if (prov && (updated.title === DEFAULT_TITLE || !updated.title)) {
          return { ...updated, title: prov };
        }
        if (prov && updated.title && updated.title !== DEFAULT_TITLE && updated.title !== prov) {
          delete provisionalTitlesRef.current[prev._id];
        }
        return updated;
      });
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const loadSession = async (id: string) => {
    try {
      const { session } = await chatService.getSession(id);
      const prov = provisionalTitlesRef.current[id];
      let effective = session;
      if (prov && (session.title === DEFAULT_TITLE || !session.title)) {
        effective = { ...session, title: prov };
      } else if (prov && session.title && session.title !== DEFAULT_TITLE && session.title !== prov) {
        delete provisionalTitlesRef.current[id];
      }
      setCurrentSession(effective);
      setMessages(effective.messages);
    } catch (error) {
      console.error('Failed to load session:', error);
      navigate('/chat');
    }
  };

  const handleNewChat = async () => {
    try {
      const { session } = await chatService.createSession();
      navigate(`/chat/${session._id}`);
      await loadSessions();
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleSelectSession = (id: string) => {
    navigate(`/chat/${id}`);
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await chatService.deleteSession(id);
      await loadSessions();
      if (sessionId === id) {
        navigate('/chat');
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const deriveTitle = (text: string) => {
    const words = text.trim().split(/\s+/).slice(0, 6).join(' ');
    if (!words) return DEFAULT_TITLE;
    return words.charAt(0).toUpperCase() + words.slice(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    try {
      let activeSessionId = sessionId;
      let createdSession: ChatSession | null = null;
      if (!activeSessionId) {
        const { session } = await chatService.createSession();
        activeSessionId = session._id;
        createdSession = session;
        skipNextLoad.current = true; // prevent overwriting optimistic first message
        navigate(`/chat/${activeSessionId}`);
        setCurrentSession(session); // optimistic
        await loadSessions();
      }

      const newUserMessage: ChatMessage = { role: 'user', content: userMessage };
      setMessages(prev => [...prev, newUserMessage]);

      // Provisional title update if still default
      const needsTitle = createdSession || (currentSession && (!currentSession.title || currentSession.title === DEFAULT_TITLE));
      if (needsTitle) {
        const provisionalTitle = deriveTitle(userMessage);
        provisionalTitlesRef.current[activeSessionId!] = provisionalTitle;
        setCurrentSession(prev => prev ? { ...prev, title: provisionalTitle } : prev);
        setSessions(prev => prev.map(s => s._id === activeSessionId ? { ...s, title: provisionalTitle } : s));
      }

      const conversationToSend = [...messages, newUserMessage];
      const response = await chatService.sendMessage({
        message: userMessage,
        conversation: conversationToSend,
        sessionId: activeSessionId!
      });

      const assistantMessage: ChatMessage = { role: 'assistant', content: response.generated_text };
      setMessages(prev => [...prev, assistantMessage]);

      await loadSessions(); // update titles
      if (createdSession) {
        // After first round-trip, ensure server state synced (optional reload)
        // loadSession(activeSessionId); // could reload if needed
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const quickSend = (text: string) => {
    setMessage(text);
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    }, 100);
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
          />
        )
      )}
      <div className="flex flex-col flex-1 max-w-4xl mx-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {currentSession?.title || 'Chat with Islamic Scholar'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Ask questions about Islam and get accurate answers based on authentic sources
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
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-4">
                <PaperAirplaneIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Ask Your Question
              </h3>
              <p className="text-gray-600 dark:text-gray-300 max-w-md">
                I'm an AI Islamic scholar assistant. Ask me anything about Islamic teachings, history, practices, or interpretations.
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-lg">
                <button
                  onClick={() => quickSend("What are the five pillars of Islam?")}
                  className="p-2 text-sm text-left bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-800 dark:text-gray-200"
                >
                  What are the five pillars of Islam?
                </button>
                <button
                  onClick={() => quickSend("How do I perform Wudu correctly?")}
                  className="p-2 text-sm text-left bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-800 dark:text-gray-200"
                >
                  How do I perform Wudu correctly?
                </button>
                <button
                  onClick={() => quickSend("What is the meaning of Ramadan?")}
                  className="p-2 text-sm text-left bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-800 dark:text-gray-200"
                >
                  What is the meaning of Ramadan?
                </button>
                <button
                  onClick={() => quickSend("Can you explain Zakat in Islam?")}
                  className="p-2 text-sm text-left bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-800 dark:text-gray-200"
                >
                  Can you explain Zakat in Islam?
                </button>
              </div>
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
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p>{msg.content}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown 
                        components={{
                          h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-md font-semibold mb-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                          strong: ({ children }) => <strong className="font-semibold text-emerald-700 dark:text-emerald-300">{children}</strong>,
                          em: ({ children }) => <em className="italic text-emerald-600 dark:text-emerald-400">{children}</em>,
                          ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                          p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-4 bg-gray-100 dark:bg-gray-700">
                <div className="flex space-x-2">
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
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
