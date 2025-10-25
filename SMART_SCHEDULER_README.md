# AI Smart Meeting Scheduler

## Overview

The AI Smart Meeting Scheduler is an advanced feature that helps scholars manage their meeting schedules intelligently and allows students to book meetings from available time slots. This system integrates with Google Calendar and provides automated scheduling capabilities.

## Features

### For Scholars

1. **Optimal Time Detection**
   - AI-powered analysis of Google Calendar availability
   - Automatic detection of free time slots
   - Timezone-aware scheduling
   - Business hours optimization (9 AM - 9 PM)
   - Weekend filtering

2. **Broadcast Meeting Times**
   - Set multiple available time slots
   - Broadcast to all enrolled students
   - Custom titles and descriptions
   - Automatic expiration (7 days default)
   - Real-time booking tracking

3. **Smart Scheduling**
   - Conflict detection with existing events
   - Duration-based time slot generation
   - Priority-based time slot ranking
   - Auto-scheduling for multiple students

4. **Broadcast Management**
   - View all created broadcasts
   - Track booking statistics
   - Cancel active broadcasts
   - Monitor student bookings

### For Students

1. **Available Meetings View**
   - See all broadcast meetings from enrolled scholars
   - Real-time availability status
   - One-click booking
   - Meeting details and descriptions

2. **Meeting Booking**
   - Book from available time slots
   - Automatic meeting creation
   - Email notifications
   - Chat integration

3. **Reschedule Requests**
   - Request time changes
   - Add notes to requests
   - Track request status

## API Endpoints

### Smart Scheduler Routes (`/api/smart-scheduler`)

#### Scholar Endpoints

- `GET /optimal-times` - Get optimal meeting times
- `POST /schedule-meeting` - Schedule a smart meeting
- `POST /broadcast-times` - Broadcast meeting times to students
- `GET /scholar/upcoming` - Get scholar's upcoming meetings
- `GET /availability` - Get scholar's availability
- `POST /auto-schedule` - Auto-schedule multiple meetings
- `GET /scholar/broadcasts` - Get scholar's broadcast meetings
- `POST /cancel-broadcast` - Cancel a broadcast

#### Student Endpoints

- `GET /student/upcoming` - Get student's upcoming meetings
- `POST /reschedule-request` - Request meeting reschedule
- `GET /available-broadcasts` - Get available broadcast meetings
- `POST /book-broadcast` - Book a meeting from broadcast

## Database Models

### BroadcastMeeting
```javascript
{
  scholarId: ObjectId,
  title: String,
  description: String,
  meetingTimes: [{
    start: Date,
    end: Date,
    duration: Number,
    maxParticipants: Number,
    isBooked: Boolean,
    bookedBy: ObjectId,
    bookedAt: Date
  }],
  status: String, // 'active', 'completed', 'cancelled'
  timezone: String,
  expiresAt: Date,
  createdAt: Date
}
```

### Enhanced Meeting Model
```javascript
{
  // ... existing fields
  duration: Number, // Duration in minutes
  topic: String, // Meeting topic
  googleEventId: String, // Google Calendar event ID
  isSmartScheduled: Boolean,
  broadcastId: String, // Reference to broadcast
  timezone: String
}
```

## Environment Variables

Add these to your `.env` file:

```env
# Google Calendar Integration (for availability checking only)
GOOGLE_SERVICE_EMAIL=your-service-account@domain.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_CONTENT_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=your_calendar_id_here

# Smart Scheduler Configuration
DEFAULT_TIMEZONE=UTC
PRAYER_TIMES_API_KEY=your_prayer_times_api_key_here

# Jitsi Meet Integration (uses existing system)
# No additional configuration needed - uses existing Jitsi setup
```

## Frontend Components

### Scholar Components

1. **SmartScheduler.tsx**
   - Main scheduling interface
   - Optimal time selection
   - Broadcast creation
   - Configuration options

2. **BroadcastManagement.tsx**
   - View all broadcasts
   - Track booking statistics
   - Cancel broadcasts
   - Monitor performance

### Student Components

1. **BroadcastMeetings.tsx**
   - View available meetings
   - Book time slots
   - Track booking status

## Usage Examples

### Scholar Creating a Broadcast

```typescript
// Get optimal times
const optimalTimes = await smartSchedulerService.getOptimalTimes(60, 14);

// Broadcast meeting times
const result = await smartSchedulerService.broadcastMeetingTimes({
  meetingTimes: [
    { start: '2024-01-15T10:00:00Z', end: '2024-01-15T11:00:00Z', duration: 60 },
    { start: '2024-01-15T14:00:00Z', end: '2024-01-15T15:00:00Z', duration: 60 }
  ],
  title: 'Weekly Islamic Guidance Sessions',
  description: 'One-on-one sessions for spiritual guidance'
});
```

### Student Booking a Meeting

```typescript
// Get available broadcasts
const broadcasts = await smartSchedulerService.getAvailableBroadcasts();

// Book a meeting
const result = await smartSchedulerService.bookBroadcastMeeting({
  broadcastId: 'broadcast_id',
  timeIndex: 0
});
```

## Integration with Existing System

### Chat Integration
- Meeting notifications appear in chat
- Automatic chat creation for new meetings
- Real-time updates via WebSocket

### Email Notifications
- Meeting scheduled notifications
- Booking confirmations
- Reschedule request alerts
- Broadcast announcements

### Google Calendar Integration
- Conflict detection
- Availability checking
- Integration with existing Jitsi Meet system

## Security Features

1. **Authentication Required**
   - All endpoints require JWT authentication
   - Role-based access control (scholar/student)

2. **Authorization Checks**
   - Scholars can only manage their own broadcasts
   - Students can only book from enrolled scholars
   - Meeting ownership validation

3. **Data Validation**
   - Time slot validation
   - Duration limits
   - Expiration date checks
   - Booking conflict prevention

## Performance Optimizations

1. **Efficient Queries**
   - Indexed database queries
   - Pagination for large datasets
   - Cached availability data

2. **Real-time Updates**
   - WebSocket notifications
   - Optimistic UI updates
   - Background refresh

3. **Scalability**
   - Batch operations
   - Async processing
   - Rate limiting

## Troubleshooting

### Common Issues

1. **Google Calendar Integration**
   - Verify service account credentials
   - Check calendar permissions
   - Ensure calendar ID is correct

2. **Booking Conflicts**
   - Check time slot availability
   - Verify broadcast status
   - Confirm student enrollment

3. **Email Notifications**
   - Verify SMTP configuration
   - Check email templates
   - Monitor notification logs

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=smart-scheduler:*
```

## Future Enhancements

1. **Advanced Scheduling**
   - Recurring meeting support
   - Time zone conversion
   - Prayer time integration
   - Holiday awareness

2. **Analytics Dashboard**
   - Booking statistics
   - Scholar performance metrics
   - Student engagement tracking

3. **Mobile Optimization**
   - Responsive design
   - Push notifications
   - Offline support

## Contributing

When adding new features:

1. Update the database models
2. Add API endpoints
3. Create frontend components
4. Update documentation
5. Add tests
6. Update environment variables

## License

This feature is part of the Hikmah AI project and follows the same MIT license.
