export interface GameState {
  level: number;
  mass: number;
  totalMass: number;
  maxMass: number;
  dimension: number;
  echoes: number;
  stardust: number;
  prestigeCount: number;
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
  private fractures: {x: number, y: number, life: number, maxLife: number, isSmall?: boolean, color?: string}[] = [];
  
  public singularityCharge: number = 0;
  public orbitingParticles: Particle[] = [];
  
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
    const echoUpgrades = ['singularityDepth', 'stellarForge', 'voidMonolith', 'tachyonWeb', 'quantunTunnelling', 'entropyWeaver'];
    const stardustUpgrades = ['darkMatterSiphon', 'eventHorizon', 'nebulaCollector', 'starWeaver', 'cosmicResonance', 'pulsarBurst', 'voidwalker', 'astralProjection'];
    const isEcho = echoUpgrades.includes(key);
    const isStardust = stardustUpgrades.includes(key);

    if (isEcho) {
      if (this.state.echoes >= cost) {
        this.state.echoes -= cost;
        this.state.upgrades[key] += 1;
        this.save();
        this.onStateChange({ ...this.state }, false);
        return true;
      }
    } else if (isStardust) {
      if (this.state.stardust >= cost) {
        this.state.stardust -= cost;
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
     const reqLevel = 5 + (this.state.prestigeCount || 0) * 10;
     if (this.state.level < reqLevel) return;
     const gainedEchoes = Math.max(0, Math.floor(this.state.level * 1.5) + Math.floor(this.state.totalMass / 10000));
     const entropyMultiplier = 1 + (this.state.upgrades.entropyWeaver * 0.1);
     
     this.state.echoes += Math.floor(gainedEchoes * entropyMultiplier);
     this.state.prestigeCount = (this.state.prestigeCount || 0) + 1;
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
     this.singularityCharge = 0;
     this.orbitingParticles = [];
     this.flashTimer = 1.0;
     this.shakeTimer = 1.0;
     this.state.achievements = [];
     this.save();
     this.onStateChange({ ...this.state }, false);
     this.checkAchievements(0);
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

  public triggerPulsarBurst() {
     if (this.isPaused) return;
     this.flashTimer = 1.0;
     this.shakeTimer = 1.0;
     // Huge pull
     for (let p of this.particles) {
         const dx = this.coreX - p.x;
         const dy = this.coreY - p.y;
         const dist = Math.sqrt(dx*dx + dy*dy);
         p.vx += (dx / dist) * 2000;
         p.vy += (dy / dist) * 2000;
     }
     this.fractures.push({x: this.coreX, y: this.coreY, life: 1.5, maxLife: 1.5, color: '#ff00ff'});
  }

  public triggerSupernova() {
      if (this.isPaused) return;
      if (this.state.mass > 10) {
          this.shakeTimer = 0.5;
          const retainedMass = this.state.upgrades.singularityDepth * 0.1;
          this.state.mass = Math.floor(this.state.mass * Math.max(0.1, 0.5 - retainedMass));
          
          this.flashTimer = 0.5;
          
          const destroyRadius = 300 + this.state.upgrades.eventHorizon * 150;
          for (let i = this.particles.length - 1; i >= 0; i--) {
              const p = this.particles[i];
              const dist = Math.hypot(p.x - this.coreX, p.y - this.coreY);
              if (dist < destroyRadius) {
                  this.fractures.push({x: p.x, y: p.y, life: 1.0, maxLife: 1.0, isSmall: true, color: '#ffffff'});
                  // Actually, just pull good stuff and destroy bad stuff
                  if (p.isAntimatter || p.isComet) {
                     this.particles.splice(i, 1);
                  } else {
                     const dx = this.coreX - p.x;
                     const dy = this.coreY - p.y;
                     p.vx += (dx / Math.max(1, dist)) * 2000;
                     p.vy += (dy / Math.max(1, dist)) * 2000;
                  }
              }
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
    
    if (this.comboTimer > 0) {
       this.comboTimer -= dt;
       if (this.comboTimer <= 0) {
           this.combo = 1;
       }
    }

    // Process particles
    let absorbedCount = 0;
    const coreRadius = 8 + Math.log10(this.state.totalMass + 1) * 2 + (this.state.upgrades.radiance * 2);
    
    const activePullSt = this.isPulling ? (150 * (1 + this.state.upgrades.gravityPower * 0.2)) : 0;
    const passivePullSt = 20 * this.state.upgrades.passivePull;
    const pullSt = activePullSt + passivePullSt;
    const repulseSt = this.isRepulsing ? 300 : 0;

    // Singularity Charge Decay when not pulling
    if (!this.isPulling && this.singularityCharge > 0) {
      const decayBase = 50;
      const decayRate = Math.max(5, decayBase - (this.state.upgrades.cosmicResonance * 10)); // cosmic resonance slows decay
      this.singularityCharge = Math.max(0, this.singularityCharge - dt * decayRate);
      if (this.singularityCharge === 0 && this.orbitingParticles.length > 0) {
        // Crush particles!
        const count = this.orbitingParticles.length;
        const mult = 1 + (count * 0.1) * (1 + this.state.upgrades.tachyonWeb * 0.2);
        let totalMass = 0;
        let totalTier = 0;
        for (const p of this.orbitingParticles) {
            totalMass += p.tier * this.state.upgrades.multiplier * mult;
            totalTier += p.tier;
        }
        if (totalMass > 0) {
            this.addMass(totalMass);
            this.onAbsorb(Math.max(1, Math.floor(totalTier / count)));
            this.flashTimer = 0.5;
            this.fractures.push({x: this.coreX, y: this.coreY, life: 1.0, maxLife: 1.0, isSmall: false});
        }
        this.orbitingParticles = [];
      }
    } else if (this.isPulling) {
      const maxCharge = 50 + (this.state.upgrades.voidMonolith * 30);
      this.singularityCharge = Math.min(maxCharge, this.singularityCharge + dt * 30);
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

    // Star Weaver Conversion Trigger
    if (this.state.upgrades.starWeaver > 0 && Math.random() < this.state.upgrades.starWeaver * 0.001) {
       if (this.state.mass > 1000) {
           this.state.mass -= 1000;
           this.state.stardust += this.state.upgrades.starWeaver;
           this.flashTimer = 0.2;
           this.fractures.push({x: this.coreX, y: this.coreY, life: 0.8, maxLife: 0.8, isSmall: false, color: '#ffff00'});
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

      // Core & Event Horizon absorption
      const effectiveRadius = coreRadius + p.radius + this.singularityCharge;
      if (dist < effectiveRadius) {
        if (this.singularityCharge > 0 && Math.random() < 0.9) { // 90% chance to orbit if singularity is active
            this.orbitingParticles.push(p);
            this.particles.splice(i, 1);
        } else {
            absorbedCount += this.handleAbsorption(p);
            this.particles.splice(i, 1);
        }
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

      // Voidwalker Self-Propulsion
      if (this.state.upgrades.voidwalker > 0) {
         const moveSpeed = this.state.upgrades.voidwalker * 50;
         p.x += (dx / Math.max(1, dist)) * moveSpeed * dt;
         p.y += (dy / Math.max(1, dist)) * moveSpeed * dt;
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
      this.addMass(absorbedCount);
    }
  }

  private handleAbsorption(p: Particle): number {
      this.onAbsorb(p.tier);
      let yieldMass = p.tier * this.state.upgrades.multiplier;
      
      const particleColor = p.isAntimatter ? '#ff3333' : p.isVoidSpark ? '#ccffff' : p.isComet ? '#ffaa44' : p.tier > 1 ? '#bbff00' : '#888888';
      this.fractures.push({x: p.x, y: p.y, life: 0.4, maxLife: 0.4, isSmall: true, color: particleColor});

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
      check('first_blood', this.state.totalMass >= 50, 1, 0);
      check('apprentice', this.state.level >= 5, 5, 50);
      check('adept', this.state.level >= 10, 10, 500);
      check('master', this.state.level >= 20, 20, 5000);
      check('grandmaster', this.state.level >= 30, 50, 50000);
      check('god_of_gravity', this.state.level >= 50, 200, 1000000);
      check('black_hole', this.state.totalMass >= 10000, 15, 0);
      check('supermassive', this.state.totalMass >= 1000000, 50, 0);
      check('galactic_core', this.state.totalMass >= 100000000, 150, 0);
      check('singularity_novice', this.singularityCharge >= 10, 2, 0);
      check('singularity_master', this.singularityCharge >= 50, 10, 0);
      check('singularity_god', this.singularityCharge >= 100, 50, 0);
      check('singularity_breaker', this.singularityCharge >= 200, 200, 0);
      check('dimension_void', this.state.dimension >= 1, 10, 0);
      check('dimension_twilight', this.state.dimension >= 2, 30, 0);
      check('dimension_dawn', this.state.dimension >= 3, 50, 0);
      check('dimension_ether', this.state.dimension >= 4, 100, 0);
      check('dimension_astral', this.state.dimension >= 5, 200, 0);
      check('stardust_collector', this.state.stardust >= 50, 5, 0);
      check('stardust_hoarder', this.state.stardust >= 500, 20, 0);
      check('echo_whisperer', this.state.echoes >= 500, 100, 0);
      check('rebirth', this.state.maxMass === 50 && this.state.echoes > 0 && this.state.totalMass === 0, 10, 0);
      check('dark_matter_initiate', this.state.upgrades.darkMatterSiphon > 0, 5, 0);
      check('event_horizon_reached', this.state.upgrades.eventHorizon > 0, 5, 0);
      check('star_weaver_born', this.state.upgrades.starWeaver > 0, 10, 0);
      check('pulsar_unlocked', this.state.upgrades.pulsarBurst > 0, 20, 0);
      check('voidwalker_step', this.state.upgrades.voidwalker > 0, 50, 0);
      
      // New 25
      check('level_2', this.state.level >= 2, 2, 0);
      check('level_15', this.state.level >= 15, 15, 0);
      check('level_40', this.state.level >= 40, 60, 0);
      check('level_75', this.state.level >= 75, 200, 0);
      check('level_100', this.state.level >= 100, 500, 0);
      check('mass_10', this.state.totalMass >= 10, 1, 0);
      check('mass_500', this.state.totalMass >= 500, 5, 0);
      check('mass_1b', this.state.totalMass >= 1000000000, 300, 0);
      check('echo_10k', this.state.echoes >= 10000, 200, 0);
      check('echo_1m', this.state.echoes >= 1000000, 5000, 0);
      check('stardust_10k', this.state.stardust >= 10000, 50, 0);
      check('stardust_1m', this.state.stardust >= 1000000, 500, 0);
      check('prestige_5', (this.state.prestigeCount || 0) >= 5, 100, 0);
      check('prestige_10', (this.state.prestigeCount || 0) >= 10, 250, 0);
      check('prestige_25', (this.state.prestigeCount || 0) >= 25, 1000, 0);
      check('gravity_50', this.state.upgrades.gravityPower >= 50, 20, 0);
      check('entropy_50', this.state.upgrades.spawnRate >= 50, 20, 0);
      check('multiplier_100', this.state.upgrades.multiplier >= 100, 50, 0);
      check('orbitals_10', this.state.upgrades.orbitals >= 10, 30, 0);
      check('fractal_10', this.state.upgrades.fractal >= 10, 25, 0);
      check('pulsar_10', this.state.upgrades.pulsarBurst >= 10, 30, 0);
      check('voidwalker_25', this.state.upgrades.voidwalker >= 25, 40, 0);
      check('dark_matter_20', this.state.upgrades.darkMatterSiphon >= 20, 50, 0);
      check('stellar_forge_10', this.state.upgrades.stellarForge >= 10, 100, 0);
      check('monolith_max', this.state.upgrades.voidMonolith >= 10, 150, 0);
  }


  private addMass(amount: number) {
     const siphonBonus = 1 + (this.state.upgrades.darkMatterSiphon * Math.log10(this.state.totalMass + 1) * 0.05);
     const totalAmount = amount * siphonBonus;
     this.state.mass += totalAmount;
     this.state.totalMass += totalAmount;
     
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
            this.flashTimer = 2.0;
            this.shakeTimer = 1.5;
        }
     }

     this.onStateChange({ ...this.state }, leveledUp);
  }

  private spawnParticle() {
    const edge = Math.floor(Math.random() * 4);
    let px = 0; let py = 0;
    
    const tierRoll = Math.random();
    let tier = 1;

    const forgeLevel = this.state.upgrades.stellarForge;
    let tierOddsEpic = 0.1 + (forgeLevel * 0.05);
    let tierOddsLeg = 0.02 + (forgeLevel * 0.01);
    
    const isLegendary = (tierRoll < tierOddsLeg) && this.state.level > 5;
    const isEpic = !isLegendary && (tierRoll < tierOddsEpic) && this.state.level > 2;
    
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
    if (this.state.level >= 3 && Math.random() < 0.05 + (forgeLevel * 0.002)) {
       const isAm = Math.random() < 0.2;
       this.particles.push({
         x: px, y: py,
         vx: (dx / len) * (speed * 4) + (Math.random() - 0.5)*10,
         vy: (dy / len) * (speed * 4) + (Math.random() - 0.5)*10,
         radius: 3 + (forgeLevel*0.1), tier: isAm ? -5 : 10, opacity: 0, isComet: true, isAntimatter: isAm, history: []
       });
       return;
    }

    const isVoidSpark = this.state.level > 10 && Math.random() < 0.01 + (forgeLevel * 0.005);

    this.particles.push({
      x: px, y: py,
      vx: (dx / len) * speed + (Math.random() - 0.5)*20,
      vy: (dy / len) * speed + (Math.random() - 0.5)*20,
      radius: isVoidSpark ? 6 + (forgeLevel*0.2) : 1.5 + (tier * 0.8), tier: isVoidSpark ? 50 + (forgeLevel*10) : tier, opacity: 0,
      isVoidSpark, history: []
    });
  }

  private draw() {
    this.ctx.save();
    if (this.shakeTimer > 0) {
       const shakeAmt = this.shakeTimer * 20;
       this.ctx.translate((Math.random() - 0.5) * shakeAmt, (Math.random() - 0.5) * shakeAmt);
    }

    // Dimensional Backgrounds
    const t = performance.now() / 1000;
    const currentDim = this.state.dimension % 5;
    
    // Clear whole screen instead of overdraw based on dimension
    if (currentDim === 0) {
        // Void - Deep abyss with radial purple-black gradient
        const grad = this.ctx.createRadialGradient(this.width/2, this.height/2, 0, this.width/2, this.height/2, this.width);
        grad.addColorStop(0, '#0a0a14');
        grad.addColorStop(1, '#020205');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for(let i=0; i<100; i++) {
           let sx = (i * 137 + t * 10) % this.width;
           let sy = (i * 251 + t * 5) % this.height;
           if (sx < 0) sx += this.width; if (sy < 0) sy += this.height;
           this.ctx.fillRect(sx, sy, 1, 1);
        }
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1;
        const spacing = 80;
        const offsetX = (t * 15) % spacing;
        const offsetY = (t * 15) % spacing;
        this.ctx.beginPath();
        for(let x = offsetX; x < this.width; x += spacing) { this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.height); }
        for(let y = offsetY; y < this.height; y += spacing) { this.ctx.moveTo(0, y); this.ctx.lineTo(this.width, y); }
        this.ctx.stroke();
    } else if (currentDim === 1) {
        // Twilight - Smooth shifting magenta/purple gradients
        const gradX = this.width/2 + Math.sin(t*0.5)*300;
        const gradY = this.height/2 + Math.cos(t*0.3)*300;
        const grad = this.ctx.createRadialGradient(gradX, gradY, 0, this.width/2, this.height/2, this.width);
        grad.addColorStop(0, '#2d1445');
        grad.addColorStop(0.5, '#160a22');
        grad.addColorStop(1, '#090212');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.globalCompositeOperation = 'screen';
        const nebulaCount = 4;
        for(let i=0; i<nebulaCount; i++) {
           const nx = this.width/2 + Math.sin(t*0.2 + i*Math.PI*2/nebulaCount) * 400;
           const ny = this.height/2 + Math.cos(t*0.15 + i*Math.PI*2/nebulaCount) * 400;
           const ng = this.ctx.createRadialGradient(nx, ny, 0, nx, ny, 600);
           const hue = 250 + i * 25;
           ng.addColorStop(0, `hsla(${hue}, 70%, 40%, 0.15)`);
           ng.addColorStop(1, 'rgba(0, 0, 0, 0)');
           this.ctx.fillStyle = ng;
           this.ctx.beginPath();
           this.ctx.arc(nx, ny, 600, 0, Math.PI*2);
           this.ctx.fill();
        }
        this.ctx.globalCompositeOperation = 'source-over';
    } else if (currentDim === 2) {
        // Dawn - Warm cyan and amber gradients
        const grad = this.ctx.createLinearGradient(Math.sin(t*0.2)*200, 0, this.width, this.height);
        grad.addColorStop(0, '#0a2a2a');
        grad.addColorStop(0.5, '#051b22');
        grad.addColorStop(1, '#051111');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.strokeStyle = 'rgba(50, 255, 200, 0.05)';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        const rays = 60;
        for(let i=0; i<rays; i++) {
            const angle = (i / rays) * Math.PI * 2 + t * 0.05;
            this.ctx.moveTo(this.coreX, this.coreY);
            const r = this.width * 1.5;
            this.ctx.lineTo(this.coreX + Math.cos(angle)*r, this.coreY + Math.sin(angle)*r);
        }
        this.ctx.stroke();
        
        this.ctx.fillStyle = 'rgba(100, 255, 200, 0.5)';
        for(let i=0; i<50; i++) {
            const pr = ((i*123 + t * 50) % this.width);
            const pa = (i*0.1 + t * 0.1);
            this.ctx.fillRect(this.coreX + Math.cos(pa)*pr, this.coreY + Math.sin(pa)*pr, 2, 2);
        }
    } else if (currentDim === 3) {
        // Ether - Deep blue and teal crystalline structures
        const grad = this.ctx.createRadialGradient(this.width/2, this.height/2, 0, this.width/2, this.height/2, this.width*1.2);
        grad.addColorStop(0, '#0a1d3a');
        grad.addColorStop(1, '#030b14');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.strokeStyle = 'rgba(100, 180, 255, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        const cx = this.width / 2; const cy = this.height / 2;
        for (let i = 0; i < 16; i++) {
           const ang = (i / 16) * Math.PI * 2 + t * 0.08;
           const rad = 200 + Math.sin(t + i)*100;
           const endX = cx + Math.cos(ang) * this.width;
           const endY = cy + Math.sin(ang) * this.height;
           this.ctx.moveTo(cx, cy);
           this.ctx.bezierCurveTo(cx + Math.cos(ang+1.5)*rad, cy + Math.sin(ang+1.5)*rad, endX, endY, endX, endY);
        }
        this.ctx.stroke();
    } else {
        // Astral - Deep multi-color pulsing mandala background
        const grad = this.ctx.createRadialGradient(this.width/2, this.height/2, 0, this.width/2, this.height/2, this.width);
        const hue = (t * 10) % 360;
        grad.addColorStop(0, `hsla(${hue}, 30%, 15%, 1)`);
        grad.addColorStop(1, '#05000a');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        const mandalaRings = 5;
        for(let r=1; r<=mandalaRings; r++) {
            this.ctx.save();
            this.ctx.translate(this.coreX, this.coreY);
            this.ctx.rotate(t * 0.1 * (r % 2 === 0 ? 1 : -1));
            this.ctx.strokeStyle = `hsla(${hue + r * 30}, 70%, 50%, 0.15)`;
            this.ctx.lineWidth = 1;
            
            this.ctx.beginPath();
            const radius = r * 150 + Math.sin(t * 2 + r) * 20;
            const points = 12;
            for(let i=0; i<points; i++) {
                const angle = (i / points) * Math.PI * 2;
                if (i===0) this.ctx.moveTo(Math.cos(angle)*radius, Math.sin(angle)*radius);
                else this.ctx.lineTo(Math.cos(angle)*radius, Math.sin(angle)*radius);
            }
            this.ctx.closePath();
            this.ctx.stroke();
            this.ctx.restore();
        }
    }

    if (this.flashTimer > 0) {
       this.ctx.fillStyle = `rgba(255, 255, 255, ${this.flashTimer * 0.5})`;
       this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // Draw Fractures (Level Up tears / Quasar beams) // OR mini explosions
    for (const f of this.fractures) {
        this.ctx.save();
        const p = f.life / f.maxLife;
        this.ctx.globalAlpha = p;
        
        if (f.isSmall) {
            // Mini burst
            this.ctx.strokeStyle = f.color || '#fff';
            this.ctx.lineWidth = 2 * p;
            this.ctx.beginPath();
            const burstR = (1 - p) * 30; // expand outwards
            for(let i=0; i<5; i++) {
               const ang = (i / 5) * Math.PI * 2 + (1 - p);
               this.ctx.moveTo(f.x, f.y);
               this.ctx.lineTo(f.x + Math.cos(ang)*burstR, f.y + Math.sin(ang)*burstR);
            }
            this.ctx.stroke();
            this.ctx.fillStyle = f.color || '#fff';
            this.ctx.beginPath();
            this.ctx.arc(f.x, f.y, p * 5, 0, Math.PI*2);
            this.ctx.fill();
        } else {
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
        }
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

      if (currentDim === 0) {
         this.ctx.beginPath();
         this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
         if (p.isAntimatter) { this.ctx.fillStyle = '#ff0055'; this.ctx.shadowColor = '#ff0055'; this.ctx.shadowBlur = 20; }
         else if (p.isVoidSpark) { this.ctx.fillStyle = '#00ffff'; this.ctx.shadowColor = '#00ffff'; this.ctx.shadowBlur = 30; }
         else if (p.isComet) { this.ctx.fillStyle = '#ffaa00'; this.ctx.shadowColor = '#ffaa00'; this.ctx.shadowBlur = 20; }
         else {
             this.ctx.fillStyle = p.tier > 1 ? '#bbff00' : `hsl(${120 + p.tier*20}, 100%, 60%)`;
             this.ctx.shadowBlur = p.tier > 1 ? Math.min(25, p.tier * 4) : 10;
             this.ctx.shadowColor = this.ctx.fillStyle;
         }
         this.ctx.fill();
         // inner core
         this.ctx.beginPath();
         this.ctx.arc(p.x, p.y, p.radius*0.5, 0, Math.PI * 2);
         this.ctx.fillStyle = '#ffffff';
         this.ctx.fill();
      } else if (currentDim === 1) {
         // Twilight - Squares and sharp edges, glowing borders
         this.ctx.translate(p.x, p.y);
         this.ctx.rotate(t * p.radius);
         
         const color = p.isAntimatter ? '#ff0033' : p.isVoidSpark ? '#ff00ff' : p.isComet ? '#ff6600' : p.tier > 1 ? '#cc00ff' : '#00ffcc';
         this.ctx.shadowBlur = p.tier > 1 ? 20 : 10;
         this.ctx.shadowColor = color;
         this.ctx.strokeStyle = color;
         this.ctx.lineWidth = 2.5;
         this.ctx.beginPath();
         this.ctx.rect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
         this.ctx.stroke();
         this.ctx.fillStyle = '#ffffff';
         this.ctx.beginPath();
         this.ctx.rect(-p.radius/3, -p.radius/3, p.radius * 0.6, p.radius * 0.6);
         this.ctx.fill();
      } else if (currentDim === 2) {
         // Dawn - Hollow Diamonds / Rhombus with glowing borders
         this.ctx.translate(p.x, p.y);
         this.ctx.rotate(t * p.radius * 1.5 + Math.PI / 4); // 45 degree rotation for diamond
         
         const color = p.isAntimatter ? '#ff2a2a' : p.isVoidSpark ? '#ffff00' : p.isComet ? '#ffaa00' : p.tier > 1 ? '#ff00aa' : '#00ffaa';
         this.ctx.shadowBlur = p.tier > 1 ? 20 : 10;
         this.ctx.shadowColor = color;
         this.ctx.strokeStyle = color;
         this.ctx.lineWidth = 2;
         
         // Outer diamond
         this.ctx.beginPath();
         this.ctx.moveTo(0, -p.radius * 1.4);
         this.ctx.lineTo(p.radius * 1.4, 0);
         this.ctx.lineTo(0, p.radius * 1.4);
         this.ctx.lineTo(-p.radius * 1.4, 0);
         this.ctx.closePath();
         this.ctx.stroke();
         
         // Inner diamond core
         this.ctx.fillStyle = '#ffffff';
         this.ctx.beginPath();
         this.ctx.moveTo(0, -p.radius * 0.5);
         this.ctx.lineTo(p.radius * 0.5, 0);
         this.ctx.lineTo(0, p.radius * 0.5);
         this.ctx.lineTo(-p.radius * 0.5, 0);
         this.ctx.closePath();
         this.ctx.fill();
      } else if (currentDim === 3) {
         // Ether - Rotating Triangles with inner glow
         this.ctx.translate(p.x, p.y);
         this.ctx.rotate(t * p.radius * 2 + p.vx * 0.1);
         this.ctx.beginPath();
         this.ctx.moveTo(0, -p.radius*2);
         this.ctx.lineTo(p.radius*1.7, p.radius*1);
         this.ctx.lineTo(-p.radius*1.7, p.radius*1);
         this.ctx.closePath();
         const color = p.isAntimatter ? '#ff0033' : p.isVoidSpark ? '#00ffff' : p.isComet ? '#ffcc00' : p.tier > 1 ? '#00ffaa' : '#0055ff';
         this.ctx.fillStyle = color;
         this.ctx.fill();
         this.ctx.shadowBlur = p.tier > 1 ? 20 : 10;
         this.ctx.shadowColor = color;
         
         this.ctx.fillStyle = '#ffffff';
         this.ctx.beginPath();
         this.ctx.arc(0, 0, p.radius*0.4, 0, Math.PI*2);
         this.ctx.fill();
      } else {
         // Astral - pulsating multi-rings and eyes
         this.ctx.beginPath();
         const pulse = Math.abs(Math.sin(t * 10 + p.x));
         this.ctx.arc(p.x, p.y, p.radius + pulse * 2, 0, Math.PI * 2);
         const color = p.isAntimatter ? '#ff0000' : p.isVoidSpark ? '#ffffff' : p.isComet ? '#ff8800' : p.tier > 1 ? '#00ff88' : '#aa00ff';
         this.ctx.strokeStyle = color;
         this.ctx.shadowColor = color;
         this.ctx.shadowBlur = 20;
         this.ctx.lineWidth = 2;
         this.ctx.stroke();
         this.ctx.beginPath();
         this.ctx.arc(p.x, p.y, p.radius*0.6, 0, Math.PI * 2);
         this.ctx.fillStyle = color;
         this.ctx.fill();
      }

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

    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowColor = '#ffffff';
    this.ctx.shadowBlur = 15 + Math.sin(time * 2) * 5 + (this.state.upgrades.radiance * 5);
    
    if (currentDim === 0) {
        this.ctx.beginPath();
        this.ctx.arc(this.coreX, this.coreY, pulseRad, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(this.coreX, this.coreY, coreRadius * 0.4, 0, Math.PI * 2);
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fill();
    } else if (currentDim === 1) {
        // Twilight: Rotating double square
        this.ctx.translate(this.coreX, this.coreY);
        this.ctx.rotate(time);
        this.ctx.beginPath();
        this.ctx.rect(-pulseRad, -pulseRad, pulseRad * 2, pulseRad * 2);
        this.ctx.fill();
        this.ctx.rotate(Math.PI / 4 + time*2);
        this.ctx.beginPath();
        this.ctx.rect(-pulseRad, -pulseRad, pulseRad * 2, pulseRad * 2);
        this.ctx.fillStyle = '#110022';
        this.ctx.fill();
        this.ctx.translate(-this.coreX, -this.coreY); 
    } else if (currentDim === 2) {
        // Dawn: Diamond core
        this.ctx.translate(this.coreX, this.coreY);
        this.ctx.rotate(-time * 1.5);
        this.ctx.beginPath();
        this.ctx.moveTo(0, -pulseRad*1.5);
        this.ctx.lineTo(pulseRad*1.5, 0);
        this.ctx.lineTo(0, pulseRad*1.5);
        this.ctx.lineTo(-pulseRad*1.5, 0);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(0, 0, pulseRad*0.6, 0, Math.PI*2);
        this.ctx.fillStyle = '#0a2020';
        this.ctx.fill();
        this.ctx.translate(-this.coreX, -this.coreY);
    } else if (currentDim === 3) {
        // Ether: Multi-layered hexagon
        this.ctx.translate(this.coreX, this.coreY);
        this.ctx.rotate(time);
        const sides = 6;
        this.ctx.beginPath();
        for(let i=0; i<sides; i++){
            const ang = i * Math.PI * 2 / sides;
            const px = Math.cos(ang) * pulseRad * 1.2;
            const py = Math.sin(ang) * pulseRad * 1.2;
            if(i===0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.fillStyle = '#002244';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, pulseRad*0.5, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.translate(-this.coreX, -this.coreY);
    } else {
         // Astral: An eye shape
        this.ctx.translate(this.coreX, this.coreY);
        this.ctx.beginPath();
        this.ctx.moveTo(-pulseRad*2, 0);
        this.ctx.quadraticCurveTo(0, -pulseRad*2, pulseRad*2, 0);
        this.ctx.quadraticCurveTo(0, pulseRad*2, -pulseRad*2, 0);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#ff0055';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, pulseRad*0.8, 0, Math.PI*2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, pulseRad*0.2, pulseRad*0.6, time, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.translate(-this.coreX, -this.coreY);
    }
    
    this.ctx.restore();

    // Draw Event Horizon and Orbitals
    if (this.singularityCharge > 0) {
       this.ctx.save();
       this.ctx.beginPath();
       this.ctx.arc(this.coreX, this.coreY, coreRadius + this.singularityCharge, 0, Math.PI * 2);
       this.ctx.strokeStyle = `rgba(150, 100, 255, ${Math.min(1, this.singularityCharge/50)})`;
       this.ctx.lineWidth = 2;
       this.ctx.setLineDash([5, 10]);
       this.ctx.lineDashOffset = -(Date.now()/100) * 5;
       this.ctx.stroke();
       this.ctx.restore();
       
       // Draw Orbital Count Label
       if (this.orbitingParticles.length > 0) {
           this.ctx.save();
           this.ctx.fillStyle = `rgba(200, 150, 255, 0.9)`;
           this.ctx.font = '700 14px "JetBrains Mono", monospace';
           this.ctx.textAlign = 'center';
           const count = this.orbitingParticles.length;
           const mult = 1 + (count * 0.1) * (1 + this.state.upgrades.tachyonWeb * 0.2);
           this.ctx.fillText(`${count} Орбита (x${mult.toFixed(1)})`, this.coreX, this.coreY - coreRadius - this.singularityCharge - 20);
           this.ctx.restore();
       }
    }
    
    this.ctx.restore(); // Restore shake translation and global save
  }
}
