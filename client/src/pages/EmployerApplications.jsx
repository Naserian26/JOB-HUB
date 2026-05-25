import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Users, Download, MessageSquare,  MapPin } from 'lucide-react';
import EmployerLayout from '../components/EmployerLayout';

const API = 'http://localhost:5000/api';

const EmployerApplications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user?.token) return;
    let cancelled = false;
    const fetchAll = async () => {
      try {
        const res = await axios.get(`${API}/applications/employer/all`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (!cancelled) setApplications(res.data);
      } catch (err) {
        console.error('Error fetching applications', err);
        if (err.response?.status === 401) navigate('/login');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [user?.token, navigate]);

  const handleStatusChange = async (id, newStatus) => {
    setApplications(prev =>
      prev.map(app => app._id === id ? { ...app, status: newStatus } : app)
    );
    try {
      await axios.put(
        `${API}/applications/status/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleMessage = (app) => {
    const seekerId   = app.seekerId?._id || app.seekerId;
    const employerId = user.id;
    const name       = encodeURIComponent(app.seekerId?.name || 'Applicant');
    const job        = encodeURIComponent(app.jobId?.title || '');
    navigate(`/messages?appId=${app._id}&seekerId=${seekerId}&employerId=${employerId}&name=${name}&job=${job}`);
  };

  // FIXED: Dark Mode Status Styles
  const getStatusStyle = (status) => ({
    pending:   'bg-amber-500/20 text-amber-400 border-amber-500/30',
    interview: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    hired:     'bg-lime-500/20 text-lime-400 border-lime-500/30',
    rejected:  'bg-red-500/20 text-red-400 border-red-500/30',
  }[status] ?? 'bg-slate-700 text-slate-300');

  const filtered = filter === 'all'
    ? applications
    : applications.filter(app => app.status === filter);

  return (
    <EmployerLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Applications</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {applications.length} total candidate{applications.length !== 1 ? 's' : ''} across all jobs
          </p>
        </div>

        {/* FIXED: Dark Mode Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 border border-dark-border rounded-lg p-1 text-sm self-start md:self-auto">
          {['all', 'pending', 'interview', 'hired', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md font-medium capitalize transition-all ${
                filter === f 
                  ? 'bg-lime-accent text-black shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* FIXED: Dark Mode Table Container */}
      <div className="overflow-hidden rounded-xl border border-dark-border bg-dark-card shadow-dark-sm">
        {loading ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-lime-accent" />
            <p className="text-sm text-slate-400">Loading applications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <Users className="mb-3 h-12 w-12 text-slate-600" />
            <p className="font-medium text-slate-500">No applications found</p>
            <p className="mt-1 text-sm text-slate-400">
              {filter === 'all' ? 'Applications will appear here once people apply.' : `No ${filter} applications yet.`}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-dark-border bg-slate-900/50 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">Job</th>
                <th className="px-6 py-4">Match Score</th>
                <th className="px-6 py-4">Cover Letter</th>
                <th className="px-6 py-4">CV</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {filtered.map((app) => (
                <tr key={app._id} className="transition hover:bg-slate-900/30 group">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-100 group-hover:text-lime-accent transition-colors">{app.seekerId?.name || '—'}</p>
                    <p className="text-xs text-slate-400">{app.seekerId?.email || ''}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-slate-200">{app.jobId?.title || '—'}</p>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" />
                        {app.jobId?.location || '—'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${
                      app.matchScore >= 80 ? 'text-lime-300' :
                      app.matchScore >= 50 ? 'text-amber-400' : 'text-slate-500'
                    }`}>
                      {app.matchScore ?? 0}%
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <p className="truncate text-xs text-slate-400 italic">{app.coverLetter || '—'}</p>
                  </td>
                  <td className="px-6 py-4">
                    {app.cvUrl ? (
                      <a
                        href={app.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-lime-accent hover:text-lime-300 transition"
                      >
                        <Download className="h-4 w-4" /> Download
                      </a>
                    ) : (
                      <span className="text-xs text-slate-600">No CV</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app._id, e.target.value)}
                      className={`
                        cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-lime-accent focus:ring-offset-2 focus:ring-offset-slate-900
                        ${getStatusStyle(app.status)}
                      `}
                    >
                      {/* FIXED: Explicit classes for Dropdown Options to ensure visibility on Dark Theme */}
                      <option value="pending" className="bg-slate-900 text-slate-100">Pending</option>
                      <option value="interview" className="bg-slate-900 text-slate-100">Interview</option>
                      <option value="hired" className="bg-slate-900 text-slate-100">Hired</option>
                      <option value="rejected" className="bg-slate-900 text-slate-100">Rejected</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleMessage(app)}
                      className="flex items-center gap-1.5 text-xs font-medium text-lime-accent hover:text-lime-300 transition"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Message
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </EmployerLayout>
  );
};

export default EmployerApplications;