import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { assignmentService, Assignment, Submission } from '../../services/assignmentService';

const AvailableQuizzesPage: React.FC = () => {
  const [items, setItems] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await assignmentService.getStudentAssignments('quiz');
        setItems(res.assignments || []);
        
        // 🚀 FIX: Load submission status for each quiz
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
        console.error('Failed to load quizzes:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const isQuizOpen = (quiz: Assignment) => {
    const now = Date.now();
    if (quiz.quizWindowStart && now < new Date(quiz.quizWindowStart).getTime()) {
      return false; // Not started yet
    }
    if (quiz.quizWindowEnd && now > new Date(quiz.quizWindowEnd).getTime()) {
      return false; // Window closed
    }
    return true;
  };

  const getQuizStatus = (quiz: Assignment) => {
    const now = Date.now();
    if (quiz.quizWindowStart && now < new Date(quiz.quizWindowStart).getTime()) {
      return { status: 'upcoming', message: `Opens: ${new Date(quiz.quizWindowStart).toLocaleString()}` };
    }
    if (quiz.quizWindowEnd && now > new Date(quiz.quizWindowEnd).getTime()) {
      return { status: 'closed', message: `Closed: ${new Date(quiz.quizWindowEnd).toLocaleString()}` };
    }
    return { status: 'open', message: 'Available now' };
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mb-2">
          Available Quizzes
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Take timed quizzes from your enrolled scholars
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">No quizzes available</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Your scholars haven't published any quizzes yet
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map(item => {
            const questionCount = item.questions?.length || 0;
            const quizStatus = getQuizStatus(item);
            const isOpen = isQuizOpen(item);
            const submission = submissions[item._id!];
            const isSubmitted = submission && (submission.status === 'submitted' || submission.status === 'graded');
            const isGraded = submission && submission.status === 'graded';
            
            return (
              <div
                key={item._id}
                className={`bg-white dark:bg-gray-800 rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow ${
                  isSubmitted
                    ? 'border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10'
                    : isOpen
                    ? 'border-emerald-200 dark:border-emerald-800'
                    : 'border-gray-200 dark:border-gray-700 opacity-75'
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
                      {!isSubmitted && (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          quizStatus.status === 'open'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : quizStatus.status === 'upcoming'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {quizStatus.status === 'open' ? '✅ Open' :
                           quizStatus.status === 'upcoming' ? '⏰ Upcoming' :
                           '🔒 Closed'}
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
                      {item.durationMinutes && (
                        <span className="flex items-center gap-1">
                          <span>⏱️</span> {item.durationMinutes} minutes
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
                      {item.quizWindowStart && !isSubmitted && (
                        <span className="flex items-center gap-1">
                          <span>📅</span> Opens: {new Date(item.quizWindowStart).toLocaleString()}
                        </span>
                      )}
                      {item.quizWindowEnd && !isSubmitted && (
                        <span className="flex items-center gap-1">
                          <span>🕐</span> Closes: {new Date(item.quizWindowEnd).toLocaleString()}
                        </span>
                      )}
                      {(item as any).createdBy && (
                        <span className="text-gray-500 dark:text-gray-500">
                          By: {(item as any).createdBy?.name || 'Scholar'}
                        </span>
                      )}
                    </div>
                    
                    {quizStatus.status !== 'open' && !isSubmitted && (
                      <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                        <p className="text-xs text-yellow-800 dark:text-yellow-200">
                          {quizStatus.message}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {isSubmitted ? (
                    <Link
                      to="/me/submissions"
                      className="px-6 py-2.5 rounded-lg font-medium transition-colors bg-green-600 text-white hover:bg-green-700"
                    >
                      {isGraded ? '✅ View Grade' : '📝 View Submission'}
                    </Link>
                  ) : isOpen ? (
                    <Link
                      to={`/assignments/${item._id}/take`}
                      className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                    >
                      ▶️ Start Quiz
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="px-6 py-2.5 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed font-medium"
                    >
                      {quizStatus.status === 'upcoming' ? '⏰ Not Started' : '🔒 Closed'}
                    </button>
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

export default AvailableQuizzesPage;
