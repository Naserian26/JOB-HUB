import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getSocket } from '../utils/socket';
import { useAuth } from '../hooks/useAuth';
import SeekerLayout from '../components/SeekerLayout';
import { Clock, FileText, TrendingUp, XCircle, Briefcase, Building2, X, CheckCircle, Info, MapPin, DollarSign, Sparkles } from 'lucide-react';

const API = 'http://localhost:5000/api';

const TOAST_DURATION = 5000;

const Toast = ({ toast, onDismiss }) => {
  const styles = {
    hired:     { bg: 'bg-lime-500/10 border-lime-500/30', text: 'text-lime-400', icon: <CheckCircle className="h-5 w-5 text-lime-500 shrink-0" /> },
    interview: { bg: 'bg-blue-500/10 border-blue-500/30',   text: 'text-blue-400',   icon: <Info className="h-5 w-5 text-blue-500 shrink-0" /> },
    rejected:  { bg: 'bg-red-500/10 border-red-500/30',     text: 'text-red-400',    icon: <XCircle className="h-5 w-5 text-red-400 shrink-0" /> },
    pending:   { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400',  icon: <Clock className="h-5 w-5 text-amber-400 shrink-0" /> },
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
      <button onClick={() => onDismiss(toast.id)} className="text-dark-secondary/50 hover:text-dark-secondary shrink-0">
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
  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);

  const addToast = useCallback((data) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, ...data }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), TOAST_DURATION);
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
        return res.data;
      } catch {
        return null;
      }
    };

    const loadRecommendations = async (profile) => {
      if (!profile) return;
      setRecsLoading(true);
      try {
        const jobsRes = await axios.get(`${API}/jobs`);
        const jobs = jobsRes.data;

        const scored = await Promise.all(
          jobs.slice(0, 10).map(async (job) => {
            try {
              const matchRes = await axios.post(
                `${API}/applications/match-preview`,
                { jobId: job._id },
                { headers: { Authorization: `Bearer ${user.token}` } }
              );
              return { ...job, matchScore: matchRes.data.match_score };
            } catch {
              return { ...job, matchScore: 0 };
            }
          })
        );

        const top3 = scored.filter(j => j.matchScore >= 40).sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
        setRecommendations(top3);
      } catch (err) {
        console.error('Failed to load recommendations', err);
      } finally {
        setRecsLoading(false);
      }
    };

    loadApplications();
    loadProfile().then(loadRecommendations);

    const socket = getSocket();
    if (!socket) return;
    socket.emit('join_room', user.id);

    const handleStatusUpdate = (data) => {
      setApplications(prev =>
        prev.map(app => app._id === data.applicationId ? { ...app, status: data.status } : app)
      );
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
      pending:   'bg-amber-500/10 border border-amber-500/30 text-amber-400',
      interview: 'bg-blue-500/10 border border-blue-500/30 text-blue-400',
      hired:     'bg-lime-500/10 border border-lime-500/30 text-lime-400',
      rejected:  'bg-red-500/10 border border-red-500/30 text-red-400',
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
          <h1 className="text-2xl font-bold text-dark-primary">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-dark-secondary">
            Here is what is happening with your applications.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: 'Applications', value: totalApplications, icon: <FileText className="h-5 w-5 text-lime-500" />, color: 'text-lime-400', bg: 'bg-lime-500/10' },
                { label: 'Interviews',   value: interviews,         icon: <TrendingUp className="h-5 w-5 text-blue-500" />,   color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
                { label: 'Pending',      value: pending,            icon: <Clock className="h-5 w-5 text-amber-500" />,      color: 'text-amber-400',  bg: 'bg-amber-500/10'  },
                { label: 'Rejected',     value: rejected,           icon: <XCircle className="h-5 w-5 text-red-500" />,      color: 'text-red-400',    bg: 'bg-red-500/10'    },
              ].map((stat, index) => (
                <div key={index} className="rounded-xl border border-dark-border bg-dark-card p-4">
                  <div className="mb-3">
                    <div className={`inline-flex rounded-lg p-2 ${stat.bg}`}>{stat.icon}</div>
                  </div>
                  <p className={`text-2xl font-bold ${stat.color}`}>{loading ? '—' : stat.value}</p>
                  <p className="mt-1 text-xs font-medium text-dark-secondary">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            <div className="rounded-xl border border-dark-border bg-dark-card shadow-dark-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-dark-border bg-dark-sidebar/70 px-6 py-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-lime-accent" />
                  <h2 className="font-bold text-slate-100">Recommended for You</h2>
                </div>
             <Link to="/seeker/applications" className="text-xs font-medium text-lime-accent hover:text-lime-300">
  View All →
</Link>
              </div>

              {recsLoading ? (
                <div className="p-8 text-center">
                  <div className="mb-2 inline-block h-6 w-6 animate-spin rounded-full border-4 border-slate-700 border-t-lime-accent" />
                  <p className="text-xs text-slate-400">Finding best matches...</p>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="p-8 text-center">
                  <Briefcase className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Complete your profile to get recommendations</p>
                  <Link to="/seeker/profile" className="mt-2 inline-block text-xs text-lime-accent hover:text-lime-300">
                    Complete Profile →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-dark-border">
                  {recommendations.map(job => (
                    <div key={job._id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-900 transition">
                      <div className="w-9 h-9 rounded-lg bg-lime-500/15 border border-lime-500/30 flex items-center justify-center text-lime-200 font-bold text-sm shrink-0">
                        {job.employerId?.name?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-100 text-sm">{job.title}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-slate-500" />{job.location}</span>
                          {job.salary && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3 text-slate-500" />{job.salary}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs font-bold ${
                          job.matchScore >= 80 ? 'text-lime-300' :
                          job.matchScore >= 50 ? 'text-amber-300' : 'text-slate-500'
                        }`}>{job.matchScore}% match</span>
                        <Link
                          to={`/jobs/${job._id}`}
                          className="text-xs font-semibold text-black bg-lime-accent hover:bg-lime-accent-hover px-3 py-1.5 rounded-lg transition"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Applications table */}
            <div className="overflow-hidden rounded-xl border border-dark-border bg-dark-card shadow-dark-sm">
              <div className="flex items-center justify-between border-b border-dark-border bg-dark-sidebar/70 px-6 py-4">
                <h2 className="font-bold text-slate-100">Latest Applications</h2>
                <Link to="/applications" className="text-xs font-medium text-lime-accent hover:text-lime-400">
                  View All →
                </Link>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-lime-accent" />
                  <p className="text-sm text-slate-400">Loading your applications...</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-900">
                    <Briefcase className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="mb-1 font-medium text-slate-100">No applications yet</h3>
                  <p className="mb-4 text-sm text-slate-400">Start exploring opportunities to see them here.</p>
                  <Link to="/jobs" className="inline-flex items-center gap-2 rounded-lg bg-lime-accent px-4 py-2 text-sm font-medium text-black shadow-sm transition-colors hover:bg-lime-accent-hover">
                    Browse Jobs
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-dark-sidebar text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-6 py-4">Job Title</th>
                        <th className="px-6 py-4">Company</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Date Applied</th>
                        <th className="px-6 py-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border">
                      {applications.map(app => (
                        <tr key={app._id} className="group transition-colors hover:bg-slate-900/80">
                          <td className="px-6 py-4">
                            <p className="font-medium text-slate-100 transition-colors group-hover:text-lime-accent">
                              {app.jobId?.title || 'Unknown Job'}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-3 w-3 text-slate-600" />
                              {app.jobId?.employerId?.name || '—'}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            <span className="rounded bg-slate-900 px-2 py-1 text-xs text-slate-300">
                              {app.jobId?.type || 'Full-time'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">
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
            <div className="rounded-xl border border-dark-border bg-dark-card p-6 shadow-dark-sm">
              <div className="mb-6 flex items-center gap-3">
                {profile?.photoUrl ? (
                  <img src={profile.photoUrl} alt="Profile" className="h-12 w-12 rounded-full object-cover border-2 border-lime-accent" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-lime-accent bg-lime-500/15 text-lg font-bold text-lime-300">
                    {initials}
                  </div>
                )}
                <div>
                  <p className="font-bold text-slate-100">{user?.name}</p>
                  <p className="text-xs text-slate-400">Job Seeker</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="mb-2 flex justify-between text-sm font-medium">
                  <span className="text-slate-400">Profile completion</span>
                  <span className="text-lime-accent">{profileCompletion}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-900">
                  <div
                    className="h-2.5 rounded-full bg-lime-accent transition-all duration-1000 ease-out"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
                {profileCompletion < 100 && (
                  <p className="mt-2 text-xs text-slate-500">
                    Add {profile ? 'photo, CV or missing fields' : 'your profile details'} to reach 100%
                  </p>
                )}
              </div>

              <Link
                to="/seeker/profile"
                className="block w-full rounded-lg bg-lime-accent py-2.5 text-center text-sm font-semibold text-black transition-colors hover:bg-lime-accent-hover"
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