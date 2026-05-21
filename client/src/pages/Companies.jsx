import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Building2, Briefcase, Search, X} from 'lucide-react';
import { FaLinkedin, FaTwitter } from 'react-icons/fa';

const API = 'http://localhost:5000/api';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axios.get(`${API}/company-profile/all`);
        setCompanies(res.data);
      } catch (err) {
        console.error('Failed to fetch companies', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const industries = [...new Set(companies.map(c => c.industry).filter(Boolean))];

  const filtered = companies.filter(c => {
    const matchesSearch = !search ||
      c.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.industry?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase());
    const matchesIndustry = !selectedIndustry || c.industry === selectedIndustry;
    return matchesSearch && matchesIndustry;
  });

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Companies</h1>
          <p className="text-sm text-gray-500 mb-6">Discover companies hiring on JobHub</p>

          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 max-w-md bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search companies..."
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
              value={selectedIndustry}
              onChange={e => setSelectedIndustry(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white outline-none"
            >
              <option value="">All Industries</option>
              {industries.map(i => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading companies...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <Building2 className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <h3 className="font-medium text-gray-600 mb-1">No companies found</h3>
            <p className="text-sm text-gray-400">Try adjusting your search</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-5">
              Showing <span className="font-medium text-gray-900">{filtered.length}</span> companies
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(company => (
                <div key={company._id} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition flex flex-col gap-4">
                  {/* Logo + name */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
                      {company.logoUrl ? (
                        <img src={company.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-indigo-600 font-bold text-xl">
                          {company.userId?.name?.[0] || '?'}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">{company.userId?.name || 'Unknown Company'}</p>
                      {company.industry && (
                        <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
                          {company.industry}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {company.description && (
                    <p className="text-xs text-gray-500 line-clamp-3">{company.description}</p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5 text-indigo-400" />
                      {company.jobCount ?? 0} open job{company.jobCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Social + CTA */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      {company.linkedin && (
                        <a href={company.linkedin} target="_blank" rel="noopener noreferrer"
                          className="text-gray-400 hover:text-[#0077b5] transition">
                          <FaLinkedin className="h-4 w-4" />
                        </a>
                      )}
                      {company.twitter && (
                        <a href={company.twitter} target="_blank" rel="noopener noreferrer"
                          className="text-gray-400 hover:text-[#1da1f2] transition">
                          <FaTwitter className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    <Link
                      to={`/jobs?company=${encodeURIComponent(company.userId?.name || '')}`}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                    >
                      View Jobs →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Companies;