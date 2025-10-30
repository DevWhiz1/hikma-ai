import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRatingOverview, getScholarReviews } from '../services/feedbackRatingService';

interface Overview {
  success: boolean;
  average: number;
  totalReviews: number;
  distribution: Record<1|2|3|4|5, number>;
}

interface ReviewItem {
  id: string;
  studentName: string;
  reviewText: string;
  ratingValue: number | null;
  createdAt: string;
}

export default function ShowReviewsAndRatings() {
  const { scholarId } = useParams<{ scholarId: string }>();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!scholarId) return;
      try {
        setLoading(true);
        const [ov, rv] = await Promise.all([
          getRatingOverview(scholarId),
          getScholarReviews(scholarId)
        ]);
        setOverview(ov);
        setReviews(rv?.items || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [scholarId]);

  const maxCount = useMemo(() => {
    if (!overview) return 0;
    return Math.max(overview.distribution[1], overview.distribution[2], overview.distribution[3], overview.distribution[4], overview.distribution[5], 0);
  }, [overview]);

  const renderStars = (value: number) => {
    const full = Math.round(value);
    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={i < full ? '#10b981' : 'none'} stroke={i < full ? '#10b981' : '#9ca3af'} strokeWidth="2" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.403c.499.036.702.663.321.988l-4.2 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.392 20.5a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557L2.455 10.346a.563.563 0 01.321-.988l5.518-.403a.563.563 0 00.475-.345L10.894 3.5z" />
          </svg>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">Loading reviews…</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900/20">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Scholar Reviews & Ratings</h1>

        {/* Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-3">
              {renderStars(overview?.average || 0)}
              <div className="text-gray-700 dark:text-gray-300 text-sm">
                <span className="font-semibold">{(overview?.average || 0).toFixed(1)}</span> — {overview?.totalReviews || 0} Reviews
              </div>
            </div>
          </div>

          {/* Distribution */}
          <div className="mt-6 space-y-2">
            {[5,4,3,2,1].map(star => {
              const count = overview?.distribution?.[star as 1|2|3|4|5] || 0;
              const pct = maxCount ? Math.round((count / maxCount) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="w-20 text-sm text-gray-700 dark:text-gray-300">{star} Stars</div>
                  <div className="flex-1 h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div className="h-3 bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-10 text-right text-sm text-gray-600 dark:text-gray-400">({count})</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">All Reviews</h2>
          {reviews.length === 0 ? (
            <div className="text-gray-600 dark:text-gray-400">No reviews yet.</div>
          ) : (
            <div className="space-y-6">
              {reviews.map(r => (
                <div key={r.id} className="border-b border-gray-100 dark:border-gray-700 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900 dark:text-white">{r.studentName}</div>
                    <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>
                  {r.ratingValue ? (
                    <div className="mt-1">{renderStars(r.ratingValue)}</div>
                  ) : null}
                  <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-line">{r.reviewText}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => navigate('/scholars')}
            className="px-5 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}


