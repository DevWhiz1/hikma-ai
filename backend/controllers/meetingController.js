const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const crypto = require('crypto');
const ChatSession = require('../models/ChatSession');
const Enrollment = require('../models/Enrollment');
const Scholar = require('../models/Scholar');
const SensitiveLog = require('../models/SensitiveLog');
const { filterMeetingLinks, filterContactInfo, detectAllLinks } = require('../middleware/messageFilter');
const { emitMeetingRequest, emitMeetingScheduled, emitMeetingLinkSent } = require('../utils/socketEmitter');

// Generate Jitsi meeting link using custom domain
const generateJitsiLink = () => {
  const room = crypto.randomBytes(6).toString('hex');
  const jitsiDomain = process.env.JITSI_DOMAIN || 'hikmameet.live';
  return {
    roomId: room,
    link: `https://${jitsiDomain}/HikmaAI-${room}`
  };
};

// Mirror a Hikma-styled message into legacy direct ChatSessions
async function mirrorToHikmaChat(studentUserId, scholarUserId, text) {
  try {
    // Find scholar profile by user id
    const scholarProfile = await Scholar.findOne({ user: scholarUserId }).select('_id user');
    if (!scholarProfile) return;
    // Find enrollment mapping between student user and scholar profile
    const enrollment = await Enrollment.findOne({ student: studentUserId, scholar: scholarProfile._id }).lean();
    if (!enrollment || (!enrollment.studentSession && !enrollment.scholarSession)) return;
    const updates = [];
    if (enrollment.studentSession) {
      updates.push(ChatSession.findByIdAndUpdate(enrollment.studentSession, {
        $push: { messages: { role: 'assistant', content: text } },
        $set: { lastActivity: new Date() }
      }));
    }
    if (enrollment.scholarSession) {
      updates.push(ChatSession.findByIdAndUpdate(enrollment.scholarSession, {
        $push: { messages: { role: 'assistant', content: text } },
        $set: { lastActivity: new Date() }
      }));
    }
    await Promise.all(updates);
  } catch (e) {
    console.warn('Mirror to Hikma chat failed:', e?.message || e);
  }
}

// Request a meeting with a scholar
const requestMeeting = async (req, res) => {
  try {
    const { scholarId, reason } = req.body;
    const studentId = req.user.id;

    if (studentId === scholarId) {
      return res.status(400).json({ error: 'Cannot request meeting with yourself' });
    }

    // Check if scholar exists and is approved
    const scholar = await User.findById(scholarId);
    if (!scholar || scholar.role !== 'scholar') {
      return res.status(404).json({ error: 'Scholar not found or not approved' });
    }

    // Find or create chat
    let chat = await Chat.findOne({ studentId, scholarId });
    if (!chat) {
      chat = new Chat({ studentId, scholarId });
      await chat.save();
    }

    // Create meeting request message (Hikma bot tone)
    const message = new Message({
      sender: studentId,
      chatId: chat._id,
      text: `Hikma: ${req.user.name} requested a meeting.${reason ? ` Reason: ${reason}` : ''}`,
      type: 'meeting_request'
    });
    await message.save();

    // Add message to chat
    chat.messages.push(message._id);
    chat.lastActivity = new Date();
    await chat.save();

    // Upsert meeting record; mark as requested and clear any previous schedule/link
    const meeting = await Meeting.findOneAndUpdate(
      { chatId: chat._id, studentId, scholarId },
      {
        $set: { status: 'requested', reason: reason || undefined },
        $unset: { scheduledTime: "", link: "", roomId: "" }
      },
      { new: true, upsert: true }
    );

    // Mirror into Hikma chat (legacy direct chat)
    await mirrorToHikmaChat(studentId, scholarId, message.text);

    // Notify scholar about meeting request
    try {
      const { notifyAdmin } = require('../agents/notificationAgent');
      const scholarDoc = await User.findById(scholarId).select('email name');
      if (scholarDoc?.email) {
        await notifyAdmin({
          senderName: req.user?.name || 'Unknown',
          senderRole: 'student',
          messageType: 'Meeting Request',
          messagePreview: reason || message.text,
          sessionId: undefined,
          chatId: String(chat._id),
          timestamp: Date.now(),
          toEmail: scholarDoc.email,
          force: true,
        });
      }
    } catch {}

    // Emit WebSocket event for meeting request
    emitMeetingRequest(chat._id, req.user._id, scholarId);

    res.json({ 
      success: true, 
      chatId: chat._id, 
      messageId: message._id,
      meetingId: meeting._id 
    });
  } catch (error) {
    console.error('Error requesting meeting:', error);
    res.status(500).json({ error: 'Failed to request meeting' });
  }
};

