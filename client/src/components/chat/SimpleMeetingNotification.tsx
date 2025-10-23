import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDaysIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface SimpleMeetingNotificationProps {
  scholarName: string;
  meetingCount: number;
}

const SimpleMeetingNotification: React.FC<SimpleMeetingNotificationProps> = ({ 
  scholarName, 
  meetingCount 
}) => {
  const navigate = useNavigate();

  const handleViewClasses = () => {
    navigate('/available-meetings');
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-xl p-5 shadow-md">
      <div className="flex items-center space-x-3 mb-3">
        <div className="p-2 bg-blue-100 rounded-full">
          <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-blue-900">
            Slots Posted - Book Yours!
          </h3>
          <p className="text-sm text-blue-700">
            by <span className="font-semibold">{scholarName}</span>
          </p>
        </div>
      </div>

      <p className="text-gray-700 mb-4">
        <strong>Slots posted, book yours!</strong> {scholarName} has posted {meetingCount} new class time(s) available for booking.
      </p>

      <button
        onClick={handleViewClasses}
        className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all duration-200 flex items-center shadow-md"
      >
        <ArrowRightIcon className="h-5 w-5 mr-2" />
        Book Your Slot
      </button>
    </div>
  );
};

export default SimpleMeetingNotification;
