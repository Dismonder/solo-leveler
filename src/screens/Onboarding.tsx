import React, { useState } from "react";
import { motion } from "motion/react";
import { usePlayer } from "../context/PlayerContext";
import { awakenPlayerAnswers } from "../services/systemService";
import { INITIAL_PLAYER, PlayerState } from "../types";
import { Loader2 } from "lucide-react";
import { recalculateMaxStats } from "../game/playerMath";

const CLASSES = ["Wojownik", "Zabójca", "Mag", "Tank", "Łucznik", "Support"];
type PlayerStats = PlayerState["stats"];
type PlayerStatKey = keyof PlayerStats;

const AWAKENING_QUESTIONS: Array<{
  q: string;
  a: Array<{ t: string; stat: PlayerStatKey }>;
}> = [
  {
    q: "Gdy stajesz przed bramą lochu, co robisz?",
    a: [
      { t: "Wyważam ją z kopa.", stat: "STR" },
      { t: "Sprawdzam pułapki i zapach z wnętrza.", stat: "SENSE" },
      { t: "Rzucam zaklęcie badawcze.", stat: "INTELLIGENCE" },
    ]
  },
  {
    q: "Goni cię ogar cieni. Odwracasz się i...",
    a: [
      { t: "Blokuję jego cios ciałem.", stat: "VITALITY" },
      { t: "Unikam ataku szukając martwego punktu.", stat: "AGILITY" },
      { t: "Zgniatam go gołymi rękami.", stat: "STR" },
    ]
  },
  {
    q: "Sojusznik upada podczas walki z bossem. Twoja reakcja?",
    a: [
      { t: "Doskakuję do niego w ułamku sekundy.", stat: "AGILITY" },
      { t: "Wzmacniam tarczę aby przyjąć area of effect.", stat: "VITALITY" },
      { t: "Koncentruję manę na leczeniu i osłonach.", stat: "INTELLIGENCE" },
    ]
  },
  {
    q: "Otwierasz złotą skrzynię - jest zamknięta na zamek.",
    a: [
      { t: "Rozbijam wieko bronią.", stat: "STR" },
      { t: "Badam mechanizm z zamkniętymi oczami.", stat: "SENSE" },
      { t: "Roztrzaskuję zamek zaklęciem kinetycznym.", stat: "INTELLIGENCE" },
    ]
  },
  {
    q: "Walka trwa piątą godzinę. Co czujesz?",
    a: [
      { t: "Potrafię znieść znacznie więcej bólu.", stat: "VITALITY" },
      { t: "Moje zmysły wyostrzają się, widzę każdy ruch.", stat: "SENSE" },
      { t: "Nadal jestem nieuchwytny dla wrogów.", stat: "AGILITY" },
    ]
  }
];

