import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, DollarSign, Briefcase, Search, X, Filter, Sparkles } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const API = 'http://localhost:5000/api';

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

const JobCard = ({ job, matchScore }) => (
  <Link to={`/jobs/${job._id}`} className="block">
    <div className="bg-dark-card border border-dark-border rounded-xl p-5 hover:border-lime-accent hover:shadow-dark-md transition flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-lime-500/15 border border-lime-500/30 flex items-center justify-center text-lime-200 font-bold text-sm shrink-0">
        {job.employerId?.name?.[0] || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-slate-100 text-sm mb-1">{job.title}</h2>
        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          <span>{job.employerId?.name}</span>
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-500" />{job.location}</span>
          {job.salary && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-slate-500" />{job.salary}</span>}
          <span className="flex items-center gap-1"><Briefcase className="w-3 h-3 text-slate-500" />{job.category}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        {matchScore !== undefined ? (
          <span className={`text-xs font-bold ${
            matchScore >= 80 ? 'text-lime-300' :
            matchScore >= 50 ? 'text-amber-400' : 'text-slate-500'
          }`}>{matchScore}% match</span>
        ) : (
          <span className="bg-slate-900 text-slate-200 text-xs font-medium px-3 py-1 rounded-full">
            {job.type || 'Full Time'}
          </span>
        )}
        <span className="text-xs text-slate-500">
          {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : ''}
        </span>
      </div>
    </div>
  </Link>
);

const JobListings = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [sortBy, setSortBy] = useState('Most Recent');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'recommended'
  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsLoaded, setRecsLoaded] = useState(false);

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
    if (recsLoaded || !user?.token) return;
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
          } catch {
            return { ...job, matchScore: 0 };
          }
        })
      );
      setRecommendations(scored.filter(j => j.matchScore >= 40).sort((a, b) => b.matchScore - a.matchScore));
      setRecsLoaded(true);
    } catch (err) {
      console.error('Failed to load recommendations', err);
    } finally {
      setRecsLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'recommended' && !recsLoaded) {
      loadRecommendations();
    }
  };

  const toggle = (list, setList, value) => {
    setList(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const clearAll = () => {
    setSelectedCategories([]);
    setSelectedLocations([]);
    setSearch('');
  };

  const filteredAndSortedJobs = useMemo(() => {
    let result = jobs.filter(job => {
      const matchesSearch = !search ||
        job.title?.toLowerCase().includes(search.toLowerCase()) ||
        job.employerId?.name?.toLowerCase().includes(search.toLowerCase());
      const matchesCat = selectedCategories.length === 0 || selectedCategories.includes(job.category);
      const matchesLoc = selectedLocations.length === 0 || selectedLocations.includes(job.location);
      return matchesSearch && matchesCat && matchesLoc;
    });

    if (sortBy === 'Most Recent') {
      return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'Highest Salary') {
      return result.sort((a, b) => (b.salary || 0) - (a.salary || 0));
    }
    return result;
  }, [jobs, search, selectedCategories, selectedLocations, sortBy]);

  const activeFilters = selectedCategories.length + selectedLocations.length;

  return (
    <div className="bg-dark-bg min-h-screen">

      {/* Page Header */}
      <div className="bg-dark-card border-b border-dark-border py-6 px-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4 md:hidden">
            <h1 className="text-xl font-bold text-slate-100">Latest Jobs</h1>
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex items-center gap-2 text-sm font-medium text-lime-accent"
            >
              <Filter className="w-4 h-4" /> Filters {activeFilters > 0 && `(${activeFilters})`}
            </button>
          </div>

          <h1 className="text-2xl font-bold text-slate-100 mb-4 hidden md:block">Latest Jobs</h1>

          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2 flex-1 max-w-lg bg-dark-sidebar border border-dark-border rounded-lg px-4 py-2">
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
                  <X className="w-3 h-3 text-slate-500" />
                </button>
              )}
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="border border-dark-border rounded-lg px-3 py-2 text-sm text-slate-100 bg-dark-card outline-none"
            >
              <option className="bg-dark-card">Most Recent</option>
              <option className="bg-dark-card">Most Relevant</option>
              <option className="bg-dark-card">Highest Salary</option>
            </select>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6 relative">

        {/* Sidebar */}
        <aside className={`${showMobileFilters ? 'block' : 'hidden'} md:block absolute md:relative top-0 left-4 z-10 w-64 h-fit bg-dark-card md:bg-transparent border md:border-0 border-dark-border rounded-xl md:rounded-none p-5 md:p-0`}>
          <div className="bg-dark-card md:border md:border-dark-border rounded-xl md:p-5 md:sticky md:top-24">
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
          </div>
        </aside>

        {/* Job Results */}
        <div className="flex-1">
          {activeTab === 'all' ? (
            <>
              <p className="text-sm text-slate-400 mb-4">
                Showing <span className="font-medium text-slate-100">{loading ? '...' : filteredAndSortedJobs.length} jobs</span>
                {activeFilters > 0 && <span className="text-lime-accent"> · {activeFilters} filter{activeFilters > 1 ? 's' : ''} active</span>}
              </p>

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
                    <JobCard key={job._id} job={job} />
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
              ) : recommendations.length === 0 ? (
                <div className="text-center py-16 bg-dark-card rounded-xl border border-dark-border">
                  <Sparkles className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                  <p className="font-medium text-slate-100">No recommendations yet</p>
                  <p className="text-sm text-slate-400 mt-1">Complete your profile to get personalized job matches</p>
                  <Link to="/seeker/profile" className="mt-4 inline-block bg-lime-accent text-black px-5 py-2 rounded-lg text-sm font-medium hover:bg-lime-accent-hover transition">
                    Complete Profile
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.map(job => (
                    <JobCard key={job._id} job={job} matchScore={job.matchScore} />
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