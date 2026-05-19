import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Users, TrendingUp, Briefcase, Clock, Search } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-white">

      {/* Navbar */}
      <nav className="bg-[#0A0A1A] px-6 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-white/5">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg">JobHub</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/login" className="border border-indigo-400 text-indigo-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-900/40 transition">
            Log in
          </Link>
          <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition">
            Get started →
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-[#0A0A1A] py-20 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">

            <span className="inline-flex items-center gap-2 py-1 px-4 rounded-full bg-indigo-900/40 text-indigo-300 text-sm font-medium mb-6 border border-indigo-700/40">
              ✦ AI-Powered Recruitment Platform
            </span>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
              Find your <span className="text-indigo-400">dream job</span><br />with Job Hub
            </h1>

            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              Your dream career is closer than you think. Find opportunities that help you grow — powered by AI.
            </p>

            {/* Search Bar */}
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-4 py-3 max-w-lg mx-auto mb-8">
              <Search className="w-4 h-4 text-gray-500 shrink-0" />
              <input
                type="text"
                placeholder="Job title, skill, or company..."
                className="bg-transparent flex-1 text-sm text-gray-300 placeholder-gray-500 outline-none"
              />
              <Link
                to="/jobs"
                className="bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-md hover:bg-indigo-700 transition shrink-0"
              >
                Search
              </Link>
            </div>

            {/* Role Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Link
                to="/jobs"
                className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                <Users className="w-4 h-4" /> I'm looking for a job
              </Link>
              <Link
                to="/register"
                className="flex items-center justify-center gap-2 border border-white/20 text-gray-300 px-8 py-3 rounded-lg font-semibold hover:border-white/40 transition"
              >
                <Briefcase className="w-4 h-4" /> I'm hiring
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-col sm:flex-row justify-center border-t border-white/10 pt-8">
              <div className="px-8 py-2">
                <p className="text-2xl font-bold text-white">50K+</p>
                <p className="text-sm text-gray-500">Active jobs</p>
              </div>
              <div className="px-8 py-2 sm:border-l border-white/10">
                <p className="text-2xl font-bold text-white">1M+</p>
                <p className="text-sm text-gray-500">Job seekers</p>
              </div>
              <div className="px-8 py-2 sm:border-l border-white/10">
                <p className="text-2xl font-bold text-white">95%</p>
                <p className="text-sm text-gray-500">Success rate</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-8 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-center">
            <div>
              <p className="text-3xl font-extrabold text-indigo-600">10,000+</p>
              <p className="text-sm text-gray-500">Companies Hiring</p>
            </div>
            <div className="hidden sm:block w-px h-10 bg-gray-200" />
            <div>
              <p className="text-3xl font-extrabold text-indigo-600">5 Days</p>
              <p className="text-sm text-gray-500">Average Time-to-Hire</p>
            </div>
            <div className="hidden sm:block w-px h-10 bg-gray-200" />
            <div>
              <p className="text-3xl font-extrabold text-indigo-600">500K+</p>
              <p className="text-sm text-gray-500">Verified Candidates</p>
            </div>
            <div className="hidden sm:block w-px h-10 bg-gray-200" />
            <div>
              <p className="text-3xl font-extrabold text-indigo-600">92%</p>
              <p className="text-sm text-gray-500">Employer Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-gray-600">Three steps to your next great hire.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-0.5 bg-indigo-100 z-0" />
            {[
              { step: '01', icon: <Briefcase className="w-6 h-6 text-indigo-600" />, title: 'Post Your Role', desc: 'Describe the position, requirements, and team culture. Takes less than 5 minutes.' },
              { step: '02', icon: <Zap className="w-6 h-6 text-indigo-600" />, title: 'AI Matches Candidates', desc: 'Our NLP engine ranks applicants by fit — skills, experience, and intent, not just keywords.' },
              { step: '03', icon: <Users className="w-6 h-6 text-indigo-600" />, title: 'Interview & Hire', desc: 'Review ranked shortlists, schedule interviews, and make your offer — all in one place.' },
            ].map((item, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center p-6">
                <div className="w-12 h-12 bg-indigo-50 border-2 border-indigo-200 rounded-full flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Step {item.step}</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Built for Hiring Teams</h2>
            <p className="mt-4 text-gray-600">Everything you need to recruit efficiently at any scale.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white border rounded-xl hover:shadow-lg transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="text-blue-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">AI Candidate Matching</h3>
              <p className="text-gray-600">Surface the most relevant candidates instantly. Our model understands role context, not just resume keywords.</p>
            </div>
            <div className="p-6 bg-white border rounded-xl hover:shadow-lg transition">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="text-green-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Real-Time Analytics</h3>
              <p className="text-gray-600">Track applicant pipeline, job post performance, and time-to-fill metrics from your dashboard.</p>
            </div>
            <div className="p-6 bg-white border rounded-xl hover:shadow-lg transition">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="text-purple-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Fast Turnaround</h3>
              <p className="text-gray-600">Stop waiting weeks. Employers on JobHub fill roles in an average of 5 days with pre-vetted candidate matches.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Hiring Sectors */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Top Hiring Sectors This Week</h2>
          <p className="text-gray-500 mb-10">See where demand for talent is growing fastest.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Fintech', growth: '+12%', count: '7,920', color: 'bg-blue-500' },
              { name: 'Healthcare', growth: '+40%', count: '9,410', color: 'bg-green-500' },
              { name: 'Marketing', growth: '+2%', count: '4,305', color: 'bg-orange-500' },
              { name: 'Cloud Computing', growth: '+15%', count: '5,200', color: 'bg-purple-500' },
            ].map((sector, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition">
                <div>
                  <h4 className="font-bold text-gray-900">{sector.name}</h4>
                  <p className="text-sm text-gray-500">{sector.count} Active Candidates</p>
                </div>
                <span className={`${sector.color} text-white text-xs font-bold px-2 py-1 rounded`}>
                  {sector.growth}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Ready to Find Your Next Great Hire?
          </h2>
          <p className="text-indigo-200 mb-8 text-lg">
            Post your first job for free. No credit card required.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 px-10 py-4 rounded-lg font-bold text-lg hover:bg-indigo-50 transition shadow-lg"
          >
            Post a Job Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

    </div>
  );
};

export default Landing;