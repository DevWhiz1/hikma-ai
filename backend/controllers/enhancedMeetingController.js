const intelligentMeetingAgent = require('../agents/intelligentMeetingAgent');
const Meeting = require('../models/Meeting');
const BroadcastMeeting = require('../models/BroadcastMeeting');
const User = require('../models/User');
const Scholar = require('../models/Scholar');
const Enrollment = require('../models/Enrollment');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

// Enhanced meeting analytics
const getMeetingAnalytics = async (req, res) => {
  try {
    const { timeRange = 30, scholarId } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = {};
    if (userRole === 'scholar') {
      query.scholarId = userId;
    } else if (userRole === 'student') {
      query.studentId = userId;
    } else if (scholarId) {
      query.scholarId = scholarId;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    query.scheduledTime = { $gte: startDate };

    const meetings = await Meeting.find(query)
      .populate('scholarId', 'name email')
      .populate('studentId', 'name email')
      .sort({ scheduledTime: -1 });

    // Calculate analytics
    const analytics = {
      totalMeetings: meetings.length,
      completedMeetings: meetings.filter(m => m.status === 'completed').length,
      cancelledMeetings: meetings.filter(m => m.status === 'cancelled').length,
      averageDuration: meetings.reduce((sum, m) => sum + (m.duration || 60), 0) / meetings.length || 0,
      completionRate: 0,
      popularTopics: {},
      timeDistribution: {},
      scholarPerformance: {},
      studentEngagement: {}
    };

    // Calculate completion rate
    if (analytics.totalMeetings > 0) {
      analytics.completionRate = (analytics.completedMeetings / analytics.totalMeetings) * 100;
    }

    // Analyze popular topics
    meetings.forEach(meeting => {
      const topic = meeting.topic || 'General Discussion';
      analytics.popularTopics[topic] = (analytics.popularTopics[topic] || 0) + 1;
    });

    // Analyze time distribution
    meetings.forEach(meeting => {
      const hour = new Date(meeting.scheduledTime).getHours();
      const timeSlot = `${hour}:00-${hour + 1}:00`;
      analytics.timeDistribution[timeSlot] = (analytics.timeDistribution[timeSlot] || 0) + 1;
    });

    // Scholar performance analysis
    if (userRole === 'scholar' || scholarId) {
      const scholarMeetings = meetings.filter(m => m.scholarId._id.toString() === (scholarId || userId));
      analytics.scholarPerformance = {
        totalSessions: scholarMeetings.length,
        averageSessionDuration: scholarMeetings.reduce((sum, m) => sum + (m.duration || 60), 0) / scholarMeetings.length || 0,
        completionRate: scholarMeetings.filter(m => m.status === 'completed').length / scholarMeetings.length * 100 || 0,
        mostPopularTopics: Object.entries(analytics.popularTopics)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([topic, count]) => ({ topic, count }))
      };
    }

    // Student engagement analysis
    if (userRole === 'student') {
      const studentMeetings = meetings.filter(m => m.studentId._id.toString() === userId);
      analytics.studentEngagement = {
        totalSessions: studentMeetings.length,
        averageSessionDuration: studentMeetings.reduce((sum, m) => sum + (m.duration || 60), 0) / studentMeetings.length || 0,
        completionRate: studentMeetings.filter(m => m.status === 'completed').length / studentMeetings.length * 100 || 0,
        preferredTopics: Object.entries(analytics.popularTopics)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([topic, count]) => ({ topic, count }))
      };
    }

    // Get AI insights
    const aiInsights = await intelligentMeetingAgent.analyzeMeetingEffectiveness(
      userRole === 'scholar' ? userId : scholarId || meetings[0]?.scholarId?._id,
      parseInt(timeRange)
    );

    res.json({
      success: true,
      analytics,
      aiInsights,
      timeRange: parseInt(timeRange),
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error getting meeting analytics:', error);
    res.status(500).json({ error: 'Failed to get meeting analytics' });
  }
};

// AI-powered meeting optimization
const optimizeMeetingSchedule = async (req, res) => {
  try {
    const { scholarId, studentPreferences = {} } = req.body;
    const userId = req.user.id;

    // Verify user is a scholar
    if (req.user.role !== 'scholar' && !scholarId) {
      return res.status(403).json({ error: 'Only scholars can optimize meeting schedules' });
    }

    const targetScholarId = scholarId || userId;
    const optimization = await intelligentMeetingAgent.optimizeMeetingTimes(
      targetScholarId,
      studentPreferences
    );

    res.json({
      success: true,
      optimization,
      scholarId: targetScholarId,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error optimizing meeting schedule:', error);
    res.status(500).json({ error: 'Failed to optimize meeting schedule' });
  }
};

// AI-powered topic suggestions
const getTopicSuggestions = async (req, res) => {
  try {
    const { scholarId, studentId, context = {} } = req.body;
    const userId = req.user.id;

    // Verify user is a scholar or student
    if (req.user.role !== 'scholar' && req.user.role !== 'student') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const targetScholarId = scholarId || userId;
    const targetStudentId = studentId || (req.user.role === 'student' ? userId : null);

    if (!targetStudentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const suggestions = await intelligentMeetingAgent.suggestMeetingTopics(
      targetScholarId,
      targetStudentId,
      context
    );

    res.json({
      success: true,
      suggestions,
      scholarId: targetScholarId,
      studentId: targetStudentId,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error getting topic suggestions:', error);
    res.status(500).json({ error: 'Failed to get topic suggestions' });
  }
};

// Smart conflict resolution
const resolveSchedulingConflict = async (req, res) => {
  try {
    const { conflictData } = req.body;
    const userId = req.user.id;

    if (!conflictData) {
      return res.status(400).json({ error: 'Conflict data is required' });
    }

    const resolution = await intelligentMeetingAgent.resolveSchedulingConflict(conflictData);

    res.json({
      success: true,
      resolution,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error resolving scheduling conflict:', error);
    res.status(500).json({ error: 'Failed to resolve scheduling conflict' });
  }
};

// Generate meeting templates
const generateMeetingTemplates = async (req, res) => {
  try {
    const { scholarId } = req.body;
    const userId = req.user.id;

    // Verify user is a scholar
    if (req.user.role !== 'scholar' && !scholarId) {
      return res.status(403).json({ error: 'Only scholars can generate meeting templates' });
    }

    const targetScholarId = scholarId || userId;
    const templates = await intelligentMeetingAgent.generateMeetingTemplates(targetScholarId);

    res.json({
      success: true,
      templates,
      scholarId: targetScholarId,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error generating meeting templates:', error);
    res.status(500).json({ error: 'Failed to generate meeting templates' });
  }
};

// Prayer time aware scheduling
const getPrayerTimeAwareSchedule = async (req, res) => {
  try {
    const { scholarId, dateRange = 7 } = req.body;
    const userId = req.user.id;

    // Verify user is a scholar
    if (req.user.role !== 'scholar' && !scholarId) {
      return res.status(403).json({ error: 'Only scholars can access prayer time aware scheduling' });
    }

    const targetScholarId = scholarId || userId;
    const schedule = await intelligentMeetingAgent.getPrayerTimeAwareSchedule(
      targetScholarId,
      parseInt(dateRange)
    );

    res.json({
      success: true,
      schedule,
      scholarId: targetScholarId,
      dateRange: parseInt(dateRange),
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error getting prayer time aware schedule:', error);
    res.status(500).json({ error: 'Failed to get prayer time aware schedule' });
  }
};

// Smart meeting reminders
const setupSmartReminders = async (req, res) => {
  try {
    const { meetingId, reminderTypes = ['24h', '2h', '15m'] } = req.body;
    const userId = req.user.id;

    if (!meetingId) {
      return res.status(400).json({ error: 'Meeting ID is required' });
    }

    // Verify user has access to the meeting
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (meeting.scholarId.toString() !== userId && meeting.studentId.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Setup reminders
    const reminders = await intelligentMeetingAgent.generateSmartReminders(meetingId);
    
    if (!reminders) {
      return res.status(500).json({ error: 'Failed to generate reminders' });
    }

    // Schedule reminders (this would integrate with a job scheduler like node-cron)
    for (const reminderType of reminderTypes) {
      await scheduleReminder(meetingId, reminderType);
    }

    res.json({
      success: true,
      meetingId,
      reminderTypes,
      reminders,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error setting up smart reminders:', error);
    res.status(500).json({ error: 'Failed to setup smart reminders' });
  }
};

// Helper function to schedule reminders
async function scheduleReminder(meetingId, reminderType) {
  // This would integrate with a job scheduler
  // For now, we'll just log the reminder
  console.log(`Scheduled ${reminderType} reminder for meeting ${meetingId}`);
}

// Enhanced meeting booking with AI assistance
const bookMeetingWithAI = async (req, res) => {
  try {
    const { broadcastId, timeIndex, preferences = {} } = req.body;
    const studentId = req.user.id;

    if (!broadcastId || timeIndex === undefined) {
      return res.status(400).json({ error: 'Broadcast ID and time index are required' });
    }

    // Get AI suggestions for the meeting
    const broadcast = await BroadcastMeeting.findById(broadcastId);
    if (!broadcast) {
      return res.status(404).json({ error: 'Broadcast not found' });
    }

    const aiSuggestions = await intelligentMeetingAgent.suggestMeetingTopics(
      broadcast.scholarId,
      studentId,
      {
        topic: broadcast.title,
        duration: broadcast.meetingTimes[timeIndex]?.duration || 60,
        ...preferences
      }
    );

    // Book the meeting (using existing smart scheduler logic)
    const { smartScheduler } = require('../utils/smartScheduler');
    const result = await smartScheduler.bookBroadcastMeeting(broadcastId, studentId, timeIndex);

    // Add AI suggestions to the meeting
    if (result.meeting) {
      result.meeting.aiSuggestions = aiSuggestions;
      await result.meeting.save();
    }

    res.json({
      success: true,
      meeting: result.meeting,
      message: result.message,
      chat: result.chat,
      aiSuggestions,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error booking meeting with AI:', error);
    res.status(500).json({ error: error.message || 'Failed to book meeting' });
  }
};

// Meeting effectiveness insights
const getMeetingInsights = async (req, res) => {
  try {
    const { scholarId, timeRange = 30 } = req.query;
    const userId = req.user.id;

    const targetScholarId = scholarId || userId;
    
    if (req.user.role !== 'scholar' && !scholarId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const insights = await intelligentMeetingAgent.analyzeMeetingEffectiveness(
      targetScholarId,
      parseInt(timeRange)
    );

    res.json({
      success: true,
      insights,
      scholarId: targetScholarId,
      timeRange: parseInt(timeRange),
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error getting meeting insights:', error);
    res.status(500).json({ error: 'Failed to get meeting insights' });
  }
};

module.exports = {
  getMeetingAnalytics,
  optimizeMeetingSchedule,
  getTopicSuggestions,
  resolveSchedulingConflict,
  generateMeetingTemplates,
  getPrayerTimeAwareSchedule,
  setupSmartReminders,
  bookMeetingWithAI,
  getMeetingInsights
};
