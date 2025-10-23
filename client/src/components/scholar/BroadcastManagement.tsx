import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  UsersIcon, 
  TrashIcon,
  EyeIcon,
  XCircleIcon,
  CheckCircleIcon
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
  meetingTimes: MeetingTime[];
  status: string;
  createdAt: string;
  expiresAt: string;
}

const BroadcastManagement: React.FC = () => {
  const [broadcasts, setBroadcasts] = useState<BroadcastMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    loadBroadcasts();
  }, []);

  const loadBroadcasts = async () => {
    try {
      setLoading(true);
      const response = await smartSchedulerService.getScholarBroadcasts();
      setBroadcasts(response.broadcasts || []);
    } catch (error) {
      console.error('Error loading broadcasts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBroadcast = async (broadcastId: string) => {
    if (!confirm('Are you sure you want to cancel this broadcast? This action cannot be undone.')) {
      return;
    }

    try {
      setCancelling(broadcastId);
      await smartSchedulerService.cancelBroadcastMeeting({ broadcastId });
      alert('Broadcast cancelled successfully');
      loadBroadcasts(); // Refresh the list
    } catch (error: any) {
      console.error('Error cancelling broadcast:', error);
      alert(error.message || 'Failed to cancel broadcast');
    } finally {
      setCancelling(null);
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

  const getBookingStats = (meetingTimes: MeetingTime[]) => {
    const total = meetingTimes.length;
    const booked = meetingTimes.filter(time => time.isBooked).length;
    const available = total - booked;
    
    return { total, booked, available };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your broadcasts...</p>
        </div>
      </div>
    );
  }

  if (broadcasts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Broadcast Meetings</h3>
          <p className="text-gray-600">You haven't created any broadcast meetings yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Broadcast Management</h2>
        <p className="text-gray-600">Manage your broadcast meetings and track bookings.</p>
      </div>

      {broadcasts.map((broadcast) => {
        const stats = getBookingStats(broadcast.meetingTimes);
        const isExpiredBroadcast = isExpired(broadcast.expiresAt);

        return (
          <div key={broadcast._id} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{broadcast.title}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    broadcast.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : isExpiredBroadcast
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {broadcast.status === 'cancelled' ? 'Cancelled' : 
                     isExpiredBroadcast ? 'Expired' : 'Active'}
                  </span>
                </div>
                
                {broadcast.description && (
                  <p className="text-gray-600 mb-3">{broadcast.description}</p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="font-medium text-blue-900">Total Slots</span>
                    </div>
                    <p className="text-blue-700 font-semibold">{stats.total}</p>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                      <span className="font-medium text-green-900">Booked</span>
                    </div>
                    <p className="text-green-700 font-semibold">{stats.booked}</p>
                  </div>
                  
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 text-yellow-600 mr-2" />
                      <span className="font-medium text-yellow-900">Available</span>
                    </div>
                    <p className="text-yellow-700 font-semibold">{stats.available}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center">
                      <UsersIcon className="h-4 w-4 text-gray-600 mr-2" />
                      <span className="font-medium text-gray-900">Created</span>
                    </div>
                    <p className="text-gray-700 font-semibold">{formatDate(broadcast.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Meeting Times */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Meeting Times</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {broadcast.meetingTimes.map((time, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      time.isBooked
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDateTime(time.start)}
                        </p>
                        <p className="text-xs text-gray-600">
                          Duration: {time.duration} min
                        </p>
                      </div>
                      <div className="flex items-center">
                        {time.isBooked ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                    {time.isBooked && (
                      <p className="text-xs text-green-600 mt-1">
                        Booked
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <p>Expires: {formatDate(broadcast.expiresAt)}</p>
                <p>Created: {formatDate(broadcast.createdAt)}</p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => {/* View details */}}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View Details
                </button>
                
                {broadcast.status !== 'cancelled' && !isExpiredBroadcast && (
                  <button
                    onClick={() => handleCancelBroadcast(broadcast._id)}
                    disabled={cancelling === broadcast._id}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
                  >
                    {cancelling === broadcast._id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                    ) : (
                      <TrashIcon className="h-4 w-4 mr-1" />
                    )}
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BroadcastManagement;
