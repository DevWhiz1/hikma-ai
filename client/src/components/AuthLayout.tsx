import React from 'react';
import { Link } from 'react-router-dom';

const AuthLayout: React.FC<{ title: string; children: React.ReactNode; subtitle?: string }> = ({ title, children, subtitle }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-100 dark:from-gray-900 dark:via-gray-900 dark:to-emerald-950 px-4 py-10">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/assets/logo.png" className="h-10 w-10" />
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Hikmah</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
        </div>
        <div className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl shadow-xl border border-emerald-100 dark:border-gray-700 p-6">
          {children}
        </div>
        <p className="text-center text-xs text-gray-500 dark:text-gray-500">© {new Date().getFullYear()} Hikmah AI</p>
      </div>
    </div>
  );
};

export default AuthLayout;
