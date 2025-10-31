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
import { ChatSession as BaseChatSession } from '../../../services/chatService';
import { authService } from '../../../services/authService';
import AIChatHistory from '../../shared/AIChatHistory';
import socketService from '../../../services/socketService';
import { Card, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

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

  // WebSocket event listeners
  useEffect(() => {
    if (!user) return;

    // Join user room for real-time updates
    socketService.joinUserRoom(user.id);

    // Listen for new messages
    const handleNewMessage = (data: any) => {
      if (data.chatId === sessionId) {
        const newMessage: ChatMessage = {
          role: 'assistant',
          content: data.text,
          timestamp: data.timestamp
        };
        setMessages(prev => [...prev, newMessage]);
      }
    };

    // Listen for session updates
    const handleSessionUpdate = (data: any) => {
      if (data.sessionId === sessionId) {
        setCurrentSession(prev => prev ? { ...prev, ...data.session } : null);
        if (data.messages) {
          setMessages(data.messages);
        }
      }
    };

    // Listen for typing indicators
    const handleTyping = (data: any) => {
      // Handle typing indicators if needed
      console.log('User typing:', data);
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onSessionUpdate(handleSessionUpdate);
    socketService.onTyping(handleTyping);

    return () => {
      socketService.offNewMessage(handleNewMessage);
      socketService.offSessionUpdate(handleSessionUpdate);
      socketService.offTyping(handleTyping);
    };
  }, [user, sessionId]);

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
        const response = await enhancedChatService.createSession();
        activeSessionId = response.session._id;
        skipNextLoad.current = true;
        setCurrentSession(response.session);
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
          const exists = prev.some(s => s._id === response.session!._id);
          return exists ? prev.map(s => s._id === response.session!._id ? { ...s, ...response.session! } : s) : [response.session!, ...prev];
        });
        setCurrentSession(prev => prev && prev._id === response.session!._id ? { ...prev, ...response.session! } : prev);
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
        <Card className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 rounded-none rounded-tr-xl rounded-br-xl">
          <CardHeader className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Chats</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="lg:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            </div>
            <Button
              onClick={handleNewChat}
              className="w-full justify-center font-medium"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              New AI Chat
            </Button>
          </CardHeader>
          
          <AIChatHistory
            sessions={sessions.map(session => ({
              ...session,
              messages: session.messages || []
            })) as BaseChatSession[]}
            currentSessionId={currentSession?._id}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewChat}
            onDeleteSession={handleDeleteSession}
          />
        </Card>
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
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
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
                  className={`max-w-[80%] rounded-lg p-4 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                      : 'bg-white border border-gray-300 dark:bg-gray-700 text-black dark:text-white'
                  }`}
                >
                  {msg.role === 'user' ? (
                  <p className="text-sm">{msg.content}</p>
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
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-emerald-500 pl-4 py-2 my-4 bg-emerald-50 dark:bg-emerald-900/20 italic text-emerald-800 dark:text-emerald-200">
                              {children}
                            </blockquote>
                          ),
                          // Custom component for quotes and hadiths
                          p: ({ children }) => {
                            const content = typeof children === 'string' ? children : '';
                            // Check if this is a hadith or quote (contains Arabic text, Prophet's name, or specific patterns)
                            if (content.includes('(ﷺ)') || content.includes('Allah\'s Messenger') || content.includes('Prophet') || 
                                content.includes('Abu') || content.includes('Sahih') || content.includes('Bukhari') ||
                                content.includes('Muslim') || content.includes('Tirmidhi') || content.includes('Ibn Majah') ||
                                content.includes('"') && content.includes('said') || content.includes('narrated') ||
                                content.includes('replied') || content.includes('emphasized')) {
                              return (
                                <div className="my-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border-l-6 border-emerald-500 shadow-sm">
                                  <div className="flex items-start">
                                    <div className="w-1 h-full bg-gradient-to-b from-emerald-400 to-teal-400 rounded-full mr-4 flex-shrink-0"></div>
                                    <div className="flex-1">
                                      <div className="text-emerald-800 dark:text-emerald-200 leading-relaxed">
                                        {children}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-200">
                                {children}
                              </p>
                            );
                          },
                          // Custom component for quoted text within paragraphs
                          span: ({ children }) => {
                            const content = typeof children === 'string' ? children : '';
                            // Check if this is quoted text (starts and ends with quotes)
                            if (content.startsWith('"') && content.endsWith('"') && content.length > 10) {
                              return (
                                <span className="inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-md border-l-3 border-emerald-400 italic">
                                  {children}
                                </span>
                              );
                            }
                            return <span>{children}</span>;
                          },
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
                            if (content.includes('📚 **Sources:**') || content.includes('Sources:') || content.includes('📚 Sources:')) {
                              return (
                                <div className="mt-8 p-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/30 dark:via-teal-900/20 dark:to-cyan-900/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-700 shadow-lg">
                                  <div className="flex items-center mb-4">
                                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mr-3 shadow-md">
                                      <span className="text-xl">📚</span>
                                    </div>
                                    <div>
                                      <h4 className="text-lg font-bold text-emerald-800 dark:text-emerald-200">Sources & References</h4>
                                      <p className="text-sm text-emerald-600 dark:text-emerald-400">Verified Islamic sources</p>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
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
                            // Check if this is a source item (contains bullet point and source name)
                            if (content.includes('•') && (content.includes('Sunan') || content.includes('Sahih') || content.includes('Jami') || content.includes('Quran'))) {
                              return (
                                <li className="mb-2 leading-relaxed">
                                  <div className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-emerald-200 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3 flex-shrink-0"></div>
                                    <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                                      {children}
                                    </span>
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
                  <div className="text-xs opacity-70 mt-2">
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
        </ScrollArea>

        {/* Message Input */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <Input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about Islam..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!message.trim() || isLoading}>
              <PaperAirplaneIcon className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAIChat;
