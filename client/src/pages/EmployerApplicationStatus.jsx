import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Clock3, RefreshCw, XCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { API_URL as API } from '../config';

const EmployerApplicationStatus = () => {
  const { user, logout, updateUser } = useAuth();
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState('');
  const status = user?.employerApprovalStatus;
  const rejected = status === 'rejected';
  const approved = status === 'approved' || !status;

  const checkStatus = async () => {
    setChecking(true);
    setCheckError('');
    try {
      const response = await axios.get(`${API}/auth/employer-status`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      updateUser(response.data);
    } catch (error) {
      console.error('Failed to refresh employer application status', error);
      setCheckError(error.response?.data?.message || 'Could not refresh your application status.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-dark-bg px-4 py-12">
      <section className="w-full max-w-xl rounded-2xl border border-dark-border bg-dark-card p-8 text-center shadow-dark-xl sm:p-10">
        <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${rejected ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-300'}`}>
          {rejected ? <XCircle className="h-7 w-7" /> : <Clock3 className="h-7 w-7" />}
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime-500">Employer account</p>
        <h1 className="mt-2 text-2xl font-bold text-dark-primary">
          {approved ? 'Your employer account is approved' : rejected ? 'Application needs attention' : 'Your application is under review'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-dark-secondary">
          {approved
            ? 'Your company has been approved. You can now access your employer dashboard and post jobs.'
            : rejected
            ? 'Your employer application was not approved. Please contact JobHub support if you believe this decision was made in error.'
            : `Thanks for registering${user?.companyName ? ` ${user.companyName}` : ''}. Our team will review your company details. Employer tools will be available once your account is approved.`}
        </p>
        {rejected && user?.employerReviewNote && (
          <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-left text-sm text-red-200">
            Review note: {user.employerReviewNote}
          </p>
        )}
        <div className="mt-6 rounded-xl border border-dark-border bg-dark-bg/70 p-4 text-left">
          <p className="text-xs font-medium uppercase tracking-wide text-dark-secondary/70">Submitted company</p>
          <p className="mt-1 font-semibold text-dark-primary">{user?.companyName || 'Company name unavailable'}</p>
        </div>
        {checkError && <p role="alert" className="mt-4 text-sm text-red-300">{checkError}</p>}
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          {approved ? (
            <Link to="/employer/dashboard" className="rounded-lg bg-lime-500 px-5 py-2.5 text-sm font-semibold text-dark-bg transition hover:bg-lime-600">
              Go to employer dashboard
            </Link>
          ) : (
            <>
              <button type="button" onClick={checkStatus} disabled={checking} className="inline-flex items-center justify-center gap-2 rounded-lg bg-lime-500 px-5 py-2.5 text-sm font-semibold text-dark-bg transition hover:bg-lime-600 disabled:opacity-60">
                <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
                {checking ? 'Checking...' : 'Check application status'}
              </button>
              <Link to="/" className="rounded-lg border border-dark-border px-5 py-2.5 text-sm font-medium text-dark-primary transition hover:border-lime-500/50">
                Back to JobHub
              </Link>
              <button type="button" onClick={logout} className="rounded-lg border border-dark-border px-5 py-2.5 text-sm font-medium text-dark-primary transition hover:border-lime-500/50">
                Sign out
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
};

export default EmployerApplicationStatus;
