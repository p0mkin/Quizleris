# Quizleris – Modular Math Quiz Web App

[![Vanilla JS](https://img.shields.io/badge/Vanilla%20JS-ES2020-green)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com/)

**Quizleris** is a lightweight, professional, browser-based math quiz platform designed for educators and students. Built with pure Vanilla JS for maximum compatibility and performance, it features advanced math rendering, OCR capabilities, and local persistence—no backend required.

## 🚀 Key Features

### 🛠️ Admin Mode
Create and manage complex quizzes with a powerful suite of tools:
- **6 Question Types**: Multiple-choice (single/multi), numeric with tolerance, fill-in-the-blank (dynamic inputs via `___` markers), manual text grading, and true/false.
- **Rich Media**: LaTeX support via **KaTeX** and image uploads (Base64).
- **Control**: Toggle shuffle for questions/choices, set timer modes, and manage result visibility (Detailed Review vs. Score Only).
- **OCR Integration**: Scan printed math questions directly into the editor using **Tesseract.js**.

### 🎓 Student Mode
Designed for a seamless exam or practice experience:
- **Practice Mode**: Instant feedback for rapid learning.
- **Exam Mode**: Navigate all questions, highlight unanswered items, and confirm submission.
- **UX Excellence**: Modern, responsive UI with glassmorphism, smooth animations (gradient buttons, shake effects), and intuitive navigation.

### 🌍 Universal Support
- **i18n**: Native English (EN) and Lithuanian (LT) support with browser language detection and persistence.
- **Zero Backend**: All data is saved securely in `localStorage`.
- **Sharing**: One-click URL copying for quiz sharing using UTF-8 safe encoding.

## 🛠️ Tech Stack

- **Core**: Vanilla JavaScript (ES2020+)
- **Math Rendering**: [KaTeX](https://katex.org/)
- **OCR**: [Tesseract.js](https://tesseract.projectnaptha.com/)
- **Styling**: Vanilla CSS (Custom tokens, Fluid Typography, Responsive Grid)
- **Deployment**: Optimized for Vercel/Static Hosting

## 📥 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (for local development server)

### Installation
1. **Clone the repository**
   ```bash
   git clone https://github.com/p0mkin/Quizleris.git
   cd Quizleris
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```

### Local Testing
Start a local development server with auto-refresh:
```bash
npm start
```
By default, the app will be available at `http://localhost:8080`.

## 🌐 Deployment

### Vercel Instructions
Quizleris is ready for static deployment:
- **Framework Preset**: Other (Static)
- **Build Command**: `echo 'No build step'` (or leave blank)
- **Output Directory**: `.`
- **Routing**: Handled via `vercel.json` for SPA-like behavior.

## ⚠️ Known Issues & Limitations
- **OCR Variability**: Scanning accuracy depends on image quality and font style. Manual correction may be needed for complex LaTeX structures.
- **Local Persistence**: Quizzes are stored in your browser's `localStorage`. Clearing browser data will delete local quizzes unless shared/exported.

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📜 Changelog

### v0.4.1
- **Vanilla JS Refactor**: Migrated codebase from TypeScript to pure Vanilla JS for zero-build overhead.
- **Bug Fixes**: 
  - Fixed fill-blank admin inputs parsing logic.
  - Improved image validation and fallback handling.
- **Infrastructure**: Configured static Vercel deployment and enhanced error logging.

---
Created with ❤️ by [e1tvis](https://github.com/p0mkin).
