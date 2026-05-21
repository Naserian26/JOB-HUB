import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Users, TrendingUp, Briefcase, Clock, Search } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-dark-bg">

      {/* Navbar */}
      <nav className="bg-dark-bg px-6 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-dark-border\">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-lime-500 p-1.5 rounded-lg">
            <Briefcase className="h-5 w-5 text-dark-bg" />
          </div>
          <span className="text-dark-primary font-bold text-lg">JobHub</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/login" className="border border-lime-500/40 text-lime-500 px-4 py-2 rounded-lg text-sm font-medium hover:bg-lime-500/10 transition">
            Log in
          </Link>
          <Link to="/register" className="bg-lime-500 text-dark-bg px-4 py-2 rounded-lg text-sm font-bold hover:bg-lime-600 transition">
            Get started →
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-dark-bg py-20 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">

            <span className="inline-flex items-center gap-2 py-1 px-4 rounded-full bg-lime-500/10 text-lime-500 text-sm font-medium mb-6 border border-lime-500/30">
              ✦ AI-Powered Recruitment Platform
            </span>

            <h1 className="text-4xl md:text-6xl font-extrabold text-dark-primary tracking-tight mb-6">
              Find your <span className="text-lime-500">dream job</span><br />with Job Hub
            </h1>

            <p className="text-lg text-dark-secondary mb-8 max-w-2xl mx-auto">
              Your dream career is closer than you think. Find opportunities that help you grow — powered by AI.
            </p>

            {/* Search Bar */}
            <div className="flex items-center gap-3 bg-dark-card border border-dark-border rounded-lg px-4 py-3 max-w-lg mx-auto mb-8">
              <Search className="w-4 h-4 text-dark-secondary/50 shrink-0" />
              <input
                type="text"
                placeholder="Job title, skill, or company..."
                className="bg-transparent flex-1 text-sm text-dark-primary placeholder-dark-secondary/50 outline-none"
              />
              <Link
                to="/jobs"
                className="bg-lime-500 text-dark-bg text-sm px-4 py-1.5 rounded-md hover:bg-lime-600 transition shrink-0 font-semibold"
              >
                Search
              </Link>
            </div>

            {/* Role Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Link
                to="/jobs"
                className="flex items-center justify-center gap-2 bg-lime-500 text-dark-bg px-8 py-3 rounded-lg font-semibold hover:bg-lime-600 transition"
              >
                <Users className="w-4 h-4" /> I'm looking for a job
              </Link>
              <Link
                to="/register"
                className="flex items-center justify-center gap-2 border border-dark-border text-dark-primary px-8 py-3 rounded-lg font-semibold hover:border-lime-500/50 hover:text-lime-500 transition"
              >
                <Briefcase className="w-4 h-4" /> I'm hiring
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-col sm:flex-row justify-center border-t border-dark-border pt-8">
              <div className="px-8 py-2">
                <p className="text-2xl font-bold text-dark-primary">50K+</p>
                <p className="text-sm text-dark-secondary">Active jobs</p>
              </div>
              <div className="px-8 py-2 sm:border-l border-dark-border">
                <p className="text-2xl font-bold text-dark-primary">1M+</p>
                <p className="text-sm text-dark-secondary">Job seekers</p>
              </div>
              <div className="px-8 py-2 sm:border-l border-dark-border">
                <p className="text-2xl font-bold text-dark-primary">95%</p>
                <p className="text-sm text-dark-secondary">Success rate</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-8 bg-dark-card border-y border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-center">
            <div>
              <p className="text-3xl font-extrabold text-lime-500">10,000+</p>
              <p className="text-sm text-dark-secondary">Companies Hiring</p>
            </div>
            <div className="hidden sm:block w-px h-10 bg-dark-border" />
            <div>
              <p className="text-3xl font-extrabold text-lime-500">5 Days</p>
              <p className="text-sm text-dark-secondary">Average Time-to-Hire</p>
            </div>
            <div className="hidden sm:block w-px h-10 bg-dark-border" />
            <div>
              <p className="text-3xl font-extrabold text-lime-500">500K+</p>
              <p className="text-sm text-dark-secondary">Verified Candidates</p>
            </div>
            <div className="hidden sm:block w-px h-10 bg-dark-border" />
            <div>
              <p className="text-3xl font-extrabold text-lime-500">92%</p>
              <p className="text-sm text-dark-secondary">Employer Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-dark-primary">How It Works</h2>
            <p className="mt-4 text-dark-secondary">Three steps to your next great hire.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-0.5 bg-lime-500/20 z-0" />
            {[
              { step: '01', icon: <Briefcase className="w-6 h-6 text-lime-500" />, title: 'Post Your Role', desc: 'Describe the position, requirements, and team culture. Takes less than 5 minutes.' },
              { step: '02', icon: <Zap className="w-6 h-6 text-lime-500" />, title: 'AI Matches Candidates', desc: 'Our NLP engine ranks applicants by fit — skills, experience, and intent, not just keywords.' },
              { step: '03', icon: <Users className="w-6 h-6 text-lime-500" />, title: 'Interview & Hire', desc: 'Review ranked shortlists, schedule interviews, and make your offer — all in one place.' },
            ].map((item, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center p-6">
                <div className="w-12 h-12 bg-lime-500/10 border-2 border-lime-500/30 rounded-full flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <span className="text-xs font-bold text-lime-500 uppercase tracking-widest mb-1">Step {item.step}</span>
                <h3 className="text-xl font-bold text-dark-primary mb-2">{item.title}</h3>
                <p className="text-dark-secondary text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-dark-card border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-dark-primary">Built for Hiring Teams</h2>
            <p className="mt-4 text-dark-secondary">Everything you need to recruit efficiently at any scale.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-dark-bg border border-dark-border rounded-xl hover:border-lime-500/50 transition">
              <div className="w-12 h-12 bg-lime-500/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="text-lime-500 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-dark-primary">AI Candidate Matching</h3>
              <p className="text-dark-secondary">Surface the most relevant candidates instantly. Our model understands role context, not just resume keywords.</p>
            </div>
            <div className="p-6 bg-dark-bg border border-dark-border rounded-xl hover:border-lime-500/50 transition">
              <div className="w-12 h-12 bg-lime-500/10 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="text-lime-500 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-dark-primary">Real-Time Analytics</h3>
              <p className="text-dark-secondary">Track applicant pipeline, job post performance, and time-to-fill metrics from your dashboard.</p>
            </div>
            <div className="p-6 bg-dark-bg border border-dark-border rounded-xl hover:border-lime-500/50 transition">
              <div className="w-12 h-12 bg-lime-500/10 rounded-lg flex items-center justify-center mb-4">
                <Clock className="text-lime-500 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-dark-primary">Fast Turnaround</h3>
              <p className="text-dark-secondary">Stop waiting weeks. Employers on JobHub fill roles in an average of 5 days with pre-vetted candidate matches.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Hiring Sectors */}
      <section className="py-20 bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-dark-primary mb-3">Top Hiring Sectors This Week</h2>
          <p className="text-dark-secondary mb-10">See where demand for talent is growing fastest.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Fintech', growth: '+12%', count: '7,920', color: 'bg-lime-500' },
              { name: 'Healthcare', growth: '+40%', count: '9,410', color: 'bg-lime-600' },
              { name: 'Marketing', growth: '+2%', count: '4,305', color: 'bg-lime-400' },
              { name: 'Cloud Computing', growth: '+15%', count: '5,200', color: 'bg-lime-500' },
            ].map((sector, idx) => (
              <div key={idx} className="bg-dark-card p-6 rounded-lg border border-dark-border flex items-center justify-between hover:border-lime-500/50 transition">
                <div>
                  <h4 className="font-bold text-dark-primary">{sector.name}</h4>
                  <p className="text-sm text-dark-secondary">{sector.count} Active Candidates</p>
                </div>
                <span className={`${sector.color} text-dark-bg text-xs font-bold px-2 py-1 rounded`}>
                  {sector.growth}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-lime-500">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-dark-bg mb-4">
            Ready to Find Your Next Great Hire?
          </h2>
          <p className="text-dark-bg/80 mb-8 text-lg">
            Post your first job for free. No credit card required.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-dark-bg text-lime-500 px-10 py-4 rounded-lg font-bold text-lg hover:bg-dark-card transition shadow-lg"
          >
            Post a Job Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

    </div>
  );
};

export default Landing;