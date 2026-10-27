import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, X, Filter, Sparkles, Bell } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import JobCard from '../components/JobCard';
import useSavedJobs from '../hooks/useSavedJobs';

import { API_URL as API } from '../config';

const categories = [
  "Software Development", "Cloud Computing", "Artificial Intelligence",
  "Networking", "Marketing", "Cybersecurity", "Product Management",
  "Sales Engineering", "Technical Writing", "IoT Development",
  "Quality Assurance", "Digital Marketing", "Design",
];

const locations = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu",
  "Garissa", "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho",
  "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale",
  "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera", "Marsabit",
  "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi", "Nakuru", "Nandi",
  "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya",
  "Taita-Taveta", "Tana River", "Tharaka-Nithi", "Trans Nzoia", "Turkana",
  "Uasin Gishu", "Vihiga", "Wajir", "West Pokot", "Remote",
];

const searchableFields = (job) => [
  job.title,
  job.description,
  job.category,
  job.location,
  job.experienceLevel,
  job.employerId?.name,
].filter(Boolean).map(value => value.toLowerCase());

const matchesSearch = (job, search) => {
  const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const fields = searchableFields(job);
  return terms.every(term => fields.some(field => field.includes(term)));
};

const getRelevance = (job, search) => {
  const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const fields = [
    [job.title, 5],
    [job.employerId?.name, 4],
    [job.category, 3],
    [job.description, 2],
    [job.location, 1],
    [job.experienceLevel, 1],
  ];
  return terms.reduce((score, term) => score + fields.reduce((fieldScore, [value, weight]) => (
    value?.toLowerCase().includes(term) ? fieldScore + weight : fieldScore
  ), 0), 0);
};

// ─── Shared Filter Panel ─────────────────────────────────────────────────────
const FilterPanel = ({ selectedCategories, setSelectedCategories, selectedLocations, setSelectedLocations, salaryMinimum, setSalaryMinimum, salaryMaximum, setSalaryMaximum, activeFilters, clearAll, toggle }) => (
  <>
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-medium text-slate-100 text-sm">Filters</h3>
      {activeFilters > 0 && (
        <button onClick={clearAll} className="text-xs text-lime-accent hover:text-lime-300">
          Clear all
        </button>
      )}
    </div>

    <div className="mb-5">
      <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Categories</h4>
      <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
        {categories.map(cat => (
          <label key={cat} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={selectedCategories.includes(cat)}
              onChange={() => toggle(selectedCategories, setSelectedCategories, cat)}
              className="h-3.5 w-3.5 rounded accent-lime-accent"
            />
            <span className={`text-xs ${selectedCategories.includes(cat) ? 'text-lime-accent font-medium' : 'text-slate-400'}`}>
              {cat}
            </span>
          </label>
        ))}
      </div>
    </div>

    <div>
      <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Locations</h4>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
        {locations.map(loc => (
          <label key={loc} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedLocations.includes(loc)}
              onChange={() => toggle(selectedLocations, setSelectedLocations, loc)}
              className="h-3.5 w-3.5 rounded accent-lime-accent"
            />
            <span className={`text-xs ${selectedLocations.includes(loc) ? 'text-lime-accent font-medium' : 'text-slate-400'}`}>
              {loc}
            </span>
          </label>
        ))}
      </div>
    </div>

    <div className="mt-5">
      <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Salary range (USD)</h4>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-slate-400">
          Minimum
          <input
            type="number"
            min="0"
            value={salaryMinimum}
            onChange={event => setSalaryMinimum(event.target.value)}
            placeholder="Any"
            className="mt-1 w-full rounded-md border border-dark-border bg-dark-sidebar px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-lime-accent/50"
          />
        </label>
        <label className="text-xs text-slate-400">
          Maximum
          <input
            type="number"
            min="0"
            value={salaryMaximum}
            onChange={event => setSalaryMaximum(event.target.value)}
            placeholder="Any"
            className="mt-1 w-full rounded-md border border-dark-border bg-dark-sidebar px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-lime-accent/50"
          />
        </label>
      </div>
    </div>
  </>
);

