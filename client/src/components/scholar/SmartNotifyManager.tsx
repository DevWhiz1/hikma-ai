import React, { useEffect, useState } from 'react';
import notificationService from '../../services/notificationService';

type Trigger = 'daily'|'weekly'|'monthly'|'onNewEnrollment';

const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const SmartNotifyManager: React.FC = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('Reminder');
  const [messageTemplate, setMessageTemplate] = useState('Assalamu Alaikum, this is a reminder.');
  const [audience, setAudience] = useState<'all'|'selected'>('all');
  const [studentIds, setStudentIds] = useState<string>('');
  const [trigger, setTrigger] = useState<Trigger>('daily');
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1,3,5]);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);

  const loadRules = async () => {
    setLoading(true);
    try {
      const res = await notificationService.listRules();
      setRules(res.rules || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadRules(); }, []);

  const toggleDow = (d: number) => {
    setDaysOfWeek(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const handleCreate = async () => {
    try {
      const payload: any = { name, messageTemplate, audience, trigger, timeOfDay };
      if (audience === 'selected') payload.studentIds = studentIds.split(',').map(s => s.trim()).filter(Boolean);
      if (trigger === 'weekly') payload.daysOfWeek = daysOfWeek;
      if (trigger === 'monthly') payload.dayOfMonth = dayOfMonth;
      await notificationService.createRule(payload);
      setName('Reminder');
      setMessageTemplate('Assalamu Alaikum, this is a reminder.');
      setAudience('all');
      setTrigger('daily');
      setTimeOfDay('09:00');
      setDaysOfWeek([1,3,5]);
      setDayOfMonth(1);
      await loadRules();
      alert('Rule created');
    } catch (e) {
      console.error(e);
      alert('Failed to create rule');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create Smart Notify Rule</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rule Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Audience</label>
            <select value={audience} onChange={e=>setAudience(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
              <option value="all">All enrolled students</option>
              <option value="selected">Selected students (IDs)</option>
            </select>
          </div>
          {audience === 'selected' && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student IDs (comma-separated)</label>
              <input value={studentIds} onChange={e=>setStudentIds(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600" />
            </div>
          )}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message Template</label>
            <textarea rows={3} value={messageTemplate} onChange={e=>setMessageTemplate(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trigger</label>
            <select value={trigger} onChange={e=>setTrigger(e.target.value as Trigger)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="onNewEnrollment">On New Enrollment</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time of Day</label>
            <input type="time" value={timeOfDay} onChange={e=>setTimeOfDay(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600" />
          </div>
          {trigger === 'weekly' && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Days of Week</label>
              <div className="flex flex-wrap gap-2">
                {days.map((d, idx) => (
                  <button key={d} type="button" onClick={()=>toggleDow(idx)} className={`px-3 py-1 rounded-full text-sm border ${daysOfWeek.includes(idx)?'bg-emerald-600 text-white border-emerald-600':'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}>{d}</button>
                ))}
              </div>
            </div>
          )}
          {trigger === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Day of Month</label>
              <input type="number" min={1} max={31} value={dayOfMonth} onChange={e=>setDayOfMonth(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600" />
            </div>
          )}
        </div>
        <div className="mt-4">
          <button onClick={handleCreate} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Create Rule</button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Existing Rules</h2>
          <button onClick={async ()=>{ await notificationService.runRulesNow(); alert('Run triggered'); }} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Run Now</button>
        </div>
        {loading ? (
          <div className="text-gray-600 dark:text-gray-400">Loading...</div>
        ) : (
          <div className="space-y-3">
            {rules.map((r:any) => (
              <div key={r._id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{r.name} <span className="ml-2 text-xs px-2 py-0.5 rounded-full border">{r.trigger}</span></div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{r.audience === 'all' ? 'All students' : 'Selected students'} • {r.timeOfDay || 'N/A'} • Last run: {r.lastRunAt ? new Date(r.lastRunAt).toLocaleString() : 'never'}</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">{r.messageTemplate}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={async ()=>{ await notificationService.updateRule(r._id, { isActive: !r.isActive }); await loadRules(); }} className={`px-3 py-1.5 rounded text-xs ${r.isActive?'bg-gray-200 dark:bg-gray-700':'bg-emerald-600 text-white'}`}>{r.isActive?'Pause':'Activate'}</button>
                    <button onClick={async ()=>{ await notificationService.deleteRule(r._id); await loadRules(); }} className="px-3 py-1.5 rounded text-xs bg-red-600 text-white">Delete</button>
                  </div>
                </div>
              </div>
            ))}
            {rules.length === 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">No rules yet. Create one above.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartNotifyManager;


