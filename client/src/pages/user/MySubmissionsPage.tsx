import React, { useEffect, useState } from 'react';
import { assignmentService, Submission, Assignment } from '../../services/assignmentService';

const MySubmissionsPage: React.FC = () => {
  const [items, setItems] = useState<Submission[]>([]);
  const [assignments, setAssignments] = useState<{ [key: string]: Assignment }>({});
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await assignmentService.mySubmissions();
        const subs = res.submissions || [];
        setItems(subs);
        
        // Fetch assignment details for each submission
        const assignmentMap: { [key: string]: Assignment } = {};
        for (const sub of subs) {
          if (sub.assignment && !assignmentMap[sub.assignment]) {
            try {
              const aRes = await assignmentService.get(sub.assignment);
              if (aRes.ok && aRes.assignment) {
                assignmentMap[sub.assignment] = aRes.assignment;
              }
            } catch (e) {
              console.error('Failed to fetch assignment:', e);
            }
          }
        }
        setAssignments(assignmentMap);
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const getQuestionPrompt = (assignmentId: string, questionId: string): string => {
    const assignment = assignments[assignmentId];
    if (!assignment) return 'Question';
    const q = assignment.questions?.find((qu: any) => qu._id === questionId);
    return q?.prompt || 'Question';
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mb-4">My Submissions</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-3">
          {items.map(s => {
            const assignment = assignments[s.assignment];
            const isExpanded = expandedId === s._id;
            const hasGrades = s.status === 'graded' && (s as any).aiGrading?.perQuestion?.length > 0;
            
            return (
              <div key={s._id} className="rounded border p-4 bg-white dark:bg-gray-900">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-lg">{assignment?.title || 'Assignment'}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Status: <span className="font-semibold capitalize">{s.status}</span>
                      {typeof s.grade === 'number' && (
                        <span className="ml-3 text-emerald-600 dark:text-emerald-400 font-bold">
                          Grade: {s.grade}%
                        </span>
                      )}
                    </div>
                    {s.submittedAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        Submitted: {new Date(s.submittedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                  
                  {hasGrades && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : s._id)}
                      className="ml-4 px-4 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700"
                    >
                      {isExpanded ? 'Hide Details' : 'View Detailed Grades'}
                    </button>
                  )}
                </div>
                
                {s.feedback && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                    <div className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">Overall Feedback:</div>
                    <div className="text-sm text-blue-800 dark:text-blue-300">{s.feedback}</div>
                  </div>
                )}
                
                {/* Detailed per-question grades */}
                {isExpanded && hasGrades && (
                  <div className="mt-4 border-t pt-4">
                    <h3 className="font-semibold text-lg mb-3">Question-by-Question Breakdown:</h3>
                    <div className="space-y-3">
                      {((s as any).aiGrading?.perQuestion || []).map((pq: any, idx: number) => {
                        const questionPrompt = getQuestionPrompt(s.assignment, pq.questionId);
                        const scorePercent = Math.round((pq.score / 10) * 100);
                        const scoreColor = pq.score >= 7 ? 'text-green-600 dark:text-green-400' : 
                                          pq.score >= 5 ? 'text-yellow-600 dark:text-yellow-400' : 
                                          'text-red-600 dark:text-red-400';
                        
                        return (
                          <div key={pq.questionId || idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-sm mb-1">
                                  Q{idx + 1}: {questionPrompt}
                                </div>
                                {pq.feedback && (
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {pq.feedback}
                                  </div>
                                )}
                              </div>
                              <div className={`ml-4 text-lg font-bold ${scoreColor}`}>
                                {pq.score}/10
                                <div className="text-xs font-normal text-gray-500">
                                  ({scorePercent}%)
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {(s as any).aiGrading?.reasoning && (
                      <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded border border-indigo-200 dark:border-indigo-800">
                        <div className="text-sm font-medium text-indigo-900 dark:text-indigo-200 mb-1">AI Grader's Notes:</div>
                        <div className="text-sm text-indigo-800 dark:text-indigo-300">{(s as any).aiGrading.reasoning}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {items.length === 0 && <div className="text-gray-600 dark:text-gray-400">No submissions yet.</div>}
        </div>
      )}
    </div>
  );
};

export default MySubmissionsPage;
