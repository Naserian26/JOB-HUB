import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getSocket } from '../utils/socket';
import { useAuth } from '../hooks/useAuth';
import SeekerLayout from '../components/SeekerLayout';
import { Clock, FileText, TrendingUp, XCircle, Briefcase, Building2, X, CheckCircle, Info } from 'lucide-react';

const API = 'http://localhost:5000/api';

// --- Toast system ---
const TOAST_DURATION = 5000;

const Toast = ({ toast, onDismiss }) => {
  const styles = {
    hired:     { bg: 'bg-green-50 border-green-300', text: 'text-green-800', icon: <CheckCircle className="h-5 w-5 text-green-500 shrink-0" /> },
    interview: { bg: 'bg-blue-50 border-blue-300',   text: 'text-blue-800',   icon: <Info className="h-5 w-5 text-blue-500 shrink-0" /> },
    rejected:  { bg: 'bg-red-50 border-red-300',     text: 'text-red-800',    icon: <XCircle className="h-5 w-5 text-red-400 shrink-0" /> },
    pending:   { bg: 'bg-amber-50 border-amber-300', text: 'text-amber-800',  icon: <Clock className="h-5 w-5 text-amber-400 shrink-0" /> },
  };

  const style = styles[toast.status] || styles.pending;

  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg w-80 animate-slide-in ${style.bg}`}>
      {style.icon}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${style.text}`}>Application Update</p>
        <p className={`text-xs mt-0.5 ${style.text} opacity-80`}>
          <span className="font-medium">{toast.jobTitle}</span> — status changed to{' '}
          <span className="font-bold uppercase">{toast.status}</span>
        </p>
      </div>
      <button onClick={() => onDismiss(toast.id)} className="text-gray-400 hover:text-gray-600 shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

const ToastContainer = ({ toasts, onDismiss }) => (
  <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
    {toasts.map(t => <Toast key={t.id} toast={t} onDismiss={onDismiss} />)}
  </div>
);

const SeekerDashboard = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((data) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, ...data }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, TOAST_DURATION);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    if (!user?.token) return;

    const loadApplications = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/applications/my-applications`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setApplications(res.data || []);
      } catch (err) {
        console.error('Failed to fetch applications', err);
      } finally {
        setLoading(false);
      }
    };

    const loadProfile = async () => {
      try {
        const res = await axios.get(`${API}/profiles/me`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setProfile(res.data);
      } catch {
        // 404 = no profile yet
      }
    };

    loadApplications();
    loadProfile();

    const socket = getSocket();
    if (!socket) return;
    socket.emit('join_room', user.id);

    const handleStatusUpdate = (data) => {

       console.log('socket status_update received:', data);
      // Update application list
      setApplications(prev =>
        prev.map(app =>
          app._id === data.applicationId ? { ...app, status: data.status } : app
        )
      );
      // Show toast
      addToast({
        status: data.status,
        jobTitle: data.jobTitle || 'A job',
        applicationId: data.applicationId,
      });
    };

    socket.on('status_update', handleStatusUpdate);
    return () => socket?.off('status_update', handleStatusUpdate);
  }, [user, addToast]);

  const calcCompletion = () => {
    if (!profile) return 0;
    const fields = [
      profile.skills?.length > 0,
      profile.experience,
      profile.location,
      profile.salaryExpectation,
      profile.bio,
      profile.photoUrl,
      profile.cvUrl,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  };

  const profileCompletion = calcCompletion();
  const totalApplications = applications.length;
  const interviews = applications.filter(app => app.status === 'interview').length;
  const pending = applications.filter(app => app.status === 'pending').length;
  const rejected = applications.filter(app => app.status === 'rejected').length;

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'U';

  const getStatusBadge = (status) => {
    const styles = {
      pending:   'bg-amber-50 border border-amber-200 text-amber-700',
      interview: 'bg-blue-50 border border-blue-200 text-blue-700',
      hired:     'bg-green-50 border border-green-200 text-green-700',
      rejected:  'bg-red-50 border border-red-200 text-red-700',
    };
    return (
      <span className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${styles[status] || styles.pending}`}>
        {status}
      </span>
    );
  };

  return (
    <SeekerLayout profile={profile}>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here is what is happening with your applications.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

          {/* Left */}
          <div className="space-y-6 xl:col-span-2">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: 'Applications', value: totalApplications, icon: <FileText className="h-5 w-5 text-indigo-500" />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Interviews',   value: interviews,         icon: <TrendingUp className="h-5 w-5 text-blue-500" />,   color: 'text-blue-600',   bg: 'bg-blue-50'   },
                { label: 'Pending',      value: pending,            icon: <Clock className="h-5 w-5 text-amber-500" />,      color: 'text-amber-600',  bg: 'bg-amber-50'  },
                { label: 'Rejected',     value: rejected,           icon: <XCircle className="h-5 w-5 text-red-500" />,      color: 'text-red-600',    bg: 'bg-red-50'    },
              ].map((stat, index) => (
                <div key={index} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="mb-3">
                    <div className={`inline-flex rounded-lg p-2 ${stat.bg}`}>{stat.icon}</div>
                  </div>
                  <p className={`text-2xl font-bold ${stat.color}`}>{loading ? '—' : stat.value}</p>
                  <p className="mt-1 text-xs font-medium text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/50 px-6 py-4">
                <h2 className="font-bold text-gray-800">Latest Applications</h2>
                <Link to="/applications" className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
                  View All →
                </Link>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
                  <p className="text-sm text-gray-500">Loading your applications...</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <Briefcase className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="mb-1 font-medium text-gray-900">No applications yet</h3>
                  <p className="mb-4 text-sm text-gray-500">Start exploring opportunities to see them here.</p>
                  <Link to="/jobs" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700">
                    Browse Jobs
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-6 py-4">Job Title</th>
                        <th className="px-6 py-4">Company</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Date Applied</th>
                        <th className="px-6 py-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {applications.map(app => (
                        <tr key={app._id} className="group transition-colors hover:bg-gray-50/80">
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900 transition-colors group-hover:text-indigo-600">
                              {app.jobId?.title || 'Unknown Job'}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-3 w-3 text-gray-400" />
                              {app.jobId?.employerId?.name || '—'}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                              {app.jobId?.type || 'Full-time'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500">
                            {new Date(app.createdAt).toLocaleDateString(undefined, {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}
                          </td>
                          <td className="px-6 py-4 text-right">{getStatusBadge(app.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                {profile?.photoUrl ? (
                  <img src={profile.photoUrl} alt="Profile" className="h-12 w-12 rounded-full object-cover border-2 border-indigo-200" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-indigo-200 bg-indigo-100 text-lg font-bold text-indigo-700">
                    {initials}
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">Job Seeker</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="mb-2 flex justify-between text-sm font-medium">
                  <span className="text-gray-600">Profile completion</span>
                  <span className="text-indigo-600">{profileCompletion}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-2.5 rounded-full bg-indigo-600 transition-all duration-1000 ease-out"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
                {profileCompletion < 100 && (
                  <p className="mt-2 text-xs text-gray-400">
                    Add {profile ? 'photo, CV or missing fields' : 'your profile details'} to reach 100%
                  </p>
                )}
              </div>

              <Link
                to="/seeker/profile"
                className="block w-full rounded-lg bg-indigo-600 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                {profileCompletion === 100 ? 'View Profile' : 'Complete Profile'}
              </Link>
            </div>
          </div>

        </div>
      </div>
    </SeekerLayout>
  );
};

export default SeekerDashboard;