const Template = require('../models/Template');

// Predefined default system-wide public templates
const PUBLIC_TEMPLATES = [
  {
    _id: '660d1f8a846c4f001f012345',
    name: 'Classic School Paper',
    fontFamily: 'Arial',
    titleFontSize: 16,
    headerStyle: {
      alignment: 'center',
      showLogoSpace: false,
      showDividerLine: true,
      subtitleFontSize: 12
    },
    margins: { top: 1440, bottom: 1440, left: 1440, right: 1440 }, // 1 inch
    questionSpacing: 8,
    marksAlignment: 'inline',
    borderColor: '#333333',
    borderStyle: 'none',
    isPublic: true
  },
  {
    _id: '660d1f8a846c4f001f012346',
    name: 'DPS Elite Format',
    fontFamily: 'Calibri',
    titleFontSize: 18,
    headerStyle: {
      alignment: 'center',
      showLogoSpace: true,
      showDividerLine: true,
      subtitleFontSize: 13
    },
    margins: { top: 1080, bottom: 1080, left: 1080, right: 1080 }, // 0.75 inch
    questionSpacing: 10,
    marksAlignment: 'right',
    borderColor: '#1e3a8a',
    borderStyle: 'single',
    isPublic: true
  },
  {
    _id: '660d1f8a846c4f001f012347',
    name: 'Standard Board Exam (ICSE/CBSE)',
    fontFamily: 'Times New Roman',
    titleFontSize: 15,
    headerStyle: {
      alignment: 'left',
      showLogoSpace: false,
      showDividerLine: true,
      subtitleFontSize: 11
    },
    margins: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
    questionSpacing: 12,
    marksAlignment: 'right',
    borderColor: '#000000',
    borderStyle: 'double',
    isPublic: true
  }
];

/**
 * @desc    Get all styling templates (both user custom and public ones)
 * @route   GET /api/templates
 * @access  Private
 */
const getTemplates = async (req, res) => {
  try {
    // Find custom templates uploaded by user
    const customTemplates = await Template.find({ userId: req.user.id });
    
    // Combine custom and system public templates
    const allTemplates = [...PUBLIC_TEMPLATES, ...customTemplates];
    
    res.status(200).json({
      success: true,
      count: allTemplates.length,
      data: allTemplates
    });
  } catch (error) {
    console.error('Fetch templates error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching templates' });
  }
};

/**
 * @desc    Get a single template
 * @route   GET /api/templates/:id
 * @access  Private
 */
const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check public list first
    const publicMatch = PUBLIC_TEMPLATES.find(t => t._id === id);
    if (publicMatch) {
      return res.status(200).json({ success: true, data: publicMatch });
    }

    const template = await Template.findById(id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    // Guard template ownership
    if (template.userId && template.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this template' });
    }

    res.status(200).json({ success: true, data: template });
  } catch (error) {
    console.error('Fetch single template error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching template' });
  }
};

/**
 * @desc    Create a custom formatting template
 * @route   POST /api/templates
 * @access  Private
 */
const createTemplate = async (req, res) => {
  try {
    const { 
      name, 
      fontFamily, 
      titleFontSize, 
      headerStyle, 
      margins, 
      questionSpacing, 
      marksAlignment, 
      borderColor, 
      borderStyle 
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Please provide a template name' });
    }

    const template = await Template.create({
      userId: req.user.id,
      name,
      fontFamily,
      titleFontSize,
      headerStyle,
      margins,
      questionSpacing,
      marksAlignment,
      borderColor,
      borderStyle,
      isPublic: false
    });

    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Create template error:', error.message);
    res.status(500).json({ success: false, message: 'Server error creating template' });
  }
};

/**
 * @desc    Delete a custom template
 * @route   DELETE /api/templates/:id
 * @access  Private
 */
const deleteTemplate = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    // Security check
    if (template.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this template' });
    }

    await template.deleteOne();
    res.status(200).json({ success: true, message: 'Template removed successfully' });
  } catch (error) {
    console.error('Delete template error:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting template' });
  }
};

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplate,
  deleteTemplate,
  PUBLIC_TEMPLATES
};
