import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { Briefcase, Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import EmployerLayout from '../components/EmployerLayout';
const API = 'http://localhost:5000/api';

const ManageJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get(`${API}/jobs/employer`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setJobs(res.data);
      } catch (err) {
        console.error('Error fetching jobs', err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.token) fetchJobs();
  }, [user?.token]);

  const handleDelete = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    try {
      await axios.delete(`${API}/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setJobs(prev => prev.filter(j => j._id !== jobId));
    } catch (err) {
      console.error('Error deleting job', err);
    }
  };

  const handleToggleVisibility = async (jobId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await axios.patch(`${API}/jobs/${jobId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setJobs(prev => prev.map(j => j._id === jobId ? { ...j, status: newStatus } : j));
    } catch (err) {
      console.error('Error toggling visibility', err);
    }
  };

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(j => !j.status || j.status === 'active').length;
  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicantsCount ?? 0), 0);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <EmployerLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Jobs</h1>
          <p className="text-gray-500 mt-1 text-sm">View, update, and manage your job listings</p>
        </div>
        <Link
          to="/employer/add-job"
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
        >
          <Plus className="w-4 h-4" /> Post New Job
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading jobs...</p>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-l-4 border-l-indigo-500 border-gray-100 p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total Jobs</p>
              <p className="text-3xl font-bold text-indigo-600 mt-1">{totalJobs}</p>
            </div>
            <div className="bg-white rounded-xl border border-l-4 border-l-green-500 border-gray-100 p-5 shadow-sm">
              <p className="text-sm text-gray-500">Active Jobs</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{activeJobs}</p>
            </div>
            <div className="bg-white rounded-xl border border-l-4 border-l-blue-400 border-gray-100 p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total Applicants</p>
              <p className="text-3xl font-bold text-blue-500 mt-1">{totalApplicants}</p>
            </div>
          </div>

          {/* Table */}
          {jobs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No jobs posted yet</p>
              <p className="text-gray-400 text-sm mt-1">Click "Post New Job" to get started</p>
              <Link
                to="/employer/add-job"
                className="inline-flex items-center gap-2 mt-6 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
              >
                <Plus className="w-4 h-4" /> Post a Job
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-indigo-600 font-semibold">
                    <th className="text-left px-6 py-4">#</th>
                    <th className="text-left px-6 py-4">Job Title</th>
                    <th className="text-left px-6 py-4">Date</th>
                    <th className="text-left px-6 py-4">Location</th>
                    <th className="text-left px-6 py-4">Applicants</th>
                    <th className="text-left px-6 py-4">Visible</th>
                    <th className="text-left px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job, index) => {
                    const isActive = !job.status || job.status === 'active';
                    return (
                      <tr key={job._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-gray-400">{index + 1}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{job.title}</td>
                        <td className="px-6 py-4 text-gray-500">{formatDate(job.createdAt)}</td>
                        <td className="px-6 py-4 text-gray-500">{job.location}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-semibold text-xs">
                            {job.applicantsCount ?? 0}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleVisibility(job._id, job.status || 'active')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              isActive ? 'bg-indigo-600' : 'bg-gray-200'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                              isActive ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/employer/applicants/${job._id}`}
                              className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 transition"
                              title="View Applicants"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              to={`/employer/edit-job/${job._id}`}
                              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(job._id)}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Add new job footer row */}
              <div className="flex justify-end px-6 py-4 border-t border-gray-100">
                <Link
                  to="/employer/add-job"
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
                >
                  <Plus className="w-4 h-4" /> Add new Job
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </EmployerLayout>
  );
};

export default ManageJobs;