# Exam Paper Formatter AI 🎓✨

A highly polished, full-stack AI-powered document structuring and digitizing engine. Teachers and students can upload handwritten notes, low-resolution photos, or messy PDFs, and automatically compile them into clean, beautifully formatted Microsoft Word (.docx) documents and print-ready A4 PDFs.

---

## 🌟 Main Core Features

1. **Dual-Layer Extraction Engine**:
   - **OCR Layer**: Extract characters using high-accuracy Tesseract OCR (with mixed English + Hindi support) or direct text scanning via `pdf-parse`.
   - **AI Layout Semantic Layer**: Parses unstructured text into organized sections, handles question items, structures MCQ options (A/B/C/D), maps sub-questions, and associates marks dynamically. Uses Google Gemini AI with a seamless **Deterministic Regular Expression Parser fallback** if no API keys are provided.
2. **Splitscreen Realtime Editor**:
   - Left-pane questionnaire builder to quickly edit text, modify marks, add MCQ options, delete nested items, or drag/reorder questions.
   - Right-pane live printable A4 sheet mockup matching margins, dividers, and alignments instantly.
3. **Flexible Visual Styles**:
   - Typography font families: Arial, Times New Roman, Calibri.
   - Spacing configs (pt padding) and double-lined division separators.
   - Marks positions: inline parentheses `(5)` or perfectly aligned in right-hand margin columns `[5]`.
   - Multi-option grids: MCQ choices automatically layout in space-saving columns.
4. **Multi-Format Exports**:
   - Direct download of highly formatted `.docx` Word documents compiled via `docx`.
   - Browser printing triggers configured using custom print media stylesheets (`@media print`) to export standard pixel-perfect A4 PDFs immediately.
5. **Saved Drafts & Templates**:
   - Persistent user accounts backed by JWT authentication.
   - cloud dashboard listing drafts and storing custom visual layout profiles in MongoDB.
6. **Cyberpunk/Glassmorphic Aesthetics**:
   - Modern glass layout plates, backdrop blur bubble accents, glowing active indicators, and sleek dark mode presets.

---

## 📂 Architecture Structure

```
ExamGenie/
├── backend/
│   ├── src/
│   │   ├── config/          # Mongoose database bootstrapper
│   │   ├── controllers/     # Authentication, upload OCR parsing, and docx generation
│   │   ├── middleware/      # JWT guards, Multer disk storage config
│   │   ├── models/          # User, Template, and Exam schemas
│   │   ├── routes/          # Express API endpoints
│   │   ├── services/        # Tesseract, Gemini API wrapper, and docx builder services
│   │   └── index.js         # Entry point
│   ├── .env                 # Active environment keys
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # UI Navbar and footer blurs
│   │   ├── context/         # AuthContext and ThemeContext (Dark Mode)
│   │   ├── hooks/           # useLocalStorage hooks
│   │   ├── pages/           # Home, Login, Register, Dashboard, Upload, Split Editor
│   │   ├── utils/           # Pre-configured Axios routing helpers
│   │   ├── index.css        # Tailwind layers and print stylesheets
│   │   └── App.jsx          # Route guards and router mounts
│   ├── tailwind.config.js   # Custom Indigo theme configuration
│   └── package.json
└── README.md
```

---

## 🛠️ Step-by-Step Setup Instructions

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **MongoDB** (running locally or a MongoDB Atlas connection string)
- **Google Gemini API Key** (optional, for semantic parsing boost)

### 2. Configure Backend Server
Navigate to the `backend` folder and edit the `.env` file (or duplicate `.env.example`):
```ini
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/exam-genie
JWT_SECRET=supersecretkey123
GEMINI_API_KEY=your_gemini_api_key_here
```
*Note: If `GEMINI_API_KEY` is left blank, the server automatically defaults to the intelligent deterministic regex parser so the application is fully functional out-of-the-box!*

### 3. Running the Application Locally

#### Start MongoDB
Ensure your local MongoDB instance is active on port `27017` (standard default).

#### Start API Server
In a terminal at `backend/`:
```bash
npm run dev
```
The console will log `MongoDB Connected` and active status on Port `5000`.

#### Start React Frontend
In a separate terminal at `frontend/`:
```bash
npm run dev
```
Vite will boot the client app, standard address is usually `http://localhost:5173`. Open this URL in your web browser!

---

## 💡 Using the Application

1. **Account Registration**: Click "Get Started" and create an account. Your session is secured via encrypted JWT signatures.
2. **Start Scanning**: Go to **Upload Paper**, choose standard mixed `Hindi + English` or `English Only` dials, drag your document photo, and click **Analyze & Format Exam**.
3. **Visual Progress**: Keep tabs as the scanner advances from uploading to OCR scanning and structuring.
4. **Splitscreen Fine-Tuning**: In the editor, make ad-hoc text adjustments, rearrange questions, or tap "Settings" to switch margins, board styles, or right-aligned marks.
5. **Download & Share**: Click **Download DOCX** to save the editable Word file, or tap **Print / Save PDF** to open the browser print dialog and select "Save as PDF" for instant high-fidelity printable layouts!
