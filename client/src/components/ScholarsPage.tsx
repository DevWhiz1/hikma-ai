import { useEffect, useState } from 'react';
import { getScholars, enrollScholar, leaveFeedback, getCachedScholars, unenroll, getMyEnrollments, startDirectChat } from '../services/scholarService';
import { authService } from '../services/authService';
import { Link, useNavigate } from 'react-router-dom';

interface Scholar {
  _id: string;
  user: { _id: string; name: string; lockUntil?: string };
  bio?: string;
  specializations?: string[];
  languages?: string[];
  experienceYears?: number;
  qualifications?: string;
  demoVideoUrl?: string;
  photoUrl?: string;
}

export default function ScholarsPage() {
  const [scholars, setScholars] = useState<Scholar[]>([]);
  // Meeting topic removed
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const user = authService.getUser();
  const navigate = useNavigate();

  useEffect(() => {
    const cached = getCachedScholars();
    if (cached) setScholars(cached);
    // Load enrolled scholar ids from localStorage
    try {
      const saved = localStorage.getItem('enrolled_scholar_ids');
      if (saved) setEnrolledIds(new Set(JSON.parse(saved)));
    } catch {}
    setLoading(true);
    Promise.all([
      getScholars(),
      getMyEnrollments().catch(() => [])
    ])
      .then(([sch, enrs]) => {
        setScholars(sch);
        if (Array.isArray(enrs)) {
          const ids = new Set<string>();
          enrs.forEach((e:any) => { if (e?.scholar?._id) ids.add(e.scholar._id); });
          setEnrolledIds(ids);
          try { localStorage.setItem('enrolled_scholar_ids', JSON.stringify(Array.from(ids))); } catch {}
        }
      })
      .catch(() => setError('Failed to load scholars'))
      .finally(() => setLoading(false));
  }, []);

  const onEnroll = async (id: string) => {
    try {
      const res = await enrollScholar(id);
      const sessionId = res?.studentSessionId || res?.enrollment?.studentSession;
      const next = new Set(enrolledIds);
      next.add(id);
      setEnrolledIds(next);
      try { localStorage.setItem('enrolled_scholar_ids', JSON.stringify(Array.from(next))); } catch {}
      if (sessionId) navigate(`/chat/${sessionId}`);
    } catch (e:any) {
      // If already enrolled, mark as enrolled locally
      const msg = e?.response?.data?.message || '';
      if (typeof msg === 'string' && msg.toLowerCase().includes('already enrolled')) {
        const next = new Set(enrolledIds); next.add(id);
        setEnrolledIds(next);
        try { localStorage.setItem('enrolled_scholar_ids', JSON.stringify(Array.from(next))); } catch {}
      }
    }
  };

  const onToggleEnroll = async (id: string) => {
    if (enrolledIds.has(id)) {
      await unenroll(id);
      const next = new Set(enrolledIds); next.delete(id);
      setEnrolledIds(next);
      try { localStorage.setItem('enrolled_scholar_ids', JSON.stringify(Array.from(next))); } catch {}
    } else {
      await onEnroll(id);
    }
  };

  const onFeedback = async (id: string) => {
    const text = prompt('Leave anonymous feedback:') || '';
    const rating = Number(prompt('Rating 1-5:') || '5');
    await leaveFeedback({ scholarId: id, text, rating });
    alert('Feedback submitted');
  };

  const onChatWithScholar = async (scholarProfileId: string) => {
    try {
      const res = await startDirectChat(scholarProfileId);
      const sid = res?.studentSessionId;
      if (sid) navigate(`/chat/${sid}`);
    } catch (e:any) {
      const msg = e?.response?.data?.message || '';
      if (e?.response?.status === 409) {
        alert('You already have multiple chats with this scholar. Please use an existing chat or contact support to merge conversations.');
      } else if (typeof msg === 'string' && msg) {
        alert(msg);
      } else {
        alert('Unable to start chat with the scholar right now. Please try again.');
      }
    }
  };

  // Join Meet removed

  return (
    <div className="p-6 space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Scholars</h1>
        {user?.role !== 'scholar' && (
          <Link to="/scholars/apply" target="_blank" rel="noopener noreferrer" className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700">Apply as Scholar</Link>
        )}
      </div>
      {/* Meeting topic removed */}
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {loading ? (
        <div className="text-sm opacity-70">Loading scholars...</div>
      ) : (
        <div className={`${scholars.length > 2 ? 'flex gap-3 overflow-x-auto pb-2 scrollbar-thin' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}`}>
          {scholars.map(s => (
            <div
              key={s._id}
              className={`group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition border border-gray-200 dark:border-gray-700 overflow-hidden ring-1 ring-transparent hover:ring-emerald-100 dark:hover:ring-emerald-900/30 ${scholars.length > 2 ? 'min-w-[280px] max-w-[320px]' : ''}`}
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <img
                    src={s.photoUrl || 'https://via.placeholder.com/140x140?text=Scholar'}
                    alt={s.user?.name || 'Scholar'}
                    className="h-16 w-16 md:h-20 md:w-20 rounded-lg object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-100 dark:bg-gray-900"
                    onError={(e:any)=>{ e.currentTarget.src = 'https://via.placeholder.com/140x140?text=Scholar'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{s.user?.name || 'Scholar'}</h3>
                      {typeof s.experienceYears === 'number' && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">{s.experienceYears} yrs</span>
                      )}
                    </div>
                    {s.bio && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-3">
                        {s.bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-3 text-[11px]">
                  {s.specializations?.slice(0, 4).map(sp => (
                    <span key={sp} className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800">{sp}</span>
                  ))}
                  {s.languages?.slice(0, 4).map(l => (
                    <span key={l} className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600">{l}</span>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2 flex-wrap items-center w-full">
                  <button
                    title={enrolledIds.has(s._id) ? 'Already enrolled' : 'Enroll with this scholar'}
                    onClick={() => onToggleEnroll(s._id)}
                    disabled={Boolean(s.user?.lockUntil)}
                    className={`px-2.5 py-1.5 text-sm rounded-md text-white shadow-sm ${s.user?.lockUntil ? 'bg-gray-400 cursor-not-allowed' : enrolledIds.has(s._id) ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {s.user?.lockUntil ? 'Blocked' : enrolledIds.has(s._id) ? 'Enrolled' : 'Enroll'}
                  </button>
                  <button
                    title="Leave feedback for this scholar"
                    onClick={() => onFeedback(s._id)}
                    className="px-2.5 py-1.5 text-sm rounded-md bg-gray-700 hover:bg-gray-800 text-white shadow-sm"
                  >
                    Leave Feedback
                  </button>
                  {enrolledIds.has(s._id) && (
                    <button
                      title="Open direct chat with this scholar"
                      onClick={() => onChatWithScholar(s._id)}
                      className="px-2.5 py-1.5 text-sm rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    >
                      Chat with Scholar
                    </button>
                  )}
                  {s.demoVideoUrl && (
                    <a
                      title="Watch demo video"
                      href={s.demoVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white shadow-sm"
                    >
                      Demo Video
                    </a>
                  )}
                </div>

                {/* Footer subtle meta */}
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>Available languages and specializations shown above.</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="text-sm opacity-60">Payments: Coming Soon</div>
    </div>
  );
}


