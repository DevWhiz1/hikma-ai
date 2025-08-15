import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { authService } from '../services/authService';
import hikmahLogo from '../hikmah.png';

const roles = [
  { value: 'user', label: 'User' },
  { value: 'scholar', label: 'Scholar' },
];

interface SignupPageProps {
  onSignup: () => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onSignup }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user', bio: '', expertise: '', languages: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      };
      if (form.role === 'scholar') {
        payload.scholarProfile = {
          bio: form.bio,
            expertise: form.expertise.split(',').map(s => s.trim()).filter(Boolean),
            languages: form.languages.split(',').map(s => s.trim()).filter(Boolean)
        };
      }
      const resp = await authService.signup(payload);
      authService.saveSession(resp);
      onSignup();
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join Hikmah AI to access personalized guidance">
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="p-2 text-sm rounded bg-rose-100 text-rose-700 border border-rose-300">{error}</div>}
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input name="name" required value={form.name} onChange={onChange} className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" name="email" required value={form.email} onChange={onChange} className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input type="password" name="password" required minLength={6} value={form.password} onChange={onChange} className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500" />
        </div>
        {/* <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <select name="role" value={form.role} onChange={onChange} className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500">
            {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        {form.role === 'scholar' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Bio</label>
              <textarea name="bio" value={form.bio} onChange={onChange} rows={3} className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expertise (comma separated)</label>
              <input name="expertise" value={form.expertise} onChange={onChange} className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Languages (comma separated)</label>
              <input name="languages" value={form.languages} onChange={onChange} className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
        )} */}
        <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold transition">
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
        <p className="text-xs text-center text-gray-500">Already have an account? <Link to="/login" className="text-emerald-600 dark:text-emerald-400 hover:underline">Log in</Link></p>
      </form>
    </AuthLayout>
  );
};

export default SignupPage;
