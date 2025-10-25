import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PaperAirplaneIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { chatService, ChatSession, ChatMessage } from '../../../services/chatService';
import ChatHistory from '../../shared/ChatHistory';
import ReactMarkdown from 'react-markdown';

const AIChat = () => {
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
      // Filter only AI chat sessions
      const aiSessions = sessions.filter(session => session.kind !== 'direct');
      setSessions(aiSessions);
      setCurrentSession(prev => prev ? aiSessions.find(s => s._id === prev._id) || prev : prev);
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
      navigate('/chat/ai');
    }
  };

  const handleNewChat = async () => {
    try {
      const { session } = await chatService.createSession();
      setMessages([]);
      setCurrentSession(session);
      navigate(`/chat/ai/${session._id}`);
      await loadSessions();
    } catch (e) { 
      console.error('Failed to create session:', e); 
    }
  };

  const handleSelectSession = (id: string) => {
    navigate(`/chat/ai/${id}`);
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await chatService.deleteSession(id);
      await loadSessions();
      if (sessionId === id) {
        navigate('/chat/ai');
      }
    } catch (error: any) {
      console.error('Failed to delete session:', error);
      if (error?.response?.status === 403) {
        alert('This chat cannot be deleted');
      }
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
      
      const response = await chatService.sendMessage({ 
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
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) (form as HTMLFormElement).requestSubmit();
    }, 50);
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
                {currentSession?.title || 'AI Islamic Scholar'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Get instant answers about Islam from our AI assistant
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
                <PaperAirplaneIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Ask Your Question
              </h3>
              <p className="text-gray-600 dark:text-gray-300 max-w-md mb-6">
                I'm an AI Islamic scholar assistant. Ask me anything about Islamic teachings, history, practices, or interpretations.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-lg">
                <button
                  onClick={() => quickSend("What are the five pillars of Islam?")}
                  className="p-3 text-sm text-left bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 transition-colors"
                >
                  What are the five pillars of Islam?
                </button>
                <button
                  onClick={() => quickSend("How do I perform Wudu correctly?")}
                  className="p-3 text-sm text-left bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 transition-colors"
                >
                  How do I perform Wudu correctly?
                </button>
                <button
                  onClick={() => quickSend("What is the meaning of Ramadan?")}
                  className="p-3 text-sm text-left bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 transition-colors"
                >
                  What is the meaning of Ramadan?
                </button>
                <button
                  onClick={() => quickSend("Can you explain Zakat in Islam?")}
                  className="p-3 text-sm text-left bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 transition-colors"
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
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                      : 'bg-white border border-gray-300 dark:bg-gray-700 text-black dark:text-white'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p>{msg.content}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown 
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-xl font-bold mb-4 text-emerald-800 dark:text-emerald-200 border-b border-emerald-200 dark:border-emerald-700 pb-2">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-lg font-semibold mb-3 text-emerald-700 dark:text-emerald-300 mt-6 first:mt-0">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-base font-semibold mb-2 text-emerald-600 dark:text-emerald-400 mt-4">
                              {children}
                            </h3>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-emerald-800 dark:text-emerald-200">
                              {children}
                            </strong>
                          ),
                          em: ({ children }) => (
                            <em className="italic text-emerald-600 dark:text-emerald-400">
                              {children}
                            </em>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc pl-6 mb-4 space-y-2">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal pl-6 mb-4 space-y-3">
                              {children}
                            </ol>
                          ),
                          p: ({ children }) => (
                            <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-200">
                              {children}
                            </p>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-emerald-500 pl-4 py-2 my-4 bg-emerald-50 dark:bg-emerald-900/20 italic text-emerald-800 dark:text-emerald-200">
                              {children}
                            </blockquote>
                          ),
                          code: ({ children }) => (
                            <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono text-emerald-700 dark:text-emerald-300">
                              {children}
                            </code>
                          ),
                          pre: ({ children }) => (
                            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto my-4">
                              {children}
                            </pre>
                          ),
                          a: ({ children, href }) => (
                            <a 
                              href={href} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline decoration-emerald-300 dark:decoration-emerald-600 hover:decoration-emerald-500 dark:hover:decoration-emerald-400 transition-colors"
                            >
                              {children}
                            </a>
                          ),
                          // Custom component for sources section
                          div: ({ children }) => {
                            const content = typeof children === 'string' ? children : '';
                            if (content.includes('📚 **Sources:**') || content.includes('Sources:')) {
                              return (
                                <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
                                  <div className="flex items-center mb-3">
                                    <span className="text-2xl mr-2">📚</span>
                                    <h4 className="font-semibold text-emerald-800 dark:text-emerald-200">Sources & References</h4>
                                  </div>
                                  <div className="text-sm text-emerald-700 dark:text-emerald-300 space-y-1">
                                    {children}
                                  </div>
                                </div>
                              );
                            }
                            return <div>{children}</div>;
                          },
                          // Custom component for better list item styling
                          li: ({ children }) => {
                            const content = typeof children === 'string' ? children : '';
                            // Check if this is a numbered list item with bold text (like "1. **Just Cause:**")
                            if (content.includes('**') && content.includes(':**')) {
                              return (
                                <li className="mb-3 leading-relaxed">
                                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border-l-4 border-emerald-500 shadow-sm">
                                    {children}
                                  </div>
                                </li>
                              );
                            }
                            return (
                              <li className="mb-2 leading-relaxed pl-2">
                                {children}
                              </li>
                            );
                          }
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
              placeholder="Ask about Islam..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
