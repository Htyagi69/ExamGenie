require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const examRoutes = require('./routes/examRoutes');
const templateRoutes = require('./routes/templateRoutes');

// Initialize app
const app = express();

// Connect Database
connectDB();

// Middlewares
app.use(cors({
  origin: '*', // Allow all origins for dev simplicity, can be locked down in prod
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' })); // Support larger body limits for embedded assets
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static upload folder (if users ever need direct asset access)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/templates', templateRoutes);

// Root greeting & status check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Exam Paper Formatter AI API is online and fully healthy!',
    version: '1.0.0'
  });
});

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: [${req.method}] ${req.originalUrl}`
  });
});

// Global Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('API Server Error Trace:', err);

  // Handle Multer upload limits/errors specifically
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Upload error: File is too large. Maximum size allowed is 10MB.'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected server error occurred!'
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` EXAM PAPER FORMATTER AI API STARTED SUCCESSFUL      `);
  console.log(` Active Port: ${PORT}                                `);
  console.log(` Mode: ${process.env.NODE_ENV || 'development'}       `);
  console.log(`====================================================`);
});

// Handle graceful shutdown signals
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Shutting down server gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
