import React from 'react';
import { Sparkles, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full mt-auto py-6 px-6 border-t border-slate-200/50 dark:border-slate-900/50 no-print">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
        
        {/* LOGO FOOTER */}
        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          <span>ExamGenie AI</span>
        </div>

        {/* COPYRIGHT */}
        <div className="text-center md:text-left">
          &copy; {new Date().getFullYear()} ExamGenie. All rights reserved. Secure Cloud Archiving.
        </div>

        {/* CREDIT */}
        <div className="flex items-center gap-1">
          <span>Made with</span>
          <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
          <span>for Teachers & Students</span>
        </div>

      </div>
    </footer>
  );
}
