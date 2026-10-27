import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Users, TrendingUp, Briefcase, Clock, Search, Sparkles, Check, FileText, UserRound, Compass } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const submitSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/jobs?search=${encodeURIComponent(query)}` : '/jobs');
  };

  return (
    <div className="min-h-screen bg-dark-bg">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-dark-border bg-dark-bg px-6 py-4">
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
      <section className="relative isolate overflow-hidden border-b border-dark-border bg-dark-bg py-16 sm:py-20 lg:py-24">
        <div className="pointer-events-none absolute -right-24 -top-28 -z-10 h-96 w-96 rounded-full bg-lime-500/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-lime-500/30 bg-lime-500/10 px-4 py-1.5 text-sm font-medium text-lime-500">
              <Sparkles className="h-4 w-4" /> AI-powered job matching
            </span>
            <h1 className="mb-6 max-w-2xl text-4xl font-extrabold tracking-tight text-dark-primary sm:text-5xl lg:text-6xl">
              Your next move starts <span className="text-lime-500">here.</span>
            </h1>
            <p className="mb-8 max-w-xl text-lg leading-relaxed text-dark-secondary">
              Find roles that fit your skills, get a clearer view of your match, and manage your applications in one place.
            </p>

            <form onSubmit={submitSearch} className="mb-5 flex max-w-xl items-center gap-3 rounded-xl border border-dark-border bg-dark-card p-2 pl-4 shadow-lg shadow-black/10 focus-within:border-lime-500/50">
              <Search className="h-5 w-5 shrink-0 text-dark-secondary/60" />
              <input
                type="search"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Role, skill, or company"
                aria-label="Search jobs by role, skill, or company"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-dark-primary outline-none placeholder:text-dark-secondary/50"
              />
              <button type="submit" className="shrink-0 rounded-lg bg-lime-500 px-4 py-2.5 text-sm font-semibold text-dark-bg transition hover:bg-lime-600">
                Search
              </button>
            </form>
            <div className="mb-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/jobs"
                className="flex items-center justify-center gap-2 rounded-lg bg-lime-500 px-6 py-3 font-semibold text-dark-bg transition hover:bg-lime-600"
              >
                <Users className="h-4 w-4" /> Explore jobs
              </Link>
              <Link
                to="/register"
                className="flex items-center justify-center gap-2 rounded-lg border border-dark-border px-6 py-3 font-semibold text-dark-primary transition hover:border-lime-500/50 hover:text-lime-500"
              >
                <Briefcase className="h-4 w-4" /> I'm hiring
              </Link>
            </div>
            <p className="text-sm text-dark-secondary/80">
              Built for job seekers and employers, from discovery through interview.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
            <div className="absolute -inset-8 rounded-full bg-orange-500/10 blur-3xl" />
            <div className="relative min-h-[390px] overflow-hidden rounded-[2rem] border border-dark-border bg-[#211d1a] p-6 shadow-2xl shadow-black/30 sm:min-h-[440px] sm:p-8">
              <div className="absolute inset-0 opacity-70" style={{ background: 'radial-gradient(circle at 50% 42%, rgba(249, 115, 22, 0.2), transparent 55%)' }} />
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border border-orange-300/10" />
              <div className="absolute -right-7 -top-7 h-48 w-48 rounded-full border border-orange-300/10" />
              <div className="absolute bottom-[-8rem] left-[-5rem] h-72 w-72 rounded-full border border-orange-300/10" />

              <div className="relative z-10 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">A clearer way forward</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-orange-300">
                  <Sparkles className="h-4 w-4" />
                </span>
              </div>

              <div className="relative z-10 mx-auto mt-8 max-w-sm rounded-2xl border border-white/10 bg-[#2a2521]/90 p-5 shadow-xl backdrop-blur sm:mt-10 sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-[#1c1917] shadow-lg shadow-orange-950/30">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-dark-secondary">Your next chapter</p>
                    <h2 className="text-lg font-bold text-dark-primary">Starts with a good fit.</h2>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[
                    { icon: <Compass className="h-4 w-4" />, title: 'Discover roles', detail: 'Explore opportunities that interest you' },
                    { icon: <Sparkles className="h-4 w-4" />, title: 'Find your fit', detail: 'See how your experience lines up' },
                    { icon: <FileText className="h-4 w-4" />, title: 'Move forward', detail: 'Keep applications organized' },
                  ].map((item, index) => (
                    <div key={item.title} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/15 p-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${index === 1 ? 'bg-orange-500/15 text-orange-300' : 'bg-white/5 text-dark-secondary'}`}>
                        {item.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-dark-primary">{item.title}</p>
                        <p className="truncate text-xs text-dark-secondary">{item.detail}</p>
                      </div>
                      <Check className={`h-4 w-4 shrink-0 ${index === 1 ? 'text-orange-300' : 'text-dark-secondary/50'}`} />
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                  <div className="flex -space-x-2">
                    {['bg-orange-300', 'bg-amber-200', 'bg-rose-300', 'bg-orange-500'].map((color, index) => (
                      <span key={color} className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#2a2521] ${color} text-[#1c1917]`}>
                        {index === 3 ? <Users className="h-3.5 w-3.5" /> : <UserRound className="h-3.5 w-3.5" />}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-dark-secondary">Your journey, all in one place</span>
                </div>
              </div>
              <div className="absolute bottom-7 left-5 z-20 hidden items-center gap-2 rounded-full border border-white/10 bg-[#302923] px-3 py-2 text-xs font-medium text-dark-primary shadow-lg sm:flex sm:left-7">
                <span className="h-2 w-2 rounded-full bg-orange-400" /> Discover what’s next
              </div>
              <div className="absolute right-5 top-24 z-20 hidden items-center gap-2 rounded-full border border-white/10 bg-[#302923] px-3 py-2 text-xs font-medium text-dark-primary shadow-lg sm:flex sm:right-7">
                <Sparkles className="h-3.5 w-3.5 text-orange-300" /> Built around you
              </div>
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
              <p className="text-dark-secondary">Keep your hiring workflow moving with clear applicant status, direct messaging, and interview scheduling.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Hiring Sectors */}
      <section className="py-20 bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-dark-primary mb-3">Top Hiring Sectors This Week</h2>
          <p className="text-dark-secondary mb-10">See where demand for talent is growing fastest.</p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'Software Development', icon: <Briefcase className="h-5 w-5" /> },
              { name: 'Cloud Computing', icon: <Zap className="h-5 w-5" /> },
              { name: 'Artificial Intelligence', icon: <Sparkles className="h-5 w-5" /> },
              { name: 'Marketing', icon: <TrendingUp className="h-5 w-5" /> },
            ].map(sector => (
              <Link
                key={sector.name}
                to={`/jobs?search=${encodeURIComponent(sector.name)}`}
                className="group flex items-center justify-between rounded-xl border border-dark-border bg-dark-card p-5 transition hover:-translate-y-0.5 hover:border-lime-500/50"
              >
                <span className="font-semibold text-dark-primary">{sector.name}</span>
                <span className="text-lime-500 transition group-hover:translate-x-1">{sector.icon}</span>
              </Link>
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