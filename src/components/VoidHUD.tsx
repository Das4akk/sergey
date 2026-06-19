import React, { useState } from 'react';
import { GameState } from '../lib/GameEngine';
import { Settings2, Sparkles, Network, CircleDot, Target, Orbit, Link, Split, Sun, Hourglass, Zap, ShieldAlert, Anvil, Gem, Infinity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatNum } from '../lib/utils';

interface VoidHUDProps {
  state: GameState;
  onBuyUpgrade: (key: keyof GameState['upgrades'], cost: number, count?: number) => void;
  onPrestige: () => void;
  thought: string | null;
  showShop: boolean;
  setShowShop: (val: boolean) => void;
  setThought: (val: string | null) => void;
}

export function VoidHUD({ state, onBuyUpgrade, onPrestige, thought, showShop, setShowShop, setThought }: VoidHUDProps) {
  type BuyMultiplier = number | '1/2' | '1/3';
  const [tab, setTab] = useState<'matter' | 'echo' | 'stardust' | 'mutations'>('matter');
  const [buyMultiplier, setBuyMultiplier] = useState<BuyMultiplier>(1);

  const FORMULAS: Record<string, (l: number) => number> = {
    gravityPower: (l) => Math.floor(10 * Math.pow(1.5, l - 1)),
    spawnRate: (l) => Math.floor(15 * Math.pow(1.8, l - 1)),
    passivePull: (l) => Math.floor(25 * Math.pow(2.0, l)),
    multiplier: (l) => Math.floor(100 * Math.pow(3.0, l - 1)),
    orbitals: (l) => Math.floor(200 * Math.pow(4.0, l)),
    entanglement: (l) => Math.floor(500 * Math.pow(2.5, l)),
    fractal: (l) => Math.floor(800 * Math.pow(3.5, l)),
    radiance: (l) => Math.floor(1000 * Math.pow(5.0, l)),
    chronosphere: (l) => Math.floor(2500 * Math.pow(3.0, l)),
    quasar: (l) => Math.floor(5000 * Math.pow(4.0, l)),
    
    // Stardust costs
    darkMatterSiphon: (l) => Math.floor(50 * Math.pow(2.2, l)),
    eventHorizon: (l) => Math.floor(150 * Math.pow(2.8, l)),
    nebulaCollector: (l) => Math.floor(300 * Math.pow(2.5, l)),
    starWeaver: (l) => Math.floor(800 * Math.pow(3.0, l)),
    cosmicResonance: (l) => Math.floor(1500 * Math.pow(3.2, l)),
    pulsarBurst: (l) => Math.floor(5000 * Math.pow(4.0, l)),
    voidwalker: (l) => Math.floor(10000 * Math.pow(5.0, l)),
    
    // Echo costs
    singularityDepth: (l) => Math.floor(1 + l * 1),
    stellarForge: (l) => Math.floor(2 + l * 2),
    voidMonolith: (l) => Math.floor(3 + l * 2),
    tachyonWeb: (l) => Math.floor(2 + l * 1.5),
    astralProjection: (l) => Math.floor(4 + l * 2),
    quantunTunnelling: (l) => Math.floor(5 + l * 3),
    entropyWeaver: (l) => Math.floor(5 + l * 2.5),
  };

  const mutationIds = [
    'm_momentum', 'm_hydrodynamics', 'm_metabolism', 'm_photosynthesis', 'm_chemosynthesis',
    'm_osmosis', 'm_parasitism', 'm_filter_feeding', 'm_adaptation', 'm_regeneration',
    'm_cell_division', 'm_symbiosis', 'm_echolocation', 'm_predator', 'm_apex_predator',
    'm_camouflage', 'm_electric_discharge', 'm_hardened_shell', 'm_extremophile', 'm_void_adaptation',
    'm_stellar_wind', 'm_nebular_nursery', 'm_cosmic_web', 'm_bioluminescence', 'm_spawning_pool',
    'm_neural_network', 'm_hive_mind', 'm_mitosis', 'm_elasticity', 'm_transcendence'
  ];
  
  mutationIds.forEach((id, index) => {
    FORMULAS[id] = (l) => Math.floor(1000 * (index + 1) * Math.pow(2.0, l));
  });

  const getPurchaseData = (key: string, currencyType: 'mass' | 'echoes' | 'stardust') => {
    const fn = FORMULAS[key];
    if (!fn) return { cost: 0, count: 0, canAfford: false };
    
    const currentLvl = (state.upgrades as any)[key] || 0;
    const currencyAmt = state[currencyType];
    
    let simulatedLvl = currentLvl;
    let totalCost = 0;
    let count = 0;
    const desired = typeof buyMultiplier === 'number' ? buyMultiplier : Infinity;
    const maxAllowedCost = typeof buyMultiplier === 'string' ? (buyMultiplier === '1/2' ? currencyAmt / 2 : currencyAmt / 3) : currencyAmt;
    
    let nextCost = fn(simulatedLvl);
    if (currentLvl === 0 && key === 'gravityPower') nextCost = fn(1); // default logic
    
    while(count < desired) {
        if (totalCost + nextCost > maxAllowedCost) break;
        totalCost += nextCost;
        simulatedLvl++;
        count++;
        nextCost = fn(simulatedLvl);
    }
    
    return {
        cost: count === 0 ? fn(currentLvl || (key==='gravityPower'||key==='spawnRate'||key==='multiplier'?1:0)) : totalCost,
        count: count === 0 ? 1 : count,
        canAfford: count > 0 && totalCost <= currencyAmt
    };
  };

  const executeBuy = (key: string, currencyType: 'mass' | 'echoes' | 'stardust') => {
     const data = getPurchaseData(key, currencyType);
     if (data.canAfford && data.count > 0) {
        // We will modify onBuyUpgrade to accept count
        onBuyUpgrade(key as any, data.cost, data.count);
     }
  };

  const getCardProps = (key: string, currencyType: 'mass' | 'echoes' | 'stardust') => {
     const data = getPurchaseData(key, currencyType);
     return {
         cost: data.cost,
         canAfford: data.canAfford,
         onBuy: () => executeBuy(key, currencyType),
         buyCountText: data.count > 1 ? `x${data.count}` : ''
     };
  };

  const worlds = ["Пустота", "Сумерки", "Заря", "Эфир", "Астрал"];
  const currentWorldName = worlds[state.dimension % worlds.length];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 text-white p-safe z-10 w-full h-full overflow-hidden">
      
      {/* Top Bar: Level & Mass */}
      <div className="flex flex-col sm:flex-row justify-between items-start pointer-events-none gap-4">
        <div className="flex flex-col gap-1 drop-shadow-lg">
          <span className="font-mono text-xs tracking-[0.3em] text-gray-400 uppercase">Уровень: {currentWorldName}</span>
          <span className="font-sans text-4xl sm:text-5xl font-light tracking-tighter">{formatNum(state.level)}</span>
          {state.stardust > 0 && <span className="font-mono text-xs text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">Звездная пыль: {formatNum(state.stardust)}</span>}
        </div>
        
        <div className="flex flex-col items-start sm:items-end gap-1 drop-shadow-lg">
          <span className="font-mono text-xs tracking-[0.3em] text-gray-400 uppercase">Сингулярность</span>
          <div className="flex items-baseline gap-2">
            <span className="font-sans text-3xl sm:text-4xl font-light">{formatNum(state.mass)}</span>
            <span className="text-gray-500 font-mono text-xs">/ {formatNum(state.maxMass)}</span>
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
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-6 border-b border-gray-800 gap-6">
               <div className="pr-24 md:pr-0">
                  <h2 className="font-sans text-3xl font-light tracking-tight text-white mb-2">Нексус Эволюции</h2>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                     <span className="font-mono text-sm text-gray-400">Материя: <span className="text-white">{formatNum(state.mass)}</span></span>
                     <span className="font-mono text-sm text-indigo-400">Эхо Пустоты: <span className="text-indigo-200">{formatNum(state.echoes)}</span></span>
                  </div>
               </div>
               <div className="flex w-full md:w-auto">
                 <div className="flex flex-wrap gap-1 bg-black border border-gray-800 rounded-xl p-1 shrink-0 max-w-full justify-start items-center">
                   {(['1/3', '1/2', 1, 10, 100, 1000, 10000, 100000, 1000000, 1000000000, 1000000000000] as BuyMultiplier[]).map((m) => (
                     <button
                       key={m.toString()}
                       onClick={() => setBuyMultiplier(m)}
                       className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg font-mono text-[10px] md:text-xs uppercase transition-colors shrink-0 ${buyMultiplier === m ? 'bg-white text-black' : 'text-gray-500 bg-gray-900/50 hover:text-white hover:bg-gray-800'}`}
                     >
                       {typeof m === 'string' ? m : `x${m >= 1000000000000 ? `${m/1000000000000}T` : m >= 1000000000 ? `${m/1000000000}B` : m >= 1000000 ? `${m/1000000}M` : m >= 1000 ? `${m/1000}k` : m}`}
                     </button>
                   ))}
                 </div>
               </div>
             </div>
             
             <button 
                onClick={() => setShowShop(false)}
                className="absolute top-6 right-6 md:top-8 md:right-8 z-50 px-6 py-3 bg-red-500/10 text-red-300 border border-red-500/30 rounded-full font-mono text-xs uppercase hover:bg-red-500 hover:text-white transition-all shadow-xl backdrop-blur-md"
             >
                Закрыть (Вернуться)
             </button>

             <div className="flex gap-4 mb-8 overflow-x-auto no-scrollbar max-w-full">
                <button onClick={() => setTab('matter')} className={`whitespace-nowrap px-6 py-2 rounded-full font-mono text-xs tracking-widest uppercase transition-colors border ${tab === 'matter' ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-gray-800 hover:border-gray-500'}`}>Материя</button>
                <button onClick={() => setTab('echo')} className={`whitespace-nowrap px-6 py-2 rounded-full font-mono text-xs tracking-widest uppercase transition-colors border ${tab === 'echo' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50' : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-500'}`}>Эхо (Престиж)</button>
                <button onClick={() => setTab('stardust')} className={`whitespace-nowrap px-6 py-2 rounded-full font-mono text-xs tracking-widest uppercase transition-colors border ${tab === 'stardust' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-500'}`}>Пробуждение</button>
                <button onClick={() => setTab('mutations')} className={`whitespace-nowrap px-6 py-2 rounded-full font-mono text-xs tracking-widest uppercase transition-colors border ${tab === 'mutations' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-500'}`}>Синтез Нексуса</button>
             </div>

             <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
                {tab === 'matter' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
                    <ShopCard icon={<Target size={20}/>} title="Гравитация" desc="Радиус притяжения ядра" extendedDesc={`Увеличивает базовый радиус гравитационного поля ядра.`} level={state.upgrades.gravityPower} currency="M" {...getCardProps('gravityPower', 'mass')} />
                    <ShopCard icon={<Sparkles size={20}/>} title="Энтропия" desc="Ускоряет генерацию пыли" extendedDesc={`Повышает скорость появления частиц в пустоте.`} level={state.upgrades.spawnRate} currency="M" {...getCardProps('spawnRate', 'mass')} />
                    <ShopCard icon={<Network size={20}/>} title="Притяжение" desc="Пассивный сбор материи" extendedDesc={`Автоматически притягивает частицы.`} level={state.upgrades.passivePull} currency="M" {...getCardProps('passivePull', 'mass')} />
                    <ShopCard icon={<CircleDot size={20}/>} title="Суперпозиция" desc="Множитель получаемой массы" extendedDesc={`Каждая поглощенная частица приносит в разы больше массы.`} level={state.upgrades.multiplier} currency="M" {...getCardProps('multiplier', 'mass')} />
                    <ShopCard icon={<Orbit size={20}/>} title="Спутники" desc="Орбиты, поглощающие пыль" extendedDesc={`Формирует защитные кольца-спутники, которые собирают пыль автоматически.`} level={state.upgrades.orbitals} currency="M" {...getCardProps('orbitals', 'mass')} />
                    <ShopCard icon={<Link size={20}/>} title="Запутанность" desc="Шанс цепного поглощения" extendedDesc={`Поглощение одной частицы может вызвать схлопывание ближайших соседних.`} level={state.upgrades.entanglement} currency="M" {...getCardProps('entanglement', 'mass')} />
                    <ShopCard icon={<Split size={20}/>} title="Фрактал" desc="Расщепление крупных частиц" extendedDesc={`Тяжелые астероиды при поглощении распадаются на рой мелких частиц.`} level={state.upgrades.fractal} currency="M" {...getCardProps('fractal', 'mass')} />
                    <ShopCard icon={<Sun size={20}/>} title="Сияние" desc="Увеличивает плотность ядра" extendedDesc={`Масса растет по экспоненте.`} level={state.upgrades.radiance} currency="M" {...getCardProps('radiance', 'mass')} />
                    
                    {state.dimension >= 1 && (
                      <>
                        <ShopCard variant="twilight" icon={<Hourglass size={20}/>} title="Хроносфера" desc="Замедляет время вблизи ядра" extendedDesc={`Снижает скорость полета объектов.`} level={state.upgrades.chronosphere} currency="M" {...getCardProps('chronosphere', 'mass')} />
                        <ShopCard variant="twilight" icon={<Zap size={20}/>} title="Квазар" desc="Спонтанное поглощение искр" extendedDesc={`Автоматические вспышки собирают редкие частицы по всему экрану.`} level={state.upgrades.quasar} currency="M" {...getCardProps('quasar', 'mass')} />
                      </>
                    )}
                  </div>
                )}

                {tab === 'stardust' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
                     <ShopCard variant="dawn" icon={<CircleDot size={20}/>} title="Темная Материя" desc="Скаляр от общей массы" extendedDesc={`Пассивный бонус к сбору в зависимости от вашей исторической общей массы.`} level={state.upgrades.darkMatterSiphon} currency="S" {...getCardProps('darkMatterSiphon', 'stardust')} />
                     <ShopCard variant="dawn" icon={<Target size={20}/>} title="Горизонт Событий" desc="Радиус уничтожения при Сверхновой" extendedDesc={`Увеличивает область поражения при взрыве.`} level={state.upgrades.eventHorizon} currency="S" {...getCardProps('eventHorizon', 'stardust')} />
                     <ShopCard variant="dawn" icon={<Sparkles size={20}/>} title="Искатель Туманностей" desc="Увеличивает шанс Звездной Пыли" extendedDesc={`Повышает вероятность выпадения Звездной пыли.`} level={state.upgrades.nebulaCollector} currency="S" {...getCardProps('nebulaCollector', 'stardust')} />
                     <ShopCard variant="dawn" icon={<Sun size={20}/>} title="Звездный Ткач" desc="Случайная Пили" extendedDesc={`Ядро конвертирует огромные куски накопленной массы в Пыль.`} level={state.upgrades.starWeaver} currency="S" {...getCardProps('starWeaver', 'stardust')} />
                     <ShopCard variant="dawn" icon={<Network size={20}/>} title="Космический Резонанс" desc="Удержание энергии" extendedDesc={`Снижает затухание энергии Сингулярности.`} level={state.upgrades.cosmicResonance} currency="S" {...getCardProps('cosmicResonance', 'stardust')} />
                     <ShopCard variant="dawn" icon={<Orbit size={20}/>} title="Выброс Пульсара" desc="Громкие вспышки притяжения" extendedDesc={`ПКМ порождает ударную волну.`} level={state.upgrades.pulsarBurst} currency="S" {...getCardProps('pulsarBurst', 'stardust')} />
                     <ShopCard variant="dawn" icon={<Split size={20}/>} title="Пустотный Шагун" desc="Пассивное ускорение частиц" extendedDesc={`Частицы двигаются быстрее к вашему ядру самостоятельно.`} level={state.upgrades.voidwalker} currency="S" {...getCardProps('voidwalker', 'stardust')} />
                  </div>
                )}
                
                {tab === 'mutations' && (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
                     {[
                         {id: 'm_momentum', title: 'Импульс Мутации', desc: 'Увеличивает скорость движения'},
                         {id: 'm_hydrodynamics', title: 'Гидродинамика', desc: 'Увеличивает бонус рывка'},
                         {id: 'm_metabolism', title: 'Метаболизм', desc: 'Снижает цену рывка'},
                         {id: 'm_photosynthesis', title: 'Фотосинтез', desc: 'Пассивное производство в Заре'},
                         {id: 'm_chemosynthesis', title: 'Хемосинтез', desc: 'Антиматерия лечит'},
                         {id: 'm_osmosis', title: 'Осмос', desc: 'Увеличивает радиус втягивания'},
                         {id: 'm_parasitism', title: 'Паразитизм', desc: 'Крадет массу у орбиталей'},
                         {id: 'm_filter_feeding', title: 'Фильтрация', desc: 'Поглощает фоновую пыль'},
                         {id: 'm_adaptation', title: 'Адаптация', desc: 'Снижает урон от антиматерии'},
                         {id: 'm_regeneration', title: 'Регенерация', desc: 'Восстанавливает радиус после удара'},
                         {id: 'm_cell_division', title: 'Клеточное деление', desc: 'Расщепляет перегрузку на 2 ядра'},
                         {id: 'm_symbiosis', title: 'Симбиоз', desc: 'Частицы усиливают пассивные ауры'},
                         {id: 'm_echolocation', title: 'Эхолокация', desc: 'Втягивает редкие частицы издалека'},
                         {id: 'm_predator', title: 'Хищник', desc: 'Больше массы за кометы'},
                         {id: 'm_apex_predator', title: 'Высший хищник', desc: 'Двойная масса в рывке'},
                         {id: 'm_camouflage', title: 'Камуфляж', desc: 'Антиматерия чаще проходит мимо'},
                         {id: 'm_electric_discharge', title: 'Разряд', desc: 'ПКМ уничтожает антиматерию полностью'},
                         {id: 'm_hardened_shell', title: 'Крепкий панцирь', desc: 'Полностью блокирует антиматерию'},
                         {id: 'm_extremophile', title: 'Экстремофил', desc: 'Больше очков в трудных плоскостях'},
                         {id: 'm_void_adaptation', title: 'Адаптация Пустоты', desc: 'Снижает затухание в Пустоте'},
                         {id: 'm_stellar_wind', title: 'Звездный ветер', desc: 'Мощнее отталкиваем мусор'},
                         {id: 'm_nebular_nursery', title: 'Питомник', desc: 'Искры создают новые искры'},
                         {id: 'm_cosmic_web', title: 'Космическая сеть', desc: 'Цепная реакция поглощений'},
                         {id: 'm_bioluminescence', title: 'Люминесценция', desc: 'Отпугивает антиматерию в темноте'},
                         {id: 'm_spawning_pool', title: 'Омут Рождения', desc: 'Спавн частиц волнами'},
                         {id: 'm_neural_network', title: 'Нейронная сеть', desc: 'Глобальный множитель массы'},
                         {id: 'm_hive_mind', title: 'Коллективный разум', desc: 'Орбитали тоже ловят частицы'},
                         {id: 'm_mitosis', title: 'Симбиоз митоза', desc: 'Вероятность дублирования частицы'},
                         {id: 'm_elasticity', title: 'Эластичность ядра', desc: 'Снижает потери при поглощении больших'},
                         {id: 'm_transcendence', title: 'Трансценденция', desc: 'Шанс на мгновенное перерождение'}
                     ].map(mut => (
                         <ShopCard 
                             key={mut.id} 
                             variant="dawn" 
                             icon={<Sparkles size={20}/>} 
                             title={mut.title} 
                             desc={mut.desc} 
                             extendedDesc={`Фундаментальная биологическая адаптация.`} 
                             level={(state.upgrades as any)[mut.id] || 0} 
                             currency="M" 
                             {...getCardProps(mut.id as any, 'mass')}
                         />
                     ))}
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
                            <span className="text-gray-400 mt-1 block">Ожидаемое Эхо Пустоты: <span className="text-indigo-300 font-bold">+{formatNum(Math.max(0, Math.floor(state.level * 1.5) + Math.floor(state.totalMass / 10000)) * (1 + state.upgrades.entropyWeaver * 0.1) * (1 + (state.upgrades.o_omniEcho || 0) * 2.0) * (state.currentPlanet === 'blackhole' ? 500 : 1))}</span></span>
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
                      <ShopCard variant="echo" icon={<ShieldAlert size={20}/>} title="Глубина" desc="Сохраняет 10% массы при Сверхновой" extendedDesc={`Меняет разрушительную природу Сверхновой.\n\nДО: Сверхновая (Пробел) спасает от комет, но обнуляет массу.\nПОСЛЕ: Сверхновая позволяет сохранить часть массы, делая её тактическим инструментом.`} level={state.upgrades.singularityDepth} currency="E" {...getCardProps('singularityDepth', 'echoes')} />
                      <ShopCard variant="echo" icon={<Anvil size={20}/>} title="Звездная Кузня" desc="Улучшает качество спавна" extendedDesc={`Реструктурирует случайность появления объектов.\n\nДО: Космос генерирует базовую пыль с редкими вкраплениями тяжелых элементов.\nПОСЛЕ: Вы находите крупные астероиды и редкие ядра материи значительно чаще.`} level={state.upgrades.stellarForge} currency="E" {...getCardProps('stellarForge', 'echoes')} />
                      <ShopCard variant="echo" icon={<Gem size={20}/>} title="Расширение Сингулярности" desc="Увеличивает макс. заряд Сингулярности" extendedDesc={`Позволяет накапливать больше заряда, захватывая больше частиц.`} level={state.upgrades.voidMonolith} currency="E" {...getCardProps('voidMonolith', 'echoes')} />
                      <ShopCard variant="echo" icon={<Infinity size={20}/>} title="Множитель Сингулярности" desc="Усиливает множитель при коллапсе" extendedDesc={`Увеличивает множитель, выдаваемый за захваченные орбиты.`} level={state.upgrades.tachyonWeb} currency="E" {...getCardProps('tachyonWeb', 'echoes')} />
                      <ShopCard variant="echo" icon={<Network size={20}/>} title="Туннелирование" desc="Шанс Х2 без орбит" extendedDesc={`Частицы могут проходить сквозь ваши орбиты напрямую в ядро с двойным множителем.`} level={state.upgrades.quantunTunnelling} currency="E" {...getCardProps('quantunTunnelling', 'echoes')} />
                      <ShopCard variant="echo" icon={<Sun size={20}/>} title="Ткач Энтропии" desc="Буст к зарабатыванию Эха" extendedDesc={`Глобальный множитель зарабатываемого Эха при следующем престиже.`} level={state.upgrades.entropyWeaver} currency="E" {...getCardProps('entropyWeaver', 'echoes')} />
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

function ShopCard({ icon, title, desc, extendedDesc, level, cost, canAfford, onBuy, currency, variant = 'base', buyCountText }: any) {
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
        <button className="text-gray-600 hover:text-white p-1 font-mono text-xs uppercase tracking-widest">
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
         <span className="font-mono text-xs text-gray-500 uppercase tracking-widest">УР. {formatNum(level)}</span>
         <button 
           onClick={(e) => { e.stopPropagation(); if(canAfford) onBuy(); }}
           disabled={!canAfford}
           className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs transition-all ${
             canAfford 
               ? (variant === 'echo' ? 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-white text-black hover:bg-gray-200 shadow-[0_0_15px_rgba(255,255,255,0.3)]') 
               : 'bg-[#111] text-gray-600 cursor-not-allowed'
           }`}
         >
           {buyCountText && <span>{buyCountText} за</span>}
           <span>{formatNum(cost)} {currency}</span>
         </button>
      </div>
    </div>
  );
}

