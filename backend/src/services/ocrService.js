const Tesseract = require('tesseract.js');
const fs = require('fs');
const pdfParse = require('pdf-parse');

/**
 * Extracts raw text from an image file using Tesseract OCR.
 * Supports multi-language OCR (e.g., English 'eng', Hindi 'hin', or mixed).
 * @param {string} filePath - Absolute path to the image
 * @param {string} lang - OCR language (default 'eng+hin')
 * @returns {Promise<string>} - Extracted text
 */
const extractTextFromImage = async (filePath, lang = 'eng+hin') => {
  try {
    console.log(`Starting Tesseract OCR on image: ${filePath} with language: ${lang}`);
    const result = await Tesseract.recognize(filePath, lang, {
      logger: m => console.log(`OCR Progress: ${(m.progress * 100).toFixed(1)}% - ${m.status}`),
    });
    return result.data.text;
  } catch (error) {
    console.error('Error during image OCR:', error);
    throw new Error(`OCR processing failed: ${error.message}`);
  }
};

/**
 * Extracts text from a PDF file. If the PDF contains text, it uses pdf-parse.
 * @param {string} filePath - Absolute path to the PDF file
 * @returns {Promise<string>} - Extracted text
 */
const extractTextFromPDF = async (filePath) => {
  try {
    console.log(`Extracting text from PDF: ${filePath}`);
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    
    // If the PDF is scanned and has little to no text, we let the user know
    if (!data.text || data.text.trim().length < 50) {
      console.warn('PDF seems to be scanned or contains very little selectable text.');
      return `[Scanned PDF Detected]\nWe detected a scanned or image-based PDF. For best results with scanned documents, please convert them to images (PNG/JPG) and upload them directly, or run standard OCR on each page.\n\nRaw text extracted (if any):\n${data.text || ''}`;
    }
    
    return data.text;
  } catch (error) {
    console.error('Error during PDF extraction:', error);
    throw new Error(`PDF processing failed: ${error.message}`);
  }
};

/**
 * Main service orchestrator to extract text from uploads.
 * @param {object} file - Express Multer file object
 * @param {string} lang - Multi-language choice
 * @returns {Promise<string>} - Extracted text
 */
const extractText = async (file, lang = 'eng+hin') => {
  const fileExt = file.originalname.split('.').pop().toLowerCase();
  
  if (fileExt === 'pdf') {
    return await extractTextFromPDF(file.path);
  } else if (['jpg', 'jpeg', 'png'].includes(fileExt)) {
    return await extractTextFromImage(file.path, lang);
  } else {
    throw new Error('Unsupported file type for OCR processing.');
  }
};

module.exports = {
  extractText,
  extractTextFromImage,
  extractTextFromPDF
};
