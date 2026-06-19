export interface PlanetSave {
  level: number;
  mass: number;
  totalMass: number;
  maxMass: number;
  dimension: number;
  stardust: number;
  prestigeCount: number;
  upgrades: any;
}

export interface GameState {
  planetProgress?: Record<string, PlanetSave>;
  level: number;
  mass: number;
  totalMass: number;
  maxMass: number;
  dimension: number;
  echoes: number;
  stardust: number;
  prestigeCount: number;
  achievements: string[];
  massHistory?: { t: number, m: number }[];
  omniMatter: number;
  currentPlanet: string;
  unlockedPlanets: string[];
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
    m_momentum: number;
    m_hydrodynamics: number;
    m_metabolism: number;
    m_photosynthesis: number;
    m_chemosynthesis: number;
    m_osmosis: number;
    m_parasitism: number;
    m_filter_feeding: number;
    m_adaptation: number;
    m_regeneration: number;
    m_cell_division: number;
    m_symbiosis: number;
    m_echolocation: number;
    m_predator: number;
    m_apex_predator: number;
    m_camouflage: number;
    m_electric_discharge: number;
    m_hardened_shell: number;
    m_extremophile: number;
    m_void_adaptation: number;
    m_stellar_wind: number;
    m_nebular_nursery: number;
    m_cosmic_web: number;
    m_bioluminescence: number;
    m_spawning_pool: number;
    m_neural_network: number;
    m_hive_mind: number;
    m_mitosis: number;
    m_elasticity: number;
    m_transcendence: number;
    o_omniYield: number;
    o_omniPull: number;
    o_omniEcho: number;
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
    prestigeCount: 0,
    omniMatter: 0,
    currentPlanet: 'abyss',
    unlockedPlanets: ['abyss'],
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
      m_momentum: 0,
      m_hydrodynamics: 0,
      m_metabolism: 0,
      m_photosynthesis: 0,
      m_chemosynthesis: 0,
      m_osmosis: 0,
      m_parasitism: 0,
      m_filter_feeding: 0,
      m_adaptation: 0,
      m_regeneration: 0,
      m_cell_division: 0,
      m_symbiosis: 0,
      m_echolocation: 0,
      m_predator: 0,
      m_apex_predator: 0,
      m_camouflage: 0,
      m_electric_discharge: 0,
      m_hardened_shell: 0,
      m_extremophile: 0,
      m_void_adaptation: 0,
      m_stellar_wind: 0,
      m_nebular_nursery: 0,
      m_cosmic_web: 0,
      m_bioluminescence: 0,
      m_spawning_pool: 0,
      m_neural_network: 0,
      m_hive_mind: 0,
      m_mitosis: 0,
      m_elasticity: 0,
      m_transcendence: 0,
      o_omniYield: 0,
      o_omniPull: 0,
      o_omniEcho: 0,
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

  public anomalyTimer: number = 300; // Trigger anomaly every 5 minutes (300s)
  public activeAnomaly: { type: 'heavy' | 'zero' | 'repulse', duration: number } | null = null;
  
