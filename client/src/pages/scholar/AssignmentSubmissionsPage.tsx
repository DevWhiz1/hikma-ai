import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { assignmentService, Submission, Assignment, Question } from '../../services/assignmentService';

const AssignmentSubmissionsPage: React.FC = () => {
  const { id } = useParams(); // assignment id
  const [items, setItems] = useState<Submission[]>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [manual, setManual] = useState<Record<string, { totalScore?: string; feedback?: string; perQuestion?: Record<string, { score?: string; feedback?: string }> }>>({});
  const [gradingMode, setGradingMode] = useState<'ai' | 'manual'>('ai');

  const load = async () => {
    if (!id) return;
    const [subRes, aRes] = await Promise.all([
      assignmentService.listSubmissions(id),
      assignmentService.get(id)
    ]);
    setItems(subRes.submissions || []);
    setAssignment(aRes.assignment || null);
  };

  useEffect(() => { load(); }, [id]);

  const handleGrade = async (sid: string) => {
    setBusy(sid);
    try {
      await assignmentService.grade(sid);
      await load();
    } catch {
      alert('AI grading failed. Configure Python environment and GEMINI_API_KEY.');
    } finally { setBusy(null); }
  };

  const handleManualGrade = async (sid: string) => {
    const form = manual[sid] || {};
    // Build perQuestion array
    const pqMap = form.perQuestion || {};
    const perQuestion = Object.entries(pqMap).map(([questionId, v]) => ({
      questionId,
      score: v.score ? parseFloat(v.score) : 0,
      feedback: v.feedback || undefined
    }));
    // Auto-calc total if not provided: average 0-10 scaled to 0-100
    let totalScore = form.totalScore ? parseFloat(form.totalScore) : undefined;
    if ((totalScore === undefined || isNaN(totalScore)) && perQuestion.length > 0) {
      const sum = perQuestion.reduce((acc, p) => acc + (typeof p.score === 'number' ? p.score : 0), 0);
      totalScore = Math.round((100 * sum) / (10 * perQuestion.length) * 100) / 100; // 2 decimals
    }
    setBusy(sid);
    try {
      await assignmentService.manualGrade(sid, { totalScore, feedback: form.feedback, perQuestion });
      await load();
    } catch {
      alert('Manual grade failed');
    } finally { setBusy(null); }
  };

  const getAnswerFor = (s: Submission, qid: string) => s.answers?.find(a => String(a.questionId) === String(qid));

  const renderQuestionBlock = (s: Submission, q: Question) => {
    const a = getAnswerFor(s, q._id!);
    const sid = s._id;
    const qid = String(q._id);
    const entry = manual[sid]?.perQuestion?.[qid] || {};
    const setEntry = (patch: Partial<{ score: string; feedback: string }>) => {
      setManual(prev => ({
        ...prev,
        [sid]: {
          ...prev[sid],
          perQuestion: {
            ...(prev[sid]?.perQuestion || {}),
            [qid]: { ...(prev[sid]?.perQuestion?.[qid] || {}), ...patch }
          }
        }
      }));
    };
    const studentAnswer = a?.answerText ?? (a?.selectedOption ?? '');
    return (
      <div key={qid} className="rounded border p-3 bg-white dark:bg-gray-900">
        <div className="text-sm font-medium">{q.prompt}</div>
        <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
          <span className="font-semibold">Student:</span> {String(studentAnswer)}
        </div>
        {q.type === 'mcq' && Array.isArray(q.options) && typeof a?.selectedOption !== 'undefined' && (
          <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">Selected: {q.options?.[a?.selectedOption as number] ?? a?.selectedOption}</div>
        )}
        <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1">Score (0-10)</label>
            <input type="number" min={0} max={10} step={1}
              value={entry.score ?? ''}
              onChange={e => setEntry({ score: e.target.value })}
              className="w-full border rounded px-2 py-1 bg-white dark:bg-gray-900" />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium mb-1">Per-question feedback (optional)</label>
            <input
              value={entry.feedback ?? ''}
              onChange={e => setEntry({ feedback: e.target.value })}
              className="w-full border rounded px-2 py-1 bg-white dark:bg-gray-900" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">Submissions</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm">Grading mode:</span>
          <div className="flex items-center gap-2 text-sm">
            <label className="flex items-center gap-1">
              <input type="radio" name="gradingMode" checked={gradingMode==='ai'} onChange={() => setGradingMode('ai')} /> AI
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" name="gradingMode" checked={gradingMode==='manual'} onChange={() => setGradingMode('manual')} /> Manual
            </label>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {items.map(s => (
          <div key={s._id} className="rounded border p-4 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Student: {s.student}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Status: {s.status}{typeof s.grade === 'number' ? ` • Grade: ${s.grade}` : ''}</div>
              </div>
              <div className="flex items-center gap-2">
                {gradingMode === 'ai' && (
                  <button onClick={() => handleGrade(s._id)} disabled={busy === s._id || s.status === 'graded'}
                    className={`px-3 py-2 text-sm rounded ${s.status==='graded' ? 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'} disabled:opacity-60`}>
                    {s.status === 'graded' ? 'Graded' : (busy === s._id ? 'Grading...' : 'AI Grade')}
                  </button>
                )}
              </div>
            </div>
            {s.feedback && <div className="mt-2 text-sm">{s.feedback}</div>}
            {/* Per-question manual grading */}
            {gradingMode === 'manual' && assignment && assignment.questions?.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Per-question scores</div>
                {assignment.questions.map(q => renderQuestionBlock(s, q))}
              </div>
            )}

            {/* Manual grading summary */}
            {gradingMode === 'manual' && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-sm font-medium mb-1">Total Score (0-100)</label>
                <input type="number" min={0} max={100}
                  value={manual[s._id]?.totalScore ?? ''}
                  onChange={e => setManual(prev => ({ ...prev, [s._id]: { ...prev[s._id], totalScore: e.target.value } }))}
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Feedback</label>
                <input
                  value={manual[s._id]?.feedback ?? ''}
                  onChange={e => setManual(prev => ({ ...prev, [s._id]: { ...prev[s._id], feedback: e.target.value } }))}
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" />
              </div>
              <div>
                <button onClick={() => handleManualGrade(s._id)} disabled={busy === s._id}
                  className="px-3 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60">{busy === s._id ? 'Saving...' : 'Save Manual Grade'}</button>
              </div>
            </div>
            )}
          </div>
        ))}
        {items.length === 0 && <div className="text-gray-600 dark:text-gray-400">No submissions yet.</div>}
      </div>
    </div>
  );
};

export default AssignmentSubmissionsPage;
