import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { Download, ArrowLeft, Users, ChevronDown, ChevronUp, LayoutGrid, List } from 'lucide-react';
import EmployerLayout from '../components/EmployerLayout';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from 'recharts';

const API = 'http://localhost:5000/api';

const COLUMNS = [
  { key: 'pending',   label: 'Pending',   color: 'bg-gray-100',  border: 'border-gray-300',  dot: 'bg-gray-400'  },
  { key: 'interview', label: 'Interview', color: 'bg-blue-50',   border: 'border-blue-300',  dot: 'bg-blue-500'  },
  { key: 'hired',     label: 'Hired',     color: 'bg-green-50',  border: 'border-green-300', dot: 'bg-green-500' },
  { key: 'rejected',  label: 'Rejected',  color: 'bg-red-50',    border: 'border-red-300',   dot: 'bg-red-400'   },
];

const MatchRadar = ({ breakdown, explanation }) => {
  const data = [
    { subject: 'Skills',     value: breakdown?.skills     ?? 0 },
    { subject: 'Semantic',   value: breakdown?.semantic   ?? 0 },
    { subject: 'Experience', value: breakdown?.experience ?? 0 },
    { subject: 'Location',   value: breakdown?.location   ?? 0 },
    { subject: 'Salary',     value: breakdown?.salary     ?? 0 },
  ];
  const hasData = data.some(d => d.value > 0);

  return (
    <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Match Breakdown</p>
      {hasData ? (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={data}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#9ca3af' }} />
              <Radar name="Match" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
              <Tooltip formatter={(value) => [`${value}%`, 'Score']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {data.map(({ subject, value }) => (
              <div key={subject} className="flex items-center gap-2">
                <span className="w-20 text-right text-xs text-gray-500">{subject}</span>
                <div className="flex-1 rounded-full bg-gray-200 h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className="w-8 text-xs font-semibold text-gray-700">{value}%</span>
              </div>
            ))}
          </div>
          {explanation && (
            <p className="mt-3 text-xs text-gray-500 italic border-t border-gray-200 pt-2">{explanation}</p>
          )}
        </>
      ) : (
        <p className="text-xs text-gray-400 text-center py-4">No breakdown available.</p>
      )}
    </div>
  );
};

const KanbanCard = ({ app, onStatusChange }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{app.seekerId?.name || '—'}</p>
          <p className="text-xs text-gray-400">{app.seekerId?.email || ''}</p>
        </div>
        <span className={`text-xs font-bold ${
          app.matchScore >= 80 ? 'text-green-600' :
          app.matchScore >= 50 ? 'text-amber-500' : 'text-gray-400'
        }`}>{app.matchScore ?? 0}%</span>
      </div>

      {app.coverLetter && (
        <p className="text-xs text-gray-500 line-clamp-2">{app.coverLetter}</p>
      )}

      <div className="flex items-center justify-between pt-1">
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
          <span className="text-xs text-gray-300">No CV</span>
        )}
        <button
          onClick={() => setExpanded(p => !p)}
          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-600 transition"
        >
          {expanded ? <><ChevronUp className="h-3.5 w-3.5" /> Hide</> : <><ChevronDown className="h-3.5 w-3.5" /> Breakdown</>}
        </button>
      </div>

      {expanded && <MatchRadar breakdown={app.matchBreakdown} explanation={app.matchExplanation} />}

      <div className="flex flex-wrap gap-1 pt-1 border-t border-gray-50">
        {COLUMNS.filter(c => c.key !== app.status).map(col => (
          <button
            key={col.key}
            onClick={() => onStatusChange(app._id, col.key)}
            className="text-[10px] font-semibold px-2 py-1 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition capitalize"
          >
            → {col.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const KanbanBoard = ({ applicants, onStatusChange }) => (
  <div className="grid grid-cols-4 gap-4">
    {COLUMNS.map(col => {
      const cards = applicants.filter(a => a.status === col.key);
      return (
        <div key={col.key} className={`rounded-xl border ${col.border} ${col.color} p-3`}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`h-2 w-2 rounded-full ${col.dot}`} />
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{col.label}</p>
            <span className="ml-auto text-xs text-gray-400 font-medium">{cards.length}</span>
          </div>
          <div className="space-y-3">
            {cards.length === 0 ? (
              <p className="text-xs text-gray-300 text-center py-6">No applicants</p>
            ) : (
              cards.map(app => (
                <KanbanCard key={app._id} app={app} onStatusChange={onStatusChange} />
              ))
            )}
          </div>
        </div>
      );
    })}
  </div>
);

const Applicants = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [applicants, setApplicants] = useState([]);
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [view, setView] = useState('table');

  useEffect(() => {
    if (!user?.token || !jobId) return;
    const fetchData = async () => {
      try {
        const [appsRes, jobRes] = await Promise.all([
          axios.get(`${API}/applications/job/${jobId}/applicants`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axios.get(`${API}/jobs/${jobId}`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
        ]);
        setApplicants(appsRes.data);
        setJobTitle(jobRes.data?.title || '');
      } catch (error) {
        console.error('Error fetching applicants', error);
        if (error.response?.status === 401) navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [jobId, user?.token, navigate]);

  const handleStatusChange = async (id, newStatus) => {
    setApplicants(prev =>
      prev.map(app => app._id === id ? { ...app, status: newStatus } : app)
    );
    try {
      await axios.put(
        `${API}/applications/status/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending':   return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'interview': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'hired':     return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':  return 'bg-red-100 text-red-800 border-red-200';
      default:          return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  return (
    <EmployerLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/employer/manage-jobs')}
            className="mb-2 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Manage Jobs
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {jobTitle ? `Applicants — ${jobTitle}` : 'Applicants'}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{applicants.length} candidate{applicants.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${view === 'table' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <List className="h-3.5 w-3.5" /> Table
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${view === 'kanban' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Kanban
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <p className="text-sm text-gray-400">Loading applicants...</p>
        </div>
      ) : applicants.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
          <Users className="mb-3 h-12 w-12 text-gray-200" />
          <p className="font-medium text-gray-500">No applicants yet</p>
          <p className="mt-1 text-sm text-gray-400">Applicants will appear here once people apply.</p>
        </div>
      ) : view === 'kanban' ? (
        <KanbanBoard applicants={applicants} onStatusChange={handleStatusChange} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">Match Score</th>
                <th className="px-6 py-4">Cover Letter</th>
                <th className="px-6 py-4">CV</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Breakdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {applicants.map((app) => (
                <>
                  <tr key={app._id} className="transition hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{app.seekerId?.name || '—'}</p>
                      <p className="text-xs text-gray-400">{app.seekerId?.email || ''}</p>
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
                        onClick={() => toggleExpand(app._id)}
                        className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition font-medium"
                      >
                        {expandedId === app._id ? (
                          <><ChevronUp className="h-4 w-4" /> Hide</>
                        ) : (
                          <><ChevronDown className="h-4 w-4" /> View</>
                        )}
                      </button>
                    </td>
                  </tr>
                  {expandedId === app._id && (
                    <tr key={`${app._id}-expanded`}>
                      <td colSpan={6} className="px-6 pb-6">
                        <MatchRadar breakdown={app.matchBreakdown} explanation={app.matchExplanation} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </EmployerLayout>
  );
};

export default Applicants;