const smartScheduler = require('../utils/smartScheduler');
const User = require('../models/User');
const Scholar = require('../models/Scholar');
const Enrollment = require('../models/Enrollment');
const ChatSession = require('../models/ChatSession');
const BroadcastMeeting = require('../models/BroadcastMeeting');
const Meeting = require('../models/Meeting');

// Get optimal meeting times for a scholar
const getOptimalTimes = async (req, res) => {
  try {
    const { duration = 60, daysAhead = 14 } = req.query;
    const scholarId = req.user.id;

    // Verify user is a scholar
    const scholar = await User.findById(scholarId);
    if (!scholar || scholar.role !== 'scholar') {
      return res.status(403).json({ error: 'Only scholars can access this feature' });
    }

    const optimalTimes = await smartScheduler.findOptimalTimes(
      scholarId, 
      parseInt(duration), 
      parseInt(daysAhead)
    );

    res.json({ 
      success: true, 
      optimalTimes,
      scholar: {
        name: scholar.name,
        email: scholar.email
      }
    });
  } catch (error) {
    console.error('Error getting optimal times:', error);
    res.status(500).json({ error: 'Failed to get optimal meeting times' });
  }
};

// Schedule a meeting using smart scheduler
const scheduleSmartMeeting = async (req, res) => {
  try {
    const { studentId, scheduledTime, duration = 60, topic } = req.body;
    const scholarId = req.user.id;

    // Verify user is a scholar
    const scholar = await User.findById(scholarId);
    if (!scholar || scholar.role !== 'scholar') {
      return res.status(403).json({ error: 'Only scholars can schedule meetings' });
    }

    // Verify student exists
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if student is enrolled with this scholar
    const scholarProfile = await Scholar.findOne({ user: scholarId });
    if (!scholarProfile) {
      return res.status(404).json({ error: 'Scholar profile not found' });
    }

    const enrollment = await Enrollment.findOne({ 
      student: studentId, 
      scholar: scholarProfile._id 
    });
    if (!enrollment) {
      return res.status(403).json({ error: 'Student is not enrolled with this scholar' });
    }

    const result = await smartScheduler.scheduleMeeting(
      scholarId,
      studentId,
      scheduledTime,
      duration,
      topic
    );

    res.json({ 
      success: true, 
      meeting: result.meeting,
      message: result.message,
      meetLink: result.meetLink
    });
  } catch (error) {
    console.error('Error scheduling smart meeting:', error);
    res.status(500).json({ error: 'Failed to schedule meeting' });
  }
};

// Broadcast meeting times to all enrolled students
const broadcastMeetingTimes = async (req, res) => {
  try {
    const { meetingTimes, title, description } = req.body;
    const scholarId = req.user.id;

    // Verify user is a scholar
    const scholar = await User.findById(scholarId);
    if (!scholar || scholar.role !== 'scholar') {
      return res.status(403).json({ error: 'Only scholars can broadcast meeting times' });
    }

    if (!meetingTimes || !Array.isArray(meetingTimes) || meetingTimes.length === 0) {
      return res.status(400).json({ error: 'Meeting times are required' });
    }

    const result = await smartScheduler.broadcastMeetingTimes(
      scholarId, 
      meetingTimes, 
      title || 'Available Meeting Times',
      description || ''
    );

    res.json({ 
      success: true, 
      notifiedStudents: result.notifiedStudents,
      broadcastId: result.broadcastId,
      message: result.message
    });
  } catch (error) {
    console.error('Error broadcasting meeting times:', error);
    res.status(500).json({ error: 'Failed to broadcast meeting times' });
  }
};

// Handle student reschedule request
const handleStudentRescheduleRequest = async (req, res) => {
  try {
    const { chatId, proposedTime, note } = req.body;
    const studentId = req.user.id;

    if (!proposedTime) {
      return res.status(400).json({ error: 'Proposed time is required' });
    }

    const result = await smartScheduler.handleRescheduleRequest(
      chatId,
      studentId,
      proposedTime,
      note
    );

    res.json({ 
      success: true, 
      message: result.message,
      messageId: result.message._id
    });
  } catch (error) {
    console.error('Error handling reschedule request:', error);
    res.status(500).json({ error: 'Failed to process reschedule request' });
  }
};

