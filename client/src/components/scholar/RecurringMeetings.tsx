import React, { useState, useEffect } from 'react';
import {
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import smartSchedulerService from '../../services/smartSchedulerService';
import { meetingService } from '../../services/meetingService';

interface RecurringMeeting {
  id: string;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  dayOfWeek?: number; // 0 = Sunday, 1 = Monday, etc.
  time: string; // HH:MM format
  duration: number; // in minutes
  maxParticipants: number;
  isActive: boolean;
  nextOccurrence: string;
  totalOccurrences: number;
  completedOccurrences: number;
  createdAt: string;
}

interface RecurringMeetingForm {
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  dayOfWeek: number;
  time: string;
  duration: number;
  maxParticipants: number;
}

const RecurringMeetings: React.FC = () => {
  const [recurringMeetings, setRecurringMeetings] = useState<RecurringMeeting[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RecurringMeetingForm>({
    title: '',
    description: '',
    frequency: 'weekly',
    dayOfWeek: 1,
    time: '10:00',
    duration: 60,
    maxParticipants: 1
  });

  useEffect(() => {
    loadRecurringMeetings();
  }, []);

  const loadRecurringMeetings = async () => {
    try {
      setLoading(true);
      // Load real recurring meeting data from backend
      const [dashboardData, broadcastsData] = await Promise.all([
        meetingService.getScholarDashboard(),
        smartSchedulerService.getScholarBroadcasts()
      ]);
      
      // Generate recurring meetings from real broadcast data
      const broadcasts = broadcastsData.broadcasts || [];
      const realRecurringMeetings: RecurringMeeting[] = broadcasts
        .filter((broadcast: any) => broadcast.meetingTimes && broadcast.meetingTimes.length > 1)
        .map((broadcast: any, index: number) => {
          const firstTime = new Date(broadcast.meetingTimes[0].start);
          const dayOfWeek = firstTime.getDay();
          const time = firstTime.toTimeString().slice(0, 5);
          
          return {
            id: broadcast._id || `recurring-${index + 1}`,
            title: broadcast.title || 'Recurring Meeting',
            description: broadcast.description || 'Regular meeting session',
            frequency: 'weekly', // Default frequency
            dayOfWeek: dayOfWeek,
            time: time,
            duration: broadcast.meetingTimes[0].duration || 60,
            maxParticipants: broadcast.meetingTimes[0].maxParticipants || 1,
            isActive: broadcast.status === 'active',
            nextOccurrence: broadcast.meetingTimes[0].start,
            totalOccurrences: broadcast.meetingTimes.length,
            completedOccurrences: broadcast.meetingTimes.filter((time: any) => time.isBooked).length,
            createdAt: broadcast.createdAt || new Date().toISOString()
          };
        });
      
      setRecurringMeetings(realRecurringMeetings);
    } catch (error) {
      console.error('Error loading recurring meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'dayOfWeek' || name === 'duration' || name === 'maxParticipants' 
        ? parseInt(value) 
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editingId) {
        // Update existing recurring meeting
        setRecurringMeetings(prev => prev.map(meeting => 
          meeting.id === editingId 
            ? { ...meeting, ...formData }
            : meeting
        ));
      } else {
        // Create new recurring meeting
        const newMeeting: RecurringMeeting = {
          id: Date.now().toString(),
          ...formData,
          isActive: true,
          nextOccurrence: calculateNextOccurrence(formData),
          totalOccurrences: 0,
          completedOccurrences: 0,
          createdAt: new Date().toISOString()
        };
        
        setRecurringMeetings(prev => [...prev, newMeeting]);
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving recurring meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateNextOccurrence = (data: RecurringMeetingForm): string => {
    const now = new Date();
    const [hours, minutes] = data.time.split(':').map(Number);
    
    let nextDate = new Date();
    nextDate.setHours(hours, minutes, 0, 0);
    
    if (data.frequency === 'daily') {
      if (nextDate <= now) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
    } else if (data.frequency === 'weekly') {
      const targetDay = data.dayOfWeek || 1;
      const currentDay = now.getDay();
      const daysUntilTarget = (targetDay - currentDay + 7) % 7;
      
      if (daysUntilTarget === 0 && nextDate <= now) {
        nextDate.setDate(nextDate.getDate() + 7);
      } else {
        nextDate.setDate(nextDate.getDate() + daysUntilTarget);
      }
    } else if (data.frequency === 'bi-weekly') {
      const targetDay = data.dayOfWeek || 1;
      const currentDay = now.getDay();
      const daysUntilTarget = (targetDay - currentDay + 7) % 7;
      
      if (daysUntilTarget === 0 && nextDate <= now) {
        nextDate.setDate(nextDate.getDate() + 14);
      } else {
        nextDate.setDate(nextDate.getDate() + daysUntilTarget);
      }
    } else if (data.frequency === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
    
    return nextDate.toISOString();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      frequency: 'weekly',
      dayOfWeek: 1,
      time: '10:00',
      duration: 60,
      maxParticipants: 1
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (meeting: RecurringMeeting) => {
    setFormData({
      title: meeting.title,
      description: meeting.description,
      frequency: meeting.frequency,
      dayOfWeek: meeting.dayOfWeek || 1,
      time: meeting.time,
      duration: meeting.duration,
      maxParticipants: meeting.maxParticipants
    });
    setEditingId(meeting.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this recurring meeting?')) {
      setRecurringMeetings(prev => prev.filter(meeting => meeting.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    setRecurringMeetings(prev => prev.map(meeting => 
      meeting.id === id 
        ? { ...meeting, isActive: !meeting.isActive }
        : meeting
    ));
  };

  const formatFrequency = (frequency: string) => {
    const frequencyMap = {
      daily: 'Daily',
      weekly: 'Weekly',
      'bi-weekly': 'Bi-weekly',
      monthly: 'Monthly'
    };
    return frequencyMap[frequency as keyof typeof frequencyMap] || frequency;
  };

  const formatDayOfWeek = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  if (loading && recurringMeetings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <CalendarIcon className="h-8 w-8 text-green-600 mr-3" />
            Recurring Meetings
          </h2>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Recurring Meeting
          </button>
        </div>
        <p className="text-gray-600">Set up recurring meeting series that automatically create time slots for your students.</p>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Recurring Meeting' : 'Create New Recurring Meeting'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency *
                </label>
                <select
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(formData.frequency === 'weekly' || formData.frequency === 'bi-weekly') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Day of Week *
                  </label>
                  <select
                    name="dayOfWeek"
                    value={formData.dayOfWeek}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                  >
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time *
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="15"
                  max="240"
                  step="15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recurring Meetings List */}
      <div className="space-y-4">
        {recurringMeetings.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No recurring meetings created yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Create Your First Recurring Meeting
            </button>
          </div>
        ) : (
          recurringMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className={`border rounded-lg p-6 transition-all ${
                meeting.isActive
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 mr-3">
                      {meeting.title}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        meeting.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {meeting.isActive ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  
                  {meeting.description && (
                    <p className="text-gray-600 mb-3">{meeting.description}</p>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-gray-700">
                        {formatFrequency(meeting.frequency)}
                        {meeting.dayOfWeek !== undefined && ` (${formatDayOfWeek(meeting.dayOfWeek)})`}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-gray-700">{formatTime(meeting.time)}</span>
                    </div>
                    <div className="flex items-center">
                      <UsersIcon className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-gray-700">{meeting.duration} min</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">Next:</span>
                      <span className="text-gray-700">
                        {new Date(meeting.nextOccurrence).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center text-sm text-gray-600">
                    <span className="mr-4">
                      {meeting.completedOccurrences}/{meeting.totalOccurrences} completed
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${(meeting.completedOccurrences / Math.max(meeting.totalOccurrences, 1)) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleToggleActive(meeting.id)}
                    className={`p-2 rounded-full transition-colors ${
                      meeting.isActive
                        ? 'text-orange-600 hover:bg-orange-100'
                        : 'text-green-600 hover:bg-green-100'
                    }`}
                    title={meeting.isActive ? 'Pause' : 'Resume'}
                  >
                    {meeting.isActive ? (
                      <PauseIcon className="h-4 w-4" />
                    ) : (
                      <PlayIcon className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(meeting)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                    title="Edit"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(meeting.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecurringMeetings;
