import React, { useState } from 'react';
import { GameState } from '../lib/GameEngine';
import { Settings2, Sparkles, Network, CircleDot, Target, Orbit, Link, Split, Sun, Hourglass, Zap, ShieldAlert, Anvil, Gem, Infinity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VoidHUDProps {
  state: GameState;
  onBuyUpgrade: (key: keyof GameState['upgrades'], cost: number) => void;
  onPrestige: () => void;
  thought: string | null;
  showShop: boolean;
  setShowShop: (val: boolean) => void;
  setThought: (val: string | null) => void;
}

export function VoidHUD({ state, onBuyUpgrade, onPrestige, thought, showShop, setShowShop, setThought }: VoidHUDProps) {
  const [tab, setTab] = useState<'matter' | 'echo' | 'stardust'>('matter');

  const costs = {
    gravityPower: Math.floor(10 * Math.pow(1.5, state.upgrades.gravityPower - 1)),
    spawnRate: Math.floor(15 * Math.pow(1.8, state.upgrades.spawnRate - 1)),
    passivePull: Math.floor(25 * Math.pow(2.0, state.upgrades.passivePull)),
    multiplier: Math.floor(100 * Math.pow(3.0, state.upgrades.multiplier - 1)),
    orbitals: Math.floor(200 * Math.pow(4.0, state.upgrades.orbitals)),
    entanglement: Math.floor(500 * Math.pow(2.5, state.upgrades.entanglement)),
    fractal: Math.floor(800 * Math.pow(3.5, state.upgrades.fractal)),
    radiance: Math.floor(1000 * Math.pow(5.0, state.upgrades.radiance)),
    chronosphere: Math.floor(2500 * Math.pow(3.0, state.upgrades.chronosphere)),
    quasar: Math.floor(5000 * Math.pow(4.0, state.upgrades.quasar)),
    
    // Stardust costs (imbalanced)
    darkMatterSiphon: Math.floor(50 * Math.pow(2.2, state.upgrades.darkMatterSiphon)),
    eventHorizon: Math.floor(150 * Math.pow(2.8, state.upgrades.eventHorizon)),
    nebulaCollector: Math.floor(300 * Math.pow(2.5, state.upgrades.nebulaCollector)),
    starWeaver: Math.floor(800 * Math.pow(3.0, state.upgrades.starWeaver)),
    cosmicResonance: Math.floor(1500 * Math.pow(3.2, state.upgrades.cosmicResonance)),
    pulsarBurst: Math.floor(5000 * Math.pow(4.0, state.upgrades.pulsarBurst)),
    voidwalker: Math.floor(10000 * Math.pow(5.0, state.upgrades.voidwalker)),
    
    // Echo costs (use echoes instead of mass)
    singularityDepth: Math.floor(1 + state.upgrades.singularityDepth * 1),
    stellarForge: Math.floor(2 + state.upgrades.stellarForge * 2),
    voidMonolith: Math.floor(3 + state.upgrades.voidMonolith * 2),
    tachyonWeb: Math.floor(2 + state.upgrades.tachyonWeb * 1.5),
    
    // New Echo upgrades
    astralProjection: Math.floor(4 + state.upgrades.astralProjection * 2),
    quantunTunnelling: Math.floor(5 + state.upgrades.quantunTunnelling * 3),
    entropyWeaver: Math.floor(5 + state.upgrades.entropyWeaver * 2.5),
  };

  const worlds = ["Пустота", "Сумерки", "Заря", "Эфир", "Астрал"];
  const currentWorldName = worlds[state.dimension % worlds.length];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 text-white p-safe z-10 w-full h-full overflow-hidden">
      
      {/* Top Bar: Level & Mass */}
      <div className="flex flex-col sm:flex-row justify-between items-start pointer-events-none gap-4">
        <div className="flex flex-col gap-1 drop-shadow-lg">
          <span className="font-mono text-xs tracking-[0.3em] text-gray-400 uppercase">Уровень: {currentWorldName}</span>
          <span className="font-sans text-4xl sm:text-5xl font-light tracking-tighter">{state.level}</span>
          {state.stardust > 0 && <span className="font-mono text-xs text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">Звездная пыль: {state.stardust}</span>}
        </div>
        
        <div className="flex flex-col items-start sm:items-end gap-1 drop-shadow-lg">
          <span className="font-mono text-xs tracking-[0.3em] text-gray-400 uppercase">Сингулярность</span>
          <div className="flex items-baseline gap-2">
            <span className="font-sans text-3xl sm:text-4xl font-light">{Math.floor(state.mass)}</span>
            <span className="text-gray-500 font-mono text-xs">/ {state.maxMass}</span>
          </div>
        </div>
      </div>

      {/* Center: The AI Thought (Observer) FULL SCREEN */}
      <AnimatePresence>
        {thought && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md pointer-events-auto"
            onClick={() => setThought(null)}
          >
            <motion.div 
               initial={{ scale: 0.95, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               exit={{ scale: 0.95, y: -20 }}
               className="max-w-xl text-center px-8 py-16"
            >
               <p className="font-sans text-2xl md:text-3xl font-light text-gray-200 leading-relaxed tracking-wide shadow-black drop-shadow-lg whitespace-pre-line">
                 {thought}
               </p>
               <p className="font-mono text-xs text-gray-500 mt-12 tracking-widest uppercase">Кликните, чтобы осознать</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Bar: Shop Toggle & Hints */}
      <div className="flex justify-between items-end pointer-events-none mt-auto">
        <div className="flex flex-col gap-1 text-[10px] font-mono text-gray-600 uppercase tracking-widest hidden md:flex">
          <span>[ЛКМ] Затянуть | [ПКМ] Оттолкнуть</span>
          <span>Клик по частице для прямого поглощения</span>
          <span>[SPACE] Сверхновая</span>
        </div>

        <div className="pointer-events-auto">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowShop(!showShop); }}
            className={`flex items-center gap-2 px-6 py-3 border rounded-full transition-all duration-300 font-mono text-xs uppercase tracking-[0.2em] shadow-xl ${showShop ? 'bg-white text-black border-white' : 'border-gray-700 text-gray-300 hover:border-gray-400 hover:text-white bg-black/50 backdrop-blur'}`}
          >
            <Settings2 size={16} />
            Нексус
          </button>
        </div>
      </div>

      {/* Full Screen Shop Overlay */}
      <AnimatePresence>
        {showShop && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[#060606]/95 backdrop-blur-xl pointer-events-auto flex flex-col p-8 sm:p-12"
            onClick={(e) => e.stopPropagation()}
          >
             <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-800">
               <div>
                  <h2 className="font-sans text-3xl font-light tracking-tight text-white mb-2">Нексус Эволюции</h2>
                  <div className="flex gap-4">
                     <span className="font-mono text-sm text-gray-400">Материя: <span className="text-white">{Math.floor(state.mass)}</span></span>
                     <span className="font-mono text-sm text-indigo-400">Эхо Пустоты: <span className="text-indigo-200">{state.echoes}</span></span>
                  </div>
               </div>
               <button 
                  onClick={() => setShowShop(false)}
                  className="px-6 py-3 border border-gray-700 rounded-full font-mono text-xs uppercase hover:bg-white hover:text-black transition-colors"
               >
                  Вернуться
               </button>
             </div>

             <div className="flex gap-4 mb-8">
                <button onClick={() => setTab('matter')} className={`px-6 py-2 rounded-full font-mono text-xs tracking-widest uppercase transition-colors border ${tab === 'matter' ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-gray-800 hover:border-gray-500'}`}>Материя</button>
                <button onClick={() => setTab('echo')} className={`px-6 py-2 rounded-full font-mono text-xs tracking-widest uppercase transition-colors border ${tab === 'echo' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50' : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-500'}`}>Эхо (Престиж)</button>
                <button onClick={() => setTab('stardust')} className={`px-6 py-2 rounded-full font-mono text-xs tracking-widest uppercase transition-colors border ${tab === 'stardust' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-500'}`}>Пробуждение</button>
             </div>

             <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
                {tab === 'matter' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
                    <ShopCard icon={<Target size={20}/>} title="Гравитация" desc="Радиус притяжения ядра" extendedDesc={`Увеличивает базовый радиус гравитационного поля ядра.`} level={state.upgrades.gravityPower} cost={costs.gravityPower} canAfford={state.mass >= costs.gravityPower} onBuy={() => onBuyUpgrade('gravityPower', costs.gravityPower)} currency="M" />
                    <ShopCard icon={<Sparkles size={20}/>} title="Энтропия" desc="Ускоряет генерацию пыли" extendedDesc={`Повышает скорость появления частиц в пустоте.`} level={state.upgrades.spawnRate} cost={costs.spawnRate} canAfford={state.mass >= costs.spawnRate} onBuy={() => onBuyUpgrade('spawnRate', costs.spawnRate)} currency="M" />
                    <ShopCard icon={<Network size={20}/>} title="Притяжение" desc="Пассивный сбор материи" extendedDesc={`Автоматически притягивает частицы.`} level={state.upgrades.passivePull} cost={costs.passivePull} canAfford={state.mass >= costs.passivePull} onBuy={() => onBuyUpgrade('passivePull', costs.passivePull)} currency="M" />
                    <ShopCard icon={<CircleDot size={20}/>} title="Суперпозиция" desc="Множитель получаемой массы" extendedDesc={`Каждая поглощенная частица приносит в разы больше массы.`} level={state.upgrades.multiplier} cost={costs.multiplier} canAfford={state.mass >= costs.multiplier} onBuy={() => onBuyUpgrade('multiplier', costs.multiplier)} currency="M" />
                    <ShopCard icon={<Orbit size={20}/>} title="Спутники" desc="Орбиты, поглощающие пыль" extendedDesc={`Формирует защитные кольца-спутники, которые собирают пыль автоматически.`} level={state.upgrades.orbitals} cost={costs.orbitals} canAfford={state.mass >= costs.orbitals} onBuy={() => onBuyUpgrade('orbitals', costs.orbitals)} currency="M" />
                    <ShopCard icon={<Link size={20}/>} title="Запутанность" desc="Шанс цепного поглощения" extendedDesc={`Поглощение одной частицы может вызвать схлопывание ближайших соседних.`} level={state.upgrades.entanglement} cost={costs.entanglement} canAfford={state.mass >= costs.entanglement} onBuy={() => onBuyUpgrade('entanglement', costs.entanglement)} currency="M" />
                    <ShopCard icon={<Split size={20}/>} title="Фрактал" desc="Расщепление крупных частиц" extendedDesc={`Тяжелые астероиды при поглощении распадаются на рой мелких частиц.`} level={state.upgrades.fractal} cost={costs.fractal} canAfford={state.mass >= costs.fractal} onBuy={() => onBuyUpgrade('fractal', costs.fractal)} currency="M" />
                    <ShopCard icon={<Sun size={20}/>} title="Сияние" desc="Увеличивает плотность ядра" extendedDesc={`Масса растет по экспоненте.`} level={state.upgrades.radiance} cost={costs.radiance} canAfford={state.mass >= costs.radiance} onBuy={() => onBuyUpgrade('radiance', costs.radiance)} currency="M" />
                    
                    {state.dimension >= 1 && (
                      <>
                        <ShopCard variant="twilight" icon={<Hourglass size={20}/>} title="Хроносфера" desc="Замедляет время вблизи ядра" extendedDesc={`Снижает скорость полета объектов.`} level={state.upgrades.chronosphere} cost={costs.chronosphere} canAfford={state.mass >= costs.chronosphere} onBuy={() => onBuyUpgrade('chronosphere', costs.chronosphere)} currency="M" />
                        <ShopCard variant="twilight" icon={<Zap size={20}/>} title="Квазар" desc="Спонтанное поглощение искр" extendedDesc={`Автоматические вспышки собирают редкие частицы по всему экрану.`} level={state.upgrades.quasar} cost={costs.quasar} canAfford={state.mass >= costs.quasar} onBuy={() => onBuyUpgrade('quasar', costs.quasar)} currency="M" />
                      </>
                    )}
                  </div>
                )}

                {tab === 'stardust' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
                     <ShopCard variant="dawn" icon={<CircleDot size={20}/>} title="Темная Материя" desc="Скаляр от общей массы" extendedDesc={`Пассивный бонус к сбору в зависимости от вашей исторической общей массы.`} level={state.upgrades.darkMatterSiphon} cost={costs.darkMatterSiphon} canAfford={state.stardust >= costs.darkMatterSiphon} onBuy={() => onBuyUpgrade('darkMatterSiphon', costs.darkMatterSiphon)} currency="S" />
                     <ShopCard variant="dawn" icon={<Target size={20}/>} title="Горизонт Событий" desc="Радиус уничтожения при Сверхновой" extendedDesc={`Увеличивает область поражения при взрыве.`} level={state.upgrades.eventHorizon} cost={costs.eventHorizon} canAfford={state.stardust >= costs.eventHorizon} onBuy={() => onBuyUpgrade('eventHorizon', costs.eventHorizon)} currency="S" />
                     <ShopCard variant="dawn" icon={<Sparkles size={20}/>} title="Искатель Туманностей" desc="Увеличивает шанс Звездной Пыли" extendedDesc={`Повышает вероятность выпадения Звездной пыли.`} level={state.upgrades.nebulaCollector} cost={costs.nebulaCollector} canAfford={state.stardust >= costs.nebulaCollector} onBuy={() => onBuyUpgrade('nebulaCollector', costs.nebulaCollector)} currency="S" />
                     <ShopCard variant="dawn" icon={<Sun size={20}/>} title="Звездный Ткач" desc="Случайная Пили" extendedDesc={`Ядро конвертирует огромные куски накопленной массы в Пыль.`} level={state.upgrades.starWeaver} cost={costs.starWeaver} canAfford={state.stardust >= costs.starWeaver} onBuy={() => onBuyUpgrade('starWeaver', costs.starWeaver)} currency="S" />
                     <ShopCard variant="dawn" icon={<Network size={20}/>} title="Космический Резонанс" desc="Удержание энергии" extendedDesc={`Снижает затухание энергии Сингулярности.`} level={state.upgrades.cosmicResonance} cost={costs.cosmicResonance} canAfford={state.stardust >= costs.cosmicResonance} onBuy={() => onBuyUpgrade('cosmicResonance', costs.cosmicResonance)} currency="S" />
                     <ShopCard variant="dawn" icon={<Orbit size={20}/>} title="Выброс Пульсара" desc="Громкие вспышки притяжения" extendedDesc={`ПКМ порождает ударную волну.`} level={state.upgrades.pulsarBurst} cost={costs.pulsarBurst} canAfford={state.stardust >= costs.pulsarBurst} onBuy={() => onBuyUpgrade('pulsarBurst', costs.pulsarBurst)} currency="S" />
                     <ShopCard variant="dawn" icon={<Split size={20}/>} title="Пустотный Шагун" desc="Пассивное ускорение частиц" extendedDesc={`Частицы двигаются быстрее к вашему ядру самостоятельно.`} level={state.upgrades.voidwalker} cost={costs.voidwalker} canAfford={state.stardust >= costs.voidwalker} onBuy={() => onBuyUpgrade('voidwalker', costs.voidwalker)} currency="S" />
                  </div>
                )}

                {tab === 'echo' && (
                  <div className="flex flex-col gap-6 max-w-6xl">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-indigo-900/10 border border-indigo-500/30 p-6 rounded-2xl">
                       <div className="mb-4 md:mb-0 max-w-2xl">
                          <h3 className="font-sans text-xl tracking-tight text-indigo-100 font-medium mb-2">Перерождение (Престиж)</h3>
                          <p className="font-mono text-xs text-indigo-300/70 leading-relaxed mb-4">
                             Пожертвовать всей собранной материей, чтобы высвободить Эхо Пустоты. 
                          </p>
                          <div className="font-mono text-xs p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-lg inline-block">
                            <span className="text-gray-400">Требования: </span>
                            {(() => {
                               const reqLevel = 5 + (state.prestigeCount || 0) * 10;
                               return (
                                  <span className={state.level >= reqLevel ? "text-green-400" : "text-red-400"}>
                                     {state.level >= reqLevel ? `✔ Достигнут уровень ${reqLevel}+` : `✘ Требуется минимум ${reqLevel} уровень (Текущий: ${state.level})`}
                                  </span>
                               );
                            })()}
                            <br/>
                            <span className="text-gray-400 mt-1 block">Ожидаемое Эхо Пустоты: <span className="text-indigo-300 font-bold">+{Math.floor(Math.max(0, Math.floor(state.level * 1.5) + Math.floor(state.totalMass / 10000)) * (1 + state.upgrades.entropyWeaver * 0.1))}</span></span>
                          </div>
                       </div>
                       <button 
                         onClick={() => {
                            const reqLevel = 5 + (state.prestigeCount || 0) * 10;
                            if (state.level < reqLevel) {
                               return; 
                            }
                            onPrestige();
                            setShowShop(false);
                         }}
                         className={`px-8 py-3 rounded-full transition-all font-mono text-xs uppercase tracking-widest shrink-0 ${state.level >= (5 + (state.prestigeCount || 0) * 10) ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/50 hover:bg-indigo-500 hover:text-white cursor-pointer' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                       >
                         Переродиться
                       </button>
                    </div>

                    <p className="font-mono text-sm text-indigo-300/60 mb-2 mt-4 border-b border-indigo-900/30 pb-4">
                      Аномалии (сохраняются при Перерождении):
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <ShopCard variant="echo" icon={<ShieldAlert size={20}/>} title="Глубина" desc="Сохраняет 10% массы при Сверхновой" extendedDesc={`Меняет разрушительную природу Сверхновой.\n\nДО: Сверхновая (Пробел) спасает от комет, но обнуляет массу.\nПОСЛЕ: Сверхновая позволяет сохранить часть массы, делая её тактическим инструментом.`} level={state.upgrades.singularityDepth} cost={costs.singularityDepth} canAfford={state.echoes >= costs.singularityDepth} onBuy={() => onBuyUpgrade('singularityDepth', costs.singularityDepth)} currency="E" />
                      <ShopCard variant="echo" icon={<Anvil size={20}/>} title="Звездная Кузня" desc="Улучшает качество спавна" extendedDesc={`Реструктурирует случайность появления объектов.\n\nДО: Космос генерирует базовую пыль с редкими вкраплениями тяжелых элементов.\nПОСЛЕ: Вы находите крупные астероиды и редкие ядра материи значительно чаще.`} level={state.upgrades.stellarForge} cost={costs.stellarForge} canAfford={state.echoes >= costs.stellarForge} onBuy={() => onBuyUpgrade('stellarForge', costs.stellarForge)} currency="E" />
                      <ShopCard variant="echo" icon={<Gem size={20}/>} title="Расширение Сингулярности" desc="Увеличивает макс. заряд Сингулярности" extendedDesc={`Позволяет накапливать больше заряда, захватывая больше частиц.`} level={state.upgrades.voidMonolith} cost={costs.voidMonolith} canAfford={state.echoes >= costs.voidMonolith} onBuy={() => onBuyUpgrade('voidMonolith', costs.voidMonolith)} currency="E" />
                      <ShopCard variant="echo" icon={<Infinity size={20}/>} title="Множитель Сингулярности" desc="Усиливает множитель при коллапсе" extendedDesc={`Увеличивает множитель, выдаваемый за захваченные орбиты.`} level={state.upgrades.tachyonWeb} cost={costs.tachyonWeb} canAfford={state.echoes >= costs.tachyonWeb} onBuy={() => onBuyUpgrade('tachyonWeb', costs.tachyonWeb)} currency="E" />
                      <ShopCard variant="echo" icon={<Network size={20}/>} title="Туннелирование" desc="Шанс Х2 без орбит" extendedDesc={`Частицы могут проходить сквозь ваши орбиты напрямую в ядро с двойным множителем.`} level={state.upgrades.quantunTunnelling} cost={costs.quantunTunnelling} canAfford={state.echoes >= costs.quantunTunnelling} onBuy={() => onBuyUpgrade('quantunTunnelling', costs.quantunTunnelling)} currency="E" />
                      <ShopCard variant="echo" icon={<Sun size={20}/>} title="Ткач Энтропии" desc="Буст к зарабатыванию Эха" extendedDesc={`Глобальный множитель зарабатываемого Эха при следующем престиже.`} level={state.upgrades.entropyWeaver} cost={costs.entropyWeaver} canAfford={state.echoes >= costs.entropyWeaver} onBuy={() => onBuyUpgrade('entropyWeaver', costs.entropyWeaver)} currency="E" />
                    </div>
                  </div>
                )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShopCard({ icon, title, desc, extendedDesc, level, cost, canAfford, onBuy, currency, variant = 'base' }: any) {
  const [expanded, setExpanded] = useState(false);

  let borderColors = "border-gray-800 hover:border-gray-600";
  let iconColors = "text-gray-400 group-hover:text-white";
  let bgColors = "bg-black/40";
  if (variant === 'twilight') { borderColors = "border-purple-900/50 hover:border-purple-500"; iconColors = "text-purple-400"; }
  if (variant === 'dawn') { borderColors = "border-orange-900/50 hover:border-orange-500"; iconColors = "text-orange-400"; }
  if (variant === 'echo') { borderColors = "border-indigo-900/50 hover:border-indigo-400"; iconColors = "text-indigo-400"; bgColors = "bg-indigo-950/20"; }

  return (
    <div 
      className={`group flex flex-col justify-between p-6 rounded-2xl border transition-all duration-300 ${bgColors} ${borderColors} ${expanded ? 'col-span-full md:col-span-2 lg:col-span-2 row-span-2' : ''}`}
    >
      <div className="flex justify-between items-start mb-6 gap-4" onClick={() => setExpanded(!expanded)} style={{cursor: 'pointer'}}>
        <div className="flex gap-4 items-start">
          <div className={`p-3 rounded-xl bg-white/5 ${iconColors} transition-colors`}>
            {icon}
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-lg font-medium tracking-wide text-gray-100">{title}</span>
            <span className="font-mono text-xs text-gray-500 mt-1">{desc}</span>
          </div>
        </div>
        <button className="text-gray-600 hover:text-white p-1">
           {expanded ? 'Скрыть' : 'Инфо'}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
           <motion.div 
             initial={{ opacity: 0, height: 0 }}
             animate={{ opacity: 1, height: 'auto' }}
             exit={{ opacity: 0, height: 0 }}
             className="overflow-hidden mb-6"
           >
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 font-mono text-sm leading-relaxed text-gray-300 whitespace-pre-line">
                 {extendedDesc}
              </div>
           </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mt-auto">
         <span className="font-mono text-xs text-gray-500">УР. {level}</span>
         <button 
           disabled={!canAfford}
           onClick={(e) => { e.stopPropagation(); onBuy(); }}
           className={`px-4 py-2 rounded-lg font-mono text-xs transition-all ${canAfford ? (variant === 'echo' ? 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-white text-black hover:bg-gray-200 shadow-[0_0_15px_rgba(255,255,255,0.3)]') : 'bg-[#111] text-gray-600 cursor-not-allowed'}`}
         >
           {cost} {currency}
         </button>
      </div>
    </div>
  );
}

