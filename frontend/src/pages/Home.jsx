import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  FileText, 
  Zap, 
  Settings, 
  ShieldCheck, 
  ArrowRight, 
  Layers, 
  Download, 
  Printer 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const { isAuthenticated } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden px-6 py-12 md:py-20 flex flex-col items-center">
      
      {/* Visual background bubbles for premium wow-factor */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 bg-glow-bubble pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-violet-500/10 dark:bg-violet-500/15 bg-glow-bubble pointer-events-none" />

      {/* HERO HERO CONTAINER */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-5xl text-center flex flex-col items-center relative z-10"
      >
        {/* Glow AI Chip */}
        <motion.div 
          variants={itemVariants}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300 border border-indigo-500/20 text-xs font-semibold uppercase tracking-wider mb-6 shadow-glow"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Next-Gen AI Document Digitizer
        </motion.div>

        {/* Catchy Main Heading */}
        <motion.h1 
          variants={itemVariants}
          className="text-4xl sm:text-6xl font-black tracking-tight text-slate-800 dark:text-white leading-[1.1] mb-6"
        >
          Format Messy Exam Papers <br />
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 dark:from-indigo-400 dark:via-violet-400 dark:to-indigo-300 bg-clip-text text-transparent">
            Into Beautiful Word Docs
          </span>
        </motion.h1>

        {/* Sub-paragraph */}
        <motion.p 
          variants={itemVariants}
          className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mb-10 leading-relaxed font-medium"
        >
          Upload handwritten notes, scanned PDFs, or messy mock exams. Our advanced AI scans, structures sections, maps marks, and designs clean Microsoft Word (.docx) papers in seconds.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 mb-16 justify-center w-full max-w-md"
        >
          {isAuthenticated ? (
            <Link 
              to="/dashboard"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg shadow-glow hover:scale-[1.02] transition-all duration-200"
            >
              Go to Dashboard
              <ArrowRight className="h-5 w-5" />
            </Link>
          ) : (
            <>
              <Link 
                to="/register"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg shadow-glow hover:scale-[1.02] transition-all duration-200"
              >
                Start Formatter Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link 
                to="/login"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-white font-bold text-lg border border-slate-300/30 dark:border-slate-800 transition-all duration-200"
              >
                Log In
              </Link>
            </>
          )}
        </motion.div>

        {/* BENEFIT HIGHLIGHT CARDS GRID */}
        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mt-4"
        >
          
          {/* Card 1 */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="rounded-3xl p-6 glass-card border border-white/20 dark:border-slate-800/40 shadow-glass"
          >
            <div className="bg-indigo-500/10 p-3 rounded-2xl text-indigo-600 dark:text-indigo-400 w-fit mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              Optical Character Recognition
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
              Powered by advanced OCR processing to read text from low-contrast smartphone pictures, scans, or vector PDFs in English and Hindi.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="rounded-3xl p-6 glass-card border border-white/20 dark:border-slate-800/40 shadow-glass"
          >
            <div className="bg-violet-500/10 p-3 rounded-2xl text-violet-600 dark:text-violet-400 w-fit mb-4">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              Intelligent Format Parsing
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
              Automatically structures exam sections, detects question numbering, identifies multiple-choice options, matches instructions, and parses marks.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="rounded-3xl p-6 glass-card border border-white/20 dark:border-slate-800/40 shadow-glass"
          >
            <div className="bg-emerald-500/10 p-3 rounded-2xl text-emerald-600 dark:text-emerald-400 w-fit mb-4">
              <Download className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              Premium Word Exporter
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
              Generates beautiful, ready-to-print Microsoft Word files complete with matching school titles, double-lined separators, grid alignments, and A4 margins.
            </p>
          </motion.div>

        </motion.div>

        {/* SPLIT SCREEN PREVIEW BANNER SHOT */}
        <motion.div 
          variants={itemVariants}
          className="w-full mt-20 relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800 bg-slate-900 p-2 group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 mix-blend-overlay" />
          <div className="rounded-2xl overflow-hidden bg-slate-950 p-6 flex flex-col gap-3 text-left">
            
            {/* Header Mock bar */}
            <div className="flex items-center gap-1.5 pb-4 border-b border-slate-800">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="ml-2 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Interactive Split Editor & Live Mock Preview
              </span>
            </div>

            {/* Split Screen Mockup */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {/* Left Column (Mock Editor UI) */}
              <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 flex flex-col gap-3">
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Interactive Questionnaire Builder</span>
                <div className="flex gap-2">
                  <div className="bg-slate-800 h-6 w-8 rounded text-center text-xs text-indigo-300 font-bold">Q1</div>
                  <div className="bg-slate-800 h-6 flex-1 rounded px-2 text-xs text-slate-300 py-0.5">Which of the following is a primary greenhouse gas?</div>
                  <div className="bg-indigo-950 text-indigo-300 h-6 w-10 rounded text-center text-xs font-bold py-0.5">[1m]</div>
                </div>
                <div className="ml-8 flex flex-col gap-1.5 text-xs text-slate-400">
                  <div className="flex gap-2"><div className="bg-slate-800 rounded-full h-4 w-4 text-[10px] text-center">A</div><div>Carbon Dioxide</div></div>
                  <div className="flex gap-2"><div className="bg-slate-800 rounded-full h-4 w-4 text-[10px] text-center">B</div><div>Oxygen</div></div>
                  <div className="flex gap-2"><div className="bg-slate-800 rounded-full h-4 w-4 text-[10px] text-center">C</div><div>Nitrogen</div></div>
                </div>
              </div>
              {/* Right Column (Mock Printable Document UI) */}
              <div className="bg-white rounded-xl p-6 shadow-lg text-slate-900 text-xs flex flex-col gap-2 font-serif border border-slate-200">
                <div className="text-center font-bold text-[10px] border-b pb-2 uppercase tracking-wide">Delhi Public School - Science Exam</div>
                <div className="flex justify-between font-bold text-[8px] text-slate-500 mb-2">
                  <span>TIME ALLOWED: 3 HOURS</span>
                  <span>MAXIMUM MARKS: 80</span>
                </div>
                <div className="flex justify-between items-start leading-tight">
                  <div>
                    <span className="font-bold">Q1. </span>
                    Which of the following is a primary greenhouse gas?
                  </div>
                  <span className="font-bold">[1]</span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 ml-4 mt-1 font-sans text-slate-700 text-[10px]">
                  <span>A) Carbon Dioxide</span>
                  <span>B) Oxygen</span>
                  <span>C) Nitrogen</span>
                  <span>D) Argon</span>
                </div>
              </div>
            </div>

          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
