# J.A.R.V.I.S. — Neural Interface & AI Assistant

An autonomous AI assistant with an Iron Man inspired futuristic holographic HUD, real-time Arc Reactor audio visualizer, system telemetry diagnostics, speech synthesis, and interactive command feed.

---

## 🚀 Quick Start

### 🖥️ Option A: 1-Click Desktop App (Recommended)
You can launch J.A.R.V.I.S. as a dedicated desktop holographic HUD with a single click:
- **Double-click** the `J.A.R.V.I.S.` shortcut created on your Windows Desktop, OR
- **Double-click** [run_jarvis.bat](file:///c:/Users/praneshkumar/Jarvis/run_jarvis.bat), OR
- Run in terminal:
  ```bash
  python launch_desktop.py
  ```
*This automatically starts the neural core backend, creates a desktop shortcut, and launches J.A.R.V.I.S. in a borderless, dedicated desktop app window.*

---

### 🛠️ Option B: Development Mode (FastAPI + Vite dev server)

#### 1. Start the Backend API (FastAPI + SQLite)
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

- **Direct YouTube Video & Song Player**: Say *"Play Shape of You"*, *"Play a song"*, or *"Play AC/DC Back in Black"* — Jarvis instantly scrapes the top video and begins playing the music with zero clicks.
- **WhatsApp Instant Dispatch**: Say *"Send message on WhatsApp to Mom saying I arrived safely"* or *"WhatsApp 9876543210 Hello"* — opens the installed WhatsApp Desktop app or WhatsApp Web with the contact and message ready.
- **Gmail Transmission Interface**: Say *"Send email via Gmail to alex@example.com saying meeting confirmed"* — prepares and opens the Gmail compose window with recipient, subject, and body pre-filled.
- **Desktop Stealth Background Mode**: Say *"Hide"* or click the eye-off icon in the header to minimize Jarvis into an unobtrusive, floating Arc Reactor core. **Clap your hands** at any moment to awaken Jarvis back to full screen!
- **Acoustic Clap & Transient Detector**: Web Audio API continuous real-time RMS spike detector that wakes the HUD and engages hands-free voice commands.
- **Arc Reactor Audio Visualizer**: HTML5 Canvas multi-ring reactor that reacts dynamically to microphone speech and synthesized voice.
- **System Telemetry Panel**: Live CPU neural load, quantum memory allocation, battery, and hardware metrics.
- **Media Controls**: Pause, resume, skip, and stop multimedia playback system-wide.
- **Persistent SQLite Database**: Stores all conversation threads and message logs locally in `backend/jarvis.db`.

---

## ⌨️ Controls & Shortcuts

- **Spacebar**: Toggle voice listening / microphone
- **D**: Trigger system-wide diagnostic scan
- **M**: Mute / unmute sound effects
