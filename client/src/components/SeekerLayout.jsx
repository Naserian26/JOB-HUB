import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Briefcase, LayoutDashboard, FileText, User,
  Settings, LogOut, Building2, Menu, X, Bell,
} from 'lucide-react';

const SeekerLayout = ({ children, profile }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'U';

  const navLinks = [
    { to: '/seeker/dashboard', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard' },
    { to: '/jobs', icon: <Briefcase className="h-5 w-5" />, label: 'Find Jobs' },
    { to: '/companies', icon: <Building2 className="h-5 w-5" />, label: 'Companies' },
    { to: '/applications', icon: <FileText className="h-5 w-5" />, label: 'My Applications' },
    { to: '/seeker/profile', icon: <User className="h-5 w-5" />, label: 'My Profile' },
    { to: '/seeker/settings', icon: <Settings className="h-5 w-5" />, label: 'Settings' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">

      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-indigo-600">JobHub</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </nav>

        <button
          onClick={() => setIsSidebarOpen(false)}
          className="absolute right-4 top-4 text-gray-400 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </aside>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600">
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600">
                <Briefcase className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-indigo-600">JobHub</span>
            </div>
          </div>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <button className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-500" />
            </button>
            <div className="hidden h-8 w-px bg-gray-200 md:block" />
            <button
              onClick={() => navigate('/seeker/profile')}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-50"
            >
              {profile?.photoUrl ? (
                <img src={profile.photoUrl} alt="Profile" className="h-8 w-8 rounded-full object-cover border border-indigo-200" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-indigo-200 bg-indigo-100 text-sm font-bold text-indigo-700">
                  {initials}
                </div>
              )}
              <div className="hidden text-left md:block">
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">Job Seeker</p>
              </div>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SeekerLayout;