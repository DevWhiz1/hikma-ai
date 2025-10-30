import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assignmentService, Assignment, Submission } from '../../services/assignmentService';

const TakeAssignmentPage: React.FC = () => {
  const { id } = useParams();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isScrolling = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      try {
        const res = await assignmentService.get(id);
        setAssignment(res.assignment);
        
        // 🚀 FIX: Check if already submitted - prevent resubmission
        try {
          const mySubmissions = await assignmentService.mySubmissions();
          const existingSubmission = mySubmissions.submissions?.find((s: Submission) => s.assignment === id);
          if (existingSubmission && (existingSubmission.status === 'submitted' || existingSubmission.status === 'graded')) {
            alert(`⚠️ You have already submitted this ${res.assignment.kind === 'quiz' ? 'quiz' : 'assignment'}.\n\nResubmission is not allowed. You can view your submission in "My Submissions".`);
            navigate('/me/submissions');
            return;
          }
          setSubmission(existingSubmission || null);
        } catch (subErr) {
          // Ignore submission check errors
          console.warn('Could not check existing submission:', subErr);
        }
      } catch (err: any) {
        alert(err?.response?.data?.error || 'Failed to load assignment');
        navigate('/assignments');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, navigate]);

  const handleSubmit = async () => {
    if (!id || !assignment) return;
    
    // Validate answers
    const unanswered = (assignment.questions || []).filter(q => {
      const answer = answers[q._id!];
      return answer === undefined || answer === null || answer === '';
    });
    
    if (unanswered.length > 0) {
      const confirmSkip = confirm(`You have ${unanswered.length} unanswered question(s). Submit anyway?`);
      if (!confirmSkip) return;
    }
    
    setSubmitting(true);
    try {
    const payload = (assignment.questions || []).map(q => ({
      questionId: q._id as any,
        answerText: q.type !== 'mcq' && q.type !== 'true-false' ? answers[q._id!] : undefined,
        selectedOption: (q.type === 'mcq' || q.type === 'true-false') ? answers[q._id!] : undefined,
    }));
      await assignmentService.submit(id, payload);
      // Show professional success message
      const isQuiz = assignment.kind === 'quiz';
      alert(`✅ ${isQuiz ? 'Quiz' : 'Assignment'} submitted successfully!\n\nYour ${isQuiz ? 'quiz' : 'assignment'} has been received and is ready for review. You will be notified when it's graded.`);
      navigate('/me/submissions');
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  // Start quiz attempt
  const handleStart = async () => {
    if (!id) return;
    try {
      const res = await assignmentService.startAttempt(id);
      const s = (res as any).submission || (res as any).data || res;
      setSubmission(s);
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
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      if (!autoSubmitting) {
        setAutoSubmitting(true);
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
  const canStartQuiz = assignment?.kind === 'quiz' && !quizStarted;
  const canViewQuestions = assignment?.kind === 'assignment' || quizStarted;
  const questions = assignment?.questions || [];
  const answeredCount = Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== null && answers[k] !== '').length;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  // 🚀 NEW: Scroll detection to auto-update current question
  const handleScroll = useCallback(() => {
    if (!showAllQuestions || questions.length === 0) return;
    if (isScrolling.current) return; // Prevent updates while programmatically scrolling
    
    // Find which question is closest to the center of the viewport
    let closestIndex = currentQuestionIndex;
    let closestDistance = Infinity;
    const viewportCenter = window.innerHeight / 2;

    questionRefs.current.forEach((ref, idx) => {
      if (!ref || idx >= questions.length) return;
      const rect = ref.getBoundingClientRect();
      const elementTop = rect.top;
      const elementBottom = rect.bottom;
      const elementCenter = elementTop + (elementBottom - elementTop) / 2;
      const distance = Math.abs(elementCenter - viewportCenter);
      
      // Check if question is visible in viewport
      if (elementTop < window.innerHeight && elementBottom > 0 && distance < closestDistance) {
        closestDistance = distance;
        closestIndex = idx;
      }
    });

    if (closestIndex !== currentQuestionIndex && closestIndex >= 0 && closestIndex < questions.length) {
      setCurrentQuestionIndex(closestIndex);
    }
  }, [showAllQuestions, questions.length, currentQuestionIndex]);

  // Set up scroll listener when showing all questions
  useEffect(() => {
    if (!showAllQuestions || questions.length === 0) {
      // Reset refs when not showing all
      questionRefs.current = [];
      return;
    }

    // Initialize refs array
    if (questionRefs.current.length < questions.length) {
      questionRefs.current = [...questionRefs.current, ...Array(questions.length - questionRefs.current.length).fill(null)];
    }

    // Add scroll listener with throttling
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // Initial check after a small delay to ensure refs are set
    setTimeout(() => handleScroll(), 100);

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [showAllQuestions, questions.length, handleScroll]);

  // 🚀 NEW: Scroll to question when index changes (only if not user scrolling)
  useEffect(() => {
    if (showAllQuestions && questionRefs.current[currentQuestionIndex]) {
      isScrolling.current = true;
      questionRefs.current[currentQuestionIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      // Reset flag after scroll completes
      setTimeout(() => {
        isScrolling.current = false;
      }, 1000);
    }
  }, [currentQuestionIndex, showAllQuestions]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 font-medium mb-4">Assignment not found</p>
          <button
            onClick={() => navigate('/assignments')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mb-2">
              {assignment.title}
            </h1>
            {assignment.description && (
              <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{assignment.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Quiz Timer & Info */}
        {assignment.kind === 'quiz' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 text-sm">
                {assignment.quizWindowStart && (
                  <span className="text-gray-600 dark:text-gray-400">
                    📅 Opens: {new Date(assignment.quizWindowStart).toLocaleString()}
                  </span>
                )}
                {assignment.quizWindowEnd && (
                  <span className="text-gray-600 dark:text-gray-400">
                    🕐 Closes: {new Date(assignment.quizWindowEnd).toLocaleString()}
                  </span>
                )}
                {assignment.durationMinutes && (
                  <span className="text-gray-600 dark:text-gray-400">
                    ⏱️ Duration: {assignment.durationMinutes} minutes
                  </span>
                )}
              </div>
              
              {quizStarted && secondsLeft !== null && (
                <div className={`px-4 py-2 rounded-lg font-bold text-lg ${
                  secondsLeft < 60
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 animate-pulse'
                    : secondsLeft < 300
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                }`}>
                  ⏰ {formatTime(secondsLeft)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assignment Deadline */}
      {assignment.kind === 'assignment' && assignment.dueDate && (
          <div className={`mb-4 p-3 rounded-lg border ${
            duePassed
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">📅</span>
              <div>
                <span className={`font-semibold ${duePassed ? 'text-red-800 dark:text-red-300' : 'text-blue-800 dark:text-blue-300'}`}>
                  Due: {new Date(assignment.dueDate).toLocaleString()}
                </span>
                {duePassed && (
                  <span className="ml-2 text-red-600 dark:text-red-400 font-medium">(Deadline Passed)</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {canViewQuestions && questions.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Progress: {answeredCount} / {questions.length} answered
              </span>
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-emerald-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Start Quiz Button */}
      {canStartQuiz && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Ready to Start?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This quiz has {questions.length} question{questions.length !== 1 ? 's' : ''} and lasts {assignment.durationMinutes} minutes.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              Once you start, the timer will begin. Make sure you're ready!
            </p>
          </div>
          <button
            onClick={handleStart}
            className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold text-lg"
          >
            ▶️ Start Quiz
          </button>
        </div>
      )}

      {/* Questions */}
      {canViewQuestions && questions.length > 0 && (
        <div className="space-y-6">
          {/* Question Navigation */}
          {questions.length > 1 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAllQuestions(!showAllQuestions)}
                    className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    {showAllQuestions ? '📋 Single View' : '📋 Show All'}
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {questions.map((_, idx) => {
                  const isAnswered = answers[questions[idx]._id!] !== undefined && answers[questions[idx]._id!] !== null && answers[questions[idx]._id!] !== '';
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentQuestionIndex(idx);
                        if (showAllQuestions && questionRefs.current[idx]) {
                          isScrolling.current = true;
                          questionRefs.current[idx]?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                          });
                          setTimeout(() => { isScrolling.current = false; }, 1000);
                        } else {
                          setShowAllQuestions(false);
                        }
                      }}
                      className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                        idx === currentQuestionIndex
                          ? 'bg-emerald-600 text-white'
                          : isAnswered
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Questions Display */}
          <div className="space-y-6">
            {(showAllQuestions ? questions : [questions[currentQuestionIndex]]).map((q, displayIdx) => {
              const actualIdx = showAllQuestions ? displayIdx : currentQuestionIndex;
              if (!q) return null;
              
              return (
                <div
                  key={q._id || actualIdx}
                  ref={(el) => {
                    if (showAllQuestions) {
                      // Ensure array is large enough
                      if (displayIdx >= questionRefs.current.length) {
                        questionRefs.current = [...questionRefs.current, ...Array(displayIdx - questionRefs.current.length + 1).fill(null)];
                      }
                      questionRefs.current[displayIdx] = el;
                    }
                  }}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm scroll-mt-20"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold">
                        {actualIdx + 1}
                      </span>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase">
                        {q.type}
                      </span>
                    </div>
                    {answers[q._id!] !== undefined && answers[q._id!] !== null && answers[q._id!] !== '' && (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Answered</span>
                    )}
                  </div>

                  <div className="mb-4">
                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-4">{q.prompt}</p>
                  </div>

                  {/* MCQ Options */}
                  {q.type === 'mcq' && Array.isArray(q.options) && (
                    <div className="space-y-3">
                      {q.options.map((opt, i) => (
                        <label
                          key={i}
                          className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            answers[q._id!] === i
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q_${q._id}`}
                            checked={answers[q._id!] === i}
                            onChange={() => setAnswers({ ...answers, [q._id!]: i })}
                            disabled={assignment.kind === 'quiz' && (!quizStarted || (typeof secondsLeft === 'number' && secondsLeft <= 0))}
                            className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                          />
                          <span className="flex-1 text-gray-900 dark:text-white">{opt}</span>
                          {answers[q._id!] === i && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓</span>
                          )}
                  </label>
                ))}
              </div>
                  )}

                  {/* True/False Options */}
                  {q.type === 'true-false' && (
                    <div className="space-y-3">
                {['True', 'False'].map((opt, i) => (
                        <label
                          key={i}
                          className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            answers[q._id!] === i
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q_${q._id}`}
                            checked={answers[q._id!] === i}
                            onChange={() => setAnswers({ ...answers, [q._id!]: i })}
                            disabled={assignment.kind === 'quiz' && (!quizStarted || (typeof secondsLeft === 'number' && secondsLeft <= 0))}
                            className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                          />
                          <span className="flex-1 text-gray-900 dark:text-white font-medium">{opt}</span>
                          {answers[q._id!] === i && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓</span>
                          )}
                  </label>
                ))}
              </div>
                  )}

                  {/* Short Answer / Essay */}
                  {(q.type === 'short-answer' || q.type === 'essay') && (
                    <div>
                      <textarea
                        rows={q.type === 'essay' ? 8 : 4}
                        value={answers[q._id!] || ''}
                        onChange={(e) => setAnswers({ ...answers, [q._id!]: e.target.value })}
                        placeholder={q.type === 'essay' ? 'Write your detailed response here...' : 'Write your answer here...'}
                        disabled={assignment.kind === 'quiz' && (!quizStarted || (typeof secondsLeft === 'number' && secondsLeft <= 0))}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
                      />
                      {q.type === 'essay' && (
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          💡 Provide a detailed, well-reasoned response with references if possible.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation & Submit */}
      {canViewQuestions && questions.length > 0 && (
        <div className="mt-8 sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* 🚀 FIX: Show Previous/Next buttons for all modes, update based on scroll */}
              {questions.length > 1 && (
                <>
                  <button
                    onClick={() => {
                      const newIndex = Math.max(0, currentQuestionIndex - 1);
                      setCurrentQuestionIndex(newIndex);
                      if (showAllQuestions && questionRefs.current[newIndex]) {
                        isScrolling.current = true;
                        questionRefs.current[newIndex]?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'center'
                        });
                        setTimeout(() => { isScrolling.current = false; }, 1000);
                      } else {
                        setShowAllQuestions(false);
                      }
                    }}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    ← Previous
                  </button>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2">
                    {currentQuestionIndex + 1} / {questions.length}
                  </span>
                  <button
                    onClick={() => {
                      const newIndex = Math.min(questions.length - 1, currentQuestionIndex + 1);
                      setCurrentQuestionIndex(newIndex);
                      if (showAllQuestions && questionRefs.current[newIndex]) {
                        isScrolling.current = true;
                        questionRefs.current[newIndex]?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'center'
                        });
                        setTimeout(() => { isScrolling.current = false; }, 1000);
                      } else {
                        setShowAllQuestions(false);
                      }
                    }}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Next →
                  </button>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  (assignment.kind === 'assignment' && duePassed) ||
                  (assignment.kind === 'quiz' && typeof secondsLeft === 'number' && secondsLeft < 0) ||
                  autoSubmitting
                }
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
              >
                {submitting || autoSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {autoSubmitting ? 'Auto-submitting...' : 'Submitting...'}
                  </>
                ) : (
                  <>✅ Submit {assignment.kind === 'quiz' ? 'Quiz' : 'Assignment'}</>
                )}
              </button>
            </div>
          </div>
          
          {answeredCount < questions.length && (
            <div className="mt-3 text-sm text-orange-600 dark:text-orange-400">
              ⚠️ {questions.length - answeredCount} question{questions.length - answeredCount !== 1 ? 's' : ''} unanswered
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TakeAssignmentPage;
