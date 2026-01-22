# Quizleris – Modular Math Quiz Web App

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Vanilla JS](https://img.shields.io/badge/Vanilla%20JS-ES2020-green)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

**A lightweight, in-browser math quiz platform** where admins create custom quizzes with LaTeX equations, scan questions via OCR, and students take them locally. Built with TypeScript, no frameworks, pure DOM magic.

## Features

- **Math Rendering** — Full KaTeX support for LaTeX equations in prompts and choices.
- **Admin Dashboard** — Create, edit, and manage quizzes with ease.
- **OCR Integration** — Convert printed math problems to digital questions using Tesseract.js.
- **Result Visibility Control** — Toggle between Detailed Review (questions/answers) and Score Only modes.
- **Internationalization (i18n)** — Native support for Lithuanian (LT) and English (EN).
- **Zero Backend** — Runs entirely in the browser using localStorage.
- **Modular & Extensible** — Clean TypeScript architecture.

## Getting Started

1. **Clone & Install**
   ```bash
   git clone https://github.com/p0mkin/Quizleris.git
   cd Quizleris
   npm install
   ```

2. **Development**
   ```bash
   npm run dev  # Starts TypeScript watch mode
   npm start    # Launches local server
   ```

3. **Access Admin Mode**
   Append `?admin=true` to the URL.

## Tech Stack

- **Logic**: TypeScript 5.x
- **Math**: KaTeX
- **OCR**: Tesseract.js
- **Styling**: Vanilla CSS (Custom tokens, Glassmorphism, Responsive)
- **State**: Centralized `state.ts` with local persistence.

## Project Structure

- `ts/` — Source TypeScript files.
- `index.html` — Main application layout.
- `style.css` — Modern design system.
- `i18n.ts` — Translation dictionaries.
- `storage.ts` — Data persistence logic.

---
Created with ❤️ for math educators and students.
