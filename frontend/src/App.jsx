import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Import components & pages
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/Upload';
import Editor from './pages/Editor';

// Protected Route Guard Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-550">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-650 border-t-transparent animate-spin" />
          <span className="text-sm font-bold uppercase tracking-wider text-slate-400">Verifying session...</span>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Inner App Layout
function AppContent() {
  return (
    <div className="flex flex-col min-h-screen transition-colors duration-300">
      {/* Universal responsive Navigation bar */}
      <Navbar />
      
      {/* Dynamic router wrapper */}
      <main className="flex-1 flex flex-col w-full relative z-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Area */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/upload" 
            element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/editor" 
            element={
              <ProtectedRoute>
                <Editor />
              </ProtectedRoute>
            } 
          />
          
          {/* Wildcard redirect back to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer bar */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
