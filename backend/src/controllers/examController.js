const fs = require('fs');
const ExamPaper = require('../models/ExamPaper');
const Template = require('../models/Template');
const { extractText } = require('../services/ocrService');
const { parseExamText, parseExamImagesMultimodal } = require('../services/aiParserService');
const { generateWordDocument } = require('../services/docxService');
const { PUBLIC_TEMPLATES } = require('./templateController');

/**
 * @desc    Upload paper and run OCR + AI structuring
 * @route   POST /api/exams/upload
 * @access  Private
 */
const processUpload = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload an image or PDF file' });
  }

  const tempFilePath = req.file.path;
  const lang = req.body.lang || 'eng+hin';

  try {
    // 1. Run raw OCR / PDF extraction
    const rawText = await extractText(req.file, lang);

    if (!rawText || rawText.trim().length === 0) {
      throw new Error('Could not extract any text from the file.');
    }

    // 2. Parse text to structured JSON
    const structuredPaper = await parseExamText(rawText);

    // 3. Delete temporary file
    fs.unlink(tempFilePath, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });

    res.status(200).json({
      success: true,
      message: 'File processed successfully',
      data: structuredPaper
    });

  } catch (error) {
    console.error('File processing failed:', error.message);
    
    // Clean up file in case of error
    if (fs.existsSync(tempFilePath)) {
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error processing exam paper'
    });
  }
};

/**
 * @desc    Upload paper header scan (Step 1)
 * @route   POST /api/exams/upload-header
 * @access  Private
 */
const processHeaderUpload = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a header image or PDF file' });
  }

  const tempFilePath = req.file.path;
  const lang = req.body.lang || 'eng+hin';

  try {
    let structuredPaper;
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      console.log('Gemini API key found. Offloading header visual scan directly to Gemini Multimodal...');
      try {
        structuredPaper = await parseExamImagesMultimodal([req.file], lang);
      } catch (geminiError) {
        console.error('Gemini Multimodal Vision failed, falling back to local Tesseract OCR:', geminiError.message);
        const rawText = await extractText(req.file, lang);
        if (!rawText || rawText.trim().length === 0) {
          throw new Error('Could not extract any text from the header file.');
        }
        structuredPaper = await parseExamText(rawText);
      }
    } else {
      console.log('No Gemini key. Running local Tesseract OCR for header...');
      const rawText = await extractText(req.file, lang);
      if (!rawText || rawText.trim().length === 0) {
        throw new Error('Could not extract any text from the header file.');
      }
      structuredPaper = await parseExamText(rawText);
    }

    fs.unlink(tempFilePath, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });

    // Return header-only details
    res.status(200).json({
      success: true,
      message: 'Header processed successfully',
      data: {
        title: structuredPaper.title || '',
        subtitle: structuredPaper.subtitle || '',
        subject: structuredPaper.subject || '',
        timeAllowed: structuredPaper.timeAllowed || '3 Hours',
        maxMarks: structuredPaper.maxMarks || 100,
        generalInstructions: structuredPaper.generalInstructions || []
      }
    });
  } catch (error) {
    console.error('Header processing failed:', error.message);
    if (fs.existsSync(tempFilePath)) {
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    }
    res.status(500).json({ success: false, message: error.message || 'Error processing header paper' });
  }
};

/**
 * @desc    Upload multiple pages of questions (Step 2)
 * @route   POST /api/exams/upload-questions
 * @access  Private
 */
const processQuestionsUpload = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'Please upload one or more question page images/PDFs' });
  }

  const tempFiles = req.files;
  const lang = req.body.lang || 'eng+hin';

  try {
    let structuredPaper;
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      console.log('Gemini API key found. Offloading multi-page questions visual scan directly to Gemini Multimodal...');
      try {
        structuredPaper = await parseExamImagesMultimodal(tempFiles, lang);
      } catch (geminiError) {
        console.error('Gemini Multimodal Vision failed, falling back to local Tesseract OCR:', geminiError.message);
        let combinedRawText = '';

        // Extract text from each file sequentially to maintain visual page order
        for (let i = 0; i < tempFiles.length; i++) {
          const file = tempFiles[i];
          console.log(`Processing file ${i + 1}/${tempFiles.length}: ${file.originalname}`);
          const text = await extractText(file, lang);
          combinedRawText += `\n\n--- PAGE ${i + 1} ---\n\n` + text;
        }

        if (!combinedRawText || combinedRawText.trim().length === 0) {
          throw new Error('Could not extract any question text from the uploaded pages.');
        }

        // Parse the entire combined text
        structuredPaper = await parseExamText(combinedRawText);
      }
    } else {
      console.log('No Gemini key. Sequentially running local Tesseract OCR on page array...');
      let combinedRawText = '';

      // Extract text from each file sequentially to maintain visual page order
      for (let i = 0; i < tempFiles.length; i++) {
        const file = tempFiles[i];
        console.log(`Processing file ${i + 1}/${tempFiles.length}: ${file.originalname}`);
        const text = await extractText(file, lang);
        combinedRawText += `\n\n--- PAGE ${i + 1} ---\n\n` + text;
      }

      if (!combinedRawText || combinedRawText.trim().length === 0) {
        throw new Error('Could not extract any question text from the uploaded pages.');
      }

      // Parse the entire combined text
      structuredPaper = await parseExamText(combinedRawText);
    }

    // Delete all temporary files
    tempFiles.forEach(file => {
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    });

    // Return the extracted sections and questions
    res.status(200).json({
      success: true,
      message: 'Questions processed successfully',
      data: {
        sections: structuredPaper.sections || []
      }
    });

  } catch (error) {
    console.error('Questions batch processing failed:', error.message);
    
    // Clean up all files in case of failure
    tempFiles.forEach(file => {
      if (fs.existsSync(file.path)) {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      }
    });

    res.status(500).json({ success: false, message: error.message || 'Error processing question pages' });
  }
};


