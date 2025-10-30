import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { submitRatingReview } from '../services/feedbackRatingService';
import { authService } from '../services/authService';

export default function ReviewRatingPage() {
  const { scholarId } = useParams<{ scholarId: string }>();
  const navigate = useNavigate();
  const user = authService.getUser();

  const [rating, setRating] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user?.role !== 'user') {
    return (
      <div className="min-h-screen flex items-center justify-center text-center text-gray-700 dark:text-gray-200">
        Access denied. Only students can submit feedback.
      </div>
    );
  }

  const onSubmit = async () => {
    setError(null);
    if (!rating && !comment.trim()) {
      setError('Please provide at least a rating or a review.');
      return;
    }
    if (!scholarId) {
      setError('Missing scholar id');
      return;
    }
    try {
      setSubmitting(true);
      await submitRatingReview({ scholarId, ratingValue: rating ?? undefined, comment: comment.trim() || undefined });
      navigate(-1);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to submit feedback. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900/20">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Review & Rating</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Share your experience with this scholar. Your feedback helps improve the community.</p>

        {/* Rating */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Rate this Scholar</h2>
          <div className="flex items-center gap-2">
            {stars.map((s) => (
              <button
                key={s}
                type="button"
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setRating(s)}
                className="focus:outline-none"
                aria-label={`Rate ${s} star`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={(hover ?? rating ?? 0) >= s ? '#10b981' : 'none'} stroke={(hover ?? rating ?? 0) >= s ? '#10b981' : '#9ca3af'} strokeWidth="2" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.403c.499.036.702.663.321.988l-4.2 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.392 20.5a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557L2.455 10.346a.563.563 0 01.321-.988l5.518-.403a.563.563 0 00.475-.345L10.894 3.5z" />
                </svg>
              </button>
            ))}
            {rating && <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{rating}/5</span>}
          </div>
        </div>

        {/* Review */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Write a Review</h2>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={6}
            placeholder="Share details about teaching quality, communication, punctuality, etc."
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {error && <div className="mt-4 text-red-600 dark:text-red-400 text-sm">{error}</div>}

        {/* Actions */}
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            disabled={submitting}
            onClick={onSubmit}
            className="px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}


