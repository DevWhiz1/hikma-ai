import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { assignmentService, Assignment } from '../../services/assignmentService';

const AssignmentsPage: React.FC = () => {
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
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

  const handleGenerate = async (id: string) => {
    setBusyId(id);
    try {
      await assignmentService.generate(id);
      await load();
    } catch (e) {
      alert('AI generation failed. Ensure Python + google-generativeai and GEMINI_API_KEY are configured.');
    } finally {
      setBusyId(null);
    }
  };

  const handlePublish = async (id: string) => {
    setBusyId(id);
    try {
      await assignmentService.publish(id);
      await load();
    } catch (e) {
      alert('Publish failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">Assignments</h1>
        <button
          onClick={() => navigate('/scholar/assignments/new')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >New Assignment</button>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <div className="grid gap-4">
          {items.map(item => (
            <div key={item._id} className="rounded-lg border border-emerald-200/60 dark:border-emerald-800/60 bg-white/70 dark:bg-gray-900/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{item.title}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status: {item.status} • Questions: {item.questions?.length || 0}</p>
                </div>
                <div className="flex items-center gap-2">
                  {item.status === 'draft' && (
                    <button onClick={() => handleGenerate(item._id)} disabled={busyId === item._id}
                      className="px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">{busyId === item._id ? 'Generating...' : 'AI Generate'}</button>
                  )}
                  {item.status !== 'published' && (
                    <button onClick={() => handlePublish(item._id)} disabled={busyId === item._id}
                      className="px-3 py-2 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60">Publish</button>
                  )}
                  <Link to={`/scholar/assignments/${item._id}/builder`} className="px-3 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700">Edit</Link>
                  <Link to={`/scholar/assignments/${item._id}/submissions`} className="px-3 py-2 text-sm rounded bg-gray-200 dark:bg-gray-700">Submissions</Link>
                </div>
              </div>
              {item.description && <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{item.description}</p>}
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-gray-600 dark:text-gray-400">No assignments yet.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;
