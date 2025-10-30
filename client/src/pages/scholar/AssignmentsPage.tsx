import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { assignmentService, Assignment } from '../../services/assignmentService';
import ConfirmationModal from '../../components/shared/ConfirmationModal';

const AssignmentsPage: React.FC = () => {
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'closed'>('all');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [assignmentToClose, setAssignmentToClose] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; confirmColor?: 'emerald' | 'red' | 'orange' | 'blue'; icon?: string }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await assignmentService.list();
      setItems(res.assignments || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleGenerate = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Regenerate Questions',
      message: 'This will regenerate all questions. Continue?',
      confirmColor: 'blue',
      icon: '🤖',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        setBusyId(id);
        try {
          await assignmentService.generate(id);
          await load();
          alert('✅ Questions regenerated successfully!\n\nReview the AI-generated questions and make any necessary edits before publishing.');
        } catch (e: any) {
          alert(e?.response?.data?.error || 'AI generation failed. Check your Python environment and API keys.');
        } finally {
          setBusyId(null);
        }
      }
    });
  };

  const handlePublish = (id: string) => {
    const assignment = items.find(a => a._id === id);
    if (!assignment || (assignment.questions?.length || 0) === 0) {
      alert('⚠️ Please add at least one question before publishing');
      return;
    }
    const isQuiz = assignment.kind === 'quiz';
    setConfirmModal({
      isOpen: true,
      title: `Publish ${isQuiz ? 'Quiz' : 'Assignment'}`,
      message: `Publish this ${isQuiz ? 'quiz' : 'assignment'}? All target students will be notified and can ${isQuiz ? 'start taking' : 'access'} it.`,
      confirmColor: 'emerald',
      icon: '📢',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        setBusyId(id);
        try {
          await assignmentService.publish(id);
          await load();
          alert(`✅ ${isQuiz ? 'Quiz' : 'Assignment'} published successfully!\n\nAll students have been notified and can now ${isQuiz ? 'start the quiz' : 'view and submit the assignment'}.`);
        } catch (e: any) {
          alert(`❌ Failed to publish: ${e?.response?.data?.error || 'Unknown error'}`);
        } finally {
          setBusyId(null);
        }
      }
    });
  };

  const handleCloseClick = (id: string) => {
    setAssignmentToClose(id);
    setShowCloseModal(true);
  };

  const handleCloseConfirm = async () => {
    if (!assignmentToClose) return;
    
    setShowCloseModal(false);
    setBusyId(assignmentToClose);
    try {
      await assignmentService.close(assignmentToClose);
      await load();
      // Show success message without alert
      setError(null);
      // Optionally show a success toast here instead of alert
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to close assignment');
    } finally {
      setBusyId(null);
      setAssignmentToClose(null);
    }
  };

  const handleCloseCancel = () => {
    setShowCloseModal(false);
    setAssignmentToClose(null);
  };

  const filteredItems = filter === 'all' 
    ? items 
    : items.filter(item => item.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
        confirmColor={confirmModal.confirmColor || 'emerald'}
        icon={confirmModal.icon}
      />

      {/* Close Assignment Confirmation Modal */}
      {showCloseModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleCloseCancel}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                  <span className="text-2xl">🔒</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Close Assignment?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to close this assignment? Students will no longer be able to submit their work once it's closed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCloseConfirm}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  Yes, Close Assignment
                </button>
                <button
                  onClick={handleCloseCancel}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mb-2">
              My Assignments & Quizzes
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create and manage assignments and quizzes for your students
            </p>
          </div>
          <button
            onClick={() => navigate('/scholar/assignments/new')}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
          >
            <span>➕</span> New Assignment
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
          {(['all', 'draft', 'published', 'closed'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                filter === status
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({status === 'all' ? items.length : items.filter(i => i.status === status).length})
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Assignments List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
            {filter === 'all' ? 'No assignments yet' : `No ${filter} assignments`}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
            {filter === 'all' && 'Create your first assignment to get started'}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => navigate('/scholar/assignments/new')}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Create Assignment
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map(item => {
            const questionCount = item.questions?.length || 0;
            const hasQuestions = questionCount > 0;
            
            return (
              <div
                key={item._id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {item.title}
                      </h2>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        item.kind === 'quiz'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      }`}>
                        {item.kind === 'quiz' ? '⏱️ Quiz' : '📝 Assignment'}
                      </span>
                      {(item as any).createdByAI && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                          🤖 AI Created
                        </span>
                      )}
                    </div>
                    
                    {item.description && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <span>📚</span> {questionCount} question{questionCount !== 1 ? 's' : ''}
                      </span>
                      {item.kind === 'assignment' && item.dueDate && (
                        <span className="flex items-center gap-1">
                          <span>📅</span> Due: {new Date(item.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {item.kind === 'quiz' && item.durationMinutes && (
                        <span className="flex items-center gap-1">
                          <span>⏱️</span> {item.durationMinutes} min
                        </span>
                      )}
                      {(item as any).targetAllStudents && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <span>📢</span> All Students
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    {item.status === 'draft' && !hasQuestions && (
                      <button
                        onClick={() => handleGenerate(item._id!)}
                        disabled={busyId === item._id}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                      >
                        {busyId === item._id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            Generating...
                          </>
                        ) : (
                          <>🤖 Generate with AI</>
                        )}
                      </button>
                    )}
                    
                    {item.status === 'draft' && hasQuestions && (
                      <button
                        onClick={() => handlePublish(item._id!)}
                        disabled={busyId === item._id}
                        className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        {busyId === item._id ? 'Publishing...' : '📢 Publish'}
                      </button>
                    )}
                    
                    {item.status === 'published' && (
                      <button
                        onClick={() => handleCloseClick(item._id!)}
                        disabled={busyId === item._id}
                        className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                      >
                        {busyId === item._id ? 'Closing...' : '🔒 Close'}
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/scholar/assignments/${item._id}/builder`}
                      className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      ✏️ Edit
                    </Link>
                    <Link
                      to={`/scholar/assignments/${item._id}/submissions`}
                      className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                    >
                      📊 Submissions
                    </Link>
                  </div>
                </div>

                {/* Warning if no questions */}
                {item.status === 'draft' && !hasQuestions && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⚠️ No questions yet. Add questions manually or generate with AI before publishing.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
    </>
  );
};

export default AssignmentsPage;
