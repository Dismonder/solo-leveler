import { usePlayer } from '../context/PlayerContext';
import { Sparkles, Lock, Zap } from 'lucide-react';
import { AVAILABLE_SKILLS } from '../game/skillSystem';

export function SkillTree() {
  const { player, setPlayer } = usePlayer();

  if (!player) return null;

  const unlockSkill = (skillId: string) => {
    if (player.skillPoints > 0 && !player.skills.includes(skillId)) {
      setPlayer({
        ...player,
        skills: [...player.skills, skillId],
        skillPoints: player.skillPoints - 1
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center">
        <h2 className="text-lg font-bold uppercase tracking-widest text-zinc-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          Drzewko Umiejętności
        </h2>
        <span className="bg-blue-900/40 text-blue-300 text-xs px-2 py-1 rounded-sm border border-blue-800 animate-pulse">
          Punkty Umiejętności: {player.skillPoints}
        </span>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        {AVAILABLE_SKILLS.map((skill) => {
          const isUnlocked = player.skills.includes(skill.id);
          const hasLevel = player.level >= skill.requiredLevel;
          const hasStats = player.stats[skill.reqStat as keyof typeof player.stats] >= skill.reqAmount;
          const canUnlock = !isUnlocked && hasLevel && hasStats && player.skillPoints > 0;

          return (
            <div 
              key={skill.id} 
              className={`p-4 rounded-sm border transition-all duration-300 ${
                isUnlocked 
                  ? 'bg-blue-950/20 border-blue-800 shadow-[0_0_15px_rgba(30,58,138,0.3)]' 
                  : canUnlock 
                    ? 'bg-zinc-900 border-zinc-700 hover:border-blue-500/50 cursor-pointer' 
                    : 'bg-zinc-950 border-zinc-800 opacity-60'
              }`}
              onClick={() => canUnlock && unlockSkill(skill.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-sm border ${isUnlocked ? 'bg-blue-900 border-blue-700 text-blue-200' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>
                    {(!hasLevel || !hasStats) ? <Lock className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className={`font-bold uppercase tracking-wider text-sm ${isUnlocked ? 'text-blue-300' : 'text-zinc-300'}`}>
                      {skill.name}
                    </h3>
                  </div>
                </div>
                {isUnlocked ? (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-950/50 px-2 py-1 rounded-sm border border-blue-900/50">
                    Oblokowane
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 bg-zinc-900 px-2 py-1 rounded-sm flex flex-col items-end gap-1">
                    {!hasLevel && <span className="text-red-400">Poziom {skill.requiredLevel}</span>}
                    {hasLevel && <span className="text-green-500/50">Poziom {skill.requiredLevel} OK</span>}
                    {!hasStats && <span className="text-red-400">Wym. {skill.reqAmount} {skill.reqStat}</span>}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-2">{skill.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
