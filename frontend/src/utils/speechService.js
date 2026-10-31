// Speech Recognition and Speech Synthesis Service for Jarvis HUD

export class JarvisSpeech {
  constructor(onSpeechStart, onSpeechEnd) {
    this.recognition = null;
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.onSpeechStart = onSpeechStart;
    this.onSpeechEnd = onSpeechEnd;
    this.ttsEnabled = true;

    this.initRecognition();
  }

  initRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        this.recognition = new SpeechRec();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
      } catch (err) {
        console.warn('SpeechRecognition initialization error:', err);
      }
    }
  }

  startListening(onResult, onError) {
    if (!this.recognition) {
      if (onError) onError('Speech recognition not supported in this browser environment.');
      return;
    }

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onResult) onResult(transcript);
    };

    this.recognition.onerror = (err) => {
      console.warn('Speech recognition event error:', err);
      if (onError) onError(err.error);
    };

    try {
      this.recognition.start();
    } catch {
      // If already started, ignore
    }
  }

  stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
  }

  speak(text) {
    if (!this.synth || !this.ttsEnabled) {
      return;
    }

    try {
      this.synth.cancel(); // Stop any pending utterance
      const utterance = new SpeechSynthesisUtterance(text);

      // Select British/English male voice if available for authentic Jarvis voice
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
        if (this.onSpeechEnd) this.onSpeechEnd();
      };

      utterance.onerror = () => {
        if (this.onSpeechEnd) this.onSpeechEnd();
      };

      this.synth.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      if (this.onSpeechEnd) this.onSpeechEnd();
    }
  }

  stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
      if (this.onSpeechEnd) this.onSpeechEnd();
    }
  }
}
