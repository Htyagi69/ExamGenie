import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  FileText, 
  Trash2, 
  Edit3, 
  Sparkles, 
  FolderOpen, 
  Layers, 
  Clock, 
  ChevronRight, 
  AlertTriangle,
  X,
  FileCheck,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // States
  const [papers, setPapers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Custom Template Modal States
  const [showModal, setShowModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [questionSpacing, setQuestionSpacing] = useState(8);
  const [marksAlignment, setMarksAlignment] = useState('right');
  const [borderStyle, setBorderStyle] = useState('none');
  const [modalStatus, setModalStatus] = useState('');

  // Fetch initial dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // Execute parallel requests
      const [papersRes, templatesRes] = await Promise.all([
        api.get('/exams'),
        api.get('/templates')
      ]);

      if (papersRes.data.success) {
        setPapers(papersRes.data.data);
      }
      if (templatesRes.data.success) {
        setTemplates(templatesRes.data.data);
      }
    } catch (err) {
      console.error('Fetch dashboard failed:', err);
      setError('Could not connect to MongoDB server to fetch drafts.');
    } finally {
      setLoading(false);
    }
  };

  // Draft Actions
  const handleEditPaper = (paper) => {
    navigate('/editor', { state: { examData: paper } });
  };

  const handleDeletePaper = async (paperId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this exam paper draft?')) return;
    
    try {
      const res = await api.delete(`/exams/${paperId}`);
      if (res.data.success) {
        setPapers(prev => prev.filter(p => p._id !== paperId));
      }
    } catch (err) {
      console.error('Delete paper draft failed:', err);
    }
  };

  // Template Actions
  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    setModalStatus('Saving custom template...');
    
    if (!templateName.trim()) {
      setModalStatus('Please provide a template name.');
      return;
    }

    try {
      const res = await api.post('/templates', {
        name: templateName,
        fontFamily,
        questionSpacing: parseInt(questionSpacing) || 8,
        marksAlignment,
        borderStyle,
        headerStyle: {
          alignment: 'center',
          showLogoSpace: false,
          showDividerLine: true,
          subtitleFontSize: 12
        }
      });

      if (res.data.success) {
        setTemplates(prev => [...prev, res.data.data]);
        setModalStatus('Template saved successfully!');
        
        // Reset and close
        setTimeout(() => {
          setShowModal(false);
          setTemplateName('');
          setModalStatus('');
        }, 1500);
      }
    } catch (err) {
      console.error('Create template failed:', err);
      setModalStatus('Error saving custom template.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col gap-10 min-h-[85vh]">
      
      {/* 1. WELCOME HEADER HERO */}
      <div className="rounded-3xl glass-card border border-white/20 dark:border-slate-800/40 shadow-glass p-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* visual bubble */}
        <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-indigo-500/10 bg-glow-bubble" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-150 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-500/20">
              Cloud Console
            </span>
            <Sparkles className="h-4 w-4 text-indigo-500 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white">
            Welcome, {user?.username || 'Professor'}!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Digitize handwritten sheets, organize question layouts, and manage custom visual school profiles
          </p>
        </div>

        <Link 
          to="/upload"
          className="flex items-center justify-center gap-1.5 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-base shadow-glow hover:scale-[1.01] transition-transform shrink-0"
        >
          <Plus className="h-5 w-5" />
          Format New Exam
        </Link>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Card 1 */}
        <div className="rounded-3xl p-6 glass-card border border-white/20 dark:border-slate-800/40 shadow-glass flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-450 uppercase tracking-widest block">Saved Papers</span>
            <span className="text-3xl font-black text-slate-800 dark:text-white mt-1 block">
              {papers.length}
            </span>
          </div>
          <div className="bg-indigo-500/10 p-4 rounded-2xl text-indigo-600 dark:text-indigo-400 shadow-glow">
            <FolderOpen className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="rounded-3xl p-6 glass-card border border-white/20 dark:border-slate-800/40 shadow-glass flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-450 uppercase tracking-widest block">School Formats</span>
            <span className="text-3xl font-black text-slate-800 dark:text-white mt-1 block">
              {templates.length}
            </span>
          </div>
          <div className="bg-violet-500/10 p-4 rounded-2xl text-violet-600 dark:text-violet-400 shadow-glow">
            <Layers className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="rounded-3xl p-6 glass-card border border-white/20 dark:border-slate-800/40 shadow-glass flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-450 uppercase tracking-widest block">System Status</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              AI Parser Online
            </span>
          </div>
          <div className="bg-emerald-500/10 p-4 rounded-2xl text-emerald-600 dark:text-emerald-400 shadow-glow-green">
            <FileCheck className="h-6 w-6" />
          </div>
        </div>

      </div>

      {/* Errors Alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/20 text-sm font-medium">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
          <button onClick={fetchDashboardData} className="ml-auto font-bold underline text-xs">Retry</button>
        </div>
      )}

      {/* 3. DOUBLE-COLUMN: DRAFTS AND TEMPLATES LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN - SAVED PAPERS LISTING */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              Your Saved Exam Drafts
            </h2>
          </div>

          {loading ? (
            <div className="rounded-3xl p-10 bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 text-center text-slate-400">
              Loading saved papers...
            </div>
          ) : papers.length === 0 ? (
            <div className="rounded-3xl p-10 bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 text-center text-slate-500 space-y-3">
              <p>You haven't formatted or saved any exam papers yet.</p>
              <Link 
                to="/upload" 
                className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Upload source file to start <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {papers.map(p => (
                <div 
                  key={p._id}
                  onClick={() => handleEditPaper(p)}
                  className="rounded-2xl p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between min-h-[160px] group"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-600 dark:text-slate-300">
                      {p.subject || 'General'}
                    </span>
                    <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                      {p.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {p.subtitle || 'Class Final Exam'}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-900 mt-4 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPaper(p);
                        }}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-500 transition-colors"
                        title="Edit Exam"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={(e) => handleDeletePaper(p._id, e)}
                        className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-450 hover:text-rose-500 transition-colors"
                        title="Delete Exam"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - TEMPLATES MANAGEMENT */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-500" />
              School Templates
            </h2>
            <button 
              onClick={() => setShowModal(true)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5"
            >
              <Plus className="h-4 w-4" /> Add Preset
            </button>
          </div>

          {/* Templates list */}
          <div className="space-y-3">
            {templates.map(t => (
              <div 
                key={t._id}
                className="rounded-2xl p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between"
              >
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                    {t.name}
                  </h4>
                  <div className="flex gap-1.5 text-[9px] font-bold text-slate-400">
                    <span className="uppercase">{t.fontFamily}</span>
                    <span>•</span>
                    <span>{t.questionSpacing}pt Spacing</span>
                    <span>•</span>
                    <span className="uppercase">{t.marksAlignment} marks</span>
                  </div>
                </div>

                {t.isPublic ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 shrink-0">
                    Standard
                  </span>
                ) : (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 shrink-0">
                    Custom
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. DIALOG MODAL - CUSTOM VISUAL FORMAT CREATOR */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Modal backdrop background */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Modal form */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl relative z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-xl text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Settings className="h-5 w-5 text-indigo-500" />
                  Custom Layout Profile
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {modalStatus && (
                <div className="p-3 mb-4 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-350">
                  {modalStatus}
                </div>
              )}

              <form onSubmit={handleCreateTemplate} className="space-y-4">
                
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">School Name Preset</label>
                  <input 
                    type="text"
                    required
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g. St. Xaviers Format"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-indigo-500 text-xs font-semibold"
                  />
                </div>

                {/* Typography */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Typography Font</label>
                  <select 
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800"
                  >
                    <option value="Arial">Arial (Modern)</option>
                    <option value="Times New Roman">Times New Roman (Board)</option>
                    <option value="Calibri">Calibri (Classic)</option>
                  </select>
                </div>

                {/* Marks */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Marks Alignment</label>
                  <select 
                    value={marksAlignment}
                    onChange={(e) => setMarksAlignment(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800"
                  >
                    <option value="right">Right-Aligned Margins [5]</option>
                    <option value="inline">Inline Parentheses (5)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Spacing */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Spacing (pt)</label>
                    <input 
                      type="number"
                      required
                      value={questionSpacing}
                      onChange={(e) => setQuestionSpacing(parseInt(e.target.value) || 8)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-indigo-500 text-xs font-semibold"
                    />
                  </div>

                  {/* Border style */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Separators</label>
                    <select 
                      value={borderStyle}
                      onChange={(e) => setBorderStyle(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800"
                    >
                      <option value="none">No Border</option>
                      <option value="single">Single Box Outline</option>
                      <option value="double">Double Section Breaks</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-glow mt-4 transition-transform active:scale-[0.99]"
                >
                  Save Style Profile
                </button>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
