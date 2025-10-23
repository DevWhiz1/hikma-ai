import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  ClockIcon, 
  UserGroupIcon, 
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  CalendarIcon,
  AcademicCapIcon,
  TrendingUpIcon,
  TrendingDownIcon
} from '@heroicons/react/24/outline';
import enhancedMeetingService from '../../services/enhancedMeetingService';

interface AnalyticsData {
  totalMeetings: number;
  completedMeetings: number;
  cancelledMeetings: number;
  averageDuration: number;
  completionRate: number;
  popularTopics: { [key: string]: number };
  timeDistribution: { [key: string]: number };
  scholarPerformance?: {
    totalSessions: number;
    averageSessionDuration: number;
    completionRate: number;
    mostPopularTopics: Array<{ topic: string; count: number }>;
  };
  studentEngagement?: {
    totalSessions: number;
    averageSessionDuration: number;
    completionRate: number;
    preferredTopics: Array<{ topic: string; count: number }>;
  };
}

interface AIInsights {
  insights: string;
}

const EnhancedMeetingAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [analyticsData, insightsData] = await Promise.all([
        enhancedMeetingService.getMeetingAnalytics(timeRange),
        enhancedMeetingService.getMeetingInsights(undefined, timeRange)
      ]);

      setAnalytics(analyticsData.analytics);
      setAiInsights(insightsData.insights);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      setError(error.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompletionRateIcon = (rate: number) => {
    if (rate >= 90) return <TrendingUpIcon className="h-5 w-5 text-green-600" />;
    if (rate >= 70) return <TrendingUpIcon className="h-5 w-5 text-yellow-600" />;
    return <TrendingDownIcon className="h-5 w-5 text-red-600" />;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <XCircleIcon className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Analytics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
          <p className="text-gray-600">No meeting data available for the selected time range.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Enhanced Meeting Analytics</h2>
            <p className="text-gray-600">AI-powered insights into your meeting performance and student engagement.</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button
              onClick={loadAnalytics}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <SparklesIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-xl">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Meetings</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalMeetings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.completedMeetings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(analytics.averageDuration)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-xl">
              {getCompletionRateIcon(analytics.completionRate)}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className={`text-2xl font-bold ${getCompletionRateColor(analytics.completionRate)}`}>
                {analytics.completionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {aiInsights && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-4">
            <SparklesIcon className="h-6 w-6 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">AI-Powered Insights</h3>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-line">{aiInsights}</p>
          </div>
        </div>
      )}

      {/* Popular Topics */}
      {Object.keys(analytics.popularTopics).length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Meeting Topics</h3>
          <div className="space-y-3">
            {Object.entries(analytics.popularTopics)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([topic, count]) => (
                <div key={topic} className="flex items-center justify-between">
                  <span className="text-gray-700">{topic}</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(count / Math.max(...Object.values(analytics.popularTopics))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Time Distribution */}
      {Object.keys(analytics.timeDistribution).length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Meeting Time Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(analytics.timeDistribution)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 8)
              .map(([timeSlot, count]) => (
                <div key={timeSlot} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">{timeSlot}</p>
                  <p className="text-lg font-bold text-gray-900">{count}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Scholar Performance */}
      {analytics.scholarPerformance && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Scholar Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <AcademicCapIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.scholarPerformance.totalSessions}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <ClockIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(analytics.scholarPerformance.averageSessionDuration)}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <CheckCircleIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.scholarPerformance.completionRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Student Engagement */}
      {analytics.studentEngagement && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Engagement</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <UserGroupIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.studentEngagement.totalSessions}</p>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <ClockIcon className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(analytics.studentEngagement.averageSessionDuration)}</p>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <CheckCircleIcon className="h-8 w-8 text-pink-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.studentEngagement.completionRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedMeetingAnalytics;
