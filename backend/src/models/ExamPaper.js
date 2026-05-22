const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  number: {
    type: String,
    default: '',
  },
  text: {
    type: String,
    required: true,
  },
  marks: {
    type: Number,
    default: 0,
  },
  options: {
    type: [String], // MCQ options (e.g. ["A) Yes", "B) No"])
    default: [],
  },
  subQuestions: [
    {
      id: { type: String, required: true },
      number: { type: String, default: '' },
      text: { type: String, required: true },
      marks: { type: Number, default: 0 },
    },
  ],
});

const SectionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true, // e.g. "Section A: Language"
  },
  instruction: {
    type: String,
    default: '', // e.g. "Attempt all questions in this section"
  },
  questions: [QuestionSchema],
});

const ExamPaperSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide an exam title (e.g., School Name)'],
      trim: true,
    },
    subtitle: {
      type: String,
      default: '', // e.g., "Class X - English Paper-I"
    },
    subject: {
      type: String,
      default: '', // e.g., "English"
    },
    timeAllowed: {
      type: String,
      default: '3 Hours',
    },
    maxMarks: {
      type: Number,
      default: 100,
    },
    generalInstructions: {
      type: [String],
      default: [],
    },
    sections: [SectionSchema],
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template',
      default: null,
    },
    isDraft: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ExamPaper', ExamPaperSchema);
