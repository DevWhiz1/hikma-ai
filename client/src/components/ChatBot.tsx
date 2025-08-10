import React, { useState } from 'react';
import { PaperAirplaneIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useChat } from '../hooks/useChat';
import ReactMarkdown from 'react-markdown';

const ChatBot = () => {
  const [message, setMessage] = useState('');
  const { messages, sendMessage, isLoading, clearMessages } = useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Chat with Islamic Scholar
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Ask questions about Islam and get accurate answers based on authentic sources
            </p>
          </div>
          <button
            onClick={clearMessages}
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
                onClick={() => sendMessage("What are the five pillars of Islam?")}
                className="p-2 text-sm text-left bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-800 dark:text-gray-200"
              >
                What are the five pillars of Islam?
              </button>
              <button
                onClick={() => sendMessage("How do I perform Wudu correctly?")}
                className="p-2 text-sm text-left bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-800 dark:text-gray-200"
              >
                How do I perform Wudu correctly?
              </button>
              <button
                onClick={() => sendMessage("What is the meaning of Ramadan?")}
                className="p-2 text-sm text-left bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-800 dark:text-gray-200"
              >
                What is the meaning of Ramadan?
              </button>
              <button
                onClick={() => sendMessage("Can you explain Zakat in Islam?")}
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
                        h1: ({children}) => <h1 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-3">{children}</h1>,
                        h2: ({children}) => <h2 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mb-2 mt-4">{children}</h2>,
                        h3: ({children}) => <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400 mb-2 mt-3">{children}</h3>,
                        strong: ({children}) => <strong className="font-bold text-emerald-700 dark:text-emerald-300">{children}</strong>,
                        ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                        p: ({children}) => <p className="mb-2 leading-relaxed">{children}</p>,
                        blockquote: ({children}) => <blockquote className="border-l-4 border-emerald-500 pl-3 italic my-2">{children}</blockquote>,
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
            <div className="max-w-[80%] rounded-lg p-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
              <div className="flex space-x-2">
                <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"></div>
                <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce delay-100"></div>
                <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your question about Islam..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={isLoading || !message.trim()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg transition-colors flex items-center"
          >
            <PaperAirplaneIcon className="h-5 w-5 mr-1" />
            Send
          </button>
        </form>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          Responses are generated based on authentic Islamic sources including Quran and Hadith.
        </p>
      </div>
    </div>
  );
};

export default ChatBot;
