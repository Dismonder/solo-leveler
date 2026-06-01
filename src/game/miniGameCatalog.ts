import type { RankLetter } from "../services/systemLogic";
import type { MiniGameId } from "./miniGameProgress";

export type MiniGameDefinition = {
  id: MiniGameId;
  title: string;
  shortTitle: string;
  requiredRank: RankLetter;
  statHint: "STR" | "VITALITY" | "AGILITY" | "INTELLIGENCE" | "SENSE";
  summary: string;
  shortGoal: string;
  readyTips: string[];
  pauseTips: string[];
  mechanic: string;
  winScore: number;
  preferredOrientation: "landscape" | "portrait";
  allowPortraitFallback: boolean;
};

export const MINI_GAME_CATALOG: MiniGameDefinition[] = [
  {
    id: "gate-dodge",
    title: "Brama refleksu",
    shortTitle: "Brama",
    requiredRank: "E",
    statHint: "AGILITY",
    summary: "Dotykaj rdzenie many, omijaj czerwone pułapki i utrzymuj czas bramy.",
    shortGoal: "Trafiaj niebieskie rdzenie. Czerwone pułapki zabierają czas i combo.",
    readyTips: [
      "Najpierw patrz na czerwone pułapki, dopiero potem klikaj rdzeń.",
      "Szybkie trafienia dają więcej punktów, ale bonus czasu ma limit.",
      "Kliknięcie poza rdzeniem też kosztuje czas, więc nie spamuj ekranu.",
    ],
    pauseTips: [
      "Pułapki pojawiają się bliżej rdzenia, gdy wynik rośnie.",
      "Utrzymuj combo krótkimi, pewnymi kliknięciami.",
      "Jeśli ekran jest mały, graj poziomo. Masz więcej miejsca na pułapki.",
    ],
    mechanic: "Szybka reakcja",
    winScore: 120,
    preferredOrientation: "landscape",
    allowPortraitFallback: true,
  },
  {
    id: "mana-memory",
    title: "Sekwencja many",
    shortTitle: "Mana",
    requiredRank: "D",
    statHint: "INTELLIGENCE",
    summary: "Zapamiętaj kolejność run i powtórz ją bez pomyłki.",
    shortGoal: "Zapamiętaj sekwencję run i odtwórz ją po sygnale Systemu.",
    readyTips: [
      "Nie klikaj podczas prezentacji sekwencji.",
      "Dziel długą sekwencję na pary znaków.",
      "Błąd skraca czas, ale nie kończy próby od razu.",
    ],
    pauseTips: [
      "Po pauzie System pokaże sekwencję jeszcze raz.",
      "Wysoki poziom przyspiesza błyski run.",
      "Skup się na rytmie, nie tylko na symbolach.",
    ],
    mechanic: "Pamięć i rytm",
    winScore: 160,
    preferredOrientation: "portrait",
    allowPortraitFallback: true,
  },
  {
    id: "shadow-strike",
    title: "Cięcie cienia",
    shortTitle: "Cień",
    requiredRank: "C",
    statHint: "STR",
    summary: "Uderzaj w oknie trafienia, gdy wskaźnik przechodzi przez słaby punkt.",
    shortGoal: "Uderzaj wtedy, gdy wskaźnik przechodzi przez słaby punkt.",
    readyTips: [
      "Perfekcyjne trafienie daje największy bonus czasu.",
      "Nie wciskaj cięcia poza oknem. Kara rośnie razem z poziomem.",
      "Patrz na środek strefy, nie na sam przycisk.",
    ],
    pauseTips: [
      "Wysokie combo zwęża margines błędu.",
      "Dobry timing jest ważniejszy niż szybkie klikanie.",
      "Jeśli wskaźnik jest za szybki, poczekaj jeden cykl.",
    ],
    mechanic: "Timing ataku",
    winScore: 260,
    preferredOrientation: "portrait",
    allowPortraitFallback: true,
  },
  {
    id: "rune-lock",
    title: "Zamek runiczny",
    shortTitle: "Runy",
    requiredRank: "B",
    statHint: "SENSE",
    summary: "Otwórz pieczęć, wciskając znaki w pokazanej kolejności.",
    shortGoal: "Wciskaj runy dokładnie w kolejności pokazanej przez pieczęć.",
    readyTips: [
      "Czytaj kod od lewej do prawej i klikaj bez pośpiechu.",
      "Błędny znak zabiera czas, ale nie resetuje całego kodu.",
      "Im wyższy wynik, tym dłuższy kod pieczęci.",
    ],
    pauseTips: [
      "Po pauzie kod zostaje taki sam.",
      "Zacznij od pierwszej niepodświetlonej runy.",
      "Nie próbuj zgadywać. Kara czasu jest większa na wysokim poziomie.",
    ],
    mechanic: "Sekwencja presji",
    winScore: 220,
    preferredOrientation: "portrait",
    allowPortraitFallback: true,
  },
  {
    id: "shadow-extraction",
    title: "Ekstrakcja cienia",
    shortTitle: "Ekstrakcja",
    requiredRank: "A",
    statHint: "SENSE",
    summary: "Rozpoznaj prawdziwy rdzeń cienia wśród fałszywych sygnałów.",
    shortGoal: "Tnij fioletowe cienie długim gestem. Omijaj czerwone rdzenie.",
    readyTips: [
      "Tnij długim ruchem przez środek cienia.",
      "Jedno cięcie może złapać kilka prawdziwych cieni naraz.",
      "Czerwone rdzenie zabierają czas i resetują combo.",
    ],
    pauseTips: [
      "Najlepsze cięcia są ukośne i przechodzą przez cały cel.",
      "Fałszywe cienie psują rytm, ale prawdziwe dają combo.",
      "Efekt cięcia jest kosmetyczny. Wynik robi precyzja gestu.",
    ],
    mechanic: "Analiza celu",
    winScore: 240,
    preferredOrientation: "landscape",
    allowPortraitFallback: true,
  },
];

const RANK_POWER: Record<RankLetter, number> = {
  E: 0,
  D: 1,
  C: 2,
  B: 3,
  A: 4,
  S: 5,
  SS: 6,
};

export function canUseMiniGameRank(currentRank: RankLetter, requiredRank: RankLetter) {
  return RANK_POWER[currentRank] >= RANK_POWER[requiredRank];
}

export function getMiniGameDefinition(id: MiniGameId) {
  return MINI_GAME_CATALOG.find((game) => game.id === id) ?? MINI_GAME_CATALOG[0];
}
