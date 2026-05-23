const axios = require('axios');
const fs = require('fs');
const dotenv=require('dotenv')
dotenv.config();


/**
 * High-fidelity deterministic parser (heuristic-based backup engine).
 * Uses regular expressions and text analysis to structure messy raw text.
 */
const parseTextDeterministically = (rawText) => {
  console.log('Using deterministic regex engine for structuring.');
  
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Default structure
  const result = {
    title: '',
    subtitle: '',
    subject: '',
    timeAllowed: '3 Hours',
    maxMarks: 100,
    generalInstructions: [],
    sections: []
  };

  let currentSection = null;
  let currentQuestion = null;
  let inInstructions = false;

  // Helper: Detect Marks
  const extractMarks = (text) => {
    const marksRegex = /(?:marks?\s*[:=]?\s*|\[|活|\()(\d+)(?:\s*x\s*\d+)?\s*(?:marks?|m)?(?:\s*\]|\))/i;
    const match = text.match(marksRegex);
    if (match) {
      return parseInt(match[1], 10);
    }
    // Check end of line marks like ... 5 or ... [5] or ... (2)
    const endMarksRegex = /[\s.]{2,}\(?(\d+)\)?\s*$/;
    const endMatch = text.match(endMarksRegex);
    if (endMatch) {
      return parseInt(endMatch[1], 10);
    }
    return 0;
  };

  // Helper: Clean Question Text from Marks indicators
  const cleanQuestionText = (text) => {
    return text
      .replace(/(?:marks?\s*[:=]?\s*|\[|\()(\d+)(?:\s*x\s*\d+)?\s*(?:marks?|m)?(?:\s*\]|\))/gi, '')
      .replace(/[\s.]{3,}\(?(\d+)\)?\s*$/, '')
      .trim();
  };

  // 1. Heuristic Scan for Metadata
  let headerLinesProcessed = 0;
  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Check Max Marks
    if (lowerLine.includes('max') && (lowerLine.includes('mark') || lowerLine.includes('m.m.'))) {
      const marksMatch = line.match(/(\d+)/);
      if (marksMatch) {
        result.maxMarks = parseInt(marksMatch[1], 10);
        headerLinesProcessed++;
        continue;
      }
    }

    // Check Time Allowed
    if (lowerLine.includes('time') || lowerLine.includes('duration') || lowerLine.includes('hrs') || lowerLine.includes('hours')) {
      const timeMatch = line.match(/(?:time|duration)\s*[:=]?\s*([^\n,|]+)/i);
      if (timeMatch) {
        result.timeAllowed = timeMatch[1].trim();
      } else if (lowerLine.includes('hour') || lowerLine.includes('min')) {
        result.timeAllowed = line;
      }
      headerLinesProcessed++;
      continue;
    }

    // Check Subject
    if (lowerLine.includes('subject:') || lowerLine.includes('sub:')) {
      const subMatch = line.match(/(?:subject|sub)\s*[:=]\s*([^\n,|]+)/i);
      if (subMatch) result.subject = subMatch[1].trim();
      headerLinesProcessed++;
      continue;
    }

    // Identify school/exam title
    if (i === 0 || lowerLine.includes('school') || lowerLine.includes('academy') || lowerLine.includes('college') || lowerLine.includes('public') || lowerLine.includes('high')) {
      if (!result.title) {
        result.title = line;
        headerLinesProcessed++;
        continue;
      }
    }

    // Subtitle detection
    if (i < 5 && !result.subtitle && line !== result.title) {
      if (lowerLine.includes('exam') || lowerLine.includes('class') || lowerLine.includes('test') || lowerLine.includes('term')) {
        result.subtitle = line;
        headerLinesProcessed++;
        continue;
      }
    }
  }

  // Adjust defaults if nothing matched
  if (!result.title && lines.length > 0) result.title = lines[0];
  if (!result.subtitle && lines.length > 1 && lines[1] !== result.title) result.subtitle = lines[1];

  // 2. Parse General Instructions & Questions
  let defaultSectionCreated = false;

  for (let i = headerLinesProcessed; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Check General Instructions boundary
    if (lowerLine.includes('general instruction') || lowerLine.includes('instructions:')) {
      inInstructions = true;
      continue;
    }

    // End of instructions trigger
    if (inInstructions && (lowerLine.startsWith('section') || lowerLine.startsWith('part') || /^(?:q\d+|q\.\s*\d+|\d+\.)/i.test(line))) {
      inInstructions = false;
    }

    if (inInstructions) {
      // Clean leading numbering like "1.", "•", "-"
      const cleanInstruction = line.replace(/^(?:\d+[\s.-]+|•|-)\s*/, '').trim();
      if (cleanInstruction.length > 0) {
        result.generalInstructions.push(cleanInstruction);
      }
      continue;
    }

    // A. Detect Section Headers
    if (lowerLine.startsWith('section') || lowerLine.startsWith('part') || lowerLine.startsWith('group') || 
        (/^([a-z]\s*[:.-])/i.test(line) && lowerLine.includes('section')) ||
        (line.length < 50 && (lowerLine.includes('reading') || lowerLine.includes('writing') || lowerLine.includes('literature') || lowerLine.includes('grammar') || lowerLine.includes('science')) && !/^(?:q\d+|q\.\s*\d+|\d+\.)/i.test(line))) {
      
      const secTitle = line;
      currentSection = {
        id: 'sec-' + Math.random().toString(36).substr(2, 9),
        title: secTitle,
        instruction: '',
        questions: []
      };
      result.sections.push(currentSection);
      currentQuestion = null;
      continue;
    }

    // Ensure we have at least one section
    if (!currentSection && result.sections.length === 0) {
      currentSection = {
        id: 'sec-default',
        title: 'SECTION A',
        instruction: 'Answer the following questions',
        questions: []
      };
      result.sections.push(currentSection);
    }

    // B. Detect MCQ Options (e.g. "(a) option text", "A. Option", "(1) Option")
    const optionMatch = line.match(/^(?:\(?([a-d1-4])\)|([a-d])\.|([A-D])\s*[-)])\s+(.+)$/i);
    if (optionMatch && currentQuestion) {
      currentQuestion.options.push(line);
      continue;
    }

    // C. Detect Question Numbering (e.g. "Q1.", "Q.1", "1.", "Question 1:")
    const questionMatch = line.match(/^(?:q(?:uestion)?\.?\s*(\d+)|(\d+))\s*[:.-]?\s+(.+)$/i);
    if (questionMatch) {
      const qNum = questionMatch[1] || questionMatch[2];
      const qFullText = questionMatch[3];
      const marks = extractMarks(qFullText);
      const cleanText = cleanQuestionText(qFullText);

      currentQuestion = {
        id: 'q-' + Math.random().toString(36).substr(2, 9),
        number: `Q${qNum}`,
        text: cleanText,
        marks: marks || 1,
        options: [],
        subQuestions: []
      };

      currentSection.questions.push(currentQuestion);
      continue;
    }

    // D. Detect Sub-questions (e.g. "a) sub text", "i. sub text")
    const subQMatch = line.match(/^(?:\(?([a-i])\)|([a-i])\.|(i|ii|iii|iv|v|vi)\.|\(?([0-9])\))\s+(.+)$/i);
    if (subQMatch && currentQuestion) {
      const subNum = subQMatch[1] || subQMatch[2] || subQMatch[3] || subQMatch[4];
      const subTextRaw = subQMatch[5];
      const cleanSubText = cleanQuestionText(subTextRaw);

      currentQuestion.subQuestions.push({
        id: 'subq-' + Math.random().toString(36).substr(2, 9),
        number: `${subNum})`,
        text: cleanSubText,
        marks: 0
      });
      continue;
    }

    // E. Append to current question text if it's just a continuing line
    if (currentQuestion && !line.startsWith('SECTION') && !line.startsWith('PART')) {
      // Check if it's an inline MCQ set (like: "a) Red   b) Blue   c) Green   d) Yellow")
      if (line.match(/(?:[a-d]\)|[A-D]\.)/g)?.length >= 2) {
        // Split inline options and push
        const inlineOptions = line.split(/\s{2,}/);
        if (inlineOptions.length > 1) {
          currentQuestion.options.push(...inlineOptions);
        } else {
          currentQuestion.text += ' ' + line;
        }
      } else {
        currentQuestion.text += ' ' + line;
        currentQuestion.text = cleanQuestionText(currentQuestion.text);
      }
    }
  }

  // Final clean up and default mapping
  if (result.generalInstructions.length === 0) {
    result.generalInstructions = [
      "All questions are compulsory.",
      "Marks are indicated against each question.",
      "Write neat and clean answers."
    ];
  }

  return result;
};

