import { io, Socket } from 'socket.io-client';
import { authService } from './authService';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.socket?.connected) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    // Remove /api suffix for Socket.IO connection
    const serverUrl = apiUrl.replace('/api', '');
    console.log('Attempting to connect to Socket.IO server:', serverUrl);
    
    this.socket = io(serverUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['polling', 'websocket']
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected successfully:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Test connection with a simple event
      this.socket.emit('test-connection', { message: 'Hello from client' });
      
      // Join user room
      const user = authService.getUser();
      if (user) {
        console.log('Joining user room for:', user.id);
        this.joinUserRoom(user.id);
      } else {
        console.log('No user found for room join');
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      console.error('Error details:', {
        message: error.message,
        description: error.description,
        context: error.context,
        type: error.type
      });
      this.isConnected = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Rejoin user room after reconnection
      const user = authService.getUser();
      if (user) {
        this.joinUserRoom(user.id);
      }
    });

    // Test response handler
    this.socket.on('test-response', (data) => {
      console.log('Test response received from server:', data);
    });
  }

  // User room management
  joinUserRoom(userId: string) {
    if (this.socket?.connected && userId) {
      this.socket.emit('join-user-room', userId);
    }
  }

  // Chat room management
  joinChat(chatId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join-chat', chatId);
    }
  }

  leaveChat(chatId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave-chat', chatId);
    }
  }

  // Message events
  sendMessage(chatId: string, text: string, senderId: string) {
    if (this.socket?.connected) {
      this.socket.emit('send-message', {
        chatId,
        text,
        senderId,
        timestamp: new Date()
      });
    }
  }

  onNewMessage(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('new-message', callback);
    }
  }

  offNewMessage(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off('new-message', callback);
    }
  }

  // Meeting events
  sendMeetingRequest(chatId: string, studentId: string, scholarId: string) {
    if (this.socket?.connected) {
      this.socket.emit('meeting-request', {
        chatId,
        studentId,
        scholarId
      });
    }
  }

  onMeetingRequest(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('meetingRequest', callback);
    }
  }

  sendMeetingScheduled(chatId: string, scheduledTime: string) {
    if (this.socket?.connected) {
      this.socket.emit('meeting-scheduled', {
        chatId,
        scheduledTime
      });
    }
  }

  onMeetingScheduled(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('meetingScheduled', callback);
    }
  }

  sendMeetingLinkSent(chatId: string, link: string, roomId: string) {
    if (this.socket?.connected) {
      this.socket.emit('meeting-link-sent', {
        chatId,
        link,
        roomId
      });
    }
  }

  onMeetingLinkSent(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('meetingLinkSent', callback);
    }
  }

  // Notification events
  onNotification(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('notification', callback);
    }
  }

  offNotification(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off('notification', callback);
    }
  }

  // Broadcast meeting events
  onBroadcastMeetingPosted(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('broadcast-meeting-posted', callback);
    }
  }

  onBroadcastMeetingBooked(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('broadcast-meeting-booked', callback);
    }
  }

  // Session events
  onSessionUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('session-update', callback);
    }
  }

  offSessionUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off('session-update', callback);
    }
  }

  // Typing indicators
  sendTyping(chatId: string, userId: string, isTyping: boolean) {
    if (this.socket?.connected) {
      this.socket.emit('typing', {
        chatId,
        userId,
        isTyping
      });
    }
  }

  onTyping(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('typing', callback);
    }
  }

  offTyping(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off('typing', callback);
    }
  }

  // Connection status
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Reconnect manually
  reconnect() {
    this.disconnect();
    this.connect();
  }

  // Get socket instance
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;
