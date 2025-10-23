import React, { useState, useEffect } from 'react';
import {
  UserIcon,
  ClockIcon,
  CalendarIcon,
  AcademicCapIcon,
  LightBulbIcon,
  SparklesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  BookOpenIcon,
  GlobeAltIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import aiAgentService from '../../services/aiAgentService';
import { meetingService } from '../../services/meetingService';
import { getMyEnrollments } from '../../services/scholarService';

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  preferences: {
    preferredTimes: string[];
    sessionDuration: number;
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    timezone: string;
    availability: {
      weekdays: boolean;
      weekends: boolean;
      morning: boolean;
      afternoon: boolean;
      evening: boolean;
    };
    subjects: string[];
    experience: 'beginner' | 'intermediate' | 'advanced';
    goals: string[];
  };
  history: {
    totalSessions: number;
    averageRating: number;
    lastSession: string;
    attendanceRate: number;
    preferredScholars: string[];
  };
  behavior: {
    bookingPattern: 'early' | 'last-minute' | 'consistent';
    rescheduleFrequency: number;
    cancellationRate: number;
    engagementLevel: 'high' | 'medium' | 'low';
  };
}

interface PersonalizedRecommendation {
  studentId: string;
  recommendedTimes: Array<{
    start: string;
    end: string;
    duration: number;
    confidence: number;
    reasoning: string;
  }>;
  sessionSuggestions: {
    duration: number;
    frequency: string;
    format: string;
    topics: string[];
  };
  communication: {
    reminderTiming: string[];
    messageStyle: 'formal' | 'casual' | 'encouraging';
    preferredChannels: string[];
  };
  insights: string[];
}

interface PersonalizationEngineProps {
  scholarId: string;
  onRecommendationsGenerated: (recommendations: PersonalizedRecommendation[]) => void;
}

