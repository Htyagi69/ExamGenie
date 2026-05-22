import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  Printer, 
  Save, 
  Sparkles, 
  Settings, 
  ChevronRight, 
  BookOpen, 
  Info,
  Layers,
  HelpCircle,
  Undo
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock sample exam paper fallback to keep app fully robust out-of-the-box
const SAMPLE_EXAM = {
  title: "Greenwood International School",
  subtitle: "Annual Term Examination - Class X",
  subject: "Biology & Environmental Science",
  timeAllowed: "3 Hours",
  maxMarks: 80,
  generalInstructions: [
    "All questions are compulsory. Marks are indicated against each question.",
    "Section A contains multiple choice questions of 1 mark each.",
    "Section B contains short answer questions of 3 marks each.",
    "Draw neat, labelled diagrams wherever necessary."
  ],
  sections: [
    {
      id: "sec-1",
      title: "Section A: Multiple Choice Questions",
      instruction: "Choose the correct option for each question.",
      questions: [
        {
          id: "q-1",
          number: "Q1.",
          text: "Which cell organelle is known as the powerhouse of the cell?",
          marks: 1,
          options: [
            "A) Nucleus",
            "B) Mitochondria",
            "C) Endoplasmic Reticulum",
            "D) Golgi Apparatus"
          ],
          subQuestions: []
        },
        {
          id: "q-2",
          number: "Q2.",
          text: "What is the primary function of chlorophyll in green plants?",
          marks: 1,
          options: [
            "A) Transpiration",
            "B) Absorption of solar energy",
            "C) Respiration",
            "D) Translocation of sugars"
          ],
          subQuestions: []
        }
      ]
    },
    {
      id: "sec-2",
      title: "Section B: Conceptual Reasoning",
      instruction: "Answer all questions. Each response should be between 50-80 words.",
      questions: [
        {
          id: "q-3",
          number: "Q3.",
          text: "Differentiate between Aerobic and Anaerobic respiration in humans.",
          marks: 3,
          options: [],
          subQuestions: []
        },
        {
          id: "q-4",
          number: "Q4.",
          text: "Study the given terms and answer the following sub-parts:",
          marks: 5,
          options: [],
          subQuestions: [
            { id: "sub-1", number: "a)", text: "What triggers the stomatal pore to open and close?", marks: 2 },
            { id: "sub-2", number: "b)", text: "Explain the role of guard cells in plant gas exchange.", marks: 3 }
          ]
        }
      ]
    }
  ]
};

// System templates mapping
const SYSTEM_TEMPLATES = [
  { id: '660d1f8a846c4f001f012345', name: 'Classic (Arial, Clean Spacing)', font: 'Arial', spacing: 8, alignment: 'inline', border: 'none' },
  { id: '660d1f8a846c4f001f012346', name: 'DPS Elite (Calibri, Right Marks)', font: 'Calibri', spacing: 10, alignment: 'right', border: 'single' },
  { id: '660d1f8a846c4f001f012347', name: 'Board Classic (Times, Right Marks)', font: 'Times New Roman', spacing: 12, alignment: 'right', border: 'double' }
];

