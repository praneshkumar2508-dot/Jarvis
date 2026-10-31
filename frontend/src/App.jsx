import React, { useState, useEffect, useRef } from 'react';
import HudHeader from './components/HudHeader';
import ArcReactorVisualizer from './components/ArcReactorVisualizer';
import TelemetryPanel from './components/TelemetryPanel';
import CommandLogPanel from './components/CommandLogPanel';
import HudFooter from './components/HudFooter';
import { soundFX } from './utils/audioEffects';
import { JarvisSpeech } from './utils/speechService';
import {
  checkBackendHealth,
  fetchSessions,
  createSession,
  fetchSessionDetails,
  deleteSession,
  sendMessage,
} from './utils/api';

export default function App() {
  const [currentTheme, setCurrentTheme] = useState('cyan');
  const [isMuted, setIsMuted] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isJarvisSpeaking, setIsJarvisSpeaking] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Chat sessions state
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [statusMessage, setStatusMessage] = useState(
    'Neural Interface online. All systems nominal. Standing by, sir.'
  );

  const speechRef = useRef(null);

  // 1. Initialize Speech System & Boot Audio
  useEffect(() => {
    speechRef.current = new JarvisSpeech(
      () => setIsJarvisSpeaking(true),
      () => setIsJarvisSpeaking(false)
    );
    speechRef.current.ttsEnabled = ttsEnabled;

    const bootTimer = setTimeout(() => {
      soundFX.playBoot();
    }, 600);

    return () => {
      clearTimeout(bootTimer);
      if (speechRef.current) speechRef.current.stopSpeaking();
    };
  }, []);

  // 2. Initialize Backend Connection & Load Saved Sessions from Database
  useEffect(() => {
    async function initDatabase() {
      const isHealthy = await checkBackendHealth();
      setIsBackendConnected(isHealthy);

      if (isHealthy) {
        try {
          const list = await fetchSessions();
          setSessions(list);

          if (list.length > 0) {
            // Select the most recent session
            const mostRecent = list[0];
            setActiveSessionId(mostRecent.id);
            const detail = await fetchSessionDetails(mostRecent.id);
            setMessages(detail.messages || []);
          } else {
            // Create initial session in database
            const newSession = await createSession('Primary Neural Session');
            setSessions([newSession]);
            setActiveSessionId(newSession.id);
            setMessages(newSession.messages || []);
          }
        } catch (err) {
          console.warn('Error loading initial session from database:', err);
          initFallbackSession();
        }
      } else {
        initFallbackSession();
      }
    }

    initDatabase();
  }, []);

  // Local fallback session if backend is initializing or offline
  const initFallbackSession = () => {
    const fallbackId = 'local-session-1';
    setActiveSessionId(fallbackId);
    setSessions([
      {
        id: fallbackId,
        title: 'Primary Neural Session',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        message_count: 2,
      },
    ]);
    setMessages([
      {
        id: 1,
        sender: 'jarvis',
        created_at: new Date().toISOString(),
        text: 'Good day, sir. J.A.R.V.I.S. Mark VII is fully loaded and standing by for your command.',
      },
      {
        id: 2,
        sender: 'jarvis',
        created_at: new Date().toISOString(),
        text: 'Arc Reactor core is calibrated at 98% nominal output. Audio telemetry matrix active.',
      },
    ]);
  };

  // Sync theme attribute to <html> root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  // Sync TTS toggle
  useEffect(() => {
    if (speechRef.current) {
      speechRef.current.ttsEnabled = ttsEnabled;
    }
  }, [ttsEnabled]);

  // Handle Mute toggle
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundFX.setMuted(next);
  };

  // Switch to selected session from history
  const handleSelectSession = async (sessionId) => {
    setActiveSessionId(sessionId);
    if (isBackendConnected) {
      try {
        const detail = await fetchSessionDetails(sessionId);
        setMessages(detail.messages || []);
        setStatusMessage(`Loaded session "${detail.title}". Standing by.`);
      } catch (err) {
        console.error('Failed to load session details:', err);
      }
    }
  };

  // Create a brand New Chat session in database
  const handleNewChat = async () => {
    if (isBackendConnected) {
      try {
        const newSession = await createSession('New Neural Session');
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setMessages(newSession.messages || []);
        const reply = 'New neural session initiated, sir. All parameters cleared for new directives.';
        setStatusMessage(reply);
        if (speechRef.current) speechRef.current.speak(reply);
      } catch (err) {
        console.error('Failed to create new session on backend:', err);
      }
    } else {
      const newId = 'local-' + Date.now();
      const localSession = {
        id: newId,
        title: 'New Neural Session',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        message_count: 1,
      };
      setSessions((prev) => [localSession, ...prev]);
      setActiveSessionId(newId);
      setMessages([
        {
          id: Date.now(),
          sender: 'jarvis',
          created_at: new Date().toISOString(),
          text: 'New neural session initialized in local mode. Standing by, sir.',
        },
      ]);
    }
  };

  // Delete a session
  const handleDeleteSession = async (sessionId) => {
    if (isBackendConnected) {
      try {
        await deleteSession(sessionId);
      } catch (err) {
        console.error('Failed to delete session:', err);
      }
    }

    const remaining = sessions.filter((s) => s.id !== sessionId);
    setSessions(remaining);

    if (activeSessionId === sessionId) {
      if (remaining.length > 0) {
        handleSelectSession(remaining[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        toggleListening();
      } else if (e.key.toLowerCase() === 'd') {
        triggerDiagnosticScan();
      } else if (e.key.toLowerCase() === 'm') {
        handleToggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening, isMuted, activeSessionId, isBackendConnected]);

  // Main Command / Message Processor (Connected to SQLite Backend)
  const processCommand = async (query) => {
    if (!query.trim()) return;

    // 1. Proactive user-gesture browser opener (bypasses browser popup blocker policies)
    const qLower = query.toLowerCase().trim();
    const webIntentMap = {
      youtube: 'https://www.youtube.com',
      google: 'https://www.google.com',
      github: 'https://www.github.com',
      reddit: 'https://www.reddit.com',
      netflix: 'https://www.netflix.com',
      spotify: 'https://open.spotify.com',
      gmail: 'https://mail.google.com',
    };

    let openedInBrowser = false;
    for (const [key, targetUrl] of Object.entries(webIntentMap)) {
      if (
        qLower.includes(key) &&
        (qLower.startsWith('open') || qLower.startsWith('launch') || qLower.startsWith('go to') || qLower.startsWith('visit'))
      ) {
        try {
          window.open(targetUrl, '_blank');
          openedInBrowser = true;
        } catch (e) {
          console.warn('Popup blocked:', e);
        }
        break;
      }
    }

    if (isBackendConnected && activeSessionId && !activeSessionId.startsWith('local-')) {
      // Optimistically append user message immediately to feed
      const tempUserMsg = {
        id: 'temp-' + Date.now(),
        sender: 'user',
        text: query,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMsg]);
      setStatusMessage(`Processing query: "${query}"...`);

      try {
        const response = await sendMessage(activeSessionId, query);
        const jarvisText = response.jarvis_message.text;

        // If backend provided an active client action (e.g. open website) and not yet opened
        if (response.action && response.action.type === 'open_url' && !openedInBrowser) {
          try {
            window.open(response.action.url, '_blank');
          } catch (err) {
            console.warn('Browser popup blocked:', err);
          }
        }

        // Replace optimistic message and append persisted messages
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempUserMsg.id),
          response.user_message,
          response.jarvis_message,
        ]);

        setStatusMessage(jarvisText);

        // Vocalize response via TTS
        if (speechRef.current) {
          speechRef.current.speak(jarvisText);
        }

        // Refresh sessions list to display updated title & timestamp
        const updatedList = await fetchSessions();
        setSessions(updatedList);
      } catch (err) {
        console.error('Failed to transmit message to backend:', err);
        fallbackLocalProcess(query);
      }
    } else {
      fallbackLocalProcess(query);
    }
  };

  // Client-side fallback message processor
  const fallbackLocalProcess = (query) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    const userMsg = { id: Date.now() + '-user', sender: 'user', time, text: query };

    const q = query.toLowerCase();
    let reply = `Understood, sir. Directive regarding "${query}" has been processed.`;

    if (q.includes('diagnostic') || q.includes('scan')) {
      triggerDiagnosticScan();
      return;
    } else if (q.includes('status') || q.includes('how are you')) {
      reply = 'All telemetry systems are fully operational, sir. Quantum defenses are active.';
    } else if (q.includes('reactor') || q.includes('power')) {
      reply = 'Arc Reactor operating at peak efficiency. Output delivering 3.2 gigajoules per second.';
    } else if (q.includes('who are you') || q.includes('jarvis')) {
      reply = 'I am J.A.R.V.I.S., your autonomous intelligent assistant.';
    }

    const jarvisMsg = { id: Date.now() + '-jarvis', sender: 'jarvis', time, text: reply };
    setMessages((prev) => [...prev, userMsg, jarvisMsg]);
    setStatusMessage(reply);
    if (speechRef.current) speechRef.current.speak(reply);
  };

  // Trigger diagnostic scan sweep
  const triggerDiagnosticScan = () => {
    setIsScanning(true);
    soundFX.playScan();
    setStatusMessage('Initiating neural diagnostic scan across all telemetry sectors...');

    setTimeout(() => {
      setIsScanning(false);
      soundFX.playConfirm();
      const reply = 'Diagnostic complete. Core processors at 99.4% efficiency. Zero anomalies detected, sir.';
      setStatusMessage(reply);

      if (isBackendConnected && activeSessionId && !activeSessionId.startsWith('local-')) {
        sendMessage(activeSessionId, 'System diagnostic report').then((res) => {
          setMessages((prev) => [...prev, res.user_message, res.jarvis_message]);
        }).catch(() => {});
      } else {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + '-u', sender: 'user', time, text: 'Run system diagnostic scan' },
          { id: Date.now() + '-j', sender: 'jarvis', time, text: reply },
        ]);
      }

      if (speechRef.current) speechRef.current.speak(reply);
    }, 2400);
  };

  // Toggle voice recognition & listening
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      if (speechRef.current) speechRef.current.stopListening();
      setStatusMessage('Voice recognition suspended. Core in standby.');
      soundFX.playClick();
    } else {
      setIsListening(true);
      setStatusMessage('Listening to audio input... Speak now, sir.');
      soundFX.playConfirm();

      if (speechRef.current) {
        speechRef.current.startListening(
          (transcript) => {
            setIsListening(false);
            processCommand(transcript);
          },
          (err) => {
            console.log('Voice recognition notification:', err);
          }
        );
      }
    }
  };

  return (
    <div className="hud-root">
      {/* Background Grid & Scanlines */}
      <div className="hud-background" />
      <div className="hud-scanlines" />

      {/* Laser diagnostic scanline sweep */}
      {isScanning && <div className="scan-line-sweep" />}

      {/* Top Header */}
      <HudHeader
        currentTheme={currentTheme}
        onThemeChange={(theme) => setCurrentTheme(theme)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Central Interactive HUD Grid */}
      <main className="hud-content">
        {/* Left Telemetry Panel */}
        <TelemetryPanel onTriggerScan={triggerDiagnosticScan} />

        {/* Center Arc Reactor & Audio Visualizer */}
        <ArcReactorVisualizer
          isListening={isListening}
          onToggleListen={toggleListening}
          isJarvisSpeaking={isJarvisSpeaking}
          statusMessage={statusMessage}
          onQuickCommand={(cmd) => processCommand(cmd)}
        />

        {/* Right Command Feed & Chat History with Database Integration */}
        <CommandLogPanel
          messages={messages}
          onSendMessage={(msg) => processCommand(msg)}
          ttsEnabled={ttsEnabled}
          onToggleTts={() => setTtsEnabled(!ttsEnabled)}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          isBackendConnected={isBackendConnected}
        />
      </main>

      {/* Bottom Status Footer */}
      <HudFooter />
    </div>
  );
}
