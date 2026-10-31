import React, { useState, useEffect } from 'react';
import { Cpu, ShieldCheck, Zap, Radio, RefreshCw, Server, Wifi } from 'lucide-react';
import { soundFX } from '../utils/audioEffects';

export default function TelemetryPanel({ onTriggerScan }) {
  const [cpuLoad, setCpuLoad] = useState(24);
  const [ramUsage, setRamUsage] = useState(42);
  const [arcPower, setArcPower] = useState(98);
  const [freqBars, setFreqBars] = useState([40, 65, 30, 85, 55, 70, 90, 45, 60, 75, 50, 68]);

  // Dynamic telemetry heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuLoad((prev) => Math.min(88, Math.max(18, Math.floor(prev + (Math.random() * 12 - 6)))));
      setRamUsage((prev) => Math.min(76, Math.max(38, Math.floor(prev + (Math.random() * 4 - 2)))));
      setArcPower((prev) => Math.min(100, Math.max(95, Math.floor(prev + (Math.random() * 2 - 1)))));

      setFreqBars((prev) =>
        prev.map(() => Math.floor(20 + Math.random() * 75))
      );
    }, 800);

    return () => clearInterval(interval);
  }, []);

  const handleScanClick = () => {
    soundFX.playScan();
    onTriggerScan();
  };

  return (
    <div className="hud-panel">
      <div className="hud-panel-header">
        <div className="hud-panel-title">
          <Cpu size={16} />
          <span>SYSTEM TELEMETRY</span>
        </div>
        <div className="hud-panel-badge">LIVE // NODE 01</div>
      </div>

      <div className="hud-panel-body">
        {/* Core Resources */}
        <div className="telemetry-section">
          <div className="telemetry-title">
            <Zap size={13} />
            <span>NEURAL HARDWARE LOAD</span>
          </div>

          <div className="gauge-row">
            <div className="gauge-label-wrap">
              <span className="gauge-label">CPU NEURAL CORE</span>
              <span className="gauge-value">{cpuLoad}%</span>
            </div>
            <div className="gauge-bar-bg">
              <div className="gauge-bar-fill" style={{ width: `${cpuLoad}%` }} />
            </div>
          </div>

          <div className="gauge-row">
            <div className="gauge-label-wrap">
              <span className="gauge-label">QUANTUM MEMORY</span>
              <span className="gauge-value">{ramUsage}% (13.4 GB)</span>
            </div>
            <div className="gauge-bar-bg">
              <div className="gauge-bar-fill" style={{ width: `${ramUsage}%` }} />
            </div>
          </div>

          <div className="gauge-row">
            <div className="gauge-label-wrap">
              <span className="gauge-label">ARC POWER OUTPUT</span>
              <span className="gauge-value">{arcPower}% NOMINAL</span>
            </div>
            <div className="gauge-bar-bg">
              <div className="gauge-bar-fill" style={{ width: `${arcPower}%` }} />
            </div>
          </div>
        </div>

        {/* Real-time Frequency Spectrum */}
        <div className="telemetry-section">
          <div className="telemetry-title">
            <Radio size={13} />
            <span>SPECTRAL FREQUENCY DENSITY</span>
          </div>
          <div className="frequency-bars">
            {freqBars.map((height, idx) => (
              <div
                key={idx}
                className="frequency-bar"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>

        {/* Connected Subsystems Matrix */}
        <div className="telemetry-section">
          <div className="telemetry-title">
            <ShieldCheck size={13} />
            <span>INTEGRATED SUBSYSTEMS</span>
          </div>
          <div className="subsystem-grid">
            {[
              { name: 'STARK NET', status: 'CONNECTED', icon: Wifi },
              { name: 'VOICE SYNTH', status: 'ONLINE', icon: Zap },
              { name: 'FIREWALL', status: 'SHIELDED', icon: ShieldCheck },
              { name: 'LOCAL LLM', status: 'READY', icon: Server },
            ].map((sub, idx) => (
              <div key={idx} className="subsystem-card">
                <div className="subsystem-name">
                  <span>{sub.name}</span>
                  <sub.icon size={13} color="var(--hud-primary)" />
                </div>
                <div className="subsystem-status">{sub.status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scan & Diagnostic trigger */}
        <div style={{ marginTop: '16px' }}>
          <button
            className="hud-action-btn"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleScanClick}
          >
            <RefreshCw size={15} />
            <span>RUN DIAGNOSTIC SCAN</span>
          </button>
        </div>
      </div>
    </div>
  );
}
