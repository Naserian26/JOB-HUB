import { Link } from 'react-router-dom';
import { Bookmark, Briefcase, DollarSign, MapPin } from 'lucide-react';

const JobCard = ({ job, matchScore, isSaved = false, onToggleSave, saving = false }) => (
  <div className="flex items-center gap-3 rounded-xl border border-dark-border bg-dark-card p-4 transition hover:border-lime-accent hover:shadow-dark-md sm:gap-4 sm:p-5">
    <Link to={`/jobs/${job._id}`} className="flex min-w-0 flex-1 items-center gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-lime-500/30 bg-lime-500/15 text-sm font-bold text-lime-200">
        {job.employerId?.name?.[0] || '?'}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="mb-1 truncate text-sm font-semibold text-slate-100">{job.title}</h2>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
          <span>{job.employerId?.name}</span>
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-slate-500" />{job.location}</span>
          {(job.salaryMin || job.salaryMax) && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-slate-500" />
              {job.salaryMin ? Number(job.salaryMin).toLocaleString() : '0'}
              {' – '}
              {job.salaryMax ? Number(job.salaryMax).toLocaleString() : 'Not specified'}
            </span>
          )}
          <span className="flex items-center gap-1"><Briefcase className="h-3 w-3 text-slate-500" />{job.category}</span>
        </div>
      </div>
    </Link>

    <div className="flex shrink-0 flex-col items-end gap-2">
      {onToggleSave && (
        <button
          type="button"
          aria-label={isSaved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`}
          aria-pressed={isSaved}
          disabled={saving}
          onClick={() => onToggleSave(job)}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-dark-sidebar hover:text-lime-accent disabled:cursor-wait disabled:opacity-50"
        >
          <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current text-lime-accent' : ''}`} />
        </button>
      )}
      {matchScore !== undefined ? (
        <span className={`text-xs font-bold ${
          matchScore >= 80 ? 'text-lime-300' :
          matchScore >= 50 ? 'text-amber-400' : 'text-slate-500'
        }`}>{matchScore}% match</span>
      ) : (
        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-slate-200">
          {job.type || 'Full Time'}
        </span>
      )}
      <span className="text-xs text-slate-500">
        {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : ''}
      </span>
    </div>
  </div>
);

export default JobCard;