// Get scholar's upcoming meetings
const getScholarUpcomingMeetings = async (req, res) => {
  try {
    const scholarId = req.user.id;

    // Verify user is a scholar
    const scholar = await User.findById(scholarId);
    if (!scholar || scholar.role !== 'scholar') {
      return res.status(403).json({ error: 'Only scholars can access this feature' });
    }

    const meetings = await smartScheduler.getScholarUpcomingMeetings(scholarId);

    res.json({ 
      success: true, 
      meetings,
      count: meetings.length
    });
  } catch (error) {
    console.error('Error getting upcoming meetings:', error);
    res.status(500).json({ error: 'Failed to get upcoming meetings' });
  }
};

// Get student's upcoming meetings
const getStudentUpcomingMeetings = async (req, res) => {
  try {
    const studentId = req.user.id;

    const meetings = await smartScheduler.getStudentUpcomingMeetings(studentId);

    res.json({ 
      success: true, 
      meetings,
      count: meetings.length
    });
  } catch (error) {
    console.error('Error getting student upcoming meetings:', error);
    res.status(500).json({ error: 'Failed to get upcoming meetings' });
  }
};

// Get scholar's availability for a date range
const getScholarAvailability = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const scholarId = req.user.id;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Verify user is a scholar
    const scholar = await User.findById(scholarId);
    if (!scholar || scholar.role !== 'scholar') {
      return res.status(403).json({ error: 'Only scholars can access this feature' });
    }

    const availability = await smartScheduler.getScholarAvailability(
      scholarId,
      new Date(startDate),
      new Date(endDate)
    );

    res.json({ 
      success: true, 
      availability,
      busySlots: availability.length
    });
  } catch (error) {
    console.error('Error getting scholar availability:', error);
    res.status(500).json({ error: 'Failed to get scholar availability' });
  }
};

// Auto-schedule meetings based on student requests
const autoScheduleMeetings = async (req, res) => {
  try {
    const { studentRequests } = req.body;
    const scholarId = req.user.id;

    // Verify user is a scholar
    const scholar = await User.findById(scholarId);
    if (!scholar || scholar.role !== 'scholar') {
      return res.status(403).json({ error: 'Only scholars can auto-schedule meetings' });
    }

    if (!studentRequests || !Array.isArray(studentRequests)) {
      return res.status(400).json({ error: 'Student requests are required' });
    }

    const results = [];
    const optimalTimes = await smartScheduler.findOptimalTimes(scholarId, 60, 7);

    for (const request of studentRequests) {
      if (optimalTimes.length > 0) {
        const selectedTime = optimalTimes[0]; // Take the first optimal time
        optimalTimes.shift(); // Remove used time

        try {
          const result = await smartScheduler.scheduleMeeting(
            scholarId,
            request.studentId,
            selectedTime.start,
            60,
            request.topic || 'Islamic Guidance Session'
          );
          results.push({ success: true, studentId: request.studentId, meeting: result.meeting });
        } catch (error) {
          results.push({ success: false, studentId: request.studentId, error: error.message });
        }
      } else {
        results.push({ success: false, studentId: request.studentId, error: 'No available time slots' });
      }
    }

    res.json({ 
      success: true, 
      results,
      scheduled: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });
  } catch (error) {
    console.error('Error auto-scheduling meetings:', error);
    res.status(500).json({ error: 'Failed to auto-schedule meetings' });
  }
};

// Book a meeting from broadcast
const bookBroadcastMeeting = async (req, res) => {
  try {
    const { broadcastId, timeIndex } = req.body;
    const studentId = req.user.id;

    if (!broadcastId || timeIndex === undefined) {
      return res.status(400).json({ error: 'Broadcast ID and time index are required' });
    }

    const result = await smartScheduler.bookBroadcastMeeting(broadcastId, studentId, timeIndex);

    res.json({ 
      success: true, 
      meeting: result.meeting,
      message: result.message,
      chat: result.chat
    });
  } catch (error) {
    console.error('Error booking broadcast meeting:', error);
    res.status(500).json({ error: error.message || 'Failed to book meeting' });
  }
};

// Get available broadcast meetings for a student
const getAvailableBroadcasts = async (req, res) => {
  try {
    const studentId = req.user.id;

    const broadcasts = await smartScheduler.getAvailableBroadcasts(studentId);

    res.json({ 
      success: true, 
      broadcasts,
      count: broadcasts.length
    });
  } catch (error) {
    console.error('Error getting available broadcasts:', error);
    res.status(500).json({ error: 'Failed to get available broadcasts' });
  }
};

