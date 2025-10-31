import React from 'react';
import { ChatSession } from '../../services/chatService';
import { TrashIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
      <div className="p-2 space-y-2">
        {sorted.map((session) => {
          const active = currentSessionId === session._id;
          return (
            <Card
              key={session._id}
              className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition border ${
                active
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800'
                  : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
              }`}
              onClick={() => onSelectSession(session._id)}
            >
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-medium truncate ${
                  active ? 'text-emerald-700 dark:text-emerald-200' : 'text-gray-900 dark:text-white'
                }`}>
                  {session.title || 'AI Chat'}
                </h3>
                <div className={`flex items-center text-xs mt-1 ${
                  active ? 'text-emerald-600 dark:text-emerald-300' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  <ClockIcon className="h-3 w-3 mr-1" />
                  {session.lastActivity ? new Date(session.lastActivity).toLocaleString() : ''}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session._id);
                }}
                className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700"
                aria-label="Delete session"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AIChatHistory;
