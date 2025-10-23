import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getScholars, enrollScholar, getMyEnrollments, startDirectChat } from '../../../services/scholarService';
import { meetingService } from '../../../services/meetingService';
import { 
  UserIcon,
  AcademicCapIcon,
  LanguageIcon,
  ClockIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  VideoCameraIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

interface Scholar {
  _id: string;
  user: { 
    _id: string; 
    name: string; 
    lockUntil?: string;
  };
  bio?: string;
  specializations?: string[];
  languages?: string[];
  experienceYears?: number;
  qualifications?: string;
  demoVideoUrl?: string;
  photoUrl?: string;
  createdAt: string;
}

const ScholarProfileView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scholar, setScholar] = useState<Scholar | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadScholar();
      checkEnrollment();
    }
  }, [id]);

  const loadScholar = async () => {
    try {
      const scholars = await getScholars();
      const foundScholar = scholars.find((s: Scholar) => s._id === id);
      if (foundScholar) {
        setScholar(foundScholar);
      } else {
        setError('Scholar not found');
      }
    } catch (error) {
      console.error('Failed to load scholar:', error);
      setError('Failed to load scholar profile');
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      const enrollments = await getMyEnrollments();
      const isEnrolled = enrollments.some((e: any) => e.scholar._id === id);
      setEnrolled(isEnrolled);
    } catch (error) {
      console.error('Failed to check enrollment:', error);
    }
  };

  const handleEnroll = async () => {
    if (!scholar) return;
    
    setEnrolling(true);
    try {
      await enrollScholar(scholar._id);
      setEnrolled(true);
      // Navigate to chat after enrollment
      const res = await startDirectChat(scholar._id);
      const sessionId = res?.studentSessionId;
      if (sessionId) {
        navigate(`/chat/${sessionId}`);
      }
    } catch (error: any) {
      console.error('Failed to enroll:', error);
      const message = error?.response?.data?.message || 'Failed to enroll with scholar';
      if (message.toLowerCase().includes('already enrolled')) {
        setEnrolled(true);
      } else {
        alert(message);
      }
    } finally {
      setEnrolling(false);
    }
  };

  const handleChat = async () => {
    if (!scholar) return;
    
    try {
      const res = await startDirectChat(scholar._id);
      const sessionId = res?.studentSessionId;
      if (sessionId) {
        navigate(`/chat/${sessionId}`);
      }
    } catch (error: any) {
      console.error('Failed to start chat:', error);
      const message = error?.response?.data?.message || 'Failed to start chat';
      alert(message);
    }
  };

  const handleScheduleMeeting = async () => {
    if (!scholar) return;
    
    try {
      const reason = prompt('Reason for meeting (optional):') || '';
      await meetingService.requestMeeting(scholar.user._id, reason.trim() || undefined);
      alert('Meeting request sent successfully!');
    } catch (error) {
      console.error('Failed to request meeting:', error);
      alert('Failed to request meeting. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading scholar profile...</p>
        </div>
      </div>
    );
  }

  if (error || !scholar) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900/20 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Scholar Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/scholars')}
            className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Back to Scholars
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900/20">
      <div className="px-6 py-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/scholars')}
            className="flex items-center text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mb-6 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Scholars
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              <img
                src={scholar.photoUrl || 'https://via.placeholder.com/120x120?text=Scholar'}
                alt={scholar.user.name}
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
              />
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{scholar.user.name}</h1>
                <p className="text-emerald-100 text-lg mb-2">Islamic Scholar</p>
                {scholar.experienceYears && (
                  <div className="flex items-center text-emerald-100">
                    <ClockIcon className="h-5 w-5 mr-2" />
                    <span>{scholar.experienceYears} years of experience</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col space-y-2">
                {enrolled ? (
                  <div className="flex items-center text-emerald-100">
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    <span className="text-sm">Enrolled</span>
                  </div>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling || Boolean(scholar.user.lockUntil)}
                    className="px-6 py-3 bg-white text-emerald-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8">
            {/* Bio */}
            {scholar.bio && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <UserIcon className="h-6 w-6 mr-2 text-emerald-600 dark:text-emerald-400" />
                  About
                </h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{scholar.bio}</p>
              </div>
            )}

            {/* Specializations */}
            {scholar.specializations && scholar.specializations.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <AcademicCapIcon className="h-6 w-6 mr-2 text-emerald-600 dark:text-emerald-400" />
                  Specializations
                </h2>
                <div className="flex flex-wrap gap-3">
                  {scholar.specializations.map((spec, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {scholar.languages && scholar.languages.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <LanguageIcon className="h-6 w-6 mr-2 text-emerald-600 dark:text-emerald-400" />
                  Languages
                </h2>
                <div className="flex flex-wrap gap-3">
                  {scholar.languages.map((lang, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Qualifications */}
            {scholar.qualifications && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <StarIcon className="h-6 w-6 mr-2 text-emerald-600 dark:text-emerald-400" />
                  Qualifications
                </h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{scholar.qualifications}</p>
              </div>
            )}

            {/* Demo Video */}
            {scholar.demoVideoUrl && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <VideoCameraIcon className="h-6 w-6 mr-2 text-emerald-600 dark:text-emerald-400" />
                  Demo Video
                </h2>
                <div className="relative rounded-lg overflow-hidden shadow-lg">
                  <a
                    href={scholar.demoVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative group"
                  >
                    <div className="aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <div className="text-center">
                        <PlayIcon className="h-16 w-16 text-emerald-600 dark:text-emerald-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-gray-600 dark:text-gray-400 font-medium">Watch Demo Video</p>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              {enrolled ? (
                <>
                  <button
                    onClick={handleChat}
                    className="flex-1 flex items-center justify-center px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-lg"
                  >
                    <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                    Chat with Scholar
                  </button>
                  <button
                    onClick={handleScheduleMeeting}
                    className="flex-1 flex items-center justify-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-lg"
                  >
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    Schedule Meeting
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling || Boolean(scholar.user.lockUntil)}
                  className="w-full flex items-center justify-center px-6 py-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {enrolling ? 'Enrolling...' : 'Enroll with Scholar'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScholarProfileView;
