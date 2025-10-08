import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { meetingService } from '../services/meetingService';
import { authService } from '../services/authService';

export default function ScholarDashboard() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>({ enrolledStudents: [], requested: [], scheduled: [], linkSent: [] });
  const [error, setError] = useState<string | null>(null);
  const [schedulingMeeting, setSchedulingMeeting] = useState<string | null>(null);
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedEnrolledChatId, setSelectedEnrolledChatId] = useState<string | null>(null);
  const [rescheduleTime, setRescheduleTime] = useState('');
  const user = authService.getUser();

  // Check if user is a scholar
  if (user?.role !== 'scholar') {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600">This dashboard is only available to approved scholars.</p>
        <Link to="/" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Return to Home
        </Link>
      </div>
    );
  }

  const loadData = () => {
    setLoading(true);
    meetingService.getScholarDashboard()
      .then(setData)
      .catch(() => setError('Failed to load scholar dashboard'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleScheduleMeeting = async (meetingId: string) => {
    if (!scheduledTime) return;
    
    try {
      const meeting = data.requested.find((m: any) => m._id === meetingId);
      if (!meeting) return;
      
      await meetingService.scheduleMeeting(meeting.chatId._id, scheduledTime);
      setSchedulingMeeting(null);
      setScheduledTime('');
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      alert('Failed to schedule meeting');
    }
  };

  const handleRespondReschedule = async (chatId: string, decision: 'accept'|'reject'|'propose') => {
    try {
      await meetingService.respondReschedule(chatId, decision, decision !== 'reject' ? rescheduleTime : undefined);
      setRescheduleTime('');
      loadData();
    } catch (error) {
      console.error('Error responding to reschedule:', error);
      alert('Failed to respond');
    }
  };

  const handleCancelMeeting = async (chatId: string) => {
    try {
      await meetingService.cancelMeeting(chatId);
      loadData();
    } catch (error) {
      console.error('Error cancelling meeting:', error);
      alert('Failed to cancel');
    }
  };

  if (loading) return <div className="p-6 text-center">Loading scholar dashboard...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Scholar Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your students, meetings, and feedback</p>
        </div>
        <div className="flex space-x-3">
          <Link to="/scholar/feedback" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg no-underline flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>View Feedback</span>
          </Link>
          <Link to="/" className="px-4 py-2 bg-[#264653] hover:bg-[#2A9D8F] dark:text-gray-300 rounded-lg no-underline" style={{color: '#14b8a6', textDecoration: 'none'}}>
            Return to Main
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Enrolled Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.enrolledStudents.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Meeting Requests</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.requested.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Meetings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.linkSent.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enrolled Students */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Enrolled Students</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
          {data.enrolledStudents.map((s: any) => (
            <div
              key={s.chatId}
              className={`p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 transition flex-shrink-0 min-w-[260px] max-w-[260px] w-[260px] overflow-hidden`}
            >
              {selectedEnrolledChatId === s.chatId ? (
                <div className="space-y-2 w-full">
                  <div className="text-sm text-gray-700 dark:text-gray-200 mb-2">Schedule a meeting with {s.student?.name}</div>
                  <div className="flex flex-col gap-2 items-stretch w-full">
                    <input
                      type="datetime-local"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full min-w-0 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          if (!scheduledTime) return;
                          try {
                            await meetingService.scheduleMeeting(s.chatId, scheduledTime);
                            setScheduledTime('');
                            setSelectedEnrolledChatId(null);
                            loadData();
                          } catch (err) {
                            console.error('Schedule failed:', err);
                            alert('Failed to schedule meeting');
                          }
                        }}
                        disabled={!scheduledTime}
                        className="flex-1 px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Schedule
                      </button>
                      <button
                        onClick={() => { setSelectedEnrolledChatId(null); setScheduledTime(''); }}
                        className="flex-1 px-3 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div onClick={() => setSelectedEnrolledChatId(s.chatId)} className="cursor-pointer">
                  <div className="font-medium text-gray-900 dark:text-white">{s.student?.name}</div>
                  {/* email hidden */}
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Last activity: {new Date(s.lastActivity).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          ))}
          {!data.enrolledStudents.length && (
            <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
              No enrolled students yet.
            </div>
          )}
        </div>
      </div>

      {/* Meeting Requests */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Meeting Requests</h2>
        <div className="space-y-4">
          {data.requested.map((m: any) => (
            <div key={m._id} className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{m.studentId?.name}</div>
                  {/* email hidden */}
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Chat ID: {m.chatId?._id}
                  </div>
                </div>
                <div className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  Status: Requested
                </div>
              </div>
              
              {schedulingMeeting === m._id ? (
                <div className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-lg border">
                  <div className="text-sm font-medium mb-3 text-gray-900 dark:text-white">Schedule Meeting</div>
                  <div className="flex gap-3 items-center">
                    <input
                      type="datetime-local"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => handleScheduleMeeting(m._id)}
                      disabled={!scheduledTime}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Schedule
                    </button>
                    <button
                      onClick={() => {
                        setSchedulingMeeting(null);
                        setScheduledTime('');
                      }}
                      className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <button
                    onClick={() => setSchedulingMeeting(m._id)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    Schedule Meeting
                  </button>
                </div>
              )}
            </div>
          ))}
          {!data.requested.length && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No pending meeting requests.
            </div>
          )}
        </div>
      </div>

      {/* Scheduled Meetings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Scheduled Meetings</h2>
        <div className="space-y-4">
          {data.scheduled.map((m: any) => (
            <div key={m._id} className="p-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{m.studentId?.name}</div>
                  {/* email hidden */}
                  <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    When: {m.scheduledTime ? new Date(m.scheduledTime).toLocaleString() : 'TBD'}
                  </div>
                </div>
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Status: Scheduled
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                {m.link && (
                <div className="mt-3">
                  <a 
                    className="inline-block px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
                    href={m.link} 
                    target="_blank" 
                    rel="noreferrer"
                  >
                    Open Meeting Link
                  </a>
                </div>
                )}
                <button
                  onClick={() => handleCancelMeeting(m.chatId._id)}
                  className="px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700"
                >
                  Cancel Meeting
                </button>
                <div className="flex items-center gap-2">
                  <input
                    type="datetime-local"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="px-2 py-1 border border-blue-300 rounded"
                  />
                  <button
                    onClick={() => handleRespondReschedule(m.chatId._id, 'propose')}
                    disabled={!rescheduleTime}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Reschedule
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!data.scheduled.length && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No scheduled meetings.
            </div>
          )}
        </div>
      </div>

      {/* Active Meetings (Links Sent) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Active Meetings</h2>
        <div className="space-y-4">
          {data.linkSent.map((m: any) => (
            <div key={m._id} className="p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{m.studentId?.name}</div>
                  {/* email hidden */}
                  <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                    When: {m.scheduledTime ? new Date(m.scheduledTime).toLocaleString() : 'Now'}
                  </div>
                </div>
                <div className="text-sm font-medium text-green-700 dark:text-green-300">
                  Status: Active
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                {m.link && (
                  <a 
                    className="inline-block px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
                    href={m.link} 
                    target="_blank" 
                    rel="noreferrer"
                  >
                    Join Meeting
                  </a>
                )}
                <button
                  onClick={() => handleCancelMeeting(m.chatId._id)}
                  className="px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700"
                >
                  Cancel Meeting
                </button>
              </div>
            </div>
          ))}
          {!data.linkSent.length && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No active meetings.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
