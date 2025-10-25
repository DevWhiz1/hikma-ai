# AI Smart Scheduler Documentation

## Overview

The AI Smart Scheduler is an advanced scheduling system integrated into the Hikmah AI platform that provides intelligent meeting scheduling capabilities for scholars and students. This system leverages AI technology to optimize scheduling, resolve conflicts, and provide personalized recommendations.

## Features

### 🎯 Core Features

#### 1. Smart Meeting Scheduler
- **AI-Powered Scheduling**: Natural language processing for scheduling requests
- **Template System**: Pre-configured scheduling templates (Morning, Afternoon, Evening, Q&A)
- **Timezone Support**: Automatic timezone detection and conversion
- **Bulk Selection**: Select multiple time slots for efficient scheduling
- **Conflict Detection**: Intelligent conflict resolution with alternative suggestions

#### 2. Broadcast Management
- **Meeting Broadcasts**: Create and manage meeting broadcasts for students
- **Time Slot Management**: Define available time slots with duration and capacity
- **Student Booking**: Students can book from available broadcast slots
- **Real-time Updates**: Live updates when slots are booked or cancelled

#### 3. AI Analytics
- **Performance Metrics**: Track scheduling success rates and student engagement
- **Predictive Analytics**: AI-powered insights for optimal scheduling times
- **Student Behavior Analysis**: Understand student preferences and patterns
- **Revenue Tracking**: Monitor earnings and growth metrics

#### 4. Intelligent Conflict Resolution
- **Smart Alternatives**: AI suggests alternative times when conflicts occur
- **Priority Management**: Automatically prioritize based on student preferences
- **Reschedule Assistance**: Intelligent rescheduling recommendations
- **Conflict Prevention**: Proactive conflict detection and prevention

#### 5. Personalization Engine
- **Student Profiling**: Create detailed student profiles based on behavior
- **Learning Style Detection**: Identify visual, auditory, kinesthetic, or reading preferences
- **Engagement Tracking**: Monitor student engagement levels and attendance
- **Personalized Recommendations**: Tailored scheduling suggestions for each student

### 🤖 AI Agent Features

#### 1. Natural Language Processing
- **Voice Commands**: Schedule meetings using natural language
- **Intent Recognition**: Understand complex scheduling requests
- **Context Awareness**: Maintain conversation context across interactions
- **Multi-language Support**: Support for multiple languages

#### 2. Predictive Analytics
- **Optimal Time Suggestions**: AI recommends best times based on historical data
- **Student Preference Learning**: Learn from student booking patterns
- **Seasonal Adjustments**: Adapt to seasonal scheduling patterns
- **Demand Forecasting**: Predict high-demand periods

#### 3. Smart Notifications
- **Intelligent Reminders**: Context-aware reminder system
- **Channel Optimization**: Choose best notification channels (email, SMS, push)
- **Timing Intelligence**: Send reminders at optimal times
- **Personalization**: Customize notifications based on student preferences

## Technical Architecture

### Backend Components

#### 1. AI Agent Controller (`backend/controllers/aiAgentController.js`)
```javascript
// Core AI agent functionality
- processNaturalLanguageRequest()
- generateOptimalTimes()
- resolveConflicts()
- calculateBookingInsights()
- sendIntelligentNotification()
```

#### 2. Smart Scheduler Service (`backend/utils/smartScheduler.js`)
```javascript
// Scheduling logic and utilities
- findOptimalMeetingTimes()
- broadcastMeetingTimes()
- bookBroadcastMeeting()
- getAvailableBroadcasts()
- validateMeetingAccess()
```

#### 3. Enhanced Meeting Controller (`backend/controllers/enhancedMeetingController.js`)
```javascript
// Advanced meeting management
- getScholarDashboard()
- getUserScheduledMeetings()
- getMeetingAnalytics()
- processRecurringMeetings()
```

### Frontend Components

#### 1. Smart Scheduler (`client/src/components/scholar/SmartScheduler.tsx`)
- Template-based scheduling interface
- Timezone-aware time selection
- Bulk selection capabilities
- Real-time conflict detection

#### 2. AI Analytics (`client/src/components/scholar/AIAnalytics.tsx`)
- Performance metrics visualization
- Predictive insights display
- Student behavior analysis
- Revenue tracking charts

#### 3. Personalization Engine (`client/src/components/scholar/PersonalizationEngine.tsx`)
- Student profile management
- Learning style analysis
- Engagement tracking
- Personalized recommendations

#### 4. Conflict Resolver (`client/src/components/scholar/IntelligentConflictResolver.tsx`)
- Conflict detection interface
- Alternative time suggestions
- Priority management
- Reschedule assistance

