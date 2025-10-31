import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  PaperAirplaneIcon, 
  ArrowPathIcon, 
  UserIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { enhancedChatService, ChatSession, ChatMessage } from '../../../services/enhancedChatService';
import { startDirectChat, getMyEnrollments, getScholars, getMyEnrolledStudents, startChatWithStudent } from '../../../services/scholarService';
import { authService } from '../../../services/authService';
import ScholarChatHistory from '../../shared/ScholarChatHistory';
import ScholarImage from '../../shared/ScholarImage';
import socketService from '../../../services/socketService';
import { Card, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Scholar {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  photoUrl?: string;
  specializations: string[];
  isActive: boolean;
  averageRating: number;
  totalStudents: number;
}

const EnhancedScholarChat = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const user = authService.getUser();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [showHistory, setShowHistory] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768) ? false : true);
  const [showScholarPicker, setShowScholarPicker] = useState(false);
  const [scholarOptions, setScholarOptions] = useState<Scholar[]>([]);
  const [studentOptions, setStudentOptions] = useState<{ id: string; name: string; studentId: string }[]>([]);
  const [search, setSearch] = useState('');
  const [selectedScholar, setSelectedScholar] = useState<Scholar | null>(null);
  const [counterpartName, setCounterpartName] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const isMobile = useRef(false);
  const skipNextLoad = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
    loadScholarOptions();
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
          role: data.senderId === user.id ? 'user' : 'assistant',
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

    // Listen for meeting events
    const handleMeetingRequest = (data: any) => {
      if (data.chatId === sessionId) {
        // Handle meeting request notification
        console.log('Meeting request received:', data);
      }
    };

    const handleMeetingScheduled = (data: any) => {
      if (data.chatId === sessionId) {
        // Handle meeting scheduled notification
        console.log('Meeting scheduled:', data);
      }
    };

    const handleMeetingLinkSent = async (data: any) => {
      if (data.sessionId === currentSession?._id || data.chatId === currentSession?._id) {
        // Handle meeting link sent notification
        console.log('Meeting link sent:', data);
        
        // Add meeting link message to the current session
        if (data.link && currentSession) {
          const meetingMessage: ChatMessage = {
            role: 'assistant',
            content: data.text || 'HikmaBot: Your meeting has started!',
            timestamp: new Date().toISOString(),
            type: 'meeting_link',
            metadata: {
              meetingLink: data.link,
              roomId: data.roomId,
              scheduledTime: data.scheduledTime
            }
          };
          
          // Add to messages state
          setMessages(prev => [...prev, meetingMessage]);
          
          // Reload session to get updated messages from server
          if (currentSession._id) {
            await loadSession(currentSession._id);
          }
        }
      }
    };

    // Listen for typing indicators
    const handleTyping = (data: any) => {
      if (data.chatId === sessionId && data.userId !== user.id) {
        setOtherTyping(!!data.isTyping);
      }
    };

    if (sessionId) socketService.joinChat(sessionId);
    socketService.onNewMessage(handleNewMessage);
    socketService.onSessionUpdate(handleSessionUpdate);
    socketService.onMeetingRequest(handleMeetingRequest);
    socketService.onMeetingScheduled(handleMeetingScheduled);
    socketService.onMeetingLinkSent(handleMeetingLinkSent);
    socketService.onTyping(handleTyping);

    return () => {
      if (sessionId) socketService.leaveChat(sessionId);
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
      setSelectedScholar(null);
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
      const response = await enhancedChatService.getSessions('scholar');
      setSessions(response.sessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const loadScholarOptions = async () => {
    try {
      if (user?.role === 'scholar') {
        const students = await getMyEnrolledStudents();
        const opts = Array.isArray(students)
          ? students.map((e:any) => ({ id: e?.chatId, name: e?.student?.name || 'Student', studentId: e?.student?._id })).filter((o:any) => o.id && o.studentId)
          : [];
        setStudentOptions(opts);
      } else {
        const enrollments = await getMyEnrollments();
        let opts: Scholar[] = Array.isArray(enrollments)
          ? enrollments
              .filter((e:any) => e?.scholar?._id && e?.scholar?.user?.name)
              .map((e:any) => ({
                _id: e.scholar._id,
                user: { _id: e.scholar.user._id, name: e.scholar.user.name, email: e.scholar.user.email },
                photoUrl: undefined,
                specializations: [],
                isActive: true,
                averageRating: 0,
                totalStudents: 0,
              }))
          : [];

        // Fallback to full scholars list if enrollments not available
        if (!opts.length) {
          const scholars = await getScholars();
          opts = scholars || [];
        }
        setScholarOptions(opts);
      }
    } catch (error) {
      console.error('Failed to load scholar options:', error);
    }
  };

  const loadSession = async (id: string) => {
    // Validate sessionId format before attempting to load
    if (!id || id.trim() === '') {
      navigate('/chat/scholar');
      return;
    }

    try {
      const response = await enhancedChatService.getSession(id);
      if (response.session) {
        setCurrentSession(response.session);
        setMessages(response.session.messages || []);
        
        // Try to identify counterpart from session title
        const title = response.session.title || '';
        const scholarMatch = title.match(/Chat with (.+?) \(Scholar\)/);
        const studentMatch = title.match(/Chat with (.+?) \(Student\)/);
        const name = (scholarMatch?.[1] || studentMatch?.[1]) || null;
        setCounterpartName(name);

        // If counterpart is a scholar, hydrate selectedScholar
        if (scholarMatch?.[1]) {
          const scholar = scholarOptions.find(s => s.user.name === scholarMatch[1]);
          if (scholar) {
            setSelectedScholar(scholar);
            setIsOnline(scholar.isActive);
            setLastSeen(scholar.isActive ? 'Online now' : 'Last seen recently');
          }
        }
      } else {
        // Session not found, redirect to base chat page
        navigate('/chat/scholar', { replace: true });
      }
    } catch (error: any) {
      // Only log non-404 errors (session not found is expected in some cases)
      const isNotFound = error?.status === 404 || 
                        (error?.message && error.message.toLowerCase().includes('not found'));
      
      if (!isNotFound) {
        console.error('Failed to load session:', error);
      }
      // Redirect to base chat page, using replace to avoid adding to history
      navigate('/chat/scholar', { replace: true });
    }
  };

  const handleNewChat = async () => {
    if (user?.role === 'scholar') {
      if (studentOptions.length === 0) {
        alert('You have no enrolled students yet.');
        return;
      }
      setShowScholarPicker(true);
    } else {
      if (scholarOptions.length === 0) {
        alert('You need to enroll with a scholar first to start chatting.');
        navigate('/scholars');
        return;
      }
      setShowScholarPicker(true);
    }
  };

  const pickScholar = async (scholar: Scholar) => {
    try {
      setShowScholarPicker(false);
      setSelectedScholar(scholar);
      setCounterpartName(scholar.user.name);
      const res = await enhancedChatService.startDirectChat(scholar._id);
      const sid = res?.studentSessionId;
      if (sid) {
        skipNextLoad.current = true;
        navigate(`/chat/scholar/${sid}`);
        await loadSessions();
      }
    } catch (error) {
      console.error('Failed to start scholar chat:', error);
      alert('Failed to start chat with scholar. Please try again.');
    }
  };

  const pickStudent = async (student: { id: string; name: string; studentId?: string }) => {
    try {
      setShowScholarPicker(false);
      if (!student.studentId) {
        alert('Could not identify the selected student. Please try again.');
        return;
      }
      setCounterpartName(student.name);
      const res = await startChatWithStudent(student.studentId);
      let sid = res?.scholarSessionId || student.id;
      if (!sid) {
        // Fallback: refresh sessions and pick most recent direct session
        await loadSessions();
        const latest = [...sessions]
          .filter(s => s.kind === 'direct')
          .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())[0];
        sid = latest?._id;
      }
      if (sid) {
        skipNextLoad.current = true;
        navigate(`/chat/scholar/${sid}`);
        await loadSessions();
      } else {
        alert('Chat session could not be created. Please try again.');
      }
    } catch (error) {
      console.error('Failed to open student chat:', error);
      alert('Failed to open chat. Please try again.');
    }
  };

  const handleSelectSession = (id: string) => {
    navigate(`/chat/scholar/${id}`);
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await enhancedChatService.deleteSession(id);
      await loadSessions();
      if (currentSession?._id === id) {
        navigate('/chat/scholar');
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('This chat cannot be deleted');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    if (!currentSession && !selectedScholar) {
      alert('Please select a scholar to start chatting');
      return;
    }
    
    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);
    // Use sessionId from URL or currentSession ID
    let activeSessionId = (sessionId as string | undefined) || currentSession?._id;
    
    try {
      if (!activeSessionId) {
        alert('Please select a scholar to start chatting');
        setIsLoading(false);
        return;
      }
      
      const nextUserMessage: ChatMessage = { role: 'user', content: userMessage };
      const nextMessages = [...messages, nextUserMessage];
      setMessages(nextMessages);
      
      await enhancedChatService.sendDirectMessage(activeSessionId, userMessage);
      setSessions(prev => prev.map(s => s._id === activeSessionId ? { ...s, lastActivity: new Date().toISOString() } : s));
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

  const handleScheduleMeeting = () => {
    if (selectedScholar) {
      navigate(`/meetings/schedule/${selectedScholar._id}`);
    }
  };

  // Removed voice/video call actions per requirement

  return (
    <div className="relative flex h-full w-full">
      {/* Chat History Sidebar */}
      {showHistory && (
        <Card className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 rounded-none rounded-tr-xl rounded-br-xl">
          <CardHeader className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chat</h2>
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
              <UserGroupIcon className="h-5 w-5 mr-2" />
              New Scholar Chat
            </Button>
          </CardHeader>
          
          <ScholarChatHistory
            sessions={sessions}
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
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedScholar ? `Chat with ${selectedScholar.user.name}` : 'Chat'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedScholar ? 'Connect directly with your enrolled Islamic scholar' : 'Hikma Chat'}
                </p>
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

        {/* Scholar Info Bar */}
        {selectedScholar && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ScholarImage
                  src={selectedScholar.photoUrl}
                  alt={selectedScholar.user.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{selectedScholar.user.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      {isOnline ? 'Online' : lastSeen}
                    </div>
                    <div className="flex items-center">
                      <UserGroupIcon className="h-4 w-4 mr-1" />
                      {selectedScholar.totalStudents} students
                    </div>
                    <div className="flex items-center">
                      <SparklesIcon className="h-4 w-4 mr-1" />
                      {selectedScholar.averageRating.toFixed(1)} rating
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleScheduleMeeting}
                  className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                  title="Schedule Meeting"
                >
                  <CalendarIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mb-4">
                <UserGroupIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {selectedScholar ? `Chat with ${selectedScholar.user.name}` : 'Hikma Chat'}
              </h3>
              {selectedScholar ? (
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                  {`Start a conversation with ${selectedScholar.user.name}. Ask questions, seek guidance, or discuss Islamic topics.`}
                </p>
              ) : (
                <button
                  onClick={handleNewChat}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  New Chat
                </button>
              )}
              {selectedScholar && (
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    onClick={() => quickSend('Assalamu alaikum, I have a question about...')}
                    className="p-3 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">Greeting</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Start with a greeting</div>
                  </button>
                  <button
                    onClick={() => quickSend('Can you help me understand...')}
                    className="p-3 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">Question</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Ask a question</div>
                  </button>
                  <button
                    onClick={() => quickSend('I need guidance on...')}
                    className="p-3 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">Guidance</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Seek guidance</div>
                  </button>
                  <button
                    onClick={() => quickSend('Can we schedule a meeting?')}
                    className="p-3 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">Meeting</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Schedule meeting</div>
                  </button>
                </div>
              )}
            </div>
          ) : (
            messages.map((msg, index) => {
              // Get meeting link from metadata (priority) or extract from content
              const getMeetingLink = (): string | null => {
                // First check metadata (from backend meeting messages)
                if (msg.metadata?.meetingLink) {
                  return msg.metadata.meetingLink;
                }
                if (msg.metadata?.meetLink) {
                  return msg.metadata.meetLink;
                }
                
                // Fallback: Extract meeting link from message content
                const urlRegex = /https?:\/\/[^\s<>"']+/g;
                const matches = msg.content.match(urlRegex);
                if (matches) {
                  const meetingLink = matches.find(url => 
                    url.includes('hikmameet.live') || 
                    url.includes('jitsi') || 
                    url.includes('/meet') ||
                    (url.includes('https://') && url.includes('meet'))
                  );
                  if (meetingLink) {
                    return meetingLink.replace(/[.,;:!?]+$/, '');
                  }
                }
                return null;
              };

              const meetingLink = getMeetingLink();
              const isMeetingLinkMessage = msg.type === 'meeting_link' || msg.type === 'meeting_scheduled';
              
              // Remove meeting link from displayed text
              let displayText = msg.content;
              if (meetingLink) {
                const urlPattern = meetingLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                displayText = displayText
                  .replace(new RegExp(urlPattern + '[.,;:!?\\s]*', 'gi'), '')
                  .replace(/Join here:\s*/i, '')
                  .replace(/Meeting link:\s*/i, '')
                  .replace(/meeting link:\s*/i, '')
                  .replace(/Your meeting has started!\s*/i, 'Your meeting has started!')
                  .replace(/Your meeting is scheduled!\s*/i, 'Your meeting is scheduled!')
                  .replace(/\s{2,}/g, ' ')
                  .trim();
              }
              
              // For meeting_link messages, always show button even if displayText is empty
              const shouldShowButton = isMeetingLinkMessage || !!meetingLink;

              return (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    {displayText && displayText.trim() && (
                      <p className="text-sm mb-2">{displayText}</p>
                    )}
                    {shouldShowButton && meetingLink && (
                      <div className="mt-2">
                        <a
                          href={meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 w-full"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          {msg.type === 'meeting_scheduled' ? 'Meeting Scheduled - Join Now' : 'Join Meeting'}
                        </a>
                        {msg.metadata?.scheduledTime && (
                          <p className="text-xs opacity-75 mt-1">
                            Scheduled: {new Date(msg.metadata.scheduledTime).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                    {msg.timestamp && (
                      <div className="text-xs opacity-70 mt-2">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {(otherTyping || isLoading) && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-pulse rounded-full h-2 w-2 bg-emerald-600"></div>
                  <span className="text-sm">{otherTyping ? `${counterpartName || 'User'} is typing…` : 'Sending…'}</span>
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
              onChange={(e) => {
                const val = e.target.value;
                setMessage(val);
                if (sessionId && user?.id) {
                  socketService.sendTyping(sessionId, user.id, val.trim().length > 0);
                }
              }}
              placeholder={currentSession ? (counterpartName ? `Message ${counterpartName}...` : 'Type a message...') : (selectedScholar ? `Message ${selectedScholar.user.name}...` : 'Select a scholar to start chatting...')}
              disabled={!currentSession && !selectedScholar}
              className="flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!message.trim() || isLoading || (!currentSession && !selectedScholar)}
              className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Scholar Picker Modal */}
      {showScholarPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{user?.role === 'scholar' ? 'Select a Student' : 'Select a Scholar'}</h3>
                <button
                  onClick={() => setShowScholarPicker(false)}
                  aria-label="Close"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-3">
                {user?.role === 'scholar'
                  ? (
                    studentOptions.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).map((student) => (
                      <button
                        key={student.id}
                        onClick={() => pickStudent(student)}
                        className="w-full flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <UserIcon className="h-8 w-8 rounded-full mr-3 text-gray-500" />
                        <div className="flex-1 text-left">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{student.name}</h4>
                        </div>
                      </button>
                    ))
                  )
                  : (
                    scholarOptions.filter(s => s.user.name.toLowerCase().includes(search.toLowerCase())).map((scholar) => (
                      <button
                        key={scholar._id}
                        onClick={() => pickScholar(scholar)}
                        className="w-full flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <ScholarImage
                          src={scholar.photoUrl}
                          alt={scholar.user.name}
                          className="h-8 w-8 rounded-full object-cover mr-3"
                        />
                        <div className="flex-1 text-left">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{scholar.user.name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-2 ${scholar.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                              {scholar.isActive ? 'Online' : 'Offline'}
                            </div>
                            <div className="flex items-center">
                              <SparklesIcon className="h-4 w-4 mr-1" />
                              {scholar.averageRating.toFixed(1)} rating
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
              </div>

              {(user?.role !== 'scholar' && scholarOptions.length === 0) && (
                <div className="text-center py-8">
                  <UserGroupIcon className="h-16 w-16 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Scholars Available</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    You need to enroll with a scholar first to start chatting.
                  </p>
                  <Button
                    onClick={() => {
                      setShowScholarPicker(false);
                      navigate('/scholars');
                    }}
                    className="px-4"
                  >
                    Browse Scholars
                  </Button>
                </div>
              )}
              {(user?.role === 'scholar' && studentOptions.length === 0) && (
                <div className="text-center py-8">
                  <UserGroupIcon className="h-16 w-16 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Students Available</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    You have no enrolled students yet.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EnhancedScholarChat;