/**
 * AI-powered parser. Calls Google Gemini API if configured, otherwise falls back to deterministic.
 * @param {string} rawText - Raw OCR text
 * @returns {Promise<object>} - Structured JSON representation
 */
const parseExamText = async (rawText) => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return parseTextDeterministically(rawText);
  }

  try {
    console.log('Sending raw OCR text to Gemini AI for structuring...');

    const systemPrompt = `
      You are an expert exam paper digitizer. Your job is to take raw, messy, OCR-extracted exam text and structure it into a clean, valid JSON object.
      Analyze the content carefully. Detect headings, sections, question numbering, MCQ options, blanks, marks formatting, and subquestions.
      
      Here is the exact JSON structure you MUST return. Follow the keys exactly:
      {
        "title": "School or University Name",
        "subtitle": "Class/Grade, Exam Type (e.g., Annual Exam, Mid Term)",
        "subject": "Name of the Subject",
        "timeAllowed": "Duration of exam (e.g., 3 Hours)",
        "maxMarks": 80,
        "generalInstructions": [
          "Instruction 1",
          "Instruction 2"
        ],
        "sections": [
          {
            "id": "sec-unique-id",
            "title": "Section Header (e.g. SECTION A: READING)",
            "instruction": "Section specific instructions",
            "questions": [
              {
                "id": "q-unique-id",
                "number": "Question numbering (e.g. Q1, 1., Q.1)",
                "text": "The full text of the question, cleaned of trailing marks indicators",
                "marks": 5,
                "options": ["A) Option 1", "B) Option 2"], // Populate ONLY if it is an MCQ
                "subQuestions": [
                  {
                    "id": "sub-unique-id",
                    "number": "a) or i.",
                    "text": "Subquestion text",
                    "marks": 0
                  }
                ]
              }
            ]
          }
        ]
      }

      CRITICAL RULES:
      1. Always extract the marks associated with each question. If indicated like "(5x1=5)", parse the total or single marks. Store marks as integers (e.g., 5).
      2. If a question is an MCQ, extract all options into the "options" array. Strip options text from the main "text" property.
      3. Clean raw text artefacts (like weird OCR characters, typos, double spaces).
      4. If general instructions are not explicitly stated, extract a list of standard general instructions or leave it empty if appropriate, but do your best to detect them.
      5. Respond ONLY with valid, raw JSON. Do not include markdown code block syntax (\`\`\`json) or any explanation. Your entire response must be a single parseable JSON string.
      6. Never assign or extract marks for subparts/sub-questions. The "marks" property in elements of the "subQuestions" array must always be set to 0. All marks must only be mapped to the parent/main question.
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await axios.post(url, {
      contents: [{
        parts: [{
          text: `${systemPrompt}\n\nHere is the raw OCR text:\n\n${rawText}`
        }]
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) {
      throw new Error('No content returned from Gemini API.');
    }

    // Parse returned JSON
    const parsedJson = JSON.parse(candidate.trim());
    return parsedJson;

  } catch (error) {
    console.error('Gemini API structure request failed:', error.message);
    if (error.response?.data) {
      console.error('Gemini API Error Detail:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('Falling back to robust deterministic parser.');
    return parseTextDeterministically(rawText);
  }
};

/**
 * Multimodal vision parser. Sends images/PDFs directly to Gemini Vision, allowing
 * direct high-fidelity scans of cursive handwriting or low-contrast sheets in one pass.
 * @param {Array} files - Multer uploaded files list
 * @param {string} lang - Extraction language
 * @returns {Promise<object>} - Structured JSON
 */
const parseExamImagesMultimodal = async (files, lang = 'eng+hin') => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini vision model requires a valid GEMINI_API_KEY in backend env.');
  }

  try {
    console.log(`Sending ${files.length} uploaded files directly to Gemini Multimodal Vision API...`);

    const parts = [];

    const systemPrompt = `
      You are an expert handwritten exam paper reader and digitizer. 
      Your task is to scan the uploaded image(s) or PDF(s), read any handwritten or digital questions, and compile them into a clean, structured JSON format.
      The handwriting might be cursive, low contrast, or mixed bilingual English and Hindi. Extract it with high accuracy.
      
      Here is the exact JSON structure you MUST return. Follow the keys exactly:
      {
        "title": "School or University Name",
        "subtitle": "Class/Grade, Exam Type (e.g., Annual Exam, Mid Term)",
        "subject": "Name of the Subject",
        "timeAllowed": "Duration of exam (e.g., 3 Hours)",
        "maxMarks": 80,
        "generalInstructions": [
          "Instruction 1",
          "Instruction 2"
        ],
        "sections": [
          {
            "id": "sec-unique-id",
            "title": "Section Header (e.g. SECTION A: READING)",
            "instruction": "Section specific instructions",
            "questions": [
              {
                "id": "q-unique-id",
                "number": "Question numbering (e.g. Q1, 1., Q.1)",
                "text": "The full text of the question, cleaned of trailing marks indicators",
                "marks": 5,
                "options": ["A) Option 1", "B) Option 2"], // Populate ONLY if it is an MCQ
                "subQuestions": [
                  {
                    "id": "sub-unique-id",
                    "number": "a) or i.",
                    "text": "Subquestion text",
                    "marks": 0
                  }
                ]
              }
            ]
          }
        ]
      }

      CRITICAL RULES:
      1. Read the handwriting very carefully. Keep the spelling and mathematical symbols accurate.
      2. Always extract the marks associated with each question. Store marks as integers (e.g., 5). If unspecified, estimate or default to 1.
      3. If a question has multiple choice options (A, B, C, D), extract all options into the "options" array. Strip options text from the main "text" property.
      4. Support mixed language papers (English and Hindi). If a question is in Hindi, preserve the Devnagari text accurately.
      5. Respond ONLY with valid, raw JSON. Do not include markdown code block syntax (\`\`\`json) or any explanation. Your entire response must be a single parseable JSON string.
      6. Never assign or extract marks for subparts/sub-questions. The "marks" property in elements of the "subQuestions" array must always be set to 0. All marks must only be mapped to the parent/main question.
    `;

    parts.push({ text: systemPrompt });

    // Read each file and convert to inlineData base64 format
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!fs.existsSync(file.path)) {
        console.warn(`File path ${file.path} not found on disk.`);
        continue;
      }
      
      const base64Data = fs.readFileSync(file.path).toString('base64');
      
      // Map extensions to appropriate mimeTypes
      let mimeType = file.mimetype;
      if (!mimeType) {
        if (file.originalname.toLowerCase().endsWith('.pdf')) mimeType = 'application/pdf';
        else if (file.originalname.toLowerCase().endsWith('.png')) mimeType = 'image/png';
        else mimeType = 'image/jpeg';
      }

      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
      console.log(`Uploaded file page ${i + 1}/${files.length} formatted to inlineData base64.`);
    }

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await axios.post(url, {
      contents: [{
        parts: parts
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    },{
        headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY // <--- Added authorization protocol header
      }
      }
    );

    const candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) {
      throw new Error('No content returned from Gemini Multimodal Vision API.');
    }

    // Parse returned JSON
    const parsedJson = JSON.parse(candidate.trim());
    return parsedJson;

  } catch (error) {
    console.error('Gemini Multimodal Vision request failed:', error.message);
    if (error.response?.data) {
      console.error('Gemini API Error Detail:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
};

module.exports = {
  parseExamText,
  parseTextDeterministically,
  parseExamImagesMultimodal
};
