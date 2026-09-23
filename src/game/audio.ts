/**
 * Web Audio API synthesizer for retro 90s FPS sounds
 * High-performance, zero network dependencies, authentic arcade feel
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume: number = 0.7;
  private muted: boolean = false;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  private createNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // AK-47: Heavy punchy crack with metallic recoil reverb
  public playAK47Shot() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Sub thump
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);

    oscGain.gain.setValueAtTime(0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);

    // Gunpowder burst noise
    const noise = this.ctx.createBufferSource();
    const noiseBuffer = this.createNoiseBuffer();
    if (noiseBuffer) {
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.18);
      filter.Q.setValueAtTime(1.5, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(1.0, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(now);
      noise.stop(now + 0.2);
    }
  }

  // Pistol: Snappy high crack
  public playPistolShot() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.09);

    oscGain.gain.setValueAtTime(0.7, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.11);

    const noise = this.ctx.createBufferSource();
    const noiseBuffer = this.createNoiseBuffer();
    if (noiseBuffer) {
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(800, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.9, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(now);
      noise.stop(now + 0.13);
    }
  }

  // Knife slash: Air swoosh
  public playKnifeSlash() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    const noiseBuffer = this.createNoiseBuffer();
    if (noiseBuffer) {
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, now);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.14);
      filter.Q.setValueAtTime(3.0, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start(now);
      noise.stop(now + 0.16);
    }
  }

  // Knife hit: Deep flesh slash
  public playKnifeHit() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);

    oscGain.gain.setValueAtTime(0.7, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  // Knife striking wall / stone / metal: Crisp metallic clink
  public playKnifeHitWall() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);

    oscGain.gain.setValueAtTime(0.65, now);
    oscGain.gain.exponentialRampToValueAtTime(0.005, now + 0.09);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.09);

    // High pitch scrape
    const scrape = this.ctx.createOscillator();
    const scrapeGain = this.ctx.createGain();
    scrape.type = 'square';
    scrape.frequency.setValueAtTime(2800, now);
    scrape.frequency.exponentialRampToValueAtTime(1200, now + 0.05);

    scrapeGain.gain.setValueAtTime(0.3, now);
    scrapeGain.gain.exponentialRampToValueAtTime(0.005, now + 0.06);

    scrape.connect(scrapeGain);
    scrapeGain.connect(this.masterGain);
    scrape.start(now);
    scrape.stop(now + 0.06);
  }

  // Reload: Magazine eject & bolt rack
  public playReload() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Mag out click
    this.playClick(now, 600, 0.05);
    // Mag insert clack (at 0.9s)
    this.playClick(now + 0.9, 450, 0.07);
    this.playClick(now + 1.0, 750, 0.06);
    // Bolt rack slide (at 1.7s)
    this.playClick(now + 1.6, 900, 0.08);
    this.playClick(now + 1.8, 1200, 0.08);
  }

  private playClick(time: number, freq: number, dur: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, time + dur);
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + dur);
  }

  // Hitmarker: High CS tick
  public playHitmarker() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2200, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.06);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  // Headshot "Dink!" metallic chime
  public playHeadshot() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(3200, now);
    osc1.frequency.exponentialRampToValueAtTime(2600, now + 0.15);
    osc2.frequency.setValueAtTime(1600, now);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.22);
    osc2.stop(now + 0.22);
  }

  // Player hurt groan
  public playPlayerHurt() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  // Footstep
  public playFootstep() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    const pitch = 70 + Math.random() * 25;
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Round start horn
  public playRoundStart() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    [440, 554.37, 659.25].forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      gain.gain.setValueAtTime(0.4, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.35);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.38);
    });
  }

  // Victory fanfare
  public playWinSound() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + i * 0.15);
      gain.gain.setValueAtTime(0.3, now + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.42);
    });
  }

  // Defeat tone
  public playDefeatSound() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const notes = [392.00, 349.23, 311.13, 261.63];
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.2);
      gain.gain.setValueAtTime(0.35, now + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.45);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.2);
      osc.stop(now + i * 0.2 + 0.48);
    });
  }
}

export const sounds = new SoundEngine();