// Schedule a meeting
const scheduleMeeting = async (req, res) => {
  try {
    const { chatId, scheduledTime } = req.body;
    const scholarId = req.user.id;

    // Find the chat and verify scholar is participant
    const chat = await Chat.findById(chatId);
    if (!chat || chat.scholarId.toString() !== scholarId) {
      return res.status(404).json({ error: 'Chat not found or unauthorized' });
    }

    // Upsert or update meeting with scheduled time
    const meeting = await Meeting.findOneAndUpdate(
      { chatId, scholarId },
      { $set: { scheduledTime: new Date(scheduledTime), status: 'scheduled' } },
      { new: true, upsert: true }
    );

  // Create scheduled message (Hikma bot)
  const message = new Message({
    sender: scholarId,
    chatId: chat._id,
    text: `Hikma: Meeting scheduled for ${new Date(scheduledTime).toLocaleString()}.`,
    type: 'meeting_scheduled',
    metadata: { scheduledTime: new Date(scheduledTime) }
  });
    await message.save();

    // Add message to chat
    chat.messages.push(message._id);
    chat.lastActivity = new Date();
    await chat.save();

  // Mirror into Hikma chat
  await mirrorToHikmaChat(chat.studentId, chat.scholarId, message.text);

  // Notify both participants about scheduling
  try {
    const { notifyAdmin } = require('../agents/notificationAgent');
    const scholarDoc = await User.findById(scholarId).select('email name');
    const studentDoc = await User.findById(chat.studentId).select('email name');
    const payload = {
      senderName: scholarDoc?.name || 'Scholar',
      senderRole: 'scholar',
      messageType: 'Chat',
      messagePreview: message.text,
      sessionId: undefined,
      chatId: String(chat._id),
      timestamp: Date.now(),
    };
    if (scholarDoc?.email) await notifyAdmin({ ...payload, toEmail: scholarDoc.email, force: true });
    if (studentDoc?.email) await notifyAdmin({ ...payload, toEmail: studentDoc.email, force: true });
  } catch {}

    // Emit WebSocket event for meeting scheduled
    emitMeetingScheduled(chat._id, scheduledTime);

    res.json({ success: true, messageId: message._id });
  } catch (error) {
    console.error('Error scheduling meeting:', error);
    res.status(500).json({ error: 'Failed to schedule meeting' });
  }
};

// Student or scholar requests a reschedule with optional proposed time and note
const requestReschedule = async (req, res) => {
  try {
    const { chatId, proposedTime, note } = req.body;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId);
    if (!chat || (chat.studentId.toString() !== userId && chat.scholarId.toString() !== userId)) {
      return res.status(404).json({ error: 'Chat not found or unauthorized' });
    }

    const meeting = await Meeting.findOne({ chatId });
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

    meeting.rescheduleRequests = meeting.rescheduleRequests || [];
    meeting.rescheduleRequests.push({ requestedBy: userId, proposedTime: proposedTime ? new Date(proposedTime) : undefined, note });
    await meeting.save();

    const msg = new Message({
      sender: userId,
      chatId,
      text: `Hikma: Reschedule requested.${proposedTime ? ` Proposed: ${new Date(proposedTime).toLocaleString()}` : ''}${note ? ` Note: ${note}` : ''}`,
      type: 'text'
    });
    await msg.save();

    chat.messages.push(msg._id);
    chat.lastActivity = new Date();
    await chat.save();

    // Mirror into Hikma chat
    await mirrorToHikmaChat(chat.studentId, chat.scholarId, msg.text);

    // Notify counterpart about reschedule request
    try {
      const { notifyAdmin } = require('../agents/notificationAgent');
      const senderRole = String(userId) === String(chat.scholarId) ? 'scholar' : 'student';
      const sender = await User.findById(userId).select('name email');
      const recipientId = senderRole === 'scholar' ? chat.studentId : chat.scholarId;
      const recipient = await User.findById(recipientId).select('email name');
      if (recipient?.email) {
        await notifyAdmin({
          senderName: sender?.name || 'User',
          senderRole,
          messageType: 'Chat',
          messagePreview: msg.text,
          sessionId: undefined,
          chatId: String(chat._id),
          timestamp: Date.now(),
          toEmail: recipient.email,
          force: false,
        });
      }
    } catch {}

    return res.json({ success: true });
  } catch (error) {
    console.error('Error requesting reschedule:', error);
    res.status(500).json({ error: 'Failed to request reschedule' });
  }
};

