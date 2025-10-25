import React, { useEffect, useState } from 'react';
import { assignmentService, Submission } from '../../services/assignmentService';

const MySubmissionsPage: React.FC = () => {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await assignmentService.mySubmissions();
        setItems(res.submissions || []);
      } finally { setLoading(false); }
    }
    load();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mb-4">My Submissions</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-3">
          {items.map(s => (
            <div key={s._id} className="rounded border p-4 bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Assignment: {s.assignment}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Status: {s.status}{typeof s.grade === 'number' ? ` • Grade: ${s.grade}` : ''}</div>
                </div>
                {s.feedback && <div className="text-sm max-w-md text-right">{s.feedback}</div>}
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-gray-600 dark:text-gray-400">No submissions yet.</div>}
        </div>
      )}
    </div>
  );
};

export default MySubmissionsPage;
