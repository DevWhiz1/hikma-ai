import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  UsersIcon, 
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparklesIcon,
  DocumentDuplicateIcon,
  GlobeAltIcon,
  AdjustmentsHorizontalIcon,
  MicrophoneIcon,
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import smartSchedulerService from '../../services/smartSchedulerService';
import aiAgentService from '../../services/aiAgentService';

interface TimeSlot {
  start: string;
  end: string;
  duration: number;
  maxParticipants?: number;
  confidence?: number;
  reasoning?: string;
}

interface OptimalTime {
  start: string;
  end: string;
  duration: number;
  confidence?: number;
  reasoning?: string;
}

interface SchedulingTemplate {
  id: string;
  name: string;
  description: string;
  duration: number;
  daysAhead: number;
  timeSlots: string[];
  icon: string;
}

interface TimezoneInfo {
  value: string;
  label: string;
  offset: string;
}

interface AIInsights {
  insights: string[];
  recommendations: string[];
  confidence: number;
}

const AISmartScheduler: React.FC = () => {
  const [optimalTimes, setOptimalTimes] = useState<OptimalTime[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimes, setSelectedTimes] = useState<TimeSlot[]>([]);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastDescription, setBroadcastDescription] = useState('');
  const [duration, setDuration] = useState(60);
  const [daysAhead, setDaysAhead] = useState(14);
  const [existingBroadcasts, setExistingBroadcasts] = useState<any[]>([]);
  
  // Enhanced UI state
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState('UTC');
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  
  // AI Agent state
  const [aiMode, setAiMode] = useState(false);
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);

  // Scheduling templates
  const schedulingTemplates: SchedulingTemplate[] = [
    {
      id: 'morning-sessions',
      name: 'Morning Sessions',
      description: 'Weekday morning slots (9 AM - 12 PM)',
      duration: 60,
      daysAhead: 14,
      timeSlots: ['09:00', '10:00', '11:00', '12:00'],
      icon: '🌅'
    },
    {
      id: 'afternoon-sessions',
      name: 'Afternoon Sessions',
      description: 'Weekday afternoon slots (2 PM - 5 PM)',
      duration: 60,
      daysAhead: 14,
      timeSlots: ['14:00', '15:00', '16:00', '17:00'],
      icon: '☀️'
    },
    {
      id: 'evening-sessions',
      name: 'Evening Sessions',
      description: 'Weekday evening slots (6 PM - 9 PM)',
      duration: 90,
      daysAhead: 14,
      timeSlots: ['18:00', '19:30', '21:00'],
      icon: '🌆'
    },
    {
      id: 'weekend-intensive',
      name: 'Weekend Intensive',
      description: 'Weekend extended sessions',
      duration: 120,
      daysAhead: 30,
      timeSlots: ['10:00', '14:00'],
      icon: '📚'
    },
    {
      id: 'quick-qa',
      name: 'Quick Q&A',
      description: 'Short 30-minute Q&A sessions throughout the day',
      duration: 30,
      daysAhead: 7,
      timeSlots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
      icon: '❓'
    }
  ];

  // Common timezones
  const timezones: TimezoneInfo[] = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: '+00:00' },
    { value: 'America/New_York', label: 'Eastern Time (ET)', offset: '-05:00' },
    { value: 'America/Chicago', label: 'Central Time (CT)', offset: '-06:00' },
    { value: 'America/Denver', label: 'Mountain Time (MT)', offset: '-07:00' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: '-08:00' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)', offset: '+00:00' },
    { value: 'Europe/Paris', label: 'Central European Time (CET)', offset: '+01:00' },
    { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)', offset: '+04:00' },
    { value: 'Asia/Karachi', label: 'Pakistan Standard Time (PKT)', offset: '+05:00' },
    { value: 'Asia/Kolkata', label: 'India Standard Time (IST)', offset: '+05:30' },
    { value: 'Asia/Dhaka', label: 'Bangladesh Standard Time (BST)', offset: '+06:00' },
    { value: 'Asia/Jakarta', label: 'Western Indonesia Time (WIB)', offset: '+07:00' },
    { value: 'Asia/Shanghai', label: 'China Standard Time (CST)', offset: '+08:00' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', offset: '+09:00' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)', offset: '+10:00' }
  ];

  // Load optimal times on component mount
  useEffect(() => {
    loadOptimalTimes();
    loadExistingBroadcasts();
  }, [duration, daysAhead, selectedTemplate]);

  const loadOptimalTimes = async () => {
    try {
      setLoading(true);
      
      // If a template is selected, generate time slots from template instead of AI
      if (selectedTemplate) {
        const template = schedulingTemplates.find(t => t.id === selectedTemplate);
        if (template) {
          const templateSlots = generateTimeSlotsFromTemplate(template);
          setOptimalTimes(templateSlots.map(slot => ({
            start: slot.start,
            end: slot.end,
            duration: slot.duration
          })));
          return;
        }
      }
      
      // Generate all-day time slots when no template is selected
      const allDaySlots = generateAllDayTimeSlots();
      setOptimalTimes(allDaySlots.map(slot => ({
        start: slot.start,
        end: slot.end,
        duration: slot.duration
      })));
    } catch (error) {
      console.error('Error loading optimal times:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAllDayTimeSlots = () => {
    const slots: TimeSlot[] = [];
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + daysAhead);

    // Generate slots throughout the day (9 AM to 9 PM)
    const timeSlots = [
      '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
      '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
    ];

    // Generate slots for each day in the range
    for (let d = new Date(now); d <= endDate; d.setDate(d.getDate() + 1)) {
      // Skip weekends for all-day slots
      if (d.getDay() === 0 || d.getDay() === 6) {
        continue;
      }

      // Generate slots for each time
      timeSlots.forEach(timeStr => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const slotDate = new Date(d);
        slotDate.setHours(hours, minutes, 0, 0);

        // Only add future slots
        if (slotDate > now) {
          const endTime = new Date(slotDate.getTime() + duration * 60000);
          slots.push({
            start: slotDate.toISOString(),
            end: endTime.toISOString(),
            duration: duration,
            maxParticipants: 1
          });
        }
      });
    }

    // Sort slots by start time
    slots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    
    return slots.slice(0, 12); // Show 12 slots
  };

  const generateTimeSlotsFromTemplate = (template: SchedulingTemplate) => {
    const slots: TimeSlot[] = [];
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + template.daysAhead);

    // Generate slots for each day in the range
    for (let d = new Date(now); d <= endDate; d.setDate(d.getDate() + 1)) {
      // Skip weekends for most templates (except weekend-intensive)
      if (template.id !== 'weekend-intensive' && (d.getDay() === 0 || d.getDay() === 6)) {
        continue;
      }

      // For weekend-intensive, only include weekends
      if (template.id === 'weekend-intensive' && d.getDay() !== 0 && d.getDay() !== 6) {
        continue;
      }

      // Generate slots for each time in the template
      template.timeSlots.forEach(timeStr => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const slotDate = new Date(d);
        slotDate.setHours(hours, minutes, 0, 0);

        // Only add future slots
        if (slotDate > now) {
          const endTime = new Date(slotDate.getTime() + template.duration * 60000);
          slots.push({
            start: slotDate.toISOString(),
            end: endTime.toISOString(),
            duration: template.duration,
            maxParticipants: 1
          });
        }
      });
    }

    // Sort slots by start time
    slots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    
    return slots.slice(0, 12); // Show more slots for templates
  };

  const loadExistingBroadcasts = async () => {
    try {
      const response = await smartSchedulerService.getScholarBroadcasts();
      setExistingBroadcasts(response.broadcasts || []);
    } catch (error) {
      console.error('Error loading existing broadcasts:', error);
    }
  };

  // AI Agent Functions
  const handleNaturalLanguageInput = async () => {
    if (!naturalLanguageInput.trim()) return;

    try {
      setLoading(true);
      
      // Parse the natural language input
      const intent = await aiAgentService.parseSchedulingIntent(naturalLanguageInput);
      
      // Generate AI suggestions based on intent
      const aiResponse = await aiAgentService.generateAITimeSuggestions(intent, 'current-scholar');
      
      // Set the AI insights
      setAiInsights({
        insights: aiResponse.insights,
        recommendations: aiResponse.recommendations,
        confidence: aiResponse.confidence
      });
      
      // Update optimal times with AI suggestions
      setOptimalTimes(aiResponse.slots);
      
      // Show AI insights
      setShowAIInsights(true);
      
      // Clear the input
      setNaturalLanguageInput('');
      
    } catch (error) {
      console.error('Error processing natural language input:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSelect = (time: OptimalTime) => {
    const timeSlot: TimeSlot = {
      start: time.start,
      end: time.end,
      duration: time.duration,
      maxParticipants: 1,
      confidence: time.confidence,
      reasoning: time.reasoning
    };

    // Check for conflicts
    const conflict = checkForConflicts(timeSlot);
    if (conflict) {
      setConflicts(prev => [...prev, conflict]);
      return;
    }

    setSelectedTimes(prev => [...prev, timeSlot]);
  };

  const handleBulkSelect = () => {
    if (bulkSelectMode) {
      // Select all available times
      const newSelections = optimalTimes
        .filter(time => !checkForConflicts({
          start: time.start,
          end: time.end,
          duration: time.duration,
          maxParticipants: 1
        }))
        .map(time => ({
          start: time.start,
          end: time.end,
          duration: time.duration,
          maxParticipants: 1,
          confidence: time.confidence,
          reasoning: time.reasoning
        }));
      
      setSelectedTimes(prev => [...prev, ...newSelections]);
    }
    setBulkSelectMode(false);
  };

  const handleTemplateSelect = (template: SchedulingTemplate) => {
    setDuration(template.duration);
    setDaysAhead(template.daysAhead);
    setSelectedTemplate(template.id);
    setBroadcastTitle(template.name); // Prefill title with template name
    setBroadcastDescription(template.description); // Prefill description with template description
    setShowTemplates(false);
    
    // Generate time slots from template
    const templateSlots = generateTimeSlotsFromTemplate(template);
    setOptimalTimes(templateSlots.map(slot => ({
      start: slot.start,
      end: slot.end,
      duration: slot.duration
    })));
  };

  const checkForConflicts = (timeSlot: TimeSlot): string | null => {
    // Check against existing broadcasts
    for (const broadcast of existingBroadcasts) {
      for (const existingTime of broadcast.meetingTimes) {
        const existingStart = new Date(existingTime.start);
        const existingEnd = new Date(existingTime.end);
        const newStart = new Date(timeSlot.start);
        const newEnd = new Date(timeSlot.end);
        
        if ((newStart < existingEnd && newEnd > existingStart)) {
          return `Conflicts with existing broadcast: ${broadcast.title}`;
        }
      }
    }
    
    // Check against selected times
    for (const selected of selectedTimes) {
      const selectedStart = new Date(selected.start);
      const selectedEnd = new Date(selected.end);
      const newStart = new Date(timeSlot.start);
      const newEnd = new Date(timeSlot.end);
      
      if ((newStart < selectedEnd && newEnd > selectedStart)) {
        return `Conflicts with selected time: ${formatDateTime(selected.start)}`;
      }
    }
    
    return null;
  };

  const handleTimeRemove = (index: number) => {
    setSelectedTimes(prev => prev.filter((_, i) => i !== index));
    setConflicts([]);
  };

  const clearAllSelections = () => {
    setSelectedTimes([]);
    setConflicts([]);
  };

  const handleBroadcast = async () => {
    if (selectedTimes.length === 0) {
      alert('Please select at least one time slot');
      return;
    }

    if (!broadcastTitle.trim()) {
      alert('Please enter a title for the broadcast');
      return;
    }

    try {
      setLoading(true);
      const response = await smartSchedulerService.broadcastMeetingTimes({
        meetingTimes: selectedTimes,
        title: broadcastTitle,
        description: broadcastDescription
      });

      alert(`Meeting times broadcasted to ${response.notifiedStudents} students`);
      
      // Reset form
      setSelectedTimes([]);
      setBroadcastTitle('');
      setBroadcastDescription('');
    } catch (error) {
      console.error('Error broadcasting meeting times:', error);
      alert('Failed to broadcast meeting times');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTime: string, timezone?: string) => {
    const date = new Date(dateTime);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone || selectedTimezone
    };
    return date.toLocaleString('en-US', options);
  };

  const formatTimeOnly = (dateTime: string, timezone?: string) => {
    const date = new Date(dateTime);
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone || selectedTimezone
    };
    return date.toLocaleTimeString('en-US', options);
  };

  const getTimezoneOffset = (timezone: string) => {
    const tz = timezones.find(t => t.value === timezone);
    return tz ? tz.offset : '+00:00';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <SparklesIcon className="h-8 w-8 text-blue-600 mr-3" />
              AI Smart Meeting Scheduler
            </h2>
            <p className="text-gray-600">AI-powered scheduling with natural language processing and intelligent insights.</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setAiMode(!aiMode)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                aiMode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <LightBulbIcon className="h-4 w-4 mr-2" />
              AI Mode
            </button>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center"
            >
              <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
              Templates
            </button>
            <button
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
              Advanced
            </button>
          </div>
        </div>

        {/* AI Natural Language Input */}
        {aiMode && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600 mr-2" />
              AI Assistant
            </h3>
            <div className="flex space-x-2">
              <input
                type="text"
                value={naturalLanguageInput}
                onChange={(e) => setNaturalLanguageInput(e.target.value)}
                placeholder="Try: 'Schedule morning Quran sessions for next week' or 'Book evening classes for 90 minutes'"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                onKeyPress={(e) => e.key === 'Enter' && handleNaturalLanguageInput()}
              />
              <button
                onClick={handleNaturalLanguageInput}
                disabled={loading || !naturalLanguageInput.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <SparklesIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              💡 Try natural language commands like "schedule morning sessions" or "book evening classes"
            </p>
          </div>
        )}

        {/* AI Insights */}
        {showAIInsights && aiInsights && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <ChartBarIcon className="h-5 w-5 text-green-600 mr-2" />
                AI Insights
              </h3>
              <button
                onClick={() => setShowAIInsights(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Insights</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {aiInsights.insights.map((insight, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {aiInsights.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <LightBulbIcon className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <strong>Confidence:</strong> {Math.round(aiInsights.confidence * 100)}%
            </div>
          </div>
        )}

        {/* Templates Section */}
        {showTemplates && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Start Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {schedulingTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedTemplate === template.id
                      ? 'border-purple-500 bg-purple-100'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">{template.icon}</span>
                    <span className="font-medium text-gray-900">{template.name}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                  
                  {/* Time Slots Preview */}
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Will generate slots at:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.timeSlots.slice(0, 4).map((time, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          {time}
                        </span>
                      ))}
                      {template.timeSlots.length > 4 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{template.timeSlots.length - 4}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {template.frequency === 'daily' ? 'Every day' : 
                       template.frequency === 'weekly' ? 'Weekly' :
                       template.frequency === 'bi-weekly' ? 'Bi-weekly' :
                       template.frequency === 'monthly' ? 'Monthly' : template.frequency}
                    </p>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{template.duration} min</span>
                    <span>{template.daysAhead} days</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Options */}
        {showAdvancedOptions && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Advanced Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <GlobeAltIcon className="h-4 w-4 inline mr-1" />
                  Timezone
                </label>
                <select
                  value={selectedTimezone}
                  onChange={(e) => setSelectedTimezone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label} ({tz.offset})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setBulkSelectMode(!bulkSelectMode)}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    bulkSelectMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {bulkSelectMode ? 'Bulk Select Mode ON' : 'Enable Bulk Select'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meeting Duration (minutes)
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          >
            <option value={30}>30 minutes</option>
            <option value={60}>60 minutes</option>
            <option value={90}>90 minutes</option>
            <option value={120}>120 minutes</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Days Ahead
          </label>
          <select
            value={daysAhead}
            onChange={(e) => setDaysAhead(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={21}>21 days</option>
            <option value={30}>30 days</option>
          </select>
        </div>
      </div>

      {/* Optimal Times */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedTemplate ? 'Template Generated Times' : 'All-Day Available Times'}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {optimalTimes.length} available slots
            </span>
            {selectedTemplate && (
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                  Template: {schedulingTemplates.find(t => t.id === selectedTemplate)?.name}
                </span>
                <button
                  onClick={() => {
                    setSelectedTemplate('');
                    setBroadcastTitle('');
                    setBroadcastDescription('');
                    loadOptimalTimes();
                  }}
                  className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                  title="Clear template and load optimal times"
                >
                  Clear Template
                </button>
              </div>
            )}
            {bulkSelectMode && (
              <button
                onClick={handleBulkSelect}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                Select All Available
              </button>
            )}
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
            <p className="text-sm text-blue-800">
              {selectedTemplate ? (
                <>
                  <strong>Template Generated:</strong> Time slots are generated based on your selected template pattern. 
                  Existing broadcasts are automatically excluded to prevent conflicts.
                </>
              ) : (
                <>
                  <strong>All-Day Availability:</strong> Time slots are available throughout the day (9 AM - 8 PM) on weekdays. 
                  Existing broadcasts are automatically excluded to prevent conflicts.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Conflict Messages */}
        {conflicts.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center mb-2">
              <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
              <span className="font-medium text-red-800">Conflicts Detected</span>
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              {conflicts.map((conflict, index) => (
                <li key={index}>• {conflict}</li>
              ))}
            </ul>
          </div>
        )}

        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Finding optimal times...</p>
          </div>
        ) : optimalTimes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No optimal times found for the selected criteria.</p>
            <button
              onClick={loadOptimalTimes}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {optimalTimes.slice(0, 9).map((time, index) => {
              const hasConflict = checkForConflicts({
                start: time.start,
                end: time.end,
                duration: time.duration,
                maxParticipants: 1
              });
              
              return (
                <div
                  key={index}
                  className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                    hasConflict
                      ? 'border-red-300 bg-red-50 hover:border-red-400'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                  }`}
                  onClick={() => handleTimeSelect(time)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <CalendarIcon className="h-4 w-4 text-gray-500 mr-2" />
                        <p className="font-medium text-gray-900">
                          {formatDateTime(time.start)}
                        </p>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>{time.duration} minutes</span>
                        <span className="mx-2">•</span>
                        <span className="text-xs">
                          {getTimezoneOffset(selectedTimezone)}
                        </span>
                      </div>
                      {time.confidence && (
                        <div className="mt-1 text-xs text-blue-600">
                          AI Confidence: {Math.round(time.confidence * 100)}%
                        </div>
                      )}
                      {time.reasoning && (
                        <div className="mt-1 text-xs text-gray-500">
                          {time.reasoning}
                        </div>
                      )}
                      {hasConflict && (
                        <div className="mt-2 flex items-center text-red-600 text-xs">
                          <XCircleIcon className="h-3 w-3 mr-1" />
                          <span>Conflict detected</span>
                        </div>
                      )}
                    </div>
                    <div className="ml-2">
                      {hasConflict ? (
                        <XCircleIcon className="h-5 w-5 text-red-500" />
                      ) : (
                        <PlusIcon className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Times */}
      {selectedTimes.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Selected Times ({selectedTimes.length})
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={clearAllSelections}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={() => setBulkSelectMode(!bulkSelectMode)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  bulkSelectMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {bulkSelectMode ? 'Exit Bulk Mode' : 'Bulk Select'}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            {selectedTimes.map((time, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center flex-1">
                  <div className="p-2 bg-blue-100 rounded-full mr-4">
                    <ClockIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <CalendarIcon className="h-4 w-4 text-gray-500 mr-2" />
                      <p className="font-medium text-gray-900">
                        {formatDateTime(time.start)}
                      </p>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span>{time.duration} minutes</span>
                      <span className="mx-2">•</span>
                      <span className="text-xs">
                        {getTimezoneOffset(selectedTimezone)}
                      </span>
                    </div>
                    {time.confidence && (
                      <div className="mt-1 text-xs text-blue-600">
                        AI Confidence: {Math.round(time.confidence * 100)}%
                      </div>
                    )}
                    {time.reasoning && (
                      <div className="mt-1 text-xs text-gray-500">
                        {time.reasoning}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Selected
                  </span>
                  <button
                    onClick={() => handleTimeRemove(index)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition-colors"
                    title="Remove this time slot"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Broadcast Form */}
      {selectedTimes.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Broadcast Details</h3>
            {selectedTemplate && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                Using template: {schedulingTemplates.find(t => t.id === selectedTemplate)?.name}
              </span>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Broadcast Title *
              </label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="e.g., Weekly Islamic Guidance Sessions"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                required
              />
              {selectedTemplate && (
                <p className="text-xs text-purple-600 mt-1">
                  Title prefilled from template. You can modify it as needed.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={broadcastDescription}
                onChange={(e) => setBroadcastDescription(e.target.value)}
                placeholder="Add any additional details about the meetings..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <button
            onClick={loadOptimalTimes}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center"
          >
            <ClockIcon className="h-4 w-4 mr-2" />
            {selectedTemplate ? 'Refresh Template Times' : 'Refresh Times'}
          </button>
          
          {selectedTimes.length > 0 && (
            <button
              onClick={clearAllSelections}
              className="px-4 py-2 border border-red-300 rounded-md text-red-700 hover:bg-red-50 flex items-center"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Clear All
            </button>
          )}
        </div>

        {selectedTimes.length > 0 && (
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="text-sm text-gray-600 flex items-center">
              <UsersIcon className="h-4 w-4 mr-1" />
              {selectedTimes.length} time slot{selectedTimes.length !== 1 ? 's' : ''} selected
            </div>
            <button
              onClick={handleBroadcast}
              disabled={loading || !broadcastTitle.trim()}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 flex items-center shadow-lg"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <UsersIcon className="h-4 w-4 mr-2" />
              )}
              Broadcast to Students
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AISmartScheduler;