// Scholar responds to reschedule: accept, reject, or propose a new time
const respondReschedule = async (req, res) => {
  try {
    const { chatId, decision, newTime, requestIndex } = req.body; // decision: 'accept' | 'reject' | 'propose'
    const scholarId = req.user.id;

    const chat = await Chat.findById(chatId);
    if (!chat || chat.scholarId.toString() !== scholarId) {
      return res.status(404).json({ error: 'Chat not found or unauthorized' });
    }

    const meeting = await Meeting.findOne({ chatId });
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

    const idx = (typeof requestIndex === 'number') ? requestIndex : (meeting.rescheduleRequests?.length || 1) - 1;
    const reqItem = meeting.rescheduleRequests?.[idx];
    if (!reqItem) return res.status(400).json({ error: 'Reschedule request not found' });

    if (decision === 'reject') {
      reqItem.status = 'rejected';
      await meeting.save();
      const msg = new Message({ sender: scholarId, chatId, text: 'Hikma: Reschedule request was rejected.', type: 'text' });
      await msg.save();
      chat.messages.push(msg._id);
      chat.lastActivity = new Date();
      await chat.save();
      try {
        const { notifyAdmin } = require('../agents/notificationAgent');
        const studentDoc = await User.findById(chat.studentId).select('email name');
        if (studentDoc?.email) {
          await notifyAdmin({
            senderName: (await User.findById(scholarId).select('name'))?.name || 'Scholar',
            senderRole: 'scholar',
            messageType: 'Chat',
            messagePreview: msg.text,
            sessionId: undefined,
            chatId: String(chat._id),
            timestamp: Date.now(),
            toEmail: studentDoc.email,
            force: false,
          });
        }
      } catch {}
      return res.json({ success: true });
    }

    // accept or propose
    const finalTime = newTime ? new Date(newTime) : (reqItem.proposedTime || meeting.scheduledTime || new Date());
    meeting.scheduledTime = finalTime;
    meeting.status = 'scheduled';
    reqItem.status = 'accepted';
    await meeting.save();

    const msg = new Message({
      sender: scholarId,
      chatId,
      text: `Hikma: Meeting rescheduled to ${new Date(finalTime).toLocaleString()}.`,
      type: 'meeting_scheduled',
      metadata: { scheduledTime: finalTime }
    });
    await msg.save();
    chat.messages.push(msg._id);
    chat.lastActivity = new Date();
    await chat.save();

    // Mirror into Hikma chat
    await mirrorToHikmaChat(chat.studentId, chat.scholarId, msg.text);

    // Notify both participants about reschedule acceptance
    try {
      const { notifyAdmin } = require('../agents/notificationAgent');
      const scholarDoc = await User.findById(scholarId).select('email name');
      const studentDoc = await User.findById(chat.studentId).select('email name');
      const payload = {
        senderName: scholarDoc?.name || 'Scholar',
        senderRole: 'scholar',
        messageType: 'Chat',
        messagePreview: msg.text,
        sessionId: undefined,
        chatId: String(chat._id),
        timestamp: Date.now(),
      };
    if (scholarDoc?.email) await notifyAdmin({ ...payload, toEmail: scholarDoc.email, force: true });
    if (studentDoc?.email) await notifyAdmin({ ...payload, toEmail: studentDoc.email, force: true });
    } catch {}

    return res.json({ success: true });
  } catch (error) {
    console.error('Error responding to reschedule:', error);
    res.status(500).json({ error: 'Failed to respond to reschedule' });
  }
};

