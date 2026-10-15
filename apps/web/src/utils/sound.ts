class ChessSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  public enabled: boolean = true;
  public masterVolume: number = 0.8; // 0.0 to 1.0
  public moveSoundsEnabled: boolean = true;
  public alertsEnabled: boolean = true;

  constructor() {
    // Autoplay policy unlock on first user interaction
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        try {
          const ctx = this.getContext();
          if (ctx && ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
          }
        } catch (_) {}
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };
      window.addEventListener('pointerdown', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });

      // Restore stored volume settings if present
      try {
        const savedVol = localStorage.getItem('neochess_master_volume');
        if (savedVol !== null) {
          const parsed = parseFloat(savedVol);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
            this.masterVolume = parsed;
          }
        }
      } catch (_) {}
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
    try {
      localStorage.setItem('neochess_master_volume', this.masterVolume.toString());
    } catch (_) {}
  }

  private getDestinationNode(ctx: AudioContext): AudioNode {
    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, ctx.currentTime);
      this.masterGain.connect(ctx.destination);
    } else {
      this.masterGain.gain.setValueAtTime(this.masterVolume, ctx.currentTime);
    }
    return this.masterGain;
  }

  /**
   * Soft, organic wooden piece movement (gentle click with subtle warmth)
   */
  playMove() {
    if (!this.enabled || !this.moveSoundsEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const dest = this.getDestinationNode(ctx);
    const now = ctx.currentTime;

    // Body of the piece landing
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(150, now + 0.07);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.07);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.08);

    // Subtle felt click transient
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(950, now);
    clickOsc.frequency.exponentialRampToValueAtTime(200, now + 0.02);

    clickGain.gain.setValueAtTime(0.18, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    clickOsc.connect(clickGain);
    clickGain.connect(dest);

    clickOsc.start(now);
    clickOsc.stop(now + 0.025);
  }

  /**
   * Tactile wooden capture clack with subtle tactile bass
   */
  playCapture() {
    if (!this.enabled || !this.moveSoundsEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const dest = this.getDestinationNode(ctx);
    const now = ctx.currentTime;

    // Impact punch
    const punchOsc = ctx.createOscillator();
    const punchGain = ctx.createGain();
    punchOsc.type = 'sine';
    punchOsc.frequency.setValueAtTime(180, now);
    punchOsc.frequency.exponentialRampToValueAtTime(45, now + 0.11);

    punchGain.gain.setValueAtTime(0.55, now);
    punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    punchOsc.connect(punchGain);
    punchGain.connect(dest);

    punchOsc.start(now);
    punchOsc.stop(now + 0.12);

    // Wooden piece clack
    const woodOsc = ctx.createOscillator();
    const woodFilter = ctx.createBiquadFilter();
    const woodGain = ctx.createGain();

    woodFilter.type = 'bandpass';
    woodFilter.frequency.setValueAtTime(1200, now);
    woodFilter.Q.setValueAtTime(2.5, now);

    woodOsc.type = 'square';
    woodOsc.frequency.setValueAtTime(320, now);
    woodOsc.frequency.exponentialRampToValueAtTime(90, now + 0.09);

    woodGain.gain.setValueAtTime(0.35, now);
    woodGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    woodOsc.connect(woodFilter);
    woodFilter.connect(woodGain);
    woodGain.connect(dest);

    woodOsc.start(now);
    woodOsc.stop(now + 0.1);
  }

  /**
   * Subtle, pleasant alert check chime
   */
  playCheck() {
    if (!this.enabled || !this.alertsEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const dest = this.getDestinationNode(ctx);
    const now = ctx.currentTime;

    // High clear bell chime (E5 + B5)
    const fundamental = ctx.createOscillator();
    const overtone = ctx.createOscillator();
    const gain = ctx.createGain();

    fundamental.type = 'sine';
    fundamental.frequency.setValueAtTime(659.25, now); // E5

    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(987.77, now + 0.02); // B5

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    fundamental.connect(gain);
    overtone.connect(gain);
    gain.connect(dest);

    fundamental.start(now);
    overtone.start(now + 0.02);
    fundamental.stop(now + 0.33);
    overtone.stop(now + 0.33);
  }

  /**
   * Castling: two synchronized wooden piece placements
   */
  playCastle() {
    if (!this.enabled || !this.moveSoundsEnabled) return;
    this.playMove();
    setTimeout(() => {
      this.playMove();
    }, 90);
  }

  /**
   * Promotion: uplifting ascending 4-note arpeggio
   */
  playPromotion() {
    if (!this.enabled || !this.moveSoundsEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const dest = this.getDestinationNode(ctx);
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.25, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.16);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.18);
    });
  }

  /**
   * Game start: resonant harmonious 3-tone chime
   */
  playGameStart() {
    if (!this.enabled || !this.alertsEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const dest = this.getDestinationNode(ctx);
    const notes = [440, 554.37, 659.25]; // A4, C#5, E5
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0.28, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.28);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.3);
    });
  }

  /**
   * Victory: triumphant major chord celebration
   */
  playVictory() {
    if (!this.enabled || !this.alertsEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const dest = this.getDestinationNode(ctx);
    const now = ctx.currentTime;
    // Major chord arpeggio into rich sustained triad
    const arpeggio = [
      { f: 523.25, t: 0 },    // C5
      { f: 659.25, t: 0.08 }, // E5
      { f: 783.99, t: 0.16 }, // G5
      { f: 1046.5, t: 0.24 }, // C6
    ];

    arpeggio.forEach(({ f, t }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + t);

      const duration = t === 0.24 ? 0.6 : 0.25;
      gain.gain.setValueAtTime(0.3, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + duration);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now + t);
      osc.stop(now + t + duration + 0.05);
    });
  }

  /**
   * Defeat: gentle mellow descending resolution
   */
  playDefeat() {
    if (!this.enabled || !this.alertsEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const dest = this.getDestinationNode(ctx);
    const now = ctx.currentTime;
    const notes = [
      { f: 440, t: 0 },
      { f: 392, t: 0.12 },
      { f: 349.23, t: 0.24 },
      { f: 329.63, t: 0.36 },
    ];

    notes.forEach(({ f, t }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + t);

      gain.gain.setValueAtTime(0.25, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.3);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now + t);
      osc.stop(now + t + 0.35);
    });
  }

  /**
   * Draw: neutral balanced ambient dual-tone cadence
   */
  playDraw() {
    if (!this.enabled || !this.alertsEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const dest = this.getDestinationNode(ctx);
    const now = ctx.currentTime;
    const notes = [440, 329.63]; // A4, E4

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);

      gain.gain.setValueAtTime(0.25, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.4);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.45);
    });
  }

  /**
   * General game end fallback
   */
  playGameEnd() {
    this.playVictory();
  }

  /**
   * Notification / Challenge pop alert
   */
  playNotification() {
    if (!this.enabled || !this.alertsEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const dest = this.getDestinationNode(ctx);
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Low time warning tick
   */
  playLowTime() {
    if (!this.enabled || !this.alertsEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const dest = this.getDestinationNode(ctx);
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export const sounds = new ChessSoundEngine();
