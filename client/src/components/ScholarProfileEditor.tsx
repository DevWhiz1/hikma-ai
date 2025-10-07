import { useEffect, useMemo, useState } from 'react';
import { getMyScholarProfile, updateMyScholarProfile } from '../services/scholarService';
import { authService } from '../services/authService';

export default function ScholarProfileEditor() {
  const user = authService.getUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState<any>({ bio: '', specializations: '', languages: '', experienceYears: '', qualifications: '', demoVideoUrl: '', photoUrl: '' });

  const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}(&.*)?$/i;
  const isValid = useMemo(() => {
    const has = (s: string) => typeof s === 'string' && s.trim().length > 0;
    const exp = Number(f.experienceYears);
    return has(f.bio) && has(f.specializations) && has(f.languages) && has(f.qualifications) && has(f.demoVideoUrl) && has(f.photoUrl) && !Number.isNaN(exp) && exp >= 0 && ytRegex.test(String(f.demoVideoUrl).trim());
  }, [f]);

  useEffect(() => {
    setLoading(true);
    getMyScholarProfile()
      .then((s: any) => {
        if (!s?.approved) {
          setError('Your scholar profile is not yet approved. Editing is enabled after approval.');
        }
        setF({
          bio: s?.bio || '',
          specializations: Array.isArray(s?.specializations) ? s.specializations.join(', ') : '',
          languages: Array.isArray(s?.languages) ? s.languages.join(', ') : '',
          experienceYears: s?.experienceYears ?? '',
          qualifications: s?.qualifications || '',
          demoVideoUrl: s?.demoVideoUrl || '',
          photoUrl: s?.photoUrl || ''
        });
      })
      .catch(() => setError('Failed to load your scholar profile'))
      .finally(() => setLoading(false));
  }, []);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [e.target.name]: e.target.value });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        bio: f.bio,
        specializations: f.specializations.split(',').map((s: string) => s.trim()).filter(Boolean),
        languages: f.languages.split(',').map((s: string) => s.trim()).filter(Boolean),
        experienceYears: Number(f.experienceYears),
        qualifications: f.qualifications,
        demoVideoUrl: f.demoVideoUrl,
        photoUrl: f.photoUrl
      };
      await updateMyScholarProfile(payload);
      alert('Profile updated');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== 'scholar') {
    return <div className="p-6">You must be a scholar to edit your profile.</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Edit Scholar Profile</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <form onSubmit={submit} className="space-y-3 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          {error && <div className="text-sm text-red-600">{error}</div>}
          <textarea name="bio" value={f.bio} onChange={change} placeholder="bio" className="border p-2 w-full rounded bg-white dark:bg-gray-900" required />
          <input name="specializations" value={f.specializations} onChange={change} placeholder="specializations (comma separated)" className="border p-2 w-full rounded bg-white dark:bg-gray-900" required />
          <input name="languages" value={f.languages} onChange={change} placeholder="languages (comma separated)" className="border p-2 w-full rounded bg-white dark:bg-gray-900" required />
          <input name="experienceYears" value={f.experienceYears} onChange={change} placeholder="experienceYears" className="border p-2 w-full rounded bg-white dark:bg-gray-900" type="number" min="0" required />
          <input name="qualifications" value={f.qualifications} onChange={change} placeholder="qualifications" className="border p-2 w-full rounded bg-white dark:bg-gray-900" required />
          <input name="demoVideoUrl" value={f.demoVideoUrl} onChange={change} placeholder="demo video YouTube URL" className="border p-2 w-full rounded bg-white dark:bg-gray-900" required />
          {!ytRegex.test(String(f.demoVideoUrl).trim()) && f.demoVideoUrl.trim().length > 0 && (
            <div className="text-red-600 text-xs">Please enter a valid YouTube URL</div>
          )}
          <input name="photoUrl" value={f.photoUrl} onChange={change} placeholder="profile photo URL" className="border p-2 w-full rounded bg-white dark:bg-gray-900" required />
          <div className="flex gap-2">
            <button type="submit" disabled={saving || !isValid} className="px-4 py-2 rounded bg-emerald-600 disabled:bg-emerald-400 text-white">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      )}
    </div>
  );
}


