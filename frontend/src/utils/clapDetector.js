// Acoustic Clap & Transient Spike Detector using Web Audio API
export class ClapDetector {
  constructor(onClapDetected, onVolumeUpdate) {
    this.onClapDetected = onClapDetected;
    this.onVolumeUpdate = onVolumeUpdate;
    this.audioContext = null;
    this.analyser = null;
    this.micStream = null;
    this.source = null;
    this.isRunning = false;
    this.animFrameId = null;

    // Transient Detection Parameters
    this.smoothedBaseline = 0.05;
    this.lastClapTime = 0;
    this.cooldownMs = 1000;       // prevent rapid re-triggering
    this.minVolumeThreshold = 0.14; // minimum absolute volume required
    this.spikeRatio = 2.2;        // ratio of instantaneous volume to baseline (fast attack)
  }

  async start() {
    if (this.isRunning) return true;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;

      this.audioContext = new AudioCtx();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      this.source = this.audioContext.createMediaStreamSource(this.micStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.15; // fast attack response
      this.source.connect(this.analyser);

      this.isRunning = true;
      this.detectLoop();
      return true;
    } catch (err) {
      console.warn('Acoustic ClapDetector microphone initialization error:', err);
      return false;
    }
  }

  detectLoop = () => {
    if (!this.isRunning || !this.analyser) return;

    const buffer = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(buffer);

    // Compute RMS amplitude (0.0 to 1.0)
    let sumSquares = 0;
    for (let i = 0; i < buffer.length; i++) {
      const val = (buffer[i] - 128) / 128.0;
      sumSquares += val * val;
    }
    const currentRms = Math.sqrt(sumSquares / buffer.length);

    // Live volume reporting for HUD visual meter
    if (this.onVolumeUpdate) {
      const displayPct = Math.min(100, Math.round(currentRms * 280));
      this.onVolumeUpdate(displayPct);
    }

    const now = Date.now();
    // A clap is characterized by a sharp rise above smoothed background ambient noise
    const isSpike =
      currentRms > this.minVolumeThreshold &&
      currentRms > this.smoothedBaseline * this.spikeRatio &&
      now - this.lastClapTime > this.cooldownMs;

    if (isSpike) {
      this.lastClapTime = now;
      if (this.onClapDetected) {
        this.onClapDetected({
          volume: currentRms,
          timestamp: now,
        });
      }
    }

    // Slowly adapt baseline to room noise
    this.smoothedBaseline = this.smoothedBaseline * 0.85 + currentRms * 0.15;
    this.animFrameId = requestAnimationFrame(this.detectLoop);
  };

  stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }
}
