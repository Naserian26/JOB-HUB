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
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">JobHub</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {(!user || user.role !== 'employer') && (
              <>
                <Link to="/jobs" className="text-gray-600 hover:text-indigo-600 font-medium">Find Jobs</Link>
                <Link to="/companies" className="text-gray-600 hover:text-indigo-600 font-medium">Companies</Link>
              </>
            )}

            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  to={user.role === 'seeker' ? '/seeker/dashboard' : '/employer/dashboard'}
                  className="text-indigo-600 font-semibold"
                >
                  Dashboard
                </Link>
                <button onClick={logout} className="text-gray-500 hover:text-red-500 text-sm">Logout</button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="flex items-center gap-1 text-gray-600 hover:text-indigo-600 font-medium">
                  <LogIn className="w-4 h-4" /> Log In
                </Link>
                <Link to="/register" className="flex items-center gap-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-bold">
                  <UserPlus className="w-4 h-4" /> Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-indigo-600 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {(!user || user.role !== 'employer') && (
              <>
                <Link to="/jobs" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md" onClick={() => setIsMobileMenuOpen(false)}>Find Jobs</Link>
                <Link to="/companies" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md" onClick={() => setIsMobileMenuOpen(false)}>Companies</Link>
              </>
            )}

            {user ? (
              <>
                <Link
                  to={user.role === 'seeker' ? '/seeker/dashboard' : '/employer/dashboard'}
                  className="block px-3 py-2 text-base font-medium text-indigo-600 hover:bg-indigo-50 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 rounded-md" onClick={() => setIsMobileMenuOpen(false)}>Log In</Link>
                <Link to="/register" className="block px-3 py-2 text-base font-medium bg-indigo-600 text-white rounded-md mt-2 text-center" onClick={() => setIsMobileMenuOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;