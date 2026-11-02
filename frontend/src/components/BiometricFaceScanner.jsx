import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Camera, Scan, CheckCircle, RefreshCw, X, UserCheck } from 'lucide-react';
import { soundFX } from '../utils/audioEffects';

export default function BiometricFaceScanner({
  onScanComplete,
  onCancel,
  autoStart = true,
  title = "BIOMETRIC FACIAL AUTHENTICATION",
  subtitle = "STARK SECURITY ENCLAVE // LEVEL 10 CLEARANCE"
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('INITIALIZING OPTICAL SENSORS...');
  const [isVerified, setIsVerified] = useState(false);

  // Holographic telemetry metrics
  const [telemetry, setTelemetry] = useState({
    faceConfidence: 99.4,
    irisMatch: 99.8,
    meshPoints: 468,
    cranialAngle: '+2.4°'
  });

  // Start webcam or synthetic biometric fallback
  useEffect(() => {
    let isMounted = true;

    async function startCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
          });
          if (!isMounted) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
          setCameraActive(true);
        } else {
          setCameraError(true);
        }
      } catch (err) {
        console.warn('Webcam permission not granted or device unavailable, using holographic synthetic mesh:', err);
        if (isMounted) setCameraError(true);
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Biometric Scanning Progress Animation
  useEffect(() => {
    let interval = null;
    let progress = 0;

    const stages = [
      { at: 15, text: 'DETECTING FACIAL GEOMETRY & CRANIAL CONTOURS...' },
      { at: 35, text: 'EXTRACTING 468 BIOMETRIC MESH NODES...' },
      { at: 60, text: 'CROSS-REFERENCING RETINAL & IRIS SIGNATURE...' },
      { at: 80, text: 'CONFIRMING STARK INDUSTRIES CIPHER CLEARANCE...' },
      { at: 98, text: 'MATCH VERIFIED: COMMANDER PRANESH [LEVEL 10]...' }
    ];

    soundFX.playScan();

    interval = setInterval(() => {
      progress += 2;
      setScanProgress(Math.min(100, progress));

      // Play audio chirp at intervals
      if (progress % 20 === 0 && progress < 90) {
        soundFX.playBiometricScan();
      }

      // Update status text
      const currentStage = stages.slice().reverse().find(s => progress >= s.at);
      if (currentStage) {
        setScanStatus(currentStage.text);
      }

      if (progress >= 100) {
        clearInterval(interval);
        setIsVerified(true);
        soundFX.playAccessGranted();
        setScanStatus('ACCESS GRANTED // IDENTITY VERIFIED: COMMANDER PRANESH');

        setTimeout(() => {
          if (onScanComplete) {
            onScanComplete({
              userName: 'Commander Pranesh',
              clearance: 'Level 10',
              confidence: 99.8
            });
          }
        }, 1200);
      }
    }, 45);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [onScanComplete]);

  return (
    <div className="facescan-container">
      {/* Outer Holographic HUD Brackets */}
      <div className="facescan-hud-frame">
        {/* Holographic Header Bar */}
        <div className="facescan-header">
          <div className="facescan-title-row">
            <Scan size={18} className="facescan-icon-pulse text-hud-primary" />
            <span className="facescan-title">{title}</span>
            {onCancel && (
              <button className="facescan-close-btn" onClick={onCancel} title="Bypass / Close">
                <X size={16} />
              </button>
            )}
          </div>
          <div className="facescan-subtitle">{subtitle}</div>
        </div>

        {/* Center Scanner Viewport */}
        <div className={`facescan-viewport ${isVerified ? 'verified' : 'scanning'}`}>
          {/* Camera Feed or Synthetic Face Mesh */}
          {cameraActive && !cameraError ? (
            <video
              ref={videoRef}
              className="facescan-video"
              autoPlay
              playsInline
              muted
            />
          ) : (
            <div className="facescan-synthetic-mesh">
              {/* Futuristic SVG Cranial Holographic Wireframe Mesh */}
              <svg viewBox="0 0 200 240" className="synthetic-face-svg">
                {/* Cranial Contour Oval */}
                <ellipse cx="100" cy="115" rx="68" ry="88" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 3" />
                <ellipse cx="100" cy="115" rx="56" ry="74" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6" />
                
                {/* Horizontal & Vertical Crosshair Lines */}
                <line x1="20" y1="105" x2="180" y2="105" stroke="currentColor" strokeWidth="0.8" opacity="0.4" strokeDasharray="3 3" />
                <line x1="100" y1="20" x2="100" y2="210" stroke="currentColor" strokeWidth="0.8" opacity="0.4" strokeDasharray="3 3" />
                
                {/* Eye Landmark Reticles */}
                <circle cx="75" cy="98" r="14" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="75" cy="98" r="4" fill="currentColor" opacity="0.8" />
                <circle cx="125" cy="98" r="14" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="125" cy="98" r="4" fill="currentColor" opacity="0.8" />

                {/* Eyebrows / Forehead Nodes */}
                <path d="M 60 82 Q 75 75 90 82" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <path d="M 110 82 Q 125 75 140 82" fill="none" stroke="currentColor" strokeWidth="1.2" />

                {/* Nasal Bridge & Nose Base */}
                <path d="M 100 95 L 94 130 L 106 130 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />

                {/* Lip / Mouth Landmark */}
                <path d="M 78 155 Q 100 148 122 155 Q 100 166 78 155 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />

                {/* Jaw & Chin Biometric Polyline */}
                <polyline points="45,95 50,150 72,185 100,198 128,185 150,150 155,95" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 2" />

                {/* Biometric Tracking Points */}
                <circle cx="100" cy="55" r="2.5" fill="currentColor" />
                <circle cx="75" cy="98" r="2.5" fill="currentColor" />
                <circle cx="125" cy="98" r="2.5" fill="currentColor" />
                <circle cx="100" cy="130" r="2.5" fill="currentColor" />
                <circle cx="100" cy="155" r="2.5" fill="currentColor" />
                <circle cx="100" cy="198" r="2.5" fill="currentColor" />
                <circle cx="50" cy="140" r="2" fill="currentColor" opacity="0.6" />
                <circle cx="150" cy="140" r="2" fill="currentColor" opacity="0.6" />
              </svg>
            </div>
          )}

          {/* Holographic Video Tint & Vignette */}
          <div className="facescan-tint-overlay" />

          {/* Oscillating Cyan Laser Scanner Bar */}
          <div className="facescan-laser-beam" />

          {/* 4-Corner Holographic HUD Target Brackets */}
          <div className="hud-bracket bracket-tl" />
          <div className="hud-bracket bracket-tr" />
          <div className="hud-bracket bracket-bl" />
          <div className="hud-bracket bracket-br" />

          {/* Rotating Target Reticle Rings */}
          <div className="facescan-reticle-ring ring-outer" />
          <div className="facescan-reticle-ring ring-inner" />

          {/* Verification Badge Overlay */}
          {isVerified && (
            <div className="facescan-verified-badge">
              <ShieldCheck size={54} className="verified-shield-icon" />
              <div className="verified-text-title">IDENTITY CONFIRMED</div>
              <div className="verified-text-name">COMMANDER PRANESH</div>
            </div>
          )}
        </div>

        {/* Biometric Progress Bar */}
        <div className="facescan-progress-section">
          <div className="facescan-progress-header">
            <span className="facescan-status-msg">{scanStatus}</span>
            <span className="facescan-percent">{scanProgress}%</span>
          </div>
          <div className="facescan-progress-track">
            <div
              className={`facescan-progress-bar ${isVerified ? 'verified' : ''}`}
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>

        {/* Telemetry Matrix Grid */}
        <div className="facescan-telemetry-grid">
          <div className="telemetry-cell">
            <span className="cell-label">CRANIAL MESH</span>
            <span className="cell-value">{telemetry.meshPoints} PTS</span>
          </div>
          <div className="telemetry-cell">
            <span className="cell-label">IRIS MATCH</span>
            <span className="cell-value text-hud-primary">{telemetry.irisMatch}%</span>
          </div>
          <div className="telemetry-cell">
            <span className="cell-label">AZIMUTH</span>
            <span className="cell-value">{telemetry.cranialAngle}</span>
          </div>
          <div className="telemetry-cell">
            <span className="cell-label">STATUS</span>
            <span className={`cell-value ${isVerified ? 'text-hud-success' : 'text-hud-primary'}`}>
              {isVerified ? 'AUTHORIZED' : 'SCANNING...'}
            </span>
          </div>
        </div>

        {/* Quick Instant Clearance Action */}
        {!isVerified && (
          <div className="facescan-action-row">
            <button
              className="facescan-bypass-btn"
              onClick={() => {
                setScanProgress(100);
                setIsVerified(true);
                soundFX.playAccessGranted();
                if (onScanComplete) {
                  onScanComplete({ userName: 'Commander Pranesh', clearance: 'Level 10' });
                }
              }}
            >
              <UserCheck size={14} />
              <span>INSTANT BIOMETRIC OVERRIDE</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
