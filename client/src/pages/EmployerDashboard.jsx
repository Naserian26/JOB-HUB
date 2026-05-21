import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import { Users, FileText, Briefcase, TrendingUp, ChevronRight } from 'lucide-react';
import EmployerLayout from '../components/EmployerLayout';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from 'recharts';

const API = 'http://localhost:5000/api';

const COLORS = {
  pending:   '#94a3b8',
  interview: '#6366f1',
  hired:     '#22c55e',
  rejected:  '#f87171',
};

const EmployerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ applicants: 0, interviewed: 0, offers: 0, activeJobs: 0 });
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.token) return;
    const fetchAll = async () => {
      try {
        const [statsRes, appsRes] = await Promise.all([
          axios.get(`${API}/applications/stats`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axios.get(`${API}/applications/employer/all`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
        ]);
        setStats(statsRes.data);
        setApplications(appsRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user?.token]);

  // --- Derived analytics ---

  // 1. Status breakdown for pie chart
  const statusCounts = ['pending', 'interview', 'hired', 'rejected'].map(s => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: applications.filter(a => a.status === s).length,
  }));

  // 2. Applications over time (last 7 days)
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const appsByDay = last7.map(date => ({
    date: date.slice(5), // MM-DD
    applications: applications.filter(a =>
      new Date(a.createdAt).toISOString().split('T')[0] === date
    ).length,
  }));

  // 3. Match score distribution
  const scoreRanges = [
    { range: '0-20',  count: applications.filter(a => a.matchScore < 20).length },
    { range: '20-40', count: applications.filter(a => a.matchScore >= 20 && a.matchScore < 40).length },
    { range: '40-60', count: applications.filter(a => a.matchScore >= 40 && a.matchScore < 60).length },
    { range: '60-80', count: applications.filter(a => a.matchScore >= 60 && a.matchScore < 80).length },
    { range: '80+',   count: applications.filter(a => a.matchScore >= 80).length },
  ];

  // 4. Top jobs by applicants
  const jobMap = {};
  applications.forEach(a => {
    const title = a.jobId?.title || 'Unknown';
    jobMap[title] = (jobMap[title] || 0) + 1;
  });
  const topJobs = Object.entries(jobMap)
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const avgScore = applications.length
    ? Math.round(applications.reduce((sum, a) => sum + (a.matchScore || 0), 0) / applications.length)
    : 0;

  const statCards = [
    { label: 'Total Applicants', value: stats.applicants, sub: 'Live count', icon: <Users className="w-6 h-6 text-blue-600" />, bg: 'bg-blue-50' },
    { label: 'Total Interviewed', value: stats.interviewed, sub: 'Current cycle', icon: <Briefcase className="w-6 h-6 text-purple-600" />, bg: 'bg-purple-50' },
    { label: 'Job Offers', value: stats.offers, sub: 'Accepted pending', icon: <TrendingUp className="w-6 h-6 text-green-600" />, bg: 'bg-green-50' },
    { label: 'Active Jobs', value: stats.activeJobs, sub: 'Currently live', icon: <FileText className="w-6 h-6 text-orange-600" />, bg: 'bg-orange-50' },
  ];

  return (
    <EmployerLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">Overview</h1>
        <p className="text-slate-400 mt-1">Welcome back, {user?.name}. Here's your hiring summary.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-lime-accent" />
          Loading dashboard...
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {statCards.map((s, i) => (
              <div key={i} className="bg-dark-card p-6 rounded-xl shadow-dark-sm border border-dark-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">{s.label}</p>
                    <p className="text-3xl font-bold text-slate-100 mt-1">{s.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{s.sub}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900">{s.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

            {/* Applications over time */}
            <div className="md:col-span-2 bg-dark-card rounded-xl border border-dark-border shadow-dark-sm p-5">
              <p className="text-sm font-semibold text-slate-100 mb-4">Applications — Last 7 Days</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={appsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0b0f0b', borderRadius: 8, border: '1px solid #23302a', color: '#e2e8f0' }} />
                  <Line type="monotone" dataKey="applications" stroke="#84cc16" strokeWidth={2} dot={{ r: 4, fill: '#84cc16' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Status pie */}
            <div className="bg-dark-card rounded-xl border border-dark-border shadow-dark-sm p-5">
              <p className="text-sm font-semibold text-slate-100 mb-4">Pipeline Status</p>
              {applications.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-12">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusCounts.filter(s => s.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      labelLine={false}
                    >
                      {statusCounts.map((entry, index) => (
                        <Cell key={index} fill={COLORS[entry.name.toLowerCase()] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11, color: '#cbd5e1' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0b0f0b', borderRadius: 8, border: '1px solid #23302a', color: '#e2e8f0' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Charts row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

            {/* Match score distribution */}
            <div className="bg-dark-card rounded-xl border border-dark-border shadow-dark-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-slate-100">Match Score Distribution</p>
                <span className="text-xs text-black font-semibold bg-lime-accent px-2 py-1 rounded-full">Avg: {avgScore}%</span>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={scoreRanges}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0b0f0b', borderRadius: 8, border: '1px solid #23302a', color: '#e2e8f0' }} />
                  <Bar dataKey="count" fill="#84cc16" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top jobs by applicants */}
            <div className="bg-dark-card rounded-xl border border-dark-border shadow-dark-sm p-5">
              <p className="text-sm font-semibold text-slate-100 mb-4">Top Jobs by Applicants</p>
              {topJobs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-12">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={topJobs} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis dataKey="title" type="category" tick={{ fontSize: 10, fill: '#94a3b8' }} width={80} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0b0f0b', borderRadius: 8, border: '1px solid #23302a', color: '#e2e8f0' }} />
                    <Bar dataKey="count" fill="#84cc16" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Quick nav */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              to="/employer/manage-jobs"
              className="bg-dark-card border border-dark-border rounded-xl p-6 shadow-dark-sm hover:shadow-dark-md transition group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-100 text-lg">Applications</h3>
                  <p className="text-slate-400 text-sm mt-1">Select a job to review its applicants</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-lime-accent transition" />
              </div>
            </Link>

            <Link
              to="/employer/manage-jobs"
              className="bg-dark-card border border-dark-border rounded-xl p-6 shadow-dark-sm hover:shadow-dark-md transition group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-100 text-lg">Manage Jobs</h3>
                  <p className="text-slate-400 text-sm mt-1">View, edit, or close your posted jobs</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-lime-accent transition" />
              </div>
            </Link>
          </div>
        </>
      )}
    </EmployerLayout>
  );
};

export default EmployerDashboard;