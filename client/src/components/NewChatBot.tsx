import React, { useState, useEffect } from 'react';
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

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Load specific session when sessionId changes
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    } else {
      setMessages([]);
      setCurrentSession(null);
    }
  }, [sessionId]);

  const loadSessions = async () => {
    try {
      const { sessions } = await chatService.getSessions();
      setSessions(sessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const loadSession = async (id: string) => {
    try {
      const { session } = await chatService.getSession(id);
      setCurrentSession(session);
      setMessages(session.messages);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message;
    setMessage('');
    setIsLoading(true);

    try {
      // If no current session, create one
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        const { session } = await chatService.createSession();
        activeSessionId = session._id;
        navigate(`/chat/${activeSessionId}`);
        await loadSessions();
      }

      // Add user message to UI immediately
      const newUserMessage: ChatMessage = { role: 'user', content: userMessage };
      setMessages(prev => [...prev, newUserMessage]);

      // Send to API
      const response = await chatService.sendMessage({
        message: userMessage,
        conversation: messages,
        sessionId: activeSessionId
      });

      // Add assistant response
      const assistantMessage: ChatMessage = { 
        role: 'assistant', 
        content: response.generated_text 
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Reload sessions to update titles/timestamps
      await loadSessions();

    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove the user message if there was an error
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
    <div className="flex h-full">
      <ChatHistory
        sessions={sessions}
        currentSessionId={sessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />
      
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
            <button
              onClick={handleNewChat}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center gap-1"
            >
              <ArrowPathIcon className="h-5 w-5" />
              <span className="text-sm">New Chat</span>
            </button>
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
