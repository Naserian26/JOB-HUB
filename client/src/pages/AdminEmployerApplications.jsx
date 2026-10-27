import { useEffect, useState } from 'react';
import axios from 'axios';
import { Check, ExternalLink, LogOut, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { API_URL as API } from '../config';

const AdminEmployerApplications = () => {
  const { user, logout } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewingId, setReviewingId] = useState('');
  const [reviewNotes, setReviewNotes] = useState({});
  const [reloadKey, setReloadKey] = useState(0);
  const token = user?.token;

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    const fetchApplications = async () => {
      try {
        const response = await axios.get(`${API}/admin/employer-applications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) setApplications(response.data);
      } catch (requestError) {
        console.error('Failed to load employer applications', requestError);
        if (!cancelled) setError(requestError.response?.data?.message || 'Could not load applications.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchApplications();
    return () => { cancelled = true; };
  }, [reloadKey, token]);

  const retryLoading = () => {
    setLoading(true);
    setError('');
    setReloadKey(previous => previous + 1);
  };

  const reviewApplication = async (application, decision) => {
    setReviewingId(application._id);
    setError('');
    try {
      await axios.patch(`${API}/admin/employer-applications/${application._id}`, {
        decision,
        reviewNote: decision === 'rejected' ? reviewNotes[application._id] || '' : '',
      }, { headers: { Authorization: `Bearer ${user.token}` } });
      setApplications(previous => previous.filter(item => item._id !== application._id));
      setReviewNotes(previous => {
        const next = { ...previous };
        delete next[application._id];
        return next;
      });
    } catch (requestError) {
      console.error(`Failed to ${decision} employer application`, requestError);
      setError(requestError.response?.data?.message || 'Could not review this application.');
    } finally {
      setReviewingId('');
    }
  };

  return (
    <main className="min-h-screen bg-dark-bg px-4 py-8 text-dark-primary sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-500/10 text-lime-500">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Employer applications</h1>
              <p className="text-sm text-dark-secondary">Review company details before granting employer access.</p>
            </div>
          </div>
          <button type="button" onClick={logout} className="inline-flex items-center gap-2 rounded-lg border border-dark-border px-4 py-2 text-sm text-dark-secondary transition hover:text-dark-primary">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </header>

        {error && (
          <div role="alert" className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <span>{error}</span>
            <button type="button" onClick={retryLoading} className="font-medium underline underline-offset-2">Retry</button>
          </div>
        )}

        {loading ? (
          <p className="py-16 text-center text-sm text-dark-secondary">Loading applications...</p>
        ) : applications.length === 0 ? (
          <div className="rounded-2xl border border-dark-border bg-dark-card px-6 py-16 text-center">
            <Check className="mx-auto mb-3 h-9 w-9 text-lime-500" />
            <h2 className="font-semibold">You’re all caught up</h2>
            <p className="mt-1 text-sm text-dark-secondary">There are no employer applications waiting for review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(application => (
              <article key={application._id} className="rounded-2xl border border-dark-border bg-dark-card p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">{application.companyName}</h2>
                    <p className="mt-1 text-sm text-dark-secondary">Applicant: {application.name} · {application.email}</p>
                    <a
                      href={application.companyWebsite}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-sm text-lime-500 hover:text-lime-400"
                    >
                      {application.companyWebsite} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <p className="mt-2 text-xs text-dark-secondary/70">
                      Submitted {new Date(application.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-3 border-t border-dark-border pt-4 sm:flex-row sm:items-end sm:justify-between">
                  <label className="flex-1 text-xs font-medium text-dark-secondary">
                    Review note (optional, for rejection)
                    <input
                      type="text"
                      value={reviewNotes[application._id] || ''}
                      maxLength={500}
                      onChange={event => setReviewNotes(previous => ({
                        ...previous,
                        [application._id]: event.target.value,
                      }))}
                      className="mt-1 block w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-dark-primary outline-none focus:border-lime-500/50"
                      placeholder="Reason or guidance for the applicant"
                    />
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={reviewingId === application._id}
                      onClick={() => reviewApplication(application, 'rejected')}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" /> Reject
                    </button>
                    <button
                      type="button"
                      disabled={reviewingId === application._id}
                      onClick={() => reviewApplication(application, 'approved')}
                      className="inline-flex items-center gap-2 rounded-lg bg-lime-500 px-4 py-2 text-sm font-semibold text-dark-bg transition hover:bg-lime-600 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" /> Approve
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default AdminEmployerApplications;
