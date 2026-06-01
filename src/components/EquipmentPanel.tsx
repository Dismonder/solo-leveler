import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import type { Equipment, EquipmentSlotId, PlayerState } from '../types';
import { Shield, Sword, Gem, Filter, Box, Coins, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EQUIPMENT_SLOT_DEFINITIONS, equipItem as equipItemForPlayer, getCompatibleSlots, normalizeEquipmentType, unequipSlot } from '../game/equipment';
import { getItemModelSrc } from '../game/equipmentPresentation';

const RARITY_COLORS = {
  common: 'text-zinc-400 border-zinc-700 bg-zinc-900',
  rare: 'text-blue-400 border-blue-700 bg-blue-900/20',
  epic: 'text-purple-400 border-purple-700 bg-purple-900/20',
  legendary: 'text-yellow-400 border-yellow-600 bg-yellow-900/20',
};

const RARITY_MULTIPLIER = {
  common: 1,
  rare: 3,
  epic: 6,
  legendary: 12
};

const RARITY_LABELS = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

const TYPE_LABELS: Record<string, string> = {
  weapon: 'Broń',
  helmet: 'Hełm',
  armor: 'Pancerz',
  gloves: 'Rękawice',
  boots: 'Buty',
  ring1: 'Pierścień',
  ring2: 'Pierścień',
  necklace: 'Naszyjnik',
  artifact: 'Artefakt',
  accessory: 'Artefakt',
};

