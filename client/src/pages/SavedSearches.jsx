import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Bell, Search, Trash2 } from 'lucide-react';
import SeekerLayout from '../components/SeekerLayout';
import { useAuth } from '../hooks/useAuth';
import { API_URL as API } from '../config';

const SavedSearches = () => {
  const { user } = useAuth();
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user?.token) return undefined;
    let cancelled = false;
    const fetchSearches = async () => {
      try {
        const response = await axios.get(`${API}/saved-searches`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (!cancelled) setSearches(response.data);
      } catch (requestError) {
        console.error('Failed to load saved searches', requestError);
        if (!cancelled) setError('Could not load your saved searches.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSearches();
    return () => { cancelled = true; };
  }, [reloadKey, user?.token]);

  const retryLoading = () => {
    setError('');
    setLoading(true);
    setReloadKey(previous => previous + 1);
  };

  const deleteSearch = async (id) => {
    try {
      await axios.delete(`${API}/saved-searches/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setSearches(previous => previous.filter(search => search._id !== id));
    } catch (requestError) {
      console.error(`Failed to delete saved search ${id}`, requestError);
      setError('Could not delete this saved search. Please try again.');
    }
  };

  return (
    <SeekerLayout>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Bell className="h-6 w-6 text-lime-accent" />
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Job Alerts</h1>
            <p className="text-sm text-slate-400">Saved searches send an SMS when a new matching job is posted.</p>
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <span>{error}</span>
            <button type="button" onClick={retryLoading} className="font-medium underline underline-offset-2">Retry</button>
          </div>
        )}

        {loading ? (
          <p className="py-12 text-center text-sm text-slate-400">Loading job alerts...</p>
        ) : searches.length === 0 ? (
          <div className="rounded-xl border border-dark-border bg-dark-card px-6 py-12 text-center">
            <Search className="mx-auto mb-3 h-9 w-9 text-slate-600" />
            <h2 className="font-medium text-slate-100">No saved searches</h2>
            <p className="mt-1 text-sm text-slate-400">Set up a search on Find Jobs and save it to get alerts.</p>
            <Link to="/jobs" className="mt-4 inline-block rounded-lg bg-lime-accent px-5 py-2 text-sm font-medium text-black transition hover:bg-lime-accent-hover">
              Find jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {searches.map(search => {
              const criteria = [
                search.search,
                ...search.categories,
                ...search.locations,
                search.salaryMinimum != null && `Min $${Number(search.salaryMinimum).toLocaleString()}`,
                search.salaryMaximum != null && `Max $${Number(search.salaryMaximum).toLocaleString()}`,
              ].filter(Boolean);
              return (
                <article key={search._id} className="flex items-start justify-between gap-4 rounded-xl border border-dark-border bg-dark-card p-5">
                  <div className="min-w-0">
                    <h2 className="font-semibold text-slate-100">{search.name}</h2>
                    <p className="mt-1 text-sm text-slate-400">{criteria.join(' · ')}</p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Delete ${search.name}`}
                    onClick={() => deleteSearch(search._id)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </SeekerLayout>
  );
};

export default SavedSearches;
