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

  const getAnswerFor = (s: Submission, qid: string) => {
    return s.answers?.find(a => String(a.questionId) === String(qid));
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 80) return 'text-green-600 dark:text-green-400';
    if (grade >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getGradeBadgeColor = (grade: number) => {
    if (grade >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    if (grade >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mb-2">My Submissions</h1>
        <p className="text-gray-600 dark:text-gray-400">View your assignment and quiz submissions</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">No submissions yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Complete assignments or quizzes to see your submissions here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(s => {
            const assignment = assignments[s.assignment];
            const isExpanded = expandedId === s._id;
            const hasAIGrades = s.status === 'graded' && (s as any).aiGrading?.perQuestion?.length > 0;
            const hasManualGrades = s.status === 'graded' && (s as any).manualGrading?.perQuestion?.length > 0;
            const hasGrades = hasAIGrades || hasManualGrades;
            const gradingType = hasManualGrades ? 'manual' : hasAIGrades ? 'ai' : null;
            // 🚀 FIX: Check grade from multiple sources - prioritize submission.grade, then aiGrading.totalScore, then manualGrading.totalScore
            const displayGrade = typeof s.grade === 'number' && !isNaN(s.grade) 
              ? s.grade 
              : (typeof (s as any).aiGrading?.totalScore === 'number' && !isNaN((s as any).aiGrading.totalScore))
                ? (s as any).aiGrading.totalScore
                : (typeof (s as any).manualGrading?.totalScore === 'number' && !isNaN((s as any).manualGrading.totalScore))
                  ? (s as any).manualGrading.totalScore
                  : null;
            
            return (
              <div
                key={s._id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {assignment?.title || 'Assignment'}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        assignment?.kind === 'quiz' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      }`}>
                        {assignment?.kind === 'quiz' ? '⏱️ Quiz' : '📝 Assignment'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="capitalize font-medium">
                        Status: <span className={`font-semibold ${
                          s.status === 'graded' ? 'text-emerald-600 dark:text-emerald-400' :
                          s.status === 'submitted' ? 'text-blue-600 dark:text-blue-400' :
                          'text-gray-600 dark:text-gray-400'
                        }`}>
                          {s.status.replace('_', ' ')}
                        </span>
                      </span>
                      
                      {displayGrade !== null && (
                        <span className={`px-3 py-1 rounded-full font-bold text-lg ${getGradeBadgeColor(displayGrade)}`}>
                          {displayGrade}%
                        </span>
                      )}
                      
                      {s.submittedAt && (
                        <span className="text-xs">
                          📅 {new Date(s.submittedAt).toLocaleDateString()} at {new Date(s.submittedAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {hasGrades && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : s._id)}
                      className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
                    >
                      {isExpanded ? (
                        <>
                          <span>▲</span> Hide Details
                        </>
                      ) : (
                        <>
                          <span>▼</span> View Detailed Grades
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Overall Feedback */}
                {s.feedback && (
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 text-xl">💬</span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                          Overall Feedback:
                        </div>
                        <div className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-wrap">
                          {s.feedback}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Summary */}
                {hasGrades && !isExpanded && displayGrade !== null && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Graded by: <span className="font-medium text-gray-900 dark:text-white">
                          {gradingType === 'manual' ? 'Scholar (Manual)' : gradingType === 'ai' ? 'AI Assistant' : 'Unknown'}
                        </span>
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        Questions: {assignment?.questions?.length || 0}
                      </span>
                    </div>
                  </div>
                )}

                {/* Detailed per-question grades */}
                {isExpanded && hasGrades && assignment && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        📊 Question-by-Question Breakdown
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {gradingType === 'manual' ? 'Manually graded by scholar' : 'Graded by AI'}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {(gradingType === 'manual' 
                        ? (s as any).manualGrading?.perQuestion || []
                        : (s as any).aiGrading?.perQuestion || []
                      ).map((pq: any, idx: number) => {
                        const question = assignment.questions?.find((q: any) => String(q._id) === String(pq.questionId));
                        const answer = getAnswerFor(s, pq.questionId);
                        const scorePercent = Math.round((pq.score / 10) * 100);
                        const scoreColor = pq.score >= 7 ? 'text-green-600 dark:text-green-400' : 
                                          pq.score >= 5 ? 'text-yellow-600 dark:text-yellow-400' : 
                                          'text-red-600 dark:text-red-400';
                        
                        return (
                          <div
                            key={pq.questionId || idx}
                            className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
                                    {idx + 1}
                                  </span>
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase">
                                    {question?.type || 'question'}
                                  </span>
                                </div>
                                <div className="font-medium text-gray-900 dark:text-white mb-2">
                                  {question?.prompt || 'Question'}
                                </div>
                                
                                {/* Student Answer */}
                                <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                    Your Answer:
                                  </div>
                                  <div className="text-sm text-gray-900 dark:text-white">
                                    {answer?.answerText || (
                                      question?.type === 'mcq' && Array.isArray(question.options) && typeof answer?.selectedOption === 'number'
                                        ? question.options[answer.selectedOption] || `Option ${answer.selectedOption + 1}`
                                        : answer?.selectedOption !== undefined
                                        ? String(answer.selectedOption)
                                        : 'No answer provided'
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Score Display */}
                              <div className={`ml-4 text-right ${scoreColor}`}>
                                <div className="text-2xl font-bold">
                                  {pq.score}/10
                                </div>
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                                  ({scorePercent}%)
                                </div>
                              </div>
                            </div>

                            {/* Per-question feedback */}
                            {pq.feedback && (
                              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                                <div className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1">
                                  {gradingType === 'manual' ? '📝 Scholar Feedback:' : '🤖 AI Feedback:'}
                                </div>
                                <div className="text-sm text-blue-800 dark:text-blue-300">
                                  {pq.feedback}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Overall Reasoning/AI Notes */}
                    {gradingType === 'ai' && (s as any).aiGrading?.reasoning && (
                      <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                        <div className="flex items-start gap-2">
                          <span className="text-indigo-600 dark:text-indigo-400 text-xl">🤖</span>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-indigo-900 dark:text-indigo-200 mb-1">
                              AI Grader's Overall Assessment:
                            </div>
                            <div className="text-sm text-indigo-800 dark:text-indigo-300 whitespace-pre-wrap">
                              {(s as any).aiGrading.reasoning}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Manual Grading Notes */}
                    {gradingType === 'manual' && (s as any).manualGrading?.feedback && (
                      <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-start gap-2">
                          <span className="text-purple-600 dark:text-purple-400 text-xl">📝</span>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-1">
                              Scholar's Additional Notes:
                            </div>
                            <div className="text-sm text-purple-800 dark:text-purple-300 whitespace-pre-wrap">
                              {(s as any).manualGrading.feedback}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Not graded yet */}
                {s.status === 'submitted' && !hasGrades && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⏳ Your submission is being reviewed. Grades will appear here once your scholar has graded it.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MySubmissionsPage;
