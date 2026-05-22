const express = require('express');
const { getTemplates, getTemplateById, createTemplate, deleteTemplate } = require('../controllers/templateController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Guard all template endpoints with JWT authentication

router.route('/')
  .get(getTemplates)
  .post(createTemplate);

router.route('/:id')
  .get(getTemplateById)
  .delete(deleteTemplate);

module.exports = router;
