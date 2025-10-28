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
  const [enrollmentId, setEnrollmentId] = useState<string>(''); // 🚀 NEW
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]); // 🚀 NEW
  const [loading, setLoading] = useState(true); // 🚀 NEW
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // 🚀 NEW: Fetch enrollments on mount
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

  const handleCreate = async () => {
    if (!title.trim()) return alert('Title required');
    if (!enrollmentId) return alert('Please select a student/enrollment'); // 🚀 NEW
    setSaving(true);
    try {
      const res = await assignmentService.create({
        title,
        description,
        type: 'quiz',
        kind,
        enrollmentId, // 🚀 NEW
        dueDate: kind === 'assignment' ? (dueDate || undefined) as any : undefined,
        durationMinutes: kind === 'quiz' ? (durationMinutes || undefined as any) : undefined,
        quizWindowStart: kind === 'quiz' ? (quizWindowStart || undefined) as any : undefined,
        quizWindowEnd: kind === 'quiz' ? (quizWindowEnd || undefined) as any : undefined,
        aiSpec: { 
          topic: topic || title, 
          numQuestions, 
          difficulty,
          mcqCount: mode === 'all-mcq' ? numQuestions : (mcqCount || undefined),
          trueFalseCount: mode === 'all-mcq' ? 0 : (tfCount || undefined),
          shortAnswerCount: mode === 'all-mcq' ? 0 : (shortCount || undefined),
          essayCount: mode === 'all-mcq' ? 0 : (essayCount || undefined),
        }
      } as any);
      const id = res.assignment?._id;
      if (id) {
        await assignmentService.generate(id);
        navigate('/scholar/assignments');
      } else {
        navigate('/scholar/assignments');
      }
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to create assignment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mb-4">New Assignment</h1>
      {loading ? (
        <div className="text-center py-8">Loading enrollments...</div>
      ) : (
        <div className="space-y-4">
          {/* 🚀 NEW: Enrollment Selector */}
          <div>
            <label className="block text-sm font-medium mb-1">Assign To Student/Enrollment *</label>
            <select 
              value={enrollmentId} 
              onChange={e => setEnrollmentId(e.target.value)} 
              className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900"
              required
            >
              <option value="">-- Select Student --</option>
              {enrollments.map(e => (
                <option key={e._id} value={e._id}>
                  {e.student?.name || 'Unknown'} ({e.student?.email || ''})
                </option>
              ))}
            </select>
            {enrollments.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">No active enrollments found. Students must enroll with you first.</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2"><input type="radio" name="kind" checked={kind==='assignment'} onChange={() => setKind('assignment')} /> Assignment (deadline)</label>
              <label className="flex items-center gap-2"><input type="radio" name="kind" checked={kind==='quiz'} onChange={() => setKind('quiz')} /> Quiz (timed)</label>
            </div>
          </div>
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" />
        </div>
        {kind === 'assignment' ? (
          <div className="rounded border p-4">
            <div className="font-medium mb-2">Deadline</div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" />
            </div>
          </div>
        ) : (
          <div className="rounded border p-4">
            <div className="font-medium mb-2">Quiz Timing</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                <input type="number" min={1} value={durationMinutes as any} onChange={e => setDurationMinutes(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Window Start (optional)</label>
                <input type="datetime-local" value={quizWindowStart} onChange={e => setQuizWindowStart(e.target.value)} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Window End (optional)</label>
                <input type="datetime-local" value={quizWindowEnd} onChange={e => setQuizWindowEnd(e.target.value)} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" />
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Topic</label>
            <input value={topic} onChange={e => setTopic(e.target.value)} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Questions</label>
            <input type="number" min={1} max={20} value={numQuestions} onChange={e => setNumQuestions(parseInt(e.target.value||'5'))} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Difficulty</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
        <div className="rounded border p-4">
          <div className="font-medium mb-2">Question Mix</div>
          <div className="flex items-center gap-6 mb-3">
            <label className="flex items-center gap-2">
              <input type="radio" name="mode" checked={mode==='all-mcq'} onChange={() => setMode('all-mcq')} />
              <span>All MCQs</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="mode" checked={mode==='custom'} onChange={() => setMode('custom')} />
              <span>Custom mix</span>
            </label>
          </div>
          {mode === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">MCQ Count</label>
                <input type="number" min={0} value={mcqCount as any} onChange={e => setMcqCount(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">True/False</label>
                <input type="number" min={0} value={tfCount as any} onChange={e => setTfCount(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Short Answers</label>
                <input type="number" min={0} value={shortCount as any} onChange={e => setShortCount(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Essays</label>
                <input type="number" min={0} value={essayCount as any} onChange={e => setEssayCount(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" />
              </div>
            </div>
          )}
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Tip: total should roughly match Questions above.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCreate} disabled={saving} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-60">{saving ? 'Creating...' : (kind === 'quiz' ? 'Create Quiz & Generate' : 'Create Assignment & Generate')}</button>
          <button onClick={() => navigate('/scholar/assignments')} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded">Cancel</button>
        </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentCreatePage;