const PersonalizationEngine: React.FC<PersonalizationEngineProps> = ({
  scholarId,
  onRecommendationsGenerated
}) => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [showInsights, setShowInsights] = useState(false);

  useEffect(() => {
    loadStudentProfiles();
  }, [scholarId]);

  const loadStudentProfiles = async () => {
    try {
      setLoading(true);
      
      // Load real student data from backend
      const [dashboardData, enrollmentsData] = await Promise.all([
        meetingService.getScholarDashboard(),
        getMyEnrollments()
      ]);
      
      // Transform real data into student profiles
      const realStudents: StudentProfile[] = (dashboardData.enrolledStudents || []).map((enrollment: any) => {
        const student = enrollment.student;
        const chatId = enrollment.chatId;
        
        // Get student's meeting history
        const studentMeetings = (dashboardData.scheduled || []).concat(dashboardData.linkSent || [])
          .filter((meeting: any) => meeting.studentId === student._id);
        
        // Calculate attendance rate
        const totalSessions = studentMeetings.length;
        const attendedSessions = studentMeetings.filter((m: any) => m.status === 'link_sent').length;
        const attendanceRate = totalSessions > 0 ? attendedSessions / totalSessions : 0;
        
        // Determine learning style based on session patterns
        const avgDuration = studentMeetings.length > 0 
          ? studentMeetings.reduce((sum: number, m: any) => sum + (m.duration || 60), 0) / studentMeetings.length
          : 60;
        
        const learningStyle = avgDuration > 75 ? 'auditory' : avgDuration < 45 ? 'kinesthetic' : 'visual';
        
        // Determine experience level based on total sessions
        const experience = totalSessions > 20 ? 'advanced' : totalSessions > 10 ? 'intermediate' : 'beginner';
        
        // Determine engagement level based on attendance
        const engagementLevel = attendanceRate > 0.9 ? 'high' : attendanceRate > 0.7 ? 'medium' : 'low';
        
        // Determine booking pattern based on meeting timing
        const earlyBookings = studentMeetings.filter((m: any) => {
          const daysDiff = (new Date(m.scheduledTime).getTime() - new Date(m.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff > 3;
        }).length;
        
        const bookingPattern = earlyBookings > totalSessions / 2 ? 'early' : 
                             earlyBookings < totalSessions / 4 ? 'last-minute' : 'consistent';
        
        return {
          id: student._id,
          name: student.name,
          email: student.email,
          preferences: {
            preferredTimes: ['09:00', '14:00', '18:00'], // Default, could be enhanced with real data
            sessionDuration: Math.round(avgDuration),
            learningStyle: learningStyle as 'visual' | 'auditory' | 'kinesthetic' | 'reading',
            timezone: 'UTC', // Default, could be enhanced with real timezone data
            availability: {
              weekdays: true,
              weekends: false,
              morning: true,
              afternoon: true,
              evening: true
            },
            subjects: ['Islamic Studies'], // Default, could be enhanced with real subject data
            experience: experience as 'beginner' | 'intermediate' | 'advanced',
            goals: ['Learn Islamic knowledge'] // Default, could be enhanced with real goals data
          },
          history: {
            totalSessions: totalSessions,
            averageRating: 4.5, // Default, could be enhanced with real rating data
            lastSession: studentMeetings.length > 0 ? studentMeetings[0].scheduledTime : new Date().toISOString(),
            attendanceRate: attendanceRate,
            preferredScholars: [scholarId]
          },
          behavior: {
            bookingPattern: bookingPattern as 'early' | 'last-minute' | 'consistent',
            rescheduleFrequency: 0.1, // Default, could be enhanced with real reschedule data
            cancellationRate: 1 - attendanceRate,
            engagementLevel: engagementLevel as 'high' | 'medium' | 'low'
          }
        };
      });

      setStudents(realStudents);
      
      // Generate personalized recommendations from real data
      const personalizedRecs = await generatePersonalizedRecommendations(realStudents);
      setRecommendations(personalizedRecs);
      onRecommendationsGenerated(personalizedRecs);
      
    } catch (error) {
      console.error('Error loading student profiles:', error);
      // Set empty state if API fails
      setStudents([]);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const generatePersonalizedRecommendations = async (students: StudentProfile[]): Promise<PersonalizedRecommendation[]> => {
    const recommendations: PersonalizedRecommendation[] = [];
    
    for (const student of students) {
      try {
        // Get AI-powered personalized recommendations
        const aiRecs = await aiAgentService.getPersonalizedRecommendations(student.id, scholarId);
        
        const recommendation: PersonalizedRecommendation = {
          studentId: student.id,
          recommendedTimes: generateOptimalTimes(student),
          sessionSuggestions: {
            duration: student.preferences.sessionDuration,
            frequency: calculateOptimalFrequency(student),
            format: determineSessionFormat(student),
            topics: student.preferences.subjects
          },
          communication: {
            reminderTiming: generateReminderTiming(student),
            messageStyle: determineMessageStyle(student),
            preferredChannels: ['email', 'sms']
          },
          insights: generateStudentInsights(student)
        };
        
        recommendations.push(recommendation);
      } catch (error) {
        console.error(`Error generating recommendations for ${student.name}:`, error);
        // Fallback to basic recommendations
        recommendations.push(generateBasicRecommendations(student));
      }
    }
    
    return recommendations;
  };

  const generateOptimalTimes = (student: StudentProfile) => {
    const times = [];
    const now = new Date();
    
    // Generate times based on student preferences
    for (let i = 1; i <= 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      
      // Only generate times for available days
      if (student.preferences.availability.weekdays && date.getDay() >= 1 && date.getDay() <= 5) {
        student.preferences.preferredTimes.forEach(timeStr => {
          const [hours, minutes] = timeStr.split(':').map(Number);
          const slotDate = new Date(date);
          slotDate.setHours(hours, minutes, 0, 0);
          
          if (slotDate > now) {
            const endTime = new Date(slotDate.getTime() + student.preferences.sessionDuration * 60000);
            times.push({
              start: slotDate.toISOString(),
              end: endTime.toISOString(),
              duration: student.preferences.sessionDuration,
              confidence: calculateTimeConfidence(student, timeStr),
              reasoning: generateTimeReasoning(student, timeStr)
            });
          }
        });
      }
    }
    
    return times.slice(0, 5); // Return top 5 recommendations
  };

  const calculateTimeConfidence = (student: StudentProfile, time: string): number => {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on student preferences
    if (student.preferences.preferredTimes.includes(time)) {
      confidence += 0.3;
    }
    
    // Adjust based on learning style
    if (student.preferences.learningStyle === 'visual' && time >= '09:00' && time <= '11:00') {
      confidence += 0.1;
    }
    
    // Adjust based on behavior
    if (student.behavior.engagementLevel === 'high') {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  };

  const generateTimeReasoning = (student: StudentProfile, time: string): string => {
    const reasons = [];
    
    if (student.preferences.preferredTimes.includes(time)) {
      reasons.push('Matches your preferred time');
    }
    
    if (student.preferences.learningStyle === 'visual' && time >= '09:00' && time <= '11:00') {
      reasons.push('Optimal for visual learning');
    }
    
    if (student.behavior.engagementLevel === 'high') {
      reasons.push('High engagement expected');
    }
    
    return reasons.join(', ') || 'Good availability and student compatibility';
  };

  const calculateOptimalFrequency = (student: StudentProfile): string => {
    if (student.history.totalSessions > 20 && student.behavior.engagementLevel === 'high') {
      return '2-3 times per week';
    } else if (student.preferences.experience === 'beginner') {
      return 'Once per week';
    } else {
      return '1-2 times per week';
    }
  };

  const determineSessionFormat = (student: StudentProfile): string => {
    if (student.preferences.learningStyle === 'visual') {
      return 'Interactive with visual aids';
    } else if (student.preferences.learningStyle === 'auditory') {
      return 'Discussion-based with audio content';
    } else if (student.preferences.learningStyle === 'kinesthetic') {
      return 'Hands-on practice sessions';
    } else {
      return 'Reading and discussion format';
    }
  };

  const generateReminderTiming = (student: StudentProfile): string[] => {
    const timings = ['24 hours before'];
    
    if (student.behavior.bookingPattern === 'last-minute') {
      timings.push('2 hours before', '30 minutes before');
    } else if (student.behavior.cancellationRate > 0.1) {
      timings.push('48 hours before', '2 hours before');
    }
    
    return timings;
  };

  const determineMessageStyle = (student: StudentProfile): 'formal' | 'casual' | 'encouraging' => {
    if (student.behavior.engagementLevel === 'high') {
      return 'encouraging';
    } else if (student.preferences.experience === 'beginner') {
      return 'encouraging';
    } else {
      return 'formal';
    }
  };

  const generateStudentInsights = (student: StudentProfile): string[] => {
    const insights = [];
    
    if (student.behavior.engagementLevel === 'high') {
      insights.push('Highly engaged student - consider advanced topics');
    }
    
    if (student.behavior.bookingPattern === 'early') {
      insights.push('Plans ahead - good for long-term scheduling');
    }
    
    if (student.history.attendanceRate > 0.9) {
      insights.push('Excellent attendance record');
    }
    
    if (student.preferences.learningStyle === 'visual') {
      insights.push('Visual learner - use diagrams and visual aids');
    }
    
    return insights;
  };

  const generateBasicRecommendations = (student: StudentProfile): PersonalizedRecommendation => {
    return {
      studentId: student.id,
      recommendedTimes: generateOptimalTimes(student),
      sessionSuggestions: {
        duration: student.preferences.sessionDuration,
        frequency: 'Once per week',
        format: 'Standard session',
        topics: student.preferences.subjects
      },
      communication: {
        reminderTiming: ['24 hours before'],
        messageStyle: 'formal',
        preferredChannels: ['email']
      },
      insights: ['Standard recommendations based on profile']
    };
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <SparklesIcon className="h-8 w-8 text-purple-600 mr-3" />
              Personalization Engine
            </h2>
            <p className="text-gray-600">AI-powered personalized scheduling for each student</p>
          </div>
          <button
            onClick={() => setShowInsights(!showInsights)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center"
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            {showInsights ? 'Hide Insights' : 'Show Insights'}
          </button>
        </div>
      </div>

      {/* Student Selection */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Student</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => (
            <div
              key={student.id}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedStudent === student.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
              onClick={() => setSelectedStudent(student.id)}
            >
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <UserIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{student.name}</h4>
                  <p className="text-sm text-gray-600">{student.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <AcademicCapIcon className="h-4 w-4 mr-2" />
                  <span>{student.preferences.experience}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <BookOpenIcon className="h-4 w-4 mr-2" />
                  <span>{student.preferences.learningStyle}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <GlobeAltIcon className="h-4 w-4 mr-2" />
                  <span>{student.preferences.timezone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Personalized Recommendations */}
      {selectedStudent && (
        <div className="space-y-6">
          {recommendations
            .filter(rec => rec.studentId === selectedStudent)
            .map((recommendation) => {
              const student = students.find(s => s.id === selectedStudent);
              if (!student) return null;

              return (
                <div key={recommendation.studentId} className="space-y-6">
                  {/* Recommended Times */}
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <ClockIcon className="h-5 w-5 text-blue-600 mr-2" />
                      Recommended Times for {student.name}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recommendation.recommendedTimes.map((time, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 text-gray-500 mr-2" />
                              <span className="font-medium text-gray-900">
                                {formatDateTime(time.start)}
                              </span>
                            </div>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {Math.round(time.confidence * 100)}%
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{time.reasoning}</p>
                          <div className="flex items-center text-sm text-gray-500">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            <span>{time.duration} minutes</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Session Suggestions */}
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <LightBulbIcon className="h-5 w-5 text-yellow-600 mr-2" />
                      Session Suggestions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Optimal Session Settings</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Duration</span>
                            <span className="font-medium text-gray-900">{recommendation.sessionSuggestions.duration} minutes</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Frequency</span>
                            <span className="font-medium text-gray-900">{recommendation.sessionSuggestions.frequency}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Format</span>
                            <span className="font-medium text-gray-900">{recommendation.sessionSuggestions.format}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Recommended Topics</h4>
                        <div className="flex flex-wrap gap-2">
                          {recommendation.sessionSuggestions.topics.map((topic, index) => (
                            <span key={index} className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Communication Preferences */}
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <HeartIcon className="h-5 w-5 text-red-600 mr-2" />
                      Communication Preferences
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Reminder Timing</h4>
                        <ul className="space-y-2">
                          {recommendation.communication.reminderTiming.map((timing, index) => (
                            <li key={index} className="flex items-center text-sm text-gray-700">
                              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                              {timing}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Message Style</h4>
                        <div className="flex items-center">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                            {recommendation.communication.messageStyle}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Insights */}
                  {showInsights && (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <SparklesIcon className="h-5 w-5 text-purple-600 mr-2" />
                        AI Insights
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Student Insights</h4>
                          <ul className="space-y-2">
                            {recommendation.insights.map((insight, index) => (
                              <li key={index} className="flex items-start text-sm text-gray-700">
                                <LightBulbIcon className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                                {insight}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Behavioral Analysis</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Engagement Level</span>
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                {student.behavior.engagementLevel}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Booking Pattern</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                {student.behavior.bookingPattern}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Attendance Rate</span>
                              <span className="font-medium text-gray-900">
                                {Math.round(student.history.attendanceRate * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default PersonalizationEngine;
