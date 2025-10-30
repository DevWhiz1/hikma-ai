import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { assignmentService, Assignment, Submission } from '../../services/assignmentService';

const AvailableAssignmentsPage: React.FC = () => {
  const [items, setItems] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await assignmentService.getStudentAssignments('assignment');
        setItems(res.assignments || []);
        
        // 🚀 FIX: Load submission status for each assignment
        try {
          const mySubmissions = await assignmentService.mySubmissions();
          const submissionsMap: Record<string, Submission> = {};
          (mySubmissions.submissions || []).forEach((s: Submission) => {
            submissionsMap[s.assignment] = s;
          });
          setSubmissions(submissionsMap);
        } catch (subErr) {
          console.warn('Could not load submission status:', subErr);
        }
      } catch (err: any) {
        console.error('Failed to load assignments:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const isDueSoon = (dueDate: string) => {
    const due = new Date(dueDate).getTime();
    const now = Date.now();
    const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return daysLeft >= 0 && daysLeft <= 3;
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate).getTime() < Date.now();
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mb-2">
          Available Assignments
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Complete assignments from your enrolled scholars
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">No assignments available</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Your scholars haven't published any assignments yet
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map(item => {
            const questionCount = item.questions?.length || 0;
            const dueDate = item.dueDate ? new Date(item.dueDate) : null;
            const isDue = dueDate && isDueSoon(item.dueDate);
            const isOver = dueDate && isOverdue(item.dueDate);
            const submission = submissions[item._id!];
            const isSubmitted = submission && (submission.status === 'submitted' || submission.status === 'graded');
            const isGraded = submission && submission.status === 'graded';
            
            return (
              <div
                key={item._id}
                className={`bg-white dark:bg-gray-800 rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow ${
                  isSubmitted 
                    ? 'border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {item.title}
                      </h2>
                      {/* 🚀 FIX: Show submission status prominently */}
                      {isSubmitted && (
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                          isGraded
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                          {isGraded ? '✅ Graded' : '📝 Submitted'}
                        </span>
                      )}
                      {isOver && !isSubmitted && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                          ⚠️ Overdue
                        </span>
                      )}
                      {isDue && !isOver && !isSubmitted && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                          ⏰ Due Soon
                        </span>
                      )}
                    </div>
                    
                    {item.description && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <span>📚</span> {questionCount} question{questionCount !== 1 ? 's' : ''}
                      </span>
                      {dueDate && (
                        <span className={`flex items-center gap-1 ${
                          isOver && !isSubmitted ? 'text-red-600 dark:text-red-400 font-semibold' :
                          isDue && !isSubmitted ? 'text-orange-600 dark:text-orange-400 font-medium' :
                          'text-gray-600 dark:text-gray-400'
                        }`}>
                          <span>📅</span> Due: {dueDate.toLocaleDateString()} at {dueDate.toLocaleTimeString()}
                        </span>
                      )}
                      {isSubmitted && submission.submittedAt && (
                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                          <span>📤</span> Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                        </span>
                      )}
                      {isGraded && typeof submission.grade === 'number' && (
                        <span className={`px-2 py-1 rounded-full font-bold text-sm ${
                          submission.grade >= 70 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          submission.grade >= 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          Grade: {submission.grade}%
                        </span>
                      )}
                      {(item as any).createdBy && (
                        <span className="text-gray-500 dark:text-gray-500">
                          By: {(item as any).createdBy?.name || 'Scholar'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {isSubmitted ? (
                    <Link
                      to="/me/submissions"
                      className="px-6 py-2.5 rounded-lg font-medium transition-colors bg-green-600 text-white hover:bg-green-700"
                    >
                      {isGraded ? '✅ View Grade' : '📝 View Submission'}
                    </Link>
                  ) : (
                    <Link
                      to={`/assignments/${item._id}/take`}
                      className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                        isOver
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {isOver ? 'View (Overdue)' : '📝 Start Assignment'}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AvailableAssignmentsPage;
