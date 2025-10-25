// Socket.IO event emitter utility
let io = null;

// Initialize socket.io instance
const initializeSocket = (socketInstance) => {
  io = socketInstance;
};

// Emit events to specific users or rooms
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user-${userId}`).emit(event, data);
  }
};

const emitToChat = (chatId, event, data) => {
  if (io) {
    io.to(`chat-${chatId}`).emit(event, data);
  }
};

const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

// Chat events
const emitNewMessage = (chatId, messageData) => {
  emitToChat(chatId, 'new-message', {
    chatId,
    text: messageData.text,
    senderId: messageData.senderId,
    timestamp: messageData.timestamp
  });
};

const emitSessionUpdate = (userId, sessionId, sessionData) => {
  emitToUser(userId, 'session-update', {
    sessionId,
    session: sessionData
  });
};

// Meeting events
const emitMeetingRequest = (chatId, studentId, scholarId) => {
  emitToChat(chatId, 'meetingRequest', {
    chatId,
    studentId,
    scholarId
  });
};

const emitMeetingScheduled = (chatId, scheduledTime) => {
  emitToChat(chatId, 'meetingScheduled', {
    chatId,
    scheduledTime
  });
};

const emitMeetingLinkSent = (chatId, link, roomId) => {
  emitToChat(chatId, 'meetingLinkSent', {
    chatId,
    link,
    roomId
  });
};

// Broadcast meeting events
const emitBroadcastMeetingPosted = (userId, broadcastData) => {
  emitToUser(userId, 'broadcast-meeting-posted', broadcastData);
};

const emitBroadcastMeetingBooked = (scholarId, bookingData) => {
  emitToUser(scholarId, 'broadcast-meeting-booked', bookingData);
};

// Notification events
const emitNotification = (userId, notificationData) => {
  emitToUser(userId, 'notification', notificationData);
};

// Typing indicators
const emitTyping = (chatId, userId, isTyping) => {
  emitToChat(chatId, 'typing', {
    chatId,
    userId,
    isTyping
  });
};

module.exports = {
  initializeSocket,
  emitToUser,
  emitToChat,
  emitToAll,
  emitNewMessage,
  emitSessionUpdate,
  emitMeetingRequest,
  emitMeetingScheduled,
  emitMeetingLinkSent,
  emitBroadcastMeetingPosted,
  emitBroadcastMeetingBooked,
  emitNotification,
  emitTyping
};