export function EquipmentPanel() {
  const { player, setPlayer } = usePlayer();
  const [filter, setFilter] = useState<'all' | EquipmentSlotId>('all');
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null);

  // Multi-step survey for rolling loot
  const [lootSurveyStep, setLootSurveyStep] = useState<number>(-1);
  const [lootResult, setLootResult] = useState<Equipment | null>(null);

  if (!player) return null;

  const equipItem = (item: Equipment) => {
    setPlayer(equipItemForPlayer(player, item));
    setSelectedItem(item);
  };

  const unequipItem = (type: EquipmentSlotId) => {
    setPlayer(unequipSlot(player, type));
  };

  const repairAll = () => {
    let cost = 0;
    const newInventory = player.inventory.map(item => {
      const damage = item.maxDurability - item.durability;
      if (damage > 0) {
        cost += damage;
        return { ...item, durability: item.maxDurability };
      }
      return item;
    });

    const newEquipment = { ...player.equipment };
    EQUIPMENT_SLOT_DEFINITIONS.forEach(({ id }) => {
      const item = newEquipment[id];
      if (item) {
        const damage = item.maxDurability - item.durability;
        if (damage > 0) {
          cost += damage;
          newEquipment[id] = { ...item, durability: item.maxDurability };
        }
      }
    });

    if (cost > 0 && player.gold >= cost) {
      setPlayer({ ...player, inventory: newInventory, equipment: newEquipment, gold: player.gold - cost });
    }
  };

  const calculateRepairCost = () => {
    let cost = 0;
    player.inventory.forEach(item => cost += (item.maxDurability - item.durability));
    EQUIPMENT_SLOT_DEFINITIONS.forEach(({ id }) => {
      if (player.equipment[id]) cost += (player.equipment[id]!.maxDurability - player.equipment[id]!.durability);
    });
    return cost;
  };

  const sellItem = (item: Equipment) => {
    // Generate a sell price based on rarity and bonus
    const rarityString = item.rarity || 'common';
    const mult = RARITY_MULTIPLIER[rarityString as keyof typeof RARITY_MULTIPLIER] || 1;
    const price = Math.floor(item.bonusValue * mult * 2) + 10;
    
    const newInventory = player.inventory.filter(i => i.id !== item.id);
    setPlayer({ ...player, inventory: newInventory, gold: player.gold + price });
    if (selectedItem?.id === item.id) setSelectedItem(null);
  };

  const startLootSequence = () => {
    if (player.gold >= 100) {
      setLootSurveyStep(0);
    }
  };

  const nextLootStep = (choice: string) => {
    if (choice === 'no') {
      setLootSurveyStep(-1);
      return;
    }
    
    if (lootSurveyStep === 0) {
      setLootSurveyStep(1);
    } else if (lootSurveyStep === 1) {
      setLootSurveyStep(2);
      rollLoot();
    } else if (lootSurveyStep === 2) {
      setLootSurveyStep(-1);
      setLootResult(null);
    }
  };

  const rollLoot = () => {
    setPlayer({ ...player, gold: player.gold - 100 });
    const types: EquipmentSlotId[] = ['weapon', 'helmet', 'armor', 'gloves', 'boots', 'ring1', 'ring2', 'necklace', 'artifact'];
    const stats: Array<keyof PlayerState["stats"]> = ['STR', 'VITALITY', 'AGILITY', 'INTELLIGENCE', 'SENSE'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomStat = stats[Math.floor(Math.random() * stats.length)];
    
    // Rarity logic
    const r = Math.random();
    let rarity: 'common' | 'rare' | 'epic' | 'legendary' = 'common';
    if (r > 0.95) rarity = 'legendary';
    else if (r > 0.8) rarity = 'epic';
    else if (r > 0.5) rarity = 'rare';

    const bMult = RARITY_MULTIPLIER[rarity];

    const names = {
      weapon: ['Sztylet Kasaki', 'Miecz Rycerza', 'Łuk Cienia', 'Zatrute Ostrze'],
      helmet: ['Hełm Cienia', 'Maska Łowcy', 'Korona Bramy'],
      armor: ['Pancerz Niskiego Rangą', 'Skórzana Kurtka', 'Płaszcz Cieni', 'Kevlar'],
      gloves: ['Rękawice Cienia', 'Karwasze Siły', 'Uchwyty Systemu'],
      boots: ['Buty Bramy', 'Nagolenniki Sprintu', 'Kroki Cienia'],
      ring1: ['Pierścień Zwinności', 'Sygnet Podbicia'],
      ring2: ['Pierścień Many', 'Sygnet Cienia'],
      necklace: ['Naszyjnik Mocy', 'Łańcuch Runiczny'],
      artifact: ['Oko Strażnika', 'Rdzeń Bramy', 'Relikt Monarchy'],
    };
    
    const newItem: Equipment = {
      id: crypto.randomUUID(),
      name: names[randomType][Math.floor(Math.random() * names[randomType].length)],
      type: randomType,
      rarity: rarity,
      bonusType: randomStat,
      bonusValue: (Math.floor(Math.random() * 5) + 1) * bMult,
      durability: 100,
      maxDurability: 100
    };

    setLootResult(newItem);
    setPlayer({ ...player, gold: player.gold - 100, inventory: [...player.inventory, newItem] });
  };

  const filteredInventory = player.inventory
    .filter(item => filter === 'all' ? true : getCompatibleSlots(item).includes(filter))
    .sort((a, b) => b.bonusValue - a.bonusValue);

  const repairCost = calculateRepairCost();
  const previewItem = selectedItem || Object.values(player.equipment).find(Boolean) || filteredInventory[0] || null;

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      
      {/* System Survey Modals */}
      <AnimatePresence>
        {lootSurveyStep !== -1 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-950 border-2 border-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.5)] w-full max-w-sm rounded-lg p-6 relative"
            >
              <h2 className="text-xl font-black text-blue-400 uppercase tracking-widest mb-4 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]">
                [Wiadomość Systemu]
              </h2>
              
              {lootSurveyStep === 0 && (
                <>
                  <p className="text-zinc-300 font-mono text-sm leading-relaxed mb-8">
                    Znalazłeś tajemniczą Pudełko Niespodziankę w strefie cienia. Czy spróbujesz je otworzyć? 
                    <br/><br/>
                    Opanowanie ciekawości w Lochu graniczy z cudem.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button onClick={() => nextLootStep('yes')} className="bg-blue-900/40 border border-blue-500 py-3 uppercase font-bold tracking-widest text-blue-200 hover:bg-blue-600 active:scale-95 transition-all text-xs rounded-sm shadow-[0_0_10px_rgba(37,99,235,0.3)]">
                      Dalej
                    </button>
                    <button onClick={() => nextLootStep('no')} className="bg-zinc-900 border border-zinc-700 py-3 uppercase font-bold tracking-widest text-zinc-400 hover:bg-zinc-800 active:scale-95 transition-all text-xs rounded-sm">
                      Zignoruj Mówiąc Nie
                    </button>
                  </div>
                </>
              )}

              {lootSurveyStep === 1 && (
                <>
                  <p className="text-red-400 font-mono text-sm leading-relaxed mb-8">
                    <span className="font-bold underline text-red-500">Ostrzeżenie:</span> Przedmioty Gacha nie zawsze sprzyjają słabym naczyniom. Jesteś absolutnie pewien swojej szczęśliwej aury?
                  </p>
                  <div className="flex flex-col gap-3">
                    <button onClick={() => nextLootStep('yes')} className="bg-emerald-900/40 border border-emerald-500 py-3 uppercase font-bold tracking-widest text-emerald-200 hover:bg-emerald-600 active:scale-95 transition-all text-xs rounded-sm shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                      POTWIERDZAM WPROWADZENIE ENERGII
                    </button>
                  </div>
                </>
              )}

              {lootSurveyStep === 2 && lootResult && (
                <>
                  <div className="flex flex-col items-center justify-center py-6 gap-4">
                    <ItemModel item={lootResult} size="lg" />
                    <p className="text-blue-300 font-bold uppercase tracking-widest text-sm text-center">NOWY PRZEDMIOT</p>
                    <div className="text-center bg-black/50 w-full p-4 border border-zinc-800 rounded-sm">
                      <p className="font-black text-xl text-yellow-400 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]">{lootResult.name}</p>
                      <p className="text-zinc-400 text-xs mt-2 uppercase">Typ: {lootResult.type}</p>
                      <p className="text-blue-400 font-bold mt-1 uppercase text-sm">+{lootResult.bonusValue} {lootResult.bonusType}</p>
                    </div>
                  </div>
                  <button onClick={() => nextLootStep('close')} className="w-full bg-blue-600 border border-blue-400 py-3 uppercase font-black tracking-widest text-white active:scale-95 transition-all text-xs rounded-sm shadow-[0_0_20px_rgba(37,99,235,0.8)]">
                    Zaakceptuj Dar
                  </button>
                </>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center gap-2 flex-wrap">
        <h2 className="text-lg font-black uppercase tracking-widest text-zinc-100 flex items-center gap-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
          <Shield className="w-5 h-5 text-blue-500" />
          Wyposażenie
        </h2>
        <div className="flex gap-2 items-center flex-wrap">
          <span className="bg-zinc-950 px-2 py-1 rounded-sm border border-zinc-800 text-yellow-400 font-bold uppercase tracking-widest text-[10px] flex items-center gap-1 shadow-inner">
             Gold: <span className="text-white text-xs">{player.gold}</span>
          </span>
          <button 
            onClick={repairAll}
            disabled={repairCost === 0 || player.gold < repairCost}
            className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm border border-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            Naprawa (-{repairCost}G)
          </button>
          <button 
            onClick={startLootSequence}
            disabled={player.gold < 100}
            className="text-[10px] bg-blue-900/50 hover:bg-blue-600 text-blue-300 font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm border border-blue-800 transition-colors shadow-[0_0_10px_rgba(30,58,138,0.5)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Szukaj Skarbu (100G)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 border-b border-blue-900/50 bg-[linear-gradient(rgba(34,211,238,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.035)_1px,transparent_1px)] bg-[size:28px_28px] p-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {EQUIPMENT_SLOT_DEFINITIONS.map((slot) => (
            <EquipmentSlot
              key={slot.id}
              type={slot.id}
              label={slot.label}
              item={player.equipment[slot.id]}
              onSelect={() => player.equipment[slot.id] && setSelectedItem(player.equipment[slot.id])}
              onUnequip={() => unequipItem(slot.id)}
              icon={slot.id === 'weapon' ? <Sword className="w-6 h-6 text-zinc-600" /> : slot.id === 'armor' ? <Shield className="w-6 h-6 text-zinc-600" /> : <Gem className="w-6 h-6 text-zinc-600" />}
            />
          ))}
        </div>
        <ItemInspect item={previewItem} />
      </div>

      <div className="p-4 overflow-y-auto flex-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Plecak / Inwentarz</h3>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-sm p-1">
              <Filter className="w-3 h-3 text-zinc-500 mx-2" />
              {(['all', 'weapon', 'armor', 'artifact'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-sm transition-colors ${
                    filter === f ? 'bg-zinc-800 text-zinc-200 shadow-sm' : 'text-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  {f === 'all' ? 'Wszys.' : f === 'weapon' ? 'Broń' : f === 'armor' ? 'Panc.' : 'Rel.'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredInventory.length === 0 ? (
           <div className="text-center py-10">
             <p className="text-zinc-600 font-mono text-xs uppercase tracking-widest">Plecak jest pusty.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredInventory.map(item => {
              const rarityString = item.rarity || 'common';
              const rColor = RARITY_COLORS[rarityString as keyof typeof RARITY_COLORS];
              
              return (
              <div key={item.id} className={`sl-equipment-card border-2 p-3 transition-colors relative group shadow-lg ${rColor} ${selectedItem?.id === item.id ? 'ring-1 ring-cyan-300/80' : ''}`} onClick={() => setSelectedItem(item)}>
                <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3">
                  <div className="sl-inventory-model-cell">
                    <ItemModel item={item} size="sm" />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="font-mono text-[9px] uppercase tracking-widest opacity-70">{RARITY_LABELS[rarityString as keyof typeof RARITY_LABELS]}</span>
                      <span className="font-mono text-[9px] uppercase tracking-widest opacity-70">{TYPE_LABELS[item.type]}</span>
                    </div>
                    <p className="font-black text-xs tracking-wider uppercase mb-2 leading-tight text-zinc-100">{item.name}</p>
                    <div className="flex justify-between items-center bg-black/45 border border-current/20 px-2 py-1 rounded-sm">
                      <span className="text-[9px] uppercase tracking-widest opacity-80">{item.bonusType}</span>
                      <span className="text-[10px] font-bold uppercase">+{item.bonusValue}</span>
                    </div>
                  </div>
                </div>

                <div className="w-full mt-3 self-end flex gap-1">
                    <button 
                      type="button"
                      onClick={() => equipItem(item)}
                      className="flex-1 bg-black/50 hover:bg-white/20 border py-1.5 uppercase text-[10px] font-black tracking-widest transition-all active:scale-95 rounded-sm"
                    >
                      Załóż
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        const repaired = { ...item, durability: item.maxDurability };
                        const newInventory = player.inventory.map((entry) => entry.id === item.id ? repaired : entry);
                        const cost = item.maxDurability - item.durability;
                        if (cost > 0 && player.gold >= cost) setPlayer({ ...player, inventory: newInventory, gold: player.gold - cost });
                      }}
                      disabled={item.durability >= item.maxDurability || player.gold < item.maxDurability - item.durability}
                      className="flex bg-black/50 hover:bg-cyan-900/50 text-cyan-300 border border-cyan-900/50 p-1.5 items-center justify-center transition-all active:scale-95 rounded-sm disabled:opacity-35"
                      title="Napraw przedmiot"
                    >
                      <Wrench className="w-3 h-3" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => sellItem(item)}
                      className="flex bg-black/50 hover:bg-red-900/50 text-red-400 border border-red-900/50 p-1.5 items-center justify-center transition-all active:scale-95 rounded-sm"
                      title={`Sprzedaj za ${Math.floor(item.bonusValue * (RARITY_MULTIPLIER[rarityString as keyof typeof RARITY_MULTIPLIER] || 1) * 2) + 10} Gold`}
                    >
                      <Coins className="w-3 h-3" />
                    </button>
                </div>
                <div className="w-full h-1 bg-zinc-800 mt-2 rounded-full overflow-hidden">
                  <div className={`h-full ${item.durability > 20 ? 'bg-zinc-500' : 'bg-red-500 animate-pulse'}`} style={{ width: `${(item.durability / item.maxDurability) * 100}%`}}></div>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}

function EquipmentSlot({
  label,
  item,
  onUnequip,
  onSelect,
  icon,
}: {
  key?: React.Key;
  type: EquipmentSlotId;
  label: string;
  item: Equipment | null;
  onUnequip: () => void;
  onSelect: () => void;
  icon: React.ReactNode;
}) {
  const rarityString = item?.rarity || 'common';
  const rColor = RARITY_COLORS[rarityString as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;

  return (
    <div onClick={onSelect} className={`sl-equipment-slot bg-zinc-950 border-2 border-zinc-800 p-4 text-center hover:border-zinc-700 transition-colors relative group min-h-52 flex flex-col items-center justify-center shadow-inner ${item ? rColor : ''}`}>
      <div className="text-[10px] font-bold uppercase tracking-widest absolute top-2 left-0 w-full text-center opacity-70">
        [{label}]
      </div>
      
      {item ? (
        <div className="flex flex-col items-center w-full mt-2 pb-9">
          <div className="sl-equipped-model-cell">
            <ItemModel item={item} size="sm" />
          </div>
          <p className="font-black mb-1 mt-2 text-sm uppercase tracking-wide px-1 drop-shadow-md">{item.name}</p>
          <span className="bg-black/50 border border-current text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm inline-block shadow-[0_0_10px_rgba(0,0,0,0.5)]">
            +{item.bonusValue} {item.bonusType}
          </span>
          <p className="text-[8px] font-mono mt-2 opacity-50 uppercase tracking-widest">{item.durability}/{item.maxDurability} WTZ</p>

          <button 
            onClick={onUnequip}
            className="absolute bottom-2 bg-red-950 text-red-500 hover:bg-red-900 hover:text-white mt-2 px-3 py-1.5 text-[9px] uppercase tracking-widest font-black transition-all border border-red-900 rounded-sm active:scale-95 shadow-lg block opacity-100"
          >
            Zdejmij
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-3 opacity-55 drop-shadow-lg">
          <div className="sl-empty-item-model">{icon}</div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">Pusty slot</span>
        </div>
      )}
    </div>
  );
}

function ItemInspect({ item }: { item: Equipment | null }) {
  if (!item) {
    return (
      <div className="sl-frame flex min-h-52 flex-col items-center justify-center p-4 text-center">
        <Box className="mb-3 h-8 w-8 text-zinc-700" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">Brak wybranego przedmiotu</p>
      </div>
    );
  }

  const rarityString = item.rarity || 'common';
  return (
    <div className={`sl-frame sl-item-inspect sl-rarity-${rarityString} min-h-52 p-4`}>
      <div className="mb-3 flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-widest">
        <span className="text-cyan-400">Podgląd Reliktu</span>
        <span className="text-zinc-500">{RARITY_LABELS[rarityString as keyof typeof RARITY_LABELS]}</span>
      </div>
      <div className="grid grid-cols-[104px_minmax(0,1fr)] items-center gap-4">
        <ItemModel item={item} size="lg" />
        <div className="min-w-0">
          <h3 className="text-lg font-black uppercase tracking-widest text-zinc-100">{item.name}</h3>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-zinc-500">{TYPE_LABELS[item.type]} · {item.durability}/{item.maxDurability} WTZ</p>
          <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-[10px] uppercase tracking-widest">
            <div className="border border-blue-900/60 bg-black/45 p-2 text-cyan-300">+{item.bonusValue} {item.bonusType}</div>
            <div className="border border-blue-900/60 bg-black/45 p-2 text-zinc-400">Sprzedaż {Math.floor(item.bonusValue * (RARITY_MULTIPLIER[rarityString as keyof typeof RARITY_MULTIPLIER] || 1) * 2) + 10}G</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemModel({ item, size = 'md' }: { item: Equipment; size?: 'sm' | 'md' | 'lg' }) {
  const rarityString = item.rarity || 'common';
  const [modelFailed, setModelFailed] = useState(false);
  const modelSrc = getItemModelSrc(item);

  return (
    <div className={`sl-item-model sl-item-${item.type} sl-rarity-${rarityString} sl-item-size-${size}`} aria-hidden="true">
      <span className="sl-item-aura" />
      {!modelFailed ? (
        <img src={modelSrc} alt="" draggable={false} onError={() => setModelFailed(true)} className="sl-item-model-image" />
      ) : (
        <>
          <span className="sl-item-silhouette" />
          <span className="sl-item-core" />
        </>
      )}
    </div>
  );
}
