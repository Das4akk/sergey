export interface GameState {
  level: number;
  mass: number;
  totalMass: number;
  maxMass: number;
  dimension: number;
  echoes: number;
  stardust: number;
  achievements: string[];
  upgrades: {
    gravityPower: number;
    spawnRate: number;
    passivePull: number;
    multiplier: number;
    orbitals: number;
    entanglement: number;
    fractal: number;
    radiance: number;
    chronosphere: number;
    quasar: number;
    singularityDepth: number;
    stellarForge: number;
    voidMonolith: number;
    tachyonWeb: number;
    darkMatterSiphon: number;
    eventHorizon: number;
    nebulaCollector: number;
    starWeaver: number;
    cosmicResonance: number;
    pulsarBurst: number;
    voidwalker: number;
    astralProjection: number;
    quantunTunnelling: number;
    entropyWeaver: number;
  }
}

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  tier: number;
  opacity: number;
  isComet?: boolean;
  isAntimatter?: boolean;
  isVoidSpark?: boolean;
  wobble?: number;
  history: {x: number, y: number}[];
};

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private particles: Particle[] = [];
  
  // Singularity (player) pos
  public mouseX: number = 0;
  public mouseY: number = 0;
  public coreX: number = 0;
  public coreY: number = 0;
  public isPulling: boolean = false;
  public isRepulsing: boolean = false;
  public isPaused: boolean = false;
  
  public state: GameState = {
    level: 1,
    mass: 0,
    totalMass: 0,
    maxMass: 50,
    dimension: 0,
    echoes: 0,
    stardust: 0,
    achievements: [],
    upgrades: {
      gravityPower: 1,
      spawnRate: 1,
      passivePull: 0,
      multiplier: 1,
      orbitals: 0,
      entanglement: 0,
      fractal: 0,
      radiance: 0,
      chronosphere: 0,
      quasar: 0,
      singularityDepth: 0,
      stellarForge: 0,
      voidMonolith: 0,
      tachyonWeb: 0,
      darkMatterSiphon: 0,
      eventHorizon: 0,
      nebulaCollector: 0,
      starWeaver: 0,
      cosmicResonance: 0,
      pulsarBurst: 0,
      voidwalker: 0,
      astralProjection: 0,
      quantunTunnelling: 0,
      entropyWeaver: 0,
    }
  };

  private lastTime: number = 0;
  private animationId: number = 0;
  private onStateChange: (state: GameState, leveledUp: boolean) => void;
  private onAbsorb: (tier: number) => void;
  private onAchievement: (id: string) => void;
  private dtAccumulator: number = 0;
  private orbitalAngle: number = 0;
  private fractures: {x: number, y: number, life: number, maxLife: number}[] = [];
  
  public combo: number = 1;
  public comboTimer: number = 0;
  
  public flashTimer: number = 0;
  public shakeTimer: number = 0;

  constructor(
    canvas: HTMLCanvasElement, 
    onStateChange: (state: GameState, leveledUp: boolean) => void,
    onAbsorb: (tier: number) => void,
    onAchievement: (id: string) => void
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error("No 2d context");
    this.ctx = context;
    this.onStateChange = onStateChange;
    this.onAbsorb = onAbsorb;
    this.onAchievement = onAchievement;
    this.load();
    this.resize();
    this.coreX = this.width / 2;
    this.coreY = this.height / 2;
    this.mouseX = this.coreX;
    this.mouseY = this.coreY;
  }

  public save() {
    try {
      localStorage.setItem('omnia_save_v4', JSON.stringify(this.state));
    } catch (e) {}
  }

  public load() {
    try {
      const saved = localStorage.getItem('omnia_save_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = {
          ...this.state,
          ...parsed,
          achievements: parsed.achievements || [],
          stardust: parsed.stardust || 0,
          upgrades: { ...this.state.upgrades, ...(parsed.upgrades || {}) }
        };
      }
    } catch (e) {}
  }

  public resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(dpr, dpr);
  }

  public start() {
    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame(this.loop.bind(this));
  }

  public stop() {
    cancelAnimationFrame(this.animationId);
  }

  public buyUpgrade(key: keyof GameState['upgrades'], cost: number) {
    const echoUpgrades = ['singularityDepth', 'stellarForge', 'voidMonolith', 'tachyonWeb', 'astralProjection', 'quantunTunnelling', 'entropyWeaver'];
    const isEcho = echoUpgrades.includes(key);

    if (isEcho) {
      if (this.state.echoes >= cost) {
        this.state.echoes -= cost;
        this.state.upgrades[key] += 1;
        this.save();
        this.onStateChange({ ...this.state }, false);
        return true;
      }
    } else {
      if (this.state.mass >= cost) {
        this.state.mass -= cost;
        this.state.upgrades[key] += 1;
        this.save();
        this.onStateChange({ ...this.state }, false);
        return true;
      }
    }
    return false;
  }

  public prestige() {
     if (this.state.level < 10) return;
     const gainedEchoes = Math.max(0, Math.floor(this.state.level * 1.5) + Math.floor(this.state.totalMass / 10000));
     const entropyMultiplier = 1 + (this.state.upgrades.entropyWeaver * 0.1);
     
     this.state.echoes += Math.floor(gainedEchoes * entropyMultiplier);
     this.state.level = 1;
     this.state.mass = 0;
     this.state.totalMass = 0;
     this.state.maxMass = 50;
     this.state.dimension = 0;
     
     // Reset matter upgrades
     this.state.upgrades.gravityPower = 1;
     this.state.upgrades.spawnRate = 1;
     this.state.upgrades.passivePull = 0;
     this.state.upgrades.multiplier = 1;
     this.state.upgrades.orbitals = 0;
     this.state.upgrades.entanglement = 0;
     this.state.upgrades.fractal = 0;
     this.state.upgrades.radiance = 0;
     this.state.upgrades.chronosphere = 0;
     this.state.upgrades.quasar = 0;
     this.state.upgrades.darkMatterSiphon = 0;
     this.state.upgrades.eventHorizon = 0;
     this.state.upgrades.nebulaCollector = 0;
     this.state.upgrades.starWeaver = 0;
     this.state.upgrades.cosmicResonance = 0;
     this.state.upgrades.pulsarBurst = 0;
     this.state.upgrades.voidwalker = 0;
     
     this.particles = [];
     this.combo = 1;
     this.save();
     this.onStateChange({ ...this.state }, false);
  }

  public handleCanvasClick(x: number, y: number) {
      if (this.isPaused) return;
      let hit = false;
      for (let i = this.particles.length - 1; i >= 0; i--) {
          const p = this.particles[i];
          const dx = p.x - x;
          const dy = p.y - y;
          const hitRadius = 25 + p.radius + (this.state.upgrades.radiance * 2);
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < hitRadius) { 
              this.particles.splice(i, 1);
              this.onAbsorb(p.tier);
              
              // Active clicking increases combo
              const maxCombo = 10 + (this.state.upgrades.voidMonolith * 10);
              this.combo = Math.min(this.combo + 1, maxCombo);
              this.comboTimer = 2.0 + (this.state.upgrades.tachyonWeb * 1.0);
              
              this.addMass(p.tier * this.state.upgrades.multiplier * 3 * this.combo); 
              hit = true;
              break;
          }
      }
      // Missed click penalties
      if (!hit && this.combo > 1) {
          this.combo = Math.max(1, this.combo - 2);
      }
  }

  public triggerSupernova() {
      if (this.isPaused) return;
      // Burn 50% mass to pull everything on screen immediately with high multiplier (unless padded by singularityDepth)
      if (this.state.mass > 10) {
          this.shakeTimer = 0.5; // active screen shake
          const retainedMass = this.state.upgrades.singularityDepth * 0.1; // 10% per level
          this.state.mass = Math.floor(this.state.mass * Math.max(0.1, 0.5 - retainedMass));

          for (let p of this.particles) {
              const dx = this.coreX - p.x;
              const dy = this.coreY - p.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              p.vx += (dx / dist) * 2000;
              p.vy += (dy / dist) * 2000;
          }
          this.onStateChange({ ...this.state }, false);
      }
  }

  private loop(now: number) {
    const dt = (now - this.lastTime) / 1000; // in seconds
    this.lastTime = now;
    
    // limit max dt to prevent huge jumps if tab was inactive
    const safeDt = Math.min(dt, 0.1);

    if (!this.isPaused) {
       this.update(safeDt);
    }
    this.draw();

    this.animationId = requestAnimationFrame(this.loop.bind(this));
  }

  private update(dt: number) {
    this.dtAccumulator += dt;
    this.orbitalAngle += dt * 2; // Rotate orbitals

    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.shakeTimer > 0) this.shakeTimer -= dt;

    // Fast follow to eliminate lag
    this.coreX += (this.mouseX - this.coreX) * 15 * dt;
    this.coreY += (this.mouseY - this.coreY) * 15 * dt;

    // Spawn mechanism
    const spawnRateSeconds = 0.5 / (this.state.upgrades.spawnRate * 0.5 + 0.5);
    if (this.dtAccumulator > spawnRateSeconds) {
      this.dtAccumulator -= spawnRateSeconds;
      
      const maxParticles = 200;
      if (this.particles.length >= maxParticles) {
          // Instead of lagging, heavily merge particles on screen
          const idx1 = Math.floor(Math.random() * this.particles.length);
          const p1 = this.particles[idx1];
          this.particles.splice(idx1, 1);
          const idx2 = Math.floor(Math.random() * this.particles.length);
          if (this.particles[idx2]) {
             this.particles[idx2].tier += p1.tier;
             this.particles[idx2].radius = 1.5 + Math.min(10, this.particles[idx2].tier * 0.5);
          }
      } else {
          this.spawnParticle();
      }
    }

    // Process particles
    let absorbedCount = 0;
    const coreRadius = 8 + Math.log10(this.state.totalMass + 1) * 2 + (this.state.upgrades.radiance * 2);
    
    const activePullSt = this.isPulling ? (150 * (1 + this.state.upgrades.gravityPower * 0.2)) : 0;
    const passivePullSt = 20 * this.state.upgrades.passivePull;
    const pullSt = activePullSt + passivePullSt;
    const repulseSt = this.isRepulsing ? 300 : 0;

    // Combo Timer Decay
    if (this.comboTimer > 0) {
      // Reduce combo decay rate based on resonance (if we had it, but base is okay)
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 1;
    }

    // Quasar Passive Trigger
    if (this.state.upgrades.quasar > 0 && Math.random() < this.state.upgrades.quasar * 0.005) {
       // Instantly absorb a random particle and draw a beam
       if (this.particles.length > 0) {
           const pIdx = Math.floor(Math.random() * this.particles.length);
           const p = this.particles[pIdx];
           this.particles.splice(pIdx, 1);
           absorbedCount += this.handleAbsorption(p) * 5; // Quasar yield modifier
           // Add fracture line for visual quasar beam
           this.fractures.push({x: p.x, y: p.y, life: 0.5, maxLife: 0.5});
       }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      const dx = this.coreX - p.x;
      const dy = this.coreY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Chronosphere effect (Slows particles near core)
      if (this.state.upgrades.chronosphere > 0) {
         if (dist < 200 + this.state.upgrades.chronosphere * 50) {
             p.vx *= (1 - dt * Math.min(0.9, this.state.upgrades.chronosphere * 0.2));
             p.vy *= (1 - dt * Math.min(0.9, this.state.upgrades.chronosphere * 0.2));
         }
      }

      // Core absorption with combo multiplier
      const effectiveRadius = coreRadius + p.radius + (this.combo * 0.5);
      if (dist < effectiveRadius) {
        absorbedCount += this.handleAbsorption(p);
        this.particles.splice(i, 1);
        continue;
      }

      // Orbital absorption
      if (this.state.upgrades.orbitals > 0) {
        const orbitRadius = coreRadius + 40;
        let caught = false;
        for (let o = 0; o < this.state.upgrades.orbitals; o++) {
           const angle = this.orbitalAngle + (o * Math.PI * 2 / this.state.upgrades.orbitals);
           const ox = this.coreX + Math.cos(angle) * orbitRadius;
           const oy = this.coreY + Math.sin(angle) * orbitRadius;
           const odx = ox - p.x;
           const ody = oy - p.y;
           if (Math.sqrt(odx*odx + ody*ody) < 15 + p.radius) {
              absorbedCount += this.handleAbsorption(p);
              this.particles.splice(i, 1);
              caught = true;
              break;
           }
        }
        if (caught) continue;
      }

      // Gravity / Repulsion
      if (pullSt > 0 && !this.isRepulsing) {
        const pullRadius = 300 + (this.state.upgrades.gravityPower * 50);
        if (dist < pullRadius) {
           const force = pullSt / Math.max(10, dist);
           p.vx += (dx / dist) * force * dt * 50; 
           p.vy += (dy / dist) * force * dt * 50;
        }
      } else if (repulseSt > 0) {
        const repulseRadius = 400;
        if (dist < repulseRadius) {
           const force = repulseSt / Math.max(10, dist);
           p.vx -= (dx / dist) * force * dt * 50; 
           p.vy -= (dy / dist) * force * dt * 50;
        }
      }

      // Drift
      if (p.isComet) {
         p.vx += (Math.random() - 0.5) * 50 * dt;
         p.vy += (Math.random() - 0.5) * 50 * dt;
      } else {
         p.vx += (Math.random() - 0.5) * 10 * dt;
         p.vy += (Math.random() - 0.5) * 10 * dt;
         p.vx *= 0.98;
         p.vy *= 0.98;
      }

      p.wobble = (p.wobble || 0) + dt * 10;
      const wx = p.isVoidSpark ? Math.sin(p.wobble) * 2 : 0;
      const wy = p.isVoidSpark ? Math.cos(p.wobble) * 2 : 0;

      p.x += (p.vx + wx) * dt;
      p.y += (p.vy + wy) * dt;
      if (p.opacity < 1) p.opacity += dt * 2;

      // History for trails
      if (!p.history) p.history = [];
      p.history.unshift({x: p.x, y: p.y});
      if (p.history.length > 5) p.history.pop();

      if (p.x < -200 || p.x > this.width + 200 || p.y < -200 || p.y > this.height + 200) {
         this.particles.splice(i, 1);
      }
    }

    // Process fractures
    for (let i = this.fractures.length - 1; i >= 0; i--) {
        this.fractures[i].life -= dt;
        if (this.fractures[i].life <= 0) {
             this.fractures.splice(i, 1);
        }
    }

    if (absorbedCount > 0) {
      this.addMass(absorbedCount * (1 + this.combo * 0.1));
    }
  }

  private handleAbsorption(p: Particle): number {
      this.onAbsorb(p.tier);
      let yieldMass = p.tier * this.state.upgrades.multiplier;

      // Entanglement (chance to double)
      if (this.state.upgrades.entanglement > 0) {
          if (Math.random() < this.state.upgrades.entanglement * 0.05) {
             yieldMass *= 2;
          }
      }

      // Fractal (large particles split into smaller ones)
      if (p.tier > 1 && this.state.upgrades.fractal > 0) {
          for(let i=0; i<this.state.upgrades.fractal; i++) {
              this.particles.push({
                 x: p.x, y: p.y,
                 vx: (Math.random()-0.5) * 100, vy: (Math.random()-0.5) * 100,
                 radius: 1.5, tier: 1, opacity: 1, history: []
              });
          }
      }
      
      // Stardust generation
      let stardustChance = p.isVoidSpark ? 1.0 : (0.01 + this.state.upgrades.nebulaCollector * 0.01);
      if (Math.random() < stardustChance) {
          this.state.stardust += p.isVoidSpark ? (5 + Math.floor(Math.random() * 5)) : 1;
      }
      
      return yieldMass;
  }

  private checkAchievements(amountAbsorbed: number) {
      const check = (id: string, condition: boolean, rewardEchoes: number, rewardMass: number) => {
          if (condition && !this.state.achievements.includes(id)) {
              this.state.achievements.push(id);
              this.state.echoes += rewardEchoes;
              this.state.mass += rewardMass;
              this.onAchievement(id);
          }
      };

      check('singularity', amountAbsorbed >= 1000, 15, 5000);
      check('eclipse', this.state.dimension >= 1, 30, 0);
      check('chronos', this.state.upgrades.chronosphere > 0, 50, 0);
      check('echoes', this.state.echoes >= 50, 100, 100000);
      check('supernova', this.state.upgrades.singularityDepth > 0, 200, 0);
  }

  public prestige() {
      // Calculate echoes to reward based on max level/mass
      const reward = Math.floor(this.state.level * 2 + (this.state.totalMass / 1000));
      
      this.state.echoes += reward;
      this.state.level = 1;
      this.state.mass = 0;
      this.state.totalMass = 0;
      this.state.maxMass = 50;
      this.state.dimension = 0;

      // Reset base upgrades, keep echo upgrades
      this.state.upgrades.gravityPower = 1;
      this.state.upgrades.spawnRate = 1;
      this.state.upgrades.passivePull = 0;
      this.state.upgrades.multiplier = 1;
      this.state.upgrades.orbitals = 0;
      this.state.upgrades.entanglement = 0;
      this.state.upgrades.fractal = 0;
      this.state.upgrades.radiance = 0;
      this.state.upgrades.chronosphere = 0;
      this.state.upgrades.quasar = 0;

      this.particles = [];
      this.combo = 1;

      this.save();
      this.onStateChange({ ...this.state }, false);
  }

  private addMass(amount: number) {
     this.state.mass += amount;
     this.state.totalMass += amount;
     
     this.checkAchievements(amount);

     let leveledUp = false;
     
     if (this.state.mass >= this.state.maxMass) {
        this.state.mass -= this.state.maxMass;
        this.state.level++;
        this.state.maxMass = Math.floor(this.state.maxMass * 1.8);
        this.state.echoes += this.state.level; // Grant echoed on level up
        leveledUp = true;
        
        // Save automatically on level up
        this.save();

        // Create fracture effect
        this.fractures.push({
            x: this.coreX, y: this.coreY,
            life: 2.0, maxLife: 2.0
        });

        this.flashTimer = 0.5;

        // Dimensions change every 5 levels
        if (this.state.level % 5 === 0) {
            this.state.dimension++;
            this.checkAchievements(0); // Trigger dimension checks
        }
     }

     this.onStateChange({ ...this.state }, leveledUp);
  }

  private spawnParticle() {
    const edge = Math.floor(Math.random() * 4);
    let px = 0; let py = 0;
    
    const tierRoll = Math.random();
    let tier = 1;

    const isEpic = (tierRoll > 0.9 - (this.state.upgrades.stellarForge * 0.05)) && this.state.level > 2;
    const isLegendary = (tierRoll > 0.98 - (this.state.upgrades.stellarForge * 0.02)) && this.state.level > 5;
    
    if (isEpic) tier = 2;
    if (isLegendary) tier = 5;

    if (edge === 0) { px = Math.random() * this.width; py = -20; }
    if (edge === 1) { px = this.width + 20; py = Math.random() * this.height; }
    if (edge === 2) { px = Math.random() * this.width; py = this.height + 20; }
    if (edge === 3) { px = -20; py = Math.random() * this.height; }

    const dx = (this.width / 2) - px;
    const dy = (this.height / 2) - py;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    const speed = 10 + Math.random() * 20;
    
    // Comets
    if (this.state.level >= 3 && Math.random() < 0.05) {
       const isAm = Math.random() < 0.2;
       this.particles.push({
         x: px, y: py,
         vx: (dx / len) * (speed * 4) + (Math.random() - 0.5)*10,
         vy: (dy / len) * (speed * 4) + (Math.random() - 0.5)*10,
         radius: 3, tier: isAm ? -5 : 10, opacity: 0, isComet: true, isAntimatter: isAm, history: []
       });
       return;
    }

    const isVoidSpark = this.state.level > 10 && Math.random() < 0.01;

    this.particles.push({
      x: px, y: py,
      vx: (dx / len) * speed + (Math.random() - 0.5)*20,
      vy: (dy / len) * speed + (Math.random() - 0.5)*20,
      radius: isVoidSpark ? 6 : 1.5 + (tier * 0.8), tier: isVoidSpark ? 50 : tier, opacity: 0,
      isVoidSpark, history: []
    });
  }

  private draw() {
    this.ctx.save();
    if (this.shakeTimer > 0) {
       const shakeAmt = this.shakeTimer * 20;
       this.ctx.translate((Math.random() - 0.5) * shakeAmt, (Math.random() - 0.5) * shakeAmt);
    }

    // Dynamic background based on dimension
    const dimColors = [
       'rgba(5, 5, 5, 0.3)',      // Void
       'rgba(15, 10, 20, 0.3)',   // Dusk
       'rgba(20, 25, 30, 0.3)',   // Dawn
       'rgba(10, 25, 35, 0.3)'    // Abyss
    ];
    this.ctx.fillStyle = dimColors[this.state.dimension % dimColors.length];
    this.ctx.fillRect(0, 0, this.width, this.height);

    if (this.flashTimer > 0) {
       this.ctx.fillStyle = `rgba(255, 255, 255, ${this.flashTimer * 0.5})`;
       this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // Draw Fractures (Level Up tears / Quasar beams)
    for (const f of this.fractures) {
        this.ctx.save();
        const p = f.life / f.maxLife;
        this.ctx.globalAlpha = p;
        
        // Make fractures look more like cosmic portals or energy bursts
        this.ctx.strokeStyle = `rgba(200, 220, 255, ${p})`;
        this.ctx.lineWidth = 1.5 * p;
        this.ctx.beginPath();
        for(let i=0; i<8; i++) {
           const ang = (i / 8) * Math.PI * 2 + (1 - p) * Math.PI;
           const r1 = 10 + (1-p) * 50;
           const r2 = 30 + (1-p) * 200;
           this.ctx.moveTo(f.x + Math.cos(ang)*r1, f.y + Math.sin(ang)*r1);
           // Slight curve
           this.ctx.quadraticCurveTo(f.x + Math.cos(ang + 0.5)*r2*0.5, f.y + Math.sin(ang + 0.5)*r2*0.5, f.x + Math.cos(ang)*r2, f.y + Math.sin(ang)*r2);
        }
        this.ctx.stroke();
        this.ctx.restore();
    }

    if (this.isPulling) {
        this.ctx.save();
        const pullRad = 300 + (this.state.upgrades.gravityPower * 50);
        const grad = this.ctx.createRadialGradient(this.coreX, this.coreY, 0, this.coreX, this.coreY, pullRad);
        // Color based on combo
        const pullHue = Math.min(this.combo * 2, 60);
        grad.addColorStop(0, `hsla(${pullHue}, 100%, 80%, 0.05)`);
        grad.addColorStop(1, `hsla(${pullHue}, 100%, 80%, 0)`);
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(this.coreX, this.coreY, pullRad, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }
    
    if (this.isRepulsing) {
        this.ctx.save();
        const grad = this.ctx.createRadialGradient(this.coreX, this.coreY, 0, this.coreX, this.coreY, 400);
        grad.addColorStop(0, 'rgba(255, 100, 100, 0.05)');
        grad.addColorStop(1, 'rgba(255, 100, 100, 0)');
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(this.coreX, this.coreY, 400, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    // Chronosphere zone
    if (this.state.upgrades.chronosphere > 0) {
        this.ctx.save();
        const chronoRad = 200 + this.state.upgrades.chronosphere * 50;
        this.ctx.strokeStyle = `rgba(180, 100, 255, ${0.1 + Math.sin(performance.now()/1000)*0.05})`;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(this.coreX, this.coreY, chronoRad, 0, Math.PI*2);
        this.ctx.stroke();
        this.ctx.restore();
    }

    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = p.opacity;

      // Draw trail
      if (p.history && p.history.length > 1) {
          this.ctx.beginPath();
          this.ctx.moveTo(p.history[0].x, p.history[0].y);
          for (let k = 1; k < p.history.length; k++) {
              this.ctx.lineTo(p.history[k].x, p.history[k].y);
          }
          this.ctx.strokeStyle = p.isAntimatter ? 'rgba(255,50,50,0.5)' : 
                                 p.isVoidSpark ? 'rgba(100,200,255,0.5)' : 
                                 p.isComet ? 'rgba(255,170,68,0.5)' : 'rgba(136,136,136,0.3)';
          this.ctx.lineWidth = p.radius * 0.8;
          this.ctx.stroke();
      }

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      
      if (p.isAntimatter) {
         this.ctx.fillStyle = '#ff3333';
         this.ctx.shadowColor = '#ff3333';
         this.ctx.shadowBlur = 15;
      } else if (p.isVoidSpark) {
         this.ctx.fillStyle = '#ccffff';
         this.ctx.shadowColor = '#ccffff';
         this.ctx.shadowBlur = 20;
      } else if (p.isComet) {
         this.ctx.fillStyle = '#ffaa44';
         this.ctx.shadowColor = '#ffaa44';
         this.ctx.shadowBlur = 10;
      } else {
         if (this.state.dimension % 4 === 1) this.ctx.fillStyle = p.tier > 1 ? '#e2d8f0' : '#887788';
         else if (this.state.dimension % 4 === 2) this.ctx.fillStyle = p.tier > 1 ? '#d8e2f0' : '#778899';
         else this.ctx.fillStyle = p.tier > 1 ? '#e2e8f0' : '#888888';
         // PERFORMANCE OPTIMIZATION: Only add shadow blur for high tier particles
         if (p.tier > 1) {
            this.ctx.shadowColor = '#ffffff';
            this.ctx.shadowBlur = Math.min(15, p.tier * 2);
         } else {
            this.ctx.shadowBlur = 0;
         }
      }

      this.ctx.fill();

      // Comet tail
      if (p.isComet) {
         this.ctx.beginPath();
         this.ctx.moveTo(p.x, p.y);
         this.ctx.lineTo(p.x - p.vx * 0.2, p.y - p.vy * 0.2);
         this.ctx.strokeStyle = `rgba(255, 170, 68, ${p.opacity * 0.5})`;
         this.ctx.lineWidth = 2;
         this.ctx.stroke();
      }

      this.ctx.restore();
    }

    // Core
    const coreRadius = 8 + Math.log10(this.state.totalMass + 1) * 2 + (this.state.upgrades.radiance * 2);
    this.ctx.save();
    const time = performance.now() / 500;
    const pulseRad = coreRadius + Math.sin(time) * 1.5;
    
    // Orbitals
    if (this.state.upgrades.orbitals > 0) {
        const orbitRadius = coreRadius + 40;
        this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        this.ctx.beginPath();
        this.ctx.arc(this.coreX, this.coreY, orbitRadius, 0, Math.PI*2);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#fff';
        for (let i = 0; i < this.state.upgrades.orbitals; i++) {
           const angle = this.orbitalAngle + (i * Math.PI * 2 / this.state.upgrades.orbitals);
           this.ctx.beginPath();
           this.ctx.arc(this.coreX + Math.cos(angle)*orbitRadius, this.coreY + Math.sin(angle)*orbitRadius, 3, 0, Math.PI*2);
           this.ctx.fill();
        }
    }

    this.ctx.beginPath();
    this.ctx.arc(this.coreX, this.coreY, pulseRad, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowColor = '#ffffff';
    this.ctx.shadowBlur = 15 + Math.sin(time * 2) * 5 + (this.state.upgrades.radiance * 5);
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.arc(this.coreX, this.coreY, coreRadius * 0.4, 0, Math.PI * 2);
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fill();
    this.ctx.restore();

    // Draw Combo Label
    if (this.combo > 1) {
       this.ctx.save();
       const alpha = Math.min(1, this.comboTimer);
       this.ctx.globalAlpha = alpha;
       this.ctx.fillStyle = `hsl(${Math.min(this.combo * 2, 60)}, 100%, 80%)`;
       this.ctx.font = '700 14px "JetBrains Mono", monospace';
       this.ctx.textAlign = 'center';
       this.ctx.fillText(`${Math.floor(this.combo)}x`, this.coreX, this.coreY - coreRadius - 20);
       this.ctx.restore();
    }
    
    this.ctx.restore(); // Restore shake translation and global save
  }
}
