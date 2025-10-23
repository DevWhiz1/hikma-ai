import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  UserIcon, 
  CheckCircleIcon,
  XCircleIcon,
  BookOpenIcon
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

interface BroadcastMeeting {
  _id: string;
  title: string;
  description: string;
  scholarId: {
    _id: string;
    name: string;
    email: string;
  };
  meetingTimes: MeetingTime[];
  status: string;
  createdAt: string;
  expiresAt: string;
}

const BroadcastMeetings: React.FC = () => {
  const [broadcasts, setBroadcasts] = useState<BroadcastMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadAvailableBroadcasts();
  }, []);

  const loadAvailableBroadcasts = async () => {
    try {
      setLoading(true);
      const response = await smartSchedulerService.getAvailableBroadcasts();
      setBroadcasts(response.broadcasts || []);
    } catch (error) {
      console.error('Error loading broadcast meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookMeeting = async (broadcastId: string, timeIndex: number) => {
    try {
      setBooking(prev => ({ ...prev, [`${broadcastId}-${timeIndex}`]: true }));
      
      await smartSchedulerService.bookBroadcastMeeting({
        broadcastId,
        timeIndex
      });

      alert('Meeting booked successfully!');
      loadAvailableBroadcasts(); // Refresh the list
    } catch (error: any) {
      console.error('Error booking meeting:', error);
      alert(error.message || 'Failed to book meeting');
    } finally {
      setBooking(prev => ({ ...prev, [`${broadcastId}-${timeIndex}`]: false }));
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  const formatDate = (dateTime: string) => {
    return new Date(dateTime).toLocaleDateString();
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getAvailableSlots = (meetingTimes: MeetingTime[]) => {
    return meetingTimes.filter(time => !time.isBooked);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading available meetings...</p>
        </div>
      </div>
    );
  }

  if (broadcasts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Available Meetings</h3>
          <p className="text-gray-600">There are currently no broadcast meetings available from your enrolled scholars.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Available Meeting Times</h2>
        <p className="text-gray-600">Book meetings with your enrolled scholars from their available time slots.</p>
      </div>

      {broadcasts.map((broadcast) => {
        const availableSlots = getAvailableSlots(broadcast.meetingTimes);
        const isExpiredBroadcast = isExpired(broadcast.expiresAt);

        return (
          <div key={broadcast._id} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{broadcast.title}</h3>
                <p className="text-sm text-gray-600 flex items-center mt-1">
                  <UserIcon className="h-4 w-4 mr-1" />
                  {broadcast.scholarId.name}
                </p>
                {broadcast.description && (
                  <p className="text-gray-600 mt-2">{broadcast.description}</p>
                )}
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isExpiredBroadcast 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {isExpiredBroadcast ? 'Expired' : 'Active'}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  Expires: {formatDate(broadcast.expiresAt)}
                </p>
              </div>
            </div>

            {availableSlots.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <XCircleIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>All time slots have been booked</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableSlots.map((time, index) => {
                  const originalIndex = broadcast.meetingTimes.findIndex(t => t === time);
                  const isBooking = booking[`${broadcast._id}-${originalIndex}`];

                  return (
                    <div
                      key={originalIndex}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <ClockIcon className="h-5 w-5 text-blue-600 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {formatDateTime(time.start)}
                          </span>
                        </div>
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </div>

                      <div className="text-sm text-gray-600 mb-3">
                        <p>Duration: {time.duration} minutes</p>
                        <p>Max Participants: {time.maxParticipants}</p>
                      </div>

                      <button
                        onClick={() => handleBookMeeting(broadcast._id, originalIndex)}
                        disabled={isBooking || isExpiredBroadcast}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isBooking ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Booking...
                          </>
                        ) : (
                          <>
                            <BookOpenIcon className="h-4 w-4 mr-2" />
                            Book Meeting
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {broadcast.meetingTimes.some(time => time.isBooked) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Booked Slots</h4>
                <div className="space-y-2">
                  {broadcast.meetingTimes
                    .filter(time => time.isBooked)
                    .map((time, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {formatDateTime(time.start)}
                        </span>
                        <span className="text-green-600 font-medium">
                          Booked
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BroadcastMeetings;
