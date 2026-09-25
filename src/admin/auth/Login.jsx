import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from './AuthContext';

const Login = () => {
  const { login, resetPassword, accessError, isAuthenticated, loading: authLoading } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  if (!authLoading && isAuthenticated) {
    const redirectTo = location.state?.from?.pathname || '/admin';
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch {
      setError('Incorrect email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError('Enter your email above first, then click "Forgot password?".');
      return;
    }
    try {
      await resetPassword(email);
    } catch {
      // Deliberately the same message either way, so this can't be used to check
      // which emails have accounts.
    }
    setInfo(`If ${email.trim()} has an account, a password-reset link is on its way. Check your inbox and spam folder.`);
  };

  const shownError = error || accessError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-primary/5 border border-border p-8">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-primary to-teal rounded-2xl flex items-center justify-center mb-4">
            <ShieldCheck size={26} className="text-white" />
          </div>
          <h2 className="mb-1">Staff Sign In</h2>
          <p className="text-text-muted text-sm">AArambh Hospital Billing &amp; Therapy Management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">Email</label>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="you@aarambh.in"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-text-dark">Password</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-semibold text-primary cursor-pointer hover:text-teal transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          {shownError && <p className="text-sm text-red-600">{shownError}</p>}
          {info && <p className="text-sm text-teal">{info}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-teal text-white font-semibold px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
            {!submitting && <LogIn size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
