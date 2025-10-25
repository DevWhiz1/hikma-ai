import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assignmentService, Assignment, Submission } from '../../services/assignmentService';

const TakeAssignmentPage: React.FC = () => {
  const { id } = useParams();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [, setSub] = useState<Submission | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      try {
        const res = await assignmentService.get(id);
        setAssignment(res.assignment);
      } catch {
        // ignore
      } finally { setLoading(false); }
    }
    load();
  }, [id]);

  const handleSubmit = async () => {
    if (!id || !assignment) return;
    const payload = (assignment.questions || []).map(q => ({
      questionId: q._id as any,
      answerText: q.type !== 'mcq' ? answers[q._id!] : undefined,
      selectedOption: q.type === 'mcq' ? answers[q._id!] : undefined,
    }));
    try {
      await assignmentService.submit(id, payload);
      navigate('/me/submissions');
    } catch {
      alert('Failed to submit');
    }
  };

  // Start quiz attempt
  const handleStart = async () => {
    if (!id) return;
    try {
      const res = await assignmentService.startAttempt(id);
      const s = (res as any).submission || (res as any).data || res; // accommodate shape
      setSub(s);
      if (s?.endAt) {
        const end = new Date(s.endAt).getTime();
        const now = Date.now();
        const secs = Math.max(0, Math.floor((end - now) / 1000));
        setSecondsLeft(secs);
      }
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Cannot start quiz yet');
    }
  };

  // Countdown for quiz
  useEffect(() => {
    if (!secondsLeft && secondsLeft !== 0) return;
    if (secondsLeft <= 0) {
      if (!autoSubmitting) {
        setAutoSubmitting(true);
        // auto-submit
        handleSubmit();
      }
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s ?? 0) - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const duePassed = useMemo(() => {
    if (!assignment?.dueDate) return false;
    return Date.now() > new Date(assignment.dueDate).getTime();
  }, [assignment?.dueDate]);

  const quizStarted = assignment?.kind === 'quiz' && typeof secondsLeft === 'number';

  if (loading) return <div className="p-6">Loading...</div>;
  if (!assignment) return <div className="p-6">Assignment not found.</div>;

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mb-4">{assignment.title}</h1>
      {assignment.description && <p className="mb-4 text-gray-700 dark:text-gray-300">{assignment.description}</p>}
      {assignment.kind === 'assignment' && assignment.dueDate && (
        <div className="mb-4 text-sm">Due: {new Date(assignment.dueDate).toLocaleString()} {duePassed && <span className="text-red-600">(deadline passed)</span>}</div>
      )}
      {assignment.kind === 'quiz' && (
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
          {quizStarted ? (
            <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">Time left: {Math.floor((secondsLeft||0)/60)}m {(secondsLeft||0)%60}s</span>
          ) : (
            <button onClick={handleStart} className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">Start Quiz</button>
          )}
          {assignment.quizWindowStart && <span>Opens: {new Date(assignment.quizWindowStart).toLocaleString()}</span>}
          {assignment.quizWindowEnd && <span>Closes: {new Date(assignment.quizWindowEnd).toLocaleString()}</span>}
          {assignment.durationMinutes && <span>Duration: {assignment.durationMinutes} min</span>}
        </div>
      )}
      {/* Only show quiz questions after Start. Assignments show immediately. */}
      {(assignment.kind === 'assignment' || quizStarted) ? (
        <div className="space-y-6">
        {(assignment.questions || []).map((q, idx) => (
          <div key={q._id || idx} className="rounded border p-4 bg-white dark:bg-gray-900">
            <div className="font-medium mb-2">Q{idx+1}. {q.prompt}</div>
            {q.type === 'mcq' ? (
              <div className="space-y-2">
                {(q.options || []).map((opt, i) => (
                  <label key={i} className="flex items-center gap-2">
                    <input type="radio" name={`q_${q._id}`} checked={answers[q._id!] === i} onChange={() => setAnswers({ ...answers, [q._id!]: i })} disabled={assignment.kind==='quiz' && (!quizStarted || (typeof secondsLeft==='number' && secondsLeft<=0))} />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            ) : q.type === 'true-false' ? (
              <div className="space-y-2">
                {['True', 'False'].map((opt, i) => (
                  <label key={i} className="flex items-center gap-2">
                    <input type="radio" name={`q_${q._id}`} checked={answers[q._id!] === i} onChange={() => setAnswers({ ...answers, [q._id!]: i })} disabled={assignment.kind==='quiz' && (!quizStarted || (typeof secondsLeft==='number' && secondsLeft<=0))} />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea rows={4} value={answers[q._id!] || ''} onChange={(e) => setAnswers({ ...answers, [q._id!]: e.target.value })} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" disabled={assignment.kind==='quiz' && (!quizStarted || (typeof secondsLeft==='number' && secondsLeft<=0))} />
            )}
          </div>
        ))}
        </div>
      ) : (
        assignment.kind === 'quiz' ? (
          <div className="rounded border p-4 bg-white dark:bg-gray-900 mb-4 text-sm text-gray-700 dark:text-gray-300">
            Questions will appear after you click "Start Quiz".
          </div>
        ) : null
      )}
      <div className="mt-6 flex items-center gap-2">
        {assignment.kind === 'assignment' || quizStarted ? (
          <button onClick={handleSubmit} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700" disabled={(assignment.kind==='assignment' && duePassed) || (assignment.kind==='quiz' && typeof secondsLeft==='number' && secondsLeft<0)}>Submit</button>
        ) : null}
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded">Cancel</button>
      </div>
    </div>
  );
};

export default TakeAssignmentPage;
