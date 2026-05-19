import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, ClipboardList, Briefcase, Plus, Bell, LogOut, Building2, Settings, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const EmployerLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'EM';

  const location = useLocation();

  const navItems = [
  { path: '/employer/dashboard', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { path: '/employer/applications', label: 'Applications', icon: <ClipboardList className="w-4 h-4" /> },
  { path: '/employer/manage-jobs', label: 'Manage Jobs', icon: <Briefcase className="w-4 h-4" /> },
];

  const accountItems = [
    { path: '/employer/company-profile', label: 'Company Profile', icon: <Building2 className="w-4 h-4" /> },
    { path: '/employer/settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="flex min-h-screen bg-[#f4f3f0]">

      {/* Sidebar */}
      <aside className="w-60 bg-[#0f0f0f] flex flex-col fixed top-0 left-0 h-screen z-20">

        {/* Brand */}
        <div className="px-5 py-5 flex items-center border-b border-white/8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="bg-indigo-500 p-1.5 rounded-lg">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold text-[15px] tracking-tight">JobHub</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          <p className="text-[10px] text-white/25 uppercase tracking-widest px-2 pb-1.5 font-medium">Main</p>
          {navItems.map(item => (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition
                ${location.pathname === item.path
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-white/45 hover:bg-white/5 hover:text-white/75'}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}

          <p className="text-[10px] text-white/25 uppercase tracking-widest px-2 pb-1.5 pt-4 font-medium">Account</p>
          {accountItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition
                ${location.pathname === item.path
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-white/45 hover:bg-white/5 hover:text-white/75'}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-5 flex flex-col gap-2 border-t border-white/8 pt-3">
          <Link
            to="/employer/add-job"
            className="flex items-center justify-center gap-2 w-full bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-indigo-600 transition"
          >
            <Plus className="w-4 h-4" /> Post a Job
          </Link>
        </div>
      </aside>

      {/* Right side */}
      <div className="ml-60 flex-1 flex flex-col min-h-screen">

        {/* Top Header */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-end px-8 gap-4 sticky top-0 z-10">
          <Link to="/employer/notifications" className="relative text-gray-400 hover:text-gray-600 transition">
            <Bell className="w-5 h-5" />
          </Link>

          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 hover:opacity-80 transition"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-[12px]">
                {initials}
              </div>
              <span className="text-[13px] font-medium text-gray-700 hidden sm:block">{user?.companyName || user?.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-11 w-52 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 z-50">
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <p className="text-[13px] font-semibold text-gray-800 truncate">{user?.companyName || user?.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                </div>
                <Link
                  to="/employer/company-profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-600 hover:bg-gray-50 transition"
                >
                  <Building2 className="w-4 h-4" /> Company Profile
                </Link>
                <Link
                  to="/employer/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-600 hover:bg-gray-50 transition"
                >
                  <Settings className="w-4 h-4" /> Settings
                </Link>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={() => { logout(); setDropdownOpen(false); }}
                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-red-500 hover:bg-red-50 transition w-full"
                  >
                    <LogOut className="w-4 h-4" /> Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default EmployerLayout;