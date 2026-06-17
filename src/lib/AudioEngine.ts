export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private convolver: ConvolverNode | null = null;
  
  public initialized = false;
  private currentWorld = 0;
  private filter: BiquadFilterNode | null = null;

  // Playlists represent scales (Pentatonic offsets) - much softer base frequencies
  private playlists = [
    { base: 130.81, scale: [0, 2, 4, 7, 9, 12, 14, 16], type: 'sine' as OscillatorType }, // C3 (Void - calm)
    { base: 146.83, scale: [0, 3, 5, 7, 10, 12, 15, 17], type: 'triangle' as OscillatorType }, // D3 (Dusk - mysterious)
    { base: 164.81, scale: [0, 2, 4, 7, 9, 12, 14, 16], type: 'sine' as OscillatorType }, // E3 (Dawn - bright)
    { base: 110.00, scale: [0, 3, 5, 7, 10, 12, 15, 17], type: 'sine' as OscillatorType } // A2 (Abyss - deep)
  ];
  
  private musicInterval: number | null = null;

  constructor() {}

  async init() {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5; // Much softer overall volume
    
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 400; // Soothe the highs intensely
    this.filter.Q.value = 0.2;

    // Huge spatial reverb for ambient feel
    this.convolver = this.ctx.createConvolver();
    this.convolver.buffer = this.createReverbBuffer(8.0); // 8 seconds reverb for softer tail
    
    this.filter.connect(this.convolver);
    this.convolver.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.startMusic();
    this.initialized = true;
  }

  private createReverbBuffer(duration: number): AudioBuffer {
    if (!this.ctx) throw new Error("No context");
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    for (let c = 0; c < 2; c++) {
      const channel = impulse.getChannelData(c);
      for (let i = 0; i < length; i++) {
        channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 5); // Steeper decay for softer reverb
      }
    }
    return impulse;
  }

  public setWorld(worldIndex: number) {
    if (this.currentWorld === worldIndex || !this.ctx) return;
    this.currentWorld = worldIndex % this.playlists.length;
    
    this.stopMusic();
    setTimeout(() => {
       this.startMusic();
    }, 4000); // Longer crossfade gap
    this.playDimensionalShift();
  }

  private startMusic() {
    if (!this.ctx) return;
    const pl = this.playlists[this.currentWorld];
    
    const playNextNote = () => {
        if (!this.ctx || !this.filter) return;
        
        const noteIdx = Math.floor(Math.random() * pl.scale.length);
        const semitones = pl.scale[noteIdx];
        const freq = pl.base * Math.pow(2, semitones / 12);
        
        const isBass = Math.random() > 0.8;
        const actualFreq = isBass ? freq / 2 : freq;
        const vol = isBass ? 0.2 : 0.08;
        
        this.playSFX(actualFreq, pl.type, 3.0, 8.0, (Math.random() - 0.5), vol); // Much softer attack and release
        
        const nextTime = 2000 + Math.random() * 4000;
        this.musicInterval = window.setTimeout(playNextNote, nextTime);
    };

    // Sub-drone just for a tiny bit of depth
    this.playSFX(pl.base / 2, 'sine', 15.0, 60.0, 0, 0.05); 
    playNextNote();
  }

  private stopMusic() {
     if (this.musicInterval) {
         window.clearTimeout(this.musicInterval);
         this.musicInterval = null;
     }
  }

  // Generic envelope generator
  private playSFX(
      freq: number, 
      type: OscillatorType, 
      attackTime: number, 
      releaseTime: number, 
      pan: number = 0,
      vol: number = 0.1
  ) {
      if (!this.ctx || !this.filter) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner();

      osc.type = type;
      osc.frequency.value = freq;
      
      panner.pan.value = pan;
      
      // Envelope
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + attackTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + attackTime + releaseTime);

      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.filter); // Route into reverb & lowpass

      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + attackTime + releaseTime);
  }

  public playPull() {
     if (!this.ctx) return;
     // Soft low rumble instead of harsh sweep
     this.playSFX(50, 'sine', 1.0, 3.0, 0, 0.05);
  }

  public playRepulse() {
     if (!this.ctx) return;
     // Soft airy swell
     this.playSFX(200, 'sine', 0.5, 2.0, 0, 0.05);
  }

  public playAbsorb(tier: number) {
     if (!this.ctx) return;
     const pl = this.playlists[this.currentWorld];
     const idx = Math.floor(Math.random() * 4) + (tier > 1 ? 4 : 0);
     const freq = pl.base * 2 * Math.pow(2, pl.scale[idx % pl.scale.length] / 12);
     
     this.playSFX(freq, 'sine', 0.1, 1.5, (Math.random() - 0.5) * 0.5, 0.03 + (tier * 0.01));
  }

  public playManualHarvest(pan: number) {
     if (!this.ctx) return;
     const pl = this.playlists[this.currentWorld];
     const freq = pl.base * 2.5; // High bright ping
     this.playSFX(freq, 'sine', 0.05, 0.8, pan, 0.04);
  }

  public playDimensionalShift() {
     if (!this.ctx) return;
     this.playSFX(100, 'triangle', 4.0, 10.0, 0, 0.15);
     setTimeout(() => {
         this.playSFX(150, 'sine', 2.0, 8.0, 0, 0.1);
     }, 2000);
  }

  public playLevelUp() {
     if (!this.ctx) return;
     const pl = this.playlists[this.currentWorld];
     this.playSFX(pl.base * 1.5, 'sine', 0.5, 4.0, 0, 0.1); 
  }

  public playSupernova() {
     if (!this.ctx) return;
     this.playSFX(80, 'triangle', 1.0, 12.0, 0, 0.2); // Big soft bass drop
     setTimeout(() => {
        this.playSFX(200, 'sine', 0.5, 6.0, 0, 0.1);
     }, 500);
  }

  public playPrestige() {
     if (!this.ctx) return;
     this.playSFX(300, 'sine', 2.0, 15.0, 0, 0.15); // Big resonant tone
     setTimeout(() => {
        this.playSFX(150, 'sine', 3.0, 15.0, 0, 0.1);
     }, 1000);
  }
  
  public playAchievement() {
     if (!this.ctx) return;
     const pl = this.playlists[this.currentWorld];
     this.playSFX(pl.base * 3, 'sine', 0.2, 3.0, 0, 0.08); // Success ping
  }

  public playAmbientHint() {
     if (!this.ctx) return;
     const pl = this.playlists[this.currentWorld];
     const noteIdx = Math.floor(Math.random() * pl.scale.length);
     const freq = pl.base * 2 * Math.pow(2, pl.scale[noteIdx] / 12);
     this.playSFX(freq, 'sine', 2.0, 4.0, (Math.random() * 2 - 1), 0.05); // soft hint
  }
}

export const audio = new AudioEngine();
