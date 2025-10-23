import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../shared/AuthLayout';
import { authService } from '../../services/authService';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const resp = await authService.login(form);
      authService.saveSession(resp);
      onLogin();
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to continue your learning journey">
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="p-2 text-sm rounded bg-rose-100 text-rose-700 border border-rose-300">{error}</div>}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" name="email" required value={form.email} onChange={onChange} className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input type="password" name="password" required value={form.password} onChange={onChange} className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500" />
        </div>
        <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold transition">
          {loading ? 'Logging in...' : 'Log In'}
        </button>
        <p className="text-xs text-center text-gray-500">No account? <Link to="/signup" className="text-emerald-600 dark:text-emerald-400 hover:underline">Create one</Link></p>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
