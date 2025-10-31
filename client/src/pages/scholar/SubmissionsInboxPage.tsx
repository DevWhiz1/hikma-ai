import React, { useEffect, useState } from 'react';
import { assignmentService, Submission } from '../../services/assignmentService';

const SubmissionsInboxPage: React.FC = () => {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await assignmentService.inbox(status || undefined);
      setItems(res.submissions || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [status]);

  const handleGrade = async (sid: string) => {
    setBusy(sid);
    try {
      await assignmentService.grade(sid);
      await load();
    } catch {
      alert('AI grading failed. Configure Python environment and GEMINI_API_KEY.');
    } finally { setBusy(null); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">Check Assignments</h1>
        <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded px-3 py-2 bg-white dark:bg-gray-900">
          <option value="">All</option>
          <option value="submitted">Submitted</option>
          <option value="graded">Graded</option>
          <option value="resubmission-requested">Resubmission Requested</option>
        </select>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-3">
          {items.map(s => (
            <div key={s._id} className="rounded border p-4 bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Submission: {s._id}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Assignment: {s.assignment} • Student: {s.student}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Status: {s.status}{typeof s.grade === 'number' ? ` • Grade: ${s.grade}` : ''}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleGrade(s._id)} disabled={busy === s._id}
                    className="px-3 py-2 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60">{busy === s._id ? 'Grading...' : 'AI Grade'}</button>
                </div>
              </div>
              {s.feedback && <div className="mt-2 text-sm">{s.feedback}</div>}
            </div>
          ))}
          {items.length === 0 && <div className="text-gray-600 dark:text-gray-400">No submissions found.</div>}
        </div>
      )}
    </div>
  );
};

export default SubmissionsInboxPage;