## API Endpoints

### Smart Scheduler Endpoints

#### GET `/api/smart-scheduler/scholar-broadcasts`
Get all broadcasts for a scholar
```json
{
  "broadcasts": [
    {
      "_id": "broadcast_id",
      "title": "Weekly Islamic Studies",
      "description": "Regular study session",
      "meetingTimes": [...],
      "status": "active"
    }
  ]
}
```

#### POST `/api/smart-scheduler/broadcast`
Create a new broadcast
```json
{
  "title": "Quran Study Session",
  "description": "Weekly Quran recitation and study",
  "meetingTimes": [
    {
      "start": "2024-01-15T10:00:00Z",
      "end": "2024-01-15T11:00:00Z",
      "duration": 60,
      "maxParticipants": 10
    }
  ]
}
```

#### POST `/api/smart-scheduler/book`
Book a broadcast meeting
```json
{
  "broadcastId": "broadcast_id",
  "timeSlotId": "slot_id",
  "studentId": "student_id"
}
```

### AI Agent Endpoints

#### POST `/api/ai-agent/process-request`
Process natural language scheduling request
```json
{
  "message": "Schedule a meeting for tomorrow afternoon",
  "scholarId": "scholar_id",
  "context": {...}
}
```

#### GET `/api/ai-agent/insights/:scholarId`
Get AI insights for a scholar
```json
{
  "insights": {
    "mostPopularTimes": ["10:00", "14:00", "18:00"],
    "averageBookingRate": 0.75,
    "studentPreferences": {...},
    "predictions": {...}
  }
}
```

### Enhanced Meeting Endpoints

#### GET `/api/enhanced-meetings/scholar-dashboard`
Get comprehensive scholar dashboard data
```json
{
  "scheduled": [...],
  "linkSent": [...],
  "enrolledStudents": [...],
  "analytics": {...}
}
```

#### GET `/api/enhanced-meetings/user-scheduled`
Get user's scheduled meetings
```json
{
  "meetings": [
    {
      "_id": "meeting_id",
      "scheduledTime": "2024-01-15T10:00:00Z",
      "status": "scheduled",
      "scholar": {...}
    }
  ]
}
```

## Database Schema

### BroadcastMeeting Model
```javascript
{
  _id: ObjectId,
  scholarId: ObjectId,
  title: String,
  description: String,
  meetingTimes: [{
    start: Date,
    end: Date,
    duration: Number,
    maxParticipants: Number,
    isBooked: Boolean,
    bookedBy: ObjectId
  }],
  status: String, // 'active', 'inactive', 'completed'
  createdAt: Date,
  updatedAt: Date
}
```

### Meeting Model (Enhanced)
```javascript
{
  _id: ObjectId,
  studentId: ObjectId,
  scholarId: ObjectId,
  scheduledTime: Date,
  duration: Number,
  status: String, // 'requested', 'scheduled', 'link_sent', 'completed', 'cancelled'
  link: String,
  rescheduleRequests: [{
    requestedTime: Date,
    reason: String,
    status: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## Configuration

### Environment Variables
```bash
# AI Scheduler Configuration
DEFAULT_TIMEZONE=UTC
PRAYER_TIMES_API_KEY=your_prayer_times_api_key_here

# Google Services (Optional)
GOOGLE_SERVICE_EMAIL=your_service_email_here
GOOGLE_PRIVATE_KEY=your_private_key_here

