import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, ArrowRight, AlertTriangle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Failed to authenticate');
    }
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center px-4 py-12">
      
      {/* Background bubble */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-indigo-500/10 bg-glow-bubble pointer-events-none" />

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-3xl glass-card shadow-glass p-8 border border-white/20 dark:border-slate-800/40 relative z-10"
      >
        
        {/* Title */}
        <div className="text-center mb-8">
          <div className="mx-auto bg-indigo-600/10 p-3 rounded-2xl w-fit text-indigo-600 dark:text-indigo-400 mb-4 shadow-glow">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white">
            Welcome Back
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            Log in to manage and format your question drafts
          </p>
        </div>

        {/* Errors display */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3.5 mb-6 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/20 text-sm font-medium"
          >
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Email field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all duration-200 text-sm"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all duration-200 text-sm"
              />
            </div>
          </div>

          {/* Submit */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold text-base shadow-glow hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <LogIn className="h-5 w-5" />
          </button>

        </form>

        {/* Footer info link */}
        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Don't have an account?{' '}
          <Link 
            to="/register" 
            className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5"
          >
            Sign up now
            <ArrowRight className="h-4.5 w-4.5" />
          </Link>
        </div>

      </motion.div>
    </div>
  );
}
