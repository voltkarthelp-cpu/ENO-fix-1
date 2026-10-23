/**
 * Modern Audio Engine for Card Clash:
 * - High-fidelity synthesized sound effects (card slides, snaps, chimes, fanfares)
 * - Built-in ambient background lounge melody loop using Web Audio API
 */

class ModernAudioEngine {
  private ctx: AudioContext | null = null;
  private sfxMuted: boolean = false;
  private musicMuted: boolean = false;
  private voiceMuted: boolean = false;
  private sfxVolume: number = 0.5;
  private musicVolume: number = 0.22;

  // Background Music state
  private musicPlaying: boolean = false;
  private musicTimer: number | null = null;
  private musicStep: number = 0;
  private musicGainNode: GainNode | null = null;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public resume() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    // Start background music automatically if not muted
    if (!this.musicMuted && !this.musicPlaying) {
      this.startBackgroundMusic();
    }
  }

  // --- MUTE & VOLUME CONTROLS ---

  public isMuted(): boolean {
    return this.sfxMuted && this.musicMuted;
  }

  public isMusicMuted(): boolean {
    return this.musicMuted;
  }

  public isSfxMuted(): boolean {
    return this.sfxMuted;
  }

  public isVoiceMuted(): boolean {
    return this.voiceMuted;
  }

  public toggleVoice(): boolean {
    this.voiceMuted = !this.voiceMuted;
    if (!this.voiceMuted) {
      this.speak('Voice effects enabled');
    }
    return this.voiceMuted;
  }

  public toggleMusic(): boolean {
    this.musicMuted = !this.musicMuted;
    if (this.musicMuted) {
      this.stopBackgroundMusic();
    } else {
      this.startBackgroundMusic();
    }
    return this.musicMuted;
  }

  public toggleSfx(): boolean {
    this.sfxMuted = !this.sfxMuted;
    return this.sfxMuted;
  }

  public toggleAllMute(): boolean {
    const shouldMute = !(this.sfxMuted && this.musicMuted && this.voiceMuted);
    this.sfxMuted = shouldMute;
    this.musicMuted = shouldMute;
    this.voiceMuted = shouldMute;
    if (shouldMute) {
      this.stopBackgroundMusic();
    } else {
      this.startBackgroundMusic();
    }
    return shouldMute;
  }

  // --- BACKGROUND MELODY SONG (LO-FI CHILL CARD LOUNGE) ---

  /**
   * Generates a warm, relaxing card-lounge background melody loop
   * Progression: Cmaj9 -> Am9 -> Fmaj7 -> Gsus4
   */
  public startBackgroundMusic() {
    if (this.musicMuted) return;
    this.initContext();
    if (!this.ctx || this.musicPlaying) return;

    this.musicPlaying = true;
    this.musicStep = 0;

    // Create master music gain
    this.musicGainNode = this.ctx.createGain();
    this.musicGainNode.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    this.musicGainNode.connect(this.ctx.destination);

    // Chords: [BassFreq, ChordFreq1, ChordFreq2, LeadNote]
    const chordPattern = [
      // Bar 1: Cmaj9
      { bass: 130.81, notes: [261.63, 329.63, 392.0, 493.88], melody: [523.25, 493.88, 392.0] },
      // Bar 2: Am9
      { bass: 110.0, notes: [220.0, 261.63, 329.63, 392.0], melody: [440.0, 392.0, 329.63] },
      // Bar 3: Fmaj7
      { bass: 87.31, notes: [174.61, 261.63, 329.63, 349.23], melody: [349.23, 392.0, 440.0] },
      // Bar 4: Gsus4 / G7
      { bass: 98.0, notes: [196.0, 261.63, 293.66, 392.0], melody: [392.0, 329.63, 293.66] },
    ];

    const playChordStep = () => {
      if (!this.musicPlaying || this.musicMuted || !this.ctx || !this.musicGainNode) return;

      const currentChord = chordPattern[this.musicStep % chordPattern.length];
      const now = this.ctx.currentTime;
      const stepDuration = 2.4; // 2.4 seconds per chord bar

      // Warm Sub Bass (Sine wave)
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(currentChord.bass, now);
      bassGain.gain.setValueAtTime(0.35, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.95);
      bassOsc.connect(bassGain);
      bassGain.connect(this.musicGainNode);
      bassOsc.start(now);
      bassOsc.stop(now + stepDuration);

      // Soft Electric Piano Chords (Gentle Triangle + Lowpass)
      currentChord.notes.forEach((freq, idx) => {
        const chordOsc = this.ctx!.createOscillator();
        const chordGain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();

        chordOsc.type = 'triangle';
        chordOsc.frequency.setValueAtTime(freq, now + idx * 0.04);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now);

        chordGain.gain.setValueAtTime(0.12, now + idx * 0.04);
        chordGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.9);

        chordOsc.connect(filter);
        filter.connect(chordGain);
        chordGain.connect(this.musicGainNode!);

        chordOsc.start(now + idx * 0.04);
        chordOsc.stop(now + stepDuration);
      });

      // Ambient Melodic Bell Accents
      currentChord.melody.forEach((melFreq, mIdx) => {
        const melOsc = this.ctx!.createOscillator();
        const melGain = this.ctx!.createGain();
        const melStart = now + 0.6 + mIdx * 0.6;

        melOsc.type = 'sine';
        melOsc.frequency.setValueAtTime(melFreq, melStart);

        melGain.gain.setValueAtTime(0.08, melStart);
        melGain.gain.exponentialRampToValueAtTime(0.0001, melStart + 0.55);

        melOsc.connect(melGain);
        melGain.connect(this.musicGainNode!);

        melOsc.start(melStart);
        melOsc.stop(melStart + 0.6);
      });

      this.musicStep++;
      this.musicTimer = window.setTimeout(playChordStep, stepDuration * 1000);
    };

    playChordStep();
  }

  public stopBackgroundMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.musicGainNode && this.ctx) {
      try {
        this.musicGainNode.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      } catch {}
    }
  }

  // --- MODERN SOUND EFFECTS ---

  /** Card Slide / Draw: Tactile card paper swish and subtle tap */
  public playCardDraw() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, now);

    gain.gain.setValueAtTime(this.sfxVolume * 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  /** Card Play: Crisp, tactile table snap */
  public playCardPlay() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.09);

    gain.gain.setValueAtTime(this.sfxVolume * 0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  /** Skip Card: Modern acoustic whoosh & mute chime */
  public playSkip() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [587.33, 440.0].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const start = now + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(this.sfxVolume * 0.5, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(start);
      osc.stop(start + 0.22);
    });
  }

  /** Reverse Card: Smooth fluid pitch sweep */
  public playReverse() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(330, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.25);

    gain.gain.setValueAtTime(this.sfxVolume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  /** Draw Two / Four Penalty: Resonant low boom */
  public playDrawPenalty() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.35);

    gain.gain.setValueAtTime(this.sfxVolume * 0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  /** Wild Card: Shimmering prismatic celesta chime */
  public playWild() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const start = now + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(this.sfxVolume * 0.45, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(start);
      osc.stop(start + 0.42);
    });
  }

  /** Uno Call: Bold, energetic brass alert */
  public playUnoCall() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [440.0, 554.37, 659.25].forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(this.sfxVolume * 0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    });
  }

  /** Caught Uno: Warning buzz */
  public playUnoCaught() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(185, now);
    osc.frequency.setValueAtTime(130, now + 0.15);

    gain.gain.setValueAtTime(this.sfxVolume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  /** Victory / Round Win: Elegant orchestral fanfare */
  public playRoundWin() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [
      { f: 523.25, t: 0.0 }, // C5
      { f: 659.25, t: 0.12 }, // E5
      { f: 783.99, t: 0.24 }, // G5
      { f: 1046.5, t: 0.36 }, // C6
    ];

    notes.forEach(({ f, t }) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const start = now + t;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, start);

      gain.gain.setValueAtTime(this.sfxVolume * 0.55, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(start);
      osc.stop(start + 0.65);
    });
  }

  /** UI Click */
  public playClick() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);

    gain.gain.setValueAtTime(this.sfxVolume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  /** Move Error / Rejection */
  public playError() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.1);

    gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  /** Player Turn Notification Alert Chime */
  public playTurnAlert() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Pleasant 2-tone melodic chime: D5 (587.33Hz) -> A5 (880Hz)
    const tones = [
      { freq: 587.33, start: now, dur: 0.18 },
      { freq: 880.0, start: now + 0.12, dur: 0.35 },
    ];

    tones.forEach(({ freq, start, dur }) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(this.sfxVolume * 0.55, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(start);
      osc.stop(start + dur + 0.05);
    });
  }

  private cachedFemaleVoice: SpeechSynthesisVoice | null = null;

  public refreshVoices() {
    this.cachedFemaleVoice = null;
    this.findFemaleVoice();
  }

  private findFemaleVoice(): SpeechSynthesisVoice | null {
    if (this.cachedFemaleVoice) return this.cachedFemaleVoice;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // Prioritized female voice keywords across iOS, Android, Windows, Mac, and Linux
    const femaleKeywords = [
      'female', 'samantha', 'zira', 'victoria', 'karen', 'jenny', 'aria',
      'eva', 'allison', 'fiona', 'susan', 'catherine', 'hazel', 'serena',
      'ava', 'moira', 'tessa', 'veena', 'google us english', 'en-us'
    ];

    for (const kw of femaleKeywords) {
      const match = voices.find(
        (v) => (v.lang.startsWith('en') || v.lang.startsWith('en_')) && v.name.toLowerCase().includes(kw)
      );
      if (match) {
        this.cachedFemaleVoice = match;
        return match;
      }
    }

    // Fallback to any English voice
    const anyEn = voices.find((v) => v.lang.startsWith('en'));
    if (anyEn) {
      this.cachedFemaleVoice = anyEn;
      return anyEn;
    }

    return voices[0] || null;
  }

  // --- SPOKEN VOICE EFFECTS (FEMALE HUD ANNOUNCER) ---

  /** General Speech synthesizer */
  public speak(text: string, force: boolean = false) {
    if ((this.voiceMuted && !force) || typeof window === 'undefined') return;
    if (!('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05; // clear energetic cadence
      utterance.pitch = 1.2;  // tuned for female HUD voice
      utterance.volume = 0.95;

      const voice = this.findFemaleVoice();
      if (voice) {
        utterance.voice = voice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {}
  }

  public speakTurn() {
    this.speak("Your turn!");
  }

  public speakUno(playerName?: string) {
    if (playerName) {
      this.speak(`${playerName} calls UNO!`);
    } else {
      this.speak("UNO!");
    }
  }

  public speakSkip() {
    this.speak("Player skipped!");
  }

  public speakReverse() {
    this.speak("Reverse order!");
  }

  public speakDraw(count: number) {
    this.speak(`Draw ${count} cards!`);
  }

  public speakWild(color: string) {
    this.speak(`Wild! Color is ${color}!`);
  }

  public speakCaught(targetName: string) {
    this.speak(`Caught! ${targetName} draws penalty cards!`);
  }

  public speakRoundWin(winnerName: string) {
    this.speak(`${winnerName} wins the round!`);
  }
}

export const soundFx = new ModernAudioEngine();

// Auto-unlock AudioContext on first user interaction in browser preview
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    soundFx.resume();
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });

  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
      soundFx.refreshVoices();
    };
  }
}