// Scholar cancels a meeting
const cancelMeeting = async (req, res) => {
  try {
    const { chatId } = req.body;
    const scholarId = req.user.id;

    const chat = await Chat.findById(chatId);
    if (!chat || chat.scholarId.toString() !== scholarId) {
      return res.status(404).json({ error: 'Chat not found or unauthorized' });
    }

    await Meeting.findOneAndUpdate({ chatId }, { status: 'cancelled' }, { new: true });

    // Remove previous scheduled/link messages from this chat
    try {
      const removable = await Message.find({ chatId, type: { $in: ['meeting_scheduled','meeting_link'] } }).select('_id');
      const removableIds = removable.map(m => m._id);
      if (removableIds.length) {
        await Message.deleteMany({ _id: { $in: removableIds } });
        chat.messages = chat.messages.filter(id => !removableIds.some(rid => String(rid) === String(id)));
      }
    } catch {}

    const msg = new Message({ sender: scholarId, chatId, text: 'Hikma: Meeting was cancelled by the scholar.', type: 'text' });
    await msg.save();
    chat.messages.push(msg._id);
    chat.lastActivity = new Date();
    await chat.save();

    // Mirror into Hikma chat
    await mirrorToHikmaChat(chat.studentId, chat.scholarId, msg.text);

    // Notify student about cancellation
    try {
      const { notifyAdmin } = require('../agents/notificationAgent');
      const studentDoc = await User.findById(chat.studentId).select('email name');
      if (studentDoc?.email) {
        await notifyAdmin({
          senderName: (await User.findById(scholarId).select('name'))?.name || 'Scholar',
          senderRole: 'scholar',
          messageType: 'Chat',
          messagePreview: msg.text,
          sessionId: undefined,
          chatId: String(chat._id),
          timestamp: Date.now(),
          toEmail: studentDoc.email,
          force: false,
        });
      }
    } catch {}

    return res.json({ success: true });
  } catch (error) {
    console.error('Error cancelling meeting:', error);
    res.status(500).json({ error: 'Failed to cancel meeting' });
  }
};

// Get chat messages
const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    // Verify user is participant in chat
    const chat = await Chat.findById(chatId);
    if (!chat || (chat.studentId.toString() !== userId && chat.scholarId.toString() !== userId)) {
      return res.status(404).json({ error: 'Chat not found or unauthorized' });
    }

    // Get messages with sender info
    const messages = await Message.find({ chatId })
      .populate('sender', 'name email')
      .sort({ timestamp: 1 });

    res.json({ messages });
  } catch (error) {
    console.error('Error getting chat messages:', error);
    res.status(500).json({ error: 'Failed to get chat messages' });
  }
};

