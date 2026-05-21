import { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import {
  MapPin, DollarSign, ArrowLeft, Send, FileText,
  CheckCircle, Sparkles, Loader2, Clock, XCircle, UserCheck, Briefcase,
} from 'lucide-react';
import 'react-quill-new/dist/quill.snow.css';

const API = 'http://localhost:5000/api';

// ─── Match Panel ────────────────────────────────────────────────────────────

const SCORE_THEME = (score) =>
  score >= 80
    ? { ring: 'ring-lime-300/30', bg: 'bg-lime-500/10', text: 'text-lime-300', bar: 'bg-lime-400', score: 'text-lime-300' }
    : score >= 50
    ? { ring: 'ring-amber-200/30',   bg: 'bg-amber-500/10',   text: 'text-amber-300',   bar: 'bg-amber-400',   score: 'text-amber-300'  }
    : { ring: 'ring-red-200/30',     bg: 'bg-red-500/10',     text: 'text-red-300',     bar: 'bg-red-400',     score: 'text-red-300'    };

const MatchBar = ({ label, value, barClass }) => (
  <div className="flex items-center gap-3">
    <span className="w-20 shrink-0 text-right text-xs text-slate-500">{label}</span>
    <div className="relative flex-1 h-1.5 rounded-full bg-slate-900 overflow-hidden">
      <div
        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${barClass}`}
        style={{ width: `${value}%` }}
      />
    </div>
    <span className="w-7 text-right text-xs font-semibold text-slate-400">{value}%</span>
  </div>
);

const MatchPanel = ({ match }) => {
  if (!match) return null;
  const { match_score, explanation, breakdown = {} } = match;
  const t = SCORE_THEME(match_score);

  const bars = [
    { label: 'Skills',      value: breakdown.skills     ?? 0 },
    { label: 'Semantic',    value: breakdown.semantic   ?? 0 },
    { label: 'Experience',  value: breakdown.experience ?? 0 },
    { label: 'Location',    value: breakdown.location   ?? 0 },
    { label: 'Salary',      value: breakdown.salary     ?? 0 },
  ];

  return (
    <div className={`rounded-2xl ring-1 ${t.ring} ${t.bg} p-5 space-y-3`}>
      <div className="flex items-center justify-between">
        <span className={`flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase ${t.text}`}>
          <Sparkles className="h-3.5 w-3.5" />
          AI Match Score
        </span>
        <span className={`text-3xl font-bold tabular-nums ${t.score}`}>{match_score}%</span>
      </div>

      <div className="space-y-1.5">
        {bars.map(({ label, value }) => (
          <MatchBar key={label} label={label} value={value} barClass={t.bar} />
        ))}
      </div>

      {explanation && (
        <p className={`text-xs leading-relaxed border-t border-black/5 pt-3 ${t.text}`}>
          {explanation}
        </p>
      )}
    </div>
  );
};

// ─── Application Status Badge ────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:   { Icon: Clock,      label: 'Application Pending',    style: 'bg-slate-900 ring-amber-300/30 text-amber-200',  dot: 'bg-amber-400'  },
  reviewed:  { Icon: UserCheck,  label: 'Under Review',           style: 'bg-slate-900 ring-blue-300/30 text-blue-200',     dot: 'bg-blue-400'   },
  interview: { Icon: UserCheck,  label: 'Interview Scheduled',    style: 'bg-slate-900 ring-indigo-300/30 text-indigo-200', dot: 'bg-indigo-500' },
  hired:     { Icon: CheckCircle,label: 'Offer Extended 🎉',      style: 'bg-slate-900 ring-emerald-300/30 text-emerald-200', dot: 'bg-emerald-500' },
  rejected:  { Icon: XCircle,    label: 'Not Selected',           style: 'bg-slate-900 ring-slate-700 text-slate-400',     dot: 'bg-slate-500'   },
};

const ApplicationStatusBadge = ({ status, appliedAt }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const { Icon, label, style, dot } = cfg;
  const date = appliedAt
    ? new Date(appliedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <div className={`flex items-center gap-2 rounded-xl ring-1 px-4 py-2.5 ${style}`}>
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <Icon className="h-4 w-4" />
        <span className="text-sm font-semibold">{label}</span>
      </div>
      {date && <span className="text-xs text-slate-400">Applied {date}</span>}
    </div>
  );
};

// ─── Apply Modal ─────────────────────────────────────────────────────────────

const AVAILABILITY_OPTIONS = [
  { value: 'immediate', label: 'Immediate' },
  { value: '2 weeks',   label: '2 weeks notice' },
  { value: '1 month',   label: '1 month notice' },
];

const ApplyModal = ({ job, cvUrl, match, onClose, onSuccess }) => {
  const { user } = useAuth();
  const headers = useMemo(() => ({ Authorization: `Bearer ${user?.token}` }), [user?.token]);

  const [form, setForm] = useState({ coverLetter: '', expectedSalary: '', availability: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await axios.post(`${API}/applications/apply/${job._id}`, { ...form, cvUrl }, { headers });
      setDone(true);
      setTimeout(onSuccess, 1400);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const scoreColor =
    match?.match_score >= 80 ? 'text-lime-300' :
    match?.match_score >= 50 ? 'text-amber-300' : 'text-red-300';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md rounded-3xl bg-dark-card shadow-2xl p-7 ring-1 ring-dark-border">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-500 hover:text-slate-200 transition-colors text-xl leading-none"
          aria-label="Close modal"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-slate-100 mb-0.5">{job.title}</h2>
        <p className="text-sm text-slate-400 mb-5">{job.employerId?.name ?? job.company}</p>

        {/* CV notice */}
        <div className={`flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-xs mb-4 ring-1 ${
          cvUrl
            ? 'bg-emerald-500/10 ring-emerald-300/30 text-emerald-200'
            : 'bg-amber-500/10 ring-amber-300/30 text-amber-200'
        }`}>
          <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          {cvUrl
            ? 'CV attached from your profile'
            : <span>No CV on your profile — <Link to="/seeker/profile" className="underline font-medium text-lime-accent hover:text-lime-300">upload one</Link> to strengthen your application.</span>
          }
        </div>

        {/* Match pill */}
        {match && (
          <div className="flex items-center justify-between rounded-xl bg-slate-900 ring-1 ring-dark-border px-4 py-2.5 mb-5">
            <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Sparkles className="h-3.5 w-3.5 text-lime-300" /> Your match score
            </span>
            <span className={`text-sm font-bold ${scoreColor}`}>{match.match_score}%</span>
          </div>
        )}

        {done ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <CheckCircle className="h-12 w-12 text-lime-accent" />
            <p className="text-base font-semibold text-slate-100">Application submitted!</p>
            <p className="text-sm text-slate-400">Redirecting to your dashboard…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-500/10 ring-1 ring-red-500/20 px-4 py-3 text-xs text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Cover Letter
              </label>
              <textarea
                required
                rows={4}
                placeholder="Why are you a great fit?"
                value={form.coverLetter}
                onChange={set('coverLetter')}
                className="w-full rounded-xl border border-dark-border bg-slate-950 p-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-slate-700 focus:bg-slate-900 transition resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Expected Salary (USD)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. $130,000"
                value={form.expectedSalary}
                onChange={set('expectedSalary')}
                className="w-full rounded-xl border border-dark-border bg-slate-950 p-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-slate-700 focus:bg-slate-900 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Availability
              </label>
              <select
                required
                value={form.availability}
                onChange={set('availability')}
                className="w-full rounded-xl border border-dark-border bg-slate-950 p-3 text-sm text-slate-100 outline-none focus:border-slate-700 focus:bg-slate-900 transition"
              >
                <option value="" className="bg-dark-card">Select availability</option>
                {AVAILABILITY_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value} className="bg-dark-card">{label}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-lime-accent py-3.5 text-sm font-semibold text-black transition hover:bg-lime-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                : <><span>Submit Application</span><Send className="h-4 w-4" /></>
              }
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ─── Job Detail (main) ───────────────────────────────────────────────────────

const JobDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${user?.token}` }),
    [user?.token]
  );

  const isSeeker = user?.role === 'seeker';

  // Job
  const [job,        setJob]        = useState(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [jobError,   setJobError]   = useState(null);

  // Existing application
  const [existingApp,    setExistingApp]    = useState(null);
  const [appCheckLoading, setAppCheckLoading] = useState(false);

  // Match
  const [match,        setMatch]        = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);

  // CV
  const [cvUrl, setCvUrl] = useState(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);

  // ── Fetch job ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setJobLoading(true);
        const { data } = await axios.get(`${API}/jobs/${id}`);
        setJob(data);
      } catch {
        setJobError('Job not found or has been removed.');
      } finally {
        setJobLoading(false);
      }
    })();
  }, [id]);

  // ── Check existing application ─────────────────────────────────────────────
  useEffect(() => {
    if (!isSeeker || !user?.token || !id) return;
    (async () => {
      try {
        setAppCheckLoading(true);
        const { data } = await axios.get(`${API}/applications/check/${id}`, { headers });
        setExistingApp(data);
      } catch {
        setExistingApp(null);
      } finally {
        setAppCheckLoading(false);
      }
    })();
  }, [id, isSeeker, user?.token, headers]);

  // ── Fetch profile + match preview ──────────────────────────────────────────
  useEffect(() => {
    if (!isSeeker || !user?.token || !job) return;
    (async () => {
      try {
        const { data: profile } = await axios.get(`${API}/profiles/me`, { headers });
        setCvUrl(profile?.cvUrl ?? null);

        setMatchLoading(true);
        const { data: matchData } = await axios.post(
          `${API}/applications/match-preview`,
          { jobId: id },
          { headers }
        );
        setMatch(matchData);
      } catch {
        // non-critical
      } finally {
        setMatchLoading(false);
      }
    })();
  }, [isSeeker, user?.token, job, id, headers]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleApplySuccess = () => {
    setExistingApp({ applied: true, status: 'pending', appliedAt: new Date().toISOString() });
    setModalOpen(false);
    navigate('/seeker/dashboard');
  };

  // ── States ────────────────────────────────────────────────────────────────
  if (jobLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-bg">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (jobError || !job) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-dark-bg gap-4 text-center px-4">
        <p className="text-slate-400">{jobError}</p>
        <Link to="/jobs" className="text-sm text-lime-accent underline underline-offset-2 hover:text-lime-300">
          ← Back to listings
        </Link>
      </div>
    );
  }

  const alreadyApplied = existingApp?.applied === true;

  return (
    <div className="min-h-screen bg-dark-bg py-10">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">

        {/* Back link */}
        <Link
          to="/jobs"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to listings
        </Link>

        {/* Main card */}
        <div className="rounded-3xl bg-dark-card shadow-dark-md ring-1 ring-dark-border p-8 space-y-7">

          {/* Header row */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-100">{job.title}</h1>
              <p className="mt-1.5 text-base text-slate-400">{job.employerId?.name ?? job.company}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {job.location && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-400">
                    <MapPin className="h-3 w-3 text-slate-500" /> {job.location}
                  </span>
                )}
                {job.salary && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-400">
                    <DollarSign className="h-3 w-3 text-slate-500" /> {job.salary}
                  </span>
                )}
                {job.type && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-400">
                    <Briefcase className="h-3 w-3 text-slate-500" /> {job.type}
                  </span>
                )}
              </div>
            </div>

            {/* Seeker CTA */}
            {isSeeker && (
              appCheckLoading ? (
                <div className="shrink-0 flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" /> Checking…
                </div>
              ) : alreadyApplied ? (
                <ApplicationStatusBadge status={existingApp.status} appliedAt={existingApp.appliedAt} />
              ) : (
                <button
                  onClick={() => setModalOpen(true)}
                  className="shrink-0 rounded-2xl bg-lime-accent px-6 py-3 text-sm font-semibold text-black shadow-sm transition hover:bg-lime-accent-hover"
                >
                  Apply now
                </button>
              )
            )}
          </div>

          {/* Match panel */}
          {isSeeker && (
            matchLoading ? (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" /> Calculating your match score…
              </div>
            ) : (
              <MatchPanel match={match} />
            )
          )}

          <hr className="border-dark-border" />

          {/* Description */}
          {job.description ? (
            <div
              className="ql-editor prose prose-sm max-w-none text-slate-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          ) : (
            <p className="text-sm text-slate-400">No description provided.</p>
          )}

          {/* Requirements */}
          {job.requirements?.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Requirements
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.requirements.map((req) => (
                  <span
                    key={req}
                    className="rounded-lg bg-slate-900 ring-1 ring-dark-border px-3 py-1 text-xs text-slate-300"
                  >
                    {req}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Apply modal */}
      {modalOpen && !alreadyApplied && (
        <ApplyModal
          job={job}
          cvUrl={cvUrl}
          match={match}
          onClose={() => setModalOpen(false)}
          onSuccess={handleApplySuccess}
        />
      )}
    </div>
  );
};

export default JobDetail;