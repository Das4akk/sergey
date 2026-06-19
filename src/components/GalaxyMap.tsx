import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState } from '../lib/GameEngine';
import { formatNum } from '../lib/utils';

interface GalaxyMapProps {
  state: GameState;
  onClose: () => void;
  onJump: (planetId: string) => void;
  onUnlock: (planetId: string, cost: number) => void;
  onBuyOmniUpgrade: (key: string, cost: number) => void;
}

const PLANETS = [
  { id: 'abyss', name: 'Бездна', cost: 0, x: 50, y: 50, desc: 'Изначальная сингулярность. [ИМБА: Генерация OMNI материи увеличена в 100 раз!]', color: '#6366f1', type: 'abyss' },
  { id: 'pulsar', name: 'Квазар-Пульсар', cost: 1000, x: 25, y: 65, desc: 'Масса сгорает. [ИМБА: Максимальное комбо = 1000, идеальная цепная реакция!]', color: '#ec4899', type: 'pulsar' },
  { id: 'nebula', name: 'Изумрудная Туманность', cost: 50000, x: 75, y: 35, desc: 'Низкая гравитация. [ИМБА: Звездная пыль падает в 100 раз чаще, а фракталы разлетаются на рои частиц!]', color: '#10b981', type: 'nebula' },
  { id: 'blackhole', name: 'Сверхмассивная', cost: 1000000, x: 65, y: 85, desc: 'Много антиматерии. [ИМБА: Гравитация x50, а награда Эха при Перерождении увеличена в 500 РАЗ!]', color: '#f59e0b', type: 'blackhole' },
];

