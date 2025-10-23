const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');
const Meeting = require('../models/Meeting');
const BroadcastMeeting = require('../models/BroadcastMeeting');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Enrollment = require('../models/Enrollment');
const Scholar = require('../models/Scholar');
const { notifyAdmin } = require('./notificationAgent');

class IntelligentMeetingAgent {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction: this.getSystemPrompt()
    });
  }

  getSystemPrompt() {
    return `You are an intelligent Islamic meeting assistant for Hikmah AI. Your role is to:

1. **Smart Scheduling**: Analyze scholar availability, student preferences, and Islamic calendar events to suggest optimal meeting times
2. **Meeting Optimization**: Recommend meeting durations, topics, and formats based on Islamic guidance principles
3. **Conflict Resolution**: Help resolve scheduling conflicts with Islamic wisdom and practical solutions
4. **Cultural Sensitivity**: Consider prayer times, Islamic holidays, and cultural preferences
5. **Meeting Analytics**: Provide insights on meeting patterns, student engagement, and scholar performance

Key Principles:
- Always prioritize Islamic values and teachings
- Consider prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha) when scheduling
- Respect cultural and timezone differences
- Provide gentle, helpful guidance
- Maintain professional Islamic tone
- Focus on educational and spiritual growth

When analyzing meeting data, consider:
- Student learning patterns and preferences
- Scholar expertise areas and availability
- Islamic calendar events and holidays
- Optimal learning times based on Islamic teachings
- Meeting effectiveness and outcomes

Always respond with practical, actionable advice that aligns with Islamic principles.`;
  }

  // AI-powered meeting time optimization
  async optimizeMeetingTimes(scholarId, studentPreferences = {}) {
    try {
      const scholar = await User.findById(scholarId).populate('scholarProfile');
      const recentMeetings = await Meeting.find({ scholarId })
        .populate('studentId', 'name timezone')
        .sort({ scheduledTime: -1 })
        .limit(10);

      const prompt = `
Analyze the following meeting data and suggest optimal scheduling strategies:

Scholar Profile:
- Name: ${scholar.name}
- Expertise: ${scholar.scholarProfile?.specialization || 'General Islamic Studies'}
- Recent Activity: ${recentMeetings.length} meetings in the last period

Student Preferences:
- Preferred Times: ${studentPreferences.preferredTimes || 'Not specified'}
- Timezone: ${studentPreferences.timezone || 'UTC'}
- Learning Style: ${studentPreferences.learningStyle || 'Not specified'}

Recent Meeting Patterns:
${recentMeetings.map(m => ({
  time: m.scheduledTime,
  duration: m.duration,
  topic: m.topic,
  student: m.studentId.name
})).slice(0, 5)}

Please provide:
1. Optimal meeting times considering Islamic prayer times
2. Recommended meeting durations for different topics
3. Best days of the week for Islamic education
4. Suggestions for improving student engagement
5. Cultural considerations for scheduling

Format your response as actionable recommendations.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error optimizing meeting times:', error);
      return 'Unable to analyze meeting patterns at this time.';
    }
  }

  // Intelligent meeting topic suggestions
  async suggestMeetingTopics(scholarId, studentId, context = {}) {
    try {
      const scholar = await Scholar.findOne({ user: scholarId });
      const student = await User.findById(studentId);
      
      const recentChats = await Chat.find({ studentId, scholarId })
        .populate('messages')
        .sort({ lastActivity: -1 })
        .limit(5);

      const prompt = `
Based on the following context, suggest relevant Islamic education topics for an upcoming meeting:

Scholar Specialization: ${scholar?.specialization || 'General Islamic Studies'}
Scholar Bio: ${scholar?.bio || 'Experienced Islamic scholar'}
Student: ${student.name}
Recent Discussion Topics: ${recentChats.map(c => c.messages.slice(-3).map(m => m.text).join(', ')).join('; ')}

Context:
- Meeting Duration: ${context.duration || 60} minutes
- Student Level: ${context.studentLevel || 'Intermediate'}
- Special Interests: ${context.interests || 'Not specified'}
- Recent Questions: ${context.recentQuestions || 'None'}

Please suggest:
1. 3-5 specific topics that would be most beneficial
2. Learning objectives for each topic
3. Recommended teaching approach
4. Follow-up activities or resources
5. How to connect with student's current knowledge level

Focus on practical Islamic education that builds on previous discussions.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error suggesting topics:', error);
      return 'Unable to suggest topics at this time.';
    }
  }

  // Smart conflict resolution
  async resolveSchedulingConflict(conflictData) {
    try {
      const { scholarId, studentId, proposedTime, conflictReason, alternativeTimes } = conflictData;
      
      const scholar = await User.findById(scholarId);
      const student = await User.findById(studentId);

      const prompt = `
Help resolve a scheduling conflict with Islamic wisdom and practical solutions:

Conflict Details:
- Scholar: ${scholar.name}
- Student: ${student.name}
- Proposed Time: ${proposedTime}
- Conflict Reason: ${conflictReason}
- Alternative Times: ${alternativeTimes?.join(', ') || 'None provided'}

Please provide:
1. Islamic perspective on resolving conflicts with patience and wisdom
2. Practical solutions for rescheduling
3. Alternative meeting formats (shorter sessions, different days)
4. Communication approach that maintains good relationships
5. Long-term scheduling strategies to prevent future conflicts

Focus on solutions that honor both parties' time and commitments while maintaining Islamic values.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error resolving conflict:', error);
      return 'Unable to provide conflict resolution at this time.';
    }
  }

  // Meeting effectiveness analysis
  async analyzeMeetingEffectiveness(scholarId, timeRange = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);

      const meetings = await Meeting.find({
        scholarId,
        scheduledTime: { $gte: startDate },
        status: { $in: ['completed', 'link_sent'] }
      })
      .populate('studentId', 'name')
      .populate('chatId');

      const prompt = `
Analyze the effectiveness of recent meetings and provide insights:

Meeting Data (Last ${timeRange} days):
${meetings.map(m => ({
  date: m.scheduledTime,
  duration: m.duration,
  topic: m.topic,
  student: m.studentId.name,
  status: m.status
})).slice(0, 10)}

Please analyze and provide:
1. Meeting completion rates and patterns
2. Optimal meeting times based on attendance
3. Student engagement indicators
4. Scholar performance insights
5. Recommendations for improvement
6. Scheduling optimization suggestions
7. Student satisfaction indicators

Focus on actionable insights that can improve the educational experience.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error analyzing effectiveness:', error);
      return 'Unable to analyze meeting effectiveness at this time.';
    }
  }

  // Smart reminder system
  async generateSmartReminders(meetingId) {
    try {
      const meeting = await Meeting.findById(meetingId)
        .populate('scholarId', 'name email')
        .populate('studentId', 'name email timezone');

      if (!meeting) return null;

      const prompt = `
Generate personalized meeting reminders for an Islamic education session:

Meeting Details:
- Scholar: ${meeting.scholarId.name}
- Student: ${meeting.studentId.name}
- Topic: ${meeting.topic}
- Scheduled Time: ${meeting.scheduledTime}
- Duration: ${meeting.duration} minutes
- Student Timezone: ${meeting.studentId.timezone || 'UTC'}

Create reminders that:
1. Include Islamic greetings and blessings
2. Mention the educational value of the session
3. Provide practical preparation tips
4. Include relevant Islamic teachings
5. Are culturally appropriate and respectful
6. Encourage punctuality with Islamic wisdom

Generate separate reminders for:
- 24 hours before
- 2 hours before
- 15 minutes before

Each reminder should be warm, encouraging, and spiritually uplifting.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating reminders:', error);
      return null;
    }
  }

  // Intelligent meeting templates
  async generateMeetingTemplates(scholarId) {
    try {
      const scholar = await Scholar.findOne({ user: scholarId });
      const recentMeetings = await Meeting.find({ scholarId })
        .populate('studentId', 'name')
        .sort({ scheduledTime: -1 })
        .limit(20);

      const prompt = `
Based on the scholar's expertise and recent meeting patterns, create reusable meeting templates:

Scholar Profile:
- Specialization: ${scholar?.specialization || 'General Islamic Studies'}
- Bio: ${scholar?.bio || 'Experienced Islamic scholar'}
- Recent Topics: ${recentMeetings.map(m => m.topic).slice(0, 10).join(', ')}

Create templates for:
1. **Beginner Islamic Studies** (30-45 min)
2. **Quran Recitation & Tajweed** (45-60 min)
3. **Hadith Study & Analysis** (60-90 min)
4. **Fiqh & Jurisprudence** (60-90 min)
5. **Spiritual Guidance & Counseling** (45-60 min)

Each template should include:
- Learning objectives
- Suggested structure
- Key discussion points
- Recommended resources
- Assessment methods
- Follow-up activities

Make templates practical and aligned with Islamic educational principles.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating templates:', error);
      return 'Unable to generate meeting templates at this time.';
    }
  }

  // Prayer time integration
  async getPrayerTimeAwareSchedule(scholarId, dateRange = 7) {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + dateRange);

      // This would integrate with a prayer times API
      const prayerTimes = await this.getPrayerTimesForDateRange(startDate, endDate);

      const prompt = `
Create a prayer-time-aware meeting schedule for an Islamic scholar:

Date Range: ${startDate.toDateString()} to ${endDate.toDateString()}
Prayer Times: ${JSON.stringify(prayerTimes, null, 2)}

Please suggest:
1. Optimal meeting times that don't conflict with prayer times
2. Best times for different types of Islamic education
3. Buffer times around prayer times
4. Weekend and weekday scheduling considerations
5. Special considerations for Ramadan or Islamic holidays

Focus on creating a schedule that respects Islamic practices while maximizing educational opportunities.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error creating prayer-aware schedule:', error);
      return 'Unable to create prayer-aware schedule at this time.';
    }
  }

  // Helper method for prayer times (placeholder)
  async getPrayerTimesForDateRange(startDate, endDate) {
    // This would integrate with a prayer times API
    // For now, return realistic prayer times based on date
    const date = new Date(startDate);
    const month = date.getMonth();
    const day = date.getDate();
    
    // Calculate approximate prayer times based on season
    const isWinter = month >= 10 || month <= 2;
    const isSummer = month >= 5 && month <= 8;
    
    return {
      fajr: isWinter ? '05:30' : isSummer ? '04:00' : '05:00',
      dhuhr: '12:15',
      asr: isWinter ? '15:30' : isSummer ? '16:30' : '15:45',
      maghrib: isWinter ? '17:30' : isSummer ? '19:30' : '18:20',
      isha: isWinter ? '19:00' : isSummer ? '21:00' : '19:45'
    };
  }

  // Send intelligent notifications
  async sendIntelligentNotification(meetingId, notificationType) {
    try {
      const meeting = await Meeting.findById(meetingId)
        .populate('scholarId', 'name email')
        .populate('studentId', 'name email');

      if (!meeting) return;

      const reminders = await this.generateSmartReminders(meetingId);
      if (!reminders) return;

      // Parse reminders and send appropriate ones
      const reminderSections = reminders.split('\n\n');
      
      for (const section of reminderSections) {
        if (section.includes('24 hours before') && notificationType === '24h') {
          await this.sendNotification(meeting, section, '24h');
        } else if (section.includes('2 hours before') && notificationType === '2h') {
          await this.sendNotification(meeting, section, '2h');
        } else if (section.includes('15 minutes before') && notificationType === '15m') {
          await this.sendNotification(meeting, section, '15m');
        }
      }
    } catch (error) {
      console.error('Error sending intelligent notification:', error);
    }
  }

  async sendNotification(meeting, message, type) {
    try {
      // Send to both scholar and student
      const recipients = [meeting.scholarId.email, meeting.studentId.email];
      
      for (const email of recipients) {
        if (email) {
          await notifyAdmin({
            senderName: 'Hikmah AI Assistant',
            senderRole: 'system',
            messageType: `Meeting Reminder (${type})`,
            messagePreview: message.slice(0, 100) + '...',
            sessionId: undefined,
            chatId: String(meeting.chatId),
            timestamp: Date.now(),
            toEmail: email,
            force: true
          });
        }
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}

module.exports = new IntelligentMeetingAgent();
