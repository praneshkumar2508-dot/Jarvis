# J.A.R.V.I.S. — Neural Interface & AI Assistant

An autonomous AI assistant with an Iron Man inspired futuristic holographic HUD, real-time Arc Reactor audio visualizer, system telemetry diagnostics, speech synthesis, and interactive command feed.

---

## 🚀 Quick Start

### 1. Start the Backend API (FastAPI + SQLite)
```bash
# Navigate to backend directory
cd backend

# Run the backend server
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
The backend will automatically initialize `backend/jarvis.db` and listen at **http://127.0.0.1:8000**.
Interactive API documentation is available at **http://127.0.0.1:8000/docs**.

### 2. Start the Frontend (React + Vite)
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not installed yet)
npm install

# Start the development server
npm run dev
```
Open your browser to **http://localhost:5173/**.

---

## ⚡ Key Features

- **Arc Reactor Audio Visualizer**: HTML5 Canvas multi-ring reactor that reacts dynamically to microphone speech and synthesized voice.
- **Persistent SQLite Database**: Stores all conversation threads and message logs locally in `backend/jarvis.db`.
- **Chat History & New Chat**: Switch between previous conversations, delete old threads, or initiate new sessions on the fly.
- **System Telemetry Panel**: Live CPU neural load, quantum memory allocation, and subsystem matrices.
- **Diagnostic Laser Sweep**: Interactive full-HUD laser scanline sweep with Web Audio API sound synthesis.
- **Speech Synthesis (TTS) & Voice Recognition**: Voice input handling with polite, intelligent Jarvis responses.
- **Theme Matrix**: 4 switchable color schemes (Hologram Cyan, Mark VII Crimson & Gold, Quantum Emerald, Nebula Violet).
- **Sound Effects Engine**: Client-side Web Audio API synthesizer for sci-fi UI feedback.

---

## ⌨️ Controls & Shortcuts

- **Spacebar**: Toggle voice listening / microphone
- **D**: Trigger system-wide diagnostic scan
- **M**: Mute / unmute sound effects
