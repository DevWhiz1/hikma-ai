import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { meetingService } from '../../../services/meetingService';
import { useAuth } from '../../../hooks/useAuth';
import MeetingRequestModal from '../../shared/MeetingRequestModal';

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
  const [showMeetingLinkWarning, setShowMeetingLinkWarning] = useState(false);
  const [showContactWarning, setShowContactWarning] = useState(false);
  const [showLinkWarning, setShowLinkWarning] = useState(false);
  const [showMeetingRequestModal, setShowMeetingRequestModal] = useState(false);
  const [meetingRequestScholarId, setMeetingRequestScholarId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

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
      
      // Jitsi (external and custom domain)
      /https?:\/\/(?:meet\.jit\.si\/)/i,
      /https?:\/\/(?:[a-z0-9-]+\.jitsi\.meet\/)/i,
      /https?:\/\/(?:hikmameet\.live\/)/i,
      
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

  const handleRequestMeeting = () => {
    if (!chat) return;
    const scholarId = user?.role === 'scholar' ? chat.studentId._id : chat.scholarId._id;
    setMeetingRequestScholarId(scholarId);
    setShowMeetingRequestModal(true);
  };

  const handleMeetingRequestSubmit = async (data: { reason: string; preferredDate?: string; preferredTime?: string; notes?: string }) => {
    if (!meetingRequestScholarId) return;
    
    try {
      // Combine reason and notes if both exist
      const reasonText = [data.reason, data.notes].filter(Boolean).join(' | ') || undefined;
      await meetingService.requestMeeting(meetingRequestScholarId, reasonText);
      loadMessages();
    } catch (error) {
      console.error('Error requesting meeting:', error);
      throw error;
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
    const isBot = typeof message.text === 'string' && (message.text.startsWith('Hikma:') || message.text.startsWith('HikmaBot:'));
    const isOwnMessage = !isBot && (message.sender._id === user?.id);
    const isMeetingRequest = message.type === 'meeting_request';
    const isMeetingScheduled = message.type === 'meeting_scheduled';
    const isMeetingLink = message.type === 'meeting_link';

    // Extract meeting link from metadata or message text
    const getMeetingLink = () => {
      // First check metadata
      if (message.metadata?.meetingLink) {
        return message.metadata.meetingLink;
      }
      if (message.metadata?.meetLink) {
        return message.metadata.meetLink;
      }
      // Extract Jitsi/Hikma meet links from text
      if (message.text) {
        const urlRegex = /https?:\/\/[^\s<>"']+/g;
        const matches = message.text.match(urlRegex);
        if (matches) {
          const meetingLink = matches.find(url => 
            url.includes('hikmameet.live') || 
            url.includes('jitsi') || 
            url.includes('/meet') ||
            (url.includes('https://') && url.includes('meet'))
          );
          if (meetingLink) {
            // Clean up the URL (remove trailing punctuation)
            return meetingLink.replace(/[.,;:!?]+$/, '');
          }
        }
      }
      return null;
    };

    const meetingLink = getMeetingLink();

    // Get final link - prioritize metadata, then extracted from text
    const finalLink = message.metadata?.meetingLink || message.metadata?.meetLink || meetingLink;

    // For meeting_link type messages, always show button and remove link from text
    // For other messages, only show button if link is detected
    const shouldShowButton = isMeetingLink || !!finalLink;

    // Remove meeting link URL from text - clean up the message
    let displayText = message.text || '';
    if (finalLink) {
      // Remove the full URL (handle both with and without trailing characters)
      const urlPattern = finalLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      displayText = displayText.replace(new RegExp(urlPattern + '[.,;:!?\\s]*', 'gi'), '');
      
      // Remove common phrases that come before/after links
      displayText = displayText
        .replace(/Join here:\s*/i, '')
        .replace(/Meeting link:\s*/i, '')
        .replace(/meeting link:\s*/i, '')
        .replace(/\.\s*Meeting link/i, '.')
        .replace(/meeting is scheduled!\s*/i, 'meeting is scheduled!')
        .replace(/Your meeting has started!\s*/i, 'Your meeting has started!')
        .replace(/is ready!\s*/i, 'is ready!')
        .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
        .trim();
    }

    // For meeting_link type messages, always prioritize clean message
    if (isMeetingLink && finalLink) {
      // Only show text if it's meaningful after cleaning
      if (!displayText || displayText.length < 10) {
        displayText = 'Your meeting link is ready!';
      }
    }

    return (
      <div
        key={message._id}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
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
          {displayText && displayText.trim() && (
            <div className="text-sm mb-2">
              {displayText}
            </div>
          )}
          {shouldShowButton && finalLink && (
            <div className="mt-3">
              <a
                href={finalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 w-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Join Meeting
              </a>
            </div>
          )}
          <div className="text-xs opacity-70 mt-2">
            {new Date(message.timestamp || message.createdAt || Date.now()).toLocaleString()}
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
                onChange={(e) => {
                  const newText = e.target.value;
                  setNewMessage(newText);
                  
                  // Check for meeting links and show warning
                  if (detectMeetingLinks(newText)) {
                    setShowMeetingLinkWarning(true);
                  } else {
                    setShowMeetingLinkWarning(false);
                  }
                  
                  // Check for contact info and show warning
                  if (detectContactInfo(newText)) {
                    setShowContactWarning(true);
                  } else {
                    setShowContactWarning(false);
                  }
                  
                  // Check for links and show warning
                  if (detectAllLinks(newText)) {
                    setShowLinkWarning(true);
                  } else {
                    setShowLinkWarning(false);
                  }
                }}
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

  const scholarName = chat ? (user?.role === 'scholar' ? chat.studentId.name : chat.scholarId.name) : undefined;

  return (
    <>
      <MeetingRequestModal
        isOpen={showMeetingRequestModal}
        scholarName={scholarName}
        onClose={() => {
          setShowMeetingRequestModal(false);
          setMeetingRequestScholarId(null);
        }}
        onSubmit={handleMeetingRequestSubmit}
      />
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
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              const newText = e.target.value;
              setNewMessage(newText);
              
              // Check for meeting links and show warning
              if (detectMeetingLinks(newText)) {
                setShowMeetingLinkWarning(true);
              } else {
                setShowMeetingLinkWarning(false);
              }
              
              // Check for contact info and show warning
              if (detectContactInfo(newText)) {
                setShowContactWarning(true);
              } else {
                setShowContactWarning(false);
              }
              
              // Check for links and show warning
              if (detectAllLinks(newText)) {
                setShowLinkWarning(true);
              } else {
                setShowLinkWarning(false);
              }
            }}
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
    </>
  );
};

export default MeetingChat;
