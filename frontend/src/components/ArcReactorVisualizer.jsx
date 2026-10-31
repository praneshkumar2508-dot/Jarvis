import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Activity } from 'lucide-react';
import { soundFX } from '../utils/audioEffects';

export default function ArcReactorVisualizer({
  isListening,
  onToggleListen,
  isJarvisSpeaking,
  statusMessage,
  onQuickCommand,
}) {
  const arcCanvasRef = useRef(null);
  const scopeCanvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const [hasMicPermission, setHasMicPermission] = useState(false);

  // Initialize Microphone stream if listening is enabled
  useEffect(() => {
    let active = true;

    async function setupMic() {
      if (isListening) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (!active) return;
          micStreamRef.current = stream;

          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          const ctx = new AudioCtx();
          audioCtxRef.current = ctx;

          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.8;
          analyserRef.current = analyser;

          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);
          setHasMicPermission(true);
        } catch (err) {
          console.warn('Microphone access unavailable or denied:', err);
          setHasMicPermission(false);
        }
      } else {
        // Stop stream when listening stops
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach((track) => track.stop());
          micStreamRef.current = null;
        }
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
          audioCtxRef.current.close().catch(() => {});
          audioCtxRef.current = null;
        }
        analyserRef.current = null;
      }
    }

    setupMic();

    return () => {
      active = false;
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [isListening]);

  // Main Canvas Render Loop (Circular Arc Reactor & Oscilloscope Scope)
  useEffect(() => {
    const arcCanvas = arcCanvasRef.current;
    const scopeCanvas = scopeCanvasRef.current;
    if (!arcCanvas || !scopeCanvas) return;

    const arcCtx = arcCanvas.getContext('2d');
    const scopeCtx = scopeCanvas.getContext('2d');

    let time = 0;

    const render = () => {
      time += 0.04;

      // Determine frequency data
      const bufferLength = 128;
      const dataArray = new Uint8Array(bufferLength);

      if (analyserRef.current && isListening) {
        analyserRef.current.getByteFrequencyData(dataArray);
      } else {
        // Simulated cybernetic ambient waveforms
        const intensity = isJarvisSpeaking ? 1.6 : 0.7;
        for (let i = 0; i < bufferLength; i++) {
          const noise = Math.sin(time * 3 + i * 0.15) * 20 + Math.cos(time * 1.5 - i * 0.1) * 25;
          const baseline = isJarvisSpeaking ? 80 : 25;
          dataArray[i] = Math.max(8, Math.min(255, (baseline + noise) * intensity));
        }
      }

      // --- 1. RENDER CIRCULAR ARC REACTOR FREQUENCY SPIKES ---
      const w = arcCanvas.width;
      const h = arcCanvas.height;
      arcCtx.clearRect(0, 0, w, h);

      const centerX = w / 2;
      const centerY = h / 2;
      const baseRadius = 118; // Around the inner arc core
      const numBars = 72;

      // Fetch active primary theme color from CSS variable
      const style = getComputedStyle(document.documentElement);
      const primaryColor = style.getPropertyValue('--hud-primary').trim() || '#00f0ff';
      const secondaryColor = style.getPropertyValue('--hud-secondary').trim() || '#0066ff';

      for (let i = 0; i < numBars; i++) {
        const angle = (i / numBars) * Math.PI * 2 + time * 0.1;
        const dataIdx = Math.floor((i / numBars) * (bufferLength / 2));
        const val = dataArray[dataIdx] || 15;
        const barHeight = 8 + (val / 255) * 44;

        const x1 = centerX + Math.cos(angle) * baseRadius;
        const y1 = centerY + Math.sin(angle) * baseRadius;
        const x2 = centerX + Math.cos(angle) * (baseRadius + barHeight);
        const y2 = centerY + Math.sin(angle) * (baseRadius + barHeight);

        arcCtx.beginPath();
        arcCtx.moveTo(x1, y1);
        arcCtx.lineTo(x2, y2);
        arcCtx.lineWidth = 2.5;

        // Gradient for each radial needle
        const grad = arcCtx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, primaryColor);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.9)');
        arcCtx.strokeStyle = grad;
        arcCtx.shadowColor = primaryColor;
        arcCtx.shadowBlur = 6;
        arcCtx.stroke();
      }

      // --- 2. RENDER LINEAR OSCILLOSCOPE SCOPE ---
      const sw = scopeCanvas.width;
      const sh = scopeCanvas.height;
      scopeCtx.clearRect(0, 0, sw, sh);

      // Grid background on oscilloscope
      scopeCtx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
      scopeCtx.lineWidth = 1;
      scopeCtx.beginPath();
      for (let x = 0; x < sw; x += 30) {
        scopeCtx.moveTo(x, 0);
        scopeCtx.lineTo(x, sh);
      }
      for (let y = 0; y < sh; y += 15) {
        scopeCtx.moveTo(0, y);
        scopeCtx.lineTo(sw, y);
      }
      scopeCtx.stroke();

      // Sine Wave / Spectrum Line
      scopeCtx.beginPath();
      scopeCtx.lineWidth = 2;
      scopeCtx.strokeStyle = primaryColor;
      scopeCtx.shadowColor = primaryColor;
      scopeCtx.shadowBlur = 8;

      const sliceWidth = sw / bufferLength;
      let sx = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const sy = (v * sh) / 2;

        if (i === 0) {
          scopeCtx.moveTo(sx, sy);
        } else {
          scopeCtx.lineTo(sx, sy);
        }
        sx += sliceWidth;
      }
      scopeCtx.stroke();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isListening, isJarvisSpeaking]);

  const handleReactorClick = () => {
    soundFX.playClick();
    onToggleListen();
  };

  return (
    <div className="hud-panel hud-center-stage">
      <div className="hud-panel-header" style={{ width: '100%' }}>
        <div className="hud-panel-title">
          <Activity size={16} />
          <span>NEURAL CORE // ARC REACTOR MARK VII</span>
        </div>
        <div className="hud-panel-badge">
          {isListening ? 'VOICE REC: ACTIVE' : isJarvisSpeaking ? 'SYNTHESIZING' : 'STANDBY'}
        </div>
      </div>

      {/* Arc Reactor Visualizer Unit */}
      <div
        className="arc-reactor-container"
        onClick={handleReactorClick}
        title="Click Arc Reactor to Toggle Voice Listening"
      >
        <div className="arc-reactor-glow" />
        <canvas ref={arcCanvasRef} className="arc-canvas" width={340} height={340} />

        <div className="arc-ring-outer" />
        <div className="arc-ring-ticks" />
        <div className="arc-ring-segmented" />

        <div className={`arc-core ${isListening ? 'listening' : ''} ${isJarvisSpeaking ? 'speaking' : ''}`}>
          <div className="arc-core-icon">
            {isListening ? <Mic size={32} /> : isJarvisSpeaking ? <Volume2 size={32} /> : <Sparkles size={32} />}
          </div>
          <div className="arc-core-status">
            {isListening ? 'LISTENING' : isJarvisSpeaking ? 'JARVIS SPEAKING' : 'CLICK TO SPEAK'}
          </div>
        </div>
      </div>

      {/* Voice Trigger Action Button */}
      <div className="arc-interaction-bar">
        <button
          className={`hud-action-btn ${isListening ? 'active' : ''}`}
          onClick={handleReactorClick}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          <span>{isListening ? 'Mute Microphone' : 'Activate Voice Interface'}</span>
        </button>
      </div>

      {/* Live Linear Oscilloscope Scope */}
      <div className="hud-waveform-scope">
        <div className="waveform-meta">
          AUDIO TELEMETRY SPECTRUM [CH-01: 44.1kHz // 16-BIT PCM]
        </div>
        <canvas ref={scopeCanvasRef} width={620} height={64} />
      </div>

      {/* Jarvis Live Status & Transcript Banner */}
      <div className="hud-voice-banner">
        <div className="voice-banner-speaker">
          <Sparkles size={14} />
          <span>{isJarvisSpeaking ? 'JARVIS AUDIO FEED' : 'SYSTEM STATUS'}</span>
        </div>
        <div className="voice-banner-text">
          {statusMessage || 'Standing by, Sir. All systems operating at peak nominal capacity.'}
        </div>
      </div>

      {/* Quick Voice Command Chips */}
      <div className="hud-quick-chips">
        {[
          'Run full diagnostics',
          'System integrity check',
          'What is your status?',
          'Deploy security protocols',
          'Simulate voice interaction',
        ].map((cmd, idx) => (
          <button
            key={idx}
            className="chip-btn"
            onClick={() => {
              soundFX.playConfirm();
              onQuickCommand(cmd);
            }}
          >
            "{cmd}"
          </button>
        ))}
      </div>
    </div>
  );
}
