# AI Smart Scheduler - Technical Implementation Guide

## 🏗️ Architecture Overview

The AI Smart Scheduler is built on a modern, scalable architecture that integrates AI capabilities with real-time scheduling functionality.

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Services   │    │   Real-time     │    │   Analytics     │
│   (Gemini API)  │    │   (Socket.IO)   │    │   (MongoDB)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Backend Implementation

### 1. Core Services

#### AI Agent Controller (`backend/controllers/aiAgentController.js`)
```javascript
class AIAgentController {
  // Process natural language scheduling requests
  async processNaturalLanguageRequest(req, res) {
    const { message, scholarId, context } = req.body;
    
    try {
      // Parse natural language request
      const intent = await this.parseIntent(message);
      const entities = await this.extractEntities(message);
      
      // Generate optimal times based on context
      const optimalTimes = await this.generateOptimalTimes(scholarId, intent, entities);
      
      // Resolve any conflicts
      const resolvedTimes = await this.resolveConflicts(optimalTimes, scholarId);
      
      res.json({
        success: true,
        optimalTimes: resolvedTimes,
        confidence: this.calculateConfidence(intent, entities),
        alternatives: await this.generateAlternatives(resolvedTimes)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Generate AI insights for scholars
  async getBookingInsights(req, res) {
    const { scholarId } = req.params;
    
    try {
      const meetings = await Meeting.find({ scholarId });
      const broadcasts = await BroadcastMeeting.find({ scholarId });
      
      const insights = await this.calculateBookingInsights(meetings, broadcasts);
      
      res.json({ insights });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

#### Smart Scheduler Service (`backend/utils/smartScheduler.js`)
```javascript
class SmartSchedulerService {
  // Find optimal meeting times
  async findOptimalMeetingTimes(scholarId, preferences) {
    try {
      // Get scholar's availability
      const availability = await this.getScholarAvailability(scholarId);
      
      // Get existing meetings
      const existingMeetings = await this.getExistingMeetings(scholarId);
      
      // Calculate optimal times
      const optimalTimes = this.calculateOptimalTimes(availability, existingMeetings, preferences);
      
      // Apply AI recommendations
      const aiRecommendations = await this.getAIRecommendations(scholarId, optimalTimes);
      
      return this.mergeRecommendations(optimalTimes, aiRecommendations);
    } catch (error) {
      throw new Error(`Failed to find optimal times: ${error.message}`);
    }
  }

