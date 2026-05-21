import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Briefcase, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const hiddenRoutes = ['/seeker/dashboard', '/employer/dashboard', '/seeker/profile', '/applications', '/settings'];
  const isHidden = hiddenRoutes.some((route) => location.pathname.startsWith(route));
  if (isHidden) return null;

  return (
    <nav className="bg-dark-bg border-b border-dark-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-lime-500 p-1.5 rounded-lg">
                <Briefcase className="h-6 w-6 text-dark-bg" />
              </div>
              <span className="text-xl font-bold text-dark-primary">JobHub</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {(!user || user.role !== 'employer') && (
              <>
                <Link to="/jobs" className="text-dark-secondary hover:text-lime-500 font-medium">Find Jobs</Link>
                <Link to="/companies" className="text-dark-secondary hover:text-lime-500 font-medium">Companies</Link>
              </>
            )}

            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  to={user.role === 'seeker' ? '/seeker/dashboard' : '/employer/dashboard'}
                  className="text-lime-500 font-semibold"
                >
                  Dashboard
                </Link>
                <button onClick={logout} className="text-dark-secondary hover:text-red-400 text-sm">Logout</button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="flex items-center gap-1 text-dark-secondary hover:text-lime-500 font-medium">
                  <LogIn className="w-4 h-4" /> Log In
                </Link>
                <Link to="/register" className="flex items-center gap-1 bg-lime-500 text-dark-bg px-4 py-2 rounded-lg hover:bg-lime-600 transition text-sm font-bold">
                  <UserPlus className="w-4 h-4" /> Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-dark-secondary hover:text-lime-500 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-dark-sidebar border-t border-dark-border">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {(!user || user.role !== 'employer') && (
              <>
                <Link to="/jobs" className="block px-3 py-2 text-base font-medium text-dark-secondary hover:text-lime-500 hover:bg-dark-card rounded-md" onClick={() => setIsMobileMenuOpen(false)}>Find Jobs</Link>
                <Link to="/companies" className="block px-3 py-2 text-base font-medium text-dark-secondary hover:text-lime-500 hover:bg-dark-card rounded-md" onClick={() => setIsMobileMenuOpen(false)}>Companies</Link>
              </>
            )}

            {user ? (
              <>
                <Link
                  to={user.role === 'seeker' ? '/seeker/dashboard' : '/employer/dashboard'}
                  className="block px-3 py-2 text-base font-medium text-lime-500 hover:bg-dark-card rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-red-400 hover:bg-dark-card rounded-md"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-3 py-2 text-base font-medium text-dark-secondary hover:text-lime-500 hover:bg-dark-card rounded-md" onClick={() => setIsMobileMenuOpen(false)}>Log In</Link>
                <Link to="/register" className="block px-3 py-2 text-base font-semibold bg-lime-500 text-dark-bg rounded-md mt-2 text-center" onClick={() => setIsMobileMenuOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;