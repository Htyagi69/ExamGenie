const express = require('express');
const { 
  processUpload, 
  processHeaderUpload,
  processQuestionsUpload,
  savePaper,
  getPapers,
  getPaperById,
  updatePaper,
  deletePaper,
  exportWord 
} = require('../controllers/examController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect); // Guard all exam-related routes with JWT auth

// Processing file upload
router.post('/upload', upload.single('file'), processUpload);
router.post('/upload-header', upload.single('file'), processHeaderUpload);
router.post('/upload-questions', upload.array('files', 15), processQuestionsUpload);

// Standard saved exam draft operations
router.route('/')
  .get(getPapers)
  .post(savePaper);

router.route('/:id')
  .get(getPaperById)
  .put(updatePaper)
  .delete(deletePaper);

// Exporter trigger
router.post('/export/docx', exportWord);

module.exports = router;
