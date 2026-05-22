import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, LogOut, FileText, Upload, User, LayoutDashboard, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <motion.nav 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 w-full px-6 py-4 transition-all duration-300 no-print"
    >
      <div className="mx-auto max-w-7xl rounded-2xl glass-card shadow-glass flex items-center justify-between px-6 py-3 border border-white/20 dark:border-slate-800/40">
        
        {/* LOGO LINK */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-indigo-600 dark:bg-indigo-500 p-2 rounded-xl text-white shadow-glow group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 dark:from-indigo-400 dark:via-violet-400 dark:to-indigo-300 bg-clip-text text-transparent">
              ExamGenie
            </span>
            <span className="ml-1 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/30">
              AI
            </span>
          </div>
        </Link>

        {/* NAVIGATION LINKS */}
        <div className="hidden md:flex items-center gap-1 font-medium">
          {isAuthenticated && (
            <>
              <Link 
                to="/dashboard" 
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all duration-200 ${
                  isActive('/dashboard') 
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-semibold' 
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-900/50'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              
              <Link 
                to="/upload" 
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all duration-200 ${
                  isActive('/upload') 
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-semibold' 
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-900/50'
                }`}
              >
                <Upload className="h-4 w-4" />
                Upload Paper
              </Link>
            </>
          )}
        </div>

        {/* RIGHT SIDE OPTIONS */}
        <div className="flex items-center gap-3">
          
          {/* THEME TOGGLER */}
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900/80 transition-colors text-slate-600 dark:text-slate-300"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="h-4.5 w-4.5 text-yellow-400" /> : <Moon className="h-4.5 w-4.5" />}
          </button>

          {/* AUTH OPTIONS */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {user.username}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {user.email}
                </span>
              </div>
              <div className="bg-slate-200/80 dark:bg-slate-800 p-1.5 rounded-full text-slate-700 dark:text-slate-300 border border-slate-300/30 dark:border-slate-700/50">
                <User className="h-4 w-4" />
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center justify-center p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors border border-rose-200/20"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <Link 
                to="/login"
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
              >
                Log In
              </Link>
              <Link 
                to="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all duration-200 shadow-glow"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

      </div>
    </motion.nav>
  );
}
