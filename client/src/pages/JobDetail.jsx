import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { MapPin, DollarSign, ArrowLeft, Send, FileText, CheckCircle, Sparkles, Loader2 } from 'lucide-react';
import 'react-quill-new/dist/quill.snow.css';

const API = 'http://localhost:5000/api';

const MatchPanel = ({ match }) => {
  if (!match) return null;

  const { match_score, explanation, breakdown } = match;

  const color =
    match_score >= 80 ? 'green' :
    match_score >= 50 ? 'amber' : 'red';

  const colorClasses = {
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', bar: 'bg-green-500', score: 'text-green-600' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', bar: 'bg-amber-400', score: 'text-amber-500' },
    red:   { bg: 'bg-red-50',   border: 'border-red-200',   text: 'text-red-700',   bar: 'bg-red-400',   score: 'text-red-500'   },
  }[color];

  const bars = [
    { label: 'Skills',     value: breakdown?.skills ?? 0 },
    { label: 'Semantic',   value: breakdown?.semantic ?? 0 },
    { label: 'Experience', value: breakdown?.experience ?? 0 },
    { label: 'Location',   value: breakdown?.location ?? 0 },
    { label: 'Salary',     value: breakdown?.salary ?? 0 },
  ];

  return (
    <div className={`mt-6 rounded-xl border ${colorClasses.border} ${colorClasses.bg} p-5`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className={`h-4 w-4 ${colorClasses.text}`} />
          <p className={`text-sm font-semibold ${colorClasses.text}`}>Your AI Match Score</p>
        </div>
        <span className={`text-2xl font-bold ${colorClasses.score}`}>{match_score}%</span>
      </div>

      {/* Breakdown bars */}
      <div className="space-y-1.5 mb-3">
        {bars.map(({ label, value }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-20 text-right text-xs text-gray-500">{label}</span>
            <div className="flex-1 rounded-full bg-white/60 h-1.5 border border-white">
              <div
                className={`h-1.5 rounded-full ${colorClasses.bar} transition-all`}
                style={{ width: `${value}%` }}
              />
            </div>
            <span className="w-8 text-xs font-semibold text-gray-600">{value}%</span>
          </div>
        ))}
      </div>

      {explanation && (
        <p className={`text-xs ${colorClasses.text} border-t border-white/50 pt-2 mt-2`}>{explanation}</p>
      )}
    </div>
  );
};

const JobDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [jobError, setJobError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ coverLetter: '', expectedSalary: '', availability: '' });
  const [cvUrl, setCvUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [match, setMatch] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);

  const headers = { Authorization: `Bearer ${user?.token}` };

  // Load job
  useEffect(() => {
    const fetchJob = async () => {
      try {
        setJobLoading(true);
        const res = await axios.get(`${API}/jobs/${id}`);
        setJob(res.data);
      } catch {
        setJobError('Job not found or has been removed.');
      } finally {
        setJobLoading(false);
      }
    };
    if (id) fetchJob();
  }, [id]);

  // Load seeker profile + calculate match preview
  useEffect(() => {
    if (!user?.token || user?.role !== 'seeker' || !job) return;
    const fetchProfileAndMatch = async () => {
      try {
        const res = await axios.get(`${API}/profiles/me`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const profile = res.data;
        setCvUrl(profile?.cvUrl || null);

        // Calculate match preview
        setMatchLoading(true);
        const matchRes = await axios.post(
          `${API}/applications/match-preview`,
          { jobId: id },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        setMatch(matchRes.data);
      } catch {
        // Match preview is non-critical — fail silently
      } finally {
        setMatchLoading(false);
      }
    };
    fetchProfileAndMatch();
  }, [user?.token, user?.role, job, id]);

  const handleOpenModal = () => {
    setSubmitError(null);
    setSuccess(false);
    setFormData({ coverLetter: '', expectedSalary: '', availability: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      await axios.post(
        `${API}/applications/apply/${id}`,
        { ...formData, cvUrl },
        { headers }
      );
      setSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        navigate('/seeker/dashboard');
      }, 1500);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (jobLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (jobError || !job) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-gray-500">{jobError}</p>
        <Link to="/jobs" className="text-indigo-600 hover:underline">← Back to Listings</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

        <Link to="/jobs" className="mb-6 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800">
          <ArrowLeft className="h-4 w-4" /> Back to Listings
        </Link>

        <div className="rounded-xl bg-white p-8 shadow-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
              <p className="mt-2 text-xl text-gray-700">{job.employerId?.name || job.company}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {job.location}
                  </span>
                )}
                {job.salary && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" /> {job.salary}
                  </span>
                )}
              </div>
            </div>

            {user?.role === 'seeker' && (
              <button
                onClick={handleOpenModal}
                className="shrink-0 rounded-lg bg-indigo-600 px-6 py-3 font-bold text-white shadow-lg transition hover:bg-indigo-700"
              >
                Apply Now
              </button>
            )}
          </div>

          {/* Match panel — seeker only */}
          {user?.role === 'seeker' && (
            matchLoading ? (
              <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Calculating your match score...
              </div>
            ) : (
              <MatchPanel match={match} />
            )
          )}

          <hr className="my-8" />

          {job.description ? (
            <div
              className="ql-editor prose max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          ) : (
            <p className="text-gray-500">No description provided.</p>
          )}

          {job.requirements?.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-3 text-lg font-bold text-gray-800">Requirements</h3>
              <div className="flex flex-wrap gap-2">
                {job.requirements.map(req => (
                  <span key={req} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                    {req}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 transition hover:text-gray-600"
            >
              ✕
            </button>

            <h2 className="mb-1 text-2xl font-bold text-gray-900">Apply for {job.title}</h2>
            <p className="mb-5 text-sm text-gray-500">{job.employerId?.name || job.company}</p>

            {/* CV status */}
            <div className={`mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
              cvUrl
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <FileText className="h-4 w-4 shrink-0" />
              {cvUrl
                ? <span>CV attached from your profile</span>
                : <span>No CV on your profile — <Link to="/seeker/profile" className="underline font-medium">upload one</Link> to strengthen your application.</span>
              }
            </div>

            {/* Match score summary in modal */}
            {match && (
              <div className="mb-4 flex items-center justify-between rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-2">
                <span className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> Your match score
                </span>
                <span className={`text-sm font-bold ${
                  match.match_score >= 80 ? 'text-green-600' :
                  match.match_score >= 50 ? 'text-amber-500' : 'text-red-500'
                }`}>{match.match_score}%</span>
              </div>
            )}

            {success ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <p className="text-lg font-semibold text-gray-800">Application submitted!</p>
                <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {submitError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {submitError}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Cover Letter</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Why are you a good fit?"
                    value={formData.coverLetter}
                    onChange={e => setFormData({ ...formData, coverLetter: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Expected Salary (USD)</label>
                  <input
                    type="text"
                    required
                    placeholder="$130,000"
                    value={formData.expectedSalary}
                    onChange={e => setFormData({ ...formData, expectedSalary: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Availability</label>
                  <select
                    required
                    value={formData.availability}
                    onChange={e => setFormData({ ...formData, availability: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">Select availability</option>
                    <option value="immediate">Immediate</option>
                    <option value="2 weeks">2 weeks notice</option>
                    <option value="1 month">1 month notice</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : <><span>Submit Application</span><Send className="h-4 w-4" /></>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail;