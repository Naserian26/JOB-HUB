import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Users, Download, MessageSquare, MapPin } from 'lucide-react';
import EmployerLayout from '../components/EmployerLayout';

const API = 'http://localhost:5000/api';

const BG_HEADER = '#1c1917';
const BG_ROW    = '#292524';
const BG_HOVER  = '#3a3633';
const BG_FILTER = '#1c1917';

const GRID_COLS = 'minmax(0,1.2fr) minmax(0,1.2fr) 72px minmax(0,1.4fr) 64px 110px 80px';

const getStatusStyle = (status) => ({
  pending:   'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  interview: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  hired:     'bg-green-500/20 text-green-400 border border-green-500/30',
  rejected:  'bg-red-500/20 text-red-400 border border-red-500/30',
}[status] ?? 'border border-[#44403c] text-white');

const getScoreColor = (score) =>
  score >= 70 ? '#86efac' : score >= 40 ? '#fb923c' : '#fca5a5';

/* ── Reusable data row (needs handlers passed in) ── */
const DataRow = ({ app, onStatus, onMessage }) => {
  const [hovered, setHovered] = useState(false);
  const bg = hovered ? BG_HOVER : BG_ROW;
  const score = app.matchScore ?? 0;

  return (
    <div
      className="grid items-center border-b border-[#44403c] transition-colors"
      style={{ gridTemplateColumns: GRID_COLS, backgroundColor: bg }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Candidate */}
      <div className="px-4 py-3.5 min-w-0">
        <p className="truncate text-sm font-semibold" style={{ color: 'white' }}>{app.seekerId?.name || '—'}</p>
        <p className="truncate text-xs mt-0.5" style={{ color: '#a8a29e' }}>{app.seekerId?.email || ''}</p>
      </div>

      {/* Job */}
      <div className="px-4 py-3.5 min-w-0">
        <p className="truncate text-sm font-medium" style={{ color: 'white' }}>{app.jobId?.title || '—'}</p>
        <div className="flex items-center gap-1 mt-0.5" style={{ color: '#a8a29e', fontSize: '0.75rem' }}>
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{app.jobId?.location || '—'}</span>
        </div>
      </div>

      {/* Match */}
      <div className="px-2 py-3.5 text-center">
        <span className="text-sm font-bold" style={{ color: getScoreColor(score) }}>{score}%</span>
      </div>

      {/* Cover Letter */}
      <div className="px-4 py-3.5 min-w-0">
        <p className="truncate text-xs italic" style={{ color: '#a8a29e' }}>{app.coverLetter || '—'}</p>
      </div>

      {/* CV */}
      <div className="px-2 py-3.5 text-center">
        {app.cvUrl ? (
          <a href={app.cvUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex transition" style={{ color: '#f97316' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fb923c'}
            onMouseLeave={e => e.currentTarget.style.color = '#f97316'}
          >
            <Download className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span style={{ color: '#57534e', fontSize: '0.75rem' }}>—</span>
        )}
      </div>

      {/* Status */}
      <div className="px-2 py-3.5 text-center">
        <select
          value={app.status}
          onChange={(e) => onStatus(app._id, e.target.value)}
          className={`cursor-pointer rounded-full px-2 py-1 text-[10px] font-bold uppercase w-full focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:ring-offset-1 focus:ring-offset-[#1c1917] ${getStatusStyle(app.status)}`}
        >
          <option value="pending"   style={{ backgroundColor: '#1c1917', color: 'white' }}>Pending</option>
          <option value="interview" style={{ backgroundColor: '#1c1917', color: 'white' }}>Interview</option>
          <option value="hired"     style={{ backgroundColor: '#1c1917', color: 'white' }}>Hired</option>
          <option value="rejected"  style={{ backgroundColor: '#1c1917', color: 'white' }}>Rejected</option>
        </select>
      </div>

      {/* Actions */}
      <div className="px-2 py-3.5 text-right pr-3">
        <button
          onClick={() => onMessage(app)}
          className="inline-flex items-center gap-1 transition"
          style={{ color: '#f97316', fontSize: '0.75rem', fontWeight: 500 }}
          onMouseEnter={e => e.currentTarget.style.color = '#fb923c'}
          onMouseLeave={e => e.currentTarget.style.color = '#f97316'}
        >
          <MessageSquare className="h-3.5 w-3.5" /> Msg
        </button>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════ */

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

  const filtered = filter === 'all'
    ? applications
    : applications.filter(app => app.status === filter);

  const emptyState = (
    <div className="flex flex-col items-center justify-center p-16 text-center">
      <Users className="mb-3 h-12 w-12" style={{ color: '#78716c' }} />
      <p className="font-medium" style={{ color: 'white' }}>No applications found</p>
      <p className="mt-1 text-sm" style={{ color: '#a8a29e' }}>
        {filter === 'all'
          ? 'Applications will appear here once people apply.'
          : `No ${filter} applications yet.`}
      </p>
    </div>
  );

  const loadingState = (
    <div className="p-12 text-center">
      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-[#44403c] border-t-[#f97316]" />
      <p className="text-sm" style={{ color: 'white' }}>Loading applications...</p>
    </div>
  );

  return (
    <EmployerLayout>
      {/* ── Header ── */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'white' }}>Applications</h1>
          <p className="text-sm mt-0.5" style={{ color: '#a8a29e' }}>
            {applications.length} total candidate{applications.length !== 1 ? 's' : ''} across all jobs
          </p>
        </div>

        <div
          className="flex items-center gap-1 rounded-lg p-1 text-sm self-start md:self-auto border border-[#44403c]"
          style={{ backgroundColor: BG_FILTER }}
        >
          {['all', 'pending', 'interview', 'hired', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-1.5 rounded-md font-medium capitalize transition-all whitespace-nowrap"
              style={{
                backgroundColor: filter === f ? '#f97316' : 'transparent',
                color: filter === f ? 'black' : '#a8a29e',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          DESKTOP — CSS Grid · vertical scroll only
         ═══════════════════════════════════════════════ */}
      <div
        className="hidden lg:block max-h-[70vh] overflow-y-auto rounded-xl border border-[#44403c]"
        style={{ backgroundColor: BG_ROW }}
      >
        {loading ? loadingState : filtered.length === 0 ? emptyState : (
          <>
            {/* Sticky header */}
            <div
              className="sticky top-0 z-10 grid items-center border-b border-[#44403c] text-xs font-semibold uppercase tracking-wider"
              style={{ gridTemplateColumns: GRID_COLS, backgroundColor: BG_HEADER, color: 'white' }}
            >
              <div className="px-4 py-3">Candidate</div>
              <div className="px-4 py-3">Job</div>
              <div className="px-2 py-3 text-center">Match</div>
              <div className="px-4 py-3">Cover Letter</div>
              <div className="px-2 py-3 text-center">CV</div>
              <div className="px-2 py-3 text-center">Status</div>
              <div className="px-2 py-3 text-right pr-3">Actions</div>
            </div>

            {/* Rows */}
            {filtered.map(app => (
              <DataRow
                key={app._id}
                app={app}
                onStatus={handleStatusChange}
                onMessage={handleMessage}
              />
            ))}
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          MOBILE/TABLET — Card layout
         ═══════════════════════════════════════════════ */}
      <div className="lg:hidden space-y-3 max-h-[70vh] overflow-y-auto pr-1">
        {loading ? loadingState : filtered.length === 0 ? emptyState : (
          filtered.map(app => (
            <div
              key={app._id}
              className="rounded-xl p-4 space-y-3"
              style={{ backgroundColor: BG_ROW, border: '1px solid #44403c' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm" style={{ color: 'white' }}>{app.seekerId?.name || '—'}</p>
                  <p className="text-xs" style={{ color: '#a8a29e' }}>{app.seekerId?.email || ''}</p>
                </div>
                <span className="shrink-0 text-sm font-bold" style={{ color: getScoreColor(app.matchScore ?? 0) }}>
                  {app.matchScore ?? 0}%
                </span>
              </div>

              <div>
                <p className="text-sm font-medium" style={{ color: 'white' }}>{app.jobId?.title || '—'}</p>
                <div className="flex items-center gap-1 text-xs" style={{ color: '#a8a29e' }}>
                  <MapPin className="h-3 w-3" /> {app.jobId?.location || '—'}
                </div>
              </div>

              {app.coverLetter && (
                <p className="text-xs italic line-clamp-2" style={{ color: '#a8a29e' }}>{app.coverLetter}</p>
              )}

              <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #44403c' }}>
                <select
                  value={app.status}
                  onChange={(e) => handleStatusChange(app._id, e.target.value)}
                  className={`cursor-pointer rounded-full px-3 py-1 text-[10px] font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#f97316] ${getStatusStyle(app.status)}`}
                >
                  <option value="pending"   style={{ backgroundColor: '#1c1917', color: 'white' }}>Pending</option>
                  <option value="interview" style={{ backgroundColor: '#1c1917', color: 'white' }}>Interview</option>
                  <option value="hired"     style={{ backgroundColor: '#1c1917', color: 'white' }}>Hired</option>
                  <option value="rejected"  style={{ backgroundColor: '#1c1917', color: 'white' }}>Rejected</option>
                </select>

                <div className="flex items-center gap-3">
                  {app.cvUrl && (
                    <a href={app.cvUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium" style={{ color: '#f97316' }}
                    >
                      <Download className="h-3.5 w-3.5" /> CV
                    </a>
                  )}
                  <button
                    onClick={() => handleMessage(app)}
                    className="flex items-center gap-1 text-xs font-medium"
                    style={{ color: '#f97316' }}
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Message
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </EmployerLayout>
  );
};

export default EmployerApplications;