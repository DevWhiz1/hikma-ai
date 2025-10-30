import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  StarIcon,
  CalendarIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { enhancedAdminService, Scholar } from '../../services/enhancedAdminService';
import ConfirmationModal from '../shared/ConfirmationModal';

interface ScholarManagementProps {
  onScholarSelect?: (scholar: Scholar) => void;
}

const ScholarManagement: React.FC<ScholarManagementProps> = ({ onScholarSelect }) => {
  const [scholars, setScholars] = useState<Scholar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedScholar, setSelectedScholar] = useState<Scholar | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; confirmColor?: 'emerald' | 'red' | 'orange' | 'blue'; icon?: string }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [scholarToRemove, setScholarToRemove] = useState<{ id: string; reason: string } | null>(null);

  useEffect(() => {
    loadScholars();
  }, [currentPage, statusFilter, countryFilter, sortBy, sortOrder]);

  const loadScholars = async () => {
    try {
      setLoading(true);
      const response = await enhancedAdminService.getAllScholars({
        page: currentPage,
        limit: 10,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        country: countryFilter !== 'all' ? countryFilter : undefined,
        sortBy,
        sortOrder
      });
      
      setScholars(response.scholars);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error('Failed to load scholars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (scholarId: string, updates: { approved?: boolean; isActive?: boolean; isVerified?: boolean }) => {
    try {
      await enhancedAdminService.updateScholarStatus(scholarId, updates);
      loadScholars();
    } catch (error) {
      console.error('Failed to update scholar status:', error);
    }
  };

  const handleRemoveScholar = (scholarId: string, reason: string) => {
    setScholarToRemove({ id: scholarId, reason });
    setConfirmModal({
      isOpen: true,
      title: 'Remove Scholar',
      message: 'Are you sure you want to remove this scholar? This action cannot be undone.',
      confirmColor: 'red',
      icon: '⚠️',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        if (!scholarToRemove) return;
        
        try {
          await enhancedAdminService.removeScholar(scholarToRemove.id, scholarToRemove.reason);
          loadScholars();
          setScholarToRemove(null);
        } catch (error) {
          console.error('Failed to remove scholar:', error);
          setScholarToRemove(null);
        }
      }
    });
  };

  const filteredScholars = scholars.filter(scholar => {
    const matchesSearch = scholar.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scholar.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scholar.specializations.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <>
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => {
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
          setScholarToRemove(null);
        }}
        confirmColor={confirmModal.confirmColor || 'emerald'}
        icon={confirmModal.icon}
        confirmText="Yes, Remove Scholar"
        cancelText="Cancel"
      />
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Scholar Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage and monitor all scholars on the platform</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={loadScholars}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search scholars..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Country Filter */}
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Countries</option>
            <option value="US">United States</option>
            <option value="UK">United Kingdom</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
            <option value="SA">Saudi Arabia</option>
            <option value="AE">UAE</option>
            <option value="EG">Egypt</option>
            <option value="PK">Pakistan</option>
            <option value="IN">India</option>
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="averageRating-desc">Highest Rated</option>
            <option value="averageRating-asc">Lowest Rated</option>
            <option value="totalStudents-desc">Most Students</option>
            <option value="totalStudents-asc">Least Students</option>
          </select>
        </div>
      </div>

      {/* Scholars List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Scholar</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Specializations</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Students</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredScholars.map((scholar) => (
                <tr key={scholar._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={scholar.photoUrl || 'https://via.placeholder.com/40x40?text=Scholar'}
                        alt={scholar.user.name}
                        className="h-10 w-10 rounded-full object-cover mr-4"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{scholar.user.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{scholar.user.email}</div>
                        {scholar.country && (
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <GlobeAltIcon className="h-3 w-3 mr-1" />
                            {scholar.country}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {scholar.specializations.slice(0, 2).map((spec, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-full"
                        >
                          {spec}
                        </span>
                      ))}
                      {scholar.specializations.length > 2 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                          +{scholar.specializations.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {scholar.averageRating.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                        ({scholar.totalReviews})
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{scholar.totalStudents}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        scholar.approved 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                      }`}>
                        {scholar.approved ? 'Approved' : 'Pending'}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        scholar.isActive 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'
                      }`}>
                        {scholar.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedScholar(scholar)}
                        className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(scholar._id, { approved: !scholar.approved })}
                        className={`p-2 transition-colors ${
                          scholar.approved 
                            ? 'text-red-400 hover:text-red-600' 
                            : 'text-green-400 hover:text-green-600'
                        }`}
                        title={scholar.approved ? 'Disapprove' : 'Approve'}
                      >
                        {scholar.approved ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(scholar._id, { isActive: !scholar.isActive })}
                        className={`p-2 transition-colors ${
                          scholar.isActive 
                            ? 'text-orange-400 hover:text-orange-600' 
                            : 'text-blue-400 hover:text-blue-600'
                        }`}
                        title={scholar.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <ShieldCheckIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveScholar(scholar._id, 'Admin removal')}
                        className="p-2 text-red-400 hover:text-red-600 transition-colors"
                        title="Remove Scholar"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scholar Details Modal */}
      {selectedScholar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Scholar Details</h3>
                <button
                  onClick={() => setSelectedScholar(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={selectedScholar.photoUrl || 'https://via.placeholder.com/80x80?text=Scholar'}
                      alt={selectedScholar.user.name}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedScholar.user.name}</h4>
                      <p className="text-gray-600 dark:text-gray-400">{selectedScholar.user.email}</p>
                      <div className="flex items-center mt-2">
                        <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="text-sm font-medium">{selectedScholar.averageRating.toFixed(1)}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                          ({selectedScholar.totalReviews} reviews)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedScholar.bio || 'No bio provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Specializations</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedScholar.specializations.map((spec, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-full"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analytics */}
                <div className="space-y-4">
                  <h5 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-center">
                        <UserGroupIcon className="h-5 w-5 text-emerald-600 mr-2" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Students</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedScholar.totalStudents}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-center">
                        <CalendarIcon className="h-5 w-5 text-blue-600 mr-2" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Sessions</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedScholar.totalSessions}</p>
                        </div>
                      </div>
                    </div>
                    {selectedScholar.analytics && (
                      <>
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                          <div className="flex items-center">
                            <CurrencyDollarIcon className="h-5 w-5 text-green-600 mr-2" />
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Earnings</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                ${selectedScholar.analytics.totalEarnings.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                          <div className="flex items-center">
                            <StarIcon className="h-5 w-5 text-yellow-600 mr-2" />
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Rating</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {selectedScholar.analytics.averageRating.toFixed(1)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setSelectedScholar(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedScholar._id, { approved: !selectedScholar.approved })}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedScholar.approved 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {selectedScholar.approved ? 'Disapprove' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default ScholarManagement;
