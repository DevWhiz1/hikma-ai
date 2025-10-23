import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Star, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Loader, 
  RefreshCw,
  TrendingUp,
  Users,
  ThumbsUp
} from 'lucide-react';
import { feedbackService } from '../../services/feedbackService';

interface FeedbackItem {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  rating: number;
  category: string;
  subject: string;
  message: string;
  contactEmail?: string;
  priority: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface FeedbackStats {
  totalFeedback: number;
  averageRating: number;
  pendingCount: number;
  resolvedCount: number;
  categoryBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
}

const AdminFeedbackManagement: React.FC = () => {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({
    totalFeedback: 0,
    averageRating: 0,
    pendingCount: 0,
    resolvedCount: 0,
    categoryBreakdown: {},
    priorityBreakdown: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);

  const categories = {
    bug: { label: 'Bug Report', icon: '🐛', color: 'bg-emerald-100 text-black dark:bg-emerald-900/20 dark:text-emerald-200' },
    feature: { label: 'Feature Request', icon: '💡', color: 'bg-green-100 text-black dark:bg-green-900/20 dark:text-green-200' },
    ui: { label: 'UI/UX Issue', icon: '🎨', color: 'bg-teal-100 text-black dark:bg-teal-900/20 dark:text-teal-200' },
    performance: { label: 'Performance', icon: '⚡', color: 'bg-lime-100 text-black dark:bg-lime-900/20 dark:text-lime-200' },
    security: { label: 'Security Concern', icon: '🔒', color: 'bg-emerald-100 text-black dark:bg-emerald-900/20 dark:text-emerald-200' },
    general: { label: 'General Feedback', icon: '💬', color: 'bg-green-100 text-black dark:bg-green-900/20 dark:text-green-200' }
  };

  const statuses = {
    pending: { label: 'Pending', icon: Clock, color: 'text-black dark:text-emerald-200', bgColor: 'bg-emerald-100 dark:bg-emerald-900/20' },
    in_progress: { label: 'In Progress', icon: Loader, color: 'text-black dark:text-teal-200', bgColor: 'bg-teal-100 dark:bg-teal-900/20' },
    resolved: { label: 'Resolved', icon: CheckCircle, color: 'text-black dark:text-green-200', bgColor: 'bg-green-100 dark:bg-green-900/20' },
    closed: { label: 'Closed', icon: XCircle, color: 'text-black dark:text-gray-200', bgColor: 'bg-gray-100 dark:bg-gray-900/20' }
  };

  const priorities = {
    low: { label: 'Low', color: 'text-black dark:text-green-200', bgColor: 'bg-green-100 dark:bg-green-900/20' },
    medium: { label: 'Medium', color: 'text-black dark:text-teal-200', bgColor: 'bg-teal-100 dark:bg-teal-900/20' },
    high: { label: 'High', color: 'text-black dark:text-emerald-200', bgColor: 'bg-emerald-100 dark:bg-emerald-900/20' },
    critical: { label: 'Critical', color: 'text-black dark:text-lime-200', bgColor: 'bg-lime-100 dark:bg-lime-900/20' }
  };

  const loadFeedback = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await feedbackService.getAllFeedback(1, 50);
      const feedbackData = response.feedback || [];
      setFeedback(feedbackData);
      
      // Calculate stats
      const totalFeedback = feedbackData.length;
      const averageRating = totalFeedback > 0 
        ? feedbackData.reduce((sum: number, item: FeedbackItem) => sum + item.rating, 0) / totalFeedback 
        : 0;
      const pendingCount = feedbackData.filter((item: FeedbackItem) => item.status === 'pending').length;
      const resolvedCount = feedbackData.filter((item: FeedbackItem) => item.status === 'resolved').length;
      
      // Category breakdown
      const categoryBreakdown: Record<string, number> = {};
      feedbackData.forEach((item: FeedbackItem) => {
        categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1;
      });
      
      // Priority breakdown
      const priorityBreakdown: Record<string, number> = {};
      feedbackData.forEach((item: FeedbackItem) => {
        priorityBreakdown[item.priority] = (priorityBreakdown[item.priority] || 0) + 1;
      });
      
      setStats({
        totalFeedback,
        averageRating,
        pendingCount,
        resolvedCount,
        categoryBreakdown,
        priorityBreakdown
      });
      
    } catch (err) {
      console.error('Error loading feedback:', err);
      setError(err instanceof Error ? err.message : 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      setResolving(id);
      await feedbackService.updateFeedbackStatus(id, 'resolved');
      await loadFeedback(); // Refresh the data
    } catch (err) {
      console.error('Error resolving feedback:', err);
    } finally {
      setResolving(null);
    }
  };

  const handleInProgress = async (id: string) => {
    try {
      setResolving(id);
      await feedbackService.updateFeedbackStatus(id, 'in_progress');
      await loadFeedback(); // Refresh the data
    } catch (err) {
      console.error('Error updating feedback status:', err);
    } finally {
      setResolving(null);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingFeedback = feedback.filter(item => item.status === 'pending');
  const resolvedFeedback = feedback.filter(item => item.status === 'resolved');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading feedback...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Feedback Management</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and respond to user feedback
          </p>
        </div>
        <button
          onClick={loadFeedback}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <MessageSquare className="w-8 h-8 text-emerald-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Feedback</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalFeedback}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Star className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Rating</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.averageRating.toFixed(1)} ⭐
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.resolvedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category & Priority Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(stats.categoryBreakdown).map(([category, count]) => {
              const categoryInfo = categories[category as keyof typeof categories];
              return (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{categoryInfo?.icon}</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {categoryInfo?.label}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Priority Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(stats.priorityBreakdown).map(([priority, count]) => {
              const priorityInfo = priorities[priority as keyof typeof priorities];
              return (
                <div key={priority} className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${priorityInfo?.color}`}>
                    {priorityInfo?.label}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <span className="text-red-800 dark:text-red-200">{error}</span>
          </div>
          <div className="mt-4">
            <button 
              onClick={loadFeedback}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Pending Feedback Section */}
      {!error && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Pending Feedback ({pendingFeedback.length})
            </h3>
            
            {pendingFeedback.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">All Caught Up!</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No pending feedback at the moment.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingFeedback.map((item) => {
                  const category = categories[item.category as keyof typeof categories];
                  const priority = priorities[item.priority as keyof typeof priorities];

                  return (
                    <div
                      key={item._id}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <span className="text-2xl">{category.icon}</span>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {item.subject}
                            </h4>
                            <div className="flex items-center space-x-4 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.color}`}>
                                {category.label}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${priority.bgColor} ${priority.color}`}>
                                {priority.label} Priority
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                              <span>By: {item.user.name} ({item.user.role})</span>
                              <span>{formatDate(item.createdAt)}</span>
                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= item.rating
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleInProgress(item._id)}
                            disabled={resolving === item._id}
                            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors flex items-center space-x-1"
                          >
                            {resolving === item._id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Loader className="w-4 h-4" />
                            )}
                            <span>In Progress</span>
                          </button>
                          <button
                            onClick={() => handleResolve(item._id)}
                            disabled={resolving === item._id}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors flex items-center space-x-1"
                          >
                            {resolving === item._id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            <span>Resolve</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 line-clamp-3">
                        {item.message}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recently Resolved Section */}
          {resolvedFeedback.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Recently Resolved ({resolvedFeedback.length})
              </h3>
              <div className="space-y-4">
                {resolvedFeedback.slice(0, 5).map((item) => {
                  const category = categories[item.category as keyof typeof categories];
                  const priority = priorities[item.priority as keyof typeof priorities];

                  return (
                    <div
                      key={item._id}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <span className="text-xl">{category.icon}</span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {item.subject}
                            </h4>
                            <div className="flex items-center space-x-3 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.color}`}>
                                {category.label}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-black dark:bg-green-900/20 dark:text-green-200">
                                Resolved
                              </span>
                            </div>
                            <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                              <span>By: {item.user.name}</span>
                              <span>{formatDate(item.createdAt)}</span>
                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3 h-3 ${
                                      star <= item.rating
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminFeedbackManagement;
