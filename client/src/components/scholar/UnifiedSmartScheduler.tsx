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
  LightBulbIcon
} from '@heroicons/react/24/outline';
import smartSchedulerService from '../../services/smartSchedulerService';
import notificationService from '../../services/notificationService';
import aiAgentService from '../../services/aiAgentService';
import { authService } from '../../services/authService';

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

type SchedulerMode = 'manual' | 'ai';

const UnifiedSmartScheduler: React.FC = () => {
  const user = authService.getUser();
  const [mode, setMode] = useState<SchedulerMode>('manual');
  const [optimalTimes, setOptimalTimes] = useState<OptimalTime[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimes, setSelectedTimes] = useState<TimeSlot[]>([]);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastDescription, setBroadcastDescription] = useState('');
  const [duration, setDuration] = useState(60);
  const [daysAhead, setDaysAhead] = useState(14);
  const [existingBroadcasts, setExistingBroadcasts] = useState<any[]>([]);
  
  // UI state
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState('UTC');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showTemplates, setShowTemplates] = useState(false);
  
  // AI state
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [showAIInsights, setShowAIInsights] = useState(false);

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

  useEffect(() => {
    loadOptimalTimes();
    loadExistingBroadcasts();
  }, [selectedTemplate, mode]);

  // FIXED: Generate time slots from template with proper date handling
  const generateTimeSlotsFromTemplate = (template: SchedulingTemplate): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + template.daysAhead);

    let currentDate = new Date(now);
    currentDate.setHours(0, 0, 0, 0);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      
      const shouldIncludeDay = 
        template.id === 'weekend-intensive' 
          ? (dayOfWeek === 0 || dayOfWeek === 6)
          : (dayOfWeek !== 0 && dayOfWeek !== 6);
      
      if (shouldIncludeDay) {
        template.timeSlots.forEach(timeStr => {
          const [hours, minutes] = timeStr.split(':').map(Number);
          const slotDate = new Date(currentDate);
          slotDate.setHours(hours, minutes, 0, 0);

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
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    slots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    
    console.log(`Generated ${slots.length} slots from template "${template.name}"`, {
      timeSlots: template.timeSlots,
      duration: template.duration,
      firstFewSlots: slots.slice(0, 3).map(s => ({
        start: new Date(s.start).toLocaleString(),
        duration: s.duration
      }))
    });
    
    return slots;
  };

  const generateAllDayTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + daysAhead);

    const timeSlots = [
      '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
      '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
    ];

    let currentDate = new Date(now);
    currentDate.setHours(0, 0, 0, 0);
    
    while (currentDate <= endDate) {
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        timeSlots.forEach(timeStr => {
          const [hours, minutes] = timeStr.split(':').map(Number);
          const slotDate = new Date(currentDate);
          slotDate.setHours(hours, minutes, 0, 0);

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
      currentDate.setDate(currentDate.getDate() + 1);
    }

    slots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    return slots.slice(0, 12);
  };

  const loadOptimalTimes = async () => {
    try {
      setLoading(true);
      
      if (mode === 'ai' && user?.id) {
        try {
          const aiSuggestions = await aiAgentService.suggestOptimalTimes(user.id, duration, daysAhead);
          setOptimalTimes(aiSuggestions);
          return;
        } catch (aiError) {
          console.warn('AI suggestions failed, falling back to manual:', aiError);
        }
      }
      
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

  const loadExistingBroadcasts = async () => {
    try {
      const broadcasts = await smartSchedulerService.getScholarBroadcasts();
      setExistingBroadcasts(broadcasts.broadcasts || []);
    } catch (error) {
      console.error('Error loading broadcasts:', error);
    }
  };

  const handleTemplateSelect = (template: SchedulingTemplate) => {
    console.log('Template selected:', template.name, {
      timeSlots: template.timeSlots,
      duration: template.duration,
      daysAhead: template.daysAhead
    });
    
    setDuration(template.duration);
    setDaysAhead(template.daysAhead);
    setSelectedTemplate(template.id);
    setBroadcastTitle(template.name);
    setBroadcastDescription(template.description);
    setShowTemplates(false);
    setSelectedTimes([]);
    
    const templateSlots = generateTimeSlotsFromTemplate(template);
    setOptimalTimes(templateSlots.map(slot => ({
      start: slot.start,
      end: slot.end,
      duration: slot.duration
    })));
  };

  const handleTimeSelect = (time: OptimalTime) => {
    const isSelected = selectedTimes.some(t => t.start === time.start);
    
    if (isSelected) {
      setSelectedTimes(selectedTimes.filter(t => t.start !== time.start));
    } else {
      setSelectedTimes([...selectedTimes, {
        start: time.start,
        end: time.end,
        duration: time.duration,
        maxParticipants: 1
      }]);
    }
  };

  const handleProcessNaturalLanguage = async () => {
    if (!naturalLanguageInput.trim() || !user?.id) return;
    
    try {
      setLoading(true);
      const result = await aiAgentService.processNaturalLanguageScheduling(user.id, naturalLanguageInput);
      
      if (result.timeSlot) {
        setSelectedTimes([result.timeSlot]);
        setBroadcastTitle(result.title || 'AI Suggested Meeting');
        setBroadcastDescription(result.description || '');
        setDuration(result.timeSlot.duration);
      }
      
      setNaturalLanguageInput('');
      alert('AI processed your request successfully!');
    } catch (error) {
      console.error('Error processing natural language:', error);
      alert('Failed to process your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBroadcast = async () => {
    if (!broadcastTitle || selectedTimes.length === 0) {
      alert('Please provide a title and select at least one time slot');
      return;
    }

    try {
      setLoading(true);
      await smartSchedulerService.createBroadcast({
        title: broadcastTitle,
        description: broadcastDescription,
        meetingTimes: selectedTimes,
        timezone: selectedTimezone
      });
      
      // Ask to notify students
      const notify = window.confirm('Broadcast created. Do you want to notify all enrolled students now?');
      if (notify) {
        try {
          const msg = `${broadcastTitle} — New sessions available. ${broadcastDescription || ''}`.trim();
          await notificationService.sendSmart({ text: msg, audience: 'all' });
        } catch (_) { /* best effort */ }
      }

      alert('Broadcast created successfully!');
      setBroadcastTitle('');
      setBroadcastDescription('');
      setSelectedTimes([]);
      setSelectedTemplate('');
      loadExistingBroadcasts();
    } catch (error) {
      console.error('Error creating broadcast:', error);
      alert('Failed to create broadcast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Mode Toggle */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Smart Scheduler</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Create and manage meeting broadcasts with AI assistance</p>
            </div>
            
            {/* Mode Toggle */}
            <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setMode('manual')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  mode === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <CalendarIcon className="h-5 w-5 inline-block mr-2" />
                Manual Mode
              </button>
              <button
                onClick={() => setMode('ai')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  mode === 'ai'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <SparklesIcon className="h-5 w-5 inline-block mr-2" />
                AI Mode
              </button>
            </div>
          </div>

          {/* AI Natural Language Input (AI Mode Only) */}
          {mode === 'ai' && (
            <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start space-x-4">
                <LightBulbIcon className="h-6 w-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI Scheduling Assistant</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Describe your scheduling needs in plain English, and AI will create the perfect schedule for you.
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={naturalLanguageInput}
                      onChange={(e) => setNaturalLanguageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleProcessNaturalLanguage()}
                      placeholder="e.g., 'Create morning sessions every weekday for the next 2 weeks'"
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      disabled={loading}
                    />
                    <button
                      onClick={handleProcessNaturalLanguage}
                      disabled={loading || !naturalLanguageInput.trim()}
                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                    >
                      <SparklesIcon className="h-5 w-5 inline-block mr-2" />
                      Process
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Configuration */}
          <div className="lg:col-span-1 space-y-6">
            {/* Broadcast Details */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Broadcast Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="Enter broadcast title"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                  <textarea
                    value={broadcastDescription}
                    onChange={(e) => setBroadcastDescription(e.target.value)}
                    placeholder="Enter broadcast description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Duration (minutes)</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    disabled={!!selectedTemplate}
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Days Ahead</label>
                  <select
                    value={daysAhead}
                    onChange={(e) => setDaysAhead(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    disabled={!!selectedTemplate}
                  >
                    <option value={7}>1 week</option>
                    <option value={14}>2 weeks</option>
                    <option value={30}>1 month</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <GlobeAltIcon className="h-4 w-4 inline-block mr-1" />
                    Timezone
                  </label>
                  <select
                    value={selectedTimezone}
                    onChange={(e) => setSelectedTimezone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  >
                    {timezones.map(tz => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label} ({tz.offset})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Templates */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Templates</h2>
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  {showTemplates ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                </button>
              </div>

              {showTemplates && (
                <div className="space-y-2">
                  {schedulingTemplates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedTemplate === template.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{template.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">{template.name}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">{template.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Times Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Selected Times ({selectedTimes.length})
              </h2>
              {selectedTimes.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedTimes.slice(0, 5).map((time, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {new Date(time.start).toLocaleString()}
                      </span>
                      <button
                        onClick={() => setSelectedTimes(selectedTimes.filter((_, i) => i !== index))}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircleIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {selectedTimes.length > 5 && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                      +{selectedTimes.length - 5} more
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">No times selected yet</p>
              )}
            </div>
          </div>

          {/* Right Column - Available Times */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {mode === 'ai' ? 'AI Suggested Times' : selectedTemplate ? 'Template Generated Times' : 'Available Times'}
                </h2>
                <button
                  onClick={loadOptimalTimes}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
                >
                  {loading ? 'Loading...' : 'Refresh Times'}
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-400 mt-4">Loading times...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
                  {optimalTimes.map((time, index) => {
                    const isSelected = selectedTimes.some(t => t.start === time.start);
                    return (
                      <button
                        key={index}
                        onClick={() => handleTimeSelect(time)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                            : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <ClockIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <span className="font-medium text-gray-900 dark:text-white">
                                {new Date(time.start).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(time.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {' - '}
                              {new Date(time.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {time.duration} minutes
                            </div>
                            {time.confidence && (
                              <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                                AI Confidence: {(time.confidence * 100).toFixed(0)}%
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <CheckCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Create Broadcast Button */}
            <div className="mt-6">
              <button
                onClick={handleCreateBroadcast}
                disabled={loading || !broadcastTitle || selectedTimes.length === 0}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg"
              >
                <PlusIcon className="h-6 w-6 inline-block mr-2" />
                Create Broadcast ({selectedTimes.length} time slots)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedSmartScheduler;

