# Quizleris – Modular Math Quiz Web App

[![Vanilla JS](https://img.shields.io/badge/Vanilla%20JS-ES20202-green)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Version](https://img.shields.io/badge/version-v0.5.0-blue)](package.json)

**Quizleris** is a lightweight, professional, browser-based math quiz platform designed for educators and students. Built with pure Vanilla JS for maximum compatibility and performance, it features advanced math rendering, OCR capabilities, and local persistence—no backend required.

## 🚀 Key Features

### 🛠️ Admin Mode
Create and manage complex quizzes with a powerful suite of tools:
- **6 Question Types**: Multiple-choice, numeric, fill-in-the-blank, text, true/false, and image upload.
- **Rich Media**: LaTeX support via **KaTeX** and image uploads.
- **Control**: Toggle shuffle, set timer modes, and manage result visibility.
- **OCR Integration**: Scan printed math questions using **Tesseract.js**.

### 🎓 Student Mode
Designed for a seamless exam or practice experience:
- **Practice Mode**: Instant feedback for rapid learning.
- **Exam Mode**: Navigate all questions, highlight unanswered items, and confirm submission.
- **UX Excellence**: Modern, responsive UI with glassmorphism and smooth animations.

### 🌍 Universal Support
- **i18n**: Native English (EN) and Lithuanian (LT) support.
- **Zero Backend**: All data is saved securely in `localStorage`.
- **Sharing**: One-click URL copying for quiz sharing.

## 🛠️ Tech Stack

- **Core**: Vanilla JavaScript (ES2020+)
- **Math Rendering**: [KaTeX](https://katex.org/)
- **OCR**: [Tesseract.js](https://tesseract.projectnaptha.com/)
- **Styling**: Vanilla CSS

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
Start a local development server:
```bash
npm start
```
Open `http://localhost:8080`.

## 📜 Changelog

### v0.5.0
- **Cleanup**: Removed legacy TypeScript source files and documentation.
- **Optimization**: Streamlined codebase for pure Vanilla JS development.

### v0.4.x
- **Vanilla JS Refactor**: Migrated codebase from TypeScript to pure Vanilla JS.
- **Bug Fixes**: Fixed fill-blank parsing and image validation.

---
Created with ❤️ by [e1tvis](https://github.com/p0mkin).
