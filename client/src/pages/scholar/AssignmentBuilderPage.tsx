import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assignmentService, Assignment, Question } from '../../services/assignmentService';
import ConfirmationModal from '../../components/shared/ConfirmationModal';

const emptyQ: Question = { type: 'mcq', prompt: '', options: ['', '', '', ''], answer: 0 } as any;

const AssignmentBuilderPage: React.FC = () => {
  const { id } = useParams();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [newQ, setNewQ] = useState<Question>({ ...emptyQ });
  const [editingQId, setEditingQId] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closing, setClosing] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; confirmColor?: 'emerald' | 'red' | 'orange' | 'blue'; icon?: string }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const res = await assignmentService.get(id);
        setAssignment(res.assignment);
      } catch (err) {
        console.error('Failed to load assignment:', err);
        alert('Failed to load assignment');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const reloadAssignment = async () => {
    if (!id) return;
    const res = await assignmentService.get(id);
    setAssignment(res.assignment);
  };

  const addQuestion = async () => {
    if (!id) return;
    if (!newQ.prompt.trim()) {
      alert('Question prompt is required');
      return;
    }
    
    // Validate MCQ options
    if (newQ.type === 'mcq') {
      const filledOptions = (newQ.options || []).filter(opt => opt.trim()).length;
      if (filledOptions < 2) {
        alert('MCQ questions must have at least 2 options');
        return;
      }
    }
    
    setSaving('add');
    try {
      await assignmentService.addQuestion(id, newQ);
      setNewQ({ ...emptyQ });
      await reloadAssignment();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to add question');
    } finally {
      setSaving(null);
    }
  };

  const updateQuestion = async (qid: string, q: Partial<Question>) => {
    if (!id) return;
    setSaving(qid);
    try {
      await assignmentService.updateQuestion(id, qid, q);
      await reloadAssignment();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to update question');
    } finally {
      setSaving(null);
    }
  };

  const deleteQuestion = (qid: string) => {
    if (!id) return;
    setConfirmModal({
      isOpen: true,
      title: 'Delete Question',
      message: 'Are you sure you want to delete this question?',
      confirmColor: 'red',
      icon: '🗑️',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        setSaving(qid);
        try {
          await assignmentService.deleteQuestion(id, qid);
          await reloadAssignment();
        } catch (err: any) {
          alert(err?.response?.data?.error || 'Failed to delete question');
        } finally {
          setSaving(null);
        }
      }
    });
  };

  const handleRegenerateAI = () => {
    if (!id) return;
    setConfirmModal({
      isOpen: true,
      title: 'Regenerate Questions',
      message: 'This will replace all existing questions with AI-generated ones. Continue?',
      confirmColor: 'blue',
      icon: '🤖',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        setRegenerating(true);
        try {
          await assignmentService.generate(id);
          await reloadAssignment();
          alert('✅ Questions regenerated successfully!\n\nReview the AI-generated questions and make any necessary edits before publishing.');
        } catch (err: any) {
          alert(err?.response?.data?.error || 'AI generation failed. Check your Python environment and API keys.');
        } finally {
          setRegenerating(false);
        }
      }
    });
  };

  const handlePublish = () => {
    if (!id) return;
    if (!assignment?.questions || assignment.questions.length === 0) {
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
        setPublishing(true);
        try {
          await assignmentService.publish(id);
          await reloadAssignment();
          alert(`✅ ${isQuiz ? 'Quiz' : 'Assignment'} published successfully!\n\nAll students have been notified and can now ${isQuiz ? 'start the quiz' : 'view and submit the assignment'}.`);
        } catch (err: any) {
          alert(`❌ Failed to publish: ${err?.response?.data?.error || 'Unknown error'}`);
        } finally {
          setPublishing(false);
        }
      }
    });
  };

  const handleCloseClick = () => {
    setShowCloseModal(true);
  };

  const handleCloseConfirm = async () => {
    if (!id) return;
    
    setShowCloseModal(false);
    setClosing(true);
    try {
      await assignmentService.close(id);
      await reloadAssignment();
      // Success - assignment will be updated in the UI
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to close assignment');
    } finally {
      setClosing(false);
    }
  };

  const handleCloseCancel = () => {
    setShowCloseModal(false);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 font-medium">Assignment not found</p>
          <button
            onClick={() => navigate('/scholar/assignments')}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  const isPublished = assignment.status === 'published';
  const isClosed = assignment.status === 'closed';
  const questionCount = assignment.questions?.length || 0;

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
                  disabled={closing}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {closing ? 'Closing...' : 'Yes, Close Assignment'}
                </button>
                <button
                  onClick={handleCloseCancel}
                  disabled={closing}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mb-2">
              {assignment.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className={`px-3 py-1 rounded-full font-medium ${
                assignment.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                assignment.status === 'closed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' :
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
              }`}>
                {assignment.status.toUpperCase()}
              </span>
              <span>📝 {questionCount} question{questionCount !== 1 ? 's' : ''}</span>
              <span>📚 {assignment.kind === 'quiz' ? 'Quiz' : 'Assignment'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/scholar/assignments')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              ← Back
            </button>
            {!isPublished && !isClosed && (
              <button
                onClick={handleRegenerateAI}
                disabled={regenerating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {regenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Regenerating...
                  </>
                ) : (
                  <>🤖 Regenerate with AI</>
                )}
              </button>
            )}
            {!isPublished && !isClosed && (
              <button
                onClick={handlePublish}
                disabled={publishing || questionCount === 0}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {publishing ? 'Publishing...' : '📢 Publish'}
              </button>
            )}
            {isPublished && !isClosed && (
              <button
                onClick={handleCloseClick}
                disabled={closing}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {closing ? 'Closing...' : '🔒 Close Assignment'}
              </button>
            )}
          </div>
        </div>

        {assignment.description && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{assignment.description}</p>
          </div>
        )}
      </div>

      {/* Add Question Form */}
      {!isPublished && !isClosed && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>➕</span> Add New Question
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Question Type *
                </label>
                <select
                  value={newQ.type}
                  onChange={e => {
                    const type = e.target.value as any;
                    setNewQ({
                      ...emptyQ,
                      type,
                      options: type === 'mcq' ? ['', '', '', ''] : type === 'true-false' ? ['True', 'False'] : []
                    });
                  }}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="mcq">📋 Multiple Choice (MCQ)</option>
                  <option value="true-false">✓✗ True/False</option>
                  <option value="short-answer">✏️ Short Answer</option>
                  <option value="essay">📝 Essay</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Question Prompt *
                </label>
                <input
                  value={newQ.prompt}
                  onChange={e => setNewQ({ ...newQ, prompt: e.target.value })}
                  placeholder="Enter your question here..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* MCQ Options */}
            {newQ.type === 'mcq' && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Options (mark the correct answer) *
                </label>
                {(newQ.options || []).map((opt, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="newq_correct"
                      checked={newQ.answer === i}
                      onChange={() => setNewQ({ ...newQ, answer: i })}
                      className="w-5 h-5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <input
                      value={opt}
                      onChange={e => {
                        const options = [...(newQ.options || [])];
                        options[i] = e.target.value;
                        setNewQ({ ...newQ, options });
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                    {newQ.answer === i && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Correct</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* True/False Options */}
            {newQ.type === 'true-false' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Correct Answer *
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer p-3 border-2 rounded-lg transition-all"
                    style={{
                      borderColor: newQ.answer === true ? '#10b981' : '#e5e7eb',
                      backgroundColor: newQ.answer === true ? '#ecfdf5' : 'transparent'
                    }}
                  >
                    <input
                      type="radio"
                      name="tf"
                      checked={newQ.answer === true}
                      onChange={() => setNewQ({ ...newQ, answer: true })}
                      className="w-5 h-5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium text-gray-900 dark:text-white">True</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-3 border-2 rounded-lg transition-all"
                    style={{
                      borderColor: newQ.answer === false ? '#10b981' : '#e5e7eb',
                      backgroundColor: newQ.answer === false ? '#ecfdf5' : 'transparent'
                    }}
                  >
                    <input
                      type="radio"
                      name="tf"
                      checked={newQ.answer === false}
                      onChange={() => setNewQ({ ...newQ, answer: false })}
                      className="w-5 h-5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium text-gray-900 dark:text-white">False</span>
                  </label>
                </div>
              </div>
            )}

            {/* Short Answer */}
            {newQ.type === 'short-answer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sample Answer (optional - for reference)
                </label>
                <textarea
                  value={newQ.answer || ''}
                  onChange={e => setNewQ({ ...newQ, answer: e.target.value })}
                  rows={3}
                  placeholder="Provide a sample correct answer for reference..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* Essay */}
            {newQ.type === 'essay' && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 Essay questions will be graded manually. You can add grading criteria later.
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={addQuestion}
                disabled={saving === 'add' || !newQ.prompt.trim()}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {saving === 'add' ? 'Adding...' : '➕ Add Question'}
              </button>
              <button
                onClick={() => setNewQ({ ...emptyQ })}
                className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Questions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <span>📚</span> Questions ({questionCount})
        </h2>

        {questionCount === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No questions yet</p>
            {!isPublished && !isClosed && (
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Add questions manually above or use "Regenerate with AI" to create questions automatically
              </p>
            )}
          </div>
        ) : (
          assignment.questions?.map((q, idx) => (
            <div
              key={q._id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold">
                    {idx + 1}
                  </span>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase">
                    {q.type}
                  </span>
                </div>
                {!isPublished && !isClosed && (
                  <button
                    onClick={() => deleteQuestion(q._id!)}
                    disabled={saving === q._id}
                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {saving === q._id ? 'Deleting...' : '🗑️ Delete'}
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Question Prompt
                  </label>
                  {editingQId === q._id ? (
                    <textarea
                      defaultValue={q.prompt}
                      onBlur={e => {
                        updateQuestion(q._id!, { prompt: e.target.value });
                        setEditingQId(null);
                      }}
                      rows={2}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      autoFocus
                    />
                  ) : (
                    <div
                      onClick={() => !isPublished && !isClosed && setEditingQId(q._id!)}
                      className={`p-3 rounded-lg border ${
                        !isPublished && !isClosed
                          ? 'border-gray-300 dark:border-gray-600 cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500'
                          : 'border-gray-200 dark:border-gray-700'
                      } bg-gray-50 dark:bg-gray-900`}
                    >
                      <p className="text-gray-900 dark:text-white">{q.prompt}</p>
                      {!isPublished && !isClosed && (
                        <p className="text-xs text-gray-500 mt-1">Click to edit</p>
                      )}
                    </div>
                  )}
                </div>

                {/* MCQ Options Display */}
                {q.type === 'mcq' && Array.isArray(q.options) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Options
                    </label>
                    <div className="space-y-2">
                      {q.options.map((opt, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            q.answer === i
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q_${q._id}_correct`}
                            checked={q.answer === i}
                            onChange={() => !isPublished && !isClosed && updateQuestion(q._id!, { answer: i })}
                            disabled={isPublished || isClosed}
                            className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                          />
                          <input
                            defaultValue={opt}
                            onBlur={e => {
                              if (!isPublished && !isClosed) {
                                const options = [...(q.options || [])];
                                options[i] = e.target.value;
                                updateQuestion(q._id!, { options });
                              }
                            }}
                            disabled={isPublished || isClosed}
                            className={`flex-1 border rounded-lg px-3 py-2 ${
                              q.answer === i
                                ? 'border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-800'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900'
                            } text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 disabled:opacity-50`}
                          />
                          {q.answer === i && (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">✓ Correct</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* True/False Display */}
                {q.type === 'true-false' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Correct Answer
                    </label>
                    <div className="flex items-center gap-6">
                      <label className={`flex items-center gap-2 cursor-pointer p-3 border-2 rounded-lg transition-all ${
                        !isPublished && !isClosed ? 'cursor-pointer' : 'cursor-default'
                      }`}
                        style={{
                          borderColor: q.answer === true ? '#10b981' : '#e5e7eb',
                          backgroundColor: q.answer === true ? '#ecfdf5' : 'transparent'
                        }}
                      >
                        <input
                          type="radio"
                          name={`tf_${q._id}`}
                          checked={q.answer === true}
                          onChange={() => !isPublished && !isClosed && updateQuestion(q._id!, { answer: true })}
                          disabled={isPublished || isClosed}
                          className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                        />
                        <span className="font-medium text-gray-900 dark:text-white">True</span>
                      </label>
                      <label className={`flex items-center gap-2 cursor-pointer p-3 border-2 rounded-lg transition-all ${
                        !isPublished && !isClosed ? 'cursor-pointer' : 'cursor-default'
                      }`}
                        style={{
                          borderColor: q.answer === false ? '#10b981' : '#e5e7eb',
                          backgroundColor: q.answer === false ? '#ecfdf5' : 'transparent'
                        }}
                      >
                        <input
                          type="radio"
                          name={`tf_${q._id}`}
                          checked={q.answer === false}
                          onChange={() => !isPublished && !isClosed && updateQuestion(q._id!, { answer: false })}
                          disabled={isPublished || isClosed}
                          className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                        />
                        <span className="font-medium text-gray-900 dark:text-white">False</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Short Answer Display */}
                {q.type === 'short-answer' && q.answer && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sample Answer
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-gray-700 dark:text-gray-300">{String(q.answer)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Footer */}
      {!isPublished && !isClosed && questionCount > 0 && (
        <div className="mt-8 p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-emerald-900 dark:text-emerald-200 mb-1">
                Ready to publish?
              </p>
              <p className="text-sm text-emerald-800 dark:text-emerald-300">
                Review your questions and click "Publish" when ready. Students will be notified.
              </p>
            </div>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors font-medium"
            >
              {publishing ? 'Publishing...' : '📢 Publish Assignment'}
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default AssignmentBuilderPage;
