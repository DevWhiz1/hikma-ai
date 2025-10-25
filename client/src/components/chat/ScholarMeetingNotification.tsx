import React from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  VideoCameraIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface ScholarMeetingNotificationProps {
  content: string;
  scholarName: string;
  meetingCount: number;
}

const ScholarMeetingNotification: React.FC<ScholarMeetingNotificationProps> = ({
  content,
  scholarName,
  meetingCount
}) => {
  const navigate = useNavigate();

  const handleViewMeetings = () => {
    navigate('/available-meetings');
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-full">
            <CalendarIcon className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900">
              📅 Meeting Times Posted
            </h3>
            <p className="text-sm text-green-700">
              You have posted {meetingCount} meeting time{meetingCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
          <ClockIcon className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">Live</span>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4 p-3 bg-white/70 rounded-lg border border-green-100">
        <p className="text-gray-700 text-sm">{content}</p>
      </div>

      {/* Action Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-green-700">
          <VideoCameraIcon className="h-4 w-4" />
          <span>Students can now book these meetings</span>
        </div>
        
        <button
          onClick={handleViewMeetings}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center"
        >
          View Available Meetings
          <ArrowRightIcon className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default ScholarMeetingNotification;
