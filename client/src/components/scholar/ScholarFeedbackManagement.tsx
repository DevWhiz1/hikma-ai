import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Loader, 
  RefreshCw,
  TrendingUp,
  BookOpen,
  GraduationCap,
  BarChart3,
  Search,
  Download,
  Reply,
  Heart,
  Target,
  Calendar
} from 'lucide-react';
import { scholarFeedbackService } from '../../services/scholarFeedbackService';

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

const ScholarFeedbackManagement: React.FC = () => {
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showAnalytics, setShowAnalytics] = useState(false);

  const categories = {
    teaching_quality: { label: 'Teaching Quality', icon: '🎓', color: 'bg-blue-100 text-black dark:bg-blue-900/20 dark:text-blue-200' },
    communication: { label: 'Communication', icon: '💬', color: 'bg-green-100 text-black dark:bg-green-900/20 dark:text-green-200' },
    knowledge: { label: 'Knowledge & Expertise', icon: '📚', color: 'bg-purple-100 text-black dark:bg-purple-900/20 dark:text-purple-200' },
    availability: { label: 'Availability', icon: '⏰', color: 'bg-yellow-100 text-black dark:bg-yellow-900/20 dark:text-yellow-200' },
    patience: { label: 'Patience & Understanding', icon: '🤲', color: 'bg-orange-100 text-black dark:bg-orange-900/20 dark:text-orange-200' },
    general: { label: 'General Feedback', icon: '💭', color: 'bg-gray-100 text-black dark:bg-gray-900/20 dark:text-gray-200' }
  };

  const statuses = {
    pending: { label: 'Pending', icon: Clock, color: 'text-black dark:text-blue-200', bgColor: 'bg-blue-100 dark:bg-blue-900/20' },
    in_progress: { label: 'In Progress', icon: Loader, color: 'text-black dark:text-yellow-200', bgColor: 'bg-yellow-100 dark:bg-yellow-900/20' },
    resolved: { label: 'Resolved', icon: CheckCircle, color: 'text-black dark:text-green-200', bgColor: 'bg-green-100 dark:bg-green-900/20' },
    closed: { label: 'Closed', icon: XCircle, color: 'text-black dark:text-gray-200', bgColor: 'bg-gray-100 dark:bg-gray-900/20' }
  };

  const priorities = {
    low: { label: 'Low', color: 'text-black dark:text-green-200', bgColor: 'bg-green-100 dark:bg-green-900/20' },
    medium: { label: 'Medium', color: 'text-black dark:text-yellow-200', bgColor: 'bg-yellow-100 dark:bg-yellow-900/20' },
    high: { label: 'High', color: 'text-black dark:text-orange-200', bgColor: 'bg-orange-100 dark:bg-orange-900/20' },
    critical: { label: 'Critical', color: 'text-black dark:text-red-200', bgColor: 'bg-red-100 dark:bg-red-900/20' }
  };

  const loadFeedback = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await scholarFeedbackService.getScholarReceivedFeedback(1, 50);
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
      await scholarFeedbackService.updateScholarFeedbackStatus(id, 'resolved');
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
      await scholarFeedbackService.updateScholarFeedbackStatus(id, 'in_progress');
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
    <div className="space-y-6 ml-4 pl-4 mr-4 pr-4 mt-6 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Scholar Feedback Management</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and respond to student feedback about your teaching
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

      {/* Search and Filter Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search feedback by subject, message, or student name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Categories</option>
              <option value="teaching_quality">Teaching Quality</option>
              <option value="communication">Communication</option>
              <option value="knowledge">Knowledge & Expertise</option>
              <option value="availability">Availability</option>
              <option value="patience">Patience & Understanding</option>
              <option value="general">General Feedback</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="rating_high">Highest Rating</option>
              <option value="rating_low">Lowest Rating</option>
              <option value="priority">Priority</option>
            </select>

            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              {showAnalytics ? 'Hide' : 'Show'} Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Analytics */}
      {showAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Performance Trends */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-emerald-600" />
              Performance Trends
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">This Month</span>
                <span className="text-lg font-semibold text-emerald-600">+12%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Response Time</span>
                <span className="text-lg font-semibold text-blue-600">2.3 days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Resolution Rate</span>
                <span className="text-lg font-semibold text-green-600">94%</span>
              </div>
            </div>
          </div>

          {/* Student Satisfaction */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-red-600" />
              Student Satisfaction
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">5 Stars</span>
                <span className="text-lg font-semibold text-yellow-600">68%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">4 Stars</span>
                <span className="text-lg font-semibold text-yellow-500">24%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">3 Stars</span>
                <span className="text-lg font-semibold text-yellow-400">6%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">2 Stars</span>
                <span className="text-lg font-semibold text-orange-400">2%</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-purple-600" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Export Feedback
              </button>
              <button className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Reply className="w-4 h-4 mr-2" />
                Send Response
              </button>
              <button className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Follow-up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-emerald-600" />
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
            <GraduationCap className="w-8 h-8 text-green-600" />
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
                              <span>From: {item.user.name} ({item.user.role})</span>
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
                              <span>From: {item.user.name}</span>
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

export default ScholarFeedbackManagement;
