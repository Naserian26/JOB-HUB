import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import {
  Download, ArrowLeft, Users, ChevronDown, ChevronUp,
  LayoutGrid, List, MessageSquare, Calendar,
} from 'lucide-react';
import EmployerLayout from '../components/EmployerLayout';
import ScheduleModal from '../components/ScheduleModal';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';

const API = 'http://localhost:5000/api';

const COLUMNS = [
  { key: 'pending',   label: 'Pending',   dot: 'bg-gray-400',  accent: 'bg-gray-500'  },
  { key: 'interview', label: 'Interview', dot: 'bg-blue-500',  accent: 'bg-blue-500'  },
  { key: 'hired',     label: 'Hired',     dot: 'bg-green-500', accent: 'bg-green-500' },
  { key: 'rejected',  label: 'Rejected',  dot: 'bg-red-400',   accent: 'bg-red-500'   },
];

// ─── Score Ring ───────────────────────────────────────────────────────────────

const ScoreRing = ({ score }) => {
  const r = 12;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color =
    score >= 70 ? '#f97316' :
    score >= 40 ? '#fbbf24' : '#f87171';

  return (
    <div className="relative w-8 h-8 shrink-0">
      <svg className="-rotate-90 w-8 h-8" viewBox="0 0 30 30">
        <circle cx="15" cy="15" r={r} fill="none" stroke="#1e293b" strokeWidth="2.5" />
        <circle
          cx="15" cy="15" r={r}
          fill="none" stroke={color} strokeWidth="2.5"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-slate-300">
        {score}%
      </span>
    </div>
  );
};

// ─── Match Radar ──────────────────────────────────────────────────────────────

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
    <div className="mt-3 rounded-xl border border-dark-border bg-dark-bg p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Match Breakdown
      </p>
      {hasData ? (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={data}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#a8a29e' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748b' }} />
              <Radar name="Match" dataKey="value" stroke="#f97316" fill="#f97316" fillOpacity={0.15} strokeWidth={2} />
              <Tooltip
                formatter={(v) => [`${v}%`, 'Score']}
                contentStyle={{ fontSize: 12, borderRadius: 8, background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {data.map(({ subject, value }) => (
              <div key={subject} className="flex items-center gap-2">
                <span className="w-20 text-right text-xs text-slate-500">{subject}</span>
                <div className="flex-1 rounded-full bg-slate-800 h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      value >= 70 ? 'bg-lime-400' : value >= 40 ? 'bg-amber-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className="w-8 text-xs font-semibold text-slate-300">{value}%</span>
              </div>
            ))}
          </div>
          {explanation && (
            <p className="mt-3 text-xs text-slate-500 italic border-t border-dark-border pt-2">
              {explanation}
            </p>
          )}
        </>
      ) : (
        <p className="text-xs text-slate-600 text-center py-4">No breakdown available.</p>
      )}
    </div>
  );
};

// ─── Kanban Card ──────────────────────────────────────────────────────────────

