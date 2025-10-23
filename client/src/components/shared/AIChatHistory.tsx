import React from 'react';
import { ChatSession } from '../../services/chatService';
import { PlusIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline';

const AIChatHistory: React.FC<{
  sessions: ChatSession[];
  currentSessionId?: string;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
}> = ({ sessions, currentSessionId, onSelectSession, onNewChat, onDeleteSession }) => {
  const sorted = [...sessions].sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
  
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-2">
        {sorted.map((session) => (
          <div
            key={session._id}
            className={`group flex items-center justify-between p-3 mb-2 rounded-lg cursor-pointer transition ${
              currentSessionId === session._id
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
            onClick={() => onSelectSession(session._id)}
          >
            <div className="flex-1 min-w-0">
              <h3 className={`text-sm font-medium truncate ${
                currentSessionId === session._id
                  ? 'text-white'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {session.title || 'AI Chat'}
              </h3>
              <div className={`flex items-center text-xs mt-1 ${
                currentSessionId === session._id
                  ? 'text-emerald-100'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                <ClockIcon className="h-3 w-3 mr-1" />
                {session.lastActivity ? new Date(session.lastActivity).toLocaleDateString() : ''}
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

export default AIChatHistory;
