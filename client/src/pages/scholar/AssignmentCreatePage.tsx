import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assignmentService } from '../../services/assignmentService';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

type Enrollment = {
  _id: string;
  student: { _id: string; name: string; email: string };
  scholar: any;
  isActive: boolean;
};

const AssignmentCreatePage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [mcqCount, setMcqCount] = useState<number | ''>('');
  const [shortCount, setShortCount] = useState<number | ''>('');
  const [tfCount, setTfCount] = useState<number | ''>('');
  const [essayCount, setEssayCount] = useState<number | ''>('');
  const [mode, setMode] = useState<'all-mcq' | 'custom'>('all-mcq');
  const [difficulty, setDifficulty] = useState<'easy'|'medium'|'hard'>('medium');
  const [kind, setKind] = useState<'assignment'|'quiz'>('assignment');
  const [dueDate, setDueDate] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('');
  const [quizWindowStart, setQuizWindowStart] = useState<string>('');
  const [quizWindowEnd, setQuizWindowEnd] = useState<string>('');
  
  // 🚀 ENHANCED: Multi-student selection
  const [selectedEnrollments, setSelectedEnrollments] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 🚀 NEW: Creation mode (manual vs AI)
  const [creationMode, setCreationMode] = useState<'manual' | 'ai'>('ai');
  const [useAIAfterManual, setUseAIAfterManual] = useState(false);
  
  const navigate = useNavigate();

  // Fetch enrollments on mount
  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/scholars/enrollments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.enrollments) {
          setEnrollments(res.data.enrollments.filter((e: Enrollment) => e.isActive));
        }
      } catch (err) {
        console.error('Failed to fetch enrollments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, []);

  // Handle select all toggle
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedEnrollments(enrollments.map(e => e._id));
    } else {
      setSelectedEnrollments([]);
    }
  };

  // Handle individual enrollment toggle
  const handleEnrollmentToggle = (enrollmentId: string) => {
    setSelectedEnrollments(prev => {
      if (prev.includes(enrollmentId)) {
        const updated = prev.filter(id => id !== enrollmentId);
        setSelectAll(updated.length === enrollments.length);
        return updated;
      } else {
        const updated = [...prev, enrollmentId];
        setSelectAll(updated.length === enrollments.length);
        return updated;
      }
    });
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      alert('Title is required');
      return;
    }
    
    if (selectedEnrollments.length === 0 && !selectAll) {
      alert('Please select at least one student or choose "All Students"');
      return;
    }
    
    setSaving(true);
    try {
      const isTargetAll = selectAll || selectedEnrollments.length === enrollments.length;
      const targetEnrollments = isTargetAll ? [] : selectedEnrollments;
      
      // Create assignment with multi-student support
      const assignmentData: any = {
        title,
        description,
        type: 'quiz',
        kind,
        targetAllStudents: isTargetAll,
        targetEnrollments: targetEnrollments.length > 0 ? targetEnrollments : undefined,
        enrollmentId: !isTargetAll && targetEnrollments.length === 1 ? targetEnrollments[0] : undefined, // Legacy support
        dueDate: kind === 'assignment' ? (dueDate || undefined) : undefined,
        durationMinutes: kind === 'quiz' ? (durationMinutes || undefined) : undefined,
        quizWindowStart: kind === 'quiz' ? (quizWindowStart || undefined) : undefined,
        quizWindowEnd: kind === 'quiz' ? (quizWindowEnd || undefined) : undefined,
        createdByAI: creationMode === 'ai',
        questions: creationMode === 'manual' ? [] : undefined,
        aiSpec: creationMode === 'ai' ? {
          topic: topic || title,
          numQuestions,
          difficulty,
          mcqCount: mode === 'all-mcq' ? numQuestions : (mcqCount || undefined),
          trueFalseCount: mode === 'all-mcq' ? 0 : (tfCount || undefined),
          shortAnswerCount: mode === 'all-mcq' ? 0 : (shortCount || undefined),
          essayCount: mode === 'all-mcq' ? 0 : (essayCount || undefined),
        } : undefined,
      };

      const res = await assignmentService.create(assignmentData);
      const assignmentId = res.assignment?._id;

      if (!assignmentId) {
        throw new Error('Failed to create assignment');
      }

      // If AI mode, generate questions
      if (creationMode === 'ai') {
        try {
          await assignmentService.generate(assignmentId);
        } catch (genErr: any) {
          console.error('AI generation failed:', genErr);
          alert('Assignment created but AI generation failed. You can add questions manually.');
        }
      }

      // Navigate to builder for editing
      navigate(`/scholar/assignments/${assignmentId}/builder`);
    } catch (e: any) {
      alert(e?.response?.data?.error || e?.message || 'Failed to create assignment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading enrollments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mb-2">Create New Assignment</h1>
        <p className="text-gray-600 dark:text-gray-400">Create assignments or quizzes for your students</p>
      </div>

      <div className="space-y-6">
        {/* 🚀 ENHANCED: Multi-student selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Students</h2>
          
          {enrollments.length === 0 ? (
            <div className="text-center py-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">No Active Enrollments</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">Students must enroll with you before you can assign work to them.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <span className="font-semibold text-gray-900 dark:text-white">📢 All Students</span>
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">({enrollments.length} enrolled)</span>
                </div>
              </label>
              
              <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                {enrollments.map(enrollment => (
                  <label
                    key={enrollment._id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEnrollments.includes(enrollment._id)}
                      onChange={() => handleEnrollmentToggle(enrollment._id)}
                      disabled={selectAll}
                      className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 disabled:opacity-50"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {enrollment.student?.name || 'Unknown Student'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {enrollment.student?.email || ''}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              
              {selectedEnrollments.length > 0 && !selectAll && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ {selectedEnrollments.length} student{selectedEnrollments.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assignment Type *
              </label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="kind"
                    checked={kind === 'assignment'}
                    onChange={() => setKind('assignment')}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-gray-900 dark:text-white">📝 Assignment (deadline-based)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="kind"
                    checked={kind === 'quiz'}
                    onChange={() => setKind('quiz')}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-gray-900 dark:text-white">⏱️ Quiz (timed)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Introduction to Islamic Law"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                placeholder="Provide context and instructions for students..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Timing Settings */}
        {kind === 'assignment' ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Deadline</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date & Time
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quiz Timing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  min={1}
                  value={durationMinutes || ''}
                  onChange={e => setDurationMinutes(e.target.value === '' ? '' : parseInt(e.target.value))}
                  placeholder="e.g., 30"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Window Start (optional)
                </label>
                <input
                  type="datetime-local"
                  value={quizWindowStart}
                  onChange={e => setQuizWindowStart(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Window End (optional)
                </label>
                <input
                  type="datetime-local"
                  value={quizWindowEnd}
                  onChange={e => setQuizWindowEnd(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* 🚀 NEW: Creation Mode Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Question Creation Method</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-3 cursor-pointer flex-1 p-4 border-2 rounded-lg transition-all"
                style={{
                  borderColor: creationMode === 'ai' ? '#10b981' : '#e5e7eb',
                  backgroundColor: creationMode === 'ai' ? '#ecfdf5' : 'transparent'
                }}
              >
                <input
                  type="radio"
                  name="creationMode"
                  checked={creationMode === 'ai'}
                  onChange={() => setCreationMode('ai')}
                  className="w-5 h-5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">🤖 AI Generation</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Let AI create questions automatically (you can edit after)</div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer flex-1 p-4 border-2 rounded-lg transition-all"
                style={{
                  borderColor: creationMode === 'manual' ? '#10b981' : '#e5e7eb',
                  backgroundColor: creationMode === 'manual' ? '#ecfdf5' : 'transparent'
                }}
              >
                <input
                  type="radio"
                  name="creationMode"
                  checked={creationMode === 'manual'}
                  onChange={() => setCreationMode('manual')}
                  className="w-5 h-5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">✏️ Manual Creation</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Create questions yourself step by step</div>
                </div>
              </label>
            </div>

            {/* AI Configuration */}
            {creationMode === 'ai' && (
              <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Topic
                    </label>
                    <input
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      placeholder="e.g., Fiqh, Hadith, Tafsir"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Number of Questions
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={numQuestions}
                      onChange={e => setNumQuestions(parseInt(e.target.value || '5'))}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Difficulty Level
                    </label>
                    <select
                      value={difficulty}
                      onChange={e => setDifficulty(e.target.value as any)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Question Mix
                  </label>
                  <div className="flex items-center gap-6 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="mode"
                        checked={mode === 'all-mcq'}
                        onChange={() => setMode('all-mcq')}
                        className="w-4 h-4 text-emerald-600"
                      />
                      <span className="text-gray-900 dark:text-white">All MCQs</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="mode"
                        checked={mode === 'custom'}
                        onChange={() => setMode('custom')}
                        className="w-4 h-4 text-emerald-600"
                      />
                      <span className="text-gray-900 dark:text-white">Custom Mix</span>
                    </label>
                  </div>
                  
                  {mode === 'custom' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">MCQ</label>
                        <input
                          type="number"
                          min={0}
                          value={mcqCount || ''}
                          onChange={e => setMcqCount(e.target.value === '' ? '' : parseInt(e.target.value))}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-900 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">True/False</label>
                        <input
                          type="number"
                          min={0}
                          value={tfCount || ''}
                          onChange={e => setTfCount(e.target.value === '' ? '' : parseInt(e.target.value))}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-900 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Short Answer</label>
                        <input
                          type="number"
                          min={0}
                          value={shortCount || ''}
                          onChange={e => setShortCount(e.target.value === '' ? '' : parseInt(e.target.value))}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-900 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Essay</label>
                        <input
                          type="number"
                          min={0}
                          value={essayCount || ''}
                          onChange={e => setEssayCount(e.target.value === '' ? '' : parseInt(e.target.value))}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-900 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {creationMode === 'manual' && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  📝 You'll create questions manually in the assignment builder after saving. This gives you full control over each question.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => navigate('/scholar/assignments')}
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !title.trim() || (selectedEnrollments.length === 0 && !selectAll)}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>
                {creationMode === 'ai' ? '🚀 Create & Generate with AI' : '📝 Create & Go to Builder'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentCreatePage;
