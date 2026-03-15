# SlangNorm AI 🌐

> **A production-grade AI system that transforms internet slang, Gen-Z speak, and informal text into clear formal language — powered by Claude AI with a live-crawled dataset that never stops learning.**

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_App-00d4ff?style=for-the-badge)](https://slangnormai.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Abhay--211-9b5de5?style=for-the-badge&logo=github)](https://github.com/Abhay-211/slangnormai)
[![Built With](https://img.shields.io/badge/Built_With-React_+_Vite-f59e0b?style=for-the-badge&logo=react)](https://vitejs.dev)
[![AI Powered](https://img.shields.io/badge/AI-Claude_Sonnet-ff3d6e?style=for-the-badge)](https://anthropic.com)

---

## 📸 Preview

![SlangNorm AI Landing Page](https://via.placeholder.com/1200x600/060612/00d4ff?text=SlangNorm+AI+—+Decode+the+Internet%27s+Language)

---

## ✨ What is SlangNorm AI?

SlangNorm AI is a full-stack SaaS web application built as an academic portfolio project. It solves a real problem — normalizing internet slang and informal language into professional, formal text using a live AI pipeline.

**Example:**
```
Input:  "ngl this bussin fr no cap, lowkey slay"
Output: "not gonna lie this is exceptionally good for real, no lie, somewhat impressively done"
```

---

## 🚀 Features

| Feature | Description |
|---|---|
| 🤖 **Live AI Lookup** | Unknown slang fetched in real-time via Claude AI — no static dictionary limits |
| ✦ **Sentence Generator** | Generate authentic slang sentences with Gen-Z, AAVE, British dialect control |
| 🕷️ **Web Crawler Pipeline** | Automated crawler harvesting slang from 6 live web sources |
| ⚡ **5-Stage NLP Pipeline** | Tokenize → POS Tag → Detect → Replace → Format |
| 📊 **Live Analytics** | Real-time dashboard with term stats, category breakdowns, source attribution |
| 🗄️ **Live Dataset** | Searchable, sortable in-memory database that grows with every query |

---

## 🛠️ Tech Stack

```
Frontend     →  React 19 + Vite 8
Styling      →  Pure CSS-in-JS (zero external UI libraries)
AI Backend   →  Anthropic Claude Sonnet API
Deployment   →  Vercel (Frontend) + GitHub
```

---

## 📁 Project Structure

```
slangnormai/
├── index.html          ← Landing page (served at /)
├── app.html            ← React app entry point
├── src/
│   ├── App.jsx         ← Full React app (5 pages)
│   ├── main.jsx        ← React entry point
│   └── index.css       ← Global styles
├── public/
│   └── landing_backup.html
├── .env                ← API keys (not committed)
├── .gitignore
├── package.json
└── vite.config.js
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js 18+
- Anthropic API key from [console.anthropic.com](https://console.anthropic.com)

### Installation

**1. Clone the repo**
```bash
git clone https://github.com/Abhay-211/slangnormai.git
cd slangnormai
```

**2. Install dependencies**
```bash
npm install
```

**3. Create `.env` file**
```env
VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**4. Run locally**
```bash
npm run dev
```

**5. Open in browser**
```
http://localhost:5173
```

---

## 🧠 How It Works

```
User Input Text
      ↓
  Tokenizer        → Splits text, detects multi-word slang first
      ↓
  POS Tagger       → Tags parts of speech for context
      ↓
 Slang Detector    → Checks cache → calls Claude AI for unknowns
      ↓
Context Engine     → Replaces slang preserving grammar
      ↓
   Formatter       → Applies output mode, caches new terms
      ↓
Normalized Output
```

---

## 📱 Pages

| Page | Description |
|---|---|
| **Normalizer** | Main tool — paste slang text, get formal output with detected terms |
| **Sentence Gen** | Enter slang terms → AI generates natural authentic sentences |
| **Web Crawler** | Simulated pipeline crawling 6 web sources for new slang |
| **Dataset** | Live searchable table of all terms in the database |
| **Analytics** | Real-time charts — top terms, categories, sources, counts |

---

## 🌐 Live Demo

👉 **[slangnormai.vercel.app](https://slangnormai.vercel.app)**

Try these inputs:
- `ngl this bussin fr no cap`
- `she's lowkey extra but her drip is snatched tbh`
- `bet hmu asap imo we need to vibe check rn`

---

## 🎓 Academic Context

Built as a **portfolio project** for BCA (Artificial Intelligence), 4th Semester at **Invertis University, Bareilly**.

**Concepts demonstrated:**
- Natural Language Processing (NLP) pipeline design
- RESTful API integration (Anthropic Claude)
- React state management & component architecture
- Full-stack SaaS application development
- Real-time data updates & in-memory database simulation
- Web deployment (Vercel + GitHub CI/CD)

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

## 👨‍💻 Author

**Abhay** — BCA (AI) Student, Invertis University  
GitHub: [@Abhay-211](https://github.com/Abhay-211)

---

> *"Built not as a prototype — but as a real production-grade AI product."*
