import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { assignmentService, Assignment } from '../../services/assignmentService';

const AvailableAssignmentsPage: React.FC = () => {
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // 🚀 UPDATED: Use enrollment-filtered endpoint
        const res = await assignmentService.getStudentAssignments('assignment');
        setItems(res.assignments || []);
      } finally { setLoading(false); }
    }
    load();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mb-4">Available Assignments</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4">
          {items.map(item => (
            <div key={item._id} className="rounded border p-4 bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{item.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Questions: {item.questions?.length || 0}</div>
                </div>
                <Link to={`/assignments/${item._id}/take`} className="px-3 py-2 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700">Start</Link>
              </div>
              {item.description && <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{item.description}</p>}
            </div>
          ))}
          {items.length === 0 && <div className="text-gray-600 dark:text-gray-400">No assignments yet.</div>}
        </div>
      )}
    </div>
  );
};

export default AvailableAssignmentsPage;
