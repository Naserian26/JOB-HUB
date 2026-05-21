import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import SeekerLayout from '../components/SeekerLayout';
import { Briefcase, Building2, Download, Search, X } from 'lucide-react';

const API = 'http://localhost:5000/api';

const Applications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user?.token) return;
    const fetchAll = async () => {
      try {
        const [appsRes, profileRes] = await Promise.all([
          axios.get(`${API}/applications/my-applications`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axios.get(`${API}/profiles/me`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }).catch(() => ({ data: null })),
        ]);
        setApplications(appsRes.data || []);
        setProfile(profileRes.data);
      } catch (err) {
        console.error('Failed to fetch applications', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user?.token]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending':   return 'bg-amber-50 border border-amber-200 text-amber-700';
      case 'interview': return 'bg-blue-50 border border-blue-200 text-blue-700';
      case 'hired':     return 'bg-green-50 border border-green-200 text-green-700';
      case 'rejected':  return 'bg-red-50 border border-red-200 text-red-700';
      default:          return 'bg-gray-100 text-gray-700';
    }
  };

  const filtered = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter;
    const matchesSearch = !search ||
      app.jobId?.title?.toLowerCase().includes(search.toLowerCase()) ||
      app.jobId?.employerId?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    interview: applications.filter(a => a.status === 'interview').length,
    hired: applications.filter(a => a.status === 'hired').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  return (
    <SeekerLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
          <p className="mt-1 text-sm text-gray-500">Track all your job applications in one place.</p>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
            <Search className="h-4 w-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by job or company..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400 bg-transparent"
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X className="h-3 w-3 text-gray-400" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {['all', 'pending', 'interview', 'hired', 'rejected'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition ${
                  filter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f} {counts[f] > 0 && <span className="ml-1 text-gray-400">({counts[f]})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
              <p className="text-sm text-gray-400">Loading applications...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Briefcase className="h-8 w-8 text-gray-300" />
              </div>
              <p className="font-medium text-gray-600">
                {applications.length === 0 ? 'No applications yet' : 'No results found'}
              </p>
              <p className="mt-1 text-sm text-gray-400">
                {applications.length === 0
                  ? 'Start applying to jobs to see them here.'
                  : 'Try a different filter or search term.'}
              </p>
              {applications.length === 0 && (
                <Link
                  to="/jobs"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
                >
                  Browse Jobs
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Job</th>
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Match</th>
                    <th className="px-6 py-4">Date Applied</th>
                    <th className="px-6 py-4">CV</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(app => (
                    <tr key={app._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <Link
                          to={`/jobs/${app.jobId?._id}`}
                          className="font-medium text-gray-900 hover:text-indigo-600 transition"
                        >
                          {app.jobId?.title || 'Unknown Job'}
                        </Link>
                        {app.coverLetter && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{app.coverLetter}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          {app.jobId?.employerId?.name || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-bold ${
                          app.matchScore >= 80 ? 'text-green-600' :
                          app.matchScore >= 50 ? 'text-amber-500' : 'text-gray-400'
                        }`}>
                          {app.matchScore ?? 0}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(app.createdAt).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        {app.cvUrl ? (
                          <a
                            href={app.cvUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition"
                          >
                            <Download className="h-3.5 w-3.5" /> CV
                          </a>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${getStatusStyle(app.status)}`}>
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SeekerLayout>
  );
};

export default Applications;