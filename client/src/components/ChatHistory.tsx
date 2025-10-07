import React from 'react';
import { ChatSession } from '../services/chatService';
import { PlusIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline';

const ChatHistory: React.FC<{
  sessions: ChatSession[];
  currentSessionId?: string;
  onSelectSession: (sessionId: string) => void;
  onNewChat: (mode?: 'ai' | 'direct', scholarId?: string) => void;
  onDeleteSession: (sessionId: string) => void;
  showScholarPicker?: boolean;
  scholarOptions?: { id: string; name: string }[];
  onPickScholar?: (id: string) => void;
  onToggleScholarPicker?: () => void;
}> = ({ sessions, currentSessionId, onSelectSession, onNewChat, onDeleteSession, showScholarPicker, scholarOptions = [], onPickScholar, onToggleScholarPicker }) => {
  const sorted = [...sessions].sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-300 dark:border-gray-700 space-y-2">
        <button
          onClick={() => onNewChat('ai')}
          className="w-full flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New AI Chat
        </button>
        <button
          onClick={() => { onToggleScholarPicker ? onToggleScholarPicker() : onNewChat('direct'); }}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Scholar Chat
        </button>
        {showScholarPicker && (
          <div className="mt-2 space-y-1">
            <div className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-300">Enrolled Scholars</div>
            {scholarOptions.length === 0 ? (
              <div className="text-xs text-gray-500">No enrollments yet.</div>
            ) : (
              scholarOptions.map(opt => (
                <button key={opt.id} onClick={() => onPickScholar && onPickScholar(opt.id)} className="w-full text-left px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                  {opt.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {sorted.map((session) => (
          <div
            key={session._id}
            className={`group flex items-center justify-between p-3 mb-2 rounded-lg cursor-pointer transition ${
              currentSessionId === session._id
                ? 'bg-[#264653] dark:bg-[#264653] border border-[#2A9D8F] dark:border-[#2A9D8F]'
                : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
            onClick={() => onSelectSession(session._id)}
          >
            <div className="flex-1 min-w-0">
              <h3 className={`text-sm font-medium truncate ${
                currentSessionId === session._id
                  ? 'text-gray-300'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {session.title || 'New Chat'}
              </h3>
              <div className={`flex items-center text-xs mt-1 ${
                currentSessionId === session._id
                  ? 'text-gray-300'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                <ClockIcon className="h-3 w-3 mr-1" />
                {session.lastActivity ? new Date(session.lastActivity).toLocaleDateString() : ''}
              </div>
            </div>
            {/* Hide delete button for direct chats (scholar chats) */}
            {session.kind !== 'direct' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session._id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-orange-500 hover:text-orange-700 transition"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatHistory;
