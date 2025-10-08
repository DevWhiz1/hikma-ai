import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUsers, blockUser, unblockUser, getReviews, getSensitiveLogs, getScholarApplications, approveScholarApplication, rejectScholarApplication, removeScholarByUser, adminMessageUser } from '../services/adminService';
import AdminFeedbackManagement from './AdminFeedbackManagement';

type TabKey = 'users' | 'reviews' | 'logs' | 'applications' | 'feedback';


export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('users');
  const [apps, setApps] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([getUsers(), getReviews(), getSensitiveLogs(), getScholarApplications()])
      .then(([u, r, l, a]) => { setUsers(u); setReviews(r); setLogs(l); setApps(a); })
      .finally(() => setLoading(false));
  }, []);

  const toggleBlock = async (u:any) => {
    if (u.lockUntil) await unblockUser(u._id); else await blockUser(u._id);
    const fresh = await getUsers(); setUsers(fresh);
  };

  const Sidebar = () => (
    <div className={`w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4`}> 
      <h2 className="text-lg font-semibold mb-4">Admin</h2>
      <nav className="space-y-2">
        <button onClick={()=>setTab('users')} className={`w-full text-left px-3 py-2 rounded ${tab==='users'?'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300':'hover:bg-gray-100 hover:text-white dark:hover:bg-gray-700'}`}>Users</button>
        <button onClick={()=>setTab('reviews')} className={`w-full text-left px-3 py-2 rounded ${tab==='reviews'?'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300':'hover:bg-gray-100 hover:text-white dark:hover:bg-gray-700'}`}>Reviews Analytics</button>
        <button onClick={()=>setTab('logs')} className={`w-full text-left px-3 py-2 rounded ${tab==='logs'?'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300':'hover:bg-gray-100 hover:text-white dark:hover:bg-gray-700'}`}>Sensitive Logs</button>
        <button onClick={()=>setTab('applications')} className={`w-full text-left px-3 py-2 rounded ${tab==='applications'?'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300':'hover:bg-gray-100 hover:text-white dark:hover:bg-gray-700'}`}>Scholar Review</button>
        <button onClick={()=>setTab('feedback')} className={`w-full text-left px-3 py-2 rounded ${tab==='feedback'?'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300':'hover:bg-gray-100 hover:text-white dark:hover:bg-gray-700'}`}>Feedback Management</button>
      </nav>
    </div>
  );

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <Sidebar />
      <div className="flex-1 p-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Link to="/" className="px-3 py-2 rounded bg-[#264653] hover:bg-[#2A9D8F] dark:text-gray-300 no-underline" style={{color: '#14b8a6', textDecoration: 'none'}}>Return to Main</Link>
        </div>

        {tab === 'users' && (
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <h2 className="text-xl font-semibold mb-3">Users</h2>
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                    <th className="p-2">Name</th><th className="p-2">Role</th><th className="p-2">Warnings</th><th className="p-2">Locked</th><th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="p-2">{u.name}</td>
                      <td className="p-2 capitalize">{u.role}</td>
                      <td className="p-2">{u.warningCount || 0}</td>
                      <td className="p-2">{u.lockUntil ? new Date(u.lockUntil).toLocaleString() : '-'}</td>
                      <td className="p-2 space-x-2">
                        <button onClick={() => toggleBlock(u)} className={`px-3 py-1 rounded ${u.lockUntil ? 'bg-green-600' : 'bg-orange-600'} text-white`}>{u.lockUntil ? 'Unblock' : 'Block'}</button>
                        {u.role === 'scholar' && (
                          <button onClick={async()=>{ await removeScholarByUser(u._id); const freshApps = await getScholarApplications(); setApps(freshApps); const freshUsers = await getUsers(); setUsers(freshUsers); }} className="px-3 py-1 rounded bg-gray-700 text-white">Remove Scholar</button>
                        )}
                        <button onClick={async()=>{ const m = prompt('Message to user'); if (m) await adminMessageUser(u._id, m); }} className="px-3 py-1 rounded bg-blue-600 text-white">Message</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'applications' && (
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <h2 className="text-xl font-semibold mb-3">Pending Scholar Applications</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                    <th className="p-2">Name</th><th className="p-2">Bio</th><th className="p-2">Specializations</th><th className="p-2">Experience</th><th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map(a => (
                    <tr key={a._id} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="p-2">{a.user?.name || 'User'}</td>
                      <td className="p-2 max-w-md truncate" title={a.bio}>{a.bio}</td>
                      <td className="p-2">{(a.specializations||[]).join(', ')}</td>
                      <td className="p-2">{a.experienceYears || 0}</td>
                      <td className="p-2 space-x-2">
                        <button onClick={async()=>{ await approveScholarApplication(a._id); const fresh = await getScholarApplications(); setApps(fresh); }} className="px-3 py-1 rounded bg-green-600 text-white">Approve</button>
                        <button onClick={async()=>{ await rejectScholarApplication(a._id); const fresh = await getScholarApplications(); setApps(fresh); }} className="px-3 py-1 rounded bg-orange-600 text-white">Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'feedback' && (
          <AdminFeedbackManagement />
        )}

        {tab === 'reviews' && (
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <h2 className="text-xl font-semibold mb-3">Reviews Analytics</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                    <th className="p-2">ScholarId</th><th className="p-2">Scholar Name</th><th className="p-2">Count</th><th className="p-2">Avg Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r:any, idx:number) => (
                    <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="p-2">{r._id}</td>
                      <td className="p-2">{r.scholarName || '-'}</td>
                      <td className="p-2">{r.count}</td>
                      <td className="p-2">{Number(r.avgRating).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'logs' && (
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <h2 className="text-xl font-semibold mb-3">Sensitive Data Logs</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                    <th className="p-2">Time</th><th className="p-2">User</th><th className="p-2">Endpoint</th><th className="p-2">Sample → Redacted</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l:any) => (
                    <tr key={l._id} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="p-2 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                      <td className="p-2">{l.user?.name || 'User'} ({l.user?.role || ''})</td>
                      <td className="p-2">{l.endpoint}</td>
                      <td className="p-2 max-w-md truncate" title={`${l.textSample} -> ${l.redactedText}`}>{l.textSample} → {l.redactedText}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}


