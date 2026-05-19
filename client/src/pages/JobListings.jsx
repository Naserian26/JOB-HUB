import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, DollarSign, Briefcase, Search, X, Filter } from 'lucide-react';
import axios from 'axios';

const categories = [
  "Software Development", "Cloud Computing", "Artificial Intelligence",
  "Networking", "Marketing", "Cybersecurity", "Product Management",
  "Sales Engineering", "Technical Writing", "IoT Development",
  "Quality Assurance", "Digital Marketing", "Design",
];

const locations = [
 
  "Baringo",
  "Bomet",
  "Bungoma",
  "Busia",
  "Elgeyo-Marakwet",
  "Embu",
  "Garissa",
  "Homa Bay",
  "Isiolo",
  "Kajiado",
  "Kakamega",
  "Kericho",
  "Kiambu",
  "Kilifi",
  "Kirinyaga",
  "Kisii",
  "Kisumu",
  "Kitui",
  "Kwale",
  "Laikipia",
  "Lamu",
  "Machakos",
  "Makueni",
  "Mandera",
  "Marsabit",
  "Meru",
  "Migori",
  "Mombasa",
  "Murang'a",
  "Nairobi",
  "Nakuru",
  "Nandi",
  "Narok",
  "Nyamira",
  "Nyandarua",
  "Nyeri",
  "Samburu",
  "Siaya",
  "Taita-Taveta",
  "Tana River",
  "Tharaka-Nithi",
  "Trans Nzoia",
  "Turkana",
  "Uasin Gishu",
  "Vihiga",
  "Wajir",
  "West Pokot",
  "Remote",
];


const JobListings = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [sortBy, setSortBy] = useState('Most Recent');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/jobs');
        setJobs(res.data);
      } catch (err) {
        console.error('Failed to fetch jobs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

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

  // IMPROVEMENT: useMemo for performance + added Sorting Logic
  const filteredAndSortedJobs = useMemo(() => {
    let result = jobs.filter(job => {
      const matchesSearch = !search ||
        job.title?.toLowerCase().includes(search.toLowerCase()) ||
        job.employerId?.name?.toLowerCase().includes(search.toLowerCase());
      const matchesCat = selectedCategories.length === 0 || selectedCategories.includes(job.category);
      const matchesLoc = selectedLocations.length === 0 || selectedLocations.includes(job.location);
      return matchesSearch && matchesCat && matchesLoc;
    });

    // Sort logic
    if (sortBy === 'Most Recent') {
      return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'Highest Salary') {
      // Note: This assumes salary is a number. If it's a string like "$50k", you'd need parsing.
      return result.sort((a, b) => (b.salary || 0) - (a.salary || 0));
    } else {
      // Default / Most Relevant
      return result;
    }
  }, [jobs, search, selectedCategories, selectedLocations, sortBy]);

  const activeFilters = selectedCategories.length + selectedLocations.length;

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* Page Header */}
      <div className="bg-white border-b border-gray-100 py-6 px-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4 md:hidden">
            <h1 className="text-xl font-bold text-gray-900">Latest Jobs</h1>
            <button 
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex items-center gap-2 text-sm font-medium text-indigo-600"
            >
              <Filter className="w-4 h-4" /> Filters {activeFilters > 0 && `(${activeFilters})`}
            </button>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4 hidden md:block">Latest Jobs</h1>
          
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2 flex-1 max-w-lg bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Job title, skill, or company..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
              />
              {search && (
                <button onClick={() => setSearch('')}>
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white outline-none"
            >
              <option>Most Recent</option>
              <option>Most Relevant</option>
              <option>Highest Salary</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6 relative">

        {/* Sidebar - Hidden on mobile, toggleable */}
        <aside className={`${showMobileFilters ? 'block' : 'hidden'} md:block absolute md:relative top-0 left-4 z-10 w-64 h-fit bg-white md:bg-transparent border md:border-0 border-gray-200 rounded-xl md:rounded-none p-5 md:p-0`}>
          <div className="bg-white md:border md:border-gray-100 rounded-xl md:p-5 md:sticky md:top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 text-sm">Filters</h3>
              {activeFilters > 0 && (
                <button onClick={clearAll} className="text-xs text-indigo-600 hover:underline">
                  Clear all
                </button>
              )}
            </div>

            <div className="mb-5">
              <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Categories</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {categories.map(cat => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => toggle(selectedCategories, setSelectedCategories, cat)}
                      className="h-3.5 w-3.5 rounded accent-indigo-600"
                    />
                    <span className={`text-xs ${selectedCategories.includes(cat) ? 'text-indigo-600 font-medium' : 'text-gray-600'}`}>
                      {cat}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Locations</h4>
              <div className="space-y-2">
                {locations.map(loc => (
                  <label key={loc} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedLocations.includes(loc)}
                      onChange={() => toggle(selectedLocations, setSelectedLocations, loc)}
                      className="h-3.5 w-3.5 rounded accent-indigo-600"
                    />
                    <span className={`text-xs ${selectedLocations.includes(loc) ? 'text-indigo-600 font-medium' : 'text-gray-600'}`}>
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
          <p className="text-sm text-gray-500 mb-4">
            Showing <span className="font-medium text-gray-900">{loading ? '...' : filteredAndSortedJobs.length} jobs</span>
            {activeFilters > 0 && <span className="text-indigo-600"> · {activeFilters} filter{activeFilters > 1 ? 's' : ''} active</span>}
          </p>

          {loading ? (
            <div className="text-center py-16 text-gray-400 text-sm">Loading jobs...</div>
          ) : filteredAndSortedJobs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="font-medium text-gray-700 mb-1">No jobs found</h3>
              <p className="text-sm text-gray-400 mb-4">Try adjusting your search or filter criteria</p>
              <button
                onClick={clearAll}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedJobs.map(job => (
                <Link to={`/jobs/${job._id}`} key={job._id} className="block">
                  <div className="bg-white border border-gray-100 rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm transition flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                      {job.employerId?.name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-gray-900 text-sm mb-1">{job.title}</h2>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span>{job.employerId?.name}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                        {job.salary && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.salary}</span>}
                        <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.category}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1 rounded-full">
                        {job.type || 'Full Time'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobListings;