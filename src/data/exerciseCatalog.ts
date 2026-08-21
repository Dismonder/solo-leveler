import { EXERCISE_VIDEO_SEEDS } from "./exerciseVideoCatalog";

export type ExerciseDifficulty = "latwe" | "srednie" | "trudne";

export type ExerciseMedia = {
  type: "video" | "embed" | "sourceLink";
  url: string;
  sourceName: string;
  label: string;
  sourcePageUrl?: string;
};

export type ExerciseCatalogEntry = {
  id: string;
  name: string;
  category: string;
  primaryMuscles: string[];
  equipment: string;
  difficulty: ExerciseDifficulty;
  steps: string[];
  techniqueCues: string[];
  commonMistakes: string[];
  safetyNotes: string[];
  media: ExerciseMedia[];
  sourceUrls: string[];
};

type ExerciseSeed = {
  name: string;
  category: keyof typeof CATEGORY_GUIDES;
  primaryMuscles: string[];
  equipment: string;
  difficulty: ExerciseDifficulty;
  media?: ExerciseMedia[];
  sourceUrls?: string[];
};

const SOURCE_MEDIA: ExerciseMedia[] = [
  {
    type: "sourceLink",
    url: "https://www.fabrykasily.pl/atlas-cwiczen",
    sourceName: "Fabryka Sily",
    label: "Otworz pokaz w atlasie Fabryki Sily",
  },
  {
    type: "sourceLink",
    url: "https://atlas.kulturystyka.pl/",
    sourceName: "Atlas Kulturystyka",
    label: "Otworz pokaz w Atlasie Kulturystyka",
  },
  {
    type: "sourceLink",
    url: "https://www.budujmase.pl/atlas-cwiczen",
    sourceName: "BudujMase",
    label: "Otworz pokaz w atlasie BudujMase",
  },
];

const CATEGORY_GUIDES = {
  "Klatka piersiowa": {
    steps: [
      "Ustaw lopatki stabilnie i napnij brzuch zanim zaczniesz ruch.",
      "Opuszczaj cialo albo ciezar kontrolowanie, bez odbijania w dolnej fazie.",
      "Wypchnij ruch mocno, ale nie blokuj lokci agresywnie na koncu.",
    ],
    techniqueCues: ["nadgarstki pod lokciami", "klatka otwarta", "rowne tempo", "pelny zakres bez bolu barku"],
    commonMistakes: ["uciekanie lokci za szeroko", "zapadanie barkow", "skracanie dolnej fazy"],
    safetyNotes: ["Przerwij serie, jezeli czujesz klujacy bol barku albo mostka."],
  },
  "Plecy": {
    steps: [
      "Zacznij od ustawienia lopatek i neutralnego kregoslupa.",
      "Prowadz lokcie w kierunku bioder albo tulowia, zależnie od cwiczenia.",
      "Wracaj powoli, czujac rozciagniecie plecow bez puszczania kontroli.",
    ],
    techniqueCues: ["dluga szyja", "brzuch napiety", "ruch z plecow, nie z samego bicepsa", "bez szarpania"],
    commonMistakes: ["bujanie tulowiem", "garbienie plecow", "zbyt szybkie opuszczanie ciezaru"],
    safetyNotes: ["Przy martwych ciagach i wioslach zmniejsz ciezar, jesli tracisz neutralne plecy."],
  },
  "Nogi": {
    steps: [
      "Ustaw stopy stabilnie i napnij brzuch przed zejściem.",
      "Schodz kontrolowanie, prowadz kolana zgodnie z kierunkiem palcow.",
      "Wroc do gory przez nacisk calej stopy, bez zapadania kolan do srodka.",
    ],
    techniqueCues: ["ciezar na calej stopie", "kolana sledza palce", "biodra i brzuch stabilne", "kontrolowany dol"],
    commonMistakes: ["odrywanie piet", "kolana uciekaja do srodka", "polzakres bez kontroli"],
    safetyNotes: ["Nie wymuszaj glebokosci, jezeli tracisz plecy albo czujesz bol kolana."],
  },
  "Barki": {
    steps: [
      "Ustaw zebra nisko i nie wyginaj odcinka ledzwiowego.",
      "Prowadz ciezar po stabilnej linii, bez szarpania.",
      "Kontroluj powrot i utrzymuj bark w komfortowym zakresie.",
    ],
    techniqueCues: ["brzuch napiety", "lopatki stabilne", "nadgarstki neutralne", "bez unoszenia barkow do uszu"],
    commonMistakes: ["przeprost ledzwi", "szarpanie z bioder", "za duzy ciezar"],
    safetyNotes: ["Przy dyskomforcie barku skroc zakres i wybierz lzejszy wariant."],
  },
  "Ramiona": {
    steps: [
      "Ustaw lokcie stabilnie i wybierz ciezar, ktory nie wymusza bujania.",
      "Wykonaj ruch w pelnym kontrolowanym zakresie.",
      "Wroc powoli, utrzymujac napiecie miesnia do konca serii.",
    ],
    techniqueCues: ["lokcie blisko toru ruchu", "nadgarstki proste", "bez bujania tulowiem", "pelna kontrola ekscentryki"],
    commonMistakes: ["zamach cialem", "uciekanie lokci", "skracanie opuszczania"],
    safetyNotes: ["Nie prostuj lokci agresywnie pod duzym obciazeniem."],
  },
  "Brzuch i core": {
    steps: [
      "Ustaw miednice neutralnie i napnij brzuch przed pierwszym ruchem.",
      "Wykonuj ruch z centrum ciala, a nie przez szarpanie szyja.",
      "Oddychaj rytmicznie i zachowaj kontrole do konca powtorzenia.",
    ],
    techniqueCues: ["zebra nisko", "szyja neutralna", "miednica stabilna", "wolny powrot"],
    commonMistakes: ["ciagniecie glowy rekami", "zapadanie ledzwi", "zbyt szybkie tempo"],
    safetyNotes: ["Przy bolu ledzwi wybierz latwiejszy wariant antyrotacyjny albo plank."],
  },
  "Kondycja": {
    steps: [
      "Zacznij od spokojnego tempa i stabilnego oddechu.",
      "Utrzymuj rytm, ktory pozwala kontrolowac technike.",
      "Zakoncz seria wyciszajaca zamiast naglego zatrzymania.",
    ],
    techniqueCues: ["lekki krok", "aktywny brzuch", "rowny oddech", "kontrola ladowania"],
    commonMistakes: ["za szybki start", "zapadanie kolan", "utrata rytmu oddechu"],
    safetyNotes: ["Przy zawrotach glowy albo ostrym bolu przerwij aktywnosc."],
  },
  "Mobilnosc": {
    steps: [
      "Wejdz w zakres powoli i bez bolu.",
      "Utrzymaj spokojny oddech oraz kontrolowany napiecie.",
      "Poglebiaj ruch stopniowo, nie szarp zakresu.",
    ],
    techniqueCues: ["spokojny oddech", "bez sprezynowania", "kontrola pozycji", "zakres bez bolu"],
    commonMistakes: ["szarpanie", "wstrzymywanie oddechu", "uciekanie z pozycji"],
    safetyNotes: ["Mobilnosc ma dawac napiecie, nie ostry bol stawu."],
  },
  "Funkcjonalne": {
    steps: [
      "Ustaw stabilna pozycje startowa i napnij core.",
      "Polacz ruch bioder, tulowia i ramion w jednej kontrolowanej sekwencji.",
      "Wroc do pozycji startowej bez utraty rownowagi.",
    ],
    techniqueCues: ["core aktywny", "ruch plynny", "ciezar blisko ciala", "stabilne stopy"],
    commonMistakes: ["pospiech", "utrata pozycji plecow", "zbyt duzy ciezar na start"],
    safetyNotes: ["Najpierw opanuj wariant techniczny, dopiero potem przyspieszaj albo dokladaj ciezar."],
  },
} as const;

const RAW_EXERCISES: ExerciseSeed[] = [
  { name: "Pompki klasyczne", category: "Klatka piersiowa", primaryMuscles: ["klatka piersiowa", "triceps", "barki"], equipment: "masa ciala", difficulty: "latwe" },
  { name: "Pompki szerokie", category: "Klatka piersiowa", primaryMuscles: ["klatka piersiowa", "barki"], equipment: "masa ciala", difficulty: "srednie" },
  { name: "Pompki diamentowe", category: "Klatka piersiowa", primaryMuscles: ["triceps", "klatka piersiowa"], equipment: "masa ciala", difficulty: "trudne" },
  { name: "Pompki na podwyzszeniu rak", category: "Klatka piersiowa", primaryMuscles: ["klatka piersiowa"], equipment: "podwyzszenie", difficulty: "latwe" },
  { name: "Pompki z nogami na podwyzszeniu", category: "Klatka piersiowa", primaryMuscles: ["gorna klatka", "barki"], equipment: "podwyzszenie", difficulty: "srednie" },
  { name: "Pompki eksplozywne", category: "Klatka piersiowa", primaryMuscles: ["klatka piersiowa", "triceps"], equipment: "masa ciala", difficulty: "trudne" },
  { name: "Pompki archer", category: "Klatka piersiowa", primaryMuscles: ["klatka piersiowa", "core"], equipment: "masa ciala", difficulty: "trudne" },
  { name: "Pompki hindu", category: "Klatka piersiowa", primaryMuscles: ["klatka piersiowa", "barki", "core"], equipment: "masa ciala", difficulty: "srednie" },
  { name: "Pompki z pauza", category: "Klatka piersiowa", primaryMuscles: ["klatka piersiowa"], equipment: "masa ciala", difficulty: "srednie" },
  { name: "Dipy na poreczach", category: "Klatka piersiowa", primaryMuscles: ["dolna klatka", "triceps"], equipment: "porecze", difficulty: "trudne" },
  { name: "Wyciskanie sztangi lezac", category: "Klatka piersiowa", primaryMuscles: ["klatka piersiowa", "triceps"], equipment: "sztanga", difficulty: "srednie" },
  { name: "Wyciskanie hantli lezac", category: "Klatka piersiowa", primaryMuscles: ["klatka piersiowa"], equipment: "hantle", difficulty: "srednie" },
  { name: "Wyciskanie na skosie dodatnim", category: "Klatka piersiowa", primaryMuscles: ["gorna klatka", "barki"], equipment: "sztanga lub hantle", difficulty: "srednie" },
  { name: "Rozpietki z hantlami", category: "Klatka piersiowa", primaryMuscles: ["klatka piersiowa"], equipment: "hantle", difficulty: "srednie" },
  { name: "Butterfly na maszynie", category: "Klatka piersiowa", primaryMuscles: ["klatka piersiowa"], equipment: "maszyna", difficulty: "latwe" },
  { name: "Krzyzowanie linek", category: "Klatka piersiowa", primaryMuscles: ["klatka piersiowa"], equipment: "brama", difficulty: "srednie" },
  { name: "Floor press", category: "Klatka piersiowa", primaryMuscles: ["klatka piersiowa", "triceps"], equipment: "sztanga lub hantle", difficulty: "srednie" },
  { name: "Pompki na uchwytach", category: "Klatka piersiowa", primaryMuscles: ["klatka piersiowa", "triceps"], equipment: "uchwyty", difficulty: "srednie" },
  { name: "Podciaganie nachwytem", category: "Plecy", primaryMuscles: ["najszerszy grzbietu", "biceps"], equipment: "drazek", difficulty: "trudne" },
  { name: "Podciaganie podchwytem", category: "Plecy", primaryMuscles: ["najszerszy grzbietu", "biceps"], equipment: "drazek", difficulty: "srednie" },
  { name: "Podciaganie neutralne", category: "Plecy", primaryMuscles: ["plecy", "biceps"], equipment: "drazek", difficulty: "srednie" },
  { name: "Podciaganie negatywne", category: "Plecy", primaryMuscles: ["plecy"], equipment: "drazek", difficulty: "latwe" },
  { name: "Scapular pull-up", category: "Plecy", primaryMuscles: ["lopatki", "plecy"], equipment: "drazek", difficulty: "latwe" },
  { name: "Wioslowanie sztanga", category: "Plecy", primaryMuscles: ["srodek plecow", "najszerszy"], equipment: "sztanga", difficulty: "srednie" },
  { name: "Wioslowanie hantla jednoracz", category: "Plecy", primaryMuscles: ["najszerszy grzbietu"], equipment: "hantel", difficulty: "srednie" },
  { name: "Wioslowanie T-bar", category: "Plecy", primaryMuscles: ["srodek plecow"], equipment: "maszyna lub sztanga", difficulty: "srednie" },
  { name: "Wioslowanie na wyciagu siedzac", category: "Plecy", primaryMuscles: ["srodek plecow"], equipment: "wyciag", difficulty: "latwe" },
  { name: "Sciaganie drazka do klatki", category: "Plecy", primaryMuscles: ["najszerszy grzbietu"], equipment: "wyciag", difficulty: "latwe" },
  { name: "Face pull", category: "Plecy", primaryMuscles: ["tyl barku", "lopatki"], equipment: "wyciag lub guma", difficulty: "latwe" },
  { name: "Martwy ciag klasyczny", category: "Plecy", primaryMuscles: ["prostowniki", "posladki", "dwuglowe"], equipment: "sztanga", difficulty: "trudne" },
  { name: "Martwy ciag rumunski", category: "Plecy", primaryMuscles: ["dwuglowe uda", "posladki"], equipment: "sztanga lub hantle", difficulty: "srednie" },
  { name: "Hiperextensje", category: "Plecy", primaryMuscles: ["prostowniki grzbietu"], equipment: "lawka rzymska", difficulty: "latwe" },
  { name: "Pullover", category: "Plecy", primaryMuscles: ["najszerszy grzbietu", "klatka"], equipment: "hantel lub wyciag", difficulty: "srednie" },
  { name: "Inverted row", category: "Plecy", primaryMuscles: ["plecy", "biceps"], equipment: "sztanga lub TRX", difficulty: "latwe" },
  { name: "Szrugsy", category: "Plecy", primaryMuscles: ["czworoboczny"], equipment: "hantle lub sztanga", difficulty: "latwe" },
  { name: "Good morning", category: "Plecy", primaryMuscles: ["prostowniki", "dwuglowe uda"], equipment: "sztanga", difficulty: "trudne" },
  { name: "Przysiad klasyczny", category: "Nogi", primaryMuscles: ["czworoglowe", "posladki"], equipment: "masa ciala", difficulty: "latwe" },
  { name: "Przysiad goblet", category: "Nogi", primaryMuscles: ["czworoglowe", "core"], equipment: "kettlebell lub hantel", difficulty: "latwe" },
  { name: "Przysiad ze sztanga z tylu", category: "Nogi", primaryMuscles: ["czworoglowe", "posladki"], equipment: "sztanga", difficulty: "srednie" },
  { name: "Przysiad front squat", category: "Nogi", primaryMuscles: ["czworoglowe", "core"], equipment: "sztanga", difficulty: "trudne" },
  { name: "Przysiad sumo", category: "Nogi", primaryMuscles: ["przywodziciele", "posladki"], equipment: "masa ciala lub ciezar", difficulty: "srednie" },
  { name: "Przysiad bulgarski", category: "Nogi", primaryMuscles: ["czworoglowe", "posladki"], equipment: "lawka", difficulty: "trudne" },
  { name: "Wykroki w miejscu", category: "Nogi", primaryMuscles: ["czworoglowe", "posladki"], equipment: "masa ciala lub hantle", difficulty: "srednie" },
  { name: "Zakroki", category: "Nogi", primaryMuscles: ["posladki", "czworoglowe"], equipment: "masa ciala lub hantle", difficulty: "srednie" },
  { name: "Wykroki chodzone", category: "Nogi", primaryMuscles: ["nogi", "core"], equipment: "masa ciala lub hantle", difficulty: "srednie" },
  { name: "Hip thrust", category: "Nogi", primaryMuscles: ["posladki"], equipment: "lawka i sztanga", difficulty: "srednie" },
  { name: "Glute bridge", category: "Nogi", primaryMuscles: ["posladki"], equipment: "masa ciala", difficulty: "latwe" },
  { name: "Wypychanie na suwnicy", category: "Nogi", primaryMuscles: ["czworoglowe", "posladki"], equipment: "suwnica", difficulty: "latwe" },
  { name: "Prostowanie nog na maszynie", category: "Nogi", primaryMuscles: ["czworoglowe"], equipment: "maszyna", difficulty: "latwe" },
  { name: "Uginanie nog na maszynie", category: "Nogi", primaryMuscles: ["dwuglowe uda"], equipment: "maszyna", difficulty: "latwe" },
  { name: "Wspiecia na palce stojac", category: "Nogi", primaryMuscles: ["lydki"], equipment: "masa ciala lub maszyna", difficulty: "latwe" },
  { name: "Wspiecia na palce siedzac", category: "Nogi", primaryMuscles: ["lydki"], equipment: "maszyna", difficulty: "latwe" },
  { name: "Step-up na skrzynie", category: "Nogi", primaryMuscles: ["czworoglowe", "posladki"], equipment: "skrzynia", difficulty: "srednie" },
  { name: "Pistol squat progresja", category: "Nogi", primaryMuscles: ["czworoglowe", "core"], equipment: "masa ciala", difficulty: "trudne" },
  { name: "Wall sit", category: "Nogi", primaryMuscles: ["czworoglowe"], equipment: "sciana", difficulty: "latwe" },
  { name: "Jump squat", category: "Nogi", primaryMuscles: ["nogi", "lydki"], equipment: "masa ciala", difficulty: "srednie" },
  { name: "Cossack squat", category: "Nogi", primaryMuscles: ["przywodziciele", "posladki"], equipment: "masa ciala", difficulty: "trudne" },
  { name: "Kettlebell swing", category: "Nogi", primaryMuscles: ["posladki", "dwuglowe", "core"], equipment: "kettlebell", difficulty: "srednie" },
  { name: "Maszyna przywodziciele", category: "Nogi", primaryMuscles: ["przywodziciele"], equipment: "maszyna", difficulty: "latwe" },
  { name: "Maszyna odwodziciele", category: "Nogi", primaryMuscles: ["odwodziciele", "posladki"], equipment: "maszyna", difficulty: "latwe" },
  { name: "Nordic curl progresja", category: "Nogi", primaryMuscles: ["dwuglowe uda"], equipment: "partner lub zaczep", difficulty: "trudne" },
  { name: "Wyciskanie zolnierskie", category: "Barki", primaryMuscles: ["barki", "triceps"], equipment: "sztanga", difficulty: "srednie" },
  { name: "Wyciskanie hantli nad glowe", category: "Barki", primaryMuscles: ["barki"], equipment: "hantle", difficulty: "srednie" },
  { name: "Arnold press", category: "Barki", primaryMuscles: ["barki"], equipment: "hantle", difficulty: "srednie" },
  { name: "Unoszenie bokiem", category: "Barki", primaryMuscles: ["boczny akton barku"], equipment: "hantle", difficulty: "latwe" },
  { name: "Unoszenie przodem", category: "Barki", primaryMuscles: ["przedni akton barku"], equipment: "hantle", difficulty: "latwe" },
  { name: "Odwrotne rozpietki", category: "Barki", primaryMuscles: ["tyl barku"], equipment: "hantle lub maszyna", difficulty: "latwe" },
  { name: "Podciaganie sztangi do brody", category: "Barki", primaryMuscles: ["barki", "czworoboczny"], equipment: "sztanga", difficulty: "srednie" },
  { name: "Pike push-up", category: "Barki", primaryMuscles: ["barki", "triceps"], equipment: "masa ciala", difficulty: "srednie" },
  { name: "Stanie na rekach przy scianie", category: "Barki", primaryMuscles: ["barki", "core"], equipment: "sciana", difficulty: "trudne" },
  { name: "Landmine press", category: "Barki", primaryMuscles: ["barki", "core"], equipment: "sztanga", difficulty: "srednie" },
  { name: "Rotacja kubanska", category: "Barki", primaryMuscles: ["rotatory barku"], equipment: "hantle", difficulty: "latwe" },
  { name: "Band pull-apart", category: "Barki", primaryMuscles: ["tyl barku", "lopatki"], equipment: "guma", difficulty: "latwe" },
  { name: "Y-raise", category: "Barki", primaryMuscles: ["dolny czworoboczny", "tyl barku"], equipment: "hantle lub lawka", difficulty: "latwe" },
  { name: "Scapular wall slides", category: "Barki", primaryMuscles: ["lopatki", "rotatory"], equipment: "sciana", difficulty: "latwe" },
  { name: "Wyciskanie na maszynie barkowej", category: "Barki", primaryMuscles: ["barki"], equipment: "maszyna", difficulty: "latwe" },
  { name: "Uginanie sztangi na biceps", category: "Ramiona", primaryMuscles: ["biceps"], equipment: "sztanga", difficulty: "latwe" },
  { name: "Uginanie hantli stojac", category: "Ramiona", primaryMuscles: ["biceps"], equipment: "hantle", difficulty: "latwe" },
  { name: "Uginanie mlotkowe", category: "Ramiona", primaryMuscles: ["ramienny", "biceps"], equipment: "hantle", difficulty: "latwe" },
  { name: "Uginanie koncentracyjne", category: "Ramiona", primaryMuscles: ["biceps"], equipment: "hantel", difficulty: "srednie" },
  { name: "Modlitewnik", category: "Ramiona", primaryMuscles: ["biceps"], equipment: "lawka modlitewnik", difficulty: "latwe" },
  { name: "Uginanie na wyciagu", category: "Ramiona", primaryMuscles: ["biceps"], equipment: "wyciag", difficulty: "latwe" },
  { name: "Francuskie wyciskanie lezac", category: "Ramiona", primaryMuscles: ["triceps"], equipment: "sztanga", difficulty: "srednie" },
  { name: "Prostowanie na wyciagu", category: "Ramiona", primaryMuscles: ["triceps"], equipment: "wyciag", difficulty: "latwe" },
  { name: "Prostowanie hantla nad glowa", category: "Ramiona", primaryMuscles: ["triceps"], equipment: "hantel", difficulty: "latwe" },
  { name: "Dipy na lawce", category: "Ramiona", primaryMuscles: ["triceps"], equipment: "lawka", difficulty: "srednie" },
  { name: "Pompki waskie", category: "Ramiona", primaryMuscles: ["triceps", "klatka"], equipment: "masa ciala", difficulty: "srednie" },
  { name: "Wyciskanie wasko", category: "Ramiona", primaryMuscles: ["triceps", "klatka"], equipment: "sztanga", difficulty: "srednie" },
  { name: "Kickback triceps", category: "Ramiona", primaryMuscles: ["triceps"], equipment: "hantle", difficulty: "latwe" },
  { name: "Uginanie nadgarstkow", category: "Ramiona", primaryMuscles: ["przedramiona"], equipment: "hantle lub sztanga", difficulty: "latwe" },
  { name: "Odwrotne uginanie nadgarstkow", category: "Ramiona", primaryMuscles: ["przedramiona"], equipment: "hantle lub sztanga", difficulty: "latwe" },
  { name: "Farmer carry", category: "Ramiona", primaryMuscles: ["chwyt", "core"], equipment: "hantle lub kettlebell", difficulty: "srednie" },
  { name: "Dead hang", category: "Ramiona", primaryMuscles: ["chwyt", "plecy"], equipment: "drazek", difficulty: "latwe" },
  { name: "Zottman curl", category: "Ramiona", primaryMuscles: ["biceps", "przedramiona"], equipment: "hantle", difficulty: "srednie" },
  { name: "Brzuszki klasyczne", category: "Brzuch i core", primaryMuscles: ["prosty brzucha"], equipment: "mata", difficulty: "latwe" },
  { name: "Spiecia brzucha", category: "Brzuch i core", primaryMuscles: ["prosty brzucha"], equipment: "mata", difficulty: "latwe" },
  { name: "Reverse crunch", category: "Brzuch i core", primaryMuscles: ["dolny brzuch"], equipment: "mata", difficulty: "srednie" },
  { name: "Bicycle crunch", category: "Brzuch i core", primaryMuscles: ["skosne brzucha"], equipment: "mata", difficulty: "srednie" },
  { name: "Plank", category: "Brzuch i core", primaryMuscles: ["core"], equipment: "mata", difficulty: "latwe" },
  { name: "Side plank", category: "Brzuch i core", primaryMuscles: ["skosne brzucha", "core"], equipment: "mata", difficulty: "srednie" },
  { name: "Dead bug", category: "Brzuch i core", primaryMuscles: ["core"], equipment: "mata", difficulty: "latwe" },
  { name: "Hollow body hold", category: "Brzuch i core", primaryMuscles: ["core"], equipment: "mata", difficulty: "trudne" },
  { name: "Mountain climber", category: "Brzuch i core", primaryMuscles: ["core", "kondycja"], equipment: "masa ciala", difficulty: "srednie" },
  { name: "Unoszenie nog lezac", category: "Brzuch i core", primaryMuscles: ["dolny brzuch"], equipment: "mata", difficulty: "srednie" },
  { name: "Unoszenie nog w zwisie", category: "Brzuch i core", primaryMuscles: ["core", "chwyt"], equipment: "drazek", difficulty: "trudne" },
  { name: "Russian twist", category: "Brzuch i core", primaryMuscles: ["skosne brzucha"], equipment: "masa ciala lub pilka", difficulty: "srednie" },
  { name: "V-up", category: "Brzuch i core", primaryMuscles: ["prosty brzucha"], equipment: "mata", difficulty: "trudne" },
  { name: "Ab wheel rollout", category: "Brzuch i core", primaryMuscles: ["core", "najszerszy"], equipment: "kolko", difficulty: "trudne" },
  { name: "Bird dog", category: "Brzuch i core", primaryMuscles: ["core", "posladki"], equipment: "mata", difficulty: "latwe" },
  { name: "Pallof press", category: "Brzuch i core", primaryMuscles: ["antyrotacja", "core"], equipment: "guma lub wyciag", difficulty: "srednie" },
  { name: "Woodchop", category: "Brzuch i core", primaryMuscles: ["skosne brzucha"], equipment: "wyciag lub guma", difficulty: "srednie" },
  { name: "Flutter kicks", category: "Brzuch i core", primaryMuscles: ["dolny brzuch"], equipment: "mata", difficulty: "srednie" },
  { name: "Heel taps", category: "Brzuch i core", primaryMuscles: ["skosne brzucha"], equipment: "mata", difficulty: "latwe" },
  { name: "Toe touches", category: "Brzuch i core", primaryMuscles: ["prosty brzucha"], equipment: "mata", difficulty: "srednie" },
  { name: "Dragon flag progresja", category: "Brzuch i core", primaryMuscles: ["core"], equipment: "lawka", difficulty: "trudne" },
  { name: "Plank shoulder taps", category: "Brzuch i core", primaryMuscles: ["core", "barki"], equipment: "masa ciala", difficulty: "srednie" },
  { name: "Bear crawl", category: "Brzuch i core", primaryMuscles: ["core", "barki"], equipment: "masa ciala", difficulty: "srednie" },
  { name: "L-sit tuck", category: "Brzuch i core", primaryMuscles: ["core", "triceps"], equipment: "porecze", difficulty: "trudne" },
  { name: "Windshield wipers", category: "Brzuch i core", primaryMuscles: ["skosne brzucha"], equipment: "mata lub drazek", difficulty: "trudne" },
  { name: "Bieg spokojny", category: "Kondycja", primaryMuscles: ["nogi", "serce"], equipment: "buty", difficulty: "latwe" },
  { name: "Marsz szybki", category: "Kondycja", primaryMuscles: ["nogi", "serce"], equipment: "buty", difficulty: "latwe" },
  { name: "Interwaly biegowe", category: "Kondycja", primaryMuscles: ["nogi", "serce"], equipment: "buty", difficulty: "trudne" },
  { name: "Rower stacjonarny", category: "Kondycja", primaryMuscles: ["nogi"], equipment: "rower", difficulty: "latwe" },
  { name: "Skakanka", category: "Kondycja", primaryMuscles: ["lydki", "kondycja"], equipment: "skakanka", difficulty: "srednie" },
  { name: "Burpees", category: "Kondycja", primaryMuscles: ["cale cialo"], equipment: "masa ciala", difficulty: "trudne" },
  { name: "Pajacyki", category: "Kondycja", primaryMuscles: ["cale cialo"], equipment: "masa ciala", difficulty: "latwe" },
  { name: "High knees", category: "Kondycja", primaryMuscles: ["nogi", "core"], equipment: "masa ciala", difficulty: "srednie" },
  { name: "Shadow boxing", category: "Kondycja", primaryMuscles: ["barki", "core"], equipment: "masa ciala", difficulty: "srednie" },
  { name: "Ergometr wioslarski", category: "Kondycja", primaryMuscles: ["nogi", "plecy"], equipment: "ergometr", difficulty: "srednie" },
  { name: "Wejscia po schodach", category: "Kondycja", primaryMuscles: ["nogi", "serce"], equipment: "schody", difficulty: "latwe" },
  { name: "Battle ropes", category: "Kondycja", primaryMuscles: ["barki", "core"], equipment: "liny", difficulty: "srednie" },
  { name: "Agility ladder", category: "Kondycja", primaryMuscles: ["nogi", "koordynacja"], equipment: "drabinka", difficulty: "srednie" },
  { name: "Shuttle run", category: "Kondycja", primaryMuscles: ["nogi", "kondycja"], equipment: "znaczniki", difficulty: "trudne" },
  { name: "Mountain climber sprint", category: "Kondycja", primaryMuscles: ["core", "kondycja"], equipment: "masa ciala", difficulty: "srednie" },
  { name: "Air bike", category: "Kondycja", primaryMuscles: ["cale cialo"], equipment: "air bike", difficulty: "srednie" },
  { name: "Rozciaganie zginaczy bioder", category: "Mobilnosc", primaryMuscles: ["biodra"], equipment: "mata", difficulty: "latwe" },
  { name: "Rozciaganie dwuglowych uda", category: "Mobilnosc", primaryMuscles: ["dwuglowe uda"], equipment: "mata", difficulty: "latwe" },
  { name: "Rotacja piersiowa", category: "Mobilnosc", primaryMuscles: ["odcinek piersiowy"], equipment: "mata", difficulty: "latwe" },
  { name: "Cat-cow", category: "Mobilnosc", primaryMuscles: ["kregoslup"], equipment: "mata", difficulty: "latwe" },
  { name: "Mobilizacja kostki", category: "Mobilnosc", primaryMuscles: ["staw skokowy"], equipment: "sciana", difficulty: "latwe" },
  { name: "Shoulder dislocates z guma", category: "Mobilnosc", primaryMuscles: ["barki"], equipment: "guma lub kij", difficulty: "latwe" },
  { name: "Turkish get-up", category: "Funkcjonalne", primaryMuscles: ["cale cialo", "core"], equipment: "kettlebell", difficulty: "trudne" },
  { name: "Power clean", category: "Funkcjonalne", primaryMuscles: ["cale cialo"], equipment: "sztanga", difficulty: "trudne" },
  { name: "Kettlebell clean", category: "Funkcjonalne", primaryMuscles: ["biodra", "plecy"], equipment: "kettlebell", difficulty: "srednie" },
  { name: "Kettlebell snatch", category: "Funkcjonalne", primaryMuscles: ["cale cialo"], equipment: "kettlebell", difficulty: "trudne" },
  { name: "Thruster", category: "Funkcjonalne", primaryMuscles: ["nogi", "barki"], equipment: "sztanga lub hantle", difficulty: "trudne" },
  { name: "Wall ball", category: "Funkcjonalne", primaryMuscles: ["nogi", "barki"], equipment: "pilka", difficulty: "srednie" },
  { name: "Sled push", category: "Funkcjonalne", primaryMuscles: ["nogi", "core"], equipment: "sanie", difficulty: "srednie" },
  { name: "Rope climb progresja", category: "Funkcjonalne", primaryMuscles: ["plecy", "chwyt"], equipment: "lina", difficulty: "trudne" },
  { name: "Medicine ball slam", category: "Funkcjonalne", primaryMuscles: ["core", "plecy"], equipment: "pilka lekarska", difficulty: "srednie" },
  { name: "Renegade row", category: "Funkcjonalne", primaryMuscles: ["plecy", "core"], equipment: "hantle", difficulty: "trudne" },
  { name: "Burpee broad jump", category: "Funkcjonalne", primaryMuscles: ["cale cialo"], equipment: "masa ciala", difficulty: "trudne" },
  { name: "Sandbag carry", category: "Funkcjonalne", primaryMuscles: ["core", "nogi"], equipment: "sandbag", difficulty: "srednie" },
  { name: "Suitcase carry", category: "Funkcjonalne", primaryMuscles: ["core", "chwyt"], equipment: "hantel lub kettlebell", difficulty: "srednie" },
  { name: "Sled pull", category: "Funkcjonalne", primaryMuscles: ["nogi", "plecy"], equipment: "sanie", difficulty: "srednie" },
  { name: "Clean and press", category: "Funkcjonalne", primaryMuscles: ["cale cialo"], equipment: "hantle lub kettlebell", difficulty: "trudne" },
  { name: "Man maker", category: "Funkcjonalne", primaryMuscles: ["cale cialo"], equipment: "hantle", difficulty: "trudne" },
  { name: "Box jump", category: "Funkcjonalne", primaryMuscles: ["nogi", "lydki"], equipment: "skrzynia", difficulty: "srednie" },
  { name: "Step-over z obciazeniem", category: "Funkcjonalne", primaryMuscles: ["nogi", "core"], equipment: "skrzynia i hantle", difficulty: "srednie" },
  { name: "Kettlebell high pull", category: "Funkcjonalne", primaryMuscles: ["biodra", "barki"], equipment: "kettlebell", difficulty: "srednie" },
  { name: "Halo kettlebell", category: "Funkcjonalne", primaryMuscles: ["barki", "core"], equipment: "kettlebell", difficulty: "latwe" },
];

export const EXERCISE_CATEGORIES = Object.keys(CATEGORY_GUIDES);
export const EXERCISE_DIFFICULTIES: Array<{ id: ExerciseDifficulty; label: string }> = [
  { id: "latwe", label: "Latwe" },
  { id: "srednie", label: "Srednie" },
  { id: "trudne", label: "Trudne" },
];

export const CLASSIC_VIDEO_MAP: Record<string, string> = {
  "pompki-klasyczne": "https://static.fabrykasily.pl/atlas-kobiet/video-pompka-klasyczna.mp4",
  "pompki-szerokie": "https://static.fabrykasily.pl/atlas/m_push_up_feet_on_box.mp4",
  "pompki-diamentowe": "https://static.fabrykasily.pl/atlas/m_waskie_pompki.mp4",
  "pompki-na-podwyzszeniu-rak": "https://static.fabrykasily.pl/atlas-kobiet/video-pompki-w-podparciu-przodem-na-podwyzszeniu.mp4",
  "pompki-z-nogami-na-podwyzszeniu": "https://static.fabrykasily.pl/atlas/m_push_up_feet_on_box.mp4",
  "pompki-eksplozywne": "https://static.fabrykasily.pl/atlas/m_pompki_eksplozywne.mp4",
  "pompki-archer": "https://static.fabrykasily.pl/atlas/m_pompki_archer.mp4",
  "pompki-hindu": "https://static.fabrykasily.pl/atlas-kobiet/video-pompka-klasyczna.mp4",
  "pompki-z-pauza": "https://static.fabrykasily.pl/atlas-kobiet/video-pompka-klasyczna.mp4",
  "dipy-na-poreczach": "https://static.fabrykasily.pl/atlas/m_dips.mp4",
  "wyciskanie-sztangi-lezac": "https://static.fabrykasily.pl/atlas/wyciskanie_sztangi_na_lawce_plaskiej.mp4",
  "wyciskanie-hantli-lezac": "https://static.fabrykasily.pl/atlas/wyciskanie_sztangielek_na_lawce_plaskiej.mp4",
  "wyciskanie-na-skosie-dodatnim": "https://static.fabrykasily.pl/atlas/wyciskanie_sztangi_na_lawce_dodatniej.mp4",
  "rozpietki-z-hantlami": "https://static.fabrykasily.pl/atlas/rozpietki_ze_sztangielkami_na_lawce_plaskiej.mp4",
  "butterfly-na-maszynie": "https://static.fabrykasily.pl/atlas/butterfly.mp4",
  "krzyzowanie-linek": "https://static.fabrykasily.pl/atlas/krzyzowanie_linek_wyciagu.mp4",
  "floor-press": "https://static.fabrykasily.pl/atlas/floor_press.mp4",
  "pompki-na-uchwytach": "https://static.fabrykasily.pl/atlas-kobiet/video-pompka-klasyczna.mp4",
  "podciaganie-nachwytem": "https://static.fabrykasily.pl/atlas/podciaganie_na_drazku_trzymanym_nachwytem.mp4",
  "podciaganie-podchwytem": "https://static.fabrykasily.pl/atlas/podciaganie_na_drazku_trzymanym_podchwytem.mp4",
  "podciaganie-neutralne": "https://static.fabrykasily.pl/atlas/m_podciaganie_chwytem_neutralnym_na_pojedynczym_drazku.mp4",
  "podciaganie-negatywne": "https://static.fabrykasily.pl/atlas/m_podciaganie_z_pomoca_nog.mp4",
  "scapular-pull-up": "https://static.fabrykasily.pl/atlas/m_zaawansowane_podciaganie_lopatkami.mp4",
  "wioslowanie-sztanga": "https://static.fabrykasily.pl/atlas/wioslowanie_sztanga_w_opadzie_tulowia.mp4",
  "wioslowanie-hantla-jednoracz": "https://static.fabrykasily.pl/atlas-kobiet/video-wioslowanie-hantla-w-oparciu-reka-o-laweczke.mp4",
  "wioslowanie-t-bar": "https://static.fabrykasily.pl/atlas/wioslowanie_pol_sztanga_t_bar.mp4",
  "wioslowanie-na-wyciagu-siedzac": "https://static.fabrykasily.pl/atlas/wioslowanie_na_wyciagu.mp4",
  "sciaganie-drazka-do-klatki": "https://static.fabrykasily.pl/atlas/sciaganie_drazka_wyciagu_gornego_do_klatki.mp4",
  "face-pull": "https://static.fabrykasily.pl/atlas/face_pulls.mp4",
  "martwy-ciag-klasyczny": "https://static.fabrykasily.pl/atlas-kobiet/video-martwy-ciag-sumo.mp4",
  "martwy-ciag-rumunski": "https://static.fabrykasily.pl/atlas/m_martwy_ciag_na_prostych_nogach_ze_sztangielkami.mp4",
  "hiperextensje": "https://static.fabrykasily.pl/atlas/wyprosty_tulowia_na_lawce_rzymskiej.mp4",
  "pullover": "https://static.fabrykasily.pl/atlas/przenoszenie_sztangielki_w_lezeniu_w_poprzek_lawki.mp4",
  "inverted-row": "https://static.fabrykasily.pl/atlas/m_podciaganie_australijskie_podchwytem.mp4",
  "szrugsy": "https://static.fabrykasily.pl/atlas/szrugsy.mp4",
  "good-morning": "https://static.fabrykasily.pl/atlas/dzien_dobry_ze_sztanga_na_plecach.mp4",
  "przysiad-klasyczny": "https://static.fabrykasily.pl/atlas-kobiet/video-przysiady-do-podwyzszenia.mp4",
  "przysiad-goblet": "https://static.fabrykasily.pl/atlas/m_goblet_squat.mp4",
  "przysiad-ze-sztanga-z-tylu": "https://static.fabrykasily.pl/atlas/m_back_squat.mp4",
  "przysiad-front-squat": "https://static.fabrykasily.pl/atlas/m_front_squats.mp4",
  "przysiad-sumo": "https://static.fabrykasily.pl/atlas/m_sumo_squat.mp4",
  "przysiad-bulgarski": "https://static.fabrykasily.pl/atlas/m_bulgarian_squat.mp4",
  "wykroki-w-miejscu": "https://static.fabrykasily.pl/atlas/m_wykroki_chodzone.mp4",
  "zakroki": "https://static.fabrykasily.pl/atlas-kobiet/video-zakroki-ze-sztanga.mp4",
  "wykroki-chodzone": "https://static.fabrykasily.pl/atlas/m_wykroki_chodzone.mp4",
  "hip-thrust": "https://static.fabrykasily.pl/atlas/hip_thrust.mp4",
  "glute-bridge": "https://static.fabrykasily.pl/atlas-kobiet/video-glute-bridge.mp4",
  "wypychanie-na-suwnicy": "https://static.fabrykasily.pl/atlas/wypychanie_ciezaru_na_suwnicy.mp4",
  "prostowanie-nog-na-maszynie": "https://static.fabrykasily.pl/atlas/prostowanie_nog_na_maszynie.mp4",
  "uginanie-nog-na-maszynie": "https://static.fabrykasily.pl/atlas/uginanie_nog_na_maszynie.mp4",
  "wspiecia-na-palce-stojac": "https://static.fabrykasily.pl/atlas/m_wspiecia_na_palce_stojac.mp4",
  "wspiecia-na-palce-siedzac": "https://static.fabrykasily.pl/atlas/wspiecia_na_palce_siedzac.mp4",
  "step-up-na-skrzynie": "https://static.fabrykasily.pl/atlas/step_up.mp4",
  "pistol-squat-progresja": "https://static.fabrykasily.pl/atlas/m_pistols_squat_na_trx.mp4",
  "wall-sit": "https://static.fabrykasily.pl/atlas/przysiad_przy_scianie.mp4",
  "jump-squat": "https://static.fabrykasily.pl/atlas/przysiady_z_wyskokiem.mp4",
  "cossack-squat": "https://static.fabrykasily.pl/atlas/cossack_squat.mp4",
  "kettlebell-swing": "https://static.fabrykasily.pl/atlas/kettlebell_swing.mp4",
  "wyciskanie-zolnierskie": "https://static.fabrykasily.pl/atlas/wyciskanie_sztangi_nad_glowe.mp4",
  "wyciskanie-hantli-nad-glowe": "https://static.fabrykasily.pl/atlas/m_wyciskanie_hantli_siedzac.mp4",
  "arnold-press": "https://static.fabrykasily.pl/atlas/m_arnoldki.mp4",
  "unoszenie-bokiem": "https://static.fabrykasily.pl/atlas/m_unoszenie_ramion_w_bok_ze_sztangielkami.mp4",
  "unoszenie-przodem": "https://static.fabrykasily.pl/atlas/unoszenie_hantli_przodem.mp4",
  "odwrotne-rozpietki": "https://static.fabrykasily.pl/atlas/odwrotne_rozpietki.mp4",
  "podciaganie-sztangi-do-brody": "https://static.fabrykasily.pl/atlas/podciaganie_sztangi_pod_brode.mp4",
  "pike-push-up": "https://static.fabrykasily.pl/atlas/m_pike_push_ups.mp4",
  "uginanie-sztangi-na-biceps": "https://static.fabrykasily.pl/atlas/m_uginanie_przedramion_ze_sztanga_stojac.mp4",
  "uginanie-hantli-stojac": "https://static.fabrykasily.pl/atlas/m_uginanie_przedramion_ze_sztangielkami_z_supinacja.mp4",
  "uginanie-mlotkowe": "https://static.fabrykasily.pl/atlas/m_uginanie_ramion_ze_sztangielkami_chwytem_mlotkowym.mp4",
  "uginanie-koncentracyjne": "https://static.fabrykasily.pl/atlas/m_uginanie_koncentracyjne.mp4",
  "modlitewnik": "https://static.fabrykasily.pl/atlas/uginanie_na_modlitewniku.mp4",
  "uginanie-na-wyciagu": "https://static.fabrykasily.pl/atlas/uginanie_przedramion_na_wyciagu.mp4",
  "francuskie-wyciskanie-lezac": "https://static.fabrykasily.pl/atlas/m_wyciskanie_francuskie_ze_sztanga_lezac.mp4",
  "prostowanie-na-wyciagu": "https://static.fabrykasily.pl/atlas/m_prostowanie_ramion_na_wyciagu_stojac.mp4",
  "prostowanie-hantla-nad-glowa": "https://static.fabrykasily.pl/atlas/m_prostowanie_ramienia_z_hantla_zza_glowy.mp4",
  "dipy-na-lawce": "https://static.fabrykasily.pl/atlas/pompki_w_podporze_tylem.mp4",
  "pompki-waskie": "https://static.fabrykasily.pl/atlas/m_waskie_pompki.mp4",
  "wyciskanie-wasko": "https://static.fabrykasily.pl/atlas/wyciskanie_sztangi_waskim_chwytem.mp4",
  "kickback-triceps": "https://static.fabrykasily.pl/atlas/m_kickback_triceps.mp4",
  "brzuszki-klasyczne": "https://static.fabrykasily.pl/atlas/m_brzuszki_z_rekami_na_klatce_piersiowej.mp4",
  "spiecia-brzucha": "https://static.fabrykasily.pl/atlas/unoszenie_tulowia_z_podloza_spiecia_brzucha_lezac.mp4",
  "reverse-crunch": "https://static.fabrykasily.pl/atlas/odwrotne_brzuszki.mp4",
  "bicycle-crunch": "https://static.fabrykasily.pl/atlas/brzuszki_skosne_rowerek.mp4",
  "plank": "https://static.fabrykasily.pl/atlas/deska_scianka_plank.mp4",
  "side-plank": "https://static.fabrykasily.pl/atlas/m_side_plank.mp4",
  "dead-bug": "https://static.fabrykasily.pl/atlas/dead_bug.mp4",
  "hollow-body-hold": "https://static.fabrykasily.pl/atlas/hollow_body.mp4",
  "mountain-climber": "https://static.fabrykasily.pl/atlas-kobiet/video-mountain-climbers-trx.mp4",
  "unoszenie-nog-lezac": "https://static.fabrykasily.pl/atlas/wznosy_nog_w_lezeniu.mp4",
  "unoszenie-nog-w-zwisie": "https://static.fabrykasily.pl/atlas/wznosy_nog_w_zwisie_na_drazku.mp4",
  "russian-twist": "https://static.fabrykasily.pl/atlas/m_russian_twist.mp4",
  "v-up": "https://static.fabrykasily.pl/atlas/v_ups.mp4",
  "burpees": "https://static.fabrykasily.pl/atlas/m_burpees.mp4",
  "pajacyki": "https://static.fabrykasily.pl/atlas/pajacyki.mp4",
  "high-knees": "https://static.fabrykasily.pl/atlas/skip_a.mp4",
};

