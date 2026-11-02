import React, { useEffect, useState } from 'react';
import { Power, Mic, Radio, Volume2, ShieldCheck, Zap } from 'lucide-react';
import { soundFX } from '../utils/audioEffects';

export default function WakeupOverlay({
  isAwake,
  isWakingUp,
  onTriggerWakeup,
  micVolume = 0,
  wakeStatusText = 'LISTENING FOR CLAP OR WAKE WORD...',
  isBackgroundMode = false,
}) {
  const [bootSteps, setBootSteps] = useState([]);

  useEffect(() => {
    if (isWakingUp) {
      soundFX.playWakeup();
      setBootSteps([]);

      const steps = [
        'INITIALIZING QUANTUM NEURAL CORE...',
        'ARC REACTOR IGNITION SEQUENCE: DELIVERING 3.2 GW...',
        'SCANNING 121 DESKTOP APPS & SYSTEM TELEMETRY...',
        'BIOMETRIC ACOUSTIC MATRIX CALIBRATED [100%]...',
        'J.A.R.V.I.S. MARK VII FULLY ONLINE // STANDING BY, SIR',
      ];

      steps.forEach((text, i) => {
        setTimeout(() => {
          setBootSteps((prev) => [...prev, text]);
        }, i * 260);
      });
    }
  }, [isWakingUp]);

  if ((isAwake && !isWakingUp) || isBackgroundMode) return null;

  return (
    <div className={`wakeup-overlay ${isWakingUp ? 'igniting' : 'dormant'}`} onClick={!isWakingUp ? onTriggerWakeup : undefined}>
      {/* Background Holographic Grid & Radial Vignette */}
      <div className="wakeup-backdrop" />

      {/* Center Awakening Portal */}
      <div className="wakeup-center-portal">
        {/* Pulsing Shockwave Rings */}
        <div className={`shockwave-ring ring-1 ${isWakingUp ? 'blast' : ''}`} />
        <div className={`shockwave-ring ring-2 ${isWakingUp ? 'blast' : ''}`} />
        <div className={`shockwave-ring ring-3 ${isWakingUp ? 'blast' : ''}`} />

        {/* Central Core Arc Reactor Emblem */}
        <div className={`wakeup-core ${isWakingUp ? 'flare' : 'idle'}`}>
          <div className="core-inner-glow" />
          <div className="core-spinner">
            <svg viewBox="0 0 100 100" className="core-svg">
              <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="16 8" />
              <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" />
              <polygon points="50,15 80,75 20,75" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="50" cy="50" r="12" fill="currentColor" />
            </svg>
          </div>
          <Power size={32} className="core-icon" />
        </div>

        {/* Brand & Titles */}
        <div className="wakeup-info-box">
          <div className="wakeup-title">J.A.R.V.I.S.</div>
          <div className="wakeup-subtitle">
            {isWakingUp ? 'SYSTEMS ENERGIZING // ARC CORE ACTIVE' : 'SYSTEM STANDBY // DORMANT MODE'}
          </div>

          {!isWakingUp ? (
            <div className="wakeup-callout">
              <div className="clap-status-row">
                <Mic size={16} className="mic-pulse-icon" />
                <span className="clap-status-label">{wakeStatusText}</span>
              </div>

              {/* Real-time Acoustic Clap Sensitivity Meter */}
              <div className="clap-meter-container">
                <div className="clap-meter-label">
                  <span>ACOUSTIC RADAR</span>
                  <span>{micVolume}%</span>
                </div>
                <div className="clap-meter-track">
                  <div
                    className="clap-meter-fill"
                    style={{ width: `${Math.min(100, micVolume)}%` }}
                  />
                  <div className="clap-threshold-line" title="Clap Trigger Threshold" />
                </div>
              </div>

              <button
                className="wakeup-manual-btn hud-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onTriggerWakeup();
                }}
              >
                <Zap size={14} />
                <span>CLAP HANDS OR CLICK TO WAKE UP</span>
              </button>

              <div className="wakeup-hints">
                <span>[CLAP / SNAP]</span>
                <span>•</span>
                <span>[SAY: "HEY JARVIS"]</span>
                <span>•</span>
                <span>[PRESS SPACE]</span>
              </div>
            </div>
          ) : (
            /* Boot sequence console stream */
            <div className="wakeup-boot-stream">
              {bootSteps.map((msg, idx) => (
                <div key={idx} className="boot-line">
                  <span className="boot-prefix">&gt;&gt;</span>
                  <span className="boot-text">{msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
