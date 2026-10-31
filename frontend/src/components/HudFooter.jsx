import React, { useState, useEffect } from 'react';
import { Shield, Activity, Cpu } from 'lucide-react';

export default function HudFooter() {
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setUptime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <footer className="hud-footer">
      <div className="footer-left">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Shield size={12} color="var(--hud-primary)" />
          SECURITY: ENCRYPTED // ARCHITECTURE: NEURAL MESH
        </span>
        <span>STARK_AI_KERNEL v4.9.2</span>
        <span>LATENCY: 14ms</span>
      </div>

      <div className="footer-right">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={12} color="var(--hud-success)" />
          UPTIME: {formatUptime(uptime)}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Cpu size={12} color="var(--hud-accent)" />
          SAMPLE RATE: 48,000 Hz
        </span>
      </div>
    </footer>
  );
}