  public voidSleepTimer: number = 0;
  public inVoidSleep: boolean = false;

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
      if (this.state.planetProgress) this.state.planetProgress[this.state.currentPlanet] = this.getPlanetSave();
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
          unlockedPlanets: parsed.unlockedPlanets || ['abyss'],
          stardust: parsed.stardust || 0,
          planetProgress: parsed.planetProgress || {},
          upgrades: { ...this.state.upgrades, ...(parsed.upgrades || {}) }
        };
        if (!this.state.planetProgress) this.state.planetProgress = {};
        if (!this.state.planetProgress['abyss']) {
           this.state.planetProgress['abyss'] = this.getPlanetSave();
        }
      }
    } catch (e) {}
  }

  private getPlanetSave(): PlanetSave {
      const upg = { ...this.state.upgrades } as any;
      const globals = ['singularityDepth', 'stellarForge', 'voidMonolith', 'tachyonWeb', 'quantunTunnelling', 'entropyWeaver', 'o_omniYield', 'o_omniPull', 'o_omniEcho'];
      for (let g of globals) {
          delete upg[g];
      }
      return {
          level: this.state.level,
          mass: this.state.mass,
          totalMass: this.state.totalMass,
          maxMass: this.state.maxMass,
          dimension: this.state.dimension,
          stardust: this.state.stardust,
          prestigeCount: this.state.prestigeCount || 0,
          upgrades: upg
      };
  }

  public jumpToPlanet(planetId: string) {
      if (!this.state.planetProgress) this.state.planetProgress = {};
      this.state.planetProgress[this.state.currentPlanet] = this.getPlanetSave();
      
      this.state.currentPlanet = planetId;
      const data = this.state.planetProgress[planetId];
      
      const globalUpg = {
          singularityDepth: this.state.upgrades.singularityDepth,
          stellarForge: this.state.upgrades.stellarForge,
          voidMonolith: this.state.upgrades.voidMonolith,
          tachyonWeb: this.state.upgrades.tachyonWeb,
          quantunTunnelling: this.state.upgrades.quantunTunnelling,
          entropyWeaver: this.state.upgrades.entropyWeaver,
          o_omniYield: this.state.upgrades.o_omniYield,
          o_omniPull: this.state.upgrades.o_omniPull,
          o_omniEcho: this.state.upgrades.o_omniEcho,
      };

      if (data) {
          this.state.level = data.level;
          this.state.mass = data.mass;
          this.state.totalMass = data.totalMass;
          this.state.maxMass = data.maxMass;
          this.state.dimension = data.dimension;
          this.state.stardust = data.stardust;
          this.state.prestigeCount = data.prestigeCount || 0;
          this.state.upgrades = { ...data.upgrades, ...globalUpg } as any;
      } else {
          this.state.level = 1;
          this.state.mass = 0;
          this.state.totalMass = 0;
          this.state.maxMass = 50;
          this.state.dimension = 0;
          this.state.stardust = 0;
          this.state.prestigeCount = 0;
          this.state.upgrades = {
              gravityPower: 1, spawnRate: 1, passivePull: 0, multiplier: 1, orbitals: 0,
              entanglement: 0, fractal: 0, radiance: 0, chronosphere: 0, quasar: 0,
              darkMatterSiphon: 0, eventHorizon: 0, nebulaCollector: 0, starWeaver: 0,
              cosmicResonance: 0, pulsarBurst: 0, voidwalker: 0, astralProjection: 0,
              m_momentum: 0, m_hydrodynamics: 0, m_metabolism: 0, m_photosynthesis: 0,
              m_chemosynthesis: 0, m_osmosis: 0, m_parasitism: 0, m_filter_feeding: 0,
              m_adaptation: 0, m_regeneration: 0, m_cell_division: 0, m_symbiosis: 0,
              m_echolocation: 0, m_predator: 0, m_apex_predator: 0, m_camouflage: 0,
              m_electric_discharge: 0, m_hardened_shell: 0, m_extremophile: 0, m_void_adaptation: 0,
              m_stellar_wind: 0, m_nebular_nursery: 0, m_cosmic_web: 0, m_bioluminescence: 0,
              m_spawning_pool: 0, m_neural_network: 0, m_hive_mind: 0, m_mitosis: 0,
              m_elasticity: 0, m_transcendence: 0,
              ...globalUpg
          } as any;
      }

      this.particles = [];
      this.orbitingParticles = [];
      this.singularityCharge = 0;
      this.save();
      this.onStateChange({ ...this.state }, false);
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

  public buyUpgrade(key: keyof GameState['upgrades'], cost: number, count: number = 1) {
    const echoUpgrades = ['singularityDepth', 'stellarForge', 'voidMonolith', 'tachyonWeb', 'quantunTunnelling', 'entropyWeaver'];
    const stardustUpgrades = ['darkMatterSiphon', 'eventHorizon', 'nebulaCollector', 'starWeaver', 'cosmicResonance', 'pulsarBurst', 'voidwalker', 'astralProjection'];
    const isEcho = echoUpgrades.includes(key);
    const isStardust = stardustUpgrades.includes(key);

    if (isEcho) {
      if (this.state.echoes >= cost) {
        this.state.echoes -= cost;
        this.state.upgrades[key] += count;
        this.save();
        this.onStateChange({ ...this.state }, false);
        return true;
      }
    } else if (isStardust) {
      if (this.state.stardust >= cost) {
        this.state.stardust -= cost;
        this.state.upgrades[key] += count;
        this.save();
        this.onStateChange({ ...this.state }, false);
        return true;
      }
    } else {
      if (this.state.mass >= cost) {
        this.state.mass -= cost;
        this.state.upgrades[key] += count;
        this.save();
        this.onStateChange({ ...this.state }, false);
        return true;
      }
    }
    return false;
  }

  public buyOmniUpgrade(key: string, cost: number) {
    if (this.state.omniMatter >= cost) {
       this.state.omniMatter -= cost;
       (this.state.upgrades as any)[key] = ((this.state.upgrades as any)[key] || 0) + 1;
       this.save();
       this.onStateChange({ ...this.state }, false);
       return true;
    }
    return false;
  }

    public prestige() {
     const reqLevel = 5 + (this.state.prestigeCount || 0) * 10;
     if (this.state.level < reqLevel) return;
     const gainedEchoes = Math.max(0, Math.floor(this.state.level * 1.5) + Math.floor(this.state.totalMass / 10000));
     const entropyMultiplier = 1 + (this.state.upgrades.entropyWeaver * 0.1);
     const omniBuff = 1 + (this.state.upgrades.o_omniEcho * 2.0);
     let totalEchoes = Math.floor(gainedEchoes * entropyMultiplier * omniBuff);
     if (this.state.currentPlanet === 'blackhole') totalEchoes *= 500;
     
     this.state.echoes += totalEchoes;
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
     this.state.upgrades.astralProjection = 0;
     
     const mutations = ['m_momentum', 'm_hydrodynamics', 'm_metabolism', 'm_photosynthesis', 'm_chemosynthesis', 'm_osmosis', 'm_parasitism', 'm_filter_feeding', 'm_adaptation', 'm_regeneration', 'm_cell_division', 'm_symbiosis', 'm_echolocation', 'm_predator', 'm_apex_predator', 'm_camouflage', 'm_electric_discharge', 'm_hardened_shell', 'm_extremophile', 'm_void_adaptation', 'm_stellar_wind', 'm_nebular_nursery', 'm_cosmic_web', 'm_bioluminescence', 'm_spawning_pool', 'm_neural_network', 'm_hive_mind', 'm_mitosis', 'm_elasticity', 'm_transcendence'];
     for(let m of mutations) {
         (this.state.upgrades as any)[m] = 0;
     }
     
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
              const maxCombo = this.state.currentPlanet === 'pulsar' ? 1000 : 10 + (this.state.upgrades.voidMonolith * 10);
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

  public wakeUp() {
    this.voidSleepTimer = 0;
    this.inVoidSleep = false;
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

  private historyTimer: number = 0;

  private update(dt: number) {
    this.dtAccumulator += dt;
    this.orbitalAngle += dt * 2; // Rotate orbitals

    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.shakeTimer > 0) this.shakeTimer -= dt;
    
    // History logging (every 1 second)
    this.historyTimer += dt;
    if (this.historyTimer >= 1.0) {
        this.historyTimer = 0;
        
        // Passive OmniMatter generation from conquered planets
        const omniPerSec = (this.state.unlockedPlanets.length - 1) * 10; // First is abyss, so -1
        if (omniPerSec > 0) {
            if (!this.state.omniMatter) this.state.omniMatter = 0;
            this.state.omniMatter += omniPerSec * (this.state.currentPlanet === 'abyss' ? 100 : 1);
        }
    }
    
    // Void sleep logic
    this.voidSleepTimer += dt;
    if (this.voidSleepTimer > 60) {
        this.inVoidSleep = true;
        // passive resource generation in sleep
        if (Math.random() < 0.1 * dt) {
            this.state.stardust += 1;
        }
        if (Math.random() < 0.01 * dt) {
            this.state.echoes += 1;
        }
    }
    
    // Temporal anomalies
    if (this.activeAnomaly) {
        this.activeAnomaly.duration -= dt;
        if (this.activeAnomaly.duration <= 0) {
            this.activeAnomaly = null;
        }
    } else {
        this.anomalyTimer -= dt;
        if (this.anomalyTimer <= 0) {
            // Trigger new anomaly
            this.anomalyTimer = 300 + Math.random() * 300; // 5 to 10 minutes
            const types: ('heavy'|'zero'|'repulse')[] = ['heavy', 'zero', 'repulse'];
            this.activeAnomaly = {
                type: types[Math.floor(Math.random() * types.length)],
                duration: 30 // lasts 30 seconds
            };
            this.flashTimer = 1.0;
        }
    }

    // Smooth swimming mechanism
    const dxT = this.mouseX - this.coreX;
    const dyT = this.mouseY - this.coreY;
    const distT = Math.hypot(dxT, dyT);
    
    // Base speed
    let speed = 80 + (this.state.upgrades.m_momentum * 15);
    
    if (this.isPulling && this.state.mass > 5) {
        // Boost
        let boostCost = Math.max(1, 10 - this.state.upgrades.m_metabolism);
        this.state.mass -= boostCost * dt;
        speed *= (2 + this.state.upgrades.m_hydrodynamics * 0.5);
        this.flashTimer = Math.max(this.flashTimer, 0.05);
    }
    
    if (distT > 1) {
        // We move towards mouse
        const moveDist = speed * dt;
        // Limit to not overshoot
        const actualMove = Math.min(moveDist, distT);
        this.coreX += (dxT / distT) * actualMove;
        this.coreY += (dyT / distT) * actualMove;
    }

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
    if (this.state.upgrades.m_photosynthesis > 0) {
        this.addMass((this.state.upgrades.m_photosynthesis * 0.1) * dt);
    }

    let absorbedCount = 0;
    const coreRadius = 8 + Math.log10(this.state.totalMass + 1) * 2 + (this.state.upgrades.radiance * 2);
    
    // Passive pull expanded heavily by m_osmosis
    const pullSt = 20 * this.state.upgrades.passivePull + (this.state.upgrades.m_osmosis * 30);
    const repulseSt = this.isRepulsing ? 300 + (this.state.upgrades.m_stellar_wind * 100) : 0;
    
    const osmoticRadius = coreRadius * (1 + this.state.upgrades.m_osmosis * 0.2);

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
      let actualPullSt = pullSt * (1 + this.state.upgrades.o_omniPull * 0.5);
      let actualRepulseSt = repulseSt;
      
      if (this.state.currentPlanet === 'blackhole') {
          actualPullSt *= 50; // Extreme base gravity (Imbalance boost)
      } else if (this.state.currentPlanet === 'nebula') {
          actualPullSt *= 0.5; // Low gravity
      }
      
      if (this.activeAnomaly) {
          if (this.activeAnomaly.type === 'heavy') {
              actualPullSt *= 5; // extremely strong gravity
          } else if (this.activeAnomaly.type === 'zero') {
              actualPullSt = 0; // zero gravity
          } else if (this.activeAnomaly.type === 'repulse') {
              actualRepulseSt = Math.max(actualRepulseSt, 200); // everything pushes away
              actualPullSt = 0;
          }
      }

      if (actualPullSt > 0 && !this.isRepulsing) {
        const pullRadius = 300 + (this.state.upgrades.gravityPower * 50);
        if (dist < pullRadius) {
           const force = actualPullSt / Math.max(10, dist);
           p.vx += (dx / dist) * force * dt * 50; 
           p.vy += (dy / dist) * force * dt * 50;
        }
      } else if (actualRepulseSt > 0) {
        const repulseRadius = 400;
        if (dist < repulseRadius) {
           const force = actualRepulseSt / Math.max(10, dist);
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
    
    // Pulsar mass drain
    if (this.state.currentPlanet === 'pulsar' && this.state.mass > 0) {
        this.state.mass -= dt * this.state.level * 2;
        if (this.state.mass < 0) this.state.mass = 0;
    }
  }

  private handleAbsorption(p: Particle): number {
      this.onAbsorb(p.tier);
      let yieldMass = p.tier * this.state.upgrades.multiplier;
      
      // Omni Yield
      yieldMass *= (1 + this.state.upgrades.o_omniYield * 1.5);
      
      if (this.state.currentPlanet === 'pulsar') {
          yieldMass *= 3; // Huge mass boost
      } else if (this.state.currentPlanet === 'nebula') {
          yieldMass *= 0.2; // Tiny mass base
      }
      
      const particleColor = p.isAntimatter ? '#ff3333' : p.isVoidSpark ? '#ccffff' : p.isComet ? '#ffaa44' : p.tier > 1 ? '#bbff00' : '#888888';
      this.fractures.push({x: p.x, y: p.y, life: 0.4, maxLife: 0.4, isSmall: true, color: particleColor});

      // Entanglement (chance to double)
      if (this.state.upgrades.entanglement > 0) {
          if (Math.random() < this.state.upgrades.entanglement * 0.05) {
             yieldMass *= 2;
          }
      }

      if (p.isAntimatter) {
          let bhMod = this.state.currentPlanet === 'blackhole' ? 3 : 1;
          if (this.state.upgrades.m_hardened_shell > 0 && Math.random() < (this.state.upgrades.m_hardened_shell * 0.05 / bhMod)) {
             // Block penalty
             this.shakeTimer = 0.1;
          } else if (this.state.upgrades.m_chemosynthesis > 0) {
             // Healing instead
             this.addMass((yieldMass * 2) * (1 + this.state.upgrades.m_chemosynthesis * 0.1));
             this.flashTimer = 0.2;
          } else {
             // Normal penalty
             let penaltyMult = 0.5 - (this.state.upgrades.m_adaptation * 0.05);
             if (this.state.currentPlanet === 'blackhole') penaltyMult = 0.1; // extreme punishment
             penaltyMult = Math.max(0.01, penaltyMult);
             this.state.mass = Math.floor(this.state.mass * penaltyMult);
             this.shakeTimer = 0.3;
             this.flashTimer = 0.2; // Red flash handled in draw
          }
          return 0;
      }
      
      if (this.isPulling && this.state.upgrades.m_apex_predator > 0) {
          yieldMass *= (1 + this.state.upgrades.m_apex_predator * 0.2);
      }

      // Fractal (large particles split into smaller ones)
      let splits = this.state.upgrades.fractal;
      if (this.state.currentPlanet === 'nebula') splits = (splits + 2) * 10;
      
      if (p.tier > 1 && splits > 0) {
          for(let i=0; i<splits; i++) {
              this.particles.push({
                 x: p.x, y: p.y,
                 vx: (Math.random()-0.5) * 100, vy: (Math.random()-0.5) * 100,
                 radius: 1.5, tier: 1, opacity: 1, history: []
              });
          }
      }
      
      // Stardust generation
      let stardustChance = p.isVoidSpark ? 1.0 : (0.01 + this.state.upgrades.nebulaCollector * 0.01);
      if (this.state.currentPlanet === 'nebula') stardustChance *= 100;
      
      if (Math.random() < stardustChance) {
          this.state.stardust += p.isVoidSpark ? (5 + Math.floor(Math.random() * 5)) : 1;
      }
      
      if (p.isVoidSpark) {
          this.state.echoes += 1 + this.state.upgrades.cosmicResonance * 1;
          if (this.state.dimension < 1) this.state.achievements.push('first_echo');
      }

      if (p.isComet) {
          this.state.stardust += (10 + this.state.upgrades.starWeaver * 2) * p.tier;
          if (this.state.dimension < 2) this.state.achievements.push('first_stardust');
      }
      
      yieldMass *= 1 + (this.state.upgrades.m_neural_network * 0.02);
      
      this.addMass(yieldMass);
      
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
    
    // Planet mechanics modifiers
    let isPulsar = this.state.currentPlanet === 'pulsar';
    let isNebula = this.state.currentPlanet === 'nebula';
    let isBlackHole = this.state.currentPlanet === 'blackhole';
    
    const tierRoll = Math.random();
    let tier = 1;

    const forgeLevel = this.state.upgrades.stellarForge;
    let tierOddsEpic = 0.1 + (forgeLevel * 0.05);
    let tierOddsLeg = 0.02 + (forgeLevel * 0.01);
    
    if (isPulsar) { tierOddsEpic *= 2; tierOddsLeg *= 2; }
    
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
       const isAm = Math.random() < (isBlackHole ? 0.6 : 0.2); // More antimatter in blackhole
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
    const currentDim = this.state.dimension % 10;
    
    // Super minimalistic fluid ambient backgrounds
    const grad = this.ctx.createRadialGradient(this.width/2, this.height/2, 0, this.width/2, this.height/2, this.width);
    if (currentDim === 0) {
        grad.addColorStop(0, '#0c111a'); grad.addColorStop(1, '#05070a');
    } else if (currentDim === 1) { 
        grad.addColorStop(0, '#1a0c16'); grad.addColorStop(1, '#080407');
    } else if (currentDim === 2) { 
        grad.addColorStop(0, '#0c1a16'); grad.addColorStop(1, '#040807');
    } else if (currentDim === 3) {
        grad.addColorStop(0, '#100c1a'); grad.addColorStop(1, '#050408');
    } else if (currentDim === 4) {
        grad.addColorStop(0, '#1a180c'); grad.addColorStop(1, '#080704');
    } else if (currentDim === 5) {
        grad.addColorStop(0, '#1a0c15'); grad.addColorStop(1, '#080406');
    } else if (currentDim === 6) {
        grad.addColorStop(0, '#0b1a18'); grad.addColorStop(1, '#040807');
    } else if (currentDim === 7) {
        grad.addColorStop(0, '#141a0b'); grad.addColorStop(1, '#060804');
    } else if (currentDim === 8) {
        grad.addColorStop(0, '#110b1a'); grad.addColorStop(1, '#060408');
    } else { 
        grad.addColorStop(0, '#1a0b0b'); grad.addColorStop(1, '#080404');
    }
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 3D Planets in the background for effect
    const numPlanets = 3 + (currentDim % 4);
    for (let i = 0; i < numPlanets; i++) {
        const seed = currentDim * 31 + i * 17;
        const px = this.width * (0.5 + Math.sin(seed) * 0.45);
        const py = this.height * (0.5 + Math.cos(seed * 1.3) * 0.45);
        const pr = 40 + Math.abs(Math.sin(seed * 2.1)) * 100;
        
        // Planet base gradient (3D sphere effect)
        const pGrad = this.ctx.createRadialGradient(px - pr*0.3, py - pr*0.3, 0, px, py, pr);
        const hue = Math.abs(Math.sin(seed)) * 360;
        pGrad.addColorStop(0, `hsla(${hue}, 40%, 30%, 0.4)`);
        pGrad.addColorStop(1, `hsla(${hue}, 40%, 5%, 0.1)`);
        
        this.ctx.beginPath();
        this.ctx.arc(px, py, pr, 0, Math.PI * 2);
        this.ctx.fillStyle = pGrad;
        this.ctx.fill();
        
        // Atmosphere glow
        this.ctx.lineWidth = pr * 0.05;
        this.ctx.strokeStyle = `hsla(${hue}, 50%, 40%, 0.1)`;
        this.ctx.stroke();

        // Planet rings
        if (i % 2 === 0) {
            this.ctx.save();
            this.ctx.translate(px, py);
            this.ctx.rotate(Math.sin(seed) * Math.PI);
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, pr * 1.8, pr * 0.4, 0, 0, Math.PI * 2);
            this.ctx.strokeStyle = `hsla(${hue + 40}, 30%, 30%, 0.2)`;
            this.ctx.lineWidth = pr * 0.1;
            this.ctx.stroke();
            this.ctx.restore();
        }
    }
    
    // Void sleep visuals
    if (this.inVoidSleep) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        const sleepGrad = this.ctx.createRadialGradient(this.width/2, this.height/2, 0, this.width/2, this.height/2, this.width);
        sleepGrad.addColorStop(0, `rgba(100, 100, 255, ${0.05 + Math.sin(t) * 0.02})`);
        sleepGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = sleepGrad;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = `rgba(150, 150, 255, ${0.5 + Math.sin(t*2)*0.3})`;
        this.ctx.font = '20px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText("Сон Пустоты...", this.width / 2, this.height / 2 + 100);
    }
    
    // Ambient dust (ambient motes, not harsh dots)
    this.ctx.fillStyle = 'rgba(200, 220, 255, 0.05)';
    for(let i=0; i<80; i++) {
        let sx = (i * 123 + t * 5) % this.width;
        let sy = (i * 321 + t * 3) % this.height;
        if (sx < 0) sx += this.width; if (sy < 0) sy += this.height;
        this.ctx.beginPath();
        this.ctx.arc(sx, sy, 1.5 + Math.sin(t+i)*1, 0, Math.PI*2);
        this.ctx.fill();
    }

    if (this.flashTimer > 0) {
       this.ctx.fillStyle = `rgba(255, 255, 255, ${this.flashTimer * 0.5})`;
       this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    if (this.activeAnomaly) {
        this.ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`АНОМАЛИЯ: ${this.activeAnomaly.type} [${Math.ceil(this.activeAnomaly.duration)}s]`, this.width / 2, 50);
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

      // Minimalist organic rings
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      
      let strokeColor, fillColor;
      if (p.isAntimatter) { 
         strokeColor = '#e63946'; fillColor = 'rgba(230, 57, 70, 0.1)';
      } else if (p.isVoidSpark) { 
         strokeColor = '#a8dadc'; fillColor = 'rgba(168, 218, 220, 0.3)';
      } else if (p.isComet) { 
         strokeColor = '#e9c46a'; fillColor = 'rgba(233, 196, 106, 0.15)';
      } else {
         const tval = Math.min(1, p.tier / 5);
         strokeColor = `hsla(${200 - tval*50}, 80%, 70%, ${(0.5 + tval*0.5)})`;
         fillColor = `hsla(${200 - tval*50}, 80%, 70%, 0.15)`;
      }

      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = 1.5;
      this.ctx.fillStyle = fillColor;

      // Pulse
      const pulse = Math.sin(t * 3 + p.x) * 1.5;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, Math.max(1, p.radius + pulse), 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Inner membrane
      if (p.tier > 1) {
         this.ctx.beginPath();
         this.ctx.arc(p.x, p.y, Math.max(1, p.radius * 0.4), 0, Math.PI * 2);
         this.ctx.fillStyle = strokeColor;
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
