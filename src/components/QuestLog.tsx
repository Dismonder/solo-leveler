import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import type { Quest } from '../types';
import { ScrollText, Target, CheckCircle2, Milestone } from 'lucide-react';
import { motion } from 'motion/react';

export function QuestLog() {
  const { player } = usePlayer();

  if (!player) return null;

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center gap-2">
        <h2 className="text-lg font-bold uppercase tracking-widest text-zinc-100 flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-blue-500" />
          Dziennik Zadań
        </h2>
        <span className="text-xs text-zinc-500 font-bold tracking-widest uppercase">
          Zadania Aktywne: {player.quests.filter(q => q.status === 'active').length}
        </span>
      </div>

      <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-6">
        {/* Story Quests */}
        <section>
           <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3 flex items-center gap-2 border-b border-zinc-800 pb-2">
             <Milestone className="w-4 h-4" /> Główne Zadania Fabularne
           </h3>
           <div className="space-y-3">
             {player.quests.filter(q => q.type === 'story').map(quest => (
               <QuestCard key={quest.id} quest={quest} />
             ))}
             {player.quests.filter(q => q.type === 'story').length === 0 && (
                 <p className="text-zinc-600 text-sm italic">Brak aktualnych zadań fabularnych.</p>
             )}
           </div>
        </section>

        {/* Side Quests */}
        <section>
           <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-2 border-b border-zinc-800 pb-2">
             <Target className="w-4 h-4" /> Zadania Poboczne
           </h3>
           <div className="space-y-3">
             {player.quests.filter(q => q.type === 'side').map(quest => (
               <QuestCard key={quest.id} quest={quest} />
             ))}
             {player.quests.filter(q => q.type === 'side').length === 0 && (
                 <p className="text-zinc-600 text-sm italic">Brak aktualnych zadań pobocznych.</p>
             )}
           </div>
        </section>
      </div>
    </div>
  );
}

const QuestCard: React.FC<{ quest: Quest }> = ({ quest }) => {
  const isComplete = quest.status === 'completed';
  const progressPercent = Math.min((quest.progress / quest.maxProgress) * 100, 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`p-4 rounded-sm border transition-colors ${
        isComplete ? 'bg-zinc-900 border-zinc-800 opacity-60' : 'bg-blue-950/20 border-blue-900/50 shadow-[0_0_15px_rgba(30,58,138,0.1)]'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className={`font-bold text-sm tracking-wider uppercase ${isComplete ? 'text-zinc-500' : 'text-blue-300'}`}>
          {quest.title}
        </h4>
        {isComplete ? (
           <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
           <span className="text-[10px] font-mono text-blue-400 bg-blue-900/40 px-2 py-0.5 rounded-sm border border-blue-800">AKTYWNE</span>
        )}
      </div>
      
      <p className="text-xs text-zinc-400 mb-4">{quest.description}</p>
      
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
          <span>Postęp</span>
          <span>{quest.progress} / {quest.maxProgress}</span>
        </div>
        <div className={`h-1.5 rounded-full overflow-hidden border ${isComplete ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-900 border-zinc-800'}`}>
           <div 
             className={`h-full transition-all duration-500 ${isComplete ? 'bg-zinc-600' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]'}`}
             style={{ width: `${progressPercent}%` }}
           />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-800/50 flex justify-between items-center">
         <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold">
           <span className="text-zinc-500">Nagroda:</span>
           <span className={isComplete ? 'text-zinc-400' : 'text-yellow-400'}>{quest.rewardStr}</span>
         </div>
      </div>
    </motion.div>
  );
}