// Get user's chats
const getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await Chat.find({
      $or: [{ studentId: userId }, { scholarId: userId }],
      isActive: true
    })
    .populate('studentId', 'name email')
    .populate('scholarId', 'name email')
    .sort({ lastActivity: -1 });

    res.json({ chats });
  } catch (error) {
    console.error('Error getting user chats:', error);
    res.status(500).json({ error: 'Failed to get chats' });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { chatId, text } = req.body;
    const senderId = req.user.id;

    // Verify user is participant in chat
    const chat = await Chat.findById(chatId);
    if (!chat || (chat.studentId.toString() !== senderId && chat.scholarId.toString() !== senderId)) {
      return res.status(404).json({ error: 'Chat not found or unauthorized' });
    }

    // Filter meeting links
    const { filtered: meetingFiltered, hasMeetingLink } = filterMeetingLinks(text);
    
    // Filter contact information (phone/email)
    const { filtered: contactFiltered, hasContactInfo } = filterContactInfo(meetingFiltered);
    const finalText = contactFiltered;
    
    // Detect all links for logging
    const { hasLinks, links } = detectAllLinks(text);

    // Create message
    const message = new Message({
      sender: senderId,
      chatId,
      text: finalText,
      type: 'text'
    });
    await message.save();

    // Add message to chat
    chat.messages.push(message._id);
    chat.lastActivity = new Date();
    await chat.save();

    // Populate sender info
    await message.populate('sender', 'name email');

    // Log all links for sensitive information tracking
    if (hasLinks) {
      try {
        await SensitiveLog.create({ 
          user: senderId, 
          textSample: text.slice(0,200), 
          redactedText: finalText.slice(0,200), 
          endpoint: `/api/meetings/send-message`,
          type: 'link_detected',
          metadata: { 
            links: links.slice(0, 10), // Store first 10 links
            linkCount: links.length 
          }
        });
      } catch {}
    }

    res.json({ success: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Scholar dashboard: enrolled students and meetings grouped
const getScholarDashboard = async (req, res) => {
  try {
    const scholarId = req.user.id;

    // Get enrolled students from Enrollment model
    const Enrollment = require('../models/Enrollment');
    const User = require('../models/User');
    
    // First get the scholar document to get the scholar ID
    const Scholar = require('../models/Scholar');
    const scholarDoc = await Scholar.findOne({ user: scholarId });
    
    if (!scholarDoc) {
      return res.json({ enrolledStudents: [], requested: [], scheduled: [], linkSent: [] });
    }

    // Get enrollments for this scholar
    const enrollments = await Enrollment.find({ 
      scholar: scholarDoc._id, 
      isActive: true 
    })
      .populate('student', 'name email')
      .populate('studentSession', 'lastActivity')
      .sort({ createdAt: -1 });

    const enrolledStudents = enrollments.map(enrollment => ({
      chatId: enrollment.studentSession?._id || enrollment._id,
      student: enrollment.student,
      lastActivity: enrollment.studentSession?.lastActivity || enrollment.createdAt
    }));

    // Meetings grouped by status
    const meetings = await Meeting.find({ scholarId })
      .populate('studentId', 'name email')
      .populate('chatId', '_id')
      .sort({ updatedAt: -1 });

    const requested = meetings.filter(m => m.status === 'requested');
    const scheduled = meetings.filter(m => m.status === 'scheduled');
    const linkSent = meetings.filter(m => m.status === 'link_sent');

    // Debug: Log scholar dashboard data (remove in production)
    console.log('Scholar dashboard data:', {
      scholarId,
      scholarDocId: scholarDoc._id,
      enrollmentsCount: enrollments.length,
      enrolledStudentsCount: enrolledStudents.length,
      meetingsCount: meetings.length
    });

    res.json({ enrolledStudents, requested, scheduled, linkSent });
  } catch (error) {
    console.error('Error loading scholar dashboard:', error);
    res.status(500).json({ error: 'Failed to load scholar dashboard' });
  }
};

// Get user's scheduled meetings
const getUserScheduledMeetings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all scheduled meetings for this user
    const meetings = await Meeting.find({
      studentId: userId,
      status: { $in: ['scheduled', 'link_sent'] },
      scheduledTime: { $gte: new Date() } // Only future meetings
    })
    .populate('scholarId', 'name email')
    .populate('chatId')
    .sort({ scheduledTime: 1 });

    // Format the meetings for the frontend
    const formattedMeetings = meetings.map(meeting => ({
      id: meeting._id,
      title: meeting.topic || 'Islamic Guidance Session',
      scholar: {
        name: meeting.scholarId?.name || 'Scholar',
        photoUrl: null // You can add photoUrl to User model if needed
      },
      date: meeting.scheduledTime ? meeting.scheduledTime.toISOString().split('T')[0] : null,
      time: meeting.scheduledTime ? meeting.scheduledTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }) : null,
      duration: meeting.duration || 60,
      meetingLink: meeting.link,
      status: meeting.status,
      description: meeting.reason || 'Scheduled meeting with your scholar'
    }));

    res.json({
      success: true,
      meetings: formattedMeetings
    });
  } catch (error) {
    console.error('Error getting user scheduled meetings:', error);
    res.status(500).json({ error: 'Failed to get scheduled meetings' });
  }
};

module.exports = {
  requestMeeting,
  scheduleMeeting,
  getChatMessages,
  getUserChats,
  sendMessage,
  getScholarDashboard,
  getUserScheduledMeetings,
  generateJitsiLink,
  requestReschedule,
  respondReschedule,
  cancelMeeting
};