// Get scholar's broadcast meetings
const getScholarBroadcasts = async (req, res) => {
  try {
    const scholarId = req.user.id;

    // Verify user is a scholar
    const scholar = await User.findById(scholarId);
    if (!scholar || scholar.role !== 'scholar') {
      return res.status(403).json({ error: 'Only scholars can access this feature' });
    }

    const broadcasts = await smartScheduler.getScholarBroadcasts(scholarId);

    res.json({ 
      success: true, 
      broadcasts,
      count: broadcasts.length
    });
  } catch (error) {
    console.error('Error getting scholar broadcasts:', error);
    res.status(500).json({ error: 'Failed to get scholar broadcasts' });
  }
};

// Cancel a broadcast meeting
const cancelBroadcastMeeting = async (req, res) => {
  try {
    const { broadcastId } = req.body;
    const scholarId = req.user.id;

    // Verify user is a scholar
    const scholar = await User.findById(scholarId);
    if (!scholar || scholar.role !== 'scholar') {
      return res.status(403).json({ error: 'Only scholars can cancel broadcasts' });
    }

    const broadcast = await BroadcastMeeting.findById(broadcastId);
    if (!broadcast) {
      return res.status(404).json({ error: 'Broadcast meeting not found' });
    }

    if (broadcast.scholarId.toString() !== scholarId) {
      return res.status(403).json({ error: 'Unauthorized to cancel this broadcast' });
    }

    broadcast.status = 'cancelled';
    await broadcast.save();

    res.json({ 
      success: true, 
      message: 'Broadcast meeting cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling broadcast meeting:', error);
    res.status(500).json({ error: 'Failed to cancel broadcast meeting' });
  }
};

// Validate meeting access based on time
const validateMeetingAccess = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;
    const currentTime = new Date();

    // Find the meeting
    const meeting = await Meeting.findById(meetingId)
      .populate('scholarId', 'name email')
      .populate('studentId', 'name email');

    if (!meeting) {
      return res.status(404).json({ 
        success: false, 
        error: 'Meeting not found' 
      });
    }

    // Check if user is authorized (student or scholar)
    const isStudent = meeting.studentId._id.toString() === userId;
    const isScholar = meeting.scholarId._id.toString() === userId;

    if (!isStudent && !isScholar) {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized access to this meeting' 
      });
    }

    // Check if meeting is scheduled
    if (!meeting.scheduledTime) {
      return res.status(400).json({ 
        success: false, 
        error: 'Meeting is not scheduled yet' 
      });
    }

    const meetingStart = new Date(meeting.scheduledTime);
    const meetingEnd = new Date(meetingStart.getTime() + (meeting.duration || 60) * 60000);
    
    // Calculate time differences
    const timeUntilStart = meetingStart.getTime() - currentTime.getTime();
    const timeUntilEnd = meetingEnd.getTime() - currentTime.getTime();
    
    // Meeting access rules
    const canAccess = {
      isActive: timeUntilStart <= 0 && timeUntilEnd > 0, // Meeting is currently active
      isUpcoming: timeUntilStart > 0, // Meeting is in the future
      isPast: timeUntilEnd <= 0, // Meeting has ended
      canEnter: timeUntilStart <= 0 && timeUntilEnd > 0, // Can enter now
      timeUntilStart: Math.max(0, timeUntilStart), // Milliseconds until start
      timeUntilEnd: Math.max(0, timeUntilEnd), // Milliseconds until end
      meetingStart: meetingStart,
      meetingEnd: meetingEnd,
      currentTime: currentTime
    };

    // Additional info
    const meetingInfo = {
      id: meeting._id,
      title: meeting.topic || 'Islamic Guidance Session',
      scholar: {
        name: meeting.scholarId.name,
        email: meeting.scholarId.email
      },
      student: {
        name: meeting.studentId.name,
        email: meeting.studentId.email
      },
      scheduledTime: meeting.scheduledTime,
      duration: meeting.duration || 60,
      meetingLink: meeting.link,
      status: meeting.status
    };

    res.json({
      success: true,
      access: canAccess,
      meeting: meetingInfo,
      message: canAccess.canEnter 
        ? 'You can enter the meeting now' 
        : canAccess.isUpcoming 
          ? 'Meeting has not started yet' 
          : 'Meeting has ended'
    });

  } catch (error) {
    console.error('Error validating meeting access:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to validate meeting access' 
    });
  }
};

module.exports = {
  getOptimalTimes,
  scheduleSmartMeeting,
  broadcastMeetingTimes,
  handleStudentRescheduleRequest,
  getScholarUpcomingMeetings,
  getStudentUpcomingMeetings,
  getScholarAvailability,
  autoScheduleMeetings,
  bookBroadcastMeeting,
  getAvailableBroadcasts,
  getScholarBroadcasts,
  cancelBroadcastMeeting,
  validateMeetingAccess
};
