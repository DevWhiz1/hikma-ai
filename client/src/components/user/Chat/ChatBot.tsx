import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PaperAirplaneIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { chatService, ChatSession, ChatMessage } from '../../../services/chatService';
import ChatHistory from '../../shared/ChatHistory';
import { startDirectChat, getMyEnrollments, getScholars } from '../../../services/scholarService';
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
  const [showScholarPicker, setShowScholarPicker] = useState(false);
  const [scholarOptions, setScholarOptions] = useState<{ id: string; name: string }[]>([]);
  const [showMeetingLinkWarning, setShowMeetingLinkWarning] = useState(false);
  const [showContactWarning, setShowContactWarning] = useState(false);
  const [showLinkWarning, setShowLinkWarning] = useState(false);
  const isMobile = useRef(false);
  const skipNextLoad = useRef(false);

  // Function to detect meeting links
  const detectMeetingLinks = (text: string): boolean => {
    const meetingPatterns = [
      // Zoom
      /https?:\/\/(?:www\.)?(?:zoom\.us\/j\/|zoom\.us\/my\/|zoom\.us\/meeting\/join\/)/i,
      /https?:\/\/(?:www\.)?(?:zoom\.us\/s\/)/i,
      /https?:\/\/(?:www\.)?(?:zoom\.us\/p\/)/i,
      /https?:\/\/(?:www\.)?(?:zoom\.us\/webinar\/register\/)/i,
      
      // Google Meet
      /https?:\/\/(?:meet\.google\.com\/[a-z-]+)/i,
      
      // Microsoft Teams
      /https?:\/\/(?:teams\.microsoft\.com\/l\/meetup-join\/)/i,
      /https?:\/\/(?:teams\.live\.com\/meet\/)/i,
      
      // WebEx
      /https?:\/\/(?:[a-z0-9-]+\.webex\.com\/meet\/)/i,
      /https?:\/\/(?:[a-z0-9-]+\.webex\.com\/join\/)/i,
      
      // GoToMeeting
      /https?:\/\/(?:global\.gotomeeting\.com\/join\/)/i,
      /https?:\/\/(?:app\.gotomeeting\.com\/join\/)/i,
      
      // BlueJeans
      /https?:\/\/(?:bluejeans\.com\/)/i,
      
      // Jitsi (external)
      /https?:\/\/(?:meet\.jit\.si\/)/i,
      /https?:\/\/(?:[a-z0-9-]+\.jitsi\.meet\/)/i,
      
      // Discord
      /https?:\/\/(?:discord\.gg\/)/i,
      /https?:\/\/(?:discord\.com\/invite\/)/i,
      
      // Skype
      /https?:\/\/(?:join\.skype\.com\/)/i,
      /https?:\/\/(?:meet\.skype\.com\/)/i,
      
      // Whereby
      /https?:\/\/(?:whereby\.com\/)/i,
      
      // BigBlueButton
      /https?:\/\/(?:[a-z0-9-]+\.bigbluebutton\.org\/)/i,
    ];
    
    return meetingPatterns.some(pattern => pattern.test(text));
  };

  // Function to detect contact information (phone/email)
  const detectContactInfo = (text: string): boolean => {
    // Phone number patterns (various formats)
    const phonePatterns = [
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // 123-456-7890, 123.456.7890, 1234567890
      /\b\(\d{3}\)\s*\d{3}[-.]?\d{4}\b/, // (123) 456-7890, (123)456-7890
      /\b\d{3}\s\d{3}\s\d{4}\b/, // 123 456 7890
      /\b\+1[-.]?\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // +1-123-456-7890
      /\b1[-.]?\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // 1-123-456-7890
      /\b\d{10}\b/, // 1234567890 (10 digits)
      /\b\d{11}\b/, // 11234567890 (11 digits starting with 1)
    ];
    
    // Email patterns
    const emailPatterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/, // standard email
      /\b[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+\s*\.\s*[A-Z]{2,}\b/, // email with spaces
    ];
    
    const hasPhone = phonePatterns.some(pattern => pattern.test(text));
    const hasEmail = emailPatterns.some(pattern => pattern.test(text));
    
    return hasPhone || hasEmail;
  };

  // Function to detect all links
  const detectAllLinks = (text: string): boolean => {
    const linkPatterns = [
      // HTTP/HTTPS URLs
      /https?:\/\/[^\s]+/i,
      // www links
      /www\.[^\s]+/i,
      // ftp links
      /ftp:\/\/[^\s]+/i,
      // file links
      /file:\/\/[^\s]+/i,
      // mailto links
      /mailto:[^\s]+/i,
      // tel links
      /tel:[^\s]+/i,
    ];
    
    return linkPatterns.some(pattern => pattern.test(text));
  };

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

  // Simplified loadSessions (no provisional titles)
  const loadSessions = async () => {
    try {
      const { sessions } = await chatService.getSessions();
      setSessions(sessions);
      setCurrentSession(prev => prev ? sessions.find(s => s._id === prev._id) || prev : prev);
    } catch (e) { console.error('Failed to load sessions:', e); }
  };

  const loadSession = async (id: string) => {
    try {
      const { session } = await chatService.getSession(id);
      setCurrentSession(session);
      setMessages(session.messages || []);
    } catch (e) {
      console.error('Failed to load session:', e); navigate('/chat');
    }
  };

  const handleNewChat = async (mode?: 'ai' | 'direct') => {
    try {
      if (mode === 'direct') {
        let enrs = await getMyEnrollments().catch(() => []);
        let options = Array.isArray(enrs) ? enrs.map((e:any) => ({ id: e?.scholar?._id, name: e?.scholar?.user?.name || 'Scholar' })).filter(o => o.id) : [];
        // Fallback: use locally stored enrolled ids against current scholars list
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
        return; 
      }
      const { session } = await chatService.createSession();
      setMessages([]);
      setCurrentSession(session);
      navigate(`/chat/${session._id}`);
      await loadSessions();
    } catch (e) { console.error('Failed to create session:', e); }
  };

  const pickScholar = async (id: string) => {
    try {
      setShowScholarPicker(false);
      const res = await startDirectChat(id);
      const sid = res?.studentSessionId;
      if (sid) navigate(`/chat/${sid}`);
    } catch (e) { console.error('Failed to start scholar chat:', e); }
  };

  const handleSelectSession = (id: string) => {
    navigate(`/chat/${id}`);
  };

  const handleDeleteSession = async (id: string) => {
    try {
      // Check if this is a direct chat (scholar chat) - prevent deletion
      const session = sessions.find(s => s._id === id);
      if (session?.kind === 'direct') {
        alert('Direct chats with scholars cannot be deleted');
        return;
      }
      
      await chatService.deleteSession(id);
      await loadSessions();
      if (sessionId === id) {
        navigate('/chat');
      }
    } catch (error) {
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
      // If user started typing on /chat root, create a session now
      if (!activeSessionId) {
        const { session } = await chatService.createSession();
        activeSessionId = session._id;
        skipNextLoad.current = true;
        setCurrentSession(session);
        setMessages([]);
        navigate(`/chat/${activeSessionId}`);
        await loadSessions();
      }
      // Append user message locally
      const nextUserMessage: ChatMessage = { role: 'user', content: userMessage };
      const nextMessages = [...messages, nextUserMessage];
      setMessages(nextMessages);
      if (currentSession?.kind === 'direct') {
        await chatService.sendDirectMessage(activeSessionId!, userMessage);
        // No assistant response for direct chats
        setSessions(prev => prev.map(s => s._id === activeSessionId ? { ...s, lastActivity: new Date().toISOString() } : s));
      } else {
        // Build conversation context (use nextMessages) for AI
        const response = await chatService.sendMessage({ message: userMessage, conversation: nextMessages, sessionId: activeSessionId! });
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
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove optimistic user message
      setMessages(prev => prev.slice(0, -1));
    } finally { setIsLoading(false); }
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
                onNewChat={(mode) => { setShowHistory(false); handleNewChat(mode); }}
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
                onClick={() => handleNewChat('ai')}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center gap-1"
              >
                <ArrowPathIcon className="h-5 w-5" />
                <span className="text-sm">New AI Chat</span>
              </button>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/50 flex items-center justify-center mb-4">
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
                      : 'bg-white border border-gray-300 dark:bg-gray-700 text-black dark:text-white'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p>{msg.content}</p>
                  ) : (
                      <div className="prose prose-sm max-w-none dark:prose-invert [&_a]:text-black [&_a]:dark:text-emerald-400">
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
                          a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-black dark:text-emerald-400 hover:text-emerald-200 dark:hover:text-emerald-300 underline" style={{color: 'black', textDecoration: 'none'}}>{children}</a>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                      {(() => {
                        try {
                          const urlMatch = (msg.content || '').match(/https?:\/\/[^\s]+/);
                          if (urlMatch) {
                            const href = urlMatch[0];
                            return (
                              <div className="mt-2">
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block bg-emerald-600 text-black px-3 py-1 rounded text-sm hover:bg-emerald-700"
                                  style={{color: 'black', textDecoration: 'none'}}
                                >
                                  Open Link
                                </a>
                              </div>
                            );
                          }
                        } catch {}
                        return null;
                      })()}
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
          {showMeetingLinkWarning && (
            <div className="mb-3 p-3 bg-orange-100 dark:bg-orange-900 border border-orange-300 dark:border-orange-700 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    <strong>Meeting links are not allowed.</strong> Please use the built-in meeting system to schedule meetings with scholars.
                  </p>
                </div>
              </div>
            </div>
          )}
          {showContactWarning && (
            <div className="mb-3 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <strong>Contact information is not allowed.</strong> Please do not share phone numbers or email addresses in chat.
                  </p>
                </div>
              </div>
            </div>
          )}
          {showLinkWarning && (
            <div className="mb-3 p-3 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Links detected.</strong> All links are logged for security purposes. Please be mindful of what you share.
                  </p>
                </div>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => {
                const newMessage = e.target.value;
                setMessage(newMessage);
                
                // Check for meeting links and show warning
                if (detectMeetingLinks(newMessage)) {
                  setShowMeetingLinkWarning(true);
                } else {
                  setShowMeetingLinkWarning(false);
                }
                
                // Check for contact info and show warning
                if (detectContactInfo(newMessage)) {
                  setShowContactWarning(true);
                } else {
                  setShowContactWarning(false);
                }
                
                // Check for links and show warning
                if (detectAllLinks(newMessage)) {
                  setShowLinkWarning(true);
                } else {
                  setShowLinkWarning(false);
                }
              }}
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