# Notification Settings
NOTIFY_DEBOUNCE_MS=120000
```

### Template Configuration
```javascript
const SCHEDULING_TEMPLATES = {
  morning: {
    name: "Morning Session",
    times: ["09:00", "10:00", "11:00"],
    duration: 60,
    description: "Early morning Islamic studies"
  },
  afternoon: {
    name: "Afternoon Session", 
    times: ["14:00", "15:00", "16:00"],
    duration: 90,
    description: "Afternoon learning sessions"
  },
  evening: {
    name: "Evening Session",
    times: ["18:00", "19:00", "20:00"],
    duration: 60,
    description: "Evening Quran and Hadith study"
  },
  qanda: {
    name: "Q&A Session",
    times: ["12:00", "13:00", "17:00"],
    duration: 30,
    description: "Quick question and answer sessions"
  }
};
```

## Usage Examples

### 1. Creating a Broadcast
```javascript
// Scholar creates a broadcast
const broadcast = await smartSchedulerService.createBroadcast({
  title: "Weekly Tafseer Session",
  description: "In-depth Quranic interpretation",
  meetingTimes: [
    {
      start: "2024-01-15T10:00:00Z",
      end: "2024-01-15T11:30:00Z",
      duration: 90,
      maxParticipants: 15
    }
  ]
});
```

### 2. Student Booking
```javascript
// Student books a slot
const booking = await smartSchedulerService.bookBroadcastMeeting({
  broadcastId: "broadcast_123",
  timeSlotId: "slot_456",
  studentId: "student_789"
});
```

### 3. AI Insights
```javascript
// Get AI insights for scholar
const insights = await aiAgentService.getBookingInsights("scholar_123");
console.log(insights.mostPopularTimes); // ["10:00", "14:00", "18:00"]
console.log(insights.averageBookingRate); // 0.75
```

### 4. Conflict Resolution
```javascript
// Resolve scheduling conflicts
const alternatives = await aiAgentService.resolveConflicts([
  {
    time: "2024-01-15T10:00:00Z",
    conflict: "Existing meeting",
    priority: "high"
  }
]);
```

## Performance Optimization

### 1. Caching Strategy
- **Redis Cache**: Cache frequently accessed data
- **Session Storage**: Store user preferences locally
- **API Response Caching**: Cache API responses for better performance

### 2. Database Optimization
- **Indexing**: Proper database indexes for fast queries
- **Aggregation**: Use MongoDB aggregation for complex analytics
- **Pagination**: Implement pagination for large datasets

### 3. Real-time Updates
- **WebSocket**: Real-time notifications and updates
- **Event Streaming**: Stream scheduling events to connected clients
- **Optimistic Updates**: Update UI before server confirmation

## Security Considerations

### 1. Authentication & Authorization
- **JWT Tokens**: Secure API access with JWT tokens
- **Role-based Access**: Different permissions for scholars and students
- **Session Management**: Secure session handling

### 2. Data Protection
- **Input Validation**: Validate all user inputs
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Protection**: Sanitize user-generated content

### 3. Privacy
- **Data Encryption**: Encrypt sensitive data at rest
- **Access Logging**: Log all data access for audit
- **GDPR Compliance**: Ensure data protection compliance

## Monitoring & Analytics

### 1. Performance Metrics
- **Response Times**: Monitor API response times
- **Error Rates**: Track and alert on error rates
- **User Engagement**: Monitor user interaction patterns

### 2. Business Metrics
- **Booking Success Rate**: Track successful bookings
- **Student Satisfaction**: Monitor student feedback
- **Revenue Tracking**: Track earnings and growth

### 3. System Health
- **Database Performance**: Monitor database query performance
- **Memory Usage**: Track memory consumption
- **CPU Usage**: Monitor server resource usage

## Troubleshooting

### Common Issues

#### 1. Scheduling Conflicts
**Problem**: Multiple meetings scheduled at same time
**Solution**: Use conflict resolution system to suggest alternatives

#### 2. Timezone Issues
**Problem**: Meetings scheduled in wrong timezone
**Solution**: Implement automatic timezone detection and conversion

#### 3. Performance Issues
**Problem**: Slow response times
**Solution**: Implement caching and database optimization

### Debug Mode
```javascript
// Enable debug logging
const DEBUG_MODE = process.env.NODE_ENV === 'development';

if (DEBUG_MODE) {
  console.log('AI Scheduler Debug:', {
    request: req.body,
    response: result,
    timestamp: new Date()
  });
}
```

## Future Enhancements

### 1. Advanced AI Features
- **Machine Learning**: Implement ML models for better predictions
- **Voice Integration**: Add voice command support
- **Multi-language NLP**: Support for multiple languages

### 2. Integration Features
- **Calendar Sync**: Sync with Google Calendar, Outlook
- **Video Conferencing**: Direct integration with video platforms
- **Mobile App**: Native mobile application

### 3. Analytics & Reporting
- **Advanced Analytics**: More detailed analytics and reporting
- **Custom Dashboards**: Personalized dashboard creation
- **Export Features**: Export data and reports

## Contributing

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run development server: `npm run dev`

### Code Standards
- **ESLint**: Follow ESLint configuration
- **Prettier**: Use Prettier for code formatting
- **TypeScript**: Use TypeScript for type safety
- **Testing**: Write unit and integration tests

### Pull Request Process
1. Create feature branch
2. Implement changes
3. Write tests
4. Submit pull request
5. Code review
6. Merge to main

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- **Documentation**: Check this documentation
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions
- **Email**: Contact the development team

---

**Created with ❤️ by the Hikmah AI Team**

*Last updated: January 2024*