export function Onboarding() {
  const { setPlayer } = usePlayer();
  const [name, setName] = useState("");
  const [jobClass, setJobClass] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("[Analiza Naczynia...]");
  const [step, setStep] = useState(0); 
  const [error, setError] = useState("");

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length > 0) {
      setStep(1);
    }
  };

  const handleClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jobClass) {
      setStep(2);
    }
  };

  const handleStatsSubmit = async (finalStats: PlayerStats) => {
    setStep(3);
    setLoadingMessage("[Łączenie z SYSTEMEM...]");
    setError("");

    try {
      setLoadingMessage("[Wyznaczanie Klasy i Rangi...]");
      const { assessment, avatarUrl } = await awakenPlayerAnswers(name, jobClass, finalStats);

      const awakenedPlayer = {
        ...INITIAL_PLAYER,
        name,
        avatarUrl,
        jobClass: assessment.jobClass,
        rank: assessment.rank,
        stats: finalStats, // Use exact chosen stats
        level: 1,
        xp: 0
      };
      const { maxHp, maxMp } = recalculateMaxStats(awakenedPlayer);

      setPlayer({
        ...awakenedPlayer,
        maxHp,
        maxMp,
        hp: maxHp,
        mp: maxMp,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Brak autoryzacji do Systemu Przebudzenia.");
      setStep(2);
    }
  };

  return (
    <div className="h-full bg-black text-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md relative z-10">
        
        {step === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-blue-900 p-8 rounded-sm shadow-[0_0_15px_rgba(30,58,138,0.5)]"
          >
            <h2 className="text-2xl font-bold mb-6 tracking-widest text-center uppercase text-blue-400">
              [Inicjalizacja Systemu]
            </h2>
            <p className="mb-6 text-sm text-zinc-400 text-center">
              Podaj swoje imię, potencjalny Łowco Bram.
            </p>
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Imię..."
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-blue-500 rounded-sm p-3 text-cyan-50 outline-none transition-colors"
                autoFocus
              />
              <button 
                type="submit"
                disabled={!name.trim()}
                className="w-full bg-blue-900 hover:bg-blue-800 text-blue-100 font-bold py-3 uppercase tracking-widest transition-colors disabled:opacity-50"
              >
                Dalej
              </button>
            </form>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-blue-900 p-8 rounded-sm shadow-[0_0_15px_rgba(30,58,138,0.5)]"
          >
            <h2 className="text-xl font-bold mb-6 tracking-widest text-center uppercase text-blue-400">
              [Wybór Ścieżki]
            </h2>
            <p className="mb-6 text-sm text-zinc-400 text-center">
              Określ swój preferowany styl walki z potworami.
            </p>
            <form onSubmit={handleClassSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {CLASSES.map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setJobClass(cls)}
                    className={`py-3 px-2 border rounded-sm tracking-widest font-bold uppercase text-xs transition-colors ${jobClass === cls ? 'bg-blue-900 border-blue-400 text-white' : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:border-blue-500'}`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
              <button 
                type="submit"
                disabled={!jobClass}
                className="w-full mt-4 bg-blue-900 hover:bg-blue-800 text-blue-100 font-bold py-3 uppercase tracking-widest transition-colors disabled:opacity-50"
              >
                Dalej
              </button>
            </form>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-blue-900 p-8 rounded-sm shadow-[0_0_15px_rgba(30,58,138,0.5)]"
          >
            <h2 className="text-xl font-bold mb-4 tracking-widest text-center uppercase text-blue-400">
              [Test Przebudzenia]
            </h2>
            <p className="mb-6 text-xs text-zinc-400 text-center uppercase">
              System musi zrozumieć Twoją duszę. Odpowiedz na 5 pytań.
            </p>

            <Questionnaire onComplete={(assignedStats) => {
              handleStatsSubmit(assignedStats);
            }} />

            {error && (
              <div className="mt-4 text-red-500 text-xs px-2 uppercase font-bold text-center">
                BŁĄD: {error}
              </div>
            )}
            
            <button
               onClick={() => {
                 setStep(3);
                 setLoadingMessage("[Konfiguracja ręczna...]");
                 skipAwakening(name, setPlayer);
               }}
               className="w-full mt-4 text-zinc-500 hover:text-zinc-300 text-xs tracking-wider uppercase font-bold transition-colors"
            >
              [Pomiń System i użyj domyślnych]
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="relative mb-8">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
              <div className="absolute inset-0 blur-lg bg-blue-500/20 animate-pulse"></div>
            </div>
            <h2 className="text-xl font-bold tracking-widest uppercase text-blue-400 animate-pulse">
              {loadingMessage}
            </h2>
            <p className="mt-4 text-zinc-400 text-xs uppercase tracking-[0.2em] opacity-60">
              System wyznacza twój prawdziwy potencjał.
            </p>
          </motion.div>
        )}

      </div>

      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}

function Questionnaire({ onComplete }: { onComplete: (stats: PlayerStats) => void }) {
  const [qIndex, setQIndex] = useState(0);
  const [tempStats, setTempStats] = useState<PlayerStats>({ STR: 0, VITALITY: 0, AGILITY: 0, INTELLIGENCE: 0, SENSE: 0 });

  const handleAnswer = (stat: PlayerStatKey) => {
    const newStats = { ...tempStats, [stat]: tempStats[stat] + 10 };
    setTempStats(newStats);
    
    if (qIndex < AWAKENING_QUESTIONS.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      onComplete(newStats);
    }
  };

  const q = AWAKENING_QUESTIONS[qIndex];

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2">
       <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-2">Pytanie {qIndex + 1}/{AWAKENING_QUESTIONS.length}</span>
       <h3 className="text-blue-100 font-bold mb-6 min-h-[40px] leading-relaxed">{q.q}</h3>
       
       <div className="space-y-3">
         {q.a.map((ans, i) => (
           <button 
             key={i} 
             onClick={() => handleAnswer(ans.stat)}
             className="w-full text-left p-4 bg-zinc-950 border border-zinc-800 hover:border-blue-500 hover:bg-zinc-900 transition-colors text-sm text-zinc-300 font-medium"
           >
             {ans.t}
           </button>
         ))}
       </div>
    </div>
  )
}

async function skipAwakening(name: string, setPlayer: (player: PlayerState | null) => Promise<void>) {
  const skippedPlayer = {
    ...INITIAL_PLAYER,
    name,
    avatarUrl: "",
    jobClass: "Najemnik",
    rank: "E-Rank",
    level: 1,
    xp: 0
  };
  const { maxHp, maxMp } = recalculateMaxStats(skippedPlayer);

  setPlayer({
    ...skippedPlayer,
    maxHp,
    maxMp,
    hp: maxHp,
    mp: maxMp,
  });
}
