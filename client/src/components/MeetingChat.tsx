import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { meetingService } from '../services/meetingService';
import { useAuth } from '../hooks/useAuth';

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    email: string;
  };
  text: string;
  type: 'text' | 'meeting_request' | 'meeting_scheduled' | 'meeting_link';
  timestamp: string;
  metadata?: {
    scheduledTime?: string;
    meetingLink?: string;
    roomId?: string;
  };
}

interface Chat {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
  };
  scholarId: {
    _id: string;
    name: string;
    email: string;
  };
  lastActivity: string;
}

interface MeetingChatProps {
  chatId: string;
  onClose: () => void;
}

const MeetingChat: React.FC<MeetingChatProps> = ({ chatId, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chat, setChat] = useState<Chat | null>(null);
  const [scheduledTime, setScheduledTime] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
    setSocket(newSocket);

    // Join user room and chat room
    newSocket.emit('join-user-room', user?.id);
    newSocket.emit('join-chat', chatId);

    // Listen for new messages
    newSocket.on('new-message', (data) => {
      if (data.chatId === chatId) {
        // Refresh messages when new message arrives
        loadMessages();
      }
    });

    // Listen for meeting events
    newSocket.on('meetingRequest', (data) => {
      if (data.chatId === chatId) {
        loadMessages();
      }
    });

    newSocket.on('meetingScheduled', (data) => {
      if (data.chatId === chatId) {
        loadMessages();
      }
    });

    newSocket.on('meetingLinkSent', (data) => {
      if (data.chatId === chatId) {
        loadMessages();
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [chatId, user?.id]);

  const loadMessages = async () => {
    try {
      const response = await meetingService.getChatMessages(chatId);
      setMessages(response.messages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadChat = async () => {
    try {
      const response = await meetingService.getUserChats();
      const currentChat = response.chats.find((c: Chat) => c._id === chatId);
      setChat(currentChat);
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  useEffect(() => {
    loadMessages();
    loadChat();
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await meetingService.sendMessage(chatId, newMessage);
      setNewMessage('');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleRequestMeeting = async () => {
    if (!chat) return;

    try {
      const scholarId = user?.role === 'scholar' ? chat.studentId._id : chat.scholarId._id;
      await meetingService.requestMeeting(scholarId);
      loadMessages();
    } catch (error) {
      console.error('Error requesting meeting:', error);
    }
  };

  const handleScheduleMeeting = async () => {
    if (!scheduledTime) return;

    try {
      setIsScheduling(true);
      await meetingService.scheduleMeeting(chatId, scheduledTime);
      setScheduledTime('');
      setIsScheduling(false);
      loadMessages();
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      setIsScheduling(false);
    }
  };

  const formatMessage = (message: Message) => {
    const isBot = typeof message.text === 'string' && message.text.startsWith('Hikma:');
    const isOwnMessage = !isBot && (message.sender._id === user?.id);
    const isMeetingRequest = message.type === 'meeting_request';
    const isMeetingScheduled = message.type === 'meeting_scheduled';
    const isMeetingLink = message.type === 'meeting_link';

    return (
      <div
        key={message._id}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            isBot
              ? 'bg-gray-100 text-gray-900 border border-gray-300'
              : isOwnMessage
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-800'
          }`}
        >
          <div className="text-sm font-medium mb-1">
            {isBot ? 'Hikma' : message.sender.name}
          </div>
          <div className="text-sm">
            {message.text}
          </div>
          {isMeetingLink && message.metadata?.meetingLink && (
            <div className="mt-2">
              <a
                href={message.metadata.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
              >
                Join Meeting
              </a>
            </div>
          )}
          <div className="text-xs opacity-70 mt-1">
            {new Date(message.timestamp).toLocaleString()}
          </div>
        </div>
      </div>
    );
  };

  const renderMeetingActions = () => {
    if (!chat) return null;

    const hasMeetingRequest = messages.some(m => m.type === 'meeting_request');
    const hasMeetingScheduled = messages.some(m => m.type === 'meeting_scheduled');
    const hasMeetingLink = messages.some(m => m.type === 'meeting_link');

    if (hasMeetingLink) {
      return (
        <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
          <p className="text-green-800 font-medium">Meeting is ready! Check the latest message for the link.</p>
        </div>
      );
    }

    if (hasMeetingScheduled) {
      return (
        <div className="p-4 bg-blue-100 border border-blue-300 rounded-lg space-y-3">
          <p className="text-blue-800">Meeting has been scheduled. Waiting for the meeting to start...</p>
          {user?.role !== 'scholar' && (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Propose a different time or add a note"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 px-3 py-2 border border-blue-300 rounded-md"
              />
              <button
                onClick={async()=>{ await meetingService.requestReschedule(chatId, undefined, newMessage || undefined); setNewMessage(''); loadMessages(); }}
                className="px-3 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
              >
                Request Time Change
              </button>
            </div>
          )}
        </div>
      );
    }

    if (hasMeetingRequest && user?.role === 'scholar') {
      return (
        <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
          <p className="text-yellow-800 mb-3">A meeting has been requested. Please schedule a time:</p>
          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={handleScheduleMeeting}
              disabled={!scheduledTime || isScheduling}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {isScheduling ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </div>
      );
    }

    if (hasMeetingRequest && user?.role !== 'scholar') {
      return (
        <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
          <p className="text-yellow-800">Meeting request sent. Waiting for scholar to schedule...</p>
        </div>
      );
    }

    return (
      <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg">
        <button
          onClick={handleRequestMeeting}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Request Meeting
        </button>
      </div>
    );
  };

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading chat...</div>
      </div>
    );
  }

  const otherUser = user?.role === 'scholar' ? chat.studentId : chat.scholarId;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold">Chat with {otherUser.name}</h3>
          <p className="text-sm text-gray-500">{otherUser.email}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* Meeting Actions */}
      {renderMeetingActions()}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(formatMessage)}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingChat;