  // Broadcast meeting times to students
  async broadcastMeetingTimes(scholarId, broadcastData) {
    try {
      // Create broadcast meeting
      const broadcast = await BroadcastMeeting.create({
        scholarId,
        ...broadcastData,
        status: 'active'
      });

      // Get enrolled students
      const enrolledStudents = await this.getEnrolledStudents(scholarId);
      
      // Send notifications to students
      for (const student of enrolledStudents) {
        await this.sendBroadcastNotification(student, broadcast);
      }

      return broadcast;
    } catch (error) {
      throw new Error(`Failed to broadcast meeting times: ${error.message}`);
    }
  }
}
```

### 2. Database Models

#### BroadcastMeeting Model
```javascript
const broadcastMeetingSchema = new mongoose.Schema({
  scholarId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  meetingTimes: [{
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    maxParticipants: {
      type: Number,
      default: 1
    },
    isBooked: {
      type: Boolean,
      default: false
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    bookedAt: Date
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
broadcastMeetingSchema.index({ scholarId: 1, status: 1 });
broadcastMeetingSchema.index({ 'meetingTimes.start': 1 });
broadcastMeetingSchema.index({ createdAt: -1 });
```

#### Enhanced Meeting Model
```javascript
const meetingSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scholarId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['requested', 'scheduled', 'link_sent', 'completed', 'cancelled'],
    default: 'requested'
  },
  link: {
    type: String,
    trim: true
  },
  rescheduleRequests: [{
    requestedTime: Date,
    reason: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatSession'
  }
}, {
  timestamps: true
});

// Indexes for performance
meetingSchema.index({ studentId: 1, status: 1 });
meetingSchema.index({ scholarId: 1, status: 1 });
meetingSchema.index({ scheduledTime: 1 });
meetingSchema.index({ createdAt: -1 });
```

### 3. API Routes

#### Smart Scheduler Routes (`backend/routes/smartSchedulerRoutes.js`)
```javascript
const express = require('express');
const router = express.Router();
const smartSchedulerController = require('../controllers/smartSchedulerController');
const auth = require('../middleware/auth');

// Get scholar broadcasts
router.get('/scholar-broadcasts', auth, smartSchedulerController.getScholarBroadcasts);

// Create broadcast
router.post('/broadcast', auth, smartSchedulerController.createBroadcast);

// Book broadcast meeting
router.post('/book', auth, smartSchedulerController.bookBroadcastMeeting);

// Get available broadcasts
router.get('/available', auth, smartSchedulerController.getAvailableBroadcasts);

// Validate meeting access
router.post('/validate-access', auth, smartSchedulerController.validateMeetingAccess);

module.exports = router;
```

#### AI Agent Routes (`backend/routes/aiAgentRoutes.js`)
```javascript
const express = require('express');
const router = express.Router();
const aiAgentController = require('../controllers/aiAgentController');
const auth = require('../middleware/auth');

// Process natural language request
router.post('/process-request', auth, aiAgentController.processNaturalLanguageRequest);

// Get booking insights
router.get('/insights/:scholarId', auth, aiAgentController.getBookingInsights);

// Resolve conflicts
router.post('/resolve-conflicts', auth, aiAgentController.resolveConflicts);

// Get personalized recommendations
router.get('/recommendations/:scholarId', auth, aiAgentController.getPersonalizedRecommendations);

module.exports = router;
```

## 🎨 Frontend Implementation

### 1. Smart Scheduler Component

#### Main Scheduler Interface (`client/src/components/scholar/SmartScheduler.tsx`)
```typescript
interface SmartSchedulerProps {
  scholarId: string;
  onSchedule?: (meeting: MeetingData) => void;
}

const SmartScheduler: React.FC<SmartSchedulerProps> = ({ scholarId, onSchedule }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [availableTimes, setAvailableTimes] = useState<TimeSlot[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Load available times based on template
  useEffect(() => {
    if (selectedTemplate) {
      loadTemplateTimes(selectedTemplate);
    } else {
      loadAllDayTimes();
    }
  }, [selectedTemplate]);

  const loadTemplateTimes = async (template: string) => {
    try {
      setLoading(true);
      const times = await smartSchedulerService.getTemplateTimes(template);
      setAvailableTimes(times);
    } catch (error) {
      console.error('Error loading template times:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSelection = (time: TimeSlot) => {
    if (selectedTimes.some(t => t.id === time.id)) {
      setSelectedTimes(selectedTimes.filter(t => t.id !== time.id));
    } else {
      setSelectedTimes([...selectedTimes, time]);
    }
  };

  const handleSchedule = async () => {
    try {
      setLoading(true);
      const meetingData = {
        title: getTemplateTitle(selectedTemplate),
        description: getTemplateDescription(selectedTemplate),
        meetingTimes: selectedTimes,
        scholarId
      };

      const result = await smartSchedulerService.createBroadcast(meetingData);
      onSchedule?.(result);
      
      // Reset form
      setSelectedTemplate('');
      setSelectedTimes([]);
      setAvailableTimes([]);
    } catch (error) {
      console.error('Error scheduling meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="smart-scheduler">
      <div className="template-selection">
        <h3>Select Template</h3>
        <div className="template-grid">
          {TEMPLATES.map(template => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
            >
              <h4>{template.name}</h4>
              <p>{template.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="time-selection">
        <h3>Available Times</h3>
        <div className="time-grid">
          {availableTimes.map(time => (
            <button
              key={time.id}
              onClick={() => handleTimeSelection(time)}
              className={`time-slot ${selectedTimes.some(t => t.id === time.id) ? 'selected' : ''}`}
            >
              {formatTime(time.start)}
            </button>
          ))}
        </div>
      </div>

      <div className="actions">
        <button
          onClick={handleSchedule}
          disabled={selectedTimes.length === 0 || loading}
          className="schedule-button"
        >
          {loading ? 'Scheduling...' : `Schedule ${selectedTimes.length} Meeting(s)`}
        </button>
      </div>
    </div>
  );
};
```

### 2. AI Analytics Component

#### Analytics Dashboard (`client/src/components/scholar/AIAnalytics.tsx`)
```typescript
interface AIAnalyticsProps {
  scholarId: string;
}

const AIAnalytics: React.FC<AIAnalyticsProps> = ({ scholarId }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [scholarId]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Load real analytics data
      const [broadcastsResponse, insightsResponse, dashboardResponse] = await Promise.all([
        smartSchedulerService.getScholarBroadcasts(),
        aiAgentService.getBookingInsights(scholarId),
        meetingService.getScholarDashboard()
      ]);
      
      // Calculate real analytics
      const analytics = calculateAnalytics(broadcastsResponse.broadcasts);
      setAnalyticsData(analytics);
      setAiInsights(insightsResponse);
      
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (broadcasts: any[]): AnalyticsData => {
    const totalMeetings = broadcasts.reduce((sum, broadcast) => 
      sum + broadcast.meetingTimes.length, 0);
    const completedMeetings = broadcasts.reduce((sum, broadcast) => 
      sum + broadcast.meetingTimes.filter((time: any) => time.isBooked).length, 0);
    
    return {
      totalMeetings,
      completedMeetings,
      bookingRate: totalMeetings > 0 ? completedMeetings / totalMeetings : 0,
      averageDuration: 60, // Calculate from actual data
      mostPopularTimes: [], // Calculate from actual data
      trends: { weekly: [], monthly: [] }
    };
  };

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  return (
    <div className="ai-analytics">
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Meetings</h3>
          <p className="metric-value">{analyticsData?.totalMeetings || 0}</p>
        </div>
        <div className="metric-card">
          <h3>Booking Rate</h3>
          <p className="metric-value">{Math.round((analyticsData?.bookingRate || 0) * 100)}%</p>
        </div>
      </div>

      <div className="insights-section">
        <h3>AI Insights</h3>
        {aiInsights?.insights.map((insight, index) => (
          <div key={index} className="insight-item">
            <p>{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 3. Service Layer

#### Smart Scheduler Service (`client/src/services/smartSchedulerService.ts`)
```typescript
class SmartSchedulerService {
  private baseUrl = '/api/smart-scheduler';

  async getScholarBroadcasts(): Promise<{ broadcasts: BroadcastMeeting[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/scholar-broadcasts`, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching scholar broadcasts:', error);
      throw error;
    }
  }

  async createBroadcast(broadcastData: CreateBroadcastData): Promise<BroadcastMeeting> {
    try {
      const response = await fetch(`${this.baseUrl}/broadcast`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(broadcastData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating broadcast:', error);
      throw error;
    }
  }

  async bookBroadcastMeeting(bookingData: BookingData): Promise<BookingResult> {
    try {
      const response = await fetch(`${this.baseUrl}/book`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error booking meeting:', error);
      throw error;
    }
  }

  private getToken(): string {
    return localStorage.getItem('token') || '';
  }
}

export default new SmartSchedulerService();
```

## 🔄 Real-time Updates

### WebSocket Integration

#### Backend WebSocket Handler
```javascript
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join scholar room
  socket.on('join-scholar', (scholarId) => {
    socket.join(`scholar-${scholarId}`);
  });

  // Join student room
  socket.on('join-student', (studentId) => {
    socket.join(`student-${studentId}`);
  });

  // Handle meeting updates
  socket.on('meeting-update', (data) => {
    // Broadcast to relevant users
    io.to(`scholar-${data.scholarId}`).emit('meeting-updated', data);
    io.to(`student-${data.studentId}`).emit('meeting-updated', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});
```

#### Frontend WebSocket Client
```typescript
class WebSocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    this.socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: { token }
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    this.socket.on('meeting-updated', (data) => {
      // Handle meeting updates
      this.handleMeetingUpdate(data);
    });
  }

  joinScholarRoom(scholarId: string) {
    this.socket?.emit('join-scholar', scholarId);
  }

  joinStudentRoom(studentId: string) {
    this.socket?.emit('join-student', studentId);
  }

  private handleMeetingUpdate(data: any) {
    // Update UI based on meeting updates
    console.log('Meeting updated:', data);
  }
}
```

## 🧪 Testing

### Unit Tests

#### Backend Tests
```javascript
describe('Smart Scheduler Service', () => {
  test('should find optimal meeting times', async () => {
    const scholarId = 'scholar123';
    const preferences = {
      duration: 60,
      timeRange: { start: '09:00', end: '17:00' }
    };

    const result = await smartSchedulerService.findOptimalMeetingTimes(scholarId, preferences);
    
    expect(result).toBeDefined();
    expect(result.times).toBeInstanceOf(Array);
    expect(result.times.length).toBeGreaterThan(0);
  });

  test('should handle scheduling conflicts', async () => {
    const conflicts = [
      { time: '2024-01-15T10:00:00Z', conflict: 'Existing meeting' }
    ];

    const alternatives = await aiAgentService.resolveConflicts(conflicts);
    
    expect(alternatives).toBeDefined();
    expect(alternatives.alternatives).toBeInstanceOf(Array);
  });
});
```

#### Frontend Tests
```typescript
describe('Smart Scheduler Component', () => {
  test('should render template selection', () => {
    render(<SmartScheduler scholarId="scholar123" />);
    
    expect(screen.getByText('Select Template')).toBeInTheDocument();
    expect(screen.getByText('Morning Session')).toBeInTheDocument();
  });

  test('should handle time selection', () => {
    const onSchedule = jest.fn();
    render(<SmartScheduler scholarId="scholar123" onSchedule={onSchedule} />);
    
    const timeSlot = screen.getByText('10:00 AM');
    fireEvent.click(timeSlot);
    
    expect(timeSlot).toHaveClass('selected');
  });
});
```

## 🚀 Deployment

### Environment Configuration

#### Production Environment Variables
```bash
# Database (replace with your actual MongoDB connection string)
MONGO_URI=your_mongodb_connection_string_here

# Authentication
JWT_SECRET=your_secure_jwt_secret_key_here
JWT_EXPIRES=7d

# AI Services
GEMINI_API_KEY=your_gemini_api_key_here
HADITH_API_KEY=your_hadith_api_key_here

# Email
GMAIL_USER=your_gmail_address_here
GMAIL_PASS=your_gmail_app_password_here

# AI Scheduler
DEFAULT_TIMEZONE=UTC
PRAYER_TIMES_API_KEY=your_prayer_times_api_key_here

# Security
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Docker Configuration

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY client/package*.json ./client/

# Install dependencies
RUN cd backend && npm ci --only=production
RUN cd client && npm ci --only=production

# Copy source code
COPY backend/ ./backend/
COPY client/ ./client/

# Build client
RUN cd client && npm run build

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "backend/index.js"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongo:27017/database_name
    depends_on:
      - mongo
    volumes:
      - ./uploads:/app/uploads

  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## 📊 Monitoring & Analytics

### Performance Monitoring

#### Application Metrics
```javascript
const prometheus = require('prom-client');

// Create metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
});

const activeConnections = new prometheus.Gauge({
  name: 'websocket_active_connections',
  help: 'Number of active WebSocket connections'
});

// Middleware to collect metrics
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  
  next();
});
```

#### Health Checks
```javascript
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await mongoose.connection.db.admin().ping();
    
    // Check external services
    const geminiStatus = await checkGeminiAPI();
    const hadithStatus = await checkHadithAPI();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        gemini: geminiStatus ? 'healthy' : 'unhealthy',
        hadith: hadithStatus ? 'healthy' : 'unhealthy'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

## 🔒 Security Implementation

### Authentication & Authorization

#### JWT Middleware
```javascript
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

#### Input Validation
```javascript
const { body, validationResult } = require('express-validator');

const validateBroadcast = [
  body('title').trim().isLength({ min: 1, max: 100 }).escape(),
  body('description').trim().isLength({ max: 500 }).escape(),
  body('meetingTimes').isArray({ min: 1 }),
  body('meetingTimes.*.start').isISO8601(),
  body('meetingTimes.*.end').isISO8601(),
  body('meetingTimes.*.duration').isInt({ min: 15, max: 480 }),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

## 📈 Performance Optimization

### Database Optimization

#### Indexing Strategy
```javascript
// Compound indexes for common queries
db.broadcastmeetings.createIndex({ scholarId: 1, status: 1, createdAt: -1 });
db.meetings.createIndex({ studentId: 1, status: 1, scheduledTime: 1 });
db.meetings.createIndex({ scholarId: 1, status: 1, scheduledTime: 1 });

// Text indexes for search
db.broadcastmeetings.createIndex({ 
  title: 'text', 
  description: 'text' 
});
```

#### Query Optimization
```javascript
// Use aggregation for complex analytics
const analytics = await BroadcastMeeting.aggregate([
  { $match: { scholarId: ObjectId(scholarId) } },
  { $unwind: '$meetingTimes' },
  { $group: {
    _id: null,
    totalSlots: { $sum: 1 },
    bookedSlots: { $sum: { $cond: ['$meetingTimes.isBooked', 1, 0] } },
    avgDuration: { $avg: '$meetingTimes.duration' }
  }}
]);
```

### Caching Strategy

#### Redis Caching
```javascript
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

const cacheMiddleware = (duration) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    
    try {
      const cached = await client.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = function(data) {
        client.setex(key, duration, JSON.stringify(data));
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      next();
    }
  };
};
```

This technical implementation guide provides a comprehensive overview of how the AI Smart Scheduler is built and deployed, covering all aspects from backend architecture to frontend implementation, testing, and deployment strategies.
