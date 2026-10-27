import { Link } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import SeekerLayout from '../components/SeekerLayout';
import JobCard from '../components/JobCard';
import { useAuth } from '../hooks/useAuth';
import useSavedJobs from '../hooks/useSavedJobs';

const SavedJobs = () => {
  const { user } = useAuth();
  const { savedJobs, loading, error, updatingJobIds, toggleSavedJob, retry } = useSavedJobs(user?.token);

  return (
    <SeekerLayout>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Bookmark className="h-6 w-6 text-lime-accent" />
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Saved Jobs</h1>
            <p className="text-sm text-slate-400">Keep interesting opportunities in one place.</p>
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <span>{error}</span>
            <button type="button" onClick={retry} className="font-medium underline underline-offset-2">Retry</button>
          </div>
        )}

        {loading ? (
          <p className="py-12 text-center text-sm text-slate-400">Loading saved jobs...</p>
        ) : error && savedJobs.length === 0 ? null : savedJobs.length === 0 ? (
          <div className="rounded-xl border border-dark-border bg-dark-card px-6 py-12 text-center">
            <Bookmark className="mx-auto mb-3 h-9 w-9 text-slate-600" />
            <h2 className="font-medium text-slate-100">No saved jobs yet</h2>
            <p className="mt-1 text-sm text-slate-400">Bookmark a job to keep it here for later.</p>
            <Link to="/jobs" className="mt-4 inline-block rounded-lg bg-lime-accent px-5 py-2 text-sm font-medium text-black transition hover:bg-lime-accent-hover">
              Find jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {savedJobs.map(job => (
              <JobCard
                key={job._id}
                job={job}
                isSaved
                saving={updatingJobIds.has(String(job._id))}
                onToggleSave={toggleSavedJob}
              />
            ))}
          </div>
        )}
      </div>
    </SeekerLayout>
  );
};

export default SavedJobs;
