import React, { useState } from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  VideoCameraIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ArrowPathIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import smartSchedulerService from '../../services/smartSchedulerService';

interface MeetingTime {
  start: string;
  end: string;
  duration: number;
  maxParticipants: number;
  isBooked: boolean;
  bookedBy?: string;
  bookedAt?: string;
}

interface MeetingBroadcastMessageProps {
  content: string;
  meetingTimes: MeetingTime[];
  broadcastId: string;
  scholarName: string;
  onBookingSuccess?: () => void;
}

const MeetingBroadcastMessage: React.FC<MeetingBroadcastMessageProps> = ({
  content,
  meetingTimes,
  broadcastId,
  scholarName,
  onBookingSuccess
}) => {
  const [bookingTime, setBookingTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  const handleBookSlot = async (timeIndex: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await smartSchedulerService.bookBroadcastMeeting({
        broadcastId,
        timeIndex
      });

      if (response.success) {
        setBookingTime(meetingTimes[timeIndex].start);
        onBookingSuccess?.();
      } else {
        setError(response.message || 'Failed to book meeting slot');
      }
    } catch (error: any) {
      console.error('Error booking meeting:', error);
      setError(error.message || 'Failed to book meeting slot');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (timeIndex: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // This would open a reschedule dialog or redirect to reschedule page
      // For now, we'll just show a message
      alert('Reschedule functionality will be implemented soon!');
    } catch (error: any) {
      console.error('Error rescheduling meeting:', error);
      setError(error.message || 'Failed to reschedule meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 shadow-lg">
      {/* Header with Scholar Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-blue-900">
              📅 Meeting Times Available
            </h3>
            <p className="text-sm text-blue-700">
              from <span className="font-semibold">{scholarName}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
          <SparklesIcon className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">Live</span>
        </div>
      </div>

      {/* Content */}
      <div className="mb-6 p-4 bg-white/70 rounded-lg border border-blue-100">
        <p className="text-gray-700 whitespace-pre-line leading-relaxed">{content}</p>
      </div>

      {/* Meeting Times Grid */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-3">
          <UserGroupIcon className="h-5 w-5 text-gray-600" />
          <h4 className="font-semibold text-gray-800">Available Time Slots:</h4>
        </div>
        
        {meetingTimes.map((time, index) => (
          <div
            key={index}
            className={`relative border-2 rounded-xl p-4 transition-all duration-200 ${
              time.isBooked 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 shadow-md' 
                : 'bg-white border-blue-200 hover:border-blue-400 hover:shadow-md cursor-pointer'
            }`}
          >
            {/* Booked Badge */}
            {time.isBooked && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center">
                <CheckCircleIcon className="h-3 w-3 mr-1" />
                BOOKED
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${
                  time.isBooked ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  <ClockIcon className={`h-6 w-6 ${
                    time.isBooked ? 'text-green-600' : 'text-blue-600'
                  }`} />
                </div>
                
                <div>
                  <p className={`text-lg font-bold ${
                    time.isBooked ? 'text-green-800' : 'text-gray-900'
                  }`}>
                    {formatDateTime(time.start)}
                  </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className={`flex items-center ${
                      time.isBooked ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {time.duration} minutes
                    </span>
                    <span className="flex items-center text-gray-500">
                      <UserIcon className="h-4 w-4 mr-1" />
                      {time.maxParticipants} max
                    </span>
                  </div>
                  
                  {time.isBooked && (
                    <div className="mt-2 flex items-center text-green-700">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">You have this slot booked!</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {time.isBooked ? (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleReschedule(index)}
                      disabled={loading}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
                    >
                      <ArrowPathIcon className="h-4 w-4 mr-2" />
                      Reschedule
                    </button>
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Booked
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleBookSlot(index)}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 flex items-center shadow-md hover:shadow-lg"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ) : (
                      <VideoCameraIcon className="h-5 w-5 mr-2" />
                    )}
                    Book This Slot
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Success Message */}
      {bookingTime && (
        <div className="mt-6 p-4 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-xl">
          <div className="flex items-center">
            <div className="p-2 bg-green-500 rounded-full mr-3">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-green-800 font-semibold text-lg">
                🎉 Successfully Booked!
              </p>
              <p className="text-green-700">
                Your meeting is scheduled for <strong>{formatDateTime(bookingTime)}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 bg-gradient-to-r from-red-100 to-pink-100 border-2 border-red-300 rounded-xl">
          <div className="flex items-center">
            <div className="p-2 bg-red-500 rounded-full mr-3">
              <XCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-red-800 font-semibold">Booking Failed</p>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer with Tips */}
      <div className="mt-6 pt-4 border-t border-blue-200">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="p-1 bg-blue-200 rounded-full">
              <SparklesIcon className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">
                💡 Quick Tips:
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Click "Book This Slot" to reserve your preferred time</li>
                <li>• You can reschedule anytime before the meeting</li>
                <li>• Meeting links will be sent to your email</li>
                <li>• Booked slots show a green "BOOKED" badge</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingBroadcastMessage;
