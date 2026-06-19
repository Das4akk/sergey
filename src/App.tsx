import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, GameState } from './lib/GameEngine';
import { audio } from './lib/AudioEngine';
import { VoidHUD } from './components/VoidHUD';
import { GalaxyMap } from './components/GalaxyMap';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  
  const [gameState, setGameState] = useState<GameState>({
    level: 1, mass: 0, totalMass: 0, maxMass: 50, dimension: 0, echoes: 0, stardust: 0, achievements: [],
    upgrades: { gravityPower: 1, spawnRate: 1, passivePull: 0, multiplier: 1, orbitals: 0, entanglement: 0, fractal: 0, radiance: 0, chronosphere: 0, quasar: 0, singularityDepth: 0, stellarForge: 0, voidMonolith: 0, tachyonWeb: 0, darkMatterSiphon: 0, eventHorizon: 0, nebulaCollector: 0, starWeaver: 0, cosmicResonance: 0, pulsarBurst: 0, voidwalker: 0, astralProjection: 0, quantunTunnelling: 0, entropyWeaver: 0 }
  });
  
  const [thought, setThought] = useState<string | null>("Прими сингулярность.\nЛевая кнопка — поглощение.\nПравая кнопка — отталкивание.\nКлик — жатва.");
  const [started, setStarted] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isRepulsing, setIsRepulsing] = useState(false);

  const [recentAchievement, setRecentAchievement] = useState<{id: string, name: string} | null>(null);

  const achievementNames: Record<string, string> = {
    'singularity': 'Сингулярность - Поглощено 1000 массы разом',
    'eclipse': 'Первое затмение - Достигнуто Сумеречное измерение',
    'chronos': 'Осколки времени - Освоена Хроносфера',
    'echoes': 'Эхо былого - Накоплено 50 Эха Пустоты',
    'supernova': 'Сверхновая - Постигнута Глубина Сингулярности',
    'first_blood': 'Первые шаги - Набрана 50 общей массы',
    'apprentice': 'Ученик Пустоты - Достигнут 5 уровень',
    'adept': 'Адепт Вечности - Достигнут 10 уровень',
    'master': 'Магистр Гравитации - Достигнут 20 уровень',
    'grandmaster': 'Грандмастер - Достигнут 30 уровень',
    'god_of_gravity': 'Бог Гравитации - Достигнут 50 уровень',
    'black_hole': 'Черная дыра - 10,000 общей массы',
    'supermassive': 'Сверхмассивная - 1,000,000 общей массы',
    'galactic_core': 'Галактическое ядро - 100,000,000 общей массы',
    'singularity_novice': 'Горизонт - Сингулярность заряд 10',
    'singularity_master': 'Притяжение - Сингулярность заряд 50',
    'singularity_god': 'Коллапс - Сингулярность заряд 100',
    'singularity_breaker': 'Разрыв Пространства - Сингулярность заряд 200',
    'dimension_void': 'Слой первый - Погружение в Сумерки',
    'dimension_twilight': 'Слой второй - Рассвет Вселенной',
    'dimension_dawn': 'Слой третий - Эфирные потоки',
    'dimension_ether': 'Слой четвёртый - Астральный холод',
    'dimension_astral': 'Слой пятый - За пределами восприятия',
    'stardust_collector': 'Собиратель пыли - 50 Звездной пыли',
    'stardust_hoarder': 'Драгоценность космоса - 500 Звездной пыли',
    'echo_whisperer': 'Шепот прошлого - 500 Эха Пустоты',
    'rebirth': 'Перерождение - Первый престиж ядра',
    'dark_matter_initiate': 'Теневая материя - Изучена Темная Материя',
    'event_horizon_reached': 'Горизонт Событий - Изучено уничтожение',
    'star_weaver_born': 'Ткач Звезд - Изучена конвертация',
    'pulsar_unlocked': 'Пульсар - Открыты ударные волны',
    'voidwalker_step': 'Шаг Пустоты - Открыто ускорение',
    
    // New 25 Achievements
    'level_2': 'Первая искаженность - 2 уровень',
    'level_15': 'Аспект гравитации - 15 уровень',
    'level_40': 'Пожиратель систем - 40 уровень',
    'level_75': 'Пространственная аномалия - 75 уровень',
    'level_100': 'Космический Архитектор - 100 уровень',
    
    'mass_10': 'Крошечная пылинка - 10 общей массы',
    'mass_500': 'Сгусток материи - 500 общей массы',
    'mass_1b': 'Квазар - 1,000,000,000 общей массы',
    
    'echo_10k': 'Гармония эха - 10,000 Эха Пустоты',
    'echo_1m': 'Слияние времен - 1,000,000 Эха Пустоты',
    
    'stardust_10k': 'Звёздная река - 10,000 Звездной пыли',
    'stardust_1m': 'Галактическая туманность - 1,000,000 Звездной пыли',
    
    'prestige_5': 'Колесо Самсары - 5 Перерождений',
    'prestige_10': 'Вечный двигатель - 10 Перерождений',
    'prestige_25': 'Бесконечный цикл - 25 Перерождений',
    
    'gravity_50': 'Неотвратимость - Гравитация ур. 50',
    'entropy_50': 'Хаос частиц - Энтропия ур. 50',
    'multiplier_100': 'Математическая сингулярность - Суперпозиция ур. 100',
    'orbitals_10': 'Солнечная система - Спутники ур. 10',
    'fractal_10': 'Лента Мёбиуса - Фрактал ур. 10',
    'pulsar_10': 'Ритм Пустоты - Пульсар ур. 10',
    'voidwalker_25': 'Странник измерения - Шагун ур. 25',
    'dark_matter_20': 'Бездна смотрит в тебя - Темная Материя ур. 20',
    'stellar_forge_10': 'Творец миров - Звездная Кузня ур. 10',
    'monolith_max': 'Идеальная симметрия - Монолит ур. 10'
  };

  const handleAchievement = useCallback((id: string) => {
    audio.playAchievement();
    setRecentAchievement({id, name: achievementNames[id] || id});
    setTimeout(() => setRecentAchievement(null), 5000);
  }, []);

  const fetchVoidThought = useCallback(async (level: number, mass: number) => {
    try {
       const res = await fetch('/api/void-thought', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ level, mass })
       });
       if (res.ok) {
         const data = await res.json();
         setThought(data.thought);
       }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.isPaused = (showShop || thought !== null || showAnalysis);
    }
  }, [showShop, thought, showAnalysis]);

  const handleStateChange = useCallback((newState: GameState, leveledUp: boolean) => {
    setGameState(prev => {
      if (prev.dimension !== newState.dimension) {
        audio.setWorld(newState.dimension);
      }
      return newState;
    });
    
    if (leveledUp) {
      audio.playLevelUp();
      if (newState.level % 2 === 0) {
         fetchVoidThought(newState.level, newState.totalMass);
      }
    }
  }, [fetchVoidThought]);

  const handleAbsorb = useCallback((tier: number) => {
    audio.playAbsorb(tier);
  }, []);

  const initGame = async () => {
    await audio.init();
    setStarted(true);
    
    // Clear initial thought after a few seconds
    setTimeout(() => {
      setThought(null);
    }, 6000);
  };

  useEffect(() => {
    if (!canvasRef.current || !started) return;

    engineRef.current = new GameEngine(canvasRef.current, handleStateChange, handleAbsorb, handleAchievement);
    // Sync initial state from engine's load()
    setGameState(engineRef.current.state);
    audio.setWorld(engineRef.current.state.dimension);
    
    engineRef.current.start();

    const handleResize = () => engineRef.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      engineRef.current?.stop();
      window.removeEventListener('resize', handleResize);
    };
  }, [started, handleStateChange, handleAbsorb]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (engineRef.current) engineRef.current.wakeUp();
    if (e.button === 2) {
      if (engineRef.current) {
         engineRef.current.isRepulsing = true;
         setIsRepulsing(true);
         audio.playRepulse();
         
         if (engineRef.current.state.upgrades.pulsarBurst > 0 && Math.random() < engineRef.current.state.upgrades.pulsarBurst * 0.1) {
            engineRef.current.triggerPulsarBurst();
         }
      }
    } else {
      if (engineRef.current) engineRef.current.isPulling = true;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (engineRef.current) engineRef.current.wakeUp();
    if (e.button === 2 || isRepulsing) {
      if (engineRef.current) engineRef.current.isRepulsing = false;
      setIsRepulsing(false);
    } else {
      if (engineRef.current) engineRef.current.isPulling = false;
    }
  };

  // Mobile manual repulse bindings
  const manualRepulseStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (engineRef.current) {
      engineRef.current.wakeUp();
      engineRef.current.isRepulsing = true;
      setIsRepulsing(true);
      audio.playRepulse();
    }
  };

  const manualRepulseEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (engineRef.current) {
      engineRef.current.wakeUp();
      engineRef.current.isRepulsing = false;
      setIsRepulsing(false);
    }
  };

  const triggerMobileBurst = (e: React.MouseEvent) => {
    e.preventDefault();
    if (engineRef.current) {
      engineRef.current.wakeUp();
      engineRef.current.triggerPulsarBurst();
    }
  };

  const [pulseRate, setPulseRate] = useState(1);
  const clickTimes = useRef<number[]>([]);
  const lastClickTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!started) return;
    const interval = setInterval(() => {
      const now = Date.now();
      // Remove clicks older than 3 seconds
      clickTimes.current = clickTimes.current.filter(t => now - t < 3000);
      
      const rate = 1 + (clickTimes.current.length * 0.2);
      setPulseRate(rate);

      if (now - lastClickTimeRef.current > 15000) {
        // Idle for 15 seconds, play ambient note
        audio.playAmbientHint();
        lastClickTimeRef.current = now; // reset to avoid spamming
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [started]);

  const recordClick = () => {
      const now = Date.now();
      clickTimes.current.push(now);
      lastClickTimeRef.current = now;
  };

  const handleClick = (e: React.MouseEvent) => {
      recordClick();
      if (engineRef.current && canvasRef.current) {
          engineRef.current.wakeUp();
          const rect = canvasRef.current.getBoundingClientRect();
          engineRef.current.handleCanvasClick(e.clientX - rect.left, e.clientY - rect.top);
          audio.playManualHarvest((e.clientX / window.innerWidth) * 2 - 1);
      }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
     e.preventDefault();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
     if(e.code === 'Space' && engineRef.current) {
         engineRef.current.wakeUp();
         engineRef.current.triggerSupernova();
         audio.playSupernova();
     }
  };

  useEffect(() => {
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (engineRef.current && canvasRef.current) {
      engineRef.current.wakeUp();
      const rect = canvasRef.current.getBoundingClientRect();
      // Handle pointer coords within canvas
      engineRef.current.mouseX = e.clientX - rect.left;
      engineRef.current.mouseY = e.clientY - rect.top;
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[#050505] overflow-hidden selection:bg-gray-800 touch-none">
      
      {!started && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#050505]">
          <div className="flex flex-col items-center gap-12 max-w-sm text-center">
            <h1 className="font-sans text-5xl font-light text-white tracking-widest uppercase">ОМНИЯ</h1>
            <p className="font-mono text-sm text-gray-500 leading-relaxed">
              Поглощайте фрагменты, чтобы расти.<br/>
              Медитация на бесконечность и гравитацию.
            </p>
            <button 
              onClick={initGame}
              className="px-8 py-4 border border-gray-700 rounded-full text-white font-mono text-sm uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all duration-500 ease-out"
            >
              Войти в Пустоту
            </button>
          </div>
        </div>
      )}

      {started && (
        <>
          <div className="absolute top-0 left-0 w-full h-1 z-20 bg-gray-900/50">
            <div 
              className="h-full bg-gradient-to-r from-gray-500 via-white to-gray-500 transition-all duration-1000 ease-out"
              style={{ width: `${((gameState.level % 5) / 5) * 100}%` }}
            />
          </div>

          <AnimatePresence>
             {recentAchievement && (
                <motion.div 
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 16 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center gap-3 shadow-2xl"
                >
                  <div className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
                  <span className="font-sans text-sm tracking-wide text-white font-medium">Достижение разблокировано:</span>
                  <span className="font-mono text-xs text-yellow-100">{recentAchievement.name}</span>
                </motion.div>
             )}
          </AnimatePresence>

          <canvas
            ref={canvasRef}
            className={`absolute inset-0 cursor-crosshair touch-none transition-all duration-300 ${isRepulsing ? 'contrast-150 saturate-200 hue-rotate-15 blur-[2px] scale-[1.02]' : ''}`}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerOut={handlePointerUp}
            onPointerMove={handlePointerMove}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
          />

          {/* Void Breathing (Дыхание Пустоты) */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 opacity-30">
            <motion.div
              animate={{
                 scale: [1, 1.2 + pulseRate * 0.15, 1],
                 opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                 duration: 4 / pulseRate,
                 repeat: Infinity,
                 ease: "easeInOut"
              }}
              className="w-[40vh] h-[40vh] rounded-full border border-white/20 shadow-[0_0_100px_rgba(255,255,255,0.1)_inset]"
            />
          </div>
          
          {/* Mobile Controls */}
          <div className="md:hidden absolute bottom-24 left-4 right-4 flex justify-between z-40 pointer-events-none">
            <button 
              className="pointer-events-auto bg-white/5 border border-white/20 backdrop-blur-md px-6 py-4 rounded-3xl font-mono text-xs uppercase tracking-widest text-gray-300 active:bg-white/20"
              onTouchStart={manualRepulseStart}
              onMouseDown={manualRepulseStart}
              onTouchEnd={manualRepulseEnd}
              onMouseUp={manualRepulseEnd}
              onPointerOut={manualRepulseEnd}
              onContextMenu={e => e.preventDefault()}
            >
              Отток
            </button>
            <button 
              className="pointer-events-auto bg-indigo-500/10 border border-indigo-500/30 backdrop-blur-md px-6 py-4 rounded-3xl font-mono text-xs uppercase tracking-widest text-indigo-300 active:bg-indigo-500/30"
              onClick={triggerMobileBurst}
              onContextMenu={e => e.preventDefault()}
            >
              Пульсар
            </button>
          </div>

          {/* Galaxy Map Trigger */}
          <button 
            className="absolute top-6 right-6 z-40 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 backdrop-blur-md rounded-full font-mono text-[10px] tracking-widest uppercase text-indigo-300 transition-colors"
            onClick={() => setShowAnalysis(true)}
          >
            Галактическая Карта
          </button>
          
          {/* Galaxy Map Modal */}
          <AnimatePresence>
            {showAnalysis && (
              <GalaxyMap 
                 state={gameState} 
                 onClose={() => setShowAnalysis(false)} 
                 onJump={(id) => {
                     if (engineRef.current) {
                         engineRef.current.jumpToPlanet(id);
                         engineRef.current.flashTimer = 2.0;
                         audio.playSupernova(); // We can reuse supernova sound
                         setShowAnalysis(false);
                     }
                 }}
                 onUnlock={(id, cost) => {
                     if (engineRef.current && engineRef.current.state.maxMass >= cost) {
                         engineRef.current.state.unlockedPlanets.push(id);
                         engineRef.current.save();
                         engineRef.current.onStateChange({ ...engineRef.current.state }, false);
                         audio.playPrestige();
                     }
                 }}
                 onBuyOmniUpgrade={(key, cost) => engineRef.current?.buyOmniUpgrade(key, cost)}
              />
            )}
          </AnimatePresence>
          
          {/* Pulse Companion */}
          <div className="absolute bottom-6 right-6 z-30 pointer-events-none flex items-center justify-center">
             <motion.div
                animate={{
                   scale: [1, 1.1 + pulseRate * 0.1, 1],
                   opacity: [0.5, 0.8, 0.5],
                   rotate: gameState.totalMass > 100000 ? [0, 90, 180] : gameState.totalMass > 10000 ? [45, 45, 45] : 0,
                   borderRadius: gameState.totalMass > 100000 ? ["10%", "50%", "10%"] : gameState.totalMass > 10000 ? "15%" : "50%",
                   boxShadow: [
                      `0 0 ${10 * pulseRate}px rgba(200,200,255,0.2)`,
                      `0 0 ${20 * pulseRate}px rgba(200,200,255,0.6)`,
                      `0 0 ${10 * pulseRate}px rgba(200,200,255,0.2)`
                   ]
                }}
                transition={{
                   duration: 2 / pulseRate,
                   repeat: Infinity,
                   ease: "easeInOut"
                }}
                className={`w-12 h-12 bg-indigo-200/20 backdrop-blur-sm border flex items-center justify-center ${gameState.totalMass > 100000 ? 'border-purple-400' : gameState.totalMass > 10000 ? 'border-orange-200/80' : 'border-indigo-200/50'}`}
             >
                <div className={`w-4 h-4 bg-white/70 ${gameState.totalMass > 10000 ? 'rounded-sm' : 'rounded-full'}`} />
             </motion.div>
             <span className="absolute -top-6 whitespace-nowrap font-mono text-[10px] text-indigo-300/50 uppercase tracking-widest hidden md:block">
               Пульс: {pulseRate.toFixed(1)}x
             </span>
          </div>

          <VoidHUD 
            state={gameState} 
            thought={thought}
            showShop={showShop}
            setShowShop={setShowShop}
            setThought={setThought}
            onPrestige={() => {
              audio.playPrestige();
              engineRef.current?.prestige();
            }}
            onBuyUpgrade={(key, cost, count) => engineRef.current?.buyUpgrade(key, cost, count)} 
          />
        </>
      )}
    </div>
  );
}
