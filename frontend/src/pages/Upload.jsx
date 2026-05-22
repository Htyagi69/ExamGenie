import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
  Upload, 
  FileText, 
  Sparkles, 
  FileCheck, 
  AlertTriangle,
  RotateCcw, 
  Languages, 
  ArrowRight,
  Plus,
  Trash2,
  FileSpreadsheet,
  Info,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UploadPage() {
  const navigate = useNavigate();
  const headerInputRef = useRef(null);
  const questionsInputRef = useRef(null);

  // STEPPING FLOW STATE
  const [currentStep, setCurrentStep] = useState(1); // Step 1: Header, Step 2: Questions

  // STEP 1 STATES (HEADER & METADATA)
  const [headerFile, setHeaderFile] = useState(null);
  const [headerPreview, setHeaderPreview] = useState(null);
  const [headerData, setHeaderData] = useState({
    title: '',
    subtitle: '',
    subject: '',
    timeAllowed: '3 Hours',
    maxMarks: 100,
    generalInstructions: []
  });
  const [headerConfirmed, setHeaderConfirmed] = useState(false);

  // STEP 2 STATES (MULTIPLE QUESTION PAGES)
  const [questionPages, setQuestionPages] = useState([]); // Array of objects: { id, file, preview }
  
  // SHARED STATES
  const [ocrLang, setOcrLang] = useState('eng+hin');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [processStage, setProcessStage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const validateFile = (selectedFile) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Unsupported file type. Please upload a PNG, JPG, or PDF file.');
      return false;
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      setError('File too large. Maximum allowed size is 10MB.');
      return false;
    }
    return true;
  };

  // ==================== STEP 1 HANDLERS ====================
  const handleHeaderDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    setError('');
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && validateFile(droppedFile)) {
      setHeaderFile(droppedFile);
      if (droppedFile.type.startsWith('image/')) {
        setHeaderPreview(URL.createObjectURL(droppedFile));
      } else {
        setHeaderPreview(null);
      }
    }
  };

  const handleHeaderSelect = (e) => {
    setError('');
    const selectedFile = e.target.files[0];
    if (selectedFile && validateFile(selectedFile)) {
      setHeaderFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        setHeaderPreview(URL.createObjectURL(selectedFile));
      } else {
        setHeaderPreview(null);
      }
    }
  };

  const handleExtractHeader = async () => {
    if (!headerFile) return;

    setProcessing(true);
    setProcessStage('Uploading header template file...');
    setError('');

    const formData = new FormData();
    formData.append('file', headerFile);
    formData.append('lang', ocrLang);

    try {
      setProcessStage('Scanning header characters (OCR)...');
      const res = await api.post('/exams/upload-header', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setHeaderData(res.data.data);
        setHeaderConfirmed(true);
      } else {
        throw new Error(res.data.message || 'Failed to extract header details.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Header scan failed. Verify file clarity.');
    } finally {
      setProcessing(false);
      setProcessStage('');
    }
  };

  const handleHeaderInputChange = (key, value) => {
    setHeaderData(prev => ({ ...prev, [key]: value }));
  };

  const handleConfirmHeaderAndNext = () => {
    if (!headerData.title) {
      setError('Please provide at least a School / University Title to continue.');
      return;
    }
    setCurrentStep(2);
    setError('');
  };

  const resetHeaderStep = () => {
    setHeaderFile(null);
    setHeaderPreview(null);
    setHeaderConfirmed(false);
    setHeaderData({
      title: '',
      subtitle: '',
      subject: '',
      timeAllowed: '3 Hours',
      maxMarks: 100,
      generalInstructions: []
    });
    setError('');
  };

  // ==================== STEP 2 HANDLERS ====================
  const handleQuestionsDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    setError('');

    const droppedFiles = Array.from(e.dataTransfer.files);
    addQuestionPages(droppedFiles);
  };

  const handleQuestionsSelect = (e) => {
    setError('');
    const selectedFiles = Array.from(e.target.files);
    addQuestionPages(selectedFiles);
  };

  const addQuestionPages = (filesList) => {
    const validPages = [];
    filesList.forEach(file => {
      if (validateFile(file)) {
        validPages.push({
          id: 'page-' + Math.random().toString(36).substr(2, 9),
          file: file,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
        });
      }
    });

    setQuestionPages(prev => [...prev, ...validPages]);
  };

  const deleteQuestionPage = (id) => {
    setQuestionPages(prev => prev.filter(p => p.id !== id));
  };

  const handleExtractQuestions = async () => {
    if (questionPages.length === 0) {
      setError('Please upload at least one page containing handwritten questions.');
      return;
    }

    setProcessing(true);
    setError('');
    setProcessStage('Uploading batch of question sheets...');

    const formData = new FormData();
    questionPages.forEach(p => {
      formData.append('files', p.file);
    });
    formData.append('lang', ocrLang);

    try {
      setProcessStage('Sequentially processing pages via Tesseract OCR...');
      
      const res = await api.post('/exams/upload-questions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setProcessStage('Merging metadata and organizing sections...');
        
        // Merge Step 1 (Header details) and Step 2 (Extracted questions)
        const finalExamData = {
          ...headerData,
          sections: res.data.data.sections || []
        };

        // Redirect to Split Editor
        navigate('/editor', { state: { examData: finalExamData } });
      } else {
        throw new Error(res.data.message || 'Could not scan question pages.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Batch scan failed. Try adjusting page ordering.');
    } finally {
      setProcessing(false);
      setProcessStage('');
    }
  };

  return (
    <div className="relative max-w-5xl mx-auto px-6 py-12 flex flex-col min-h-[85vh] gap-8">
      
      {/* 1. PROGRESS STEP INDICATOR */}
      <div className="w-full flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-glass no-print">
        
        {/* Step 1 indicator */}
        <button 
          onClick={() => currentStep === 2 && !processing && setCurrentStep(1)}
          className={`flex items-center gap-3 text-left transition-colors focus:outline-none ${
            currentStep === 1 
              ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold'
          }`}
          disabled={processing}
        >
          <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-black ${
            currentStep === 1 
              ? 'bg-indigo-600 text-white shadow-glow' 
              : 'bg-emerald-600/10 text-emerald-600 border border-emerald-500/25'
          }`}>
            {headerConfirmed ? '✓' : '1'}
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest text-slate-450">Step One</h4>
            <span className="text-sm">Exam Title & Format</span>
          </div>
        </button>

        <div className="h-0.5 flex-1 mx-4 bg-slate-250 dark:bg-slate-800" />

        {/* Step 2 indicator */}
        <div className={`flex items-center gap-3 text-left ${
          currentStep === 2 
            ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' 
            : 'text-slate-400'
        }`}>
          <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-black ${
            currentStep === 2 
              ? 'bg-indigo-600 text-white shadow-glow' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}>
            2
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest text-slate-450">Step Two</h4>
            <span className="text-sm">Multiple Handwritten Pages</span>
          </div>
        </div>

      </div>

      {/* 2. ERROR DISPLAY */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/20 text-sm font-medium shadow-sm"
        >
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="p-1 rounded hover:bg-rose-100 text-rose-500">×</button>
        </motion.div>
      )}

      {/* 3. CORE TWO-STEP SCAN WORKFLOW VIEWS */}
      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          
          {processing ? (
            /* PIPELINE PROCESSING WORKFLOW LOADER */
            <motion.div 
              key="loader"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-3xl glass-card shadow-glass p-10 border border-white/20 dark:border-slate-800/40 text-center flex flex-col items-center justify-center gap-8 min-h-[400px]"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/30 rounded-full bg-glow-bubble scale-125 animate-pulse" />
                <div className="bg-indigo-600 text-white p-6 rounded-full shadow-glow relative z-10 animate-bounce">
                  <Sparkles className="h-10 w-10 animate-spin" style={{ animationDuration: '6s' }} />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                  Executing AI Digitizer
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-sm mx-auto font-medium">
                  {processStage || 'Performing OCR operations...'}
                </p>
              </div>
              <div className="w-full max-w-xs h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full animate-pulse w-[70%]" />
              </div>
            </motion.div>
          ) : currentStep === 1 ? (
            
            // ==================== STEP 1 VIEW ====================
            <motion.div 
              key="step-1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              
              {!headerConfirmed ? (
                /* Header Upload zone */
                <div className="space-y-4">
                  <div className="text-center">
                    <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">
                      Upload Rough Exam Layout Format
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Upload the page containing School Name, Session, and Rules. We will format your main header block.
                    </p>
                  </div>

                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleHeaderDrop}
                    onClick={() => !headerFile && headerInputRef.current.click()}
                    className={`rounded-3xl border-2 border-dashed p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 text-center select-none ${
                      isDragOver 
                        ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 shadow-glow' 
                        : headerFile
                          ? 'border-emerald-500/40 bg-emerald-500/5'
                          : 'border-slate-350 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:border-indigo-500'
                    }`}
                  >
                    <input 
                      type="file"
                      ref={headerInputRef}
                      onChange={handleHeaderSelect}
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="hidden"
                    />

                    {headerFile ? (
                      <div className="flex flex-col items-center gap-4">
                        {headerPreview ? (
                          <div className="relative rounded-2xl overflow-hidden h-36 border shadow-md">
                            <img src={headerPreview} alt="Header Preview" className="h-full object-contain" />
                          </div>
                        ) : (
                          <div className="bg-emerald-500/10 p-4 rounded-2xl text-emerald-600">
                            <FileCheck className="h-10 w-10" />
                          </div>
                        )}
                        <span className="font-bold text-sm text-slate-800 dark:text-white max-w-sm truncate block">{headerFile.name}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); resetHeaderStep(); }}
                          className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-850 hover:bg-slate-300 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                        >
                          Change File
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 py-6">
                        <div className="bg-indigo-500/10 p-4 rounded-2xl text-indigo-600 dark:text-indigo-400">
                          <Upload className="h-8 w-8 animate-bounce" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-855 dark:text-white">Drag & drop header format sheet</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Supports PNG, JPG, or PDF up to 10MB</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Manual entry / skip option info card */}
                  <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-200 dark:bg-slate-800 p-2 rounded-xl text-slate-550">
                        <Info className="h-4.5 w-4.5" />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Don't have a header sheet? You can fill out standard details manually and move directly to question scanning.
                      </p>
                    </div>
                    <button 
                      onClick={() => setHeaderConfirmed(true)}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold shrink-0 transition-colors"
                    >
                      Fill Header Manually
                    </button>
                  </div>

                  {headerFile && (
                    <button 
                      onClick={handleExtractHeader}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-glow transition-transform active:scale-[0.99] cursor-pointer"
                    >
                      Extract Title & Instructions
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : (
                /* Confirmed/Editable Header details form */
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-3xl p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 shadow-glass space-y-6"
                >
                  <div className="flex justify-between items-center pb-3 border-b dark:border-slate-850">
                    <h3 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-1.5">
                      <FileSpreadsheet className="h-5 w-5 text-indigo-500" />
                      Step 1 Complete: Header Configuration
                    </h3>
                    <button 
                      onClick={resetHeaderStep}
                      className="text-xs font-bold text-rose-500 hover:underline flex items-center gap-1"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Reset Form
                    </button>
                  </div>

                  {/* Fields form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">School / College Title</label>
                      <input 
                        type="text"
                        value={headerData.title}
                        onChange={(e) => handleHeaderInputChange('title', e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-indigo-500 text-xs font-bold"
                        placeholder="e.g. Greenwood International School"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Class & Term Subtitle</label>
                      <input 
                        type="text"
                        value={headerData.subtitle}
                        onChange={(e) => handleHeaderInputChange('subtitle', e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-indigo-500 text-xs font-bold"
                        placeholder="e.g. Mid-Term Examination - Class X"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Subject Name</label>
                      <input 
                        type="text"
                        value={headerData.subject}
                        onChange={(e) => handleHeaderInputChange('subject', e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-indigo-500 text-xs font-bold"
                        placeholder="e.g. English Literature"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Time Allowed</label>
                      <input 
                        type="text"
                        value={headerData.timeAllowed}
                        onChange={(e) => handleHeaderInputChange('timeAllowed', e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-indigo-500 text-xs font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Maximum Marks</label>
                      <input 
                        type="number"
                        value={headerData.maxMarks}
                        onChange={(e) => handleHeaderInputChange('maxMarks', parseInt(e.target.value) || 0)}
                        className="w-full p-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-indigo-500 text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* Manual / General Instructions fields */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">General Exam Rules</label>
                      <button 
                        onClick={() => setHeaderData(prev => ({ ...prev, generalInstructions: [...prev.generalInstructions, 'New exam guideline instruction.'] }))}
                        className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Rule
                      </button>
                    </div>

                    <div className="space-y-2">
                      {headerData.generalInstructions?.map((inst, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <span className="text-xs text-slate-400 font-bold w-4">{index + 1}.</span>
                          <input 
                            type="text"
                            value={inst}
                            onChange={(e) => {
                              const updated = [...headerData.generalInstructions];
                              updated[index] = e.target.value;
                              handleHeaderInputChange('generalInstructions', updated);
                            }}
                            className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none text-xs font-semibold"
                          />
                          <button 
                            onClick={() => handleHeaderInputChange('generalInstructions', headerData.generalInstructions.filter((_, idx) => idx !== index))}
                            className="p-1 hover:bg-rose-500/10 text-rose-500 rounded"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      {headerData.generalInstructions?.length === 0 && (
                        <span className="text-[11px] italic text-slate-400 block pt-1">No instructions extracted. Add custom guidelines above or write in editor.</span>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={handleConfirmHeaderAndNext}
                    className="w-full flex items-center justify-center gap-1.5 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-glow transition-transform active:scale-[0.99] cursor-pointer"
                  >
                    Confirm Header & Proceed to Questions (Step 2)
                    <ArrowRight className="h-4 w-4" />
                  </button>

                </motion.div>
              )}

            </motion.div>
          ) : (
            
            // ==================== STEP 2 VIEW ====================
            <motion.div 
              key="step-2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">
                  Step 2: Upload Handwritten Question Pages
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Drag and drop multiple pages in correct reading order. We will extract all questions sequentially.
                </p>
              </div>

              {/* Step 2 upload zone */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleQuestionsDrop}
                onClick={() => questionsInputRef.current.click()}
                className={`rounded-3xl border-2 border-dashed p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 text-center select-none ${
                  isDragOver 
                    ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 shadow-glow' 
                    : 'border-slate-350 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:border-indigo-500'
                }`}
              >
                <input 
                  type="file"
                  ref={questionsInputRef}
                  onChange={handleQuestionsSelect}
                  accept=".jpg,.jpeg,.png,.pdf"
                  multiple
                  className="hidden"
                />

                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="bg-indigo-500/10 p-4 rounded-2xl text-indigo-600 dark:text-indigo-400">
                    <Plus className="h-8 w-8 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-855 dark:text-white">Choose or Drag multiple page sheets</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Supports PNGs, JPEGs, or rough vectors up to 10MB per file</p>
                  </div>
                </div>
              </div>

              {/* Uploaded question sheets list */}
              {questionPages.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">
                    Pages Batch List ({questionPages.length})
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {questionPages.map((page, index) => (
                      <div 
                        key={page.id}
                        className="rounded-2xl p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850/60 shadow-sm relative flex flex-col items-center gap-2 group overflow-hidden"
                      >
                        {/* Remove badge */}
                        <button 
                          onClick={() => deleteQuestionPage(page.id)}
                          className="absolute top-2 right-2 p-1 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>

                        {page.preview ? (
                          <div className="rounded-xl overflow-hidden h-28 w-full border border-slate-100">
                            <img src={page.preview} alt={`Page ${index + 1}`} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-28 w-full bg-indigo-500/5 text-indigo-500 rounded-xl flex items-center justify-center border border-dashed">
                            <FileText className="h-8 w-8" />
                          </div>
                        )}

                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-150 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                          Page {index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Language selection tuner card */}
              <div className="rounded-2xl p-5 glass-card border border-white/20 dark:border-slate-800/40 shadow-glass flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <Languages className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">Mixed characters OCR OCR optimizer</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Boost character scan accuracy for mixed bilingual papers</p>
                  </div>
                </div>
                
                <div className="flex bg-slate-200/50 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-300/30 dark:border-slate-800">
                  <button
                    onClick={() => setOcrLang('eng')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      ocrLang === 'eng' 
                        ? 'bg-white dark:bg-slate-800 shadow-md text-indigo-600 dark:text-indigo-400' 
                        : 'text-slate-650 dark:text-slate-400'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setOcrLang('eng+hin')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      ocrLang === 'eng+hin' 
                        ? 'bg-white dark:bg-slate-800 shadow-md text-indigo-600 dark:text-indigo-400' 
                        : 'text-slate-650 dark:text-slate-400'
                    }`}
                  >
                    English+Hindi
                  </button>
                </div>
              </div>

              {/* Action operations buttons */}
              <div className="flex gap-4">
                <button 
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3.5 bg-slate-200 hover:bg-slate-350 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-sm transition-colors cursor-pointer"
                >
                  Back to Step 1
                </button>
                
                <button 
                  onClick={handleExtractQuestions}
                  disabled={questionPages.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold text-sm shadow-glow transition-transform active:scale-[0.99] cursor-pointer"
                >
                  Extract Questions & Build Mock
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