// ─── Main Component ──────────────────────────────────────────────────────────
const JobListings = () => {
  const { user } = useAuth();
  const { savedJobIds, loading: savedJobsLoading, error: savedJobsError, updatingJobIds, toggleSavedJob, retry: retrySavedJobs } = useSavedJobs(
    user?.role === 'seeker' ? user.token : null
  );
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => searchParams.get('company') || searchParams.get('search') || '');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [salaryMinimum, setSalaryMinimum] = useState('');
  const [salaryMaximum, setSalaryMaximum] = useState('');
  const [sortBy, setSortBy] = useState('Most Recent');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [savingSearch, setSavingSearch] = useState(false);
  const [saveSearchMessage, setSaveSearchMessage] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsLoaded, setRecsLoaded] = useState(false);
  
  // SCROLL STATE
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get(`${API}/jobs`);
        setJobs(res.data);
      } catch (err) {
        console.error('Failed to fetch jobs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const loadRecommendations = async () => {
    if (recsLoaded || loading || !user?.token) return;
    setRecsLoading(true);
    try {
      const scored = await Promise.all(
        jobs.slice(0, 15).map(async (job) => {
          try {
            const matchRes = await axios.post(
              `${API}/applications/match-preview`,
              { jobId: job._id },
              { headers: { Authorization: `Bearer ${user.token}` } }
            );
            return { ...job, matchScore: matchRes.data.match_score };
          } catch (err) {
            console.error(`Failed to calculate match for job ${job._id}`, err);
            return null;
          }
        })
      );
      setRecommendations(scored.filter(j => j && j.matchScore >= 40).sort((a, b) => b.matchScore - a.matchScore));
      setRecsLoaded(true);
    } catch (err) {
      console.error('Failed to load recommendations', err);
    } finally {
      setRecsLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'recommended' && !recsLoaded) loadRecommendations();
  };

  const saveCurrentSearch = async () => {
    if (!search.trim() && selectedCategories.length === 0 && selectedLocations.length === 0
      && salaryMinimum === '' && salaryMaximum === '') {
      setSaveSearchMessage('Add a search term or filter before saving an alert.');
      return;
    }

    setSavingSearch(true);
    setSaveSearchMessage('');
    try {
      await axios.post(`${API}/saved-searches`, {
        name: search.trim() || selectedCategories[0] || selectedLocations[0] || 'My salary search',
        search,
        categories: selectedCategories,
        locations: selectedLocations,
        salaryMinimum,
        salaryMaximum,
      }, { headers: { Authorization: `Bearer ${user.token}` } });
      setSaveSearchMessage('Search saved. SMS alerts are managed in Settings.');
    } catch (err) {
      console.error('Failed to save job search', err);
      setSaveSearchMessage(err.response?.data?.message || 'Could not save this search.');
    } finally {
      setSavingSearch(false);
    }
  };

  const toggle = (list, setList, value) =>
    setList(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);

  const clearAll = () => {
    setSelectedCategories([]);
    setSelectedLocations([]);
    setSalaryMinimum('');
    setSalaryMaximum('');
    setSearch('');
  };

  const filteredAndSortedJobs = useMemo(() => {
    let result = jobs.filter(job => {
      const matchesQuery = matchesSearch(job, search);
      const matchesCat = selectedCategories.length === 0 || selectedCategories.includes(job.category);
      const matchesLoc = selectedLocations.length === 0 || selectedLocations.includes(job.location);
      const minimum = salaryMinimum === '' ? null : Number(salaryMinimum);
      const maximum = salaryMaximum === '' ? null : Number(salaryMaximum);
      const matchesMinimum = minimum === null || Number(job.salaryMax) >= minimum;
      const matchesMaximum = maximum === null || Number(job.salaryMin) <= maximum;
      return matchesQuery && matchesCat && matchesLoc && matchesMinimum && matchesMaximum;
    });
    if (sortBy === 'Most Recent') result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sortBy === 'Most Relevant') {
      result.sort((a, b) => getRelevance(b, search) - getRelevance(a, search) || new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'Highest Salary') {
      result.sort((a, b) => Number(b.salaryMax || b.salaryMin || 0) - Number(a.salaryMax || a.salaryMin || 0));
    }
    return result;
  }, [jobs, search, selectedCategories, selectedLocations, salaryMinimum, salaryMaximum, sortBy]);

  const activeFilters = selectedCategories.length + selectedLocations.length
    + Number(salaryMinimum !== '') + Number(salaryMaximum !== '');
  const filteredRecommendations = useMemo(() => {
    const minimum = salaryMinimum === '' ? null : Number(salaryMinimum);
    const maximum = salaryMaximum === '' ? null : Number(salaryMaximum);
    const result = recommendations.filter(job => (
      matchesSearch(job, search)
      && (selectedCategories.length === 0 || selectedCategories.includes(job.category))
      && (selectedLocations.length === 0 || selectedLocations.includes(job.location))
      && (minimum === null || Number(job.salaryMax) >= minimum)
      && (maximum === null || Number(job.salaryMin) <= maximum)
    ));
    if (sortBy === 'Most Recent') result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sortBy === 'Highest Salary') {
      result.sort((a, b) => Number(b.salaryMax || b.salaryMin || 0) - Number(a.salaryMax || a.salaryMin || 0));
    } else {
      result.sort((a, b) => b.matchScore - a.matchScore || getRelevance(b, search) - getRelevance(a, search));
    }
    return result;
  }, [recommendations, search, selectedCategories, selectedLocations, salaryMinimum, salaryMaximum, sortBy]);

  const filterProps = {
    selectedCategories, setSelectedCategories,
    selectedLocations, setSelectedLocations,
    salaryMinimum, setSalaryMinimum,
    salaryMaximum, setSalaryMaximum,
    activeFilters, clearAll, toggle,
  };

  return (
    <div className="bg-dark-bg min-h-screen">

      {/* ── Sticky Header (Fixed Z-Index and Spacing) ───────────────────── */}
      <div className={`
        sticky top-0 z-40 transition-all duration-300 border-b
        ${isScrolled 
          ? 'bg-dark-bg/95 backdrop-blur-md border-white/5 shadow-lg py-3' 
          : 'bg-dark-card border-dark-border py-6'
        }
      `}>
        <div className={`max-w-7xl mx-auto px-4 transition-all duration-300 ${isScrolled ? 'space-y-2' : 'space-y-4'}`}>

          {/* Title row */}
          <div className={`flex items-center justify-between transition-all duration-300 overflow-hidden ${isScrolled ? 'h-0 opacity-0 m-0' : 'h-auto opacity-100 mb-2'}`}>
            <h1 className="text-xl md:text-2xl font-bold text-slate-100">Latest Jobs</h1>
            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowMobileFilters(v => !v)}
              className="md:hidden flex items-center gap-2 text-sm font-medium text-lime-accent"
            >
              <Filter className="w-4 h-4" />
              Filters {activeFilters > 0 && `(${activeFilters})`}
            </button>
          </div>

          {/* Search + sort */}
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2 flex-1 max-w-lg bg-dark-sidebar border border-dark-border rounded-lg px-4 py-2 focus-within:border-lime-accent/50 transition">
              <Search className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder="Job title, skill, or company..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent flex-1 text-sm outline-none text-slate-100 placeholder:text-slate-500"
              />
              {search && (
                <button onClick={() => setSearch('')}>
                  <X className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                </button>
              )}
            </div>
            
            {/* FIXED DROPDOWN STYLES: Explicit text color and background for visibility */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="border border-dark-border rounded-lg text-sm text-slate-100 bg-slate-800 outline-none cursor-pointer"
            >
              <option value="Most Recent" className="text-slate-100 bg-slate-800">Most Recent</option>
              <option value="Most Relevant" className="text-slate-100 bg-slate-800">Most Relevant</option>
              <option value="Highest Salary" className="text-slate-100 bg-slate-800">Highest Salary</option>
            </select>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            <button
              onClick={() => handleTabChange('all')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'all'
                  ? 'bg-lime-accent text-black'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-dark-sidebar'
              }`}
            >
              All Jobs
            </button>
            {user?.role === 'seeker' && (
              <button
                disabled={loading}
                onClick={() => handleTabChange('recommended')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  activeTab === 'recommended'
                    ? 'bg-lime-accent text-black'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-dark-sidebar'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> Recommended
              </button>
            )}
          </div>
          {user?.role === 'seeker' && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={saveCurrentSearch}
                disabled={savingSearch}
                className="inline-flex items-center gap-2 rounded-lg border border-lime-accent/40 px-3 py-1.5 text-xs font-medium text-lime-accent transition hover:bg-lime-accent/10 disabled:opacity-50"
              >
                <Bell className="h-3.5 w-3.5" />
                {savingSearch ? 'Saving...' : 'Save search alert'}
              </button>
              <Link to="/seeker/job-alerts" className="text-xs text-slate-400 hover:text-slate-100">Manage alerts</Link>
              {saveSearchMessage && <span role="status" className="text-xs text-slate-400">{saveSearchMessage}</span>}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Filter Drawer ──────────────────────────────────────────── */}
      {showMobileFilters && (
        <div className="md:hidden bg-dark-card border-b border-dark-border px-4 py-5">
          <FilterPanel {...filterProps} />
        </div>
      )}

      {/* ── Page Body 
          Added pt-10 (padding-top) to ensure content doesn't hide behind the sticky header
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 pt-10 pb-6 flex gap-6 items-start">

        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-32 bg-dark-card border border-dark-border rounded-xl p-5">
            <FilterPanel {...filterProps} />
          </div>
        </aside>

        {/* ── Job Results ─────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {activeTab === 'all' ? (
            <>
              <p className="text-sm text-slate-400 mb-4">
                Showing <span className="font-medium text-slate-100">{loading ? '...' : filteredAndSortedJobs.length} jobs</span>
                {activeFilters > 0 && <span className="text-lime-accent"> · {activeFilters} filter{activeFilters > 1 ? 's' : ''} active</span>}
              </p>
              {savedJobsError && (
                <p role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {savedJobsError}
                  <button type="button" onClick={retrySavedJobs} className="font-medium underline underline-offset-2">Retry</button>
                </p>
              )}

              {loading ? (
                <div className="text-center py-16 text-slate-500 text-sm">Loading jobs...</div>
              ) : filteredAndSortedJobs.length === 0 ? (
                <div className="text-center py-16 bg-dark-card rounded-xl border border-dark-border">
                  <div className="text-4xl mb-3">🔍</div>
                  <h3 className="font-medium text-slate-100 mb-1">No jobs found</h3>
                  <p className="text-sm text-slate-400 mb-4">Try adjusting your search or filter criteria</p>
                  <button
                    onClick={clearAll}
                    className="bg-lime-accent text-black px-5 py-2 rounded-lg text-sm font-medium hover:bg-lime-accent-hover transition"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAndSortedJobs.map(job => (
                    <JobCard
                      key={job._id}
                      job={job}
                      isSaved={savedJobIds.has(String(job._id))}
                      saving={savedJobsLoading || updatingJobIds.has(String(job._id))}
                      onToggleSave={user?.role === 'seeker' ? toggleSavedJob : undefined}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-slate-400 mb-4 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-lime-300" />
                Jobs ranked by your AI match score
              </p>

              {recsLoading ? (
                <div className="text-center py-16">
                  <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-lime-accent" />
                  <p className="text-sm text-slate-400">Calculating your matches...</p>
                </div>
              ) : filteredRecommendations.length === 0 ? (
                <div className="text-center py-16 bg-dark-card rounded-xl border border-dark-border">
                  <Sparkles className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                  <p className="font-medium text-slate-100">{recommendations.length ? 'No matching recommendations' : 'No recommendations yet'}</p>
                  <p className="text-sm text-slate-400 mt-1">
                    {recommendations.length
                      ? 'Try changing your search or filters to see your recommended jobs.'
                      : 'Complete your profile to get personalized job matches.'}
                  </p>
                  {recommendations.length === 0 && (
                    <Link to="/seeker/profile" className="mt-4 inline-block bg-lime-accent text-black px-5 py-2 rounded-lg text-sm font-medium hover:bg-lime-accent-hover transition">
                      Complete Profile
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRecommendations.map(job => (
                    <JobCard
                      key={job._id}
                      job={job}
                      matchScore={job.matchScore}
                      isSaved={savedJobIds.has(String(job._id))}
                      saving={savedJobsLoading || updatingJobIds.has(String(job._id))}
                      onToggleSave={toggleSavedJob}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobListings;