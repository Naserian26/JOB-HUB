import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      login(res.data.user, res.data.token);
      if (res.data.user.role === 'employer') {
        navigate('/employer/dashboard');
      } else {
        navigate('/seeker/dashboard');
      }
    } catch (error) {
      console.error(error);
      alert('Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-dark-card rounded-xl border border-dark-border p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-dark-primary">Welcome Back</h2>
          <p className="mt-2 text-dark-secondary">Sign in to your JobHub account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
                onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                type="password" 
                required 
                className="focus:ring-lime-500 focus:border-lime-500 block w-full pl-10 sm:text-sm border-dark-border rounded-md py-2 border bg-dark-bg text-dark-primary placeholder-dark-secondary/50" 
                placeholder="•••••••••"
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            <div className="flex justify-end mt-1">
              <Link to="/forgot-password" className="text-xs text-lime-500 hover:text-lime-600">
                Forgot password?
              </Link>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-dark-bg bg-lime-500 hover:bg-lime-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500"
          >
            Sign In <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-dark-secondary">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-lime-500 hover:text-lime-600">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;