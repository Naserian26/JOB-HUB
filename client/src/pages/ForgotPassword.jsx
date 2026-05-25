import { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-dark-card rounded-xl border border-dark-border p-8">

        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-dark-primary">Reset Password</h2>
          <p className="mt-2 text-dark-secondary text-sm">
            {sent
              ? "Check your email for reset instructions."
              : "Enter your email and we'll send you a reset link."}
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-lime-500/10 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-lime-500" />
            </div>
            <p className="text-dark-secondary text-sm">
              We sent a reset link to <strong className="text-dark-primary">{email}</strong>.
              Check your inbox and spam folder.
            </p>
            <Link to="/login" className="inline-flex items-center gap-2 text-lime-500 hover:text-lime-400 text-sm font-medium">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-dark-primary mb-1">
                Email Address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-dark-secondary/50" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="focus:ring-lime-500 focus:border-lime-500 block w-full pl-10 sm:text-sm border-dark-border rounded-md py-2 border bg-dark-bg text-dark-primary placeholder-dark-secondary/50"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-dark-bg bg-lime-500 hover:bg-lime-600 focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>

            <div className="text-center">
              <Link to="/login" className="inline-flex items-center gap-2 text-dark-secondary hover:text-lime-500 text-sm">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;