function normalizeExerciseKey(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// 1. Build rich classic exercises with videos attached
const ENRICHED_RAW_EXERCISES: ExerciseCatalogEntry[] = RAW_EXERCISES.map((exercise) => {
  const guide = CATEGORY_GUIDES[exercise.category];
  const id = normalizeExerciseKey(exercise.name);
  const mappedVideoUrl = CLASSIC_VIDEO_MAP[id];

  const media: ExerciseMedia[] = mappedVideoUrl
    ? [
        {
          type: "video",
          url: mappedVideoUrl,
          sourceName: "Fabryka Siły (Atlas)",
          label: `Wideo: ${exercise.name}`,
        },
      ]
    : SOURCE_MEDIA.map((s) => ({ ...s }));

  return {
    id,
    ...exercise,
    steps: [...guide.steps],
    techniqueCues: [...guide.techniqueCues],
    commonMistakes: [...guide.commonMistakes],
    safetyNotes: [...guide.safetyNotes],
    media,
    sourceUrls: SOURCE_MEDIA.map((s) => s.url),
  };
});

// 2. Build full library from video seeds
const SEED_CATALOG_EXERCISES: ExerciseCatalogEntry[] = EXERCISE_VIDEO_SEEDS.map((exercise) => {
  const cat = (CATEGORY_GUIDES[exercise.category as keyof typeof CATEGORY_GUIDES] ? exercise.category : "Funkcjonalne") as keyof typeof CATEGORY_GUIDES;
  const guide = CATEGORY_GUIDES[cat];
  const id = normalizeExerciseKey(exercise.name);

  return {
    id,
    name: exercise.name,
    category: cat,
    primaryMuscles: exercise.primaryMuscles,
    equipment: exercise.equipment,
    difficulty: exercise.difficulty,
    steps: [...guide.steps],
    techniqueCues: [...guide.techniqueCues],
    commonMistakes: [...guide.commonMistakes],
    safetyNotes: [...guide.safetyNotes],
    media: [
      {
        type: "video",
        url: exercise.videoUrl,
        sourceName: "Fabryka Siły",
        label: "Film instruktażowy",
        sourcePageUrl: exercise.pageUrl,
      },
    ],
    sourceUrls: [exercise.pageUrl],
  };
});

// Combine both lists, prioritizing raw curated definitions
const combinedMap = new Map<string, ExerciseCatalogEntry>();
for (const entry of SEED_CATALOG_EXERCISES) {
  combinedMap.set(entry.id, entry);
}
for (const entry of ENRICHED_RAW_EXERCISES) {
  combinedMap.set(entry.id, entry);
}

export const EXERCISE_CATALOG: ExerciseCatalogEntry[] = Array.from(combinedMap.values());

/**
 * Intelligent video resolver that guarantees matching a video preview for any exercise ID or name
 */
export function resolveExerciseVideo(
  exerciseId?: string,
  exerciseName?: string
): ExerciseMedia | null {
  const normId = exerciseId ? normalizeExerciseKey(exerciseId) : "";
  const normName = exerciseName ? normalizeExerciseKey(exerciseName) : "";

  // 1. Direct match in classic video map
  if (normId && CLASSIC_VIDEO_MAP[normId]) {
    return {
      type: "video",
      url: CLASSIC_VIDEO_MAP[normId],
      sourceName: "Fabryka Siły",
      label: exerciseName || "Wideo ćwiczenia",
    };
  }
  if (normName && CLASSIC_VIDEO_MAP[normName]) {
    return {
      type: "video",
      url: CLASSIC_VIDEO_MAP[normName],
      sourceName: "Fabryka Siły",
      label: exerciseName || "Wideo ćwiczenia",
    };
  }

  // 2. Direct match in full catalog
  const catalogEntry = EXERCISE_CATALOG.find(
    (e) => e.id === normId || e.id === normName || normalizeExerciseKey(e.name) === normName
  );
  const catalogVideo = catalogEntry?.media.find((m) => m.type === "video");
  if (catalogVideo) {
    return catalogVideo;
  }

  // 3. Fallback keyword / semantic match across full catalog
  const query = (exerciseName || exerciseId || "").toLowerCase();
  if (query.includes("pompk") || query.includes("pushup")) {
    return {
      type: "video",
      url: "https://static.fabrykasily.pl/atlas-kobiet/video-pompka-klasyczna.mp4",
      sourceName: "Fabryka Siły",
      label: "Technika pompek",
    };
  }
  if (query.includes("przysiad") || query.includes("squat")) {
    return {
      type: "video",
      url: "https://static.fabrykasily.pl/atlas-kobiet/video-przysiady-do-podwyzszenia.mp4",
      sourceName: "Fabryka Siły",
      label: "Technika przysiadu",
    };
  }
  if (query.includes("martwy") || query.includes("deadlift")) {
    return {
      type: "video",
      url: "https://static.fabrykasily.pl/atlas-kobiet/video-martwy-ciag-sumo.mp4",
      sourceName: "Fabryka Siły",
      label: "Technika martwego ciągu",
    };
  }
  if (query.includes("podciag") || query.includes("pullup") || query.includes("chinup")) {
    return {
      type: "video",
      url: "https://static.fabrykasily.pl/atlas/podciaganie_na_drazku_trzymanym_nachwytem.mp4",
      sourceName: "Fabryka Siły",
      label: "Technika podciągania",
    };
  }
  if (query.includes("wyciskan") || query.includes("bench") || query.includes("press")) {
    return {
      type: "video",
      url: "https://static.fabrykasily.pl/atlas/wyciskanie_sztangi_na_lawce_plaskiej.mp4",
      sourceName: "Fabryka Siły",
      label: "Technika wyciskania",
    };
  }
  if (query.includes("brzuch") || query.includes("crunch") || query.includes("brzuszk")) {
    return {
      type: "video",
      url: "https://static.fabrykasily.pl/atlas/m_brzuszki_z_rekami_na_klatce_piersiowej.mp4",
      sourceName: "Fabryka Siły",
      label: "Technika ćwiczenia na brzuch",
    };
  }
  if (query.includes("plank") || query.includes("deska")) {
    return {
      type: "video",
      url: "https://static.fabrykasily.pl/atlas/deska_scianka_plank.mp4",
      sourceName: "Fabryka Siły",
      label: "Technika plank",
    };
  }
  if (query.includes("wykrok") || query.includes("zakrok") || query.includes("lunge")) {
    return {
      type: "video",
      url: "https://static.fabrykasily.pl/atlas/m_wykroki_chodzone.mp4",
      sourceName: "Fabryka Siły",
      label: "Technika wykroków",
    };
  }
  if (query.includes("biceps") || query.includes("uginan") || query.includes("curl")) {
    return {
      type: "video",
      url: "https://static.fabrykasily.pl/atlas/m_uginanie_przedramion_ze_sztanga_stojac.mp4",
      sourceName: "Fabryka Siły",
      label: "Technika uginania ramion",
    };
  }
  if (query.includes("triceps") || query.includes("dip")) {
    return {
      type: "video",
      url: "https://static.fabrykasily.pl/atlas/m_dips.mp4",
      sourceName: "Fabryka Siły",
      label: "Technika dipów / tricepsa",
    };
  }

  return null;
}

export function resolveExerciseDetails(
  exerciseId?: string,
  exerciseName?: string
): ExerciseCatalogEntry | null {
  const normId = exerciseId ? normalizeExerciseKey(exerciseId) : "";
  const normName = exerciseName ? normalizeExerciseKey(exerciseName) : "";

  return (
    EXERCISE_CATALOG.find(
      (e) => e.id === normId || e.id === normName || normalizeExerciseKey(e.name) === normName
    ) ?? null
  );
}