export default function Editor() {
  const location = useLocation();
  const navigate = useNavigate();

  // Load state from upload page, or fallback to sample exam
  const [examData, setExamData] = useState(() => {
    return location.state?.examData || SAMPLE_EXAM;
  });

  // Visual Template formatting state
  const [selectedTemplateId, setSelectedTemplateId] = useState('660d1f8a846c4f001f012345');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [questionSpacing, setQuestionSpacing] = useState(8);
  const [marksAlignment, setMarksAlignment] = useState('right');
  const [borderStyle, setBorderStyle] = useState('none');
  
  // UI states
  const [activeTab, setActiveTab] = useState('metadata'); // metadata, instructions, sections
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showTemplateSettings, setShowTemplateSettings] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // Handle template preset change
  const handleTemplatePresetChange = (presetId) => {
    setSelectedTemplateId(presetId);
    const preset = SYSTEM_TEMPLATES.find(p => p.id === presetId);
    if (preset) {
      setFontFamily(preset.font);
      setQuestionSpacing(preset.spacing);
      setMarksAlignment(preset.alignment);
      setBorderStyle(preset.border);
    }
  };

  // Synchronize changes in metadata
  const handleMetadataChange = (key, value) => {
    setExamData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // General instructions handlers
  const handleInstructionChange = (index, value) => {
    setExamData(prev => {
      const updated = [...prev.generalInstructions];
      updated[index] = value;
      return { ...prev, generalInstructions: updated };
    });
  };

  const addInstruction = () => {
    setExamData(prev => ({
      ...prev,
      generalInstructions: [...prev.generalInstructions, "New general instruction item."]
    }));
  };

  const removeInstruction = (index) => {
    setExamData(prev => {
      const updated = prev.generalInstructions.filter((_, idx) => idx !== index);
      return { ...prev, generalInstructions: updated };
    });
  };

  // Section level handlers
  const handleSectionChange = (sectionId, key, value) => {
    setExamData(prev => {
      const updatedSections = prev.sections.map(sec => {
        if (sec.id === sectionId) {
          return { ...sec, [key]: value };
        }
        return sec;
      });
      return { ...prev, sections: updatedSections };
    });
  };

  const addSection = () => {
    const newSection = {
      id: 'sec-' + Math.random().toString(36).substr(2, 9),
      title: 'New Section Header',
      instruction: 'Section guidelines go here.',
      questions: []
    };
    setExamData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const deleteSection = (sectionId) => {
    setExamData(prev => ({
      ...prev,
      sections: prev.sections.filter(sec => sec.id !== sectionId)
    }));
  };

  const moveSection = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= examData.sections.length) return;
    
    setExamData(prev => {
      const updated = [...prev.sections];
      const temp = updated[index];
      updated[index] = updated[nextIndex];
      updated[nextIndex] = temp;
      return { ...prev, sections: updated };
    });
  };

  // Question level handlers
  const handleQuestionChange = (sectionId, questionId, key, value) => {
    setExamData(prev => {
      const updatedSections = prev.sections.map(sec => {
        if (sec.id === sectionId) {
          const updatedQ = sec.questions.map(q => {
            if (q.id === questionId) {
              return { ...q, [key]: value };
            }
            return q;
          });
          return { ...sec, questions: updatedQ };
        }
        return sec;
      });
      return { ...prev, sections: updatedSections };
    });
  };

  const addQuestion = (sectionId) => {
    setExamData(prev => {
      const updatedSections = prev.sections.map(sec => {
        if (sec.id === sectionId) {
          const nextQNum = sec.questions.length + 1;
          const newQ = {
            id: 'q-' + Math.random().toString(36).substr(2, 9),
            number: `Q${nextQNum}.`,
            text: 'Type your question here...',
            marks: 1,
            options: [],
            subQuestions: []
          };
          return { ...sec, questions: [...sec.questions, newQ] };
        }
        return sec;
      });
      return { ...prev, sections: updatedSections };
    });
  };

  const deleteQuestion = (sectionId, questionId) => {
    setExamData(prev => {
      const updatedSections = prev.sections.map(sec => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            questions: sec.questions.filter(q => q.id !== questionId)
          };
        }
        return sec;
      });
      return { ...prev, sections: updatedSections };
    });
  };

  const moveQuestion = (sectionId, index, direction) => {
    setExamData(prev => {
      const updatedSections = prev.sections.map(sec => {
        if (sec.id === sectionId) {
          const nextIndex = index + direction;
          if (nextIndex < 0 || nextIndex >= sec.questions.length) return sec;
          const updatedQ = [...sec.questions];
          const temp = updatedQ[index];
          updatedQ[index] = updatedQ[nextIndex];
          updatedQ[nextIndex] = temp;
          return { ...sec, questions: updatedQ };
        }
        return sec;
      });
      return { ...prev, sections: updatedSections };
    });
  };

  // MCQ choices handlers
  const handleOptionChange = (sectionId, questionId, optionIdx, value) => {
    setExamData(prev => {
      const updatedSections = prev.sections.map(sec => {
        if (sec.id === sectionId) {
          const updatedQ = sec.questions.map(q => {
            if (q.id === questionId) {
              const updatedOpt = [...q.options];
              updatedOpt[optionIdx] = value;
              return { ...q, options: updatedOpt };
            }
            return q;
          });
          return { ...sec, questions: updatedQ };
        }
        return sec;
      });
      return { ...prev, sections: updatedSections };
    });
  };

  const addOption = (sectionId, questionId) => {
    setExamData(prev => {
      const updatedSections = prev.sections.map(sec => {
        if (sec.id === sectionId) {
          const updatedQ = sec.questions.map(q => {
            if (q.id === questionId) {
              const letter = String.fromCharCode(65 + q.options.length); // A, B, C, D...
              return {
                ...q,
                options: [...q.options, `${letter}) Option Text`]
              };
            }
            return q;
          });
          return { ...sec, questions: updatedQ };
        }
        return sec;
      });
      return { ...prev, sections: updatedSections };
    });
  };

  const removeOption = (sectionId, questionId, optionIdx) => {
    setExamData(prev => {
      const updatedSections = prev.sections.map(sec => {
        if (sec.id === sectionId) {
          const updatedQ = sec.questions.map(q => {
            if (q.id === questionId) {
              return {
                ...q,
                options: q.options.filter((_, idx) => idx !== optionIdx)
              };
            }
            return q;
          });
          return { ...sec, questions: updatedQ };
        }
        return sec;
      });
      return { ...prev, sections: updatedSections };
    });
  };

  // Subquestion level handlers
  const handleSubqChange = (sectionId, questionId, subqId, key, value) => {
    setExamData(prev => {
      const updatedSections = prev.sections.map(sec => {
        if (sec.id === sectionId) {
          const updatedQ = sec.questions.map(q => {
            if (q.id === questionId) {
              const updatedSub = q.subQuestions.map(sub => {
                if (sub.id === subqId) {
                  return { ...sub, [key]: value };
                }
                return sub;
              });
              return { ...q, subQuestions: updatedSub };
            }
            return q;
          });
          return { ...sec, questions: updatedQ };
        }
        return sec;
      });
      return { ...prev, sections: updatedSections };
    });
  };

  const addSubquestion = (sectionId, questionId) => {
    setExamData(prev => {
      const updatedSections = prev.sections.map(sec => {
        if (sec.id === sectionId) {
          const updatedQ = sec.questions.map(q => {
            if (q.id === questionId) {
              const subLetters = ['a)', 'b)', 'c)', 'd)'];
              const subNum = subLetters[q.subQuestions.length] || 'a)';
              const newSub = {
                id: 'subq-' + Math.random().toString(36).substr(2, 9),
                number: subNum,
                text: 'New sub-question details...'
              };
              return {
                ...q,
                subQuestions: [...q.subQuestions, newSub]
              };
            }
            return q;
          });
          return { ...sec, questions: updatedQ };
        }
        return sec;
      });
      return { ...prev, sections: updatedSections };
    });
  };

  const deleteSubquestion = (sectionId, questionId, subqId) => {
    setExamData(prev => {
      const updatedSections = prev.sections.map(sec => {
        if (sec.id === sectionId) {
          const updatedQ = sec.questions.map(q => {
            if (q.id === questionId) {
              return {
                ...q,
                subQuestions: q.subQuestions.filter(sub => sub.id !== subqId)
              };
            }
            return q;
          });
          return { ...sec, questions: updatedQ };
        }
        return sec;
      });
      return { ...prev, sections: updatedSections };
    });
  };

  // EXPORT OPERATIONS
  const handleExportWord = async () => {
    setExporting(true);
    setSaveStatus('Generating Word package...');
    try {
      const res = await api.post('/exams/export/docx', {
        examData: examData,
        templateId: selectedTemplateId,
        customTemplate: {
          fontFamily: fontFamily,
          questionSpacing: questionSpacing,
          marksAlignment: marksAlignment,
          borderStyle: borderStyle
        }
      }, {
        responseType: 'blob' // Essential to parse binary arraybuffer
      });

      // Trigger actual browser download link
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      const filename = `${examData.subject || 'Exam'}_Paper.docx`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSaveStatus('Word document downloaded successfully!');
      setTimeout(() => setSaveStatus(''), 4000);
    } catch (error) {
      console.error('Word export failed:', error);
      setSaveStatus('Error building Word document.');
    } finally {
      setExporting(false);
    }
  };

  const handlePrintPDF = () => {
    // Triggers local browser window print dialog
    window.print();
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setSaveStatus('Saving draft in Cloud database...');
    try {
      const payload = {
        ...examData,
        templateId: selectedTemplateId,
        isDraft: true
      };
      
      let res;
      if (examData._id) {
        res = await api.put(`/exams/${examData._id}`, payload);
      } else {
        res = await api.post('/exams', payload);
      }

      if (res.data.success) {
        setExamData(res.data.data); // Update with ID returned from MongoDB
        setSaveStatus('Exam Paper Draft saved to dashboard!');
        setTimeout(() => setSaveStatus(''), 4000);
      }
    } catch (error) {
      console.error('Draft save failed:', error);
      setSaveStatus('Error saving draft. Login might have expired.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full min-h-[90vh] flex flex-col md:flex-row transition-all duration-300">
      
      {/* 1. LEFT PANE - DYNAMIC STRUCTURED EDITOR */}
      <div className="w-full md:w-[45%] bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col max-h-[90vh] overflow-y-auto no-print">
        
        {/* Editor Toolbar Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600/10 p-2 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-800 dark:text-white text-lg leading-tight">Questionnaire Builder</h2>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AI Scanned Draft Editor</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowTemplateSettings(!showTemplateSettings)}
              className={`p-2 rounded-xl border transition-colors ${
                showTemplateSettings 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-glow' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
              title="Page Template Preferences"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button 
              onClick={handleSaveDraft}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-glow"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
          </div>
        </div>

        {/* Save/Export status message indicator */}
        {saveStatus && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 mb-4 rounded-xl bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-300/40 dark:border-slate-700"
          >
            <Info className="h-4.5 w-4.5 text-indigo-500" />
            <span>{saveStatus}</span>
          </motion.div>
        )}

        {/* Dynamic Template settings panel */}
        <AnimatePresence>
          {showTemplateSettings && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 rounded-2xl p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 shadow-glass overflow-hidden space-y-4"
            >
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-indigo-500" />
                A4 Formatting Layout Style
              </h3>
              
              {/* Presets Grid */}
              <div className="space-y-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Templates Preset selection</span>
                <div className="grid grid-cols-3 gap-2">
                  {SYSTEM_TEMPLATES.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleTemplatePresetChange(p.id)}
                      className={`p-2 rounded-xl text-[10px] font-bold text-center border transition-all ${
                        selectedTemplateId === p.id 
                          ? 'border-indigo-500 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      {p.name.split(' (')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Fine Tuning */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-900">
                {/* Font selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Typography Font</label>
                  <select 
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full text-xs font-semibold p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Calibri">Calibri</option>
                  </select>
                </div>

                {/* Marks Layout */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Marks Position</label>
                  <select 
                    value={marksAlignment}
                    onChange={(e) => setMarksAlignment(e.target.value)}
                    className="w-full text-xs font-semibold p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none"
                  >
                    <option value="right">Right-Aligned [5]</option>
                    <option value="inline">Inline (5)</option>
                  </select>
                </div>

                {/* Spacing */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Question Spacing</label>
                  <input 
                    type="number"
                    value={questionSpacing}
                    onChange={(e) => setQuestionSpacing(parseInt(e.target.value) || 4)}
                    className="w-full text-xs font-semibold p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none"
                  />
                </div>

                {/* Border Style */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Document border</label>
                  <select 
                    value={borderStyle}
                    onChange={(e) => setBorderStyle(e.target.value)}
                    className="w-full text-xs font-semibold p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none"
                  >
                    <option value="none">None</option>
                    <option value="single">Single Line Border</option>
                    <option value="double">Double Separated Sections</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Selection */}
        <div className="flex bg-slate-200/50 dark:bg-slate-950/40 p-1 rounded-2xl border border-slate-300/20 dark:border-slate-800 mb-6">
          {['metadata', 'instructions', 'sections'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-extrabold rounded-xl capitalize transition-all ${
                activeTab === tab 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab === 'metadata' ? 'Exam Details' : tab === 'instructions' ? 'Instructions' : 'Edit Questions'}
            </button>
          ))}
        </div>

        {/* TAB 1: EXAM METADATA DETAILS */}
        {activeTab === 'metadata' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-5"
          >
            {/* Title / School Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">School / University Title</label>
              <input 
                type="text"
                value={examData.title}
                onChange={(e) => handleMetadataChange('title', e.target.value)}
                className="w-full p-2 bg-transparent border-0 border-b border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-0 rounded-none text-sm font-semibold transition-all"
                placeholder="e.g. DPS Classic school"
              />
            </div>

            {/* Subtitle / Class details */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Class & Term Subtitle</label>
              <input 
                type="text"
                value={examData.subtitle}
                onChange={(e) => handleMetadataChange('subtitle', e.target.value)}
                className="w-full p-2 bg-transparent border-0 border-b border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-0 rounded-none text-sm font-semibold transition-all"
                placeholder="e.g. Annual Exams - Class X"
              />
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Subject Name</label>
              <input 
                type="text"
                value={examData.subject}
                onChange={(e) => handleMetadataChange('subject', e.target.value)}
                className="w-full p-2 bg-transparent border-0 border-b border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-0 rounded-none text-sm font-semibold transition-all"
                placeholder="e.g. Science / Biology"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Time allowed */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Time Allowed</label>
                <input 
                  type="text"
                  value={examData.timeAllowed}
                  onChange={(e) => handleMetadataChange('timeAllowed', e.target.value)}
                  className="w-full p-2 bg-transparent border-0 border-b border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-0 rounded-none text-sm font-semibold transition-all"
                  placeholder="3 Hours"
                />
              </div>

              {/* Max Marks */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Maximum Marks</label>
                <input 
                  type="number"
                  value={examData.maxMarks}
                  onChange={(e) => handleMetadataChange('maxMarks', parseInt(e.target.value) || 0)}
                  className="w-full p-2 bg-transparent border-0 border-b border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-0 rounded-none text-sm font-semibold transition-all"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: GENERAL INSTRUCTIONS EDITOR */}
        {activeTab === 'instructions' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">Core General Rules</span>
              <button 
                onClick={addInstruction}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400"
              >
                <Plus className="h-4 w-4" /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {examData.generalInstructions?.map((inst, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <div className="h-7 w-7 text-xs font-extrabold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                    {index + 1}
                  </div>
                  <input 
                    type="text"
                    value={inst}
                    onChange={(e) => handleInstructionChange(index, e.target.value)}
                    className="flex-1 p-2 bg-transparent border-0 border-b border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-0 rounded-none text-xs font-semibold transition-all"
                  />
                  <button 
                    onClick={() => removeInstruction(index)}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAB 3: SECTIONS AND QUESTIONS COMPILER */}
        {activeTab === 'sections' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            
            {/* Section creator header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Exam Question Blocks</span>
              <button 
                onClick={addSection}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold transition-all"
              >
                <Plus className="h-4 w-4" /> Add Section
              </button>
            </div>

            {/* Loop through sections */}
            <div className="space-y-10">
              {examData.sections?.map((section, secIdx) => (
                <div 
                  key={section.id}
                  className="pb-8 border-b border-slate-200/60 dark:border-slate-800/80 last:border-b-0 space-y-5"
                >
                  
                  {/* Section header control bar */}
                  <div className="flex items-center justify-between pb-2 gap-2">
                    <div className="flex-1 flex gap-2">
                      <input 
                        type="text"
                        value={section.title}
                        onChange={(e) => handleSectionChange(section.id, 'title', e.target.value)}
                        className="flex-1 font-bold text-sm text-slate-800 dark:text-white bg-transparent border-0 border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 p-1.5 focus:outline-none focus:ring-0 rounded-none transition-all"
                        placeholder="Section title"
                      />
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => moveSection(secIdx, -1)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400" title="Move Section Up"><ArrowUp className="h-3.5 w-3.5" /></button>
                      <button onClick={() => moveSection(secIdx, 1)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400" title="Move Section Down"><ArrowDown className="h-3.5 w-3.5" /></button>
                      <button onClick={() => deleteSection(section.id)} className="p-1.5 hover:bg-rose-500/10 rounded-lg text-rose-500" title="Delete Section"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>

                  {/* Section description */}
                  <div className="space-y-1 pl-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Section Directions</label>
                    <input 
                      type="text"
                      value={section.instruction}
                      onChange={(e) => handleSectionChange(section.id, 'instruction', e.target.value)}
                      className="w-full text-xs text-slate-600 dark:text-slate-400 bg-transparent border-0 border-b border-transparent hover:border-slate-350 dark:hover:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-455 p-1 focus:outline-none focus:ring-0 italic rounded-none transition-all"
                      placeholder="e.g. Answer all questions"
                    />
                  </div>

                  {/* LOOP QUESTIONS UNDER SECTION */}
                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center pl-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Question items</span>
                      <button 
                        onClick={() => addQuestion(section.id)}
                        className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 flex items-center gap-0.5 hover:underline transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Question
                      </button>
                    </div>

                    {/* Question items */}
                    <div className="space-y-2 divider-y divider-slate-100 dark:divider-slate-900/60">
                      {section.questions?.map((q, qIdx) => (
                        <div key={q.id} className="py-4 border-b border-slate-150/40 dark:border-slate-900 last:border-b-0 space-y-3 relative group">
                          
                          {/* Question row */}
                          <div className="flex gap-2 items-start">
                            <input 
                              type="text"
                              value={q.number}
                              onChange={(e) => handleQuestionChange(section.id, q.id, 'number', e.target.value)}
                              className="w-10 text-center font-bold text-xs p-1 bg-transparent border-0 border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-0 rounded-none transition-all"
                            />
                            
                            <textarea 
                              value={q.text}
                              onChange={(e) => handleQuestionChange(section.id, q.id, 'text', e.target.value)}
                              className="flex-1 min-h-[36px] text-xs font-semibold p-1 bg-transparent border-0 border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-0 rounded-none transition-all resize-y"
                              placeholder="Question description text..."
                            />

                            <div className="flex flex-col gap-1 items-end shrink-0 pl-2">
                              {/* Marks */}
                              <div className="flex items-center gap-1">
                                <span className="text-[8px] text-slate-400 font-bold uppercase">[M]</span>
                                <input 
                                  type="number"
                                  value={q.marks}
                                  onChange={(e) => handleQuestionChange(section.id, q.id, 'marks', parseInt(e.target.value) || 0)}
                                  className="w-10 text-center text-xs font-extrabold p-1 bg-transparent border-0 border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-0 rounded-none transition-all"
                                />
                              </div>

                              {/* Operations (fades in on hover) */}
                              <div className="flex gap-0.5 mt-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => moveQuestion(section.id, qIdx, -1)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500" title="Move Question Up"><ArrowUp className="h-3 w-3" /></button>
                                <button onClick={() => moveQuestion(section.id, qIdx, 1)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500" title="Move Question Down"><ArrowDown className="h-3 w-3" /></button>
                                <button onClick={() => deleteQuestion(section.id, q.id)} className="p-1 hover:bg-rose-500/10 rounded text-rose-500" title="Delete Question"><Trash2 className="h-3 w-3" /></button>
                              </div>
                            </div>
                          </div>

                          {/* MCQ OPTIONS BLOCK */}
                          <div className="space-y-1.5 pl-12">
                            {q.options && q.options.length > 0 && (
                              <div className="flex flex-col gap-1.5">
                                {q.options.map((opt, optIdx) => (
                                  <div key={optIdx} className="flex gap-2 items-center">
                                    <input 
                                      type="text"
                                      value={opt}
                                      onChange={(e) => handleOptionChange(section.id, q.id, optIdx, e.target.value)}
                                      className="flex-1 text-[11px] p-1 bg-transparent border-0 border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-0 rounded-none transition-all"
                                    />
                                    <button 
                                      onClick={() => removeOption(section.id, q.id, optIdx)}
                                      className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                                      title="Remove option"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex gap-3 pt-1">
                              <button 
                                onClick={() => addOption(section.id, q.id)}
                                className="text-[9px] font-extrabold text-indigo-650 dark:text-indigo-400 flex items-center gap-0.5 hover:underline"
                              >
                                <Plus className="h-3 w-3" /> Add MCQ Choice
                              </button>
                              <button 
                                onClick={() => addSubquestion(section.id, q.id)}
                                className="text-[9px] font-extrabold text-violet-600 dark:text-violet-400 flex items-center gap-0.5 hover:underline"
                              >
                                <Plus className="h-3 w-3" /> Add Nested Subquestion
                              </button>
                            </div>
                          </div>

                          {/* SUBQUESTIONS COMPILER */}
                          {q.subQuestions && q.subQuestions.length > 0 && (
                            <div className="space-y-2 pl-12 border-l border-slate-200 dark:border-slate-800 ml-1">
                              {q.subQuestions.map((subq) => (
                                <div key={subq.id} className="flex gap-2 items-center">
                                  <input 
                                    type="text"
                                    value={subq.number}
                                    onChange={(e) => handleSubqChange(section.id, q.id, subq.id, 'number', e.target.value)}
                                    className="w-8 text-center font-bold text-[10px] p-1 bg-transparent border-0 border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-0 rounded-none transition-all"
                                  />
                                  <input 
                                    type="text"
                                    value={subq.text}
                                    onChange={(e) => handleSubqChange(section.id, q.id, subq.id, 'text', e.target.value)}
                                    className="flex-1 text-xs p-1 bg-transparent border-0 border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-0 rounded-none transition-all"
                                  />
                                  <button 
                                    onClick={() => deleteSubquestion(section.id, q.id, subq.id)}
                                    className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded shrink-0 transition-colors"
                                    title="Delete sub-question"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </motion.div>
        )}

      </div>

      {/* 2. RIGHT PANE - LIVE PRINTABLE MOCK A4 PREVIEW */}
      <div className="w-full md:w-[55%] bg-slate-250 dark:bg-slate-950 p-6 flex flex-col items-center max-h-[90vh] overflow-y-auto print-page-layout-override">
        
        {/* Mock Controls Header */}
        <div className="w-full max-w-[21cm] flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6 no-print">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-500" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Interactive A4 Mock (Print Preview)</span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrintPDF}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-glow-green"
              title="Print directly or save as PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save PDF
            </button>
            <button 
              onClick={handleExportWord}
              disabled={exporting}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-650/50 text-white rounded-xl text-xs font-bold shadow-glow"
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? 'Exporting...' : 'Download DOCX'}
            </button>
          </div>
        </div>

        {/* PRINT PRINTABLE PAPER CONTAINER MOCKUP */}
        {/* We size this container to matches standard A4 width dimensions (21cm) and styling in browser, but on printing it extends to standard pages. */}
        <div 
          className="w-full max-w-[21cm] min-h-[29.7cm] bg-white text-black p-[2cm] shadow-2xl border border-slate-200/60 dark:border-slate-900 rounded-lg flex flex-col font-serif relative print-page-layout leading-relaxed text-sm select-text"
          style={{ 
            fontFamily: fontFamily === 'Times New Roman' ? 'Georgia, serif' : fontFamily === 'Calibri' ? 'Segoe UI, sans-serif' : 'Arial, sans-serif',
            boxSizing: 'border-box'
          }}
        >
          {/* Visual double lined border if selected */}
          {borderStyle === 'double' && (
            <div className="absolute inset-[0.5cm] border-[3px] border-double border-slate-800 pointer-events-none no-print" />
          )}
          {borderStyle === 'single' && (
            <div className="absolute inset-[0.5cm] border border-slate-600 pointer-events-none no-print" />
          )}

          {/* Core print page content container */}
          <div className="w-full h-full flex flex-col">
            
            {/* Header Block */}
            {examData.title && (
              <h1 className="text-center font-bold text-lg uppercase tracking-tight mb-1 text-black select-all">
                {examData.title}
              </h1>
            )}
            
            {examData.subtitle && (
              <h3 className="text-center font-bold text-sm mb-1 text-black">
                {examData.subtitle}
              </h3>
            )}

            {examData.subject && (
              <h2 className="text-center font-bold text-sm underline uppercase mb-3 text-black">
                SUBJECT: {examData.subject}
              </h2>
            )}

{/* Time Allowed and Maximum Marks */}
<div className="text-xs text-black mb-4">
  <span className="mr-4 font-medium">TIME ALLOWED: {examData.timeAllowed?.toUpperCase()}</span>
  <span className="font-medium">MAXIMUM MARKS: {examData.maxMarks}</span>
</div>


            {/* General Instructions section */}
            {examData.generalInstructions && examData.generalInstructions.length > 0 && (
              <div className="mb-6 text-xs text-black">
                <span className="font-bold underline block mb-1">General Instructions:</span>
                <ol className="list-decimal pl-5 space-y-1">
                  {examData.generalInstructions.map((inst, index) => (
                    <li key={index} className="pl-1 leading-snug">{inst}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Loop through sections */}
            {examData.sections?.map((section, secIdx) => (
              <div 
                key={section.id} 
                className={`mb-6 flex flex-col ${secIdx > 0 && borderStyle === 'double' ? 'print-page-break border-t border-slate-300 pt-6 no-print' : ''}`}
              >
                {/* Section title */}
                <h4 className="text-center font-bold text-sm underline uppercase tracking-wide mb-1 text-black">
                  {section.title}
                </h4>

                {/* Section instruction */}
                {section.instruction && (
                  <p className="text-center italic text-xs mb-4 text-slate-700 font-sans">
                    {section.instruction}
                  </p>
                )}

                {/* Section questions list */}
                <div className="space-y-4">
                  {section.questions?.map((q) => (
                    <div 
                      key={q.id} 
                      className="flex flex-col text-black"
                      style={{ marginBottom: `${questionSpacing}px` }}
                    >
                      {/* Question Line: Left-Question, Right-Marks layout */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 flex gap-2">
                          <span className="font-bold shrink-0">{q.number}</span>
                          <p className="leading-snug select-text">{q.text}</p>
                        </div>

                        {/* Question marks display */}
                        {q.marks > 0 && (
                          <span className={`font-bold shrink-0 select-all ${marksAlignment === 'right' ? 'w-10 text-right' : 'ml-2'}`}>
                            {marksAlignment === 'right' ? `[${q.marks}]` : `(${q.marks})`}
                          </span>
                        )}
                      </div>

                      {/* Options Grid Layout for MCQs */}
                      {q.options && q.options.length > 0 && (
                        <div className={`mt-2 ml-7 grid gap-y-1.5 ${q.options.every(o => o.length < 25) ? 'grid-cols-2' : 'grid-cols-1'} text-xs font-sans text-slate-800`}>
                          {q.options.map((opt, optIdx) => (
                            <span key={optIdx} className="leading-tight">{opt}</span>
                          ))}
                        </div>
                      )}

                      {/* Sub-questions loop */}
                      {q.subQuestions && q.subQuestions.length > 0 && (
                        <div className="mt-2 ml-7 space-y-2">
                          {q.subQuestions.map((subq) => (
                            <div key={subq.id} className="flex justify-between items-start gap-4 text-xs font-sans text-slate-800">
                              <div className="flex-1 flex gap-2">
                                <span className="font-bold shrink-0">{subq.number}</span>
                                <p className="leading-snug">{subq.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  ))}
                </div>

              </div>
            ))}

          </div>

        </div>

      </div>

    </div>
  );
}
