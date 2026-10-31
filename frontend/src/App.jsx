import React, { useState, useEffect, useRef } from 'react';
import HudHeader from './components/HudHeader';
import ArcReactorVisualizer from './components/ArcReactorVisualizer';
import TelemetryPanel from './components/TelemetryPanel';
import CommandLogPanel from './components/CommandLogPanel';
import HudFooter from './components/HudFooter';
import { soundFX } from './utils/audioEffects';
import { JarvisSpeech } from './utils/speechService';

export default function App() {
  const [currentTheme, setCurrentTheme] = useState('cyan');
  const [isMuted, setIsMuted] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isJarvisSpeaking, setIsJarvisSpeaking] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    'Neural Interface online. All systems nominal. Standing by, sir.'
  );

  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'jarvis',
      time: '14:00:01',
      text: 'Good day, sir. J.A.R.V.I.S. Mark VII is fully loaded and standing by for your command.',
    },
    {
      id: 'init-2',
      sender: 'jarvis',
      time: '14:00:03',
      text: 'Arc Reactor core is calibrated at 98% nominal output. Audio telemetry matrix active.',
    },
  ]);

  const speechRef = useRef(null);

  // Initialize Speech System
  useEffect(() => {
    speechRef.current = new JarvisSpeech(
      () => setIsJarvisSpeaking(true),
      () => setIsJarvisSpeaking(false)
    );
    speechRef.current.ttsEnabled = ttsEnabled;

    // Initial boot sound
    const bootTimer = setTimeout(() => {
      soundFX.playBoot();
    }, 600);

    return () => {
      clearTimeout(bootTimer);
      if (speechRef.current) speechRef.current.stopSpeaking();
    };
  }, []);

  // Sync theme to root DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  // Sync TTS toggle
  useEffect(() => {
    if (speechRef.current) {
      speechRef.current.ttsEnabled = ttsEnabled;
    }
  }, [ttsEnabled]);

  // Sync Mute toggle
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundFX.setMuted(next);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
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
  }, [isListening, isMuted]);

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
      addJarvisMessage(reply);
      if (speechRef.current) speechRef.current.speak(reply);
    }, 2400);
  };

  // Add a message to feed
  const addUserMessage = (text) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setMessages((prev) => [...prev, { id: Date.now() + '-user', sender: 'user', time, text }]);
  };

  const addJarvisMessage = (text) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setMessages((prev) => [...prev, { id: Date.now() + '-jarvis', sender: 'jarvis', time, text }]);
  };

  // Intelligent Jarvis command processor
  const processCommand = (query) => {
    addUserMessage(query);
    const q = query.toLowerCase().trim();

    let reply = '';

    if (q.includes('diagnostic') || q.includes('scan')) {
      triggerDiagnosticScan();
      return;
    } else if (q.includes('status') || q.includes('how are you')) {
      reply = 'All telemetry systems are fully operational, sir. Quantum defenses are active, and latency is under 15 milliseconds.';
    } else if (q.includes('integrity') || q.includes('check')) {
      reply = 'System integrity confirmed at 100%. Auxiliary batteries charged, and cloud neural mesh synchronized.';
    } else if (q.includes('deploy') || q.includes('security') || q.includes('protocol')) {
      reply = 'Level four security protocols engaged. Defensive perimeter energized and external ports sealed.';
      soundFX.playAlert();
    } else if (q.includes('reactor') || q.includes('power')) {
      reply = 'Arc Reactor operating at peak efficiency. Output delivering 3.2 gigajoules per second to the neural bus.';
    } else if (q.includes('who are you') || q.includes('jarvis')) {
      reply = 'I am J.A.R.V.I.S., your autonomous intelligent assistant. I manage your neural workspace, telemetry, and audio workflows.';
    } else if (q.includes('theme') || q.includes('color')) {
      const themes = ['cyan', 'crimson', 'emerald', 'violet'];
      const nextTheme = themes[(themes.indexOf(currentTheme) + 1) % themes.length];
      setCurrentTheme(nextTheme);
      reply = `Color matrix re-routed to ${nextTheme.toUpperCase()} spectrum.`;
    } else {
      reply = `Understood, sir. Processing directive "${query}". Neural telemetry has registered your request.`;
    }

    setStatusMessage(reply);
    addJarvisMessage(reply);
    if (speechRef.current) {
      speechRef.current.speak(reply);
    }
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
            console.log('Voice rec message:', err);
            // Even if speech recognition API is blocked or quiet, keep interface active
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

        {/* Right Command Feed & Logs */}
        <CommandLogPanel
          messages={messages}
          onSendMessage={(msg) => processCommand(msg)}
          onClearLogs={() => setMessages([])}
          ttsEnabled={ttsEnabled}
          onToggleTts={() => setTtsEnabled(!ttsEnabled)}
        />
      </main>

      {/* Bottom Status Footer */}
      <HudFooter />
    </div>
  );
}
