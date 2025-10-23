import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  UserGroupIcon, 
  DocumentTextIcon, 
  ShieldCheckIcon, 
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  UserMinusIcon,
  UserPlusIcon,
  StarIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { getUsers, blockUser, unblockUser, getReviews, getSensitiveLogs, getScholarApplications, approveScholarApplication, rejectScholarApplication, removeScholarByUser, adminMessageUser } from '../../services/adminService';
import { authService } from '../../services/authService';
import AdminFeedbackManagement from './AdminFeedbackManagement';
import ScholarManagement from './ScholarManagement';
import PaymentManagement from './PaymentManagement';

type TabKey = 'users' | 'reviews' | 'logs' | 'applications' | 'feedback' | 'scholars' | 'payments';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  lockUntil?: string;
  createdAt: string;
}

interface ScholarApplication {
  _id: string;
  user: { name: string; email: string };
  bio: string;
  specializations: string[];
  languages: string[];
  experienceYears: number;
  qualifications: string;
  demoVideoUrl: string;
  photoUrl: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [applications, setApplications] = useState<ScholarApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('users');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, reviewsData, logsData, applicationsData] = await Promise.all([
        getUsers(),
        getReviews(),
        getSensitiveLogs(),
        getScholarApplications()
      ]);
      setUsers(usersData);
      setReviews(reviewsData);
      setLogs(logsData);
      setApplications(applicationsData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (user: User) => {
    setProcessing(user._id);
    try {
      if (user.lockUntil) {
        await unblockUser(user._id);
      } else {
        await blockUser(user._id);
      }
      await loadData();
    } catch (error) {
      console.error('Failed to toggle user block:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleApproveApplication = async (applicationId: string) => {
    setProcessing(applicationId);
    try {
      await approveScholarApplication(applicationId);
      await loadData();
    } catch (error) {
      console.error('Failed to approve application:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectApplication = async (applicationId: string) => {
    setProcessing(applicationId);
    try {
      await rejectScholarApplication(applicationId);
      await loadData();
    } catch (error) {
      console.error('Failed to reject application:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const tabs = [
    { key: 'users' as TabKey, label: 'Users', icon: UserGroupIcon, count: users.length },
    { key: 'scholars' as TabKey, label: 'Scholars', icon: UserGroupIcon, count: 0 },
    { key: 'reviews' as TabKey, label: 'Reviews', icon: DocumentTextIcon, count: reviews.length },
    { key: 'logs' as TabKey, label: 'Security Logs', icon: ShieldCheckIcon, count: logs.length },
    { key: 'applications' as TabKey, label: 'Scholar Applications', icon: ClipboardDocumentListIcon, count: applications.length },
    { key: 'payments' as TabKey, label: 'Payments', icon: DocumentTextIcon, count: 0 },
    { key: 'feedback' as TabKey, label: 'Feedback', icon: ChatBubbleLeftRightIcon, count: 0 }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
        </div>
    </div>
  );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900/20">
      {/* Admin Top Bar */}
      <div className="bg-emerald-600 dark:bg-emerald-700 shadow-lg">
        <div className="px-6 py-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Hikmah AI</h1>
                <p className="text-emerald-100 text-sm">Admin Panel</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/" 
                className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-medium rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Return to Main
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="p-6">
            <div className="flex items-center mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mr-3">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h2>
            </div>
            
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      activeTab === tab.key
                        ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center">
                      <IconComponent className="h-5 w-5 mr-3" />
                      <span className="font-medium">{tab.label}</span>
                    </div>
                    {tab.count > 0 && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        activeTab === tab.key
                          ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage users, applications, and platform security
            </p>
        </div>

          {/* Content */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">User Management</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Manage user accounts and permissions</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {users.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              user.role === 'admin' 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                : user.role === 'scholar'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              user.lockUntil 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                            }`}>
                              {user.lockUntil ? 'Blocked' : 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleBlock(user)}
                              disabled={processing === user._id}
                              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                user.lockUntil
                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                  : 'bg-red-600 hover:bg-red-700 text-white'
                              } disabled:opacity-50`}
                            >
                              {processing === user._id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              ) : user.lockUntil ? (
                                <UserPlusIcon className="h-4 w-4 mr-2" />
                              ) : (
                                <UserMinusIcon className="h-4 w-4 mr-2" />
                              )}
                              {user.lockUntil ? 'Unblock' : 'Block'}
                            </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
              </div>
            </div>
          )}

          {activeTab === 'scholars' && <ScholarManagement />}

          {activeTab === 'payments' && <PaymentManagement />}

          {activeTab === 'applications' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Scholar Applications</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Review and approve scholar applications</p>
                </div>
                <div className="p-6 space-y-6">
                  {applications.length === 0 ? (
                    <div className="text-center py-12">
                      <ClipboardDocumentListIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Applications</h3>
                      <p className="text-gray-600 dark:text-gray-400">No pending scholar applications at the moment.</p>
                    </div>
                  ) : (
                    applications.map((app) => (
                      <div key={app._id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <img
                              src={app.photoUrl || 'https://via.placeholder.com/60x60?text=Scholar'}
                              alt={app.user.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-emerald-200 dark:border-emerald-700"
                            />
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{app.user.name}</h3>
                              <p className="text-gray-600 dark:text-gray-400">{app.user.email}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-500">
                                {app.experienceYears} years of experience
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                            app.status === 'approved'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                              : app.status === 'rejected'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-gray-700 dark:text-gray-300 mb-3">{app.bio}</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {app.specializations.map((spec, index) => (
                              <span key={index} className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs rounded-full">
                                {spec}
                              </span>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {app.languages.map((lang, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                                {lang}
                              </span>
                            ))}
                          </div>
                        </div>

                        {app.status === 'pending' && (
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleApproveApplication(app._id)}
                              disabled={processing === app._id}
                              className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                              {processing === app._id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              ) : (
                                <CheckCircleIcon className="h-4 w-4 mr-2" />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectApplication(app._id)}
                              disabled={processing === app._id}
                              className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                              {processing === app._id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              ) : (
                                <XCircleIcon className="h-4 w-4 mr-2" />
                              )}
                              Reject
                            </button>
                            {app.demoVideoUrl && (
                              <a
                                href={app.demoVideoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                              >
                                <EyeIcon className="h-4 w-4 mr-2" />
                                View Demo
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <AdminFeedbackManagement />
          )}

          {/* Reviews Analytics */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Reviews Analytics</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Scholar feedback and rating statistics</p>
                </div>
                <div className="p-6">
                  {reviews.length === 0 ? (
                    <div className="text-center py-12">
                      <DocumentTextIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Reviews</h3>
                      <p className="text-gray-600 dark:text-gray-400">No reviews have been submitted yet.</p>
                    </div>
                  ) : (
            <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Scholar</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Reviews</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Average Rating</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Performance</th>
                  </tr>
                </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {reviews.map((review: any) => (
                            <tr key={review._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {review.scholarName || 'Unknown Scholar'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 rounded-full">
                                  {review.count}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <StarIcon
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < Math.floor(review.avgRating || 0)
                                            ? 'text-yellow-400'
                                            : 'text-gray-300 dark:text-gray-600'
                                        }`}
                                        fill={i < Math.floor(review.avgRating || 0) ? 'currentColor' : 'none'}
                                      />
                                    ))}
                                  </div>
                                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                    {review.avgRating ? review.avgRating.toFixed(1) : 'N/A'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  (review.avgRating || 0) >= 4.5
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                    : (review.avgRating || 0) >= 3.5
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                }`}>
                                  {(review.avgRating || 0) >= 4.5 ? 'Excellent' : 
                                   (review.avgRating || 0) >= 3.5 ? 'Good' : 'Needs Improvement'}
                                </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Security Logs */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Security Logs</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor sensitive content and security violations</p>
                </div>
                <div className="p-6">
                  {logs.length === 0 ? (
                    <div className="text-center py-12">
                      <ShieldCheckIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Security Issues</h3>
                      <p className="text-gray-600 dark:text-gray-400">No security violations have been detected.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {logs.map((log: any) => (
                        <div key={log._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                log.type === 'meeting_link_blocked' ? 'bg-red-500' :
                                log.type === 'phone_blocked' ? 'bg-orange-500' :
                                log.type === 'email_blocked' ? 'bg-yellow-500' :
                                log.type === 'link_detected' ? 'bg-blue-500' :
                                'bg-purple-500'
                              }`}></div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {log.user?.name || 'Unknown User'}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {log.user?.email} • {log.user?.role}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                log.type === 'meeting_link_blocked' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                                log.type === 'phone_blocked' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' :
                                log.type === 'email_blocked' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                                log.type === 'link_detected' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
                                'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                              }`}>
                                {log.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {new Date(log.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Original Text:</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded border">
                                {log.textSample || 'No text sample available'}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Filtered Text:</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded border">
                                {log.redactedText || 'No filtered text available'}
                              </p>
                            </div>
                            
                            {log.endpoint && (
                              <div>
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Endpoint:</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                  {log.endpoint}
                                </p>
                              </div>
                            )}
                            
                            {log.metadata && (
                              <div>
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Metadata:</p>
                                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded border">
                                  <pre className="whitespace-pre-wrap">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
            </div>
                  )}
                </div>
              </div>
            </div>
        )}
        </div>
      </div>
    </div>
  );
}