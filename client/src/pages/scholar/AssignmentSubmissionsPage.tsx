import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { assignmentService, Submission, Assignment, Question } from '../../services/assignmentService';

const AssignmentSubmissionsPage: React.FC = () => {
  const { id } = useParams(); // assignment id
  const [items, setItems] = useState<Submission[]>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [manual, setManual] = useState<Record<string, { totalScore?: string; feedback?: string; perQuestion?: Record<string, { score?: string; feedback?: string }> }>>({});
  // 🚀 DISABLED: AI grading - using manual grading only
  // const [gradingMode, setGradingMode] = useState<'ai' | 'manual'>('ai');
  const [gradingMode] = useState<'ai' | 'manual'>('manual'); // Force manual grading only
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [subRes, aRes] = await Promise.all([
        assignmentService.listSubmissions(id),
        assignmentService.get(id)
      ]);
      setItems(subRes.submissions || []);
      setAssignment(aRes.assignment || null);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  // 🚀 DISABLED: AI grading functionality - using manual grading only
  // const handleGrade = async (sid: string) => {
  //   setBusy(sid);
  //   try {
  //     await assignmentService.grade(sid);
  //     await load();
  //     alert('✅ AI grading completed successfully!\n\nThe submission has been graded and the student has been notified.');
  //   } catch (err: any) {
  //     alert(err?.response?.data?.error || 'AI grading failed. Check your Python environment and CrewAI setup.');
  //   } finally { setBusy(null); }
  // };

  const handleManualGrade = async (sid: string) => {
    const form = manual[sid] || {};
    // Build perQuestion array
    const pqMap = form.perQuestion || {};
    const perQuestion = Object.entries(pqMap).map(([questionId, v]) => ({
      questionId,
      score: v.score ? parseFloat(v.score) : 0,
      feedback: v.feedback || undefined
    }));
    
    // Auto-calc total if not provided
    let totalScore = form.totalScore ? parseFloat(form.totalScore) : undefined;
    if ((totalScore === undefined || isNaN(totalScore)) && perQuestion.length > 0) {
      const sum = perQuestion.reduce((acc, p) => acc + (typeof p.score === 'number' ? p.score : 0), 0);
      totalScore = Math.round((100 * sum) / (10 * perQuestion.length) * 100) / 100;
    }
    
    if (totalScore === undefined || isNaN(totalScore)) {
      alert('Please provide a total score or ensure per-question scores are set');
      return;
    }
    
    setBusy(sid);
    try {
      await assignmentService.manualGrade(sid, { totalScore, feedback: form.feedback, perQuestion });
      // 🚀 FIX: Clear form before reloading so it disappears immediately
      setManual(prev => {
        const updated = { ...prev };
        delete updated[sid];
        return updated;
      });
      await load(); // Reload to get updated submission status
      alert('✅ Manual grade saved successfully!\n\nThe student has been notified of their grade and feedback.');
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Manual grade failed');
    } finally { setBusy(null); }
  };

  const handleOverrideGrade = async (sid: string) => {
    const form = manual[sid] || {};
    const totalScore = form.totalScore ? parseFloat(form.totalScore) : undefined;
    if (!totalScore || isNaN(totalScore)) {
      alert('Please provide a total score');
      return;
    }
    
    const reason = prompt('Reason for override:');
    if (!reason) return;
    
    setBusy(sid);
    try {
      await assignmentService.override(sid, {
        grade: totalScore,
        feedback: form.feedback,
        reason
      });
      await load();
      alert('✅ Grade override saved successfully!\n\nThe updated grade has been applied and the student will be notified.');
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Override failed');
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
      <div key={qid} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
        <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{q.prompt}</div>
        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Student Answer:</div>
          <div className="text-sm text-gray-900 dark:text-white">
            {q.type === 'mcq' && Array.isArray(q.options) && typeof a?.selectedOption === 'number'
              ? q.options[a.selectedOption] || `Option ${a.selectedOption + 1}`
              : String(studentAnswer) || 'No answer provided'}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Score (0-10)</label>
            <input
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={entry.score ?? ''}
              onChange={e => setEntry({ score: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Feedback (optional)</label>
            <input
              value={entry.feedback ?? ''}
              onChange={e => setEntry({ feedback: e.target.value })}
              placeholder="Provide feedback for this answer..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mb-2">
              {assignment?.title || 'Submissions'}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>📊 {items.length} submission{items.length !== 1 ? 's' : ''}</span>
              <span>📝 {assignment?.questions?.length || 0} question{assignment?.questions?.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Grading Mode Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            {/* 🚀 DISABLED: Grading Mode Toggle - Manual grading only */}
            {/* <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Grading Method
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Choose how you want to grade submissions
              </p>
            </div>
            <div className="flex items-center gap-4">
              <label className={`flex items-center gap-3 cursor-pointer p-3 border-2 rounded-lg transition-all ${
                gradingMode === 'ai' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-300 dark:border-gray-600'
              }`}>
                <input
                  type="radio"
                  name="gradingMode"
                  checked={gradingMode === 'ai'}
                  onChange={() => setGradingMode('ai')}
                  className="w-5 h-5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">🤖 AI Grading</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Automated grading with AI</div>
                </div>
              </label>
              <label className={`flex items-center gap-3 cursor-pointer p-3 border-2 rounded-lg transition-all ${
                gradingMode === 'manual' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-300 dark:border-gray-600'
              }`}>
                <input
                  type="radio"
                  name="gradingMode"
                  checked={gradingMode === 'manual'}
                  onChange={() => setGradingMode('manual')}
                  className="w-5 h-5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">✏️ Manual Grading</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Grade each question yourself</div>
                </div>
              </label>
            </div> */}
          </div>
          
          {/* Manual Grading Notice */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✏️</span>
              <div>
                <div className="font-semibold text-blue-900 dark:text-blue-200">Manual Grading Mode</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Grade each submission manually using the grading interface below.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">No submissions yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Students haven't submitted this assignment yet
            </p>
          </div>
        ) : (
          items.map(s => {
            const isExpanded = expandedId === s._id;
            const hasAIGrades = s.status === 'graded' && (s as any).aiGrading?.perQuestion?.length > 0;
            const hasManualGrades = s.status === 'graded' && (s as any).manualGrading?.perQuestion?.length > 0;
            const isGraded = s.status === 'graded';
            // 🚀 FIX: Check grade from multiple sources - prioritize submission.grade, then aiGrading.totalScore, then manualGrading.totalScore
            const currentGrade = typeof s.grade === 'number' && !isNaN(s.grade) 
              ? s.grade 
              : (typeof (s as any).aiGrading?.totalScore === 'number' && !isNaN((s as any).aiGrading.totalScore))
                ? (s as any).aiGrading.totalScore
                : (typeof (s as any).manualGrading?.totalScore === 'number' && !isNaN((s as any).manualGrading.totalScore))
                  ? (s as any).manualGrading.totalScore
                  : null;
            
            return (
              <div
                key={s._id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
              >
                {/* Submission Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {typeof (s as any).student === 'object' && (s as any).student?.name 
                          ? `${(s as any).student.name}'s Submission`
                          : 'Student Submission'}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        s.status === 'graded'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : s.status === 'submitted'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {s.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {currentGrade !== null && (
                        <span className={`px-3 py-1 rounded-full font-bold text-lg ${
                          currentGrade >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          currentGrade >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {currentGrade}%
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {typeof (s as any).student === 'object' && (s as any).student && (
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          👤 {(s as any).student.name || (s as any).student.email || 'Student'}
                          {(s as any).student.email && (s as any).student.name && (
                            <span className="text-gray-500 dark:text-gray-500 ml-2">({(s as any).student.email})</span>
                          )}
                        </span>
                      )}
                      {s.submittedAt && (
                        <span className="ml-4">📅 Submitted: {new Date(s.submittedAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* 🚀 FIX: Show View Details button for all submissions (graded or not) */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : s._id)}
                      className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                    >
                      {isExpanded ? '▲ Hide Details' : '▼ View Details'}
                    </button>
                    
                    {/* 🚀 DISABLED: AI grading button */}
                    {/* {gradingMode === 'ai' && !isGraded && (
                      <button
                        onClick={() => handleGrade(s._id)}
                        disabled={busy === s._id}
                        className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
                      >
                        {busy === s._id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Grading...
                          </>
                        ) : (
                          <>🤖 AI Grade</>
                        )}
                      </button>
                    )} */}
                    
                    {isGraded && (
                      <button
                        onClick={() => handleOverrideGrade(s._id)}
                        disabled={busy === s._id}
                        className="px-3 py-2 text-xs bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors font-medium"
                      >
                        Override
                      </button>
                    )}
                  </div>
                </div>

                {/* Overall Feedback */}
                {s.feedback && (
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                      Overall Feedback:
                    </div>
                    <div className="text-sm text-blue-800 dark:text-blue-300">{s.feedback}</div>
                  </div>
                )}

                {/* 🚀 DISABLED: AI Grading Details - Commented out but kept for reference */}
                {/* {isExpanded && hasAIGrades && assignment && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <span>🤖</span> AI Grading Breakdown
                    </h3>
                    <div className="space-y-3">
                      {((s as any).aiGrading?.perQuestion || []).map((pq: any, idx: number) => {
                        const question = assignment.questions?.find((q: any) => String(q._id) === String(pq.questionId));
                        const answer = getAnswerFor(s, pq.questionId);
                        const isEssay = question?.type === 'essay';
                        const needsManualGrading = pq.score === null || pq.score === undefined;
                        const scorePercent = needsManualGrading ? null : Math.round((pq.score / 10) * 100);
                        const scoreColor = needsManualGrading ? 'text-orange-600 dark:text-orange-400' :
                                          pq.score >= 7 ? 'text-green-600 dark:text-green-400' : 
                                          pq.score >= 5 ? 'text-yellow-600 dark:text-yellow-400' : 
                                          'text-red-600 dark:text-red-400';
                        
                        return (
                          <div key={pq.questionId || idx} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`flex items-center justify-center w-7 h-7 rounded-full font-semibold text-sm ${
                                    needsManualGrading 
                                      ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                                      : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                                    {question?.prompt || 'Question'}
                                  </span>
                                  {needsManualGrading && (
                                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                                      ⚠️ Manual Grading Required
                                    </span>
                                  )}
                                </div>
                                <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Student Answer:</div>
                                  <div className="text-sm text-gray-900 dark:text-white">
                                    {answer?.answerText || (
                                      question?.type === 'mcq' && Array.isArray(question.options) && typeof answer?.selectedOption === 'number'
                                        ? question.options[answer.selectedOption] || `Option ${answer.selectedOption + 1}`
                                        : answer?.selectedOption !== undefined
                                        ? String(answer.selectedOption)
                                        : 'No answer'
                                    )}
                                  </div>
                                </div>
                              </div>
                              {needsManualGrading ? (
                                <div className="ml-4 text-right text-orange-600 dark:text-orange-400">
                                  <div className="text-sm font-semibold">⚠️ Needs Manual Grading</div>
                                </div>
                              ) : (
                                <div className={`ml-4 text-right ${scoreColor}`}>
                                  <div className="text-2xl font-bold">{pq.score}/10</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">({scorePercent}%)</div>
                                </div>
                              )}
                            </div>
                            {pq.feedback && (
                              <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded text-xs border border-gray-200 dark:border-gray-700">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">AI Feedback:</span>
                                <span className="ml-2 text-gray-600 dark:text-gray-400">{pq.feedback}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {(s as any).aiGrading?.reasoning && (
                      <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                        <div className="text-sm font-semibold text-indigo-900 dark:text-indigo-200 mb-1">
                          AI Overall Assessment:
                        </div>
                        <div className="text-sm text-indigo-800 dark:text-indigo-300 whitespace-pre-wrap">
                          {(s as any).aiGrading.reasoning}
                        </div>
                      </div>
                    )}
                  </div>
                )} */}

                {/* Manual Grading Details - Show after grading */}
                {isExpanded && hasManualGrades && assignment && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <span>✏️</span> Manual Grading Breakdown
                    </h3>
                    <div className="space-y-3">
                      {((s as any).manualGrading?.perQuestion || []).map((pq: any, idx: number) => {
                        const question = assignment.questions?.find((q: any) => String(q._id) === String(pq.questionId));
                        const answer = getAnswerFor(s, pq.questionId);
                        const scorePercent = typeof pq.score === 'number' ? Math.round((pq.score / 10) * 100) : 0;
                        const scoreColor = pq.score >= 7 ? 'text-green-600 dark:text-green-400' : 
                                          pq.score >= 5 ? 'text-yellow-600 dark:text-yellow-400' : 
                                          'text-red-600 dark:text-red-400';
                        
                        return (
                          <div key={pq.questionId || idx} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
                                    {idx + 1}
                                  </span>
                                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                                    {question?.prompt || 'Question'}
                                  </span>
                                </div>
                                <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Student Answer:</div>
                                  <div className="text-sm text-gray-900 dark:text-white">
                                    {answer?.answerText || (
                                      question?.type === 'mcq' && Array.isArray(question.options) && typeof answer?.selectedOption === 'number'
                                        ? question.options[answer.selectedOption] || `Option ${answer.selectedOption + 1}`
                                        : answer?.selectedOption !== undefined
                                        ? String(answer.selectedOption)
                                        : 'No answer'
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className={`ml-4 text-right ${scoreColor}`}>
                                <div className="text-2xl font-bold">{pq.score}/10</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">({scorePercent}%)</div>
                              </div>
                            </div>
                            {pq.feedback && (
                              <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded text-xs border border-gray-200 dark:border-gray-700">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">Feedback:</span>
                                <span className="ml-2 text-gray-600 dark:text-gray-400">{pq.feedback}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {(s as any).manualGrading?.feedback && (
                      <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                        <div className="text-sm font-semibold text-indigo-900 dark:text-indigo-200 mb-1">
                          Overall Feedback:
                        </div>
                        <div className="text-sm text-indigo-800 dark:text-indigo-300 whitespace-pre-wrap">
                          {(s as any).manualGrading.feedback}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Manual Grading Interface */}
                {/* 🚀 FIX: Only show manual grading form if not already graded */}
                {gradingMode === 'manual' && assignment && assignment.questions?.length > 0 && !isGraded && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <span>✏️</span> Manual Grading
                    </h3>
                    
                    <div className="space-y-4 mb-6">
                      {assignment.questions.map(q => renderQuestionBlock(s, q))}
                    </div>

                    {/* Manual Grading Summary */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Total Score (0-100) *
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.1}
                            value={manual[s._id]?.totalScore ?? ''}
                            onChange={e => setManual(prev => ({ ...prev, [s._id]: { ...prev[s._id], totalScore: e.target.value } }))}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                            placeholder="Auto-calculated"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Overall Feedback (optional)
                          </label>
                          <textarea
                            value={manual[s._id]?.feedback ?? ''}
                            onChange={e => setManual(prev => ({ ...prev, [s._id]: { ...prev[s._id], feedback: e.target.value } }))}
                            rows={2}
                            placeholder="Provide overall feedback for the student..."
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <button
                          onClick={() => handleManualGrade(s._id)}
                          disabled={busy === s._id}
                          className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
                        >
                          {busy === s._id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Saving...
                            </>
                          ) : (
                            <>💾 Save Manual Grade</>
                          )}
                        </button>
                        {isGraded && (
                          <button
                            onClick={() => handleOverrideGrade(s._id)}
                            disabled={busy === s._id}
                            className="px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors font-medium"
                          >
                            Override Grade
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 🚀 DISABLED: AI grading prompt */}
                {/* {s.status === 'submitted' && !isGraded && gradingMode === 'ai' && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⏳ Ready to grade. Click "AI Grade" to automatically grade this submission.
                    </p>
                  </div>
                )} */}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AssignmentSubmissionsPage;