/**
 * @desc    Save new exam paper draft
 * @route   POST /api/exams
 * @access  Private
 */
const savePaper = async (req, res) => {
  try {
    const { title, subtitle, subject, timeAllowed, maxMarks, generalInstructions, sections, templateId, isDraft } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Please enter a title' });
    }

    const paper = await ExamPaper.create({
      userId: req.user.id,
      title,
      subtitle,
      subject,
      timeAllowed,
      maxMarks,
      generalInstructions,
      sections,
      templateId: templateId || null,
      isDraft: isDraft !== undefined ? isDraft : true
    });

    res.status(201).json({
      success: true,
      data: paper
    });
  } catch (error) {
    console.error('Save paper error:', error.message);
    res.status(500).json({ success: false, message: 'Server error saving paper' });
  }
};

/**
 * @desc    Get all exam papers for the user
 * @route   GET /api/exams
 * @access  Private
 */
const getPapers = async (req, res) => {
  try {
    const papers = await ExamPaper.find({ userId: req.user.id }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: papers.length,
      data: papers
    });
  } catch (error) {
    console.error('Fetch papers error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching papers' });
  }
};

/**
 * @desc    Get a single paper by ID
 * @route   GET /api/exams/:id
 * @access  Private
 */
const getPaperById = async (req, res) => {
  try {
    const paper = await ExamPaper.findById(req.params.id);

    if (!paper) {
      return res.status(404).json({ success: false, message: 'Paper not found' });
    }

    if (paper.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this paper' });
    }

    res.status(200).json({
      success: true,
      data: paper
    });
  } catch (error) {
    console.error('Fetch single paper error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching paper' });
  }
};

/**
 * @desc    Update a paper draft
 * @route   PUT /api/exams/:id
 * @access  Private
 */
const updatePaper = async (req, res) => {
  try {
    let paper = await ExamPaper.findById(req.params.id);

    if (!paper) {
      return res.status(404).json({ success: false, message: 'Paper not found' });
    }

    if (paper.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this paper' });
    }

    paper = await ExamPaper.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: paper
    });
  } catch (error) {
    console.error('Update paper error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating paper' });
  }
};

/**
 * @desc    Delete a paper
 * @route   DELETE /api/exams/:id
 * @access  Private
 */
const deletePaper = async (req, res) => {
  try {
    const paper = await ExamPaper.findById(req.params.id);

    if (!paper) {
      return res.status(404).json({ success: false, message: 'Paper not found' });
    }

    if (paper.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this paper' });
    }

    await paper.deleteOne();
    res.status(200).json({ success: true, message: 'Paper removed successfully' });
  } catch (error) {
    console.error('Delete paper error:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting paper' });
  }
};

/**
 * @desc    Export exam paper as a Word Document (.docx)
 * @route   POST /api/exams/export/docx
 * @access  Private
 */
const exportWord = async (req, res) => {
  try {
    const { examData, templateId, customTemplate } = req.body;

    if (!examData) {
      return res.status(400).json({ success: false, message: 'Please provide exam paper data to export' });
    }

    // Determine the template styles to apply
    let styleTemplate = null;

    if (customTemplate) {
      styleTemplate = customTemplate;
    } else if (templateId) {
      // Check if it's a public template
      const publicMatch = PUBLIC_TEMPLATES.find(t => t._id === templateId);
      if (publicMatch) {
        styleTemplate = publicMatch;
      } else {
        // Query from database
        const dbTemplate = await Template.findById(templateId);
        if (dbTemplate) {
          styleTemplate = dbTemplate;
        }
      }
    }

    // Default formatting backup if no template could be mapped
    if (!styleTemplate) {
      styleTemplate = PUBLIC_TEMPLATES[0];
    }

    // Generate Word Document Buffer
    const docxBuffer = await generateWordDocument(examData, styleTemplate);

    // Format clean filename
    const cleanSubject = examData.subject ? examData.subject.replace(/[^a-zA-Z0-9]/g, '_') : 'Exam';
    const cleanSubtitle = examData.subtitle ? examData.subtitle.replace(/[^a-zA-Z0-9]/g, '_') : 'Paper';
    const filename = `${cleanSubject}_${cleanSubtitle}.docx`;

    // Serve stream response
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(docxBuffer);

  } catch (error) {
    console.error('DOCX Export failed:', error);
    res.status(500).json({ success: false, message: `DOCX Generation failed: ${error.message}` });
  }
};

module.exports = {
  processUpload,
  processHeaderUpload,
  processQuestionsUpload,
  savePaper,
  getPapers,
  getPaperById,
  updatePaper,
  deletePaper,
  exportWord
};
