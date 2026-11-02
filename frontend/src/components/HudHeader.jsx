import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Maximize2, Shield, Radio, EyeOff, Scan, Layers } from 'lucide-react';
import { soundFX } from '../utils/audioEffects';

export default function HudHeader({
  currentTheme,
  onThemeChange,
  isMuted,
  onToggleMute,
  onHideToBackground,
  holographicMode = true,
  onToggleHologram,
  onTriggerFaceScan,
}) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    soundFX.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const themes = [
    { id: 'cyan', label: 'Cyan Hologram', color: '#00f0ff' },
    { id: 'crimson', label: 'Mark VII Crimson', color: '#ff3344' },
    { id: 'emerald', label: 'Quantum Emerald', color: '#00ffaa' },
    { id: 'violet', label: 'Nebula Violet', color: '#b366ff' },
  ];

  return (
    <header className="hud-header">
      {/* Brand & Identity */}
      <div className="hud-brand">
        <div className="hud-brand-logo">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="18 8" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="4" />
            <circle cx="50" cy="50" r="14" fill="currentColor" />
          </svg>
        </div>
        <div className="hud-title-wrap">
          <span className="hud-title">
            J.A.R.V.I.S.
          </span>
          <span className="hud-subtitle">
            JUST A RATHER VERY INTELLIGENT SYSTEM // MK-VII
          </span>
        </div>
      </div>

      {/* Center Telemetry Readout */}
      <div className="hud-telemetry-ticker">
        <div className="ticker-item">
          <div className="ticker-dot" />
          <span className="ticker-label">STATUS:</span>
          <span className="ticker-val">ONLINE</span>
        </div>

        <div className="ticker-item">
          <Shield size={12} color="var(--hud-primary)" />
          <span className="ticker-label">DEFENSE:</span>
          <span className="ticker-val">LEVEL 4 SECURE</span>
        </div>

        <div className="ticker-item">
          <Radio size={12} color="var(--hud-accent)" />
          <span className="ticker-label">TIME (UTC):</span>
          <span className="ticker-val">{timeStr}</span>
        </div>
      </div>

      {/* Header Actions & Theme Switcher */}
      <div className="hud-header-actions">
        {/* Color Palette Switcher */}
        <div className="theme-picker-pills" title="Switch HUD Color Matrix">
          {themes.map((t) => (
            <div
              key={t.id}
              className={`theme-pill ${currentTheme === t.id ? 'active' : ''}`}
              style={{ backgroundColor: t.color }}
              onClick={() => {
                soundFX.playClick();
                onThemeChange(t.id);
              }}
              title={t.label}
            />
          ))}
        </div>

        {/* Holographic 3D Matrix Projection Toggle */}
        {onToggleHologram && (
          <button
            className={`hud-btn-icon holo-toggle-btn ${holographicMode ? 'active' : ''}`}
            onClick={() => {
              soundFX.playClick();
              onToggleHologram();
            }}
            title={holographicMode ? 'Holographic 3D Projection: ACTIVE' : 'Holographic 3D Projection: DISABLED'}
          >
            <Layers size={17} />
          </button>
        )}

        {/* Biometric Face Scan Verification */}
        {onTriggerFaceScan && (
          <button
            className="hud-btn-icon facescan-header-btn"
            onClick={() => {
              soundFX.playClick();
              onTriggerFaceScan();
            }}
            title="Initiate Holographic Biometric Face Scan"
          >
            <Scan size={17} />
          </button>
        )}

        {/* Audio Effects Mute */}
        <button
          className="hud-btn-icon"
          onClick={() => {
            soundFX.playClick();
            onToggleMute();
          }}
          title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
        >
          {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>

        {/* Hide to Background (Clap to Wake) */}
        {onHideToBackground && (
          <button
            className="hud-btn-icon hide-desktop-btn"
            onClick={() => {
              soundFX.playPowerDown();
              onHideToBackground();
            }}
            title="Hide to Desktop Background (Clap hands anytime to wake J.A.R.V.I.S.)"
          >
            <EyeOff size={17} />
          </button>
        )}

        {/* Fullscreen Toggle */}
        <button
          className="hud-btn-icon"
          onClick={toggleFullscreen}
          title="Toggle Fullscreen HUD"
        >
          <Maximize2 size={17} />
        </button>
      </div>
    </header>
  );
}
