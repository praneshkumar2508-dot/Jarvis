// Speech Recognition & English Vocal Synthesis Service for J.A.R.V.I.S. HUD
export class JarvisSpeech {
  constructor(onSpeechStart, onSpeechEnd) {
    this.recognition = null;
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.onSpeechStart = onSpeechStart;
    this.onSpeechEnd = onSpeechEnd;
    this.ttsEnabled = true;

    // Continuous voice recognition state
    this.isContinuous = false;
    this.isSpeaking = false;
    this.onFinalCallback = null;
    this.onInterimCallback = null;
    this.onErrorCallback = null;

    this.initRecognition();
  }

  initRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        this.recognition = new SpeechRec();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const item = event.results[i];
            const transcript = item[0].transcript;
            if (item.isFinal) {
              const cleaned = transcript.trim();
              if (cleaned && this.onFinalCallback) {
                this.onFinalCallback(cleaned);
              }
            } else {
              interimTranscript += transcript;
            }
          }
          if (this.onInterimCallback && interimTranscript) {
            this.onInterimCallback(interimTranscript.trim());
          }
        };

        this.recognition.onerror = (err) => {
          // 'no-speech' is normal when user is quiet in continuous mode
          if (err.error === 'no-speech') return;
          console.warn('Speech recognition warning:', err.error);
          if (this.onErrorCallback) this.onErrorCallback(err.error);
        };

        this.recognition.onend = () => {
          // Auto-restart continuous listening unless Jarvis is speaking or user stopped it
          if (this.isContinuous && !this.isSpeaking) {
            try {
              this.recognition.start();
            } catch {
              // Ignore restart error
            }
          }
        };
      } catch (err) {
        console.warn('SpeechRecognition initialization error:', err);
      }
    }
  }

  startContinuousListening(onFinal, onInterim, onError) {
    this.isContinuous = true;
    this.onFinalCallback = onFinal;
    this.onInterimCallback = onInterim;
    this.onErrorCallback = onError;

    if (!this.recognition) {
      this.initRecognition();
    }

    if (this.recognition && !this.isSpeaking) {
      try {
        this.recognition.start();
      } catch {}
    }
  }

  stopListening() {
    this.isContinuous = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
  }

  speak(text, onComplete) {
    if (!this.synth || !this.ttsEnabled) {
      if (onComplete) onComplete();
      return;
    }

    try {
      this.isSpeaking = true;
      this.synth.cancel(); // Stop any pending speech

      // Temporarily pause recognition so Jarvis does not transcribe his own words
      if (this.recognition) {
        try {
          this.recognition.stop();
        } catch {}
      }

      const utterance = new SpeechSynthesisUtterance(text);

      // Select British/English male voice for authentic Jarvis persona
      const voices = this.synth.getVoices();
      const jarvisVoice =
        voices.find(
          (v) =>
            v.lang.includes('en') &&
            (v.name.includes('UK') ||
              v.name.includes('British') ||
              v.name.includes('George') ||
              v.name.includes('Daniel') ||
              v.name.includes('Male'))
        ) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0];

      if (jarvisVoice) {
        utterance.voice = jarvisVoice;
      }

      utterance.pitch = 0.95;
      utterance.rate = 1.05;

      utterance.onstart = () => {
        if (this.onSpeechStart) this.onSpeechStart();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        if (this.onSpeechEnd) this.onSpeechEnd();
        if (onComplete) onComplete();

        // Resume continuous listening automatically
        if (this.isContinuous && this.recognition) {
          try {
            this.recognition.start();
          } catch {}
        }
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        if (this.onSpeechEnd) this.onSpeechEnd();
        if (onComplete) onComplete();

        if (this.isContinuous && this.recognition) {
          try {
            this.recognition.start();
          } catch {}
        }
      };

      this.synth.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      this.isSpeaking = false;
      if (this.onSpeechEnd) this.onSpeechEnd();
      if (onComplete) onComplete();
    }
  }

  stopSpeaking() {
    this.isSpeaking = false;
    if (this.synth) {
      this.synth.cancel();
      if (this.onSpeechEnd) this.onSpeechEnd();
    }
  }
}
