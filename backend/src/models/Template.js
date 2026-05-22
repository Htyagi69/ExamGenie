const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null means public/system-provided template
    },
    name: {
      type: String,
      required: [true, 'Please provide a template name'],
      trim: true,
    },
    fontFamily: {
      type: String,
      default: 'Arial', // Arial, Times New Roman, Calibri
    },
    titleFontSize: {
      type: Number,
      default: 16,
    },
    headerStyle: {
      alignment: {
        type: String,
        enum: ['left', 'center', 'right'],
        default: 'center',
      },
      showLogoSpace: {
        type: Boolean,
        default: false,
      },
      showDividerLine: {
        type: Boolean,
        default: true,
      },
      subtitleFontSize: {
        type: Number,
        default: 12,
      },
    },
    margins: {
      top: { type: Number, default: 1440 }, // twips (1 inch = 1440 twips)
      bottom: { type: Number, default: 1440 },
      left: { type: Number, default: 1440 },
      right: { type: Number, default: 1440 },
    },
    questionSpacing: {
      type: Number,
      default: 8, // pt
    },
    marksAlignment: {
      type: String,
      enum: ['inline', 'right'],
      default: 'right',
    },
    borderColor: {
      type: String,
      default: '#333333',
    },
    borderStyle: {
      type: String,
      enum: ['none', 'single', 'double'],
      default: 'none',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Template', TemplateSchema);
