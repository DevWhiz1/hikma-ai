# Hikmah AI - Comprehensive Feature Documentation

## Table of Contents
1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Student Features](#student-features)
5. [Scholar Features](#scholar-features)
6. [Admin Features](#admin-features)
7. [Core Features](#core-features)
8. [Assignment & Quiz System](#assignment--quiz-system)
9. [Meeting & Scheduling System](#meeting--scheduling-system)
10. [Payment System](#payment-system)
11. [Notification System](#notification-system)
12. [Installation & Setup](#installation--setup)
13. [API Documentation](#api-documentation)
14. [Database Schema](#database-schema)
15. [Security](#security)
16. [Deployment](#deployment)

---

## Overview

**Hikmah AI** is a comprehensive Islamic educational platform that connects students with qualified Islamic scholars. The platform provides AI-powered guidance, structured learning through assignments and quizzes, meeting scheduling, payment processing, and a rich set of Islamic tools including Hadith search, prayer times, Qibla finder, and Tasbih counter.

### Key Highlights
- 🤖 **AI-Powered Chat**: Google Gemini integration for instant Islamic guidance
- 👨‍🏫 **Scholar Marketplace**: Browse, enroll, and learn from verified Islamic scholars
- 📚 **Assignment & Quiz System**: AI-generated and manually created assignments with comprehensive grading
- 📅 **Smart Scheduling**: AI-powered meeting scheduler with conflict resolution
- 💳 **Payment Processing**: Integrated Stripe payment system for sessions and subscriptions
- 🔔 **Real-time Notifications**: Socket.IO based notifications for all important events
- 📖 **Islamic Tools**: Hadith Explorer, Prayer Times, Qibla Finder, Tasbih Counter

---

## Tech Stack

### Frontend
- **React 18** with **TypeScript**
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Heroicons** / **Lucide Icons** - Icon library
- **React Markdown** - Markdown rendering for AI responses
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client

### Backend
- **Node.js** / **Express.js** - Server framework
- **MongoDB** / **Mongoose** - Database and ODM
- **JWT** - Authentication middleware
- **Socket.IO** - WebSocket server for real-time features
- **Google Generative AI (Gemini)** - AI chat and assignment generation
- **CrewAI** - AI agent orchestration for assignments
- **Python 3** - AI agents for assignment creation and grading
- **Nodemailer** - Email notifications (Gmail SMTP)
- **node-cron** - Scheduled tasks
- **Stripe** - Payment processing

### External Services
- **Hadith API** (hadithapi.com) - Hadith search
- **Prayer Times API** - Prayer time calculations
- **Geolocation API** - Qibla direction calculation
- **Stripe API** - Payment processing
- **Google Gemini API** - AI capabilities

---

## User Roles & Permissions

### 1. Student (Default Role)
- Access to all student features
- Browse and enroll with scholars
- Submit assignments and quizzes
- Book meetings with enrolled scholars
- Access payment tracking
- Use all Islamic tools

### 2. Scholar
- All student features plus:
- Create and manage assignments/quizzes
- Grade student submissions
- Manage meeting schedules
- View student analytics
- Manage profile and availability
- Access payment earnings

### 3. Admin
- Full platform access
- Manage users (block/unblock)
- Approve/reject scholar applications
- View system logs
- Manage payments
- Monitor platform activity
- Send messages to any user

---

## Student Features

### Dashboard (`/`)
- Quick access to all platform features
- Feature cards with descriptions
- Recent activity overview
- Quick navigation

### AI Scholar Chat (`/chat` or `/chat/ai`)
- **Persistent Chat Sessions**: Auto-saved conversations with unique titles
- **Context Awareness**: Maintains conversation history for better responses
- **Session Management**: Create, view, delete chat sessions
- **Markdown Support**: Formatted AI responses with proper styling
- **Quick Prompts**: Suggested questions to get started
- **Chat History**: Sidebar with all previous conversations

### Scholar Discovery & Enrollment (`/scholars`)
- **Scholar Listing**: Browse all approved scholars with:
  - Profile photos and bios
  - Specializations and languages
  - Ratings and reviews
  - Experience and qualifications
  - Demo videos
- **Scholar Profile View**: Detailed scholar information
- **Enrollment**: One-click enrollment with enrolled scholars
- **Search & Filter**: Find scholars by specialization, language, rating

### Direct Scholar Chat (`/chat/scholar`)
- **Real-time Messaging**: Socket.IO based chat with enrolled scholars
- **Chat History**: Persistent conversation history
- **Meeting Integration**: Request meetings directly from chat
- **File Sharing**: Support for text-based communication
- **Read Receipts**: Message status indicators

### Assignments & Quizzes

#### Available Assignments (`/assignments`)
- View all published assignments from enrolled scholars
- See due dates and status
- View submission status (submitted/graded)
- One-click access to start assignment
- Visual indicators for overdue assignments

#### Available Quizzes (`/quizzes`)
- View all available quizzes from enrolled scholars
- See quiz time windows (start/end times)
- View duration and submission status
- Bookmark quizzes for later
- Clear availability status (open/upcoming/closed)

#### Take Assignment/Quiz (`/assignments/:id/take`)
- **Question Display**: Single question or all questions view
- **Auto-scroll Navigation**: Automatic question detection while scrolling
- **Progress Tracking**: Visual progress bar showing answered questions
- **Quiz Timer**: Countdown timer for quizzes with auto-submission
- **Answer Types Supported**:
  - Multiple Choice Questions (MCQ)
  - True/False
  - Short Answer
  - Essay Questions
- **Answer Validation**: Prevents submission of incomplete assignments
- **Resubmission Prevention**: Cannot submit the same assignment twice
- **Due Date Warnings**: Visual alerts for overdue assignments

#### My Submissions (`/me/submissions`)
- View all submitted assignments and quizzes
- **Detailed Grade Breakdown**:
  - Per-question scores (0-10 scale)
  - Per-question feedback
  - Overall grade percentage
  - Overall feedback from scholar
- **Visual Score Indicators**: Color-coded grades (green/yellow/red)
- **Submission Status**: Submitted vs Graded status
- **Submission Dates**: When assignments were submitted
- **Expandable Details**: Click to view full submission and feedback

### Meeting Management

#### Available Meetings (`/available-meetings`)
- View all broadcast meetings from enrolled scholars
- See available time slots
- Book meetings with one click
- View meeting descriptions and details
- Real-time availability updates

#### Upcoming Classes (`/upcoming-classes`)
- View all scheduled meetings
- Meeting status tracking
- Access meeting links
- Cancel or reschedule meetings

### Payment Tracking (`/payments`)
- View payment history
- Track spending by scholar
- Payment status (pending/completed/failed)
- Transaction details
- Payment analytics and summaries
- Filter by date range and status

### Islamic Tools

#### Hadith Explorer (`/hadith`)
- **Book Selection**: Browse authentic Hadith collections
- **Intelligent Search**: 
  - NLP-powered query expansion
  - Synonym and concept mapping
  - Fuzzy book name matching
  - Stopword removal
  - Multi-strategy search
- **Search Results**: Detailed Hadith with chains of narration
- **Filtering**: Filter by book, authenticity level

#### Prayer Times (`/prayer-times`)
- Accurate prayer times based on location
- Current prayer status
- Next prayer countdown
- Location-based calculations
- Qibla direction indicator

#### Qibla Finder (`/qibla`)
- Real-time Qibla direction
- Compass-based interface
- Location-based calculation
- Visual direction indicator

#### Tasbih Counter (`/tasbih`)
- Digital Tasbih (Dhikr) counter
- Increment/decrement controls
- Reset functionality
- Track daily remembrance

### Notifications
- **Real-time Notifications**: Socket.IO based instant notifications
- **Notification Types**:
  - Assignment published
  - Quiz available
  - Grade received
  - Meeting scheduled
  - Message received
  - System updates
- **Notification Bell**: Top bar notification indicator
- **Mark as Read**: Individual and bulk mark as read
- **Browser Notifications**: Optional desktop notifications
- **Email Notifications**: Email alerts for important events

---

## Scholar Features

### Scholar Dashboard (`/scholars/dashboard`)
- **Overview Statistics**:
  - Total enrolled students
  - Active assignments
  - Pending submissions
  - Upcoming meetings
  - Total earnings
- **Quick Actions**: Quick access to key features
- **Recent Activity**: Latest submissions and meetings
- **Performance Metrics**: Student engagement analytics

### Scholar Application (`/scholars/apply`)
- Comprehensive application form with:
  - Personal information
  - Bio and teaching philosophy
  - Specializations and languages
  - Experience and qualifications
  - Demo video (YouTube link)
  - Photo upload
  - Availability
  - Pricing (hourly/monthly rates)
  - Certifications and achievements
- **Validation**: Backend validates all fields and YouTube URLs
- **Status Tracking**: Application status visible to applicant

### Profile Management (`/scholars/profile/edit`)
- Edit all profile information
- Update availability and rates
- Manage specializations
- Update certifications
- Change profile photo
- Update demo video

### Assignment & Quiz Management

#### Assignments Overview (`/scholar/assignments`)
- View all assignments (draft/published/closed)
- Filter by status
- Quick actions:
  - Edit assignment
  - View submissions
  - Publish assignment
  - Close assignment
  - Generate with AI
- Assignment statistics:
  - Total submissions
  - Graded vs pending
  - Average scores

#### Create Assignment (`/scholar/assignments/new`)
- **Creation Modes**:
  - **AI Generation**: Automated question creation with CrewAI
  - **Manual Creation**: Step-by-step question building
- **Student Selection**:
  - Select specific students (multiple selection)
  - Assign to all enrolled students
  -Fix: "Select All" option
- **Assignment Details**:
  - Title and description
  - Due date
  - Assignment type (assignment/quiz)
  - For quizzes: time window, duration
- **AI Configuration** (if using AI):
  - Number of questions
  - Difficulty level
  - Question mix (MCQ, True/False, Short Answer, Essay)
  - Custom mix ratios

#### Assignment Builder (`/scholar/assignments/:id/builder`)
- **Question Management**:
  - View all questions
  - Edit questions inline
  - Delete questions
  - Add new questions manually
- **Question Types**:
  - Multiple Choice (with 4 options)
  - True/False
  - Short Answer
  - Essay
- **AI Regeneration**: Regenerate questions with AI
- **Publishing**: Publish or close assignments
- **Preview**: View assignment as students will see it

#### Submission Management (`/scholar/assignments/:id/submissions`)
- **Submission List**: All student submissions with:
  - Student name and email
  - Submission date
  - Status (submitted/graded)
  - Current grade
- **Grading Interface**:
  - **Manual Grading**:
    - Per-question scoring (0-10)
    - Per-question feedback
    - Overall score (0-100)
    - Overall feedback
    - Auto-calculation from per-question scores
  - **Grade Override**: Update existing grades
- **Submission Details**:
  - Expandable view with full answers
  - Question-by-question breakdown
  - Previous grading history
- **Grading Workflow**:
  - Form disappears after grading
  - View details button for graded submissions
  - Detailed breakdown shown after grading

### Meeting & Scheduling

#### Smart Scheduler (`/scholar/smart-scheduler`)
- **Optimal Time Detection**: AI analyzes calendar for best meeting times
- **Template System**: Pre-configured scheduling templates:
  - Morning Session
  - Afternoon Session
  - Evening Session
  - Q&A Session
- **Timezone Support**: Automatic timezone detection and conversion
- **Bulk Selection**: Select multiple time slots at once
- **Conflict Detection**: Automatic conflict identification with alternatives

#### AI Smart Scheduler (`/scholar/ai-smart-scheduler`)
- **Natural Language Processing**: Schedule meetings using natural language
- **Intent Recognition**: Understand complex scheduling requests
- **Context Awareness**: Maintains conversation context
- **Multi-language Support**: Support for multiple languages

#### Broadcast Management (`/scholar/broadcast-management`)
- **Create Broadcasts**: Set multiple available time slots
- **Broadcast to Students**: Notify all enrolled students
- **Booking Tracking**: Monitor who booked which slots
- **Broadcast Statistics**: View booking rates and trends
- **Cancel Broadcasts**: End active broadcasts

#### Recurring Meetings (`/scholar/recurring-meetings`)
- Create recurring meeting schedules
- Set repetition patterns (daily/weekly/monthly)
- Automatic meeting creation
- Manage recurring series

#### Conflict Resolver (`/scholar/conflict-resolver`)
- **Smart Alternatives**: AI suggests alternative times
- **Priority Management**: Automatic priority-based scheduling
- **Reschedule Assistance**: Intelligent rescheduling recommendations
- **Conflict Prevention**: Proactive conflict detection

### Analytics & Insights

#### Scheduler Analytics (`/scholar/scheduler-analytics`)
- Booking success rates
- Most popular time slots
- Student engagement metrics
- Revenue tracking
- Meeting completion rates

#### AI Analytics (`/scholar/ai-analytics`)
- **Performance Metrics**: Track scheduling success rates
- **Predictive Analytics**: AI-powered insights for optimal times
- **Student Behavior Analysis**: Understand student preferences
- **Revenue Tracking**: Monitor earnings and growth
- **Demand Forecasting**: Predict high-demand periods

#### Personalization Engine (`/scholar/personalization`)
- **Student Profiling**: Detailed student profiles
- **Learning Style Detection**: Identify learning preferences
- **Engagement Tracking**: Monitor student engagement
- **Personalized Recommendations**: Tailored suggestions per student

### Payment Tracking (`/scholar/payments`)
- View all payments received
- Earnings breakdown by period
- Payment status tracking
- Student payment history
- Revenue analytics
- Export payment data

### Feedback Management (`/scholar/feedback`)
- View all student feedback
- Respond to feedback
- Track feedback trends
- Manage feedback visibility

### Smart Notifications (`/scholar/smart-notifications`)
- **Notification Rules**: Customize notification preferences
- **Channel Selection**: Choose email/SMS/push notifications
- **Timing Control**: Set when to receive notifications
- **Priority Levels**: Configure notification priorities
- **Notification Logs**: View all sent notifications

### AI Agent Dashboard (`/scholar/ai-agent`)
- Monitor AI agent activities
- View agent performance metrics
- Configure AI settings
- Review AI-generated content

---

## Financing & Scholarships

### Payment System
- **Stripe Integration**: Secure payment processing
- **Payment Types**:
  - Hourly sessions
  - Monthly subscriptions
  - Single sessions
  - Premium subscriptions
- **Payment Methods**: Credit/debit cards via Stripe
- **Transaction Tracking**: Complete payment history
- **Receipts**: Email receipts for all transactions

### Subscription Management
- Monthly, quarterly, and yearly subscriptions
- Auto-renewal options
- Subscription cancellation
- Plan upgrades/downgrades
- Billing cycle management

---

## Admin Features

### Admin Dashboard (`/admin`)
- **User Management**:
  - View all users
  - Block/unblock users
  - View user details
  - Search and filter users
- **Scholar Applications**:
  - View pending applications
  - Approve/reject applications
  - View application details
  - Remove scholars
- **Reviews Management**:
  - View all reviews
  - Moderate reviews
  - Delete inappropriate reviews
- **System Logs**:
  - View sensitive activity logs
  - Track system events
  - Monitor platform activity
- **Feedback Management**:
  - View all platform feedback
  - Categorize feedback
  - Respond to feedback
  - Track feedback trends
- **Payment Management**:
  - View all transactions
  - Refund processing
  - Payment analytics
  - Revenue tracking
- **Messaging**:
  - Send messages to any user
  - Opens direct chat with user
  - Admin notification system

---

## Core Features

### Authentication System
- **JWT-based Authentication**: Secure token-based auth
- **User Registration**: Signup with email and password
- **Login/Logout**: Secure session management
- **Protected Routes**: Role-based route protection
- **Password Security**: Hashed passwords (bcrypt)

### Real-time Communication
- **Socket.IO Integration**: Real-time updates
- **Chat System**: Instant messaging
- **Notifications**: Real-time notification delivery
- **Meeting Updates**: Live meeting status updates

### Dark Mode Support
- **Theme Toggle**: Switch between light/dark modes
- **Persistent Preference**: Saved in localStorage
- **System-wide**: Applied across all pages

### Responsive Design
- **Mobile-first**: Optimized for mobile devices
- **Tablet Support**: Responsive tablet layouts
- **Desktop Optimization**: Full desktop experience
- **Sidebar Management**: Collapsible sidebar for mobile

---

## Assignment & Quiz System

### Assignment Creation

#### AI Generation (CrewAI)
- **Two-Agent System**:
  - **Creator Agent**: Generates questions based on topic and requirements
  - **Validator Agent**: Validates question quality, accuracy, and format
- **Question Types**: Supports all question types
- **Quality Assurance**: Ensures accurate, well-formatted questions
- **Configuration Options**:
  - Number of questions
  - Difficulty level (easy/medium/hard)
  - Question mix ratios
  - Topic specification

#### Manual Creation
- **Step-by-step Builder**: Intuitive question builder
- **Question Editor**: Inline editing capabilities
- **Preview Mode**: See assignment as students will see it
- **Regeneration**: Option to regenerate with AI anytime

### Assignment Features
- **Multi-student Support**: Assign to multiple or all students
- **Due Dates**: Set submission deadlines
- **Status Management**: Draft → Published → Closed workflow
- **Question Management**: Add, edit, delete questions
- **AI Tags**: Track AI-generated assignments

### Quiz Features
- **Time Windows**: Set quiz availability windows
- **Duration**: Fixed time limit for quizzes
- **Auto-submission**: Automatic submission when time expires
- **Timer Display**: Visual countdown for students
- **Start Control**: Students can start quiz within window

### Grading System

#### Manual Grading
- **Per-question Scoring**: Score each question (0-10)
- **Per-question Feedback**: Provide specific feedback
- **Overall Score**: Total score (0-100)
- **Overall Feedback**: General feedback for student
- **Auto-calculation**: Automatically calculates total from per-question scores
- **Grade Override**: Update existing grades

#### Grade Display
- **Student View**: Detailed breakdown with:
  - Per-question scores and feedback
  - Overall grade percentage
  - Overall feedback
  - Visual score indicators (color-coded)
- **Scholar View**: Full submission details with grading interface

### Submission Management
- **Prevent Resubmission**: Students cannot submit twice
- **Status Tracking**: Submitted vs Graded status
- **Submission History**: Track all submission attempts
- **Auto-save**: Answers saved as student types

### Notifications
- **Assignment Published**: Notify students when assignment is published
- **Quiz Available**: Notify students when quiz becomes available
- **Submission Received**: Notify scholar when student submits
- **Grade Posted**: Notify student when graded
- **Multi-channel**: In-app, email, and chat notifications

---

## Meeting & Scheduling System

### Meeting Types

#### Direct Meetings
- **One-on-one**: Scheduled between student and scholar
- **Chat-based**: Requested through direct chat
- **Flexible Timing**: Custom date/time selection
- **Status Tracking**: Requested → Scheduled → Completed

#### Broadcast Meetings
- **Multiple Slots**: Scholar creates multiple time slots
- **Student Booking**: Students book available slots
- **Broadcast Notification**: All enrolled students notified
- **Booking Management**: Track who booked which slot

### Scheduling Features

#### Smart Scheduling
- **AI-powered**: Optimal time detection
- **Conflict Resolution**: Automatic conflict detection
- **Template System**: Pre-configured scheduling templates
- **Timezone Awareness**: Automatic timezone handling
- **Bulk Operations**: Select multiple slots at once

#### Recurring Meetings
- **Pattern Support**: Daily/weekly/monthly patterns
- **Automatic Creation**: System creates meetings automatically
- **Series Management**: Manage entire recurring series

### Meeting Management
- **Link Generation**: Automatic Jitsi meeting link creation
- **Status Updates**: Real-time status changes
- **Rescheduling**: Request and approve reschedules
- **Cancellation**: Cancel meetings with notifications
- **Reminders**: Automated reminder notifications

### Analytics
- **Booking Rates**: Track booking success
- **Popular Times**: Identify most booked times
- **Student Preferences**: Understand student scheduling patterns
- **Revenue Tracking**: Monitor meeting earnings

---

## Payment System

### Payment Processing
- **Stripe Integration**: Secure payment gateway
- **Payment Intent**: Server-side payment intent creation
- **Webhook Handling**: Automatic status updates
- **Multiple Methods**: Credit/debit cards

### Payment Types
- **Hourly Sessions**: Pay per hour of consultation
- **Monthly Subscriptions**: Recurring monthly payments
- **Single Sessions**: One-time session payments
- **Premium Subscriptions**: Advanced subscription plans

### Payment Features
- **Transaction Tracking**: Complete payment history
- **Status Management**: Pending/Completed/Failed/Refunded
- **Receipts**: Email receipts for all transactions
- **Refunds**: Admin-initiated refunds
- **Analytics**: Payment trends and summaries

### Subscription Management
- **Billing Cycles**: Monthly/Quarterly/Yearly
- **Auto-renewal**: Automatic subscription renewal
- **Cancellation**: Cancel subscriptions anytime
- **Plan Changes**: Upgrade/downgrade plans
- **Payment History**: Track all subscription payments

---

## Notification System

### Notification Types
- **Assignment**: Assignment published, due soon, overdue
- **Quiz**: Quiz available, time window opening/closing
- **Grade**: Submission graded, grade updated
- **Message**: New message from scholar/student
- **Meeting**: Meeting scheduled, canceled, reminder
- **System**: Platform updates, announcements

### Notification Channels
- **In-app**: Notification bell with dropdown
- **Email**: Gmail SMTP integration
- **Real-time**: Socket.IO instant delivery
- **Browser**: Optional desktop notifications

### Notification Features
- **Real-time Delivery**: Instant notification via Socket.IO
- **Read Status**: Mark as read/unread
- **Bulk Actions**: Mark all as read
- **Filtering**: Filter by type, read status
- **Priority Levels**: Low/Normal/High/Urgent
- **Debouncing**: Prevent duplicate notifications
- **Links**: Direct links to relevant pages

### Smart Notifications (Scholar)
- **Custom Rules**: Define notification preferences
- **Channel Selection**: Choose notification channels
- **Timing Control**: Set notification timing
- **Priority Configuration**: Customize priorities
- **Notification Logs**: View all sent notifications

---

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- MongoDB 4.4+
- Git

### Backend Setup

1. **Clone Repository**
```bash
git clone <repository-url>
cd hikma-ai/backend
```

2. **Install Dependencies**
```bash
npm install
```

3. **Python Dependencies**
```bash
cd agents-python
pip install -r requirements.txt
```

4. **Environment Variables** (`backend/.env`)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/hikmah-ai
JWT_SECRET=your-super-secret-jwt-key-here
GEMINI_API_KEY=your-google-gemini-api-key
HADITH_API_KEY=your-hadith-api-key
ALLOWED_ORIGINS=http://localhost:5173,https://your-domain.com
MEET_ENCRYPT_SECRET=your-meeting-encryption-secret

# Email (Gmail SMTP)
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-gmail-app-password
APP_BASE_URL=http://localhost:5173
NOTIFY_DEBOUNCE_MS=120000

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Optional: CrewAI
CREWAI_ENABLED=true
PYTHON_BIN=python
```

5. **Start Backend**
```bash
node index.js
```

### Frontend Setup

1. **Navigate to Client**
```bash
cd ../client
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Variables** (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

4. **Start Development Server**
```bash
npm run dev
```

5. **Access Application**
```
http://localhost:5173
```

### Database Setup
- MongoDB will create collections automatically
- Ensure MongoDB is running before starting backend
- Indexes are created automatically by Mongoose

---

## API Documentation

### Authentication Endpoints

#### POST `/api/auth/signup`
Register a new user
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### POST `/api/auth/login`
Login user
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

### Assignment Endpoints

#### POST `/api/assignments`
Create new assignment (Scholar)
```json
{
  "title": "Islamic History Quiz",
  "description": "Test your knowledge",
  "kind": "quiz",
  "targetEnrollments": ["enrollment_id_1", "enrollment_id_2"],
  "targetAllStudents": false,
  "dueDate": "2024-12-31T23:59:59Z",
  "questions": [...]
}
```

#### POST `/api/assignments/:id/generate`
Generate questions with AI (Scholar)
```json
{
  "numQuestions": 10,
  "difficulty": "medium",
  "mode": "custom",
  "mcqCount": 5,
  "trueFalseCount": 2,
  "shortAnswerCount": 2,
  "essayCount": 1
}
```

#### POST `/api/assignments/:id/publish`
Publish assignment (Scholar)

#### GET `/api/assignments`
Get assignments (Student sees published, Scholar sees own)

#### GET `/api/assignments/:id`
Get assignment details

#### POST `/api/submissions/assignment/:id/submit`
Submit assignment (Student)
```json
{
  "answers": [
    {
      "questionId": "question_id",
      "selectedOption": 0,
      "answerText": "Answer text"
    }
  ]
}
```

#### POST `/api/submissions/:id/manual-grade`
Grade submission manually (Scholar)
```json
{
  "totalScore": 85,
  "feedback": "Great work!",
  "perQuestion": [
    {
      "questionId": "question_id",
      "score": 8,
      "feedback": "Good answer"
    }
  ]
}
```

### Meeting Endpoints

#### POST `/api/meetings/request`
Request meeting (Student)
```json
{
  "scholarId": "scholar_id",
  "preferredTime": "2024-12-25T10:00:00Z",
  "duration": 60,
  "message": "Meeting request message"
}
```

#### POST `/api/meetings/:id/schedule`
Schedule meeting (Scholar)
```json
{
  "scheduledTime": "2024-12-25T10:00:00Z",
  "link": "https://meet.jit.si/meeting-room"
}
```

#### GET `/api/meetings/my-meetings`
Get user's meetings

### Payment Endpoints

#### POST `/api/payments/create`
Create payment intent
```json
{
  "scholarId": "scholar_id",
  "amount": 50,
  "paymentType": "hourly",
  "paymentMethod": "stripe",
  "description": "1-hour consultation"
}
```

#### GET `/api/payments/my-payments`
Get user's payment history

### Notification Endpoints

#### GET `/api/notifications`
Get user's notifications
```
Query params: unreadOnly, page, limit
```

#### POST `/api/notifications/:id/read`
Mark notification as read

#### POST `/api/notifications/read-all`
Mark all notifications as read

---

## Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum: ['student', 'scholar', 'admin']),
  enrolledScholars: [ObjectId], // Denormalized for quick access
  createdAt: Date,
  updatedAt: Date
}
```

### Scholar Model
```javascript
{
  user: ObjectId (ref: User),
  bio: String,
  specializations: [String],
  languages: [String],
  experienceYears: Number,
  qualifications: String,
  demoVideoUrl: String,
  photoUrl: String,
  approved: Boolean,
  hourlyRate: Number,
  monthlyRate: Number,
  averageRating: Number,
  totalReviews: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Assignment Model
```javascript
{
  title: String,
  description: String,
  kind: String (enum: ['assignment', 'quiz']),
  createdBy: ObjectId (ref: User),
  enrollmentId: ObjectId (ref: Enrollment), // Legacy
  targetEnrollments: [ObjectId], // New multi-student support
  targetAllStudents: Boolean,
  createdByAI: Boolean,
  questions: [{
    type: String,
    prompt: String,
    options: [String], // For MCQ
    answer: Mixed
  }],
  status: String (enum: ['draft', 'published', 'closed']),
  dueDate: Date,
  quizWindowStart: Date, // For quizzes
  quizWindowEnd: Date,
  durationMinutes: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Submission Model
```javascript
{
  assignment: ObjectId (ref: Assignment),
  student: ObjectId (ref: User),
  answers: [{
    questionId: ObjectId,
    selectedOption: Number,
    answerText: String
  }],
  status: String (enum: ['submitted', 'graded']),
  grade: Number (0-100),
  feedback: String,
  manualGrading: {
    totalScore: Number,
    perQuestion: [{
      questionId: ObjectId,
      score: Number,
      feedback: String
    }],
    feedback: String
  },
  submittedAt: Date,
  gradedBy: ObjectId (ref: User),
  gradedAt: Date
}
```

### Meeting Model
```javascript
{
  student: ObjectId (ref: User),
  scholar: ObjectId (ref: User),
  chatId: ObjectId (ref: Chat),
  scheduledTime: Date,
  duration: Number,
  link: String,
  status: String (enum: ['requested', 'scheduled', 'completed', 'cancelled']),
  createdAt: Date,
  updatedAt: Date
}
```

### Payment Model
```javascript
{
  user: ObjectId (ref: User),
  scholar: ObjectId (ref: Scholar),
  amount: Number,
  currency: String,
  paymentType: String (enum: ['hourly', 'monthly', 'session', 'subscription']),
  status: String (enum: ['pending', 'completed', 'failed', 'refunded']),
  paymentMethod: String,
  transactionId: String,
  description: String,
  sessionId: ObjectId (ref: Meeting),
  createdAt: Date,
  updatedAt: Date
}
```

### Notification Model
```javascript
{
  userId: ObjectId (ref: User),
  type: String (enum: ['assignment', 'quiz', 'grade', 'message', 'meeting', 'system']),
  title: String,
  message: String,
  metadata: Object,
  read: Boolean,
  readAt: Date,
  link: String,
  priority: String (enum: ['low', 'normal', 'high', 'urgent']),
  createdAt: Date
}
```

---

## Security

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Role-based Access**: Middleware checks user roles
- **Route Protection**: Protected routes require authentication
- **Token Expiration**: Tokens expire after set time

### Data Security
- **Input Validation**: All inputs validated on server
- **SQL Injection Prevention**: Mongoose parameterized queries
- **XSS Protection**: Sanitized user inputs
- **CORS Configuration**: Restricted origins
- **Environment Variables**: Sensitive data in .env files

### Payment Security
- **Server-side Processing**: Payment intents created on server
- **Webhook Verification**: Stripe webhook signature verification
- **No Card Storage**: Cards never stored, handled by Stripe
- **HTTPS Required**: Secure connections for payments

---

## Deployment

### Backend Deployment
1. Set production environment variables
2. Build and start Node.js server
3. Configure MongoDB connection
4. Set up SSL certificates
5. Configure CORS for production domain

### Frontend Deployment
1. Build production bundle: `npm run build`
2. Deploy `dist` folder to hosting service
3. Configure environment variables
4. Set up CDN for static assets
5. Configure routing for SPA

### Database
- Use MongoDB Atlas for production
- Set up database backups
- Configure database indexes
- Monitor database performance

### Monitoring
- Set up error tracking (Sentry, etc.)
- Monitor API response times
- Track user activity
- Monitor payment transactions
- Set up alerts for critical issues

---

## Contributing

### Development Workflow
1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request
5. Code review
6. Merge to main

### Code Standards
- Follow ESLint configuration
- Use Prettier for formatting
- Write TypeScript types
- Add comments for complex logic
- Write tests for critical features

---

## License

This project is licensed under the MIT License.

---

## Support & Contact

For support, questions, or feedback:
- **Documentation**: Check this README and other docs
- **Issues**: Create GitHub issues for bugs
- **Email**: Contact the development team

---

**Created with ❤️ by team Cyber Mujahideen Ai Skillbridge**

*Last updated: December 2024*

