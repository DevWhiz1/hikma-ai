import { useMemo, useState } from 'react';
import { applyScholar, uploadPhoto } from '../services/scholarService';

export default function ScholarApplyForm() {
  const [f, setF] = useState({ bio: '', specializations: '', languages: '', experienceYears: '', qualifications: '', demoVideoUrl: '', photoUrl: '' });
  const [loading, setLoading] = useState(false);
  const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}(&.*)?$/i;

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [e.target.name]: e.target.value });
  const isValid = useMemo(() => {
    const has = (s: string) => typeof s === 'string' && s.trim().length > 0;
    const exp = Number(f.experienceYears);
    return has(f.bio) && has(f.specializations) && has(f.languages) && has(f.qualifications) && has(f.demoVideoUrl) && has(f.photoUrl) && !Number.isNaN(exp) && exp >= 0 && ytRegex.test(f.demoVideoUrl.trim());
  }, [f]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    try {
      const res = await applyScholar({
        ...f,
        specializations: f.specializations.split(',').map(s => s.trim()).filter(Boolean),
        languages: f.languages.split(',').map(s => s.trim()).filter(Boolean),
        experienceYears: Number(f.experienceYears)
      });
      alert('Application submitted! Status: Pending review. You may close this tab.');
      setF({ bio: '', specializations: '', languages: '', experienceYears: '', qualifications: '', demoVideoUrl: '', photoUrl: '' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-4 bg-white rounded-xl shadow-md space-y-2">
      <h2 className="text-xl font-semibold mb-2">Apply as Scholar</h2>
      <textarea name="bio" value={f.bio} onChange={change} placeholder="bio" className="border p-2 w-full rounded bg-white text-black placeholder-gray-500" required />
      <input name="specializations" value={f.specializations} onChange={change} placeholder="specializations (comma separated)" className="border p-2 w-full rounded bg-white text-black placeholder-gray-500" required />
      <input name="languages" value={f.languages} onChange={change} placeholder="languages (comma separated)" className="border p-2 w-full rounded bg-white text-black placeholder-gray-500" required />
      <input name="experienceYears" value={f.experienceYears} onChange={change} placeholder="experienceYears" className="border p-2 w-full rounded bg-white text-black placeholder-gray-500" type="number" min="0" required />
      <input name="qualifications" value={f.qualifications} onChange={change} placeholder="qualifications" className="border p-2 w-full rounded bg-white text-black placeholder-gray-500" required />
      <input name="demoVideoUrl" value={f.demoVideoUrl} onChange={change} placeholder="demo video YouTube URL" className="border p-2 w-full rounded bg-white text-black placeholder-gray-500" required />
      {!ytRegex.test(f.demoVideoUrl.trim()) && f.demoVideoUrl.trim().length > 0 && (
        <div className="text-red-600 text-xs">Please enter a valid YouTube URL</div>
      )}
      <div className="space-y-1">
        <input name="photoUrl" value={f.photoUrl} onChange={change} placeholder="profile photo URL (or upload below)" className="border p-2 w-full rounded bg-white text-black placeholder-gray-500" required />
        <div className="flex items-center gap-2">
          <input type="file" accept="image/*" onChange={async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            try {
              const resp = await uploadPhoto(file);
              if (resp?.url) setF(prev => ({ ...prev, photoUrl: resp.url }));
            } catch {
              alert('Failed to upload photo');
            }
          }} />
          {f.photoUrl && <img src={f.photoUrl} alt="preview" className="h-10 w-10 rounded-full object-cover border" />}
        </div>
      </div>
      <button disabled={loading || !isValid} className="bg-[#264653] disabled:bg-gray-400 dark:text-gray-300 px-4 py-2 rounded no-underline" style={{color: '#14b8a6', textDecoration: 'none'}}>{loading ? 'Submitting...' : 'Submit'}</button>
    </form>
  );
}


