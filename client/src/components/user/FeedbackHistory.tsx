import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, Clock, CheckCircle, AlertCircle, XCircle, Loader } from 'lucide-react';
import { feedbackService, FeedbackListResponse } from '../../services/feedbackService';

interface FeedbackHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackHistory: React.FC<FeedbackHistoryProps> = ({ isOpen, onClose }) => {
  const [feedback, setFeedback] = useState<FeedbackListResponse['feedback']>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categories = {
    bug: { label: 'Bug Report', icon: '🐛', color: 'bg-red-100 text-black dark:bg-red-900/20 dark:text-red-200' },
    feature: { label: 'Feature Request', icon: '💡', color: 'bg-blue-100 text-black dark:bg-blue-900/20 dark:text-blue-200' },
    ui: { label: 'UI/UX Issue', icon: '🎨', color: 'bg-purple-100 text-black dark:bg-purple-900/20 dark:text-purple-200' },
    performance: { label: 'Performance', icon: '⚡', color: 'bg-yellow-100 text-black dark:bg-yellow-900/20 dark:text-yellow-200' },
    security: { label: 'Security Concern', icon: '🔒', color: 'bg-orange-100 text-black dark:bg-orange-900/20 dark:text-orange-200' },
    general: { label: 'General Feedback', icon: '💬', color: 'bg-green-100 text-black dark:bg-green-900/20 dark:text-green-200' }
  };

  const statuses = {
    pending: { label: 'Pending', icon: Clock, color: 'text-black dark:text-blue-200', bgColor: 'bg-blue-100 dark:bg-blue-900/20' },
    in_progress: { label: 'In Progress', icon: Loader, color: 'text-black dark:text-yellow-200', bgColor: 'bg-yellow-100 dark:bg-yellow-900/20' },
    resolved: { label: 'Resolved', icon: CheckCircle, color: 'text-black dark:text-green-200', bgColor: 'bg-green-100 dark:bg-green-900/20' },
    closed: { label: 'Closed', icon: XCircle, color: 'text-black dark:text-gray-200', bgColor: 'bg-gray-100 dark:bg-gray-900/20' }
  };

  const priorities = {
    low: { label: 'Low', color: 'text-green-600' },
    medium: { label: 'Medium', color: 'text-yellow-600' },
    high: { label: 'High', color: 'text-orange-600' },
    critical: { label: 'Critical', color: 'text-red-600' }
  };

  const loadFeedback = async (pageNum: number = 1) => {
    setLoading(true);
    setError(null);
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to view your feedback history');
      setLoading(false);
      return;
    }
    
    try {
      const response = await feedbackService.getUserFeedback(pageNum, 10);
      setFeedback(response.feedback);
      setTotalPages(response.pagination.pages);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadFeedback(1);
    }
  }, [isOpen]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Feedback History
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Track your submitted feedback and responses
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading feedback...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <button
                  onClick={() => loadFeedback(page)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : feedback.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">No feedback submitted yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Submit your first feedback to see it here
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Feedback List */}
              <div className="space-y-4">
                {feedback.map((item) => {
                  const category = categories[item.category as keyof typeof categories] || { 
                    label: item.category, 
                    icon: '📝', 
                    color: 'bg-gray-100 text-black dark:bg-gray-900/20 dark:text-gray-200' 
                  };
                  const status = statuses[item.status as keyof typeof statuses] || { 
                    label: item.status, 
                    icon: Clock, 
                    color: 'text-black dark:text-gray-200',
                    bgColor: 'bg-gray-100 dark:bg-gray-900/20'
                  };
                  const priority = priorities[item.priority as keyof typeof priorities] || { 
                    label: item.priority, 
                    color: 'text-gray-600' 
                  };
                  const StatusIcon = status.icon;

                  return (
                    <div
                      key={item._id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{category.icon}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {item.subject}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.color}`}>
                                {category.label}
                              </span>
                              <span className={`text-xs font-medium ${priority.color}`}>
                                {priority.label} Priority
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
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

                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </span>
                          <span>{formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-6">
                  <button
                    onClick={() => loadFeedback(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    Previous
                  </button>
                  
                  <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                    Page {page} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => loadFeedback(page + 1)}
                    disabled={page === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackHistory;