export function GalaxyMap({ state, onClose, onJump, onUnlock, onBuyOmniUpgrade }: GalaxyMapProps) {
  const [selected, setSelected] = useState<typeof PLANETS[0] | null>(null);

  const formatCost = (c: number) => formatNum(c);

  const handleAction = (p: typeof PLANETS[0]) => {
     if (state.unlockedPlanets.includes(p.id)) {
        onJump(p.id);
     } else if (state.maxMass >= p.cost) {
        onUnlock(p.id, p.cost);
     }
  };

  const getOmniCost = (level: number) => Math.floor(10 * Math.pow(2.0, level || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020202]/90 backdrop-blur-md">
      <div className="bg-[#0a0a0a] border border-gray-800 rounded-3xl p-8 w-full max-w-7xl h-[90vh] shadow-2xl relative flex flex-col relative overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors z-30"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 z-10 w-full pr-12 gap-4">
           <div>
              <h2 className="text-xl font-sans font-light tracking-widest uppercase text-indigo-300 mb-1 md:mb-2 text-shadow-md">Звездная Карта</h2>
              <p className="font-mono text-[10px] md:text-xs text-gray-400">Путешествуйте между гранями реальности.</p>
           </div>
           <div className="md:text-right">
              <span className="font-mono text-lg md:text-xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                 {formatNum(state.omniMatter)} OMNI
              </span>
              <p className="font-mono text-[10px] md:text-xs text-gray-500">Генерация: {formatNum(((state.unlockedPlanets.length - 1)*10) * (state.currentPlanet === 'abyss' ? 100 : 1))} / сек</p>
           </div>
        </div>

        <div className="flex-1 w-full flex flex-col md:flex-row gap-4 h-full min-h-0">
          {/* Map Area */}
          <div className="flex-[2] bg-black/50 rounded-xl border border-gray-900 relative overflow-hidden flex flex-col">
              <div className="flex-1 overflow-auto relative touch-pan-x touch-pan-y no-scrollbar group" style={{ cursor: 'grab' }}>
                <div className="absolute min-w-[800px] min-h-[600px] w-full h-full">
                  {/* Background stars projection */}
                  <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#0a0a0a] to-black"></div>
                  
                  {PLANETS.map((p, i) => {
                      const isUnlocked = state.unlockedPlanets.includes(p.id);
                      const isCurrent = state.currentPlanet === p.id;
                      // Connect lines randomly for cool constellation effect
                      const nextP = PLANETS[(i + 1) % PLANETS.length];
                      
                      return (
                          <React.Fragment key={p.id}>
                            {isUnlocked && state.unlockedPlanets.includes(nextP.id) && (
                              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                                <line x1={`${p.x}%`} y1={`${p.y}%`} x2={`${nextP.x}%`} y2={`${nextP.y}%`} stroke={p.color} strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
                              </svg>
                            )}
                          <motion.div
                              initial={false}
                              animate={{
                                  scale: selected?.id === p.id ? 1.2 : 1,
                                  zIndex: selected?.id === p.id ? 10 : 1
                              }}
                              className="absolute flex flex-col items-center justify-center cursor-pointer group hover:z-20"
                              style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)' }}
                              onClick={() => setSelected(p)}
                          >
                              {/* 3D Planet representation */}
                              <div 
                                 className={`w-12 h-12 md:w-16 md:h-16 rounded-full relative transition-all duration-500 ${isCurrent ? 'animate-pulse' : 'group-hover:scale-110'}`}
                                 style={{
                                    background: `radial-gradient(circle at 30% 30%, ${p.color}, #000)`,
                                    boxShadow: isCurrent ? `0 0 40px ${p.color}` : isUnlocked ? `0 0 10px ${p.color}` : 'none',
                                    filter: isUnlocked ? 'none' : 'grayscale(100%) opacity(0.3)'
                                 }}
                              >
                                  {isCurrent && (
                                     <div className="absolute inset-0 rounded-full border border-white/50 animate-ping"></div>
                                  )}
                              </div>
                              <div className="mt-3 text-[10px] md:text-xs font-mono tracking-widest font-bold whitespace-nowrap bg-black/80 px-2 py-1 rounded backdrop-blur border border-white/10" style={{ color: isUnlocked ? p.color : '#666' }}>
                                  {p.name}
                              </div>
                          </motion.div>
                          </React.Fragment>
                      );
                  })}
                </div>
              </div>

              {/* Selected Panel inside Map */}
              <AnimatePresence>
                  {selected && (
                      <motion.div 
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: 20 }}
                         className="absolute bottom-2 left-2 right-2 md:bottom-4 md:left-4 md:right-4 bg-gray-950/95 backdrop-blur-md border border-gray-800 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-20 shadow-2xl"
                      >
                          <div className="max-w-xl">
                              <h3 className="text-lg md:text-xl font-sans mb-1 md:mb-2 drop-shadow-md" style={{ color: selected.color }}>{selected.name}</h3>
                              <p className="text-xs md:text-sm font-sans text-gray-300 leading-relaxed">{selected.desc}</p>
                          </div>
                          <div className="w-full md:w-auto shrink-0 flex justify-end">
                              {state.unlockedPlanets.includes(selected.id) ? (
                                  <button 
                                      className="w-full md:w-auto px-6 py-3 rounded-xl hover:scale-105 font-mono text-xs md:text-sm tracking-widest text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95"
                                      style={{ backgroundColor: selected.color }}
                                      onClick={() => handleAction(selected)}
                                      disabled={state.currentPlanet === selected.id}
                                  >
                                      {state.currentPlanet === selected.id ? 'АКТИВНА' : 'СОВЕРШИТЬ ПРЫЖОК'}
                                  </button>
                              ) : (
                                  <button 
                                      className={`w-full md:w-auto px-6 py-3 rounded-xl border font-mono text-xs md:text-sm tracking-widest transition-all active:scale-95 ${state.maxMass >= selected.cost ? 'bg-indigo-500/20 hover:bg-indigo-500/40 border-indigo-500/50 text-indigo-300' : 'bg-red-500/10 border-red-500/30 text-red-500/50 cursor-not-allowed'}`}
                                      onClick={() => handleAction(selected)}
                                      disabled={state.maxMass < selected.cost}
                                  >
                                      ОТКРЫТЬ: {formatCost(selected.cost)} МАШ.
                                  </button>
                              )}
                          </div>
                      </motion.div>
                  )}
              </AnimatePresence>
          </div>
          
          {/* Omni Upgrades Area */}
          <div className="flex-1 bg-gray-950 border border-gray-900 rounded-xl p-6 overflow-y-auto no-scrollbar flex flex-col gap-4">
             <h3 className="font-sans text-lg tracking-widest uppercase text-purple-300 mb-2 border-b border-gray-800 pb-2">УЛУЧШЕНИЯ OMNI</h3>
             <p className="text-xs text-gray-500 font-mono mb-4">Глобальные мультипликаторы для всех реальностей.</p>
             
             {[
                 { id: 'o_omniYield', title: 'ОМНИ-РОСТ', desc: '+150% к массе от каждой частицы' },
                 { id: 'o_omniPull', title: 'ОМНИ-ГРАВИТАЦИЯ', desc: '+50% к силе затягивания частиц' },
                 { id: 'o_omniEcho', title: 'ОМНИ-ПРЕСТИЖ', desc: '+200% к получению Эха Пустоты' },
             ].map(upg => {
                 const level = (state.upgrades as any)[upg.id] || 0;
                 const cost = getOmniCost(level);
                 const canAfford = state.omniMatter >= cost;
                 return (
                     <div key={upg.id} className="bg-black border border-gray-800 rounded-xl p-4 flex flex-col gap-3 group hover:border-purple-500/50 transition-colors">
                        <div>
                            <div className="font-sans text-md text-gray-200">{upg.title} <span className="text-xs text-purple-400 font-mono ml-2">УР. {formatNum(level)}</span></div>
                            <div className="text-xs text-gray-500 font-mono mt-1">{upg.desc}</div>
                        </div>
                        <button 
                           disabled={!canAfford}
                           onClick={() => canAfford && onBuyOmniUpgrade(upg.id, cost)}
                           className={`py-2 px-4 rounded-lg font-mono text-xs w-full transition-all ${canAfford ? 'bg-purple-900/30 text-purple-200 border border-purple-500/50 hover:bg-purple-600/50' : 'bg-gray-900 text-gray-600 cursor-not-allowed'}`}
                        >
                           КУПИТЬ: {formatNum(cost)} OMNI
                        </button>
                     </div>
                 )
             })}
          </div>
        </div>
      </div>
    </div>
  );
}