const KanbanCard = ({ app, onStatusChange, onMessage, onSchedule }) => {
  const [expanded, setExpanded] = useState(false);
  const accentCol = COLUMNS.find(c => c.key === app.status)?.accent ?? 'bg-gray-500';
  const canSchedule = !['hired', 'rejected'].includes(app.status);

  return (
    <div className="rounded-xl border border-dark-border bg-dark-card overflow-hidden">
      <div className={`h-0.5 w-full ${accentCol}`} />
      <div className="p-4 space-y-3">

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-slate-100 text-sm truncate">{app.seekerId?.name || '—'}</p>
            <p className="text-xs text-slate-500 truncate">{app.seekerId?.email || ''}</p>
          </div>
          <ScoreRing score={app.matchScore ?? 0} />
        </div>

        {/* Cover letter */}
        {app.coverLetter && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{app.coverLetter}</p>
        )}

        {/* Actions row */}
        <div className="flex items-center justify-between pt-1 border-t border-dark-border">
          {app.cvUrl ? (
            <a href={app.cvUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition">
              <Download className="h-3.5 w-3.5" /> CV
            </a>
          ) : (
            <span className="text-xs text-slate-700">No CV</span>
          )}
          <div className="flex items-center gap-2">
            {canSchedule && (
              <button
                onClick={() => onSchedule(app)}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition font-medium"
              >
                <Calendar className="h-3.5 w-3.5" /> Schedule
              </button>
            )}
            <button
              onClick={() => onMessage(app)}
              className="flex items-center gap-1 text-xs text-lime-500 hover:text-lime-400 transition font-medium"
            >
              <MessageSquare className="h-3.5 w-3.5" /> Message
            </button>
            <button
              onClick={() => setExpanded(p => !p)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition"
            >
              {expanded
                ? <><ChevronUp className="h-3.5 w-3.5" /> Hide</>
                : <><ChevronDown className="h-3.5 w-3.5" /> Breakdown</>}
            </button>
          </div>
        </div>

        {/* Radar */}
        {expanded && <MatchRadar breakdown={app.matchBreakdown} explanation={app.matchExplanation} />}

        {/* Status move buttons */}
        <div className="flex flex-wrap gap-1">
          {COLUMNS.filter(c => c.key !== app.status).map(col => (
            <button
              key={col.key}
              onClick={() => onStatusChange(app._id, col.key)}
              className="text-[10px] font-medium px-2 py-1 rounded-full border border-dark-border text-slate-500 hover:text-slate-300 hover:border-slate-600 transition capitalize"
            >
              → {col.label}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};

// ─── Kanban Board ─────────────────────────────────────────────────────────────

const KanbanBoard = ({ applicants, onStatusChange, onMessage, onSchedule }) => (
  <div className="grid grid-cols-4 gap-4">
    {COLUMNS.map(col => {
      const cards = applicants.filter(a => a.status === col.key);
      return (
        <div key={col.key} className="rounded-xl bg-dark-bg p-3">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${col.dot}`} />
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{col.label}</p>
            </div>
            <span className="text-[10px] text-slate-600 font-medium bg-dark-card border border-dark-border rounded-full px-2 py-0.5">
              {cards.length}
            </span>
          </div>
          <div className="space-y-3">
            {cards.length === 0 ? (
              <div className="rounded-lg border border-dashed border-dark-border py-8 text-center">
                <p className="text-xs text-slate-700">No applicants</p>
              </div>
            ) : (
              cards.map(app => (
                <KanbanCard
                  key={app._id}
                  app={app}
                  onStatusChange={onStatusChange}
                  onMessage={onMessage}
                  onSchedule={onSchedule}
                />
              ))
            )}
          </div>
        </div>
      );
    })}
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const Applicants = () => {
  const { jobId }  = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const [applicants,    setApplicants]    = useState([]);
  const [jobTitle,      setJobTitle]      = useState('');
  const [loading,       setLoading]       = useState(true);
  const [expandedId,    setExpandedId]    = useState(null);
  const [view,          setView]          = useState('kanban');
  const [schedulingApp, setSchedulingApp] = useState(null);

  useEffect(() => {
    if (!user?.token || !jobId) return;
    let cancelled = false;
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
        if (!cancelled) {
          setApplicants(appsRes.data);
          setJobTitle(jobRes.data?.title || '');
        }
      } catch (error) {
        console.error('Error fetching applicants', error);
        if (error.response?.status === 401) navigate('/login');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [jobId, user?.token, navigate]);

  const handleStatusChange = async (id, newStatus) => {
    setApplicants(prev => prev.map(app => app._id === id ? { ...app, status: newStatus } : app));
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

  const handleMessage = (app) => {
    const seekerId   = app.seekerId?._id || app.seekerId;
    const employerId = user.id;
    const name       = encodeURIComponent(app.seekerId?.name || 'Applicant');
    const job        = encodeURIComponent(app.jobId?.title || jobTitle || '');
    navigate(`/messages?appId=${app._id}&seekerId=${seekerId}&employerId=${employerId}&name=${name}&job=${job}`);
  };

  const handleScheduled = (interview) => {
    setApplicants(prev =>
      prev.map(app =>
        app._id === interview.application ? { ...app, status: 'interview' } : app
      )
    );
  };

  const getStatusStyle = (status) => ({
    pending:   'bg-slate-800 text-slate-300 border-slate-600',
    interview: 'bg-blue-900/40 text-blue-300 border-blue-700',
    hired:     'bg-green-900/40 text-green-300 border-green-700',
    rejected:  'bg-red-900/40 text-red-300 border-red-800',
  }[status] ?? 'bg-slate-800 text-slate-300 border-slate-600');

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  return (
    <EmployerLayout>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/employer/manage-jobs')}
            className="mb-2 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Manage Jobs
          </button>
          <h1 className="text-2xl font-bold text-slate-100">
            {jobTitle ? `Applicants — ${jobTitle}` : 'Applicants'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {applicants.length} candidate{applicants.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-dark-card border border-dark-border rounded-lg p-1">
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              view === 'table' ? 'bg-dark-bg text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <List className="h-3.5 w-3.5" /> Table
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              view === 'kanban' ? 'bg-dark-bg text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Kanban
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-12 text-center bg-dark-card rounded-xl border border-dark-border">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-lime-500" />
          <p className="text-sm text-slate-500">Loading applicants...</p>
        </div>
      ) : applicants.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center bg-dark-card rounded-xl border border-dark-border">
          <Users className="mb-3 h-12 w-12 text-slate-700" />
          <p className="font-medium text-slate-400">No applicants yet</p>
          <p className="mt-1 text-sm text-slate-600">Applicants will appear here once people apply.</p>
        </div>
      ) : view === 'kanban' ? (
        <KanbanBoard
          applicants={applicants}
          onStatusChange={handleStatusChange}
          onMessage={handleMessage}
          onSchedule={setSchedulingApp}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-dark-border bg-dark-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-dark-border bg-dark-bg text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">Match</th>
                <th className="px-6 py-4">Cover Letter</th>
                <th className="px-6 py-4">CV</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {applicants.map((app) => (
                <>
                  <tr key={app._id} className="transition hover:bg-dark-bg">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-100">{app.seekerId?.name || '—'}</p>
                      <p className="text-xs text-slate-500">{app.seekerId?.email || ''}</p>
                    </td>
                    <td className="px-6 py-4"><ScoreRing score={app.matchScore ?? 0} /></td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="truncate text-xs text-slate-400">{app.coverLetter || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      {app.cvUrl ? (
                        <a href={app.cvUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition">
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
                        className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-lime-500/30 focus:ring-offset-1 bg-transparent ${getStatusStyle(app.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="interview">Interview</option>
                        <option value="hired">Hired</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSchedulingApp(app)}
                          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition font-medium"
                        >
                          <Calendar className="h-3.5 w-3.5" /> Schedule
                        </button>
                        <button
                          onClick={() => handleMessage(app)}
                          className="flex items-center gap-1 text-xs text-lime-500 hover:text-lime-400 transition font-medium"
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> Message
                        </button>
                        <button
                          onClick={() => toggleExpand(app._id)}
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition font-medium"
                        >
                          {expandedId === app._id
                            ? <><ChevronUp className="h-4 w-4" /> Hide</>
                            : <><ChevronDown className="h-4 w-4" /> View</>}
                        </button>
                      </div>
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

      {/* Schedule modal */}
      {schedulingApp && (
        <ScheduleModal
          application={schedulingApp}
          onClose={() => setSchedulingApp(null)}
          onScheduled={handleScheduled}
        />
      )}

    </EmployerLayout>
  );
};

export default Applicants;