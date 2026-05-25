import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Briefcase, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

const Register = () => {
  const [role, setRole] = useState('seeker');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', {
        ...formData,
        role
      });
      login(res.data.user, res.data.token);
      if (role === 'seeker') {
        navigate('/seeker/dashboard');
      } else {
        navigate('/employer/dashboard');
      }
    } catch (error) {
      console.error(error);
      alert('Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-dark-card rounded-xl border border-dark-border p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-dark-primary">Create Account</h2>
          <p className="mt-2 text-dark-secondary">Join JobHub today</p>
        </div>

        {/* Role Selection Toggle */}
        <div className="flex bg-dark-bg p-1 rounded-lg mb-6 border border-dark-border">
          <button
            onClick={() => setRole('seeker')}
            className={`flex-1 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition ${
              role === 'seeker'
                ? 'bg-dark-card text-lime-500 border border-lime-500/50'
                : 'text-dark-secondary'
            }`}
          >
            <User className="w-4 h-4" /> Job Seeker
          </button>
          <button
            onClick={() => setRole('employer')}
            className={`flex-1 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition ${
              role === 'employer'
                ? 'bg-dark-card text-lime-500 border border-lime-500/50'
                : 'text-dark-secondary'
            }`}
          >
            <Briefcase className="w-4 h-4" /> Employer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-dark-primary">Full Name</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-dark-secondary/50" />
              </div>
              <input
                type="text"
                required
                className="focus:ring-lime-500 focus:border-lime-500 block w-full pl-10 sm:text-sm border-dark-border rounded-md py-2 border bg-dark-bg text-dark-primary placeholder-dark-secondary/50"
                placeholder="John Doe"
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-primary">Email Address</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-dark-secondary/50" />
              </div>
              <input
                type="email"
                required
                className="focus:ring-lime-500 focus:border-lime-500 block w-full pl-10 sm:text-sm border-dark-border rounded-md py-2 border bg-dark-bg text-dark-primary placeholder-dark-secondary/50"
                placeholder="you@example.com"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-primary">Password</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-dark-secondary/50" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="focus:ring-lime-500 focus:border-lime-500 block w-full pl-10 pr-10 sm:text-sm border-dark-border rounded-md py-2 border bg-dark-bg text-dark-primary placeholder-dark-secondary/50"
                placeholder="•••••••••"
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-dark-secondary/50 hover:text-dark-secondary transition"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-dark-bg bg-lime-500 hover:bg-lime-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500"
          >
            Create Account
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-dark-secondary">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-lime-500 hover:text-lime-600">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;