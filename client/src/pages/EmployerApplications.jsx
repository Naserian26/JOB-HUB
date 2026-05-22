import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Users, Download, MessageSquare } from 'lucide-react';
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

  const getStatusStyle = (status) => ({
    pending:   'bg-gray-100 text-gray-800 border-gray-200',
    interview: 'bg-blue-100 text-blue-800 border-blue-200',
    hired:     'bg-green-100 text-green-800 border-green-200',
    rejected:  'bg-red-100 text-red-800 border-red-200',
  }[status] ?? 'bg-gray-100 text-gray-800 border-gray-200');

  const filtered = filter === 'all'
    ? applications
    : applications.filter(app => app.status === filter);

  return (
    <EmployerLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {applications.length} total candidate{applications.length !== 1 ? 's' : ''} across all jobs
          </p>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 text-sm">
          {['all', 'pending', 'interview', 'hired', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md font-medium capitalize transition ${
                filter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            <p className="text-sm text-gray-400">Loading applications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <Users className="mb-3 h-12 w-12 text-gray-200" />
            <p className="font-medium text-gray-500">No applications found</p>
            <p className="mt-1 text-sm text-gray-400">
              {filter === 'all' ? 'Applications will appear here once people apply.' : `No ${filter} applications yet.`}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
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
            <tbody className="divide-y divide-gray-50">
              {filtered.map((app) => (
                <tr key={app._id} className="transition hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{app.seekerId?.name || '—'}</p>
                    <p className="text-xs text-gray-400">{app.seekerId?.email || ''}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-700">{app.jobId?.title || '—'}</p>
                    <p className="text-xs text-gray-400">{app.jobId?.location || ''}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${
                      app.matchScore >= 80 ? 'text-green-600' :
                      app.matchScore >= 50 ? 'text-amber-500' : 'text-gray-400'
                    }`}>
                      {app.matchScore ?? 0}%
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <p className="truncate text-xs text-gray-500">{app.coverLetter || '—'}</p>
                  </td>
                  <td className="px-6 py-4">
                    {app.cvUrl ? (
                      <a
                        href={app.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition"
                      >
                        <Download className="h-4 w-4" /> Download
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">No CV</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app._id, e.target.value)}
                      className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 ${getStatusStyle(app.status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="interview">Interview</option>
                      <option value="hired">Hired</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleMessage(app)}
                      className="flex items-center gap-1.5 text-xs font-medium text-indigo-500 hover:text-indigo-700 transition"
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