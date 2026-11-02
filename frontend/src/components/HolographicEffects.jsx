import React, { useMemo } from 'react';

export default function HolographicEffects({
  enabled = true,
  intensity = 'high', // 'normal' | 'high'
  activeTheme = 'cyan'
}) {
  if (!enabled) return null;

  // Generate 24 floating quantum energy particles with deterministic random values
  const particles = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      left: `${(i * 13.7) % 96 + 2}%`,
      top: `${(i * 17.3) % 94 + 3}%`,
      size: `${(i % 3) * 2 + 3}px`,
      duration: `${4 + (i % 5) * 1.5}s`,
      delay: `${(i % 7) * 0.4}s`,
      opacity: 0.25 + (i % 4) * 0.15,
    }));
  }, []);

  return (
    <div className="holographic-system-overlay" aria-hidden="true">
      {/* 1. Holographic Laser Scanning Bar */}
      <div className="holo-laser-sweep" />

      {/* 2. CRT / Holographic Micro-Scanlines */}
      <div className="holo-scanlines" />

      {/* 3. Anamorphic Cyan Center Lens Flare */}
      <div className="holo-anamorphic-flare" />

      {/* 4. Radial Holographic Projector Cone from Center Arc Core */}
      <div className="holo-projector-cone" />

      {/* 5. 3D Perspective Cyber-Grid Floor */}
      <div className="holo-perspective-grid" />

      {/* 6. Floating Holographic Quantum Energy Particles */}
      <div className="holo-particles-layer">
        {particles.map((p) => (
          <div
            key={p.id}
            className="holo-particle"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              animationDuration: p.duration,
              animationDelay: p.delay,
              opacity: p.opacity,
            }}
          />
        ))}
      </div>

      {/* 7. 4-Corner Holographic HUD Diagnostic Telemetry Markers */}
      <div className="holo-corner-marker marker-tl">
        <span className="holo-marker-bracket">[</span>
        <span className="holo-marker-text">MK-VII // HOLOGRAPHIC PROJECTION 3D</span>
      </div>

      <div className="holo-corner-marker marker-tr">
        <span className="holo-marker-text">STARK SECURE ENCLAVE // 120 FPS</span>
        <span className="holo-marker-bracket">]</span>
      </div>

      <div className="holo-corner-marker marker-bl">
        <span className="holo-marker-bracket">[</span>
        <span className="holo-marker-text">BIOMETRICS: CALIBRATED // AZ: 042°</span>
      </div>

      <div className="holo-corner-marker marker-br">
        <span className="holo-marker-text">QUANTUM CORE: STABLE</span>
        <span className="holo-marker-bracket">]</span>
      </div>
    </div>
  );
}
