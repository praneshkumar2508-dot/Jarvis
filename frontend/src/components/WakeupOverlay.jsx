import React, { useEffect, useState } from 'react';
import { Power, Mic, ShieldAlert, ShieldCheck, Zap, Scan, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { soundFX } from '../utils/audioEffects';
import BiometricFaceScanner from './BiometricFaceScanner';

export default function WakeupOverlay({
  isAwake,
  isWakingUp,
  onTriggerWakeup,
  micVolume = 0,
  wakeStatusText = 'LISTENING FOR CLAP OR WAKE WORD...',
  isBackgroundMode = false,
  biometricVerified = false,
  onBiometricVerified,
  pendingClapWakeup = false,
}) {
  const [bootSteps, setBootSteps] = useState([]);
  const [showFaceScanner, setShowFaceScanner] = useState(false);
  const [localVerified, setLocalVerified] = useState(biometricVerified);
  const [deniedFlash, setDeniedFlash] = useState(false);

  // Sync external verified state
  useEffect(() => {
    setLocalVerified(biometricVerified);
  }, [biometricVerified]);

  // If a clap was detected while unverified, automatically engage the face scanner!
  useEffect(() => {
    if (pendingClapWakeup && !localVerified) {
      soundFX.playAlert();
      setDeniedFlash(true);
      setShowFaceScanner(true);
      const timer = setTimeout(() => setDeniedFlash(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [pendingClapWakeup, localVerified]);

  useEffect(() => {
    if (isWakingUp) {
      soundFX.playWakeup();
      setBootSteps([]);

      const steps = [
        'INITIALIZING QUANTUM NEURAL CORE...',
        'BIOMETRIC FACIAL SIGNATURE CONFIRMED [COMMANDER PRANESH]...',
        'ARC REACTOR IGNITION SEQUENCE: DELIVERING 3.2 GW...',
        'SCANNING 121 DESKTOP APPS & SYSTEM TELEMETRY...',
        'HOLOGRAPHIC PROJECTION MATRIX CALIBRATED [100%]...',
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

  const handleFaceScanComplete = (profile) => {
    setLocalVerified(true);
    setShowFaceScanner(false);
    if (onBiometricVerified) {
      onBiometricVerified(profile);
    }
    soundFX.playAccessGranted();
  };

  const handleAttemptWakeup = () => {
    if (!localVerified) {
      // Deny wakeup until face scan is performed!
      soundFX.playAlert();
      setDeniedFlash(true);
      setShowFaceScanner(true);
      setTimeout(() => setDeniedFlash(false), 2000);
      return;
    }
    onTriggerWakeup();
  };

  return (
    <div className={`wakeup-overlay ${isWakingUp ? 'igniting' : 'dormant'}`}>
      {/* Background Holographic Grid & Radial Vignette */}
      <div className="wakeup-backdrop" />

      {/* Holographic Face Scanner Modal / Direct Viewport */}
      {showFaceScanner && !isWakingUp ? (
        <div className="wakeup-facescan-modal">
          <BiometricFaceScanner
            onScanComplete={handleFaceScanComplete}
            onCancel={() => setShowFaceScanner(false)}
            title="BIOMETRIC WAKEUP PROTOCOL"
            subtitle="FACIAL AUTHENTICATION REQUIRED PRIOR TO ARC REACTOR IGNITION"
          />
        </div>
      ) : (
        /* Center Awakening Portal */
        <div className="wakeup-center-portal">
          {/* Pulsing Shockwave Rings */}
          <div className={`shockwave-ring ring-1 ${isWakingUp ? 'blast' : ''}`} />
          <div className={`shockwave-ring ring-2 ${isWakingUp ? 'blast' : ''}`} />
          <div className={`shockwave-ring ring-3 ${isWakingUp ? 'blast' : ''}`} />

          {/* Central Core Arc Reactor Emblem */}
          <div
            className={`wakeup-core ${isWakingUp ? 'flare' : 'idle'} ${localVerified ? 'unlocked' : 'locked'}`}
            onClick={!isWakingUp ? handleAttemptWakeup : undefined}
            title={localVerified ? "Click to Ignite Arc Reactor" : "Click to Authenticate via Face Scan"}
          >
            <div className="core-inner-glow" />
            <div className="core-spinner">
              <svg viewBox="0 0 100 100" className="core-svg">
                <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="16 8" />
                <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" />
                <polygon points="50,15 80,75 20,75" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="50" cy="50" r="12" fill="currentColor" />
              </svg>
            </div>
            {localVerified ? (
              <Power size={32} className="core-icon text-hud-primary" />
            ) : (
              <Lock size={30} className="core-icon text-hud-warn" />
            )}
          </div>

          {/* Brand & Titles */}
          <div className="wakeup-info-box">
            <div className="wakeup-title">J.A.R.V.I.S.</div>
            <div className="wakeup-subtitle">
              {isWakingUp
                ? 'SYSTEMS ENERGIZING // ARC CORE ACTIVE'
                : localVerified
                ? 'BIOMETRIC CLEARANCE: LEVEL 10 // ACOUSTIC RADAR ARMED'
                : 'SECURITY PROTOCOL LOCKED // FACIAL SCAN MANDATORY'}
            </div>

            {/* Biometric Status Indicator Pill */}
            {!isWakingUp && (
              <div className={`biometric-status-pill ${localVerified ? 'verified' : 'unverified'} ${deniedFlash ? 'flash-alert' : ''}`}>
                {localVerified ? (
                  <>
                    <ShieldCheck size={14} className="text-hud-success" />
                    <span>BIOMETRICS VERIFIED: COMMANDER PRANESH</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert size={14} className="text-hud-warn" />
                    <span>SECURITY LOCK: FACE SCAN REQUIRED BEFORE CLAP WAKEUP</span>
                  </>
                )}
              </div>
            )}

            {!isWakingUp ? (
              <div className="wakeup-callout">
                {/* Stage 1: Face Scan Prompt if Not Yet Verified */}
                {!localVerified ? (
                  <div className="facescan-prompt-card">
                    <div className="prompt-desc">
                      Please look into the optical sensors to verify facial telemetry and arm the acoustic clap ignition core.
                    </div>
                    <button
                      className="facescan-launch-btn hud-action-btn"
                      onClick={() => {
                        soundFX.playClick();
                        setShowFaceScanner(true);
                      }}
                    >
                      <Scan size={17} />
                      <span>INITIALIZE HOLOGRAPHIC FACE SCAN</span>
                    </button>
                    {deniedFlash && (
                      <div className="denied-warning-row">
                        <AlertTriangle size={14} />
                        <span>FACIAL SCAN REQUIRED BEFORE J.A.R.V.I.S. CAN WAKE UP!</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Stage 2: Biometrics Verified -> Clap / Acoustic Radar Armed! */
                  <>
                    <div className="clap-status-row">
                      <Mic size={16} className="mic-pulse-icon text-hud-success" />
                      <span className="clap-status-label">{wakeStatusText}</span>
                    </div>

                    {/* Real-time Acoustic Clap Sensitivity Meter */}
                    <div className="clap-meter-container">
                      <div className="clap-meter-label">
                        <span>ACOUSTIC RADAR (ARMED)</span>
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
                      className="wakeup-manual-btn hud-action-btn armed"
                      onClick={handleAttemptWakeup}
                    >
                      <Zap size={15} />
                      <span>CLAP HANDS OR CLICK TO IGNITE ARC REACTOR</span>
                    </button>

                    <div className="re-scan-link">
                      <button
                        className="text-link-btn"
                        onClick={() => setShowFaceScanner(true)}
                      >
                        <RefreshCw size={12} />
                        <span>RE-SCAN FACIAL BIOMETRICS</span>
                      </button>
                    </div>
                  </>
                )}

                <div className="wakeup-hints">
                  <span>[STEP 1: FACE SCAN]</span>
                  <span>➔</span>
                  <span>[STEP 2: CLAP HANDS]</span>
                  <span>➔</span>
                  <span>[J.A.R.V.I.S. AWAKENS]</span>
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
      )}
    </div>
  );
}
