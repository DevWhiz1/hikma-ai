import React, { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  PlayIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import smartSchedulerService from '../../services/smartSchedulerService';

interface MeetingAccessProps {
  meetingId: string;
  onAccessGranted?: () => void;
  onAccessDenied?: () => void;
}

interface AccessInfo {
  isActive: boolean;
  isUpcoming: boolean;
  isPast: boolean;
  canEnter: boolean;
  timeUntilStart: number;
  timeUntilEnd: number;
  meetingStart: string;
  meetingEnd: string;
  currentTime: string;
}

interface MeetingInfo {
  id: string;
  title: string;
  scholar: {
    name: string;
    email: string;
  };
  student: {
    name: string;
    email: string;
  };
  scheduledTime: string;
  duration: number;
  meetingLink: string;
  status: string;
}

const MeetingAccess: React.FC<MeetingAccessProps> = ({ 
  meetingId, 
  onAccessGranted, 
  onAccessDenied 
}) => {
  const [accessInfo, setAccessInfo] = useState<AccessInfo | null>(null);
  const [meetingInfo, setMeetingInfo] = useState<MeetingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    validateAccess();
    // Set up interval to check access every 30 seconds
    const interval = setInterval(validateAccess, 30000);
    return () => clearInterval(interval);
  }, [meetingId]);

  useEffect(() => {
    if (accessInfo?.isUpcoming && accessInfo.timeUntilStart > 0) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const startTime = new Date(accessInfo.meetingStart).getTime();
        const timeLeft = startTime - now;
        
        if (timeLeft <= 0) {
          setCountdown('Meeting is starting now!');
          validateAccess(); // Re-validate access
        } else {
          const hours = Math.floor(timeLeft / (1000 * 60 * 60));
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
          setCountdown(`${hours}h ${minutes}m ${seconds}s`);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [accessInfo]);

  const validateAccess = async () => {
    try {
      setLoading(true);
      const response = await smartSchedulerService.validateMeetingAccess(meetingId);
      
      if (response.success) {
        setAccessInfo(response.access);
        setMeetingInfo(response.meeting);
        setError(null);
        
        // Call appropriate callbacks
        if (response.access.canEnter && onAccessGranted) {
          onAccessGranted();
        } else if (!response.access.canEnter && onAccessDenied) {
          onAccessDenied();
        }
      } else {
        setError(response.error || 'Failed to validate meeting access');
      }
    } catch (err) {
      setError('Failed to validate meeting access');
      console.error('Error validating meeting access:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeeting = () => {
    if (accessInfo?.canEnter && meetingInfo?.meetingLink) {
      window.open(meetingInfo.meetingLink, '_blank');
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Validating meeting access...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center">
          <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Access Error</h3>
            <p className="text-red-600 dark:text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!accessInfo || !meetingInfo) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Meeting Info */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {meetingInfo.title}
        </h2>
        <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
          <CalendarIcon className="h-5 w-5 mr-2" />
          <span>{formatTime(meetingInfo.scheduledTime)}</span>
        </div>
        <div className="flex items-center text-gray-600 dark:text-gray-400">
          <ClockIcon className="h-5 w-5 mr-2" />
          <span>{meetingInfo.duration} minutes</span>
        </div>
      </div>

      {/* Access Status */}
      <div className="mb-6">
        {accessInfo.canEnter ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                Meeting is Active
              </h3>
            </div>
            <p className="text-green-700 dark:text-green-300 mb-4">
              You can now join the meeting. Click the button below to enter.
            </p>
            <button
              onClick={handleJoinMeeting}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center"
            >
              <PlayIcon className="h-5 w-5 mr-2" />
              Join Meeting
            </button>
          </div>
        ) : accessInfo.isUpcoming ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-3" />
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                Meeting Not Started
              </h3>
            </div>
            <p className="text-yellow-700 dark:text-yellow-300 mb-2">
              The meeting will start at {formatTime(accessInfo.meetingStart)}
            </p>
            {countdown && (
              <p className="text-yellow-700 dark:text-yellow-300 font-semibold">
                Time remaining: {countdown}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <XCircleIcon className="h-6 w-6 text-gray-600 dark:text-gray-400 mr-3" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Meeting Ended
              </h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              This meeting has already ended at {formatTime(accessInfo.meetingEnd)}
            </p>
          </div>
        )}
      </div>

      {/* Meeting Details */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Meeting Details</h4>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div><strong>Scholar:</strong> {meetingInfo.scholar.name}</div>
          <div><strong>Student:</strong> {meetingInfo.student.name}</div>
          <div><strong>Status:</strong> {meetingInfo.status}</div>
        </div>
      </div>
    </div>
  );
};

export default MeetingAccess;
