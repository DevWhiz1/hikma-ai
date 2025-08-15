import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatService, ChatSession, ChatMessage } from '../services/chatService';
import { PlusIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline';

const ChatHistory: React.FC<{
  sessions: ChatSession[];
  currentSessionId?: string;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
}> = ({ sessions, currentSessionId, onSelectSession, onNewChat, onDeleteSession }) => {
  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-300 dark:border-gray-700">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {sessions.map((session) => (
          <div
            key={session._id}
            className={`group flex items-center justify-between p-3 mb-2 rounded-lg cursor-pointer transition ${
              currentSessionId === session._id
                ? 'bg-emerald-100 dark:bg-emerald-900 border border-emerald-300 dark:border-emerald-700'
                : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
            onClick={() => onSelectSession(session._id)}
          >
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {session.title}
              </h3>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                <ClockIcon className="h-3 w-3 mr-1" />
                {new Date(session.lastActivity).toLocaleDateString()}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(session._id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 transition"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatHistory;
