const { google } = require('googleapis');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Meeting = require('../models/Meeting');
const Message = require('../models/Message');
const Enrollment = require('../models/Enrollment');
const Scholar = require('../models/Scholar');
const BroadcastMeeting = require('../models/BroadcastMeeting');
const ChatSession = require('../models/ChatSession');
const { notifyAdmin } = require('../agents/notificationAgent');
const { emitBroadcastMeetingPosted, emitBroadcastMeetingBooked } = require('./socketEmitter');

class SmartScheduler {
  constructor() {
    this.calendar = google.calendar('v3');
    this.jwtClient = null;
    this.initializeAuth();
  }

  async initializeAuth() {
    try {
      // Only initialize if Google credentials are provided
      if (!process.env.GOOGLE_SERVICE_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        console.log('Google Calendar credentials not provided - Smart Scheduler will work without calendar integration');
        return;
      }

      this.jwtClient = new google.auth.JWT(
        process.env.GOOGLE_SERVICE_EMAIL,
        null,
        (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        ['https://www.googleapis.com/auth/calendar']
      );
      await this.jwtClient.authorize();
      console.log('Google Calendar auth initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Calendar auth:', error);
      console.log('Smart Scheduler will work without calendar integration');
    }
  }

  // Get scholar's availability from Google Calendar
  async getScholarAvailability(scholarId, startDate, endDate) {
    try {
      if (!this.jwtClient) {
        console.log('Google Calendar not available - returning empty availability');
        return [];
      }

      const scholar = await User.findById(scholarId);
      if (!scholar || scholar.role !== 'scholar') {
        throw new Error('Scholar not found');
      }

      // Get scholar's calendar events
      const response = await this.calendar.events.list({
        auth: this.jwtClient,
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      const events = response.data.items || [];
      const busySlots = events.map(event => ({
        start: new Date(event.start.dateTime || event.start.date),
        end: new Date(event.end.dateTime || event.end.date),
        title: event.summary || 'Busy'
      }));

      return busySlots;
    } catch (error) {
      console.error('Error getting scholar availability:', error);
      return [];
    }
  }

  // Find optimal meeting times based on scholar availability and student preferences
  async findOptimalTimes(scholarId, duration = 60, daysAhead = 14) {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysAhead);

      // Get busy slots (empty if Google Calendar not available)
      const busySlots = await this.getScholarAvailability(scholarId, startDate, endDate);
      
      // Get already posted broadcast times for this scholar
      const postedSlots = await this.getScholarPostedSlots(scholarId, startDate, endDate);
      
      // Generate time slots (every 30 minutes from 9 AM to 9 PM)
      const timeSlots = this.generateTimeSlots(startDate, endDate, duration);
      
      // Filter out busy slots and already posted slots
      const availableSlots = timeSlots.filter(slot => 
        !this.isSlotConflicted(slot, busySlots) &&
        !this.isSlotConflicted(slot, postedSlots)
      );

      // Prioritize slots (prefer business hours, avoid weekends)
      const prioritizedSlots = this.prioritizeSlots(availableSlots);

      return prioritizedSlots.slice(0, 10); // Return top 10 options
    } catch (error) {
      console.error('Error finding optimal times:', error);
      return [];
    }
  }

  // Generate time slots
  generateTimeSlots(startDate, endDate, duration) {
    const slots = [];
    const current = new Date(startDate);
    
    while (current < endDate) {
      // Skip weekends
      if (current.getDay() !== 0 && current.getDay() !== 6) {
        const hour = current.getHours();
        // Business hours: 9 AM to 9 PM
        if (hour >= 9 && hour <= 21) {
          const endTime = new Date(current.getTime() + duration * 60000);
          slots.push({
            start: new Date(current),
            end: endTime,
            duration: duration
          });
        }
      }
      current.setMinutes(current.getMinutes() + 30);
    }
    
    return slots;
  }

  // Get already posted broadcast time slots for a scholar
  async getScholarPostedSlots(scholarId, startDate, endDate) {
    try {
      const broadcasts = await BroadcastMeeting.find({
        scholarId,
        status: 'active',
        expiresAt: { $gt: new Date() }
      });

      const postedSlots = [];
      for (const broadcast of broadcasts) {
        for (const timeSlot of broadcast.meetingTimes) {
          const slotStart = new Date(timeSlot.start);
          const slotEnd = new Date(timeSlot.end);
          
          // Only include slots within the date range
          if (slotStart >= startDate && slotEnd <= endDate) {
            postedSlots.push({
              start: slotStart,
              end: slotEnd,
              duration: timeSlot.duration || 60
            });
          }
        }
      }

      return postedSlots;
    } catch (error) {
      console.error('Error getting scholar posted slots:', error);
      return [];
    }
  }

  // Check if a slot conflicts with busy times
  isSlotConflicted(slot, busySlots) {
    return busySlots.some(busy => 
      (slot.start < busy.end && slot.end > busy.start)
    );
  }

  // Prioritize time slots (business hours, avoid early morning/late night)
  prioritizeSlots(slots) {
    return slots.sort((a, b) => {
      const aHour = a.start.getHours();
      const bHour = b.start.getHours();
      
      // Prefer 10 AM - 6 PM
      const aScore = (aHour >= 10 && aHour <= 18) ? 0 : 1;
      const bScore = (bHour >= 10 && bHour <= 18) ? 0 : 1;
      
      if (aScore !== bScore) return aScore - bScore;
      
      // Then by time of day
      return a.start.getTime() - b.start.getTime();
    });
  }

  // Schedule a meeting with Jitsi Meet integration
  async scheduleMeeting(scholarId, studentId, scheduledTime, duration = 60, topic = 'Islamic Guidance Session') {
    try {
      const scholar = await User.findById(scholarId);
      const student = await User.findById(studentId);
      
      if (!scholar || !student) {
        throw new Error('Scholar or student not found');
      }

      // Generate Jitsi Meet link (using existing system)
      const { generateJitsiLink } = require('../controllers/meetingController');
      const { roomId, link } = generateJitsiLink();

      // Update the meeting in database
      const chat = await Chat.findOne({ scholarId, studentId });
      if (!chat) {
        throw new Error('Chat not found');
      }

      const meeting = await Meeting.findOneAndUpdate(
        { chatId: chat._id, scholarId, studentId },
        {
          $set: {
            scheduledTime: new Date(scheduledTime),
            link: link,
            roomId: roomId,
            status: 'scheduled'
          }
        },
        { new: true, upsert: true }
      );

      // Create notification message (link is in metadata, will be shown as button)
      const message = new Message({
        sender: scholarId,
        chatId: chat._id,
        text: `HikmaBot: Meeting scheduled for ${new Date(scheduledTime).toLocaleString()}.`,
        type: 'meeting_scheduled',
        metadata: { 
          scheduledTime: new Date(scheduledTime),
          meetLink: link,
          roomId: roomId
        }
      });
      
      // Also create a meeting_link message with the button
      const linkMessage = new Message({
        sender: scholarId,
        chatId: chat._id,
        text: `HikmaBot: Your meeting link is ready!`,
        type: 'meeting_link',
        metadata: { 
          meetingLink: link,
          meetLink: link,
          roomId: roomId,
          scheduledTime: new Date(scheduledTime)
        }
      });
      await linkMessage.save();
      chat.messages.push(linkMessage._id);
      await message.save();

      // Add message to chat
      chat.messages.push(message._id);
      chat.lastActivity = new Date();
      await chat.save();

      // Notify both participants
      await this.notifyMeetingScheduled(scholar, student, meeting, link);

      return { meeting, message, meetLink: link };
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      throw error;
    }
  }

  // Send meeting times to all enrolled students
  async broadcastMeetingTimes(scholarId, meetingTimes, title = 'Available Meeting Times', description = '') {
    try {
      const scholar = await User.findById(scholarId);
      if (!scholar || scholar.role !== 'scholar') {
        throw new Error('Scholar not found');
      }

      // Create broadcast meeting record
      const broadcastMeeting = new BroadcastMeeting({
        scholarId,
        title,
        description,
        meetingTimes: meetingTimes.map(time => ({
          start: new Date(time.start),
          end: new Date(time.end),
          duration: time.duration || 60,
          maxParticipants: time.maxParticipants || 1
        })),
        timezone: process.env.DEFAULT_TIMEZONE || 'UTC',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
      });
      await broadcastMeeting.save();

      // Get all enrolled students
      const scholarProfile = await Scholar.findOne({ user: scholarId });
      if (!scholarProfile) {
        throw new Error('Scholar profile not found');
      }

      const enrollments = await Enrollment.find({ scholar: scholarProfile._id })
        .populate('student', 'name email')
        .populate('studentSession');

      let notifiedCount = 0;

      for (const enrollment of enrollments) {
        if (enrollment.studentSession) {
          // Create broadcast message
          const message = new Message({
            sender: scholarId,
            chatId: enrollment.studentSession,
            text: `Slots posted, book yours! ${scholar.name} has posted ${meetingTimes.length} new class time(s) available for booking.`,
            type: 'meeting_broadcast',
            metadata: { 
              meetingTimes,
              broadcastId: broadcastMeeting._id,
              scholarName: scholar.name,
              expiresAt: broadcastMeeting.expiresAt
            }
          });
          await message.save();

          // Update chat session
          const chatSession = await ChatSession.findById(enrollment.studentSession);
          if (chatSession) {
            chatSession.messages.push({
              role: 'assistant',
              content: `Slots posted, book yours! ${scholar.name} has posted ${meetingTimes.length} new class time(s) available for booking.`,
              timestamp: new Date(),
              metadata: {
                meetingTimes: meetingTimes,
                broadcastId: broadcastMeeting._id,
                scholarName: scholar.name,
                expiresAt: broadcastMeeting.expiresAt
              }
            });
            chatSession.lastActivity = new Date();
            await chatSession.save();
          }

          // Send email notification
          if (enrollment.student.email) {
            await notifyAdmin({
              senderName: scholar.name,
              senderRole: 'scholar',
              messageType: 'Meeting Times Available',
              messagePreview: `New meeting times available from ${scholar.name}`,
              sessionId: undefined,
              chatId: String(enrollment.studentSession),
              timestamp: Date.now(),
              toEmail: enrollment.student.email,
              force: true
            });
          }

          notifiedCount++;

          // Emit WebSocket event for broadcast meeting posted
          emitBroadcastMeetingPosted(enrollment.student._id, {
            broadcastId: broadcastMeeting._id,
            scholarName: scholar.name,
            meetingTimes: meetingTimes.length,
            title,
            description
          });
        }
      }

      return { 
        success: true, 
        notifiedStudents: notifiedCount,
        broadcastId: broadcastMeeting._id,
        message: `Meeting times broadcasted to ${notifiedCount} students`
      };
    } catch (error) {
      console.error('Error broadcasting meeting times:', error);
      throw error;
    }
  }

  // Handle student reschedule requests
  async handleRescheduleRequest(chatId, studentId, proposedTime, note) {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }

      const meeting = await Meeting.findOne({ chatId });
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      // Add reschedule request
      meeting.rescheduleRequests = meeting.rescheduleRequests || [];
      meeting.rescheduleRequests.push({
        requestedBy: studentId,
        proposedTime: new Date(proposedTime),
        note: note,
        status: 'pending',
        createdAt: new Date()
      });
      await meeting.save();

      // Create notification message
      const message = new Message({
        sender: studentId,
        chatId: chatId,
        text: `HikmaBot: Reschedule requested for ${new Date(proposedTime).toLocaleString()}.${note ? ` Note: ${note}` : ''}`,
        type: 'reschedule_request',
        metadata: { proposedTime: new Date(proposedTime), note }
      });
      await message.save();

      // Update chat
      chat.messages.push(message._id);
      chat.lastActivity = new Date();
      await chat.save();

      // Notify scholar
      const scholar = await User.findById(chat.scholarId);
      if (scholar && scholar.email) {
        await notifyAdmin({
          senderName: (await User.findById(studentId)).name,
          senderRole: 'student',
          messageType: 'Reschedule Request',
          messagePreview: `Reschedule request for ${new Date(proposedTime).toLocaleString()}`,
          sessionId: undefined,
          chatId: String(chatId),
          timestamp: Date.now(),
          toEmail: scholar.email,
          force: true
        });
      }

      return { success: true, message };
    } catch (error) {
      console.error('Error handling reschedule request:', error);
      throw error;
    }
  }

  // Notify participants about scheduled meeting
  async notifyMeetingScheduled(scholar, student, meeting, meetLink) {
    try {
      const payload = {
        senderName: scholar.name,
        senderRole: 'scholar',
        messageType: 'Meeting Scheduled',
        messagePreview: `Meeting scheduled for ${new Date(meeting.scheduledTime).toLocaleString()}`,
        sessionId: undefined,
        chatId: String(meeting.chatId),
        timestamp: Date.now()
      };

      // Notify scholar
      if (scholar.email) {
        await notifyAdmin({
          ...payload,
          toEmail: scholar.email,
          force: true
        });
      }

      // Notify student
      if (student.email) {
        await notifyAdmin({
          ...payload,
          toEmail: student.email,
          force: true
        });
      }
    } catch (error) {
      console.error('Error notifying meeting scheduled:', error);
    }
  }

  // Get scholar's upcoming meetings
  async getScholarUpcomingMeetings(scholarId) {
    try {
      const meetings = await Meeting.find({
        scholarId,
        status: { $in: ['scheduled', 'link_sent'] },
        scheduledTime: { $gte: new Date() }
      })
      .populate('studentId', 'name email')
      .populate('chatId', '_id')
      .sort({ scheduledTime: 1 });

      return meetings;
    } catch (error) {
      console.error('Error getting upcoming meetings:', error);
      return [];
    }
  }

  // Get student's upcoming meetings
  async getStudentUpcomingMeetings(studentId) {
    try {
      const meetings = await Meeting.find({
        studentId,
        status: { $in: ['scheduled', 'link_sent'] },
        scheduledTime: { $gte: new Date() }
      })
      .populate('scholarId', 'name email')
      .populate('chatId', '_id')
      .sort({ scheduledTime: 1 });

      return meetings;
    } catch (error) {
      console.error('Error getting student upcoming meetings:', error);
      return [];
    }
  }

  // Book a meeting from broadcast
  async bookBroadcastMeeting(broadcastId, studentId, timeIndex) {
    try {
      const broadcastMeeting = await BroadcastMeeting.findById(broadcastId);
      if (!broadcastMeeting) {
        throw new Error('Broadcast meeting not found');
      }

      if (timeIndex >= broadcastMeeting.meetingTimes.length) {
        throw new Error('Invalid time index');
      }

      const timeSlot = broadcastMeeting.meetingTimes[timeIndex];
      if (timeSlot.isBooked) {
        throw new Error('This time slot is already booked');
      }

      // Check if broadcast is still active
      if (broadcastMeeting.status !== 'active' || broadcastMeeting.expiresAt < new Date()) {
        throw new Error('This broadcast is no longer active');
      }

      // Book the time slot
      timeSlot.isBooked = true;
      timeSlot.bookedBy = studentId;
      timeSlot.bookedAt = new Date();
      await broadcastMeeting.save();

      // Create a meeting record
      let chat = await Chat.findOne({ 
        studentId, 
        scholarId: broadcastMeeting.scholarId 
      });
      
      if (!chat) {
        // Create chat if it doesn't exist
        const newChat = new Chat({ 
          studentId, 
          scholarId: broadcastMeeting.scholarId 
        });
        await newChat.save();
        chat = newChat;
      }

      // Generate Jitsi Meet link for the booked meeting
      const { generateJitsiLink } = require('../controllers/meetingController');
      const { roomId, link } = generateJitsiLink();

      const meeting = new Meeting({
        chatId: chat._id,
        studentId,
        scholarId: broadcastMeeting.scholarId,
        scheduledTime: timeSlot.start,
        duration: timeSlot.duration,
        topic: broadcastMeeting.title,
        link: link,
        roomId: roomId,
        status: 'scheduled',
        isSmartScheduled: true,
        broadcastId: broadcastId,
        timezone: broadcastMeeting.timezone
      });
      await meeting.save();

      // Create notification message
      const message = new Message({
        sender: studentId,
        chatId: chat._id,
        text: `HikmaBot: Meeting booked for ${new Date(timeSlot.start).toLocaleString()}. Topic: ${broadcastMeeting.title}.`,
        type: 'meeting_booked',
        metadata: { 
          scheduledTime: timeSlot.start,
          topic: broadcastMeeting.title,
          broadcastId: broadcastId,
          meetLink: link,
          roomId: roomId
        }
      });
      await message.save();

      // Update chat
      chat.messages.push(message._id);
      chat.lastActivity = new Date();
      await chat.save();

      // Notify scholar
      const scholar = await User.findById(broadcastMeeting.scholarId);
      const student = await User.findById(studentId);
      
      if (scholar && scholar.email) {
        await notifyAdmin({
          senderName: student.name,
          senderRole: 'student',
          messageType: 'Meeting Booked',
          messagePreview: `Meeting booked for ${new Date(timeSlot.start).toLocaleString()}`,
          sessionId: undefined,
          chatId: String(chat._id),
          timestamp: Date.now(),
          toEmail: scholar.email,
          force: true
        });
      }

      // Emit WebSocket event for broadcast meeting booked
      emitBroadcastMeetingBooked(broadcastMeeting.scholarId, {
        broadcastId: broadcastId,
        studentName: student.name,
        scheduledTime: timeSlot.start,
        topic: broadcastMeeting.title
      });

      return { meeting, message, chat };
    } catch (error) {
      console.error('Error booking broadcast meeting:', error);
      throw error;
    }
  }

  // Get available broadcast meetings for a student
  async getAvailableBroadcasts(studentId) {
    try {
      // Get student's enrolled scholars
      const enrollments = await Enrollment.find({ student: studentId })
        .populate('scholar', 'user')
        .populate('scholar.user', 'name email');

      const scholarIds = enrollments.map(e => e.scholar.user._id);

      // Get active broadcast meetings from these scholars
      const broadcasts = await BroadcastMeeting.find({
        scholarId: { $in: scholarIds },
        status: 'active',
        expiresAt: { $gt: new Date() }
      })
      .populate('scholarId', 'name email')
      .sort({ createdAt: -1 });

      // Filter out fully booked broadcasts and only show available time slots
      const availableBroadcasts = broadcasts
        .filter(broadcast => 
          broadcast.meetingTimes.some(time => !time.isBooked)
        )
        .map(broadcast => ({
          ...broadcast.toObject(),
          meetingTimes: broadcast.meetingTimes.filter(time => !time.isBooked)
        }));

      return availableBroadcasts;
    } catch (error) {
      console.error('Error getting available broadcasts:', error);
      return [];
    }
  }

  // Get scholar's broadcast meetings
  async getScholarBroadcasts(scholarId) {
    try {
      const broadcasts = await BroadcastMeeting.find({
        scholarId,
        status: { $in: ['active', 'completed'] }
      })
      .sort({ createdAt: -1 });

      return broadcasts;
    } catch (error) {
      console.error('Error getting scholar broadcasts:', error);
      return [];
    }
  }
}

module.exports = new SmartScheduler();
