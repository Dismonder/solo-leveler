import type { ExerciseDifficulty } from "./exerciseCatalog";

export type ExerciseVideoSeed = {
  id: string;
  name: string;
  category: string;
  primaryMuscles: string[];
  equipment: string;
  difficulty: ExerciseDifficulty;
  pageUrl: string;
  videoUrl: string;
};

export const EXERCISE_VIDEO_SEEDS: ExerciseVideoSeed[] = [
  {
    "id": "martwy-ciag-sumo",
    "name": "Martwy ciąg sumo",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-dla-kobiet/nogi/martwy-ciag-sumo",
    "videoUrl": "https://static.fabrykasily.pl/atlas-kobiet/video-martwy-ciag-sumo.mp4"
  },
  {
    "id": "skoki-na-podwyzszenie",
    "name": "Skoki na podwyższenie",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-dla-kobiet/ogolne/skoki-na-podwyzszenie",
    "videoUrl": "https://static.fabrykasily.pl/atlas-kobiet/video-wskoki-na-podwyzszenie.mp4"
  },
  {
    "id": "zakroki-ze-sztanga",
    "name": "Zakroki ze sztangą",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-dla-kobiet/nogi/zakroki-ze-sztanga",
    "videoUrl": "https://static.fabrykasily.pl/atlas-kobiet/video-zakroki-ze-sztanga.mp4"
  },
  {
    "id": "naprzemienne-wznosy-reki-i-nogi-w-podporze-przodem",
    "name": "Naprzemienne wznosy ręki i nogi w podporze przodem",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-dla-kobiet/ogolne/naprzemienne-wznosy-reki-i-nogi-w-podporze-przodem",
    "videoUrl": "https://static.fabrykasily.pl/atlas-kobiet/video-naprzemienne-wznosy-reki-i-nogi-w-podporze-przodem.mp4"
  },
  {
    "id": "wios-owanie-hantla-w-oparciu-reka-o-aweczke",
    "name": "Wiosłowanie hantlą w oparciu ręką o ławeczkę",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-dla-kobiet/plecy/wioslowanie-hantla-w-oparciu-reka-o-laweczke",
    "videoUrl": "https://static.fabrykasily.pl/atlas-kobiet/video-wioslowanie-hantla-w-oparciu-reka-o-laweczke.mp4"
  },
  {
    "id": "mountain-climbers-na-trx",
    "name": "Mountain climbers na TRX",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "TRX",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-dla-kobiet/brzuch/mountain-climbers-trx",
    "videoUrl": "https://static.fabrykasily.pl/atlas-kobiet/video-mountain-climbers-trx.mp4"
  },
  {
    "id": "rolowanie-miesni-podudzia",
    "name": "Rolowanie mięśni podudzia",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "roller",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-dla-kobiet/rolowanie/rolowanie-miesni-podudzia",
    "videoUrl": "https://static.fabrykasily.pl/atlas-kobiet/video-rolowanie-miesni-podudzia.mp4"
  },
  {
    "id": "pompki-wersja-klasyczna",
    "name": "Pompki (wersja klasyczna)",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/dla-kobiet/na-klatke-piersiowa/pompki-wersja-klasyczna",
    "videoUrl": "https://static.fabrykasily.pl/atlas-kobiet/video-pompka-klasyczna.mp4"
  },
  {
    "id": "zakroki-zerchera",
    "name": "Zakroki Zerchera",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/zakroki-zerchera",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_zercher_reverse_lunges.mp4"
  },
  {
    "id": "wyprosty-kolan-na-maszynie-jednonoz",
    "name": "Wyprosty kolan na maszynie jednonóż",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "maszyna",
    "difficulty": "trudne",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/wyprosty-kolan-na-maszynie-jednonoz",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wyprosty_kolan_na_maszynie_jednonoz.mp4"
  },
  {
    "id": "syzyfki-z-asekuracja",
    "name": "Syzyfki z asekuracją",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/syzyfki-z-asekuracja",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_syzyfki_z_asekuracja.mp4"
  },
  {
    "id": "przysiad-ze-sztagna-ze-stojakow",
    "name": "Przysiad ze sztagną ze stojaków",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-ze-sztagna-ze-stojakow",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przysiad_ze_sztanga_ze_stojakow.mp4"
  },
  {
    "id": "przysiad-kolarski-ze-sztanga-na-plecach",
    "name": "Przysiad kolarski ze sztangą na plecach",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-kolarski-ze-sztanga-na-plecach",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przysiad_kolarski_ze_sztanga_na_plecach.mp4"
  },
  {
    "id": "przysiad-kolarski-z-ciezarem-przed-klatka",
    "name": "Przysiad kolarski z ciężarem przed klatką",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-kolarski-z-ciezarem-przed-klatka",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przysiad_kolarski_z_ciezarem_przed_klatka.mp4"
  },
  {
    "id": "przysiad-kolarski",
    "name": "Przysiad kolarski",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-kolarski",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przysiad_kolarski.mp4"
  },
  {
    "id": "odwrocone-nordyckie-opady-z-pomoca-gumy",
    "name": "Odwrócone nordyckie opady z pomocą gumy",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/odwrocone-nordyckie-opady-z-pomoca-gumy",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_odwrocone_nordyckie_opady_z_pomoca_gumy.mp4"
  },
  {
    "id": "odwrocone-nordyckie-opady-z-obciazeniem",
    "name": "Odwrócone nordyckie opady z obciążeniem",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/odwrocone-nordyckie-opady-z-obciazeniem",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_odwrocone_nordyckie_opady_z_obciazeniem.mp4"
  },
  {
    "id": "odwrocone-nordyckie-opady",
    "name": "Odwrócone nordyckie opady",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/odwrocone-nordyckie-opady",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_odwrocone_nordyckie_opady.mp4"
  },
  {
    "id": "pistolet-na-podwyzszeniu",
    "name": "Pistolet na podwyższeniu",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "trudne",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/pistolet-na-podwyzszeniu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_pistolet_na_podwyzszeniu.mp4"
  },
  {
    "id": "zakroki-ze-sztanga-na-plecach",
    "name": "Zakroki ze sztangą na plecach",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/zakroki-ze-sztanga-na-plecach",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_zakroki_ze_sztanga_na_plecach.mp4"
  },
  {
    "id": "zakroki",
    "name": "Zakroki",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/zakroki",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_zakroki.mp4"
  },
  {
    "id": "wykroki-d-ugie-chodzone-z-d-onmi-trzymanymi-na-klatce-piersiowej",
    "name": "Wykroki długie chodzone z dłońmi trzymanymi na klatce piersiowej",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/wykroki-dlugie-chodzone-z-dlonmi-trzymanymi-na-klatce-piersiowej",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wykroki_dlugie_chodzone_z_dlonmi_trzymanymi_na_klatce_piersiowej.mp4"
  },
  {
    "id": "wykroki-chodzone",
    "name": "Wykroki chodzone",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/wykroki-chodzone",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wykroki_chodzone.mp4"
  },
  {
    "id": "wchodzenie-na-podwyzszenie",
    "name": "Wchodzenie na podwyższenie",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/wchodzenie-na-podwyzszenie",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wchodzenie_na_podwyzszenie.mp4"
  },
  {
    "id": "przysiad-sumo-z-kettlem-hantla-na-stepach",
    "name": "Przysiad sumo z kettlem/hantlą na stepach",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-sumo-z-kettlem-hantla-na-stepach",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przysiad_sumo_z_kettlem_na_stepach.mp4"
  },
  {
    "id": "wykroki-w-bok-z-trx",
    "name": "Wykroki w bok z TRX",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "TRX",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/wykroki-w-bok-z-trx",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wykroki_w_bok_trx.mp4"
  },
  {
    "id": "przysiad-z-hantlami-w-pozycji-front-rack",
    "name": "Przysiad z hantlami w pozycji front rack",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-z-hantlami-w-pozycji-front-rack",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przysiad_z_hantlami_w_pozycji_front_rack.mp4"
  },
  {
    "id": "przysiad-bu-garski-z-guma",
    "name": "Przysiad bułgarski z gumą",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-bulgarski-z-guma",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przysiad_bulgarski_z_guma.mp4"
  },
  {
    "id": "przysiad-yzwiarski",
    "name": "Przysiad łyżwiarski",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-lyzwiarski",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przysiad_lyzwiarski.mp4"
  },
  {
    "id": "przysiad-wykroczny",
    "name": "Przysiad wykroczny",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-wykroczny",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przysiad_wykroczny.mp4"
  },
  {
    "id": "przysiad-wykroczny-z-hantlami",
    "name": "Przysiad wykroczny z hantlami",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-wykroczny-z-hantlami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przysiad_wykroczny_z_hantlami.mp4"
  },
  {
    "id": "przysiad-bu-garski-wersja-posladkowa-z-hantlami",
    "name": "Przysiad bułgarski – wersja pośladkowa z hantlami",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-bulgarski-wersja-posladkowa-z-hantlami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przysiad_bulgarski_wersja_posladkowa_z_hantlami.mp4"
  },
  {
    "id": "przysiad-wykroczny-z-noga-wykroczna-na-podwyzszeniu-z-hantlami",
    "name": "Przysiad wykroczny z nogą wykroczną na podwyższeniu z hantlami",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "hantle",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-wykroczny-z-noga-wykroczna-na-podwyzszeniu-z-hantlami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przysiad_wykroczny_z_noga_wykroczna_na_podwyzszeniu_z_hantlami.mp4"
  },
  {
    "id": "przysiad-bu-garski-1-i-1-2",
    "name": "Przysiad bułgarski (1 i 1/2)",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-bulgarski-1-i-1-2",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przysiad_bulgarski_jeden_i_pol.mp4"
  },
  {
    "id": "zercher-squat",
    "name": "Zercher squat",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/zercher-squat",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-zercher-squat.mp4"
  },
  {
    "id": "wykroki-skosne",
    "name": "Wykroki skośne",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/wykroki-skosne",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-wykroki-skosne.mp4"
  },
  {
    "id": "spanish-squat",
    "name": "Spanish squat",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/spanish-squat",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-spanish-squat.mp4"
  },
  {
    "id": "landmine-reverse-lunges",
    "name": "Landmine reverse lunges",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/landmine-reverse-lunges",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-landmine-reverse-lunges.mp4"
  },
  {
    "id": "przysiad-do-podwyzszenia",
    "name": "Przysiad do podwyższenia",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-do-podwyzszenia",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-przysiad-do-podwyzszenia.mp4"
  },
  {
    "id": "goblet-box-squat",
    "name": "Goblet box squat",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/goblet-box-squat",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-goblet-box-squat.mp4"
  },
  {
    "id": "reverse-drop-lunges-with-dumbbell",
    "name": "Reverse drop lunges with dumbbell",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/reverse-drop-lunges-with-dumbbell",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-reverse-drop-lunges-with-dumbbell.mp4"
  },
  {
    "id": "reverse-drop-lunges",
    "name": "Reverse drop lunges",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/reverse-drop-lunges",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-reverse-drop-lunges.mp4"
  },
  {
    "id": "przysiad-przedni-z-paskami",
    "name": "Przysiad przedni z paskami",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-przedni-z-paskami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-przysiad-przedni-z-paskami.mp4"
  },
  {
    "id": "landmine-squat",
    "name": "Landmine squat",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/landmine-squat",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-landmine-squat.mp4"
  },
  {
    "id": "przysiad-z-guma",
    "name": "Przysiad z gumą",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-z-guma",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-przysiad-z-guma.mp4"
  },
  {
    "id": "pistols-squat-na-trx",
    "name": "Pistols squat na TRX",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "TRX",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/pistol-squat-na-trx",
    "videoUrl": "https://static.fabrykasily.pl/atlas/pistols_squat_trx.mp4"
  },
  {
    "id": "przysiad-z-wyskokiem-na-trx",
    "name": "Przysiad z wyskokiem na TRX",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "TRX",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-z-wyskokiem-na-trx",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przysiad_z_wyskokiem_trx.mp4"
  },
  {
    "id": "wykroki-z-ramionami-w-gorze-na-trx",
    "name": "Wykroki z ramionami w górze na TRX",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "TRX",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/wykroki-z-ramionami-w-gorze-na-trx",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wykroki_z_ramionami_w_g%C3%B3rze_na_trx.mp4"
  },
  {
    "id": "zakroki-na-trx",
    "name": "Zakroki na TRX",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "TRX",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/zakroki-na-trx",
    "videoUrl": "https://static.fabrykasily.pl/atlas/zakroki_trx.mp4"
  },
  {
    "id": "wypychanie-suwnicy-jednonoz",
    "name": "Wypychanie suwnicy jednonóż",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "trudne",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/wypychanie-suwnicy-jednonoz",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wypychanie_suwnicy_jednonoz.mp4"
  },
  {
    "id": "kozak-squat-z-ciezarem",
    "name": "Kozak squat z ciężarem",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/kozak-squat-z-ciezarem",
    "videoUrl": "https://static.fabrykasily.pl/atlas/kozak_squad_z_ciezarem.mp4"
  },
  {
    "id": "kozak-squat-bez-ciezaru",
    "name": "Kozak squat bez ciężaru",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/kozak-squat-bez-ciezaru",
    "videoUrl": "https://static.fabrykasily.pl/atlas/kozak_squat_bez_ciezaru.mp4"
  },
  {
    "id": "pistolet",
    "name": "Pistolet",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "trudne",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/pistolet",
    "videoUrl": "https://static.fabrykasily.pl/atlas/pistolet_bez_ciezaru.mp4"
  },
  {
    "id": "pistolet-z-ciezarem",
    "name": "Pistolet z ciężarem",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "trudne",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/pistolet-z-ciezarem",
    "videoUrl": "https://static.fabrykasily.pl/atlas/pistolet_z_ciezarem.mp4"
  },
  {
    "id": "przysiad-sumo",
    "name": "Przysiad sumo",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-sumo",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przysiad_sumo.mp4"
  },
  {
    "id": "przysiad-z-trx",
    "name": "Przysiad z TRX",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "TRX",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-z-trx",
    "videoUrl": "https://static.fabrykasily.pl/atlas/trx_przysiad2.mp4"
  },
  {
    "id": "przysiad-bu-garski-z-trx",
    "name": "Przysiad bułgarski z TRX",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "TRX",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-bulgarski-z-trx",
    "videoUrl": "https://static.fabrykasily.pl/atlas/trx_przysiad_bulgarski.mp4"
  },
  {
    "id": "przysiad-bu-garski-wersja-dla-miesnia-czworog-owego-uda",
    "name": "Przysiad bułgarski – wersja dla mięśnia czworogłowego uda",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-bulgarski-wersja-dla-miesnia-czworoglowego-uda",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przysiad_bulgarski_wersja_dla_miesnia_czworoglowego_uda.mp4"
  },
  {
    "id": "przysiad-bu-garski-z-hantlami-wersja-dla-miesnia-czworog-owego-uda",
    "name": "Przysiad bułgarski z hantlami – wersja dla mięśnia czworogłowego uda",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-bulgarski-z-hantlami-wersja-dla-miesnia-czworoglowego-uda",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przysiad_bulgarski_z_hantlami_wersja_dla_miesnia_czworoglowego_uda.mp4"
  },
  {
    "id": "przysiad-wykroczny-z-noga-zakroczna-na-podwyzszeniu-z-hantlami",
    "name": "Przysiad wykroczny z nogą zakroczną na podwyższeniu z hantlami",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "hantle",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-wykroczny-z-noga-zakroczna-na-podwyzszeniu-z-hantlami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przysiad_wykroczny_z_noga_zakroczna_na_podwyzszeniu_z_hantlami.mp4"
  },
  {
    "id": "przysiad-do-skrzyni-jednonoz",
    "name": "Przysiad do skrzyni jednonóż",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "trudne",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-do-skrzyni-jednonoz",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przysiad_do_skrzyni_jednonoz.mp4"
  },
  {
    "id": "wchodzenie-na-podwyzszenie-z-hantlami",
    "name": "Wchodzenie na podwyższenie z hantlami",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/wchodzenie-na-podwyzszenie-z-hantlami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wchodzenie_na_podwyzszenie_z_hantlami.mp4"
  },
  {
    "id": "zakroki-z-hantlami",
    "name": "Zakroki z hantlami",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/zakroki-z-hantlami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/zakroki_z_hantlami.mp4"
  },
  {
    "id": "wykroki-chodzone-z-hantlami-w-d-oniach",
    "name": "Wykroki chodzone z hantlami w dłoniach",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/wykroki-chodzone-z-hantlami-w-dloniach",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wykroki_chodzone_z_hantlami_w_dloniach.mp4"
  },
  {
    "id": "przysiad-bu-garski-wersja-posladkowa",
    "name": "Przysiad bułgarski – wersja pośladkowa",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-bulgarski-wersja-posladkowa",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przysiad_bulgarski_wersja_posladkowa.mp4"
  },
  {
    "id": "side-step-up-wejscie-bokiem",
    "name": "Side step up – wejście bokiem",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/side-step-up-wejscie-bokiem",
    "videoUrl": "https://static.fabrykasily.pl/atlas/siede_step_up_wejscie_bokiem.mp4"
  },
  {
    "id": "przysiad-wykroczny-z-noga-wykroczna-na-podwyzszeniu",
    "name": "Przysiad wykroczny z nogą wykroczną na podwyższeniu",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-wykroczny-z-noga-wykroczna-na-podwyzszeniu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przysiad_wykroczny_z_noga_wykroczna_na_podwyzszeniu.mp4"
  },
  {
    "id": "przysiad-wykroczny-z-noga-zakroczna-na-podwyzszeniu",
    "name": "Przysiad wykroczny z nogą zakroczną na podwyższeniu",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/przysiad-wykroczny-z-noga-zakroczna-na-podwyzszeniu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przysiad_wykroczny_z_noga_zakroczna_na_podwyzszeniu.mp4"
  },
  {
    "id": "poliquin-step-up",
    "name": "Poliquin step-up",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/poliquin-stepup",
    "videoUrl": "https://static.fabrykasily.pl/atlas/poliquin_step_up.mp4"
  },
  {
    "id": "poliquin-step-up-z-hantlami",
    "name": "Poliquin step-up z hantlami",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/czworoglowe-uda/poliquin-stepup-z-hantlami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/poliquin_step_up_z_hantlami.mp4"
  },
  {
    "id": "przysiad-z-d-onmi-trzymanymi-za-g-owa",
    "name": "Przysiad z dłońmi trzymanymi za głową",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/czworoglowe-uda/przysiad-z-dlonmi-trzymanymi-za-glowa",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przysiad_z_dlonmi_trzymanymi_za_glowa.mp4"
  },
  {
    "id": "wykroki-chodzone-z-d-onmi-trzymanymi-na-klatce-piersiowej",
    "name": "Wykroki chodzone z dłońmi trzymanymi na klatce piersiowej",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/czworoglowe-uda/wykroki-chodzone-z-dlonmi-trzymanymi",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wykroki_chodzone_z_dlonmi_trzymanymi_na_klatce_piersiowej.mp4"
  },
  {
    "id": "wchodzenie-na-podwyzszenie-ze-sztanga-trzymana-na-plecach",
    "name": "Wchodzenie na podwyższenie ze sztangą trzymaną na plecach",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/czworoglowe-uda/wchodzenie-na-podwyzszenie-ze-sztanga-trzymana",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wchodzenie_na_podwyzszenie_ze_sztanga_trzymana_na_plecach.mp4"
  },
  {
    "id": "przysiad-z-kettlami",
    "name": "Przysiad z kettlami",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "kettlebell",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/czworoglowe-uda/przysiad-z-kettlami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przysiad_z_kettlami.mp4"
  },
  {
    "id": "przysiad-ze-sztanga-trzymana-na-plecach",
    "name": "Przysiad ze sztangą trzymaną na plecach",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/czworoglowe-uda/przysiad-ze-sztanga-trzymana-na-plecach",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-poprawka-przysiadu.mp4"
  },
  {
    "id": "wykroki-w-miejscu-ze-sztanga-trzymana-na-plecach",
    "name": "Wykroki w miejscu ze sztangą trzymaną na plecach",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/czworoglowe-uda/wykroki-w-miejscu-ze-sztanga-trzymana",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wykroki_w_miejscu_ze_sztanga_trzymana_na_plecach.mp4"
  },
  {
    "id": "wykroki-chodzone-ze-sztanga-trzymana-na-plecach",
    "name": "Wykroki chodzone ze sztangą trzymaną na plecach",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/czworoglowe-uda/wykroki-chodzone-ze-sztanga-trzymana",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wykroki_chodzone_ze_sztanga_trzymana_na_plecach.mp4"
  },
  {
    "id": "przysiad-z-uzyciem-linek-wyciagu-dolnego",
    "name": "Przysiad z użyciem linek wyciągu dolnego",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/czworoglowe-uda/przysiad-z-uzyciem-linek-wyciagu-dolnego",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przysiad_z_uzyciem_linek_wyciagu_dolnego.mp4"
  },
  {
    "id": "przysiad-na-maszynie-smitha",
    "name": "Przysiad na maszynie Smitha",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "maszyna",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/czworoglowe-uda/przysiad-na-maszynie-smitha",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przysiad_na_maszynie_smitha.mp4"
  },
  {
    "id": "wykroki-w-miejscu-z-hantelkami",
    "name": "Wykroki w miejscu z hantelkami",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/czworoglowe-uda/zakroki-w-miejscu-z-hantelkami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wykroki_w_miejscu_z_hantelkami.mp4"
  },
  {
    "id": "przysiad-z-hantelkami",
    "name": "Przysiad z hantelkami",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/czworoglowe-uda/przysiad-z-hantelkami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przysiad_z_hantelkami.mp4"
  },
  {
    "id": "przysiad-ze-sztanga-trzymana-na-barkach",
    "name": "Przysiad ze sztangą trzymaną na barkach",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/czworoglowe-uda/przysiad-ze-sztanga-trzymana-na-barkach",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przysiad_ze_sztanga_trzymana_na_barkach.mp4"
  },
  {
    "id": "goblet-squat-przysiad-z-kettlem-lub-hantelka",
    "name": "Goblet squat – przysiad z kettlem lub hantelką",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/czworoglowe-uda/goblet-squat-przysiad-z-kettlem",
    "videoUrl": "https://static.fabrykasily.pl/atlas/goblet_squat_przysiad_z_kettlem_lub_hantelka.mp4"
  },
  {
    "id": "wyprosty-kolan-na-maszynie-siedzac",
    "name": "Wyprosty kolan na maszynie siedząc",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "maszyna",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/czworoglowe-uda/wyprosty-kolan-na-maszynie-siedzac",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wyprosty_kolan_na_maszynie_siedzac.mp4"
  },
  {
    "id": "wypychanie-nogami-na-suwnicy",
    "name": "Wypychanie nogami na suwnicy",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/czworoglowe-uda/wypychanie-nogami-na-suwnicy",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wypychanie_nogami_na_suwnicy.mp4"
  },
  {
    "id": "przysiad-w-wykroku-na-maszynie-smitha",
    "name": "Przysiad w wykroku na maszynie Smitha",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "maszyna",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/czworoglowe-uda/przysiad-w-wykroku-na-maszynie-smitha",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przysiad_w_wykroku_na_maszynie_smitha.mp4"
  },
  {
    "id": "zuraw-z-pomoca-gumy",
    "name": "Żuraw z pomocą gumy",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/zuraw-z-pomoca-gumy",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_zuraw_z_pomoca_gumy.mp4"
  },
  {
    "id": "martwy-ciag-jednonoz-z-po-sztanga",
    "name": "Martwy ciąg jednonóż z półsztangą",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "sztanga",
    "difficulty": "trudne",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/martwy-ciag-jednonoz-z-polsztanga",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_martwy_ciag_jednonoz_z_polsztanga.mp4"
  },
  {
    "id": "unoszenie-bioder-z-hantla-na-jednej-nodze-w-oparciu-o-aweczke",
    "name": "Unoszenie bioder z hantlą na jednej nodze w oparciu o ławeczkę",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/unoszenie-bioder-z-hantla-na-jednej-nodze-w-oparciu-o-laweczke",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_unoszenie_bioder_z_hantla_na_jednej_nodze_w_oparciu_o_laweczke.mp4"
  },
  {
    "id": "unoszenie-nogi-w-kleku-podpartym-z-guma",
    "name": "Unoszenie nogi w klęku podpartym z gumą",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/unoszenie-nogi-w-kleku-podpartym-z-guma",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_unoszenie_nogi_w_kleku_podpartym_z_guma.mp4"
  },
  {
    "id": "pull-through",
    "name": "Pull through",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/pull-through",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_pull_through.mp4"
  },
  {
    "id": "przywodzenie-nogi-w-bok-z-wykorzystaniem-linki-wyciagu-dolnego",
    "name": "Przywodzenie nogi w bok z wykorzystaniem linki wyciągu dolnego",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/przywodzenie-nogi-w-bok-z-wykorzystaniem-linki-wyciagu-dolnego",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przywodzenie_nogi_w_bok_z_wykorzystaniem_linki_wyciagu_dolnego.mp4"
  },
  {
    "id": "przywodzenie-nog-na-maszynie",
    "name": "Przywodzenie nóg na maszynie",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "maszyna",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/przywodzenie-nog-na-maszynie",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przywodzenie_nog_na_maszynie.mp4"
  },
  {
    "id": "przyciaganie-piet-do-posladkow-na-trx-atwiejsza-wersja",
    "name": "Przyciąganie pięt do pośladków na TRX (łatwiejsza wersja)",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "TRX",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/przyciaganie-piet-do-posladkow-na-trx-latwiejsza-wersja",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przyciaganie_piet_do_posladkow_na_trx_latwiejsza_wersja.mp4"
  },
  {
    "id": "unoszenie-bioder-na-jednej-nodze-w-oparciu-o-aweczke",
    "name": "Unoszenie bioder na jednej nodze w oparciu o ławeczkę",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "lawka",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/unoszenie-bioder-na-jednej-nodze-w-oparciu-o-laweczke",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_unoszenie_bioder_na_jednej_nodze_w_oparciu_o_laweczke.mp4"
  },
  {
    "id": "unoszenie-bioder-na-jednej-nodze-z-hantla",
    "name": "Unoszenie bioder na jednej nodze z hantlą",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/unoszenie-bioder-na-jednej-nodze-z-hantla",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_unoszenie_bioder_na_jednej_nodze_z_hantla.mp4"
  },
  {
    "id": "unoszenie-bioder-w-gore",
    "name": "Unoszenie bioder w górę",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/unoszenie-bioder-w-gore",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_unoszenie_bioder_w_gore.mp4"
  },
  {
    "id": "odwodzenie-nogi-w-ty-z-wykorzystaniem-linki-wyciagu-dolnego",
    "name": "Odwodzenie nogi w tył z wykorzystaniem linki wyciągu dolnego",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/odwodzenie-nogi-w-tyl-z-wykorzystaniem-linki-wyciagu-dolnego",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_odwodzenie_nogi_w_tyl_z_wykorzystaniem_linki_wyciagu_dolnego.mp4"
  },
  {
    "id": "odwodzenie-nogi-w-ty-na-maszynie",
    "name": "Odwodzenie nogi w tył na maszynie",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "maszyna",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/odwodzenie-nogi-w-tyl-na-maszynie",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_odwodzenie_nogi_w_tyl_na_maszynie.mp4"
  },
  {
    "id": "odwodzenie-nogi-w-kleku-podpartym",
    "name": "Odwodzenie nogi w klęku podpartym",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/odwodzenie-nogi-w-kleku-podpartym",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_odwodzenie_nogi_w_kleku_podpartym.mp4"
  },
  {
    "id": "odwodzenie-nogi-w-bok-z-wykorzystaniem-linki-wyciagu-dolnego",
    "name": "Odwodzenie nogi w bok z wykorzystaniem linki wyciągu dolnego",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/odwodzenie-nogi-w-bok-z-wykorzystaniem-linki-wyciagu-dolnego",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_odwodzenie_nogi_w_bok_z_wykorzystaniem_linki_wyciagu_dolnego.mp4"
  },
  {
    "id": "odwodzenie-nog-na-maszynie",
    "name": "Odwodzenie nóg na maszynie",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "maszyna",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/odwodzenie-nog-na-maszynie",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_odwodzenie_nog_na_maszynie.mp4"
  },
  {
    "id": "zginanie-nog-z-guma-miniband",
    "name": "Zginanie nóg z gumą miniband",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/zginanie-nog-z-guma-miniband",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_zginanie_nog_z_miniband.mp4"
  },
  {
    "id": "zginanie-nog-na-maszynie-jednonoz",
    "name": "Zginanie nóg na maszynie jednonóż",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "maszyna",
    "difficulty": "trudne",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/zginanie-nog-na-maszynie-jednonoz",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_zginanie_nog_na_maszynie_jednonoz.mp4"
  },
  {
    "id": "unoszenie-nog-na-awce-skosnej",
    "name": "Unoszenie nóg na ławce skośnej",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "lawka",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/unoszenie-nog-na-lawce-skosnej",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_unoszenie_nog_w_gore_na_lawce_skosnej.mp4"
  },
  {
    "id": "frog-hip-thrust-z-hantla",
    "name": "Frog hip thrust z hantlą",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/frog-hip-thrust-z-hantla",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_frog_hip_thrust_z_hantla.mp4"
  },
  {
    "id": "odwodzenie-nogi-w-pozycji-side-plank",
    "name": "Odwodzenie nogi w pozycji side plank",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/odwodzenie-nogi-w-pozycji-side-plank",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_odwodzenie_nogi_w_pozycji_side_plank.mp4"
  },
  {
    "id": "unoszenie-nog-na-awce-rzymskiej",
    "name": "Unoszenie nóg na ławce rzymskiej",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "lawka",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/unoszenie-nog-na-lawce-rzymskiej",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_unoszenie_nog_na_lawce_rzymskiej.mp4"
  },
  {
    "id": "unoszenie-nog-na-awce-poziomej",
    "name": "Unoszenie nóg na ławce poziomej",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "lawka",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/unoszenie-nog-na-lawce-poziomej",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_unoszenie_nog_na_lawce_poziomej.mp4"
  },
  {
    "id": "stiff-leg-deadlift-z-podwyzszenia",
    "name": "Stiff leg deadlift z podwyższenia",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/stiff-leg-deadlift-z-podwyzszenia",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_stiff_leg_deadlift_z_podwyzszenia.mp4"
  },
  {
    "id": "side-walk",
    "name": "Side walk",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/side-walk",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_side_walk.mp4"
  },
  {
    "id": "rumunski-martwy-ciag-z-hantlami-kickstand",
    "name": "Rumuński martwy ciąg z hantlami kickstand",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/rumunski-martwy-ciag-z-hantlami-kickstand",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_rumunski_martwy_ciag_z_hantlami_kickstand.mp4"
  },
  {
    "id": "rumunski-martwy-ciag-kickstand",
    "name": "Rumuński martwy ciąg kickstand",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/rumunski-martwy-ciag-kickstand",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_rumunski_martwy_ciag_kickstand.mp4"
  },
  {
    "id": "pull-through-z-guma",
    "name": "Pull through z gumą",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/pull-through-z-guma",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_pull_through_z_guma.mp4"
  },
  {
    "id": "odwodzenie-nogi-w-lezeniu-bokiem",
    "name": "Odwodzenie nogi w leżeniu bokiem",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/odwodzenie-nogi-w-lezeniu-bokiem",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_odwodzenie_nogi_w_lezeniu_bokiem.mp4"
  },
  {
    "id": "martwy-ciag-na-jednej-nodze-z-asekuracja",
    "name": "Martwy ciąg na jednej nodze z asekuracją",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/martwy-ciag-na-jednej-nodze-z-asekuracja",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_martwy_ciag_na_jednej_nodze_z_asekuracja.mp4"
  },
  {
    "id": "hamstring-walkout",
    "name": "Hamstring walkout",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/hamstring-walkout",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_hamstring_walkout.mp4"
  },
  {
    "id": "dzien-dobry-ze-sztanga",
    "name": "Dzień dobry ze sztangą",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/dzien-dobry-ze-sztanga",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_dzien_dobry_ze_sztanga.mp4"
  },
  {
    "id": "unoszenie-bioder-z-uniesionymi-palcami-stop",
    "name": "Unoszenie bioder z uniesionymi palcami stóp",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/unoszenie-bioder-z-uniesionymi-palcami-stop",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-unoszenie-bioder-w-gore-z-palcami-uniesionymi.mp4"
  },
  {
    "id": "przywodzenie-kopenhaskie",
    "name": "Przywodzenie kopenhaskie",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/przywodzenie-kopenhaskie",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-przywodzenie-kopenhaskie.mp4"
  },
  {
    "id": "martwy-ciag-sumo-z-podwyzszenia",
    "name": "Martwy ciąg sumo z podwyższenia",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/martwy-ciag-sumo-z-podwyzszenia",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-martwy-ciag-sumo-z-podwyzszenia.mp4"
  },
  {
    "id": "martwy-ciag-z-kettlem-z-podwyzszenia",
    "name": "Martwy ciąg z kettlem z podwyższenia",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "kettlebell",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/martwy-ciag-z-kettlem-z-podwyzszenia",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-martwy-ciag-z-kettlem-z-podwyzszenia.mp4"
  },
  {
    "id": "mostek-biodrowy-z-hantla",
    "name": "Mostek biodrowy z hantlą",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/mostek-biodrowy-z-hantla",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-mostek-biodrowy-z-hantla.mp4"
  },
  {
    "id": "hip-drop",
    "name": "Hip drop",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/hip-drop",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-hip-drop.mp4"
  },
  {
    "id": "klasyczny-martwy-ciag-z-podwyzszenia",
    "name": "Klasyczny martwy ciąg z podwyższenia",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/klasyczny-martwy-ciag-z-podwyzszenia",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-klasyczny-martwy-ciag-z-podwyzszenia.mp4"
  },
  {
    "id": "dzien-dobry-z-guma",
    "name": "Dzień dobry z gumą",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/dzien-dobry-z-guma",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-dzien-dobry-z-guma.mp4"
  },
  {
    "id": "landmine-rdl",
    "name": "Landmine RDL",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/landmine-rdl",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-landmine-rdl.mp4"
  },
  {
    "id": "landmine-deadlift",
    "name": "Landmine deadlift",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/landmine-deadlift",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-landmine-deadlift.mp4"
  },
  {
    "id": "przyciaganie-piet-do-posladkow-z-guma",
    "name": "Przyciąganie pięt do pośladków z gumą",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/przyciaganie-piet-do-posladkow-z-guma",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-przyciaganie-piet-do-posladkow-z-guma.mp4"
  },
  {
    "id": "martwy-ciag-na-jednej-nodze-z-guma",
    "name": "Martwy ciąg na jednej nodze z gumą",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/martwy-ciag-na-jednej-nodze-z-guma",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-martwy-ciag-na-jednej-nodze-z-guma.mp4"
  },
  {
    "id": "martwy-ciag-na-prostych-nogach-z-guma",
    "name": "Martwy ciąg na prostych nogach z gumą",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/martwy-ciag-na-prostych-nogach-z-guma",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-martwy-ciag-na-prostych-nogach-z-guma.mp4"
  },
  {
    "id": "martwy-ciag-z-guma",
    "name": "Martwy ciąg z gumą",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/martwy-ciag-z-guma",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-martwy-ciag-z-guma.mp4"
  },
  {
    "id": "unoszenie-bioder-z-guma",
    "name": "Unoszenie bioder z gumą",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/unoszenie-bioder-z-guma",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-unoszenie-bioder-z-guma.mp4"
  },
  {
    "id": "x-walk",
    "name": "X walk",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/x-walk",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-x-walk.mp4"
  },
  {
    "id": "stiff-leg-deadlift",
    "name": "Stiff leg deadlift",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/stiff-leg-deadlift",
    "videoUrl": "https://static.fabrykasily.pl/atlas/stiff_leg_deadlift.mp4"
  },
  {
    "id": "unoszenie-tu-owia-na-awce-rzymskiej-jednonoz",
    "name": "Unoszenie tułowia na ławce rzymskiej jednonóż",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "lawka",
    "difficulty": "trudne",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/unoszenie-tulowia-na-lawce-rzymskiej-jednonoz",
    "videoUrl": "https://static.fabrykasily.pl/atlas/unoszenie_tułowia_na_ławce_rzymskiej_jednonoz.mp4"
  },
  {
    "id": "zginanie-nog-na-pi-ce-gimnastycznej-lezac-atwiejsza-wersja",
    "name": "Zginanie nóg na piłce gimnastycznej leżąc (łatwiejsza wersja)",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/zginanie-nog-na-pilce-gimnastycznej-lezac",
    "videoUrl": "https://static.fabrykasily.pl/atlas/zginanie_nog_na_pilce_gimnastycznej_lezac_2.mp4"
  },
  {
    "id": "zuraw-atwiejsza-wersja",
    "name": "Żuraw (łatwiejsza wersja)",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/zuraw-latwiejsza-wersja",
    "videoUrl": "https://static.fabrykasily.pl/atlas/zuraw_latwiejsza_wersja.mp4"
  },
  {
    "id": "unoszenie-bioder-z-hantla-w-oparciu-o-aweczke",
    "name": "Unoszenie bioder z hantlą w oparciu o ławeczkę",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda/unoszenie-bioder-z-hantla-w-oparciu-o-laweczke",
    "videoUrl": "https://static.fabrykasily.pl/atlas/unoszenie_bioder_z%20_hantla_w_oparciu_o_laweczke.mp4"
  },
  {
    "id": "frog-hip-thrust",
    "name": "Frog hip thrust",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/frog-hip-thrust",
    "videoUrl": "https://static.fabrykasily.pl/atlas/frog_hipthrust.mp4"
  },
  {
    "id": "przyciaganie-piet-do-posladkow-na-trx",
    "name": "Przyciąganie pięt do pośladków na TRX",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "TRX",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/przyciaganie-piet-do-posladkow-na-trx",
    "videoUrl": "https://static.fabrykasily.pl/atlas/trx_przyciaganie_piet_do_posladkow.mp4"
  },
  {
    "id": "uginanie-nog-z-hantla-w-lezeniu",
    "name": "Uginanie nóg z hantlą w leżeniu",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/uginanie-nog-z-hantla-w-lezeniu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/uginanie_nog_z_hantla_w_lezeniu.mp4"
  },
  {
    "id": "unoszenie-bioder-na-jednej-nodze",
    "name": "Unoszenie bioder na jednej nodze",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda-posladki/unoszenie-bioder-na-jednej-nodze",
    "videoUrl": "https://static.fabrykasily.pl/atlas/unoszenie_bioder_na_jednej_nodze.mp4"
  },
  {
    "id": "martwy-ciag-na-jednej-nodze-z-hantlami",
    "name": "Martwy ciąg na jednej nodze z hantlami",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda/martwy-ciag-na-jednej-nodze-z-hantlami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/martwy_ciag_na_jednej_nodze_fabryka.mp4"
  },
  {
    "id": "unoszenie-bioder-ze-sztanga",
    "name": "Unoszenie bioder ze sztangą",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda/unoszenie-bioder-ze-sztanga",
    "videoUrl": "https://static.fabrykasily.pl/atlas/unoszenie_bioder_ze_sztanga.mp4"
  },
  {
    "id": "unoszenie-bioder-ze-sztanga-w-oparciu-o-aweczke",
    "name": "Unoszenie bioder ze sztangą w oparciu o ławeczkę",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda/unoszenie-bioder-ze-sztanga-w-oparciu-o-laweczke",
    "videoUrl": "https://static.fabrykasily.pl/atlas/unoszenie_bioder_ze_sztanga_w_oparciu_o_laweczke.mp4"
  },
  {
    "id": "zuraw",
    "name": "Żuraw",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda/zuraw",
    "videoUrl": "https://static.fabrykasily.pl/atlas/zuraw.mp4"
  },
  {
    "id": "zuraw-z-pi-ka",
    "name": "Żuraw z piłką",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "pilka",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/dwuglowe-uda/zuraw-z-pilka",
    "videoUrl": "https://static.fabrykasily.pl/atlas/zuraw_z_pilka.mp4"
  },
  {
    "id": "martwy-ciag-na-prostych-nogach-z-hantlami",
    "name": "Martwy ciąg na prostych nogach z hantlami",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/dwuglowe-uda/martwy-ciag-na-prostych-nogach",
    "videoUrl": "https://static.fabrykasily.pl/atlas/martwy_ciag_na_prostych_nogach_z_hantlami.mp4"
  },
  {
    "id": "martwy-ciag-na-prostych-nogach",
    "name": "Martwy ciąg na prostych nogach",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/dwuglowe-uda/martwy-ciag-na-prostych-nogach-barbell",
    "videoUrl": "https://static.fabrykasily.pl/atlas/martwy_ciag_na_prostych_nogach.mp4"
  },
  {
    "id": "zginanie-nog-na-maszynie-lezac-lub-siedzac",
    "name": "Zginanie nóg na maszynie leżąc lub siedząc",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "maszyna",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/dwuglowe-uda/zginanie-nog-na-maszynie-siedzac-seated",
    "videoUrl": "https://static.fabrykasily.pl/atlas/uginanie_nog_na_maszynie_siedzac_lub_lezac.mp4"
  },
  {
    "id": "zginanie-nog-na-pi-ce-gimnastycznej-lezac",
    "name": "Zginanie nóg na piłce gimnastycznej leżąc",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/dwuglowe-uda/zginanie-nog-na-pilce-gimnastycznej-lezac",
    "videoUrl": "https://static.fabrykasily.pl/atlas/zginanie_nog_na_pilce_gimnastycznej_lezac.mp4"
  },
  {
    "id": "wios-owanie-guma-w-opadzie-tu-owia",
    "name": "Wiosłowanie gumą w opadzie tułowia",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/wioslowanie-guma-w-opadzie-tulowia",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wioslowanie_guma_w_opadzie_tulowia.mp4"
  },
  {
    "id": "sciaganie-gumy-jednoracz-z-nad-g-owy",
    "name": "Ściąganie gumy jednorącz z nad głowy",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/sciaganie-gumy-jednoracz-z-nad-glowy",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_sciaganie_gumy_jednaracz_z_nad_glowy.mp4"
  },
  {
    "id": "sciaganie-chwytu-wyciagu-gornego-po-skosie",
    "name": "Ściąganie chwytu wyciągu górnego po skosie",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/sciaganie-chwytu-wyciagu-gornego-po-skosie",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_sciaganie_chwytu_wyciagu_gornego_po_skosie.mp4"
  },
  {
    "id": "sciaganie-chwytu-wyciagu-gornego-jednoracz",
    "name": "Ściąganie chwytu wyciągu górnego jednorącz",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/sciaganie-chwytu-wyciagu-gornego-jednoracz",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_sciaganie_chwytu_wyciagu_gornego_jednoracz.mp4"
  },
  {
    "id": "podciaganie-podchwytem-z-martwego-punktu",
    "name": "Podciąganie podchwytem z martwego punktu",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "drazek",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/podciaganie-podchwytem-z-martwego-punktu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_podciaganie_podchwytem_z_martwego_punktu.mp4"
  },
  {
    "id": "podciaganie-nachwytem-z-martwego-punktu",
    "name": "Podciąganie nachwytem z martwego punktu",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "drazek",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/podciaganie-nachwytem-z-martwego-punktu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_podciaganie_nachwytem_z_martwego_punktu.mp4"
  },
  {
    "id": "podciaganie-chwytem-neutralnym-na-pojedynczym-drazku",
    "name": "Podciąganie chwytem neutralnym na pojedynczym drążku",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "drazek",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/podciaganie-chwytem-neutralnym-na-pojedynczym-drazku",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_podciaganie_chwytem_neutralnym_na_pojedynczym_drazku.mp4"
  },
  {
    "id": "podciaganie-australijskie-jednoracz",
    "name": "Podciąganie australijskie jednorącz",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "drazek",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/podciaganie-australijskie-jednoracz",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_podciaganie_australijskie_jednoracz.mp4"
  },
  {
    "id": "podciaganie-australijskie-podchwytem",
    "name": "Podciąganie australijskie podchwytem",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "drazek",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/podciaganie-australijskie-podchwytem",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_podciaganie_australijskie_podchwytem.mp4"
  },
  {
    "id": "y-raise-z-hantlami-w-opadzie-tu-owia",
    "name": "Y raise z hantlami w opadzie tułowia",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/y-raise-z-hantlami-w-opadzie-tulowia",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_y_raise_z_hantlami_w_opadzie_tulowia.mp4"
  },
  {
    "id": "wios-owanie-kettlebell-z-pod-ogi",
    "name": "Wiosłowanie kettlebell z podłogi",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "kettlebell",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/wioslowanie-kettlebell-z-podlogi",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wioslowanie_z_podlogi_kettlebell.mp4"
  },
  {
    "id": "wios-owanie-hantlami-z-pod-ogi",
    "name": "Wiosłowanie hantlami z podłogi",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/wioslowanie-hantlami-z-podlogi",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wioslowanie_z_podlogi_hantlami.mp4"
  },
  {
    "id": "wios-owanie-w-podporze-na-kolanach",
    "name": "Wiosłowanie w podporze na kolanach",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "masa ciala",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/wioslowanie-w-podporze-na-kolanach",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wioslowanie_w_podporze_na_kolanach.mp4"
  },
  {
    "id": "wios-owanie-w-podporze-z-guma-miniband",
    "name": "Wiosłowanie w podporze z gumą miniband",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "guma",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/wioslowanie-w-podporze-z-guma-miniband",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wioslowanie_w_podporze_miniband.mp4"
  },
  {
    "id": "wios-owanie-w-kleku-jednonoz-z-guma-miniband",
    "name": "Wiosłowanie w klęku jednonóż z gumą miniband",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "guma",
    "difficulty": "trudne",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/wioslowanie-w-kleku-jednonoz-z-guma-miniband",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wioslowanie_w_kleku_jednonoz_miniband.mp4"
  },
  {
    "id": "trx-y-raise",
    "name": "TRX Y raise",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "TRX",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/trx-y-raise",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_trx_y_raise.mp4"
  },
  {
    "id": "trx-wios-owanie-jednoracz-z-rotacja",
    "name": "TRX wiosłowanie jednorącz z rotacją",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "TRX",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/trx-wioslowanie-jednoracz-z-rotacja",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_trx_wioslowanie_jednoracz_z_rotacja.mp4"
  },
  {
    "id": "szrugsy-ze-sztanga",
    "name": "Szrugsy ze sztangą",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/szrugsy-ze-sztanga",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_szrugsy_ze_sztanga.mp4"
  },
  {
    "id": "wios-owanie-na-trx",
    "name": "Wiosłowanie na TRX",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "TRX",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/wioslowanie-na-trx",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wioslowanie_trx.mp4"
  },
  {
    "id": "szrugsy-z-linkami-wyciagu-dolnego",
    "name": "Szrugsy z linkami wyciągu dolnego",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/szrugsy-z-linkami-wyciagu-dolnego",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_szrugsy_z_linkami_wyciagu_dolnego.mp4"
  },
  {
    "id": "szrugsy-z-hantlami",
    "name": "Szrugsy z hantlami",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/szrugsy-z-hantlami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_szrugsy_hantlami.mp4"
  },
  {
    "id": "seal-row",
    "name": "Seal row",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/seal-row",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_seal_row.mp4"
  },
  {
    "id": "podciaganie-z-pomoca-nog",
    "name": "Podciąganie z pomocą nóg",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "drazek",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/podciaganie-z-pomoca-nog",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_podciaganie_z_pomoca_nog.mp4"
  },
  {
    "id": "opuszczanie-na-drazku-podchwyt",
    "name": "Opuszczanie na drążku – podchwyt",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "drazek",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/opuszczanie-na-drazku-podchwyt",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_opuszczanie_na_drazku_podchwyt.mp4"
  },
  {
    "id": "opuszczanie-na-drazku-nachwyt",
    "name": "Opuszczanie na drążku – nachwyt",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "drazek",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/opuszczanie-na-drazku-nachwyt",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_opuszczanie_na_drazku_nachwyt.mp4"
  },
  {
    "id": "back-widow",
    "name": "Back widow",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/back-widow",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_back_widow.mp4"
  },
  {
    "id": "wios-owanie-po-sztanga",
    "name": "Wiosłowanie półsztangą",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/wioslowanie-polsztanga",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-wioslowanie-polsztanga.mp4"
  },
  {
    "id": "zwis-aktywny",
    "name": "Zwis aktywny",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/zwis-aktywny",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-zwis-aktywny.mp4"
  },
  {
    "id": "scap-pull-up",
    "name": "Scap pull up",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/scap-pull-up",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-scap-pull-up.mp4"
  },
  {
    "id": "kayak-row",
    "name": "Kayak row",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/kayak-row",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-kayak-row.mp4"
  },
  {
    "id": "prostopad-e-sciaganie-gumy-do-bioder-lezac",
    "name": "Prostopadłe ściąganie gumy do bioder leżąc",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/prostopadle-sciaganie-gumy-do-bioder-lezac",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-prostopadle-sciaganie-gumy-do-bioder-lezac.mp4"
  },
  {
    "id": "prostopad-e-sciaganie-gumy-do-bioder-stojac",
    "name": "Prostopadłe ściąganie gumy do bioder stojąc",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/prostopadle-sciaganie-gumy-do-bioder-stojac",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-prostopadle-sciaganie-gumy-do-bioder-stojac.mp4"
  },
  {
    "id": "sciaganie-gumy-do-klatki-piersiowej",
    "name": "Ściąganie gumy do klatki piersiowej",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/sciaganie-gumy-do-klatki-piersiowej",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-sciaganie-gumy-do-klatki-piersiowej.mp4"
  },
  {
    "id": "sciaganie-gumy-za-kark",
    "name": "Ściąganie gumy za kark",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/sciaganie-gumy-za-kark",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-sciaganie-gumy-za-kark.mp4"
  },
  {
    "id": "wios-owanie-guma",
    "name": "Wiosłowanie gumą",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/wioslowanie-guma",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-wioslowanie-guma.mp4"
  },
  {
    "id": "sciaganie-chwytem-neutralnym-z-wyciagu-gornego",
    "name": "Ściąganie chwytem neutralnym z wyciągu górnego",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/sciaganie-chwytem-neutralnym-z-wyciagu-gornego",
    "videoUrl": "https://static.fabrykasily.pl/atlas/sciaganie_chwytem_neutralnym_z_wyciagu_gornego.mp4"
  },
  {
    "id": "sciaganie-drazka-nachwytem-na-szerokosc-barkow",
    "name": "Ściąganie drążka nachwytem na szerokość barków",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "drazek",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/sciaganie-drazka-nachwytem-na-szerokosc-barkow",
    "videoUrl": "https://static.fabrykasily.pl/atlas/sciaganie_drazka_nachwytem_na_szerokosc_barkow.mp4"
  },
  {
    "id": "wios-owanie-w-oparciu-o-kolano",
    "name": "Wiosłowanie w oparciu o kolano",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/wioslowanie-w-oparciu-o-kolano",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wioslowanie_w_oparciu_o_kolano.mp4"
  },
  {
    "id": "podciaganie-chwytem-m-otkowym",
    "name": "Podciąganie chwytem młotkowym",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "drazek",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/podciaganie-chwytem-mlotkowym",
    "videoUrl": "https://static.fabrykasily.pl/atlas/podciaganie_chwytem_mlotkowym.mp4"
  },
  {
    "id": "wios-owanie-sztanga-nachwytem-w-pe-nym-opadzie-tu-owia",
    "name": "Wiosłowanie sztangą nachwytem w pełnym opadzie tułowia",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/wioslowanie-sztanga-nachwytem-w-pelnym-opadzie-tulowia",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wioslowanie_sztanaga_trzymana_nachwytem_do_klatki_w_opadzie_tulowia.mp4"
  },
  {
    "id": "wios-o-pendlaya",
    "name": "Wiosło Pendlaya",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/wioslo-pendleya",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wioslo_pendlaya.mp4"
  },
  {
    "id": "trap-y-raise",
    "name": "Trap Y raise",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/trap-y-raise",
    "videoUrl": "https://static.fabrykasily.pl/atlas/trap_y_raise.mp4"
  },
  {
    "id": "wios-owanie-w-podporze-row-renegade",
    "name": "Wiosłowanie w podporze – row renegade",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "masa ciala",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/plecy/wioslowanie-w-podporze-row-renegate",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wioslowanie_w_podporze_row_renegate.mp4"
  },
  {
    "id": "wios-owanie-hantla-w-kleku-podpartym-na-aweczce",
    "name": "Wiosłowanie hantlą w klęku podpartym na ławeczce",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-plecy/wioslowanie-hantla-w-kleku-podpartym",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wioslowanie_hantla_w_kleku_podpartym_na_laweczce.mp4"
  },
  {
    "id": "wios-owanie-hantlami-w-oparciu-o-awke-skosna",
    "name": "Wiosłowanie hantlami w oparciu o ławkę skośną",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-plecy/wioslowanie-hantlami-w-oparciu-o-lawke",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wioslowanie_hantlami_w_oparciu_o_lawke_skosna.mp4"
  },
  {
    "id": "wios-owanie-sztanga-trzymana-nachwytem-do-klatki-w-opadzie-tu-owia",
    "name": "Wiosłowanie sztangą trzymaną nachwytem do klatki w opadzie tułowia",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-plecy/wioslowanie-sztanga-trzymana-nachwytem-do-klatki",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wioslowanie_sztanaga_trzymana_nachwytem_do_klatki_w_opadzie_tulowia.mp4"
  },
  {
    "id": "klasyczny-martwy-ciag",
    "name": "Klasyczny martwy ciąg",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-plecy/klasyczny-martwy-ciag-barbell-deadlift",
    "videoUrl": "https://static.fabrykasily.pl/atlas/klasyczny_martwy_ciag_fabryka.mp4"
  },
  {
    "id": "wios-owanie-z-wykorzystaniem-ko-ek-gimnastycznych-trx-lub-sztangi",
    "name": "Wiosłowanie z wykorzystaniem kółek gimnastycznych, TRX lub sztangi",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-plecy/wioslowanie-z-wykorzystaniem-kolek-gimnastycznych-trx",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wioslowanie_z_wykorzystaniem_kolek_gimnastycznych_trx_lub_sztangi.mp4"
  },
  {
    "id": "podciaganie-na-drazku-trzymanym-nachwytem",
    "name": "Podciąganie na drążku trzymanym nachwytem",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "drazek",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-plecy/podciaganie-na-drazku-trzymanym-nachwytem-pullups",
    "videoUrl": "https://static.fabrykasily.pl/atlas/podciaganie_na_drazku_trzymanym_nachwytem.mp4"
  },
  {
    "id": "podciaganie-na-drazku-trzymanym-podchwytem",
    "name": "Podciąganie na drążku trzymanym podchwytem",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "drazek",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-plecy/podciaganie-na-drazku-trzymanym-podchwytem-chinup",
    "videoUrl": "https://static.fabrykasily.pl/atlas/podciaganie_na_drazku_trzymanym_podchwytem.mp4"
  },
  {
    "id": "podciaganie-na-drazku-trzymanym-szeroko-do-karku",
    "name": "Podciąganie na drążku trzymanym szeroko do karku",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "drazek",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-plecy/podciaganie-na-drazku-trzymanym-szeroko",
    "videoUrl": "https://static.fabrykasily.pl/atlas/podciaganie_na_drazku_trzymanym_szeroko_do_karku.mp4"
  },
  {
    "id": "przyciaganie-drazka-wyciagu-gornego-do-klatki-podchwytem-wasko",
    "name": "Przyciąganie drążka wyciągu górnego do klatki podchwytem wąsko",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-plecy/przyciaganie-drazka-wyciagu-gornego-do-klatki",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przyciaganie_drazka_wyciagu_gornego_do_klatki_podchwytem_wasko.mp4"
  },
  {
    "id": "prostopad-e-przyciaganie-drazka-wyciagu-gornego-do-bioder",
    "name": "Prostopadłe przyciąganie drążka wyciągu górnego do bioder",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-plecy/prostopadle-przyciaganie-drazka-wyciagu-gornego",
    "videoUrl": "https://static.fabrykasily.pl/atlas/prostopadle_przyciaganie_drazka_wyciagu_gornego_do_bioder.mp4"
  },
  {
    "id": "wios-owanie-koncem-sztangi-chwytem-neutralnym-w-opadzie-tu-owia",
    "name": "Wiosłowanie końcem sztangi chwytem neutralnym w opadzie tułowia",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-plecy/wioslowanie-koncem-sztangi-chwytem-neutralnym",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wioslowanie_koncem_sztangi_chwytem_neutralnym_w_opadzie_tulowia.mp4"
  },
  {
    "id": "przyciaganie-konca-sztangi-jednoracz-w-opadzie-tu-owia",
    "name": "Przyciąganie końca sztangi jednorącz w opadzie tułowia",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-plecy/przyciaganie-konca-sztangi-jednoracz-w-opadzie",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przyciaganie_konca_sztangi_jednoracz_w_opadzie_tulowia.mp4"
  },
  {
    "id": "przyciaganie-linki-wyciagu-dolnego-jednoracz",
    "name": "Przyciąganie linki wyciągu dolnego jednorącz",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-plecy/przyciaganie-linki-wyciagu-dolnego-jednoracz",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przyciaganie_linki_wyciagu_dolnego_jednoracz.mp4"
  },
  {
    "id": "przyciaganie-linki-wyciagu-dolnego-siedzac",
    "name": "Przyciąganie linki wyciągu dolnego siedząc",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-plecy/przyciaganie-linki-wyciagu-dolnego-siedzac-seated",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przyciaganie_linki_wyciagu_dolnego_siedzac.mp4"
  },
  {
    "id": "sciaganie-drazka-wyciagu-gornego-do-klatki-nachwytem-szeroko",
    "name": "Ściąganie drążka wyciągu górnego do klatki nachwytem szeroko",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-plecy/sciaganie-drazka-wyciagu-gornego-do-klatki",
    "videoUrl": "https://static.fabrykasily.pl/atlas/sciaganie_drazka_wyciagu_gornego_do_klatki_nachwytem_szeroko.mp4"
  },
  {
    "id": "sciaganie-drazka-wyciagu-gornego-trzymanego-nachwytem-za-kark",
    "name": "Ściąganie drążka wyciągu górnego trzymanego nachwytem za kark",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-plecy/sciaganie-drazka-wyciagu-gornego-trzymanego-nachwytem",
    "videoUrl": "https://static.fabrykasily.pl/atlas/sciaganie_drazka_wyciagu_gornego_nachwytem_za_kark.mp4"
  },
  {
    "id": "unoszenie-tu-owia-na-awce-rzymskiej",
    "name": "Unoszenie tułowia na ławce rzymskiej",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "lawka",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-plecy/unoszenie-tulowia-na-lawce-rzymskiej-hyperextensions",
    "videoUrl": "https://static.fabrykasily.pl/atlas/unoszenie_tulowia_na_lawce_rzymskiej.mp4"
  },
  {
    "id": "wios-owanie-hantlami-w-opadzie-tu-owia",
    "name": "Wiosłowanie hantlami w opadzie tułowia",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-plecy/wioslowanie-hantlami-w-opadzie-tulowia-bentover",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wioslowanie_hantlami_w_opadzie_tulowia.mp4"
  },
  {
    "id": "wios-owanie-na-suwnicy-smitha-w-opadzie-tu-owia",
    "name": "Wiosłowanie na suwnicy Smitha w opadzie tułowia",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-plecy/wioslowanie-na-suwnicy-smitha-w-opadzie",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wioslowanie_na_suwnicy_w_opadzie_tulowia.mp4"
  },
  {
    "id": "wios-owanie-sztanga-trzymana-podchwytem-w-opadzie-tu-owia",
    "name": "Wiosłowanie sztangą trzymaną podchwytem w opadzie tułowia",
    "category": "Plecy",
    "primaryMuscles": [
      "plecy",
      "lopatki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-plecy/wioslowanie-sztanga-trzymana-podchwytem-w-opadzie",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wioslowanie_sztanga_trzymana_podchwytem_w_opadzie_tulowia.mp4"
  },
  {
    "id": "wyciskanie-stojac-z-wykorzystaniem-wyciagu-lub-bramy",
    "name": "Wyciskanie stojąc z wykorzystaniem wyciągu lub bramy",
    "category": "Klatka piersiowa",
    "primaryMuscles": [
      "klatka piersiowa",
      "triceps"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/klatka-piersiowa/wyciskanie-stojac-z-wykorzystaniem-wyciagu-lub-bramy",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wyciskanie_stojac_z_wykorzystaniem_wyciagu_lub_bramy.mp4"
  },
  {
    "id": "wyciskanie-hantli-waskim-chwytem-neutralnym-na-aweczce-p-askiej",
    "name": "Wyciskanie hantli wąskim chwytem neutralnym na ławeczce płaskiej",
    "category": "Klatka piersiowa",
    "primaryMuscles": [
      "klatka piersiowa",
      "triceps"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/klatka-piersiowa/wyciskanie-hantli-waskim-chwytem-neutralnym-na-laweczce-plaskiej",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wyciskanie_hantli_wasko_chwytem_neutralnym_na_laweczce_plaskiej.mp4"
  },
  {
    "id": "rozpietki-z-guma-za-plecami",
    "name": "Rozpiętki z gumą za plecami",
    "category": "Klatka piersiowa",
    "primaryMuscles": [
      "klatka piersiowa",
      "triceps"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/klatka-piersiowa/rozpietki-z-guma-za-plecami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_rozpietki_z_guma_za_plecami.mp4"
  },
  {
    "id": "wyciskanie-sztangi-na-awce-poziomej-ze-stojakow",
    "name": "Wyciskanie sztangi na ławce poziomej ze stojaków",
    "category": "Klatka piersiowa",
    "primaryMuscles": [
      "klatka piersiowa",
      "triceps"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/klatka-piersiowa/wyciskanie-sztangi-na-lawce-poziomej-ze-stojakow",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wyciskanie_sztangi_na_lawce_poziomej_ze_stojakow.mp4"
  },
  {
    "id": "wyciskanie-z-guma-za-plecami",
    "name": "Wyciskanie z gumą za plecami",
    "category": "Klatka piersiowa",
    "primaryMuscles": [
      "klatka piersiowa",
      "triceps"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/klatka-piersiowa/wyciskanie-z-guma-za-plecami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wyciskanie_z_guma_za_plecami.mp4"
  },
  {
    "id": "wyciskanie-sztangi-na-pod-odze-w-domu",
    "name": "Wyciskanie sztangi na podłodze w domu",
    "category": "Klatka piersiowa",
    "primaryMuscles": [
      "klatka piersiowa",
      "triceps"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/klatka-piersiowa/wyciskanie-sztangi-na-podlodze-w-domu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wyciskanie_sztangi_na_podlodze_w_domu.mp4"
  },
  {
    "id": "wyciskanie-sztangi-na-pod-odze",
    "name": "Wyciskanie sztangi na podłodze",
    "category": "Klatka piersiowa",
    "primaryMuscles": [
      "klatka piersiowa",
      "triceps"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/klatka-piersiowa/wyciskanie-sztangi-na-podlodze",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wyciskanie_sztangi_na_podlodze.mp4"
  },
  {
    "id": "wyciskanie-na-pod-odze-jednoracz",
    "name": "Wyciskanie na podłodze jednorącz",
    "category": "Klatka piersiowa",
    "primaryMuscles": [
      "klatka piersiowa",
      "triceps"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/klatka-piersiowa/wyciskanie-na-podlodze-jednoracz",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wyciskanie_na_podlodze_jednoracz.mp4"
  },
  {
    "id": "rozpietki-z-hantlami-w-lezeniu-na-pod-odze",
    "name": "Rozpiętki z hantlami w leżeniu na podłodze",
    "category": "Klatka piersiowa",
    "primaryMuscles": [
      "klatka piersiowa",
      "triceps"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/klatka-piersiowa/rozpietki-z-hantlami-w-lezeniu-na-podlodze",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_rozpietki_hantlami_lezac_na_podlodze.mp4"
  },
  {
    "id": "rozpietki-na-trx",
    "name": "Rozpiętki na TRX",
    "category": "Klatka piersiowa",
    "primaryMuscles": [
      "klatka piersiowa",
      "triceps"
    ],
    "equipment": "TRX",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/klatka-piersiowa/rozpietki-na-trx",
    "videoUrl": "https://static.fabrykasily.pl/atlas/rozpietki_trx.mp4"
  },
  {
    "id": "pompki-podwieszane-na-trx",
    "name": "Pompki podwieszane na TRX",
    "category": "Klatka piersiowa",
    "primaryMuscles": [
      "klatka piersiowa",
      "triceps"
    ],
    "equipment": "TRX",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/klatka-piersiowa/pompki-podwieszane-na-trx",
    "videoUrl": "https://static.fabrykasily.pl/atlas/pompki_podwieszone_trx.mp4"
  },
  {
    "id": "wyciskanie-sztangi-na-awce-skosnej-g-owa-w-do",
    "name": "Wyciskanie sztangi na ławce skośnej głową w dół",
    "category": "Klatka piersiowa",
    "primaryMuscles": [
      "klatka piersiowa",
      "triceps"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/klatka-piersiowa/wyciskanie-sztangi-na-lawce-skosnej-glowa-w-dol",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wyciskanie_sztangi_lawce_skosnej_glowa_w_dol.mp4"
  },
  {
    "id": "pompki-na-trx",
    "name": "Pompki na TRX",
    "category": "Klatka piersiowa",
    "primaryMuscles": [
      "klatka piersiowa",
      "triceps"
    ],
    "equipment": "TRX",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/klatka-piersiowa/pompki-na-trx",
    "videoUrl": "https://static.fabrykasily.pl/atlas/trx_pompki.mp4"
  },
  {
    "id": "floor-press",
    "name": "Floor press",
    "category": "Klatka piersiowa",
    "primaryMuscles": [
      "klatka piersiowa",
      "triceps"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/klatka-piersiowa/floor-press",
    "videoUrl": "https://static.fabrykasily.pl/atlas/floor_press_1.mp4"
  },
  {
    "id": "rozpietki-z-wykorzystaniem-wyciagu-dolnego",
    "name": "Rozpiętki z wykorzystaniem wyciągu dolnego",
    "category": "Klatka piersiowa",
    "primaryMuscles": [
      "klatka piersiowa",
      "triceps"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/klatka-piersiowa/rozpietki-z-wykorzystaniem-wyciagu-dolnego",
    "videoUrl": "https://static.fabrykasily.pl/atlas/rozpietki_z_wykorzystaniem_wyciagu_dolnego.mp4"
  },
  {
    "id": "przenoszenie-sztangielki-za-g-owe",
    "name": "Przenoszenie sztangielki za głowę",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-klatke-piersiowa/przenoszenie-sztangielki-za-glowe-bentarm-dumbbell",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przenoszenie_sztangielki_za_glowe.mp4"
  },
  {
    "id": "wyciskanie-sztangielek-na-awce-skosnej-g-owa-w-do",
    "name": "Wyciskanie sztangielek na ławce skośnej głową w dół",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-klatke-piersiowa/wyciskanie-sztangielek-na-lawce-skosnej-glowa",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wyciskanie_sztangielek_na_lawce_skosnej_glowa_w_dol.mp4"
  },
  {
    "id": "rozpietki-z-hantlami-na-awce-p-askiej",
    "name": "Rozpiętki z hantlami na ławce płaskiej",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-klatke-piersiowa/rozpietki-z-hantlami-na-lawce-plaskiej",
    "videoUrl": "https://static.fabrykasily.pl/atlas/rozpietki_z_hantlami_na_ławce_płaskiej.mp4"
  },
  {
    "id": "rozpietki-z-wykorzystaniem-wyciagow",
    "name": "Rozpiętki z wykorzystaniem wyciągów",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-klatke-piersiowa/rozpietki-z-wykorzystaniem-wyciagow-cable-crossover",
    "videoUrl": "https://static.fabrykasily.pl/atlas/rozpietki_z_wykorzystaniem_wyciagow.mp4"
  },
  {
    "id": "rozpietki-na-maszynie-butterfly",
    "name": "Rozpiętki na maszynie butterfly",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "maszyna",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-klatke-piersiowa/rozpietki-na-maszynie-butterfly-butterfly",
    "videoUrl": "https://static.fabrykasily.pl/atlas/rozpietki_na_maszynie_butterfly.mp4"
  },
  {
    "id": "pompki-na-poreczach",
    "name": "Pompki na poręczach",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-klatke-piersiowa/pompki-na-poreczach-dips-chest",
    "videoUrl": "https://static.fabrykasily.pl/atlas/pompki_na_poreczach.mp4"
  },
  {
    "id": "wyciskanie-sztangi-na-awce-p-askiej-do-brody-gilotyna",
    "name": "Wyciskanie sztangi na ławce płaskiej do brody, gilotyna",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-klatke-piersiowa/wyciskanie-sztangi-na-lawce-plaskiej",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wyciskanie_sztangi_na_lawce_plaskiej_do_brody_gilotyna.mp4"
  },
  {
    "id": "rozpietki-z-wykorzystaniem-wyciagu-na-awce-dodatniej",
    "name": "Rozpiętki z wykorzystaniem wyciągu na ławce dodatniej",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-klatke-piersiowa/rozpietki-z-wykorzystaniem-wyciagu-na-lawce",
    "videoUrl": "https://static.fabrykasily.pl/atlas/rozpietki_z_wykorzystaniem_wyciagu_na_lawce_dodatniej.mp4"
  },
  {
    "id": "wyciskanie-na-suwnicy-smitha-lezac-na-awce-p-askiej",
    "name": "Wyciskanie na suwnicy Smitha leżąc na ławce płaskiej",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-klatke-piersiowa/wyciskanie-na-suwnicy-smitha-lezac",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wyciskanie_na_suwnicy_smitha_lezac_na_lawce_plaskiej.mp4"
  },
  {
    "id": "rozpietki-z-wykorzystaniem-wyciagu-na-awce-p-askiej",
    "name": "Rozpiętki z wykorzystaniem wyciągu na ławce płaskiej",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-klatke-piersiowa/rozpietki-z-wykorzystaniem-wyciagu-na-lawce-2",
    "videoUrl": "https://static.fabrykasily.pl/atlas/rozpietki_z_wykorzystaniem_wyciagu_na_lawce_plaskiej.mp4"
  },
  {
    "id": "wyciskanie-sztangielek-na-awce-dodatniej",
    "name": "Wyciskanie sztangielek na ławce dodatniej",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-klatke-piersiowa/wyciskanie-sztangielek-na-lawce-dodatniej-incline",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wyciskanie_sztangielek_na_lawce_dodatniej.mp4"
  },
  {
    "id": "wyciskanie-sztangielek-chwytem-neutralnym-na-awce-ze-skosem-dodatnim",
    "name": "Wyciskanie sztangielek chwytem neutralnym na ławce ze skosem dodatnim",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-klatke-piersiowa/wyciskanie-sztangielek-chwytem-neutralnym-na-lawce",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wyciskanie_sztangielek_chwytem_neutralnym_na_lawce_ze_skosem_dodatnim.mp4"
  },
  {
    "id": "rozpietki-z-hantlami-na-awce-dodatniej",
    "name": "Rozpiętki z hantlami na ławce dodatniej",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-klatke-piersiowa/rozpietki-z-hantlami-na-lawce-dodatniej",
    "videoUrl": "https://static.fabrykasily.pl/atlas/rozpietki_z_hantlami_na_lawce_dodatniej.mp4"
  },
  {
    "id": "wznosy-ramion-z-wykorzystaniem-dolnego-wyciagu",
    "name": "Wznosy ramion z wykorzystaniem dolnego wyciągu",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-klatke-piersiowa/wznosy-ramion-z-wykorzystaniem-dolnego-wyciagu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/unoszenie_ramion_w_gore_z_wykorzystaniem_linek_wyciagu_dolnego.mp4"
  },
  {
    "id": "wyciskanie-na-maszynie-hammer",
    "name": "Wyciskanie na maszynie hammer",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "maszyna",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-klatke-piersiowa/wyciskanie-na-maszynie-hammer-leverage-chest",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wyciskanie_na_maszynie_hammer.mp4"
  },
  {
    "id": "wyciskanie-sztangi-na-awce-p-askiej",
    "name": "Wyciskanie sztangi na ławce płaskiej",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-klatke-piersiowa/wyciskanie-sztangi-na-lawce-plaskiej-barbell",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wyciskanie_sztangi_na_lawce_plaskiej.mp4"
  },
  {
    "id": "wyciskanie-sztangi-na-awce-dodatniej",
    "name": "Wyciskanie sztangi na ławce dodatniej",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-klatke-piersiowa/wyciskanie-sztangi-na-lawce-dodatniej-incline",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wyciskanie_sztangi_na_lawce_dodatniej.mp4"
  },
  {
    "id": "wyciskanie-sztangielek-na-awce-p-askiej",
    "name": "Wyciskanie sztangielek na ławce płaskiej",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-klatke-piersiowa/wyciskanie-sztangielek-na-lawce-plaskiej-dumbbell",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wyciskanie_sztangielek_na_lawce_plaskiej.mp4"
  },
  {
    "id": "trx-odwrocone-rozpietki",
    "name": "TRX odwrócone rozpiętki",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "TRX",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/barki/trx-odwrocone-rozpietki",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_trx_reverse_fly.mp4"
  },
  {
    "id": "trx-face-pull",
    "name": "TRX face pull",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "TRX",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/barki/trx-face-pull",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_trx_face_pull.mp4"
  },
  {
    "id": "przenoszenie-ramion-z-guma-miniband",
    "name": "Przenoszenie ramion z gumą miniband",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/barki/przenoszenie-ramion-z-guma-miniband",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przenoszenie_ramion_z_miniband.mp4"
  },
  {
    "id": "powell-raise",
    "name": "Powell raise",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/barki/powell-raise",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_powell_raise.mp4"
  },
  {
    "id": "t-raise-z-hantlami-w-opadzie-tu-owia",
    "name": "T raise z hantlami w opadzie tułowia",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/barki/t-raise-z-hantlami-w-opadzie-tulowia",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_t_raise_z_hantlami_w_opadzie_tulowia.mp4"
  },
  {
    "id": "rotacja-wewnetrzna-na-wyciagu",
    "name": "Rotacja wewnętrzna na wyciągu",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/barki/rotacja-wewnetrzna-na-wyciagu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-rotacja-wewnetrzna-na-wyciagu.mp4"
  },
  {
    "id": "rotacja-zewnetrzna-na-wyciagu",
    "name": "Rotacja zewnętrzna na wyciągu",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/barki/rotacja-zewnetrzna-na-wyciagu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-rotacja-zewnetrzna-na-wyciagu.mp4"
  },
  {
    "id": "z-press",
    "name": "Z-press",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/barki/zpress",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-z-press.mp4"
  },
  {
    "id": "face-pull-z-guma",
    "name": "Face pull z gumą",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/barki/face-pull-guma",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-face-pull-guma.mp4"
  },
  {
    "id": "landmine-press",
    "name": "Landmine press",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/barki/landmine-press",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-landmine-press.mp4"
  },
  {
    "id": "landmine-press-half-kneeling",
    "name": "Landmine press half kneeling",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/barki/landmine-press-half-kneeling",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-landmine-press-half-kneeling.mp4"
  },
  {
    "id": "wyciskanie-jednoracz-nad-g-owe-z-guma",
    "name": "Wyciskanie jednorącz nad głowę z gumą",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/barki/cuban-press/wyciskanie-jednoracz-nad-glowe-z-guma",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-wyciskanie-jednoracz-nad-glowe-z-guma.mp4"
  },
  {
    "id": "wyciskanie-ramion-z-guma-nad-g-owe",
    "name": "Wyciskanie ramion z gumą nad głowę",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/barki/wyciskanie-ramion-z-guma-nad-glowe",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-wyciskanie-ramion-z-guma-nad-glowe.mp4"
  },
  {
    "id": "wznosy-ramion-w-bok-z-guma",
    "name": "Wznosy ramion w bok z gumą",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/barki/cuban-press/wznosy-ramion-w-bok-z-guma",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-wznosy-ramion-w-bok-z-guma.mp4"
  },
  {
    "id": "wznosy-ramion-w-przod-z-guma",
    "name": "Wznosy ramion w przód z gumą",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/barki/wznosy-ramion-w-przod-z-guma",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-wznosy-ramion-w-przod-z-guma.mp4"
  },
  {
    "id": "cuban-press",
    "name": "Cuban press",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/barki/cuban-press",
    "videoUrl": "https://static.fabrykasily.pl/atlas/cuban_press.mp4"
  },
  {
    "id": "wyciskanie-hantli-w-kleku-jednonoz",
    "name": "Wyciskanie hantli w klęku jednonóż",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "hantle",
    "difficulty": "trudne",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/barki/wyciskanie-hantli-w-kleku-jednonoz",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wyciskanie_hantli_w_kleku_jednonoz.mp4"
  },
  {
    "id": "unoszenie-ramienia-z-wykorzystaniem-linki-wyciagu-dolnego",
    "name": "Unoszenie ramienia z wykorzystaniem linki wyciągu dolnego",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/barki/unoszenie-ramienia-z-wykorzystaniem-linki-wyciagu-dolnego",
    "videoUrl": "https://static.fabrykasily.pl/atlas/unoszenie_ramienia_z_wykorzystaniem_linki_wyciagu_dolnego.mp4"
  },
  {
    "id": "rotacja-zewnetrzna-w-lezeniu-bokiem",
    "name": "Rotacja zewnętrzna w leżeniu bokiem",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/barki/rotacja-zewnetrzna-w-lezeniu-bokiem",
    "videoUrl": "https://static.fabrykasily.pl/atlas/rotacja_zewnetrzna_w_lezeniu_bokiem.mp4"
  },
  {
    "id": "rotacje-kubanskie-z-hantlami",
    "name": "Rotacje kubańskie z hantlami",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/barki/rotacje-kubanskie-z-hantlami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/rotacje_kubanskie_z_hantlami.mp4"
  },
  {
    "id": "rotacje-zewnetrzne-ramienia-hantla-siedzac",
    "name": "Rotacje zewnętrzne ramienia hantlą siedząc",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/barki/rotacje-zewnetrzne-ramienia-hantla-siedzac",
    "videoUrl": "https://static.fabrykasily.pl/atlas/rotacje_zewnetrzne_ramienia_hantla_siedzac.mp4"
  },
  {
    "id": "przyciaganie-liny-z-wyciagu-do-twarzy-face-pull",
    "name": "Przyciąganie liny z wyciągu do twarzy (Face pull)",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/barki/przyciaganie-liny-z-wyciagu-do-twarzy-face-pull",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przyciaganie_liny_z_wyciagu_do_twarzy.mp4"
  },
  {
    "id": "t-raise-na-aweczce",
    "name": "T raise na ławeczce",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "lawka",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/barki/t-raise-na-laweczce",
    "videoUrl": "https://static.fabrykasily.pl/atlas/t_raise_na_laweczce.mp4"
  },
  {
    "id": "wyciskanie-sztangi-zza-g-owy-stojac",
    "name": "Wyciskanie sztangi zza głowy stojąc",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-barki/wyciskanie-sztangi-zza-glowy-stojac-standing",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wyciskanie_sztangi_zza_glowy_stojac.mp4"
  },
  {
    "id": "wyciskanie-sztangi-na-maszynie-smitha-siedzac",
    "name": "Wyciskanie sztangi na maszynie Smitha siedząc",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "sztanga",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-barki/wyciskanie-sztangi-na-maszynie-smith-siedzac",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wyciskanie_sztangi_na_maszynie_smith_siedzac.mp4"
  },
  {
    "id": "unoszenie-ramion-w-przod-ze-sztanga-w-oparciu-o-awke-dodatnia",
    "name": "Unoszenie ramion w przód ze sztangą w oparciu o ławkę dodatnią",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-barki/unoszenie-ramion-w-przod-ze-sztanga",
    "videoUrl": "https://static.fabrykasily.pl/atlas/unoszenie_ramion_w_przod_ze_sztanga_w_oparciu_o_lawke_dodatnia.mp4"
  },
  {
    "id": "arnoldki-wyciskanie-hantli-nad-g-owe-z-rotacja",
    "name": "Arnoldki – wyciskanie hantli nad głowę z rotacją",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-barki/arnoldki-wyciskanie-hantli-nad-glowe",
    "videoUrl": "https://static.fabrykasily.pl/atlas/arnoldki_wyciskanie_hantli_nad_glowe_z_rotacja.mp4"
  },
  {
    "id": "odwodzenie-linek-w-ty-wyciagu-stojac",
    "name": "Odwodzenie linek w tył wyciągu stojąc",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-barki/odwodzenie-linek-w-tyl-wyciagu-stojac",
    "videoUrl": "https://static.fabrykasily.pl/atlas/odwodzenie_linek_w_tyl_wyciagu_stojac.mp4"
  },
  {
    "id": "naprzemianstronne-unoszenie-ramion-w-przod-z-wykorzystaniem-wyciagu-dolnego",
    "name": "Naprzemianstronne unoszenie ramion w przód z wykorzystaniem wyciągu dolnego",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-barki/naprzemianstronne-unoszenie-ramion-w-przod",
    "videoUrl": "https://static.fabrykasily.pl/atlas/naprzemianstronne_unoszenie_ramion_w_przod_z_wykorzystaniem_wyciagu_dolnego.mp4"
  },
  {
    "id": "naprzemianstronne-unoszenie-ramion-w-przod-ze-sztangielkami",
    "name": "Naprzemianstronne unoszenie ramion w przód ze sztangielkami",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-barki/naprzemianstronne-unoszenie-ramion-w-przod-2",
    "videoUrl": "https://static.fabrykasily.pl/atlas/naprzemienne_unoszenie_ramion_w_przod_ze_sztangielkami.mp4"
  },
  {
    "id": "naprzemienne-wyciskanie-hantli-nad-g-owe-stojac",
    "name": "Naprzemienne wyciskanie hantli nad głowę stojąc",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-barki/naprzemienne-wyciskanie-hantli-nad-glowe-stojac",
    "videoUrl": "https://static.fabrykasily.pl/atlas/naprzemienne_wyciskanie_hantli_nad_glowe_stojac.mp4"
  },
  {
    "id": "podciaganie-sztangi-pod-brode",
    "name": "Podciąganie sztangi pod brodę",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-barki/podciaganie-sztangi-pod-brode-upright-barbell",
    "videoUrl": "https://static.fabrykasily.pl/atlas/podciaganie_sztangi_pod_brode.mp4"
  },
  {
    "id": "przyciaganie-liny-z-wyciagu-gornego-do-klatki-piersiowej",
    "name": "Przyciąganie liny z wyciągu górnego do klatki piersiowej",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-barki/przyciaganie-liny-z-wyciagu-gornego",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przyciaganie_liny_z_wyciagu_gornego_do_klatki_piersiowej.mp4"
  },
  {
    "id": "wyciskanie-ramion-nad-g-owe-siedzac-z-wykorzystaniem-wyciagu",
    "name": "Wyciskanie ramion nad głowę siedząc z wykorzystaniem wyciągu",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-barki/wyciskanie-ramion-nad-glowe-siedzac",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wyciskanie_ramion_nad_glowe_siedzac_z_wykorzystaniem_wyciagu.mp4"
  },
  {
    "id": "unoszenie-ramion-w-bok-ze-sztangielkami-w-pozycji-siedzacej",
    "name": "Unoszenie ramion w bok ze sztangielkami w pozycji siedzącej",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-barki/unoszenie-ramion-w-bok-ze-sztangielkami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/unoszenie_ramion_w_bok_ze_sztangielkami_w_pozycji_siedzacej.mp4"
  },
  {
    "id": "odwodzenie-ramion-w-bok-ze-sztangielkami",
    "name": "Odwodzenie ramion w bok ze sztangielkami",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-barki/odwodzenie-ramion-w-bok-ze-sztangielkami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/odwodzenie_ramion_w_bok_ze_sztangielkami.mp4"
  },
  {
    "id": "unoszenie-ramion-w-przod-ze-sztangielkami",
    "name": "Unoszenie ramion w przód ze sztangielkami",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-barki/unoszenie-ramion-w-przod-ze-sztangielkami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/unoszenie_ramion_w_przod_ze_sztangielkami.mp4"
  },
  {
    "id": "unoszenie-ramion-w-przod-ze-sztangielka-trzymana-oburacz",
    "name": "Unoszenie ramion w przód ze sztangielką trzymaną oburącz",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-barki/unoszenie-ramion-w-przod-ze-sztangielka",
    "videoUrl": "https://static.fabrykasily.pl/atlas/unoszenie_ramion_w_przod_ze_sztangielka_trzymana_oburacz.mp4"
  },
  {
    "id": "wyciskanie-sztangi-nad-g-owe",
    "name": "Wyciskanie sztangi nad głowę",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-barki/wyciskanie-sztangi-nad-glowe-standing-front",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wyciskanie_sztangi_nad_glowe.mp4"
  },
  {
    "id": "wyciskanie-hantli-nad-g-owe-siedzac",
    "name": "Wyciskanie hantli nad głowę siedząc",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-barki/wyciskanie-hantli-nad-glowe-siedzac-seated",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wyciskanie_hantli_nad_glowe_siedzac.mp4"
  },
  {
    "id": "wyciskanie-hantli-nad-g-owe-stojac",
    "name": "Wyciskanie hantli nad głowę stojąc",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-barki/wyciskanie-hantli-nad-glowe-stojac-standing",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wyciskanie_hantli_nad_glowe_stojac.mp4"
  },
  {
    "id": "wyciskanie-nad-g-owe-na-maszynie-chwytem-neutralnym",
    "name": "Wyciskanie nad głowę na maszynie chwytem neutralnym",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "maszyna",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-barki/wyciskanie-nad-glowe-na-maszynie-chwytem",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wyciskanie_nad_glowe_na_maszynie_chwytem_neutralnym.mp4"
  },
  {
    "id": "wyciskanie-nad-g-owe-z-linkami-wyciagu-dolnego",
    "name": "Wyciskanie nad głowę z linkami wyciągu dolnego",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-barki/wyciskanie-nad-glowe-z-linkami-wyciagu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wyciskanie_ramion_nad_glowe_siedzac_z_wykorzystaniem_wyciagu.mp4"
  },
  {
    "id": "wyciskanie-sztangielki-jednoracz-nad-g-owe-stojac",
    "name": "Wyciskanie sztangielki jednorącz nad głowę stojąc",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-barki/wyciskanie-sztangielki-jednoracz-nad-glowe-stojac",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wyciskanie_sztangielki_jednoracz_nad_glowe_stojac.mp4"
  },
  {
    "id": "wznosy-ramion-w-bok-w-opadzie-tu-owia-siedzac",
    "name": "Wznosy ramion w bok w opadzie tułowia siedząc",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-barki/wznosy-ramion-w-bok-w-opadzie",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wznosy_ramion_w_bok_w_opadzie_tulowia_siedzac.mp4"
  },
  {
    "id": "wznosy-ramion-w-bok-w-opadzie-tu-owia",
    "name": "Wznosy ramion w bok w opadzie tułowia",
    "category": "Barki",
    "primaryMuscles": [
      "barki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-barki/wznosy-ramion-w-bok-w-opadzie-2",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wznosy_ramion_w_bok_w_opadzie_tulowia.mp4"
  },
  {
    "id": "trx-superman-na-kolanach",
    "name": "TRX superman na kolanach",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "TRX",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/trx-superman-na-kolanach",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_trx_superman_na_kolanach.mp4"
  },
  {
    "id": "trx-body-saw",
    "name": "TRX body saw",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "TRX",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/trx-body-saw",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_trx_body_saw.mp4"
  },
  {
    "id": "rotacje-w-pozycji-podporu-bokiem",
    "name": "Rotacje w pozycji podporu bokiem",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/rotacje-w-pozycji-podporu-bokiem",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_rotacje_w_pozycji_podporu_bokiem.mp4"
  },
  {
    "id": "rotacje-w-pozycji-deski-bokiem",
    "name": "Rotacje w pozycji deski bokiem",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/rotacje-w-pozycji-deski-bokiem",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_rotacje_w_pozycji_deski_bokiem.mp4"
  },
  {
    "id": "dotykanie-przeciwnych-barkow-w-podporze",
    "name": "Dotykanie przeciwnych barków w podporze",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/dotykanie-przeciwnych-barkow-w-podporze",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_dotykanie_przeciwnych_barkow_w_podporze.mp4"
  },
  {
    "id": "deska-na-kolanach",
    "name": "Deska na kolanach",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/deska-na-kolanach",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_deska_na_kolanach.mp4"
  },
  {
    "id": "pallof-press-w-pozycji-wykrocznej",
    "name": "Pallof press w pozycji wykrocznej",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/pallof-press-w-pozycji-wykrocznej",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_pallof_press_w_pozycji_wykrocznej.mp4"
  },
  {
    "id": "pallof-press-w-pozycji-wykrocznej-na-wyciagu",
    "name": "Pallof press w pozycji wykrocznej na wyciągu",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/pallof-press-w-pozycji-wykrocznej-na-wyciagu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_pallof_press_w_pozycji_wykrocznej_na_wyciagu.mp4"
  },
  {
    "id": "deska-bokiem-na-kolanach",
    "name": "Deska bokiem na kolanach",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/deska-bokiem-na-kolanach",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_deska_bokiem_na_kolanach.mp4"
  },
  {
    "id": "chaos-pallof-press",
    "name": "Chaos pallof press",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/chaos-pallof-press",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_chaos_pallof_press.mp4"
  },
  {
    "id": "przyciaganie-reki-do-przeciwnej-nogi",
    "name": "Przyciąganie ręki do przeciwnej nogi",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/przyciaganie-reki-do-przeciwnej-nogi",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przyciaganie_reki_do_przeciwnej_nogi.mp4"
  },
  {
    "id": "nozyce-nogami",
    "name": "Nożyce nogami",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/nozyce-nogami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_nozyce_nogami.mp4"
  },
  {
    "id": "deska-na-trx",
    "name": "Deska na TRX",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "TRX",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/deska-na-trx",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_deska_trx.mp4"
  },
  {
    "id": "deska-na-pi-ce",
    "name": "Deska na piłce",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/deska-na-pilce",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_deska_na_pilce.mp4"
  },
  {
    "id": "brzuszki-z-rekami-na-klatce-piersiowej",
    "name": "Brzuszki z rękami na klatce piersiowej",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/brzuszki-z-rekami-na-klatce-piersiowej",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_brzuszki_z_rekami_na_klatce_piersiowej.mp4"
  },
  {
    "id": "wycieraczki-nogi-ugiete",
    "name": "Wycieraczki – nogi ugięte",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/wycieraczki-nogi-ugiete",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wycieraczki_nogi_ugiete.mp4"
  },
  {
    "id": "wycieraczki-nogi-proste",
    "name": "Wycieraczki – nogi proste",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/wycieraczki-nogi-proste",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wycieraczki_nogi_proste.mp4"
  },
  {
    "id": "unoszenie-prostych-nog-na-stojaku",
    "name": "Unoszenie prostych nóg na stojaku",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/unoszenie-prostych-nog-na-stojaku",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_unoszenie_prostych_nog_w_gore_na_stojaku.mp4"
  },
  {
    "id": "unoszenie-kolan-na-skos-w-zwisie-na-drazku",
    "name": "Unoszenie kolan na skos w zwisie na drążku",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "drazek",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/unoszenie-kolan-na-skos-w-zwisie-na-drazku",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_unoszenie_kolan_na_skos_w_zwisie_na_drazku.mp4"
  },
  {
    "id": "spiecia-brzucha-z-linkami-wyciagu-gornego",
    "name": "Spięcia brzucha z linkami wyciągu górnego",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/spiecia-brzucha-z-linkami-wyciagu-gornego",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_spiecia_brzucha_z_linkami_wyciagu_gornego.mp4"
  },
  {
    "id": "rotacje-w-kleku-jednonoz-z-hantla",
    "name": "Rotacje w klęku jednonóż z hantlą",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "hantle",
    "difficulty": "trudne",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/rotacje-w-kleku-jednonoz-z-hantla",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_rotacje_w_kleku_jednonoz_z_hantla.mp4"
  },
  {
    "id": "przyciaganie-kolan-do-klatki-na-stojaku",
    "name": "Przyciąganie kolan do klatki na stojaku",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/przyciaganie-kolan-do-klatki-na-stojaku",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przyciaganie_kolan_do_klatki_na_stojaku.mp4"
  },
  {
    "id": "naprzemienne-przyciaganie-kolan-z-guma-miniband",
    "name": "Naprzemienne przyciąganie kolan z gumą miniband",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/naprzemienne-przyciaganie-kolan-z-guma-miniband",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_naprzemienne_przyciaganie_kolan_z_miniband.mp4"
  },
  {
    "id": "krazenia-ramion-w-podporze-na-pi-ce",
    "name": "Krążenia ramion w podporze na piłce",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/krazenia-ramion-w-podporze-na-pilce",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_krazenia_ramionami_w_podporze_na_pilce.mp4"
  },
  {
    "id": "spacer-farmera",
    "name": "Spacer farmera",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/spacer-farmera",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-spacer-farmera.mp4"
  },
  {
    "id": "spacer-farmera-z-ciezarem-po-jednej-stronie-nad-klatka-piersiowa",
    "name": "Spacer farmera z ciężarem po jednej stronie nad klatką piersiową",
    "category": "Klatka piersiowa",
    "primaryMuscles": [
      "klatka piersiowa",
      "triceps"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/spacer-farmera-z-ciezarem-po-jednej-stronie-nad-klatka-piersiowa",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-spacer-farmera-z-ciezarem-po-jednej-stronie-nad-klatka-piersiowa.mp4"
  },
  {
    "id": "spacer-farmera-z-ciezarem-nad-klatka-piersiowa",
    "name": "Spacer farmera z ciężarem nad klatką piersiową",
    "category": "Klatka piersiowa",
    "primaryMuscles": [
      "klatka piersiowa",
      "triceps"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/spacer-farmera-z-ciezarem-nad-klatka-piersiowa",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-spacer-farmer-z-ciezarem-nad-klatka-piersiowa.mp4"
  },
  {
    "id": "suitcase-walk",
    "name": "Suitcase walk",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/suitcase-walk",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-suitcase-walk.mp4"
  },
  {
    "id": "pallof-press-na-wyciagu",
    "name": "Pallof press na wyciągu",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/pallof-press-na-wyciagu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-pallof-press-na-wyciagu.mp4"
  },
  {
    "id": "landmine-twist",
    "name": "Landmine twist",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/landmine-twist",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-landmine-twist.mp4"
  },
  {
    "id": "janda-sit-up",
    "name": "Janda sit up",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/janda-sit-up",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-janda-situp.mp4"
  },
  {
    "id": "body-saw",
    "name": "Body saw",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/body-saw",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-body-saw.mp4"
  },
  {
    "id": "ab-roller-na-kolanach-z-przedramionami-na-pi-ce",
    "name": "Ab roller na kolanach z przedramionami na piłce",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "roller",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/ab-roller-na-kolanach-z-przedramionami-na-pilce",
    "videoUrl": "https://static.fabrykasily.pl/atlas/ab_roller_na_kolanach_z_pilka.mp4"
  },
  {
    "id": "unoszenie-prostych-nog-do-drazka",
    "name": "Unoszenie prostych nóg do drążka",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "drazek",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/unoszenie-prostych-nog-do-drazka",
    "videoUrl": "https://static.fabrykasily.pl/atlas/unoszenie_prostych_nog_do_drazka.mp4"
  },
  {
    "id": "pike-trx",
    "name": "Pike TRX",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "TRX",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/pike-trx",
    "videoUrl": "https://static.fabrykasily.pl/atlas/pike_trx.mp4"
  },
  {
    "id": "superman-na-trx",
    "name": "Superman na TRX",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "TRX",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/superman-na-na-trx",
    "videoUrl": "https://static.fabrykasily.pl/atlas/superman_trx.mp4"
  },
  {
    "id": "deska-bokiem-na-trx",
    "name": "Deska bokiem na TRX",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "TRX",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/deska-bokiem-na-trx",
    "videoUrl": "https://static.fabrykasily.pl/atlas/deska_bokiem_trx.mp4"
  },
  {
    "id": "rewersy",
    "name": "Rewersy",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/rewersy",
    "videoUrl": "https://static.fabrykasily.pl/atlas/reversy.mp4"
  },
  {
    "id": "scyzoryk",
    "name": "Scyzoryk",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/scyzoryk",
    "videoUrl": "https://static.fabrykasily.pl/atlas/scyzoryk.mp4"
  },
  {
    "id": "dead-bug-nogi-proste",
    "name": "Dead bug – nogi proste",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/dead-bug-nogi-proste",
    "videoUrl": "https://static.fabrykasily.pl/atlas/dead_bug_nogi_proste.mp4"
  },
  {
    "id": "dead-bug-nogi-ugiete",
    "name": "Dead bug – nogi ugięte",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/dead-bug-nogi-ugiete",
    "videoUrl": "https://static.fabrykasily.pl/atlas/dead_bug_nogi_ugiete.mp4"
  },
  {
    "id": "hollow-body",
    "name": "Hollow body",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/hollow-body",
    "videoUrl": "https://static.fabrykasily.pl/atlas/hollow_body_gora_dol.mp4"
  },
  {
    "id": "semi-hollow-body",
    "name": "Semi hollow body",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/semi-hollow-body",
    "videoUrl": "https://static.fabrykasily.pl/atlas/hollow_body_gora.mp4"
  },
  {
    "id": "przyciaganie-kolan-pod-klatke-na-pi-ce",
    "name": "Przyciąganie kolan pod klatkę na piłce",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/przyciaganie-kolan-pod-klatke-na-pilce",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przyciaganie_kolan_pod_klatke_na_pilke.mp4"
  },
  {
    "id": "przyciaganie-kolan-pod-klatke-na-trx",
    "name": "Przyciąganie kolan pod klatkę na TRX",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "TRX",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/przyciaganie-kolan-pod-klatke-na-trx",
    "videoUrl": "https://static.fabrykasily.pl/atlas/trx_przyciaganie_kolan_pod_klatke.mp4"
  },
  {
    "id": "ab-roller-na-kolanach",
    "name": "Ab roller na kolanach",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "roller",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/ab-roller-na-kolanach",
    "videoUrl": "https://static.fabrykasily.pl/atlas/ab_roller_na_kolanach.mp4"
  },
  {
    "id": "rotacje-z-guma",
    "name": "Rotacje z gumą",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/rotacje-z-guma",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-rotacje-z-guma.mp4"
  },
  {
    "id": "pallof-press",
    "name": "Pallof press",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/pallof-press",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-paloff-press.mp4"
  },
  {
    "id": "rotacja-boczna-na-wyciagu",
    "name": "Rotacja boczna na wyciągu",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/rotacja-boczna-na-wyciagu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/rotacja_boczna_na_wyciagu.mp4"
  },
  {
    "id": "rotacje-boczne-po-skosie-woodchoper",
    "name": "Rotacje boczne po skosie – woodchoper",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/brzuch/rotacje-boczne-po-skosie-woodchoper",
    "videoUrl": "https://static.fabrykasily.pl/atlas/rotacje_boczne_po_skosie_woodchoper.mp4"
  },
  {
    "id": "izometryczny-skurcz-miesni-brzucha-w-podporze-przodem-deska-scianka-plank",
    "name": "Izometryczny skurcz mięśni brzucha w podporze przodem. Deska/ścianka/plank",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-brzuch/izometryczny-skurcz-miesni-brzucha-w-podporze",
    "videoUrl": "https://static.fabrykasily.pl/atlas/deska_scianka_plank.mp4"
  },
  {
    "id": "naprzemienne-przyciaganie-okci-do-kolan-lezac-na-plecach",
    "name": "Naprzemienne przyciąganie łokci do kolan leżąc na plecach",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-brzuch/naprzemienne-przyciaganie-lokci-do-kolan-lezac",
    "videoUrl": "https://static.fabrykasily.pl/atlas/naprzemienne_przyciaganie_lokci_do_kolan_lezac_na_plecach.mp4"
  },
  {
    "id": "naprzemienne-sieganie-do-kostek-lezac",
    "name": "Naprzemienne sięganie do kostek leżąc",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-brzuch/naprzemienne-sieganie-do-kostek-lezac-alternate",
    "videoUrl": "https://static.fabrykasily.pl/atlas/naprzemienne_sieganie_do_kostek_lezac.mp4"
  },
  {
    "id": "przyciaganie-kolan-do-klatki-w-zwisie-na-drazku",
    "name": "Przyciąganie kolan do klatki w zwisie na drążku",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-brzuch/przyciaganie-kolan-do-klatki-w-zwisie-2",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przyciaganie_kolan_do_klatki_w_zwisie_na_drazku.mp4"
  },
  {
    "id": "rowerek",
    "name": "Rowerek",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-brzuch/rowerek-air-bike",
    "videoUrl": "https://static.fabrykasily.pl/atlas/rowerek.mp4"
  },
  {
    "id": "spiecia-brzucha-lezac-na-macie-ze-z-aczonymi-stopami",
    "name": "Spięcia brzucha leżąc na macie ze złączonymi stopami",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-brzuch/spiecia-brzucha-lezac-macie-ze-zlaczonymi",
    "videoUrl": "https://static.fabrykasily.pl/atlas/spiecia_brzucha_lezac_na_macie_ze_zlaczonymi_stopami.mp4"
  },
  {
    "id": "spiecia-brzucha-z-nogami-opartymi-na-pi-ce-gimnastycznej",
    "name": "Spięcia brzucha z nogami opartymi na piłce gimnastycznej",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-brzuch/spiecia-brzucha-z-nogami-opartymi",
    "videoUrl": "https://static.fabrykasily.pl/atlas/spiecia_brzucha_z_nogami_opartymi_na_pilce_gimnastycznej.mp4"
  },
  {
    "id": "swieca-z-prostowaniem-nog-lezac",
    "name": "Świeca z prostowaniem nóg leżąc",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-brzuch/swieca-z-prostowaniem-nog-lezac-bottoms",
    "videoUrl": "https://static.fabrykasily.pl/atlas/swieca_z_prostowaniem_nog_lezac.mp4"
  },
  {
    "id": "zginanie-tu-owia-na-maszynie-siedzac-spiecia-brzucha-na-maszynie",
    "name": "Zginanie tułowia na maszynie siedząc. Spięcia brzucha na maszynie",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "maszyna",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-brzuch/zginanie-tulowia-na-maszynie-siedzac-spiecia",
    "videoUrl": "https://static.fabrykasily.pl/atlas/zginanie-tulowia-na-maszynie-siedzac-spiecia-brzucha-na-maszynie.mp4"
  },
  {
    "id": "unoszenie-tu-owia-z-pod-oza-spiecia-brzucha-lezac",
    "name": "Unoszenie tułowia z podłoża. Spięcia brzucha leżąc",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-brzuch/unoszenie-tulowia-z-podloza-spiecia-brzucha",
    "videoUrl": "https://static.fabrykasily.pl/atlas/unoszenie_tulowia_z_podloza_spiecia_brzucha_lezac.mp4"
  },
  {
    "id": "prostowanie-ramienia-jednoracz-w-kleku-podpartym-na-awce-p-askiej",
    "name": "Prostowanie ramienia jednorącz w klęku podpartym na ławce płaskiej",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "lawka",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/triceps/prostowanie-ramienia-jednoracz-w-kleku-podpartym-na-lawce-plaskiej",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_prostowanie_ramienia_jednoracz_w_kleku_podpartym_na_lawce_plaskiej.mp4"
  },
  {
    "id": "prostowanie-ramion-z-guma-pod-stopami",
    "name": "Prostowanie ramion z gumą pod stopami",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/triceps/prostowanie-ramion-z-guma-pod-stopami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_prostowanie_ramion_z_guma_pod_stopami.mp4"
  },
  {
    "id": "prostowanie-ramion-w-oparciu-o-aweczke",
    "name": "Prostowanie ramion w oparciu o ławeczkę",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "lawka",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/triceps/prostowanie-ramion-w-oparciu-o-laweczke",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_prostowanie_ramion_w_oparciu_o_laweczke.mp4"
  },
  {
    "id": "wyciskanie-francuskie-w-lezeniu-na-pod-odze",
    "name": "Wyciskanie francuskie w leżeniu na podłodze",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/triceps/wyciskanie-francuskie-w-lezeniu-na-podlodze",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wyciskanie_francuskie_lezac_na_podlodze.mp4"
  },
  {
    "id": "pompki-w-podporze-ty-em-z-ugietymi-nogami",
    "name": "Pompki w podporze tyłem z ugiętymi nogami",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "masa ciala",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/triceps/pompki-w-podporze-tylem-z-ugietymi-nogami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_pompki_w_podporze_tylem_z_ugietymi_nogami.mp4"
  },
  {
    "id": "pompki-w-podporze-ty-em-z-nogami-na-podwyzszeniu",
    "name": "Pompki w podporze tyłem z nogami na podwyższeniu",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "masa ciala",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/triceps/pompki-w-podporze-tylem-z-nogami-na-podwyzszeniu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_pompki_w_podporze_tylem_z_nogami_na_podwyzszeniu.mp4"
  },
  {
    "id": "pompki-na-poreczach-samo-opuszczanie",
    "name": "Pompki na poręczach – samo opuszczanie",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/triceps/pompki-na-poreczach-samo-opuszczanie",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_pompki_na_poreczach_samo_opuszczanie.mp4"
  },
  {
    "id": "triceps-rollback-extension",
    "name": "Triceps rollback extension",
    "category": "Ramiona",
    "primaryMuscles": [
      "triceps",
      "ramiona"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/triceps/tricpes-rollback-extension",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_triceps_rollback_extension.mp4"
  },
  {
    "id": "prostowanie-ramion-z-guma",
    "name": "Prostowanie ramion z gumą",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/triceps/prostowanie-ramion-z-guma",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-prostowanie-ramion-z-guma.mp4"
  },
  {
    "id": "prostowanie-ramion-z-linka-wyciagu-dolnego-w-opadzie-tu-owia",
    "name": "Prostowanie ramion z linką wyciągu dolnego w opadzie tułowia",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/triceps/prostowanie-ramion-z-linka-wyciagu-dolnego-w-opadzie-tulowia",
    "videoUrl": "https://static.fabrykasily.pl/atlas/prostowanie_ramion_z_linka_wyciagu_dolnego_w_opadzie_tulowia.mp4"
  },
  {
    "id": "prostowanie-ramion-z-linkami-wyciagu-gornego",
    "name": "Prostowanie ramion z linkami wyciągu górnego",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/triceps/prostowanie-ramion-z-linkami-wyciagu-gornego",
    "videoUrl": "https://static.fabrykasily.pl/atlas/prostowanie_ramion_z_linkami_wyciagu_gornego.mp4"
  },
  {
    "id": "wyciskanie-francuskie-z-przenoszeniem-ramion-za-g-owe",
    "name": "Wyciskanie francuskie z przenoszeniem ramion za głowę",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/triceps/wyciskanie-francuskie-z-przenoszeniem-ramion-za-glowe",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wyciskanie_francuskie_z_przenoszeniem_ramion_za_glowe.mp4"
  },
  {
    "id": "wyciskanie-sztangi-waskim-chwytem",
    "name": "Wyciskanie sztangi wąskim chwytem",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/triceps/wyciskanie-sztangi-waskim-chwytem",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wyciskanie_sztangi_waskim_chwytem.mp4"
  },
  {
    "id": "wyciskanie-francuskie-hantlami-z-przenoszeniem-ramion-za-g-owe",
    "name": "Wyciskanie francuskie hantlami z przenoszeniem ramion za głowę",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/triceps/wyciskanie-francuskie-hantlami-z-przenoszeniem-ramion-za-glowe",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wyciskanie_fancuskie_hantalmi_z_przenoszeniem_ramion_za_glowe.mp4"
  },
  {
    "id": "wyciskanie-francuskie-hantlami",
    "name": "Wyciskanie francuskie hantlami",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/triceps/wyciskanie-francuskie-hantlami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wyciskanie_francuskie_hantlami.mp4"
  },
  {
    "id": "waskie-pompki",
    "name": "Wąskie pompki",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/triceps/waskie-pompki",
    "videoUrl": "https://static.fabrykasily.pl/atlas/waskie_pompki.mp4"
  },
  {
    "id": "prostowanie-ramion-z-hantlami-za-siebie-w-opadzie-tu-owia",
    "name": "Prostowanie ramion z hantlami za siebie w opadzie tułowia",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-triceps/prostowanie-ramion-z-hantlami-za-siebie",
    "videoUrl": "https://static.fabrykasily.pl/atlas/prostowanie_ramion_z_hantlami_za_siebie_w_opadzie_tulowia.mp4"
  },
  {
    "id": "prostowanie-ramion-lezac-na-awce-z-uzyciem-wyciagu-gornego",
    "name": "Prostowanie ramion leżąc na ławce z użyciem wyciągu górnego",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "lawka",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-triceps/prostowanie-ramion-lezac-na-lawce",
    "videoUrl": "https://static.fabrykasily.pl/atlas/prostowanie-ramion-lezac-na-lawce-z-uzyciem-wyciagu-gornego.mp4"
  },
  {
    "id": "pompki-na-triceps-na-poreczach",
    "name": "Pompki na triceps na poręczach",
    "category": "Ramiona",
    "primaryMuscles": [
      "triceps",
      "ramiona"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-triceps/pompki-na-triceps-na-poreczach-dips",
    "videoUrl": "https://static.fabrykasily.pl/atlas/pompki_na_triceps_na_poreczach.mp4"
  },
  {
    "id": "pompki-w-oparciu-o-sztange-waskim-chwytem",
    "name": "Pompki w oparciu o sztangę wąskim chwytem",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-triceps/pompki-w-oparciu-o-sztange-waskim",
    "videoUrl": "https://static.fabrykasily.pl/atlas/pompki_w_oparciu_o_sztange_waskim_chwytem.mp4"
  },
  {
    "id": "prostowanie-przedramienia-w-pionie-ze-sztangielka",
    "name": "Prostowanie przedramienia w pionie ze sztangielką",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-triceps/prostowanie-przedramienia-w-pionie-ze-sztangielka",
    "videoUrl": "https://static.fabrykasily.pl/atlas/prostowanie_przedramienia_w_pionie_ze_sztangielka.mp4"
  },
  {
    "id": "prostowanie-przedramion-w-pionie-ze-sztanga-trzymana-oburacz",
    "name": "Prostowanie przedramion w pionie ze sztangą trzymaną oburącz",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-triceps/prostowanie-przedramion-w-pionie-ze-sztanga",
    "videoUrl": "https://static.fabrykasily.pl/atlas/prostowanie_przedramion_w_pionie_ze_sztanga_trzymana_oburacz.mp4"
  },
  {
    "id": "prostowanie-przedramion-w-pionie-ze-sztangielka-trzymana-oburacz",
    "name": "Prostowanie przedramion w pionie ze sztangielką trzymaną oburącz",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-triceps/prostowanie-przedramion-w-pionie-ze-sztangielka",
    "videoUrl": "https://static.fabrykasily.pl/atlas/prostowanie_przedramienia_w_pionie_ze_sztangielka_trzymana_oburacz.mp4"
  },
  {
    "id": "prostowanie-przedramion-z-gryfem-amanym-trzymanym-nachwytem-z-wyciagu-gornego",
    "name": "Prostowanie przedramion z gryfem łamanym trzymanym nachwytem z wyciągu górnego",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-triceps/prostowanie-przedramion-z-gryfem-lamanym-trzymanym",
    "videoUrl": "https://static.fabrykasily.pl/atlas/prostowanie_przedramion_z_gryfem_lamanym_trzymanym_nachwytem_z_wyciagu_gornego.mp4"
  },
  {
    "id": "prostowanie-przedramion-z-gryfem-prostym-trzymanym-nachwytem-z-wyciagu-gornego",
    "name": "Prostowanie przedramion z gryfem prostym trzymanym nachwytem z wyciągu górnego",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-triceps/prostowanie-przedramion-z-gryfem-prostym-trzymanym",
    "videoUrl": "https://static.fabrykasily.pl/atlas/prostowanie_przedramion_z_gryfem_prostym_trzymanym_nachwytem_z_wyciagu_gornego.mp4"
  },
  {
    "id": "prostowanie-przedramion-z-lina-z-wyciagu-dolnego-stojac",
    "name": "Prostowanie przedramion z liną z wyciągu dolnego stojąc",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-triceps/prostowanie-przedramion-z-lina-z-wyciagu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/prostowanie_przedramion_z_lina_wyciagu_dolnego_stojac.mp4"
  },
  {
    "id": "prostowanie-przedramion-ze-sztanga-amana-lezac-na-awce-p-askiej",
    "name": "Prostowanie przedramion ze sztangą łamaną leżąc na ławce płaskiej",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-triceps/prostowanie-przedramion-ze-sztanga-lamana-lezac",
    "videoUrl": "https://static.fabrykasily.pl/atlas/prostowanie_przedramion_ze_sztanga_lamana_lezac_na_lawce_plaskiej.mp4"
  },
  {
    "id": "prostowanie-przedramion-ze-sztangielka-trzymana-oburacz-siedzac",
    "name": "Prostowanie przedramion ze sztangielką trzymaną oburącz siedząc",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-triceps/prostowanie-przedramion-ze-sztangielka-trzymana-oburacz",
    "videoUrl": "https://static.fabrykasily.pl/atlas/prostowanie_przedramion_ze_sztangielka_trzymana_oburacz_siedzac.mp4"
  },
  {
    "id": "prostowanie-ramienia-jednoracz-z-wyciagu-dolnego-stojac",
    "name": "Prostowanie ramienia jednorącz z wyciągu dolnego stojąc",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-triceps/prostowanie-ramienia-jednoracz-z-wyciagu-dolnego",
    "videoUrl": "https://static.fabrykasily.pl/atlas/prostowanie-ramienia-jednoracz-z-wyciagu-dolnego-stojac.mp4"
  },
  {
    "id": "prostowanie-ramienia-z-wykorzystaniem-wyciagu-gornego",
    "name": "Prostowanie ramienia z wykorzystaniem wyciągu górnego",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-triceps/prostowanie-ramienia-z-wykorzystaniem-wyciagu-gornego",
    "videoUrl": "https://static.fabrykasily.pl/atlas/prostowanie_ramienia_jednoracz_z_wyciagu_gornego.mp4"
  },
  {
    "id": "prostowanie-ramion-na-maszynie-triceps",
    "name": "Prostowanie ramion na maszynie triceps",
    "category": "Ramiona",
    "primaryMuscles": [
      "triceps",
      "ramiona"
    ],
    "equipment": "maszyna",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-triceps/prostowanie-ramion-na-maszynie-triceps-machine",
    "videoUrl": "https://static.fabrykasily.pl/atlas/prostowanie-ramion-na-maszynie-triceps.mp4"
  },
  {
    "id": "prostowanie-ramion-z-gryfem-trzymanym-podchwytem-z-wyciagu-gornego",
    "name": "Prostowanie ramion z gryfem trzymanym podchwytem z wyciągu górnego",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-triceps/prostowanie-ramion-z-gryfem-trzymanym-podchwytem",
    "videoUrl": "https://static.fabrykasily.pl/atlas/prostowanie_ramion_z_gryfem_trzymanym_podchwytem_z_wyciagu_gornego.mp4"
  },
  {
    "id": "waskie-pompki-na-triceps-diamentowe-pompki",
    "name": "Wąskie pompki na triceps. Diamentowe pompki",
    "category": "Ramiona",
    "primaryMuscles": [
      "triceps",
      "ramiona"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-triceps/waskie-pompki-na-triceps-diamentowe-pompki",
    "videoUrl": "https://static.fabrykasily.pl/atlas/waskie_pompki_na_triceps_diamentowe_pompki.mp4"
  },
  {
    "id": "wyciskanie-sztangi-amanej-waskim-chwytem-na-aweczce-p-askiej",
    "name": "Wyciskanie sztangi łamanej wąskim chwytem na ławeczce płaskiej",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-triceps/wyciskanie-sztangi-lamanej-waskim-chwytem",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wyciskanie_sztangi_lamanej_waskim_chwytem_na_laweczce_plaskiej.mp4"
  },
  {
    "id": "wyciskanie-sztangi-na-suwnicy-smitha-waskim-chwytem-na-triceps",
    "name": "Wyciskanie sztangi na suwnicy Smitha wąskim chwytem na triceps",
    "category": "Ramiona",
    "primaryMuscles": [
      "triceps",
      "ramiona"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-triceps/wyciskanie-sztangi-na-suwnicy-smitha-waskim",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wyciskanie_sztangi_na_suwnicy_smitha_waskim_chwytem_na_triceps.mp4"
  },
  {
    "id": "uginanie-ramion-z-guma",
    "name": "Uginanie ramion z gumą",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/biceps/uginanie-ramion-z-guma",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-uginanie-ramion-z-guma.mp4"
  },
  {
    "id": "zginanie-ramion-ze-sztanga-nachwytem",
    "name": "Zginanie ramion ze sztangą nachwytem",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/biceps/zginanie-ramion-ze-sztanga-nachwytem",
    "videoUrl": "https://static.fabrykasily.pl/atlas/zginanie_ramion_ze_sztanga_nachwytem.mp4"
  },
  {
    "id": "uginanie-ramion-na-trx",
    "name": "Uginanie ramion na TRX",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "TRX",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/biceps/uginanie-ramion-na-trx",
    "videoUrl": "https://static.fabrykasily.pl/atlas/uginanie_ramion_trx.mp4"
  },
  {
    "id": "uginanie-ramion-z-hantlami-nachwytem",
    "name": "Uginanie ramion z hantlami nachwytem",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/biceps/uginanie-ramion-z-hantlami-nachwytem",
    "videoUrl": "https://static.fabrykasily.pl/atlas/uginanie_ramion_z_hantlami_nachwytem.mp4"
  },
  {
    "id": "uginanie-ramion-z-hantlami-w-oparciu-o-aweczke",
    "name": "Uginanie ramion z hantlami w oparciu o ławeczkę",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/biceps/uginanie-ramion-z-hantlami-w-oparciu-o-laweczke",
    "videoUrl": "https://static.fabrykasily.pl/atlas/uginanie_ramion_z_hantlami_w_oparciu_o_laweczke.mp4"
  },
  {
    "id": "uginanie-ramion-ze-sztanga-w-oparciu-o-aweczke",
    "name": "Uginanie ramion ze sztangą w oparciu o ławeczkę",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/biceps/uginanie-ramion-ze-sztanga-w-oparciu-o-laweczke",
    "videoUrl": "https://static.fabrykasily.pl/atlas/uginanie_ramion_ze_sztanga_w_oparciu_o_laweczke.mp4"
  },
  {
    "id": "zginanie-ramion-z-hantlami-na-modlitewniku-chwytem-m-otkowym",
    "name": "Zginanie ramion z hantlami na modlitewniku chwytem młotkowym",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/biceps/zginanie-ramion-z-hantlami-na-modlitewniku-chwytem-mlotkowym",
    "videoUrl": "https://static.fabrykasily.pl/atlas/zginanie_ramion_z_hantlami_na_modlitewniku_chwytem_mlotkowym.mp4"
  },
  {
    "id": "uginanie-ramienia-z-linka-wyciagu-dolnego-stojac",
    "name": "Uginanie ramienia z linką wyciągu dolnego stojąc",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/biceps/uginanie-ramienia-z-linka-wyciagu-dolnego-stojac",
    "videoUrl": "https://static.fabrykasily.pl/atlas/uginanie_ramienia_z_linka_dolnego_wyciagu_stojac.mp4"
  },
  {
    "id": "zginanie-ramion-z-hantlami-na-modlitewniku",
    "name": "Zginanie ramion z hantlami na modlitewniku",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/biceps/zginanie-ramion-z-hantlami-na-modlitewniku",
    "videoUrl": "https://static.fabrykasily.pl/atlas/zginanie_ramion_z_hantlami_na_modlitewniku.mp4"
  },
  {
    "id": "zottman-curl",
    "name": "Zottman curl",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/biceps/zottman-curl",
    "videoUrl": "https://static.fabrykasily.pl/atlas/zotman_curl.mp4"
  },
  {
    "id": "uginanie-ramion-z-hantlami-z-rotacja",
    "name": "Uginanie ramion z hantlami z rotacją",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/biceps/uginanie-ramion-z-hantlami-z-rotacja",
    "videoUrl": "https://static.fabrykasily.pl/atlas/uginanie_ramion_z_hantlami_z_rotacja.mp4"
  },
  {
    "id": "zginanie-przedramienia-z-hantlem-na-modlitewniku",
    "name": "Zginanie przedramienia z hantlem na modlitewniku",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-biceps/zginanie-przedramienia-z-hantlem-na-modlitewniku",
    "videoUrl": "https://static.fabrykasily.pl/atlas/zginanie_przedramienia_z_hantlem_na_modlitewniku.mp4"
  },
  {
    "id": "zginanie-przedramion-w-waskim-chwycie-ze-sztanga-stojac",
    "name": "Zginanie przedramion w wąskim chwycie ze sztangą stojąc",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-biceps/zginanie-przedramion-w-waskim-chwycie",
    "videoUrl": "https://static.fabrykasily.pl/atlas/zgiananie_przedramion_w_waskim_chwycie_ze_sztanga_stojac.mp4"
  },
  {
    "id": "jednoczesne-zginanie-przedramion-stojac-z-wykorzystaniem-wyciagow-gornych",
    "name": "Jednoczesne zginanie przedramion stojąc z wykorzystaniem wyciągów górnych",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-biceps/jednoczesne-zginanie-przedramion-stojac-z-wykorzystaniem",
    "videoUrl": "https://static.fabrykasily.pl/atlas/jednoczesne_zginanie_przedramion_stojac_z_wykorzystaniem_wyciagow_gornych.mp4"
  },
  {
    "id": "zginanie-przedramion-z-drazkiem-wyciagu-dolnego-na-modlitewniku",
    "name": "Zginanie przedramion z drążkiem wyciągu dolnego na modlitewniku",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-biceps/zginanie-przedramion-z-drazkiem-wyciagu-dolnego",
    "videoUrl": "https://static.fabrykasily.pl/atlas/zginanie_przedramion_z_drazkiem_wyciagu_dolnego_na_modlitewniku.mp4"
  },
  {
    "id": "zginanie-przedramion-z-gryfem-wyciagu-gornego-lezac-na-awce",
    "name": "Zginanie przedramion z gryfem wyciągu górnego leżąc na ławce",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-biceps/zginanie-przedramion-z-gryfem-wyciagu-gornego",
    "videoUrl": "https://static.fabrykasily.pl/atlas/zginanie_przedramion_z_gryfem_wyciagu_gornego_lezac_na_lawce.mp4"
  },
  {
    "id": "zginanie-przedramion-z-hantlami-w-chwycie-m-otkowym",
    "name": "Zginanie przedramion z hantlami w chwycie młotkowym",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-biceps/zginanie-przedramion-z-hantlami-w-chwycie",
    "videoUrl": "https://static.fabrykasily.pl/atlas/zginanie_przedramion_w_chwycie_mlotkowym.mp4"
  },
  {
    "id": "zginanie-przedramion-w-chwycie-m-otkowym-siedzac-na-awce",
    "name": "Zginanie przedramion w chwycie młotkowym siedząc na ławce",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-biceps/zginanie-przedramion-w-chwycie-mlotkowym-siedzac",
    "videoUrl": "https://static.fabrykasily.pl/atlas/zginanie_przedramion_w_chwycie_mlotkowym_siedzac_na_laweczce.mp4"
  },
  {
    "id": "zginanie-przedramion-z-gryfem-amanym-na-modlitewniku",
    "name": "Zginanie przedramion z gryfem łamanym na modlitewniku",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-biceps/zginanie-przedramion-z-gryfem-lamanym",
    "videoUrl": "https://static.fabrykasily.pl/atlas/zginanie_przedramion_z_gryfem_lamanym_na_modlitewniku.mp4"
  },
  {
    "id": "zginanie-przedramion-na-zewnatrz-siedzac-na-awce-75-stopni",
    "name": "Zginanie przedramion na zewnątrz siedząc na ławce 75 stopni",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-biceps/zginanie-przedramion-na-zewnatrz-siedzac",
    "videoUrl": "https://static.fabrykasily.pl/atlas/bicepsy_w_lezeniu_na_laweczce.mp4"
  },
  {
    "id": "zginanie-przedramion-z-lina-z-wyciagu-dolnego-stojac",
    "name": "Zginanie przedramion z liną z wyciągu dolnego stojąc",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-biceps/zginanie-przedramion-z-lina-z-wyciagu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/zginanie_przedramion_z_lina_z_wyciagu_dolnego_stojac.mp4"
  },
  {
    "id": "zginanie-przedramion-ze-sztanga-amana-stojac",
    "name": "Zginanie przedramion ze sztangą łamaną stojąc",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-biceps/zginanie-przedramion-ze-sztanga-lamana-stojac",
    "videoUrl": "https://static.fabrykasily.pl/atlas/zginanie_przedramion_ze_sztanga_lamana_stojac.mp4"
  },
  {
    "id": "zginanie-przedramion-z-hantlem-w-opadzie-tu-owia",
    "name": "Zginanie przedramion z hantlem w opadzie tułowia",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-biceps/zginanie-przedramion-z-hantlem-w-opadzie",
    "videoUrl": "https://static.fabrykasily.pl/atlas/zginanie_przedramion_z_hantlem_w_opadzie_tulowia.mp4"
  },
  {
    "id": "zginanie-przedramienia-z-hantlem-okiec-oparty-na-udzie",
    "name": "Zginanie przedramienia z hantlem – łokieć oparty na udzie",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-biceps/zginanie-przedramienia-z-hantlem-lokiec",
    "videoUrl": "https://static.fabrykasily.pl/atlas/zginanie_przedramienia_z_hantlem_lokiec_oparty_na_udzie.mp4"
  },
  {
    "id": "zginanie-przedramion-z-hantlami-z-rotacja-nadgarstka-siedzac-na-awce-90-stopni",
    "name": "Zginanie przedramion z hantlami z rotacją nadgarstka siedząc na ławce 90 stopni",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-biceps/zginanie-przedramion-z-hantlami-z-rotacja",
    "videoUrl": "https://static.fabrykasily.pl/atlas/zginanie_przedramion_z_hantlami_z_rotacja_nadgarstka_siedzac_na_lawce_90_stopni.mp4"
  },
  {
    "id": "zginanie-przedramion-z-drazkiem-wyciagu-dolnego-stojac",
    "name": "Zginanie przedramion z drążkiem wyciągu dolnego stojąc",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-biceps/zginanie-przedramion-z-drazkiem-wyciagu-dolnego-2",
    "videoUrl": "https://static.fabrykasily.pl/atlas/zginanie_przedramion_z_drazkiem_wyciagu_dolnego_stojac.mp4"
  },
  {
    "id": "zginanie-przedramion-ze-sztanga-stojac",
    "name": "Zginanie przedramion ze sztangą stojąc",
    "category": "Ramiona",
    "primaryMuscles": [
      "ramiona"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-biceps/zginanie-przedramion-ze-sztanga-stojac-barbell",
    "videoUrl": "https://static.fabrykasily.pl/atlas/zginanie_przedramion_ze_sztanga_stojac.mp4"
  },
  {
    "id": "wspiecia-na-palce-jednonoz",
    "name": "Wspięcia na palce jednonóż",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "trudne",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/lydki/wspiecia-na-palce-jednonoz",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wspiecia_na_palce_jednonoz.mp4"
  },
  {
    "id": "wspiecia-na-palce-jednonoz-z-hantlami",
    "name": "Wspięcia na palce jednonóż z hantlami",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "hantle",
    "difficulty": "trudne",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/lydki/wspiecia-na-palce-jednonoz-z-hantlami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wspiecia_na_palce_jednonoz_z_hantlami.mp4"
  },
  {
    "id": "wspiecia-na-palcach-w-pozycji-siedzacej-ze-sztanga-u-ozona-na-kolanach",
    "name": "Wspięcia na palcach w pozycji siedzącej ze sztangą ułożoną na kolanach",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-lydki/wspiecia-na-palcach-w-pozycji-siedzacej",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wspiecia_na_palce_w_pozycji_siedzacej_ze_sztanga_ulozona_na_kolanach.mp4"
  },
  {
    "id": "wspiecia-na-palcach-na-suwnicy",
    "name": "Wspięcia na palcach na suwnicy",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-lydki/wspiecia-na-palcach-na-suwnicy-calf",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wspiecia_na_palce_na_suwnicy.mp4"
  },
  {
    "id": "wspiecia-na-palcach-siedzac-z-uzyciem-sztangielki",
    "name": "Wspięcia na palcach siedząc z użyciem sztangielki",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-lydki/wspiecia-na-palcach-siedzac-z-uzyciem",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wspiecia_na_palce_siedzac_z_uzyciem_sztangielki.mp4"
  },
  {
    "id": "wspiecia-na-palcach-stojac-z-hantla",
    "name": "Wspięcia na palcach stojąc z hantlą",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-lydki/wspiecia-na-palcach-stojac-z-hantlami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wspiecia_na_palce_stojac_z_hantlami.mp4"
  },
  {
    "id": "wspiecia-na-palcach-stojac-z-wykorzystaniem-suwnicy-smitha",
    "name": "Wspięcia na palcach stojąc z wykorzystaniem suwnicy Smitha",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-lydki/wspiecia-na-palcach-stojac-z-wykorzystaniem-2",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wspiecia_na_palce_stojac_z_wykorzystaniem_suwnicy_smitha.mp4"
  },
  {
    "id": "wspiecia-na-palcach-stojac-ze-sztanga-trzymana-na-plecach",
    "name": "Wspięcia na palcach stojąc ze sztangą trzymaną na plecach",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-lydki/wspiecia-na-palcach-stojac-ze-sztanga",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wspiecia_na_palcach_stojac_ze_sztanga_trzymana_na_plecach.mp4"
  },
  {
    "id": "wspiecia-na-palcach-siedzac-na-maszynie",
    "name": "Wspięcia na palcach siedząc na maszynie",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "maszyna",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/na-lydki/wspiecia-na-palcach-siedzac-na-maszynie",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wspiecia_na_palcach_siedzac_na_maszynie.mp4"
  },
  {
    "id": "przejscie-z-podporu-przodem-do-deski",
    "name": "Przejście z podporu przodem do deski",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/przejscie-z-podporu-przodem-do-deski",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przejscie_z_podporu_przodem_do_deski.mp4"
  },
  {
    "id": "pompka-na-podwyzszeniu-na-kolanach",
    "name": "Pompka na podwyższeniu na kolanach",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/pompka-na-podwyzszeniu-na-kolanach",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_pompka_na_podwyzszeniu_na_kolanach.mp4"
  },
  {
    "id": "bieg-w-miejscu",
    "name": "Bieg w miejscu",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/bieg-w-miejscu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_bieg_w_miejscu.mp4"
  },
  {
    "id": "wznosy-ramienia-w-oparciu-o-sciane",
    "name": "Wznosy ramienia w oparciu o ścianę",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/wznosy-ramienia-w-oparciu-o-sciane",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wznosy_ramienia_w_oparciu_o_sciane.mp4"
  },
  {
    "id": "przejscia-z-deski-do-podporu-na-kolanach",
    "name": "Przejścia z deski do podporu na kolanach",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/przejscia-z-deski-do-podporu-na-kolanach",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przejscia_z_deski_do_podporu_na_kolanach.mp4"
  },
  {
    "id": "krab",
    "name": "Krab",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/krab",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_krab.mp4"
  },
  {
    "id": "przysiad-przy-scianie-z-unoszeniem-nogi",
    "name": "Przysiad przy ścianie z unoszeniem nogi",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/przysiad-przy-scianie-z-unoszeniem-nogi",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przysiad_przy_scianie_z_unoszeniem_nogi.mp4"
  },
  {
    "id": "bieg-w-podporze-na-trx",
    "name": "Bieg w podporze na TRX",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "TRX",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/bieg-w-podporze-na-trx",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_trx_bieg_w_podparciu.mp4"
  },
  {
    "id": "szybki-bieg-w-miejscu-z-padnij-powstan",
    "name": "Szybki bieg w miejscu z padnij–powstań",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/szybki-bieg-w-miejscu-z-padnijpowstan",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_szybkie_przestepowanie_w_miejscu_padnij_powstan.mp4"
  },
  {
    "id": "szybki-bieg-w-miejscu",
    "name": "Szybki bieg w miejscu",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/szybkie-przestepowanie-w-miejscu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_szybkie_przestepowanie_w_miejscu.mp4"
  },
  {
    "id": "skoki-na-skakance",
    "name": "Skoki na skakance",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/skoki-na-skakance",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_skakanka.mp4"
  },
  {
    "id": "przeskoki-z-ramionami-w-gorze",
    "name": "Przeskoki z ramionami w górze",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/przeskoki-z-ramionami-w-gorze",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przeskoki_z_ramionami_w_gorze.mp4"
  },
  {
    "id": "przeskoki-w-podporze-przodem-obunoz-na-boki",
    "name": "Przeskoki w podporze przodem obunóż na boki",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/przeskoki-w-podporze-przodem-obunoz-na-boki",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przeskoki_w_podporze_przodem_obunoz_na_boki.mp4"
  },
  {
    "id": "przeskoki-w-podporze-przodem",
    "name": "Przeskoki w podporze przodem",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/przeskoki-w-podporze-przodem",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przeskoki_w_podporze_przodem.mp4"
  },
  {
    "id": "przeskoki-odstaw-dostaw-ze-sk-onem-do-pod-ogi",
    "name": "Przeskoki odstaw–dostaw ze skłonem do podłogi",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/przeskoki-odstawdostaw-ze-sklonem-do-podlogi",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przeskoki_odstaw_dostaw_ze_sklonem_do_podlogi.mp4"
  },
  {
    "id": "przeskoki-na-stepie",
    "name": "Przeskoki na stepie",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/przeskoki-na-stepie",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przeskoki_na_stepie.mp4"
  },
  {
    "id": "przeskoki-yzwiarza",
    "name": "Przeskoki łyżwiarza",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/przeskoki-lyzwiarza",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przeskoki_lyzwiarza.mp4"
  },
  {
    "id": "przejscie-z-kolan-do-przysiadu-z-wyskokiem",
    "name": "Przejście z kolan do przysiadu z wyskokiem",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/przejscie-z-kolan-do-przysiadu-z-wyskokiem",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_przejscie_z_kolan_do_przysiadu_z_wyskokiem.mp4"
  },
  {
    "id": "pajacyki",
    "name": "Pajacyki",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/pajacyki",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_pajacyki.mp4"
  },
  {
    "id": "marsz-w-miejscu",
    "name": "Marsz w miejscu",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/marsz-w-miejscu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_marsz_w_miejscu.mp4"
  },
  {
    "id": "przeskoki-wykroczne-z-trx",
    "name": "Przeskoki wykroczne z TRX",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "TRX",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/przeskoki-wykroczne-z-trx",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_trx_przeskoki_wykroczne.mp4"
  },
  {
    "id": "yzwiarz",
    "name": "Łyżwiarz",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/lyzwiarz",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_lyzwiarz.mp4"
  },
  {
    "id": "bridge-toe-tap",
    "name": "Bridge toe tap",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/bridge-toe-tap",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_bridge_toe_tap.mp4"
  },
  {
    "id": "bieg-w-miejscu-piety-o-posladki",
    "name": "Bieg w miejscu – pięty o pośladki",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/bieg-w-miejscu-piety-o-posladki",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_bieg_w_miejscu_piety_o_posladki.mp4"
  },
  {
    "id": "bieg-w-miejscu-kolana-wysoko",
    "name": "Bieg w miejscu – kolana wysoko",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/bieg-w-miejscu-kolana-wysoko",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_bieg_w_miejscu_kolana_wysoko.mp4"
  },
  {
    "id": "bieg-przy-scianie",
    "name": "Bieg przy ścianie",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/bieg-przy-scianie",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_bieg_przy_scianie.mp4"
  },
  {
    "id": "wyskoki-z-kolan",
    "name": "Wyskoki z kolan",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/wyskoki-z-kolan",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wyskoki_z_kolan.mp4"
  },
  {
    "id": "pompki-samo-opuszczanie",
    "name": "Pompki – samo opuszczanie",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/pompki-samo-opuszczanie",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_pompki_samo_opuszczanie.mp4"
  },
  {
    "id": "pompki-przy-scianie",
    "name": "Pompki przy ścianie",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/pompki-przy-scianie",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_pompki_przy_scianie.mp4"
  },
  {
    "id": "wios-owanie-w-drzwiach",
    "name": "Wiosłowanie w drzwiach",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/wioslowanie-w-drzwiach",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wioslowanie_w_drzwiach.mp4"
  },
  {
    "id": "robak-nogi-ugiete",
    "name": "„Robak” – nogi ugięte",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/robak-nogi-ugiete",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_robak_nogi_ugiete.mp4"
  },
  {
    "id": "mountain-climbing",
    "name": "Mountain climbing",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/mountain-climbing",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_mountain_climbing.mp4"
  },
  {
    "id": "side-plank-na-kolanach-z-noga-w-odwiedzeniu",
    "name": "Side plank na kolanach z nogą w odwiedzeniu",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/side-plank-na-kolanach-z-noga-w-odwiedzeniu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_side_plank_na_kolanach_z_noga_w_odwiedzeniu.mp4"
  },
  {
    "id": "bear-crawl-shoulder-tap",
    "name": "Bear crawl shoulder tap",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/bear-crawl-shoulder-tap",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-bear-shoulder-tap.mp4"
  },
  {
    "id": "pompka-z-guma",
    "name": "Pompka z gumą",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/pompka-z-guma",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-pompka-z-guma.mp4"
  },
  {
    "id": "bear-row",
    "name": "Bear row",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/bear-row",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-bear-row.mp4"
  },
  {
    "id": "bear-plank",
    "name": "Bear plank",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/bear-plank",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-bear-plank.mp4"
  },
  {
    "id": "bear-crawl",
    "name": "Bear crawl",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/bear-crawl",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-bear-crawl.mp4"
  },
  {
    "id": "przysiad-z-wycisnieciem-gumy",
    "name": "Przysiad z wyciśnięciem gumy",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/przysiad-z-wycisnieciem-gumy",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-przysiad-z-wycisnieciem-gumy.mp4"
  },
  {
    "id": "naprzemienne-wznosy-reki-i-nogi-w-kleku-podpartym",
    "name": "Naprzemienne wznosy ręki i nogi w klęku podpartym",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/naprzemienne-wznosy-reki-i-nogi-w-kleku-podpartym",
    "videoUrl": "https://static.fabrykasily.pl/atlas/naprzemienne_wznosy_reki_i_nogi_w_kleku_podpartym.mp4"
  },
  {
    "id": "pompki-z-podparciem-kolan",
    "name": "Pompki z podparciem kolan",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/pompki-z-podparciem-kolan",
    "videoUrl": "https://static.fabrykasily.pl/atlas/pompki_z_podparciem_kolan.mp4"
  },
  {
    "id": "w-raise-wznosy-ramion-z-przyciaganiem-w-lezeniu-na-brzuchu",
    "name": "W raise – wznosy ramion z przyciąganiem w leżeniu na brzuchu",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/w-raise-wznosy-ramion-z-przyciaganiem-w-lezeniu-na-brzuchu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/w_raise_wznosy_ramion_z_przyciaganiem_w_lezeniu_na_brzuchu.mp4"
  },
  {
    "id": "t-raise-wznosy-ramion-w-lezeniu-na-brzuchu",
    "name": "T raise – wznosy ramion w leżeniu na brzuchu",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/t-raise",
    "videoUrl": "https://static.fabrykasily.pl/atlas/t_raise_wznosy_ramion_w_lezeniu_na_brzuchu.mp4"
  },
  {
    "id": "i-raise-wznosy-ramion-w-lezeniu-na-brzuchu",
    "name": "I raise – wznosy ramion w leżeniu na brzuchu",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/i-rasie-wznosy-ramion-w-lezeniu-na-brzuchu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/i_raise_wznosy_ramion_w_lezeniu_na_brzuchu.mp4"
  },
  {
    "id": "przysiad-bu-garski",
    "name": "Przysiad bułgarski",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/cwiczenia-domowe/przysiad-bulgarski",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przysiad_bulgarski_wersja_posladkowa.mp4"
  },
  {
    "id": "naprzemienne-przyciaganie-kolan-do-klatki-w-podporze-przodem",
    "name": "Naprzemienne przyciąganie kolan do klatki w podporze przodem",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/naprzemienne-przyciaganie-kolan-do-klatki-2",
    "videoUrl": "https://static.fabrykasily.pl/atlas/naprzemienne_przyciaganie_kolan_do_klatki_w_podporze_przodem.mp4"
  },
  {
    "id": "deska-scianka-plank",
    "name": "Deska/ścianka/plank",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/deska-scianka-plank",
    "videoUrl": "https://static.fabrykasily.pl/atlas/deska_scianka_plank.mp4"
  },
  {
    "id": "pompki-spidermana",
    "name": "Pompki spidermana",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/pompki-spidermana",
    "videoUrl": "https://static.fabrykasily.pl/atlas/pompki_spidermana.mp4"
  },
  {
    "id": "przysiad-przy-scianie",
    "name": "Przysiad przy ścianie",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/przysiad-przy-scianie",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przysiad_przy_scianie.mp4"
  },
  {
    "id": "nozyczki-nogami",
    "name": "Nożyczki nogami",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/scyzoryki-nogami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/nożyczki_nogami.mp4"
  },
  {
    "id": "unoszenie-bioder-w-gore-w-podporze-bokiem",
    "name": "Unoszenie bioder w górę w podporze bokiem",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/unoszenie-bioder-w-gore-w-podporze-3",
    "videoUrl": "https://static.fabrykasily.pl/atlas/unoszenie_bioder_w_gore_w_podporze_bokiem.mp4"
  },
  {
    "id": "unoszenie-bioder-ze-stopami-ustawionymi-na-podwyzszeniu",
    "name": "Unoszenie bioder ze stopami ustawionymi na podwyższeniu",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/unoszenie-bioder-ze-stopami-ustawionymi",
    "videoUrl": "https://static.fabrykasily.pl/atlas/unoszenie_bioder_ze_stopami_ustawionymi_na_podwyzeszniu.mp4"
  },
  {
    "id": "unoszenie-nogi-w-gore-w-kleku-podpartym",
    "name": "Unoszenie nogi w górę w klęku podpartym",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/unoszenie-nogi-w-gore-w-kleku-3",
    "videoUrl": "https://static.fabrykasily.pl/atlas/unoszenie_nogi_w_gore_w_kleku_podpartym.mp4"
  },
  {
    "id": "wykroki-w-miejscu",
    "name": "Wykroki w miejscu",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/wykroki-w-miejscu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wykroki_w_miejscu.mp4"
  },
  {
    "id": "wypychanie-bioder-w-gore-swieca",
    "name": "Wypychanie bioder w górę (świeca)",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/wypychanie-bioder-w-gore",
    "videoUrl": "https://static.fabrykasily.pl/atlas/swieca_z_prostowaniem_nog_lezac.mp4"
  },
  {
    "id": "bieg-bokserski",
    "name": "Bieg bokserski",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/bieg-bokserski",
    "videoUrl": "https://static.fabrykasily.pl/atlas/bieg_bokserski.mp4"
  },
  {
    "id": "deseczka-bokiem-side-plank",
    "name": "Deseczka bokiem – side plank",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/deseczka-bokiem-side-plank",
    "videoUrl": "https://static.fabrykasily.pl/atlas/deseczka_bokiem_side_plank.mp4"
  },
  {
    "id": "g-ebokie-przeskoki-z-nogi-na-noge",
    "name": "Głębokie przeskoki z nogi na nogę",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/glebokie-przeskoki-z-nogi-na-noge",
    "videoUrl": "https://static.fabrykasily.pl/atlas/glebokie_przeskoki_z_nogi_na_noge.mp4"
  },
  {
    "id": "martwy-ciag-na-jednej-nodze",
    "name": "Martwy ciąg na jednej nodze",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/martwy-ciag-na-jednej-nodze",
    "videoUrl": "https://static.fabrykasily.pl/atlas/martwy_ciag_na_jednej_nodze.mp4"
  },
  {
    "id": "naprzemianstronne-przyciaganie-kolan-do-okci-stojac",
    "name": "Naprzemianstronne przyciąganie kolan do łokci stojąc",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/naprzemianstronne-przyciaganie-kolan-do-lokci-stojac",
    "videoUrl": "https://static.fabrykasily.pl/atlas/naprzemianstronne_przyciaganie_kolan_do_lokci_stojac.mp4"
  },
  {
    "id": "naprzemianstronne-przyciaganie-kolan-do-okci-w-podporze",
    "name": "Naprzemianstronne przyciąganie kolan do łokci w podporze",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/naprzemianstronne-przyciaganie-kolan-do-lokci",
    "videoUrl": "https://static.fabrykasily.pl/atlas/naprzemienne_przyciaganie_kolan_do_lokci_w_podporze.mp4"
  },
  {
    "id": "nurkowanie-delfina",
    "name": "Nurkowanie delfina",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/nurkowanie-delfina",
    "videoUrl": "https://static.fabrykasily.pl/atlas/nurkowanie_delfina.mp4"
  },
  {
    "id": "burpees",
    "name": "Burpees",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/burpees-2",
    "videoUrl": "https://static.fabrykasily.pl/atlas/burpees.mp4"
  },
  {
    "id": "przyciaganie-piet-do-posladkow-w-lezeniu-na-plecach",
    "name": "Przyciąganie pięt do pośladków w leżeniu na plecach",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/przyciaganie-piet-do-posladkow-w-lezeniu-3",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przyciaganie_piet_do_posladkow_w_lezeniu_na_plecach.mp4"
  },
  {
    "id": "robak",
    "name": "„Robak”",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/robak",
    "videoUrl": "https://static.fabrykasily.pl/atlas/robak.mp4"
  },
  {
    "id": "superman",
    "name": "Superman",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/superman",
    "videoUrl": "https://static.fabrykasily.pl/atlas/superman.mp4"
  },
  {
    "id": "wchodzenie-na-podwyzszenie-z-uniesieniem-kolana",
    "name": "Wchodzenie na podwyższenie z uniesieniem kolana",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/wchodzenie-na-podwyzszenie-z-uniesieniem-kolana",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wchodzenie_na_podwyzszenie_z_uniesieniem_kolana.mp4"
  },
  {
    "id": "wspiecia-na-palce-stojac",
    "name": "Wspięcia na palce stojąc",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/wspiecia-na-palce-stojac",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wspiecia_na_palce_stojac.mp4"
  },
  {
    "id": "wykroki-w-bok",
    "name": "Wykroki w bok",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/wykroki-w-bok",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wykrok_w_bok.mp4"
  },
  {
    "id": "wykroki-zegarowe",
    "name": "Wykroki zegarowe",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/wykroki-zegarowe",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wykroki_zegarowe.mp4"
  },
  {
    "id": "indyjskie-pompki",
    "name": "Indyjskie pompki",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/indyjskie-pompki",
    "videoUrl": "https://static.fabrykasily.pl/atlas/indyjskie_pompki.mp4"
  },
  {
    "id": "pompki-do-pozycji-t",
    "name": "Pompki do pozycji T",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/pompki-do-pozycji",
    "videoUrl": "https://static.fabrykasily.pl/atlas/pompki_do_pozycji_t.mp4"
  },
  {
    "id": "pompki-eksplozywne",
    "name": "Pompki eksplozywne",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "trudne",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/pompki-eksplozywne",
    "videoUrl": "https://static.fabrykasily.pl/atlas/pompki_eksplozywne.mp4"
  },
  {
    "id": "pompki-na-kostkach",
    "name": "Pompki na kostkach",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/pompki-na-kostkach",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_pompki_na_piesciach.mp4"
  },
  {
    "id": "pompki-na-miesnie-ramion",
    "name": "Pompki na mięśnie ramion",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/pompki-na-miesnie-ramion",
    "videoUrl": "https://static.fabrykasily.pl/atlas/pompki_na_miesnie_ramion.mp4"
  },
  {
    "id": "pompki-na-podwyzszeniu",
    "name": "Pompki na podwyższeniu",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/pompki-na-podwyzszeniu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/pompki_na_podwyzszeniu.mp4"
  },
  {
    "id": "pompki-z-przyciagnieciem-kolana-do-klatki-piersiowej",
    "name": "Pompki z przyciągnięciem kolana do klatki piersiowej",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/pompki-z-przyciagnieciem-kolana-do-klatki",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_pompki_z_przyciaganiem_kolana_do_klatki_piersiowej.mp4"
  },
  {
    "id": "pompki-tradycyjne",
    "name": "Pompki tradycyjne",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/pompki-tradycyjne",
    "videoUrl": "https://static.fabrykasily.pl/atlas/pompki_tradycyjne_pompka_klasyczna.mp4"
  },
  {
    "id": "pompki-z-klasnieciem",
    "name": "Pompki z klaśnięciem",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/pompki-z-klasnieciem",
    "videoUrl": "https://static.fabrykasily.pl/atlas/pompki_z_klasnieciem.mp4"
  },
  {
    "id": "pompki-ze-stopami-na-podwyzszeniu",
    "name": "Pompki ze stopami na podwyższeniu",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/pompki-ze-stopami-na-podwyzszeniu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/pompki_ze_stopami_na_podwyzszeniu.mp4"
  },
  {
    "id": "przysiad-z-wyskokiem-w-gore",
    "name": "Przysiad z wyskokiem w górę",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/domowe/przysiad-z-wyskokiem-w-gore",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przysiad_z_wyskokiem_w_gore.mp4"
  },
  {
    "id": "podciaganie-z-przenoszeniem-na-boki",
    "name": "Podciąganie z przenoszeniem na boki",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "drazek",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/podciaganie-z-przenoszeniem-na-boki",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_podciaganie_z_przenoszeniem_na_boki.mp4"
  },
  {
    "id": "wznos-do-wagi-przodem-z-ugietymi-nogami",
    "name": "Wznos do wagi przodem z ugiętymi nogami",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/wznos-do-wagi-przodem-z-ugietymi-nogami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wznos_do_wagi_przodem_z_ugietymi_kolanami.mp4"
  },
  {
    "id": "wysokie-podciaganie-na-drazku",
    "name": "Wysokie podciąganie na drążku",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "drazek",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/wysokie-podciaganie-na-drazku",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wysokie_podciaganie_na_drazku.mp4"
  },
  {
    "id": "wyjscie-w-przod-w-podporze-przodem",
    "name": "Wyjście w przód w podporze przodem",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/wyjscie-w-przod-w-podporze-przodem",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wyjscie_w_przod_w_podporze_przodem.mp4"
  },
  {
    "id": "wyciskanie-francuskie-masa-cia-a-na-kolanach",
    "name": "Wyciskanie francuskie masą ciała na kolanach",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/wyciskanie-francuskie-masa-ciala-na-kolanach",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wyciskanie_francuskie_masa_ciala_na_kolanach.mp4"
  },
  {
    "id": "wyciskanie-francuskie-masa-cia-a",
    "name": "Wyciskanie francuskie masą ciała",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/wyciskanie-francuskie-masa-ciala",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wyciskanie_francuskie_masa_ciala.mp4"
  },
  {
    "id": "wycieraczki-na-drazku-nogi-ugiete",
    "name": "Wycieraczki na drążku – nogi ugięte",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "drazek",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/wycieraczki-na-drazku-nogi-ugiete",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wycieraczki_na_drazku_nogi_ugiete.mp4"
  },
  {
    "id": "wycieraczki-na-drazku-nogi-proste",
    "name": "Wycieraczki na drążku – nogi proste",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "drazek",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/wycieraczki-na-drazku-nogi-proste",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wycieraczki_na_drazku_nogi_proste.mp4"
  },
  {
    "id": "waga-przodem-z-ugietymi-kolanami",
    "name": "Waga przodem z ugiętymi kolanami",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/waga-przodem-z-ugietymi-kolanami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_waga_przodem_z_ugietymi_kolanami.mp4"
  },
  {
    "id": "unoszenie-prostych-nog-w-siadzie",
    "name": "Unoszenie prostych nóg w siadzie",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/unoszenie-prostych-nog-w-siadzie",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_unoszenie_prostych_nog_w_siadzie.mp4"
  },
  {
    "id": "unoszenie-prostych-nog-w-gore-na-poreczach",
    "name": "Unoszenie prostych nóg w górę na poręczach",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/unoszenie-prostych-nog-w-gore-na-poreczach",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_unoszenie_prostych_nog_w_gore_na_poreczach.mp4"
  },
  {
    "id": "tygrysia-pompka",
    "name": "Tygrysia pompka",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/tygrysia-pompka",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_tygrysia_pompka.mp4"
  },
  {
    "id": "pompka-sphinx",
    "name": "Pompka sphinx",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/pompka-sphinx",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_pompka_sphinx.mp4"
  },
  {
    "id": "skin-the-cat",
    "name": "Skin the cat",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/skin-the-cat",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_skin_the_cat.mp4"
  },
  {
    "id": "poziomka-w-zwisie-na-drazku",
    "name": "Poziomka w zwisie na drążku",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "drazek",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/poziomka-w-zwisie-na-drazku",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_poziomka_w_zwisie_na_drazku.mp4"
  },
  {
    "id": "poziomka",
    "name": "Poziomka",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/poziomka",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_poziomka.mp4"
  },
  {
    "id": "pompki-w-podchwycie",
    "name": "Pompki w podchwycie",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/pompki-w-podchwycie",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_pompki_w_podchwycie.mp4"
  },
  {
    "id": "pompki-samymi-opatkami",
    "name": "Pompki samymi łopatkami",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/pompki-samymi-lopatkami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_pompki_samymi_lopatkami.mp4"
  },
  {
    "id": "pompki-na-poreczach-opatkami",
    "name": "Pompki na poręczach łopatkami",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/pompki-na-poreczach-lopatkami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_pompki_na_poreczach_lopatkami.mp4"
  },
  {
    "id": "pompka-z-przenoszeniem-cia-a-na-boki",
    "name": "Pompka z przenoszeniem ciała na boki",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/pompka-z-przenoszeniem-ciala-na-boki",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_pompka_z_przenoszeniem_ciala_na_boki.mp4"
  },
  {
    "id": "pompka-kobra",
    "name": "Pompka kobra",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/pompka-kobra",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_pompka_kobra.mp4"
  },
  {
    "id": "podciaganie-w-poziomce-chwyt-neutralny",
    "name": "Podciąganie w poziomce chwyt neutralny",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "drazek",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/podciaganie-w-poziomce-chwyt-neutralny",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_podciaganie_w_poziomce_chwyt_neutralny.mp4"
  },
  {
    "id": "odwrocone-przyciaganie-australijskie-na-biceps",
    "name": "Odwrócone przyciąganie australijskie na biceps",
    "category": "Ramiona",
    "primaryMuscles": [
      "biceps",
      "ramiona"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/odwrocone-przyciaganie-australijskie-na-biceps",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_odwrocone_przyciaganie_australijskie_na_biceps.mp4"
  },
  {
    "id": "dragon-flag-samo-opuszczanie",
    "name": "Dragon flag – samo opuszczanie",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/dragon-flag-samo-opuszczanie",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_dragon_flag_samo_opuszczanie.mp4"
  },
  {
    "id": "dragon-flag-nogi-ugiete",
    "name": "Dragon flag – nogi ugięte",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/dragon-flag-nogi-ugiete",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_dragon_flag_nogi_ugiete.mp4"
  },
  {
    "id": "zaawansowane-podciaganie-opatkami",
    "name": "Zaawansowane podciąganie łopatkami",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "drazek",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/zaawansowane-podciaganie-lopatkami",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_zaawansowane_podciaganie_lopatkami.mp4"
  },
  {
    "id": "unoszenie-kolan-do-klatki-na-poreczach",
    "name": "Unoszenie kolan do klatki na poręczach",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/unoszenie-kolan-do-klatki-na-poreczach",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_unoszenie_kolan_do_klatki_na_poreczach.mp4"
  },
  {
    "id": "wznosy-zgietych-nog",
    "name": "Wznosy zgiętych nóg",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/street-workout/wznosy-zgietych-nog",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przyciaganie_kolan_do_klatki_w_zwisie_na_drazku.mp4"
  },
  {
    "id": "pike-push-ups",
    "name": "Pike push ups",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/street-workout/pike-push-ups",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_pike_push_ups.mp4"
  },
  {
    "id": "plank-na-okciach",
    "name": "Plank na łokciach",
    "category": "Brzuch i core",
    "primaryMuscles": [
      "core",
      "brzuch"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/street-workout/plank-na-lokciach",
    "videoUrl": "https://static.fabrykasily.pl/atlas/deska_scianka_plank.mp4"
  },
  {
    "id": "pompki-na-piesciach",
    "name": "Pompki na pięściach",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/street-workout/pompki-na-piesciach",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_pompki_na_piesciach.mp4"
  },
  {
    "id": "pompki-na-podwyzszeniu-rece-szeroko",
    "name": "Pompki na podwyższeniu, ręce szeroko",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/street-workout/pompki-na-podwyzszeniu-rece-szeroko-inclinepushup",
    "videoUrl": "https://static.fabrykasily.pl/atlas/pompki_na_podwyzszeniu.mp4"
  },
  {
    "id": "szerokie-pompki",
    "name": "Szerokie pompki",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/street-workout/szerokie-pompki-wide-push-ups",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_szerokie_pompki.mp4"
  },
  {
    "id": "pompki-na-drazku-bar-dip-okcie-wzd-uz-cia-a-na-szerokosci-barkow",
    "name": "Pompki na drążku (bar dip), łokcie wzdłuż ciała na szerokości barków",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "drazek",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/street-workout/pompki-na-drazku-bar-dip-lokcie-2",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_pompki_na_drazku.mp4"
  },
  {
    "id": "zarzut-hantli-nad-g-owe",
    "name": "Zarzut hantli nad głowę",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "hantle",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/crossfit/zarzut-hantli-nad-glowe",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_zarzut_hantli_nad_glowe.mp4"
  },
  {
    "id": "devil-press",
    "name": "Devil press",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/crossfit/devil-press",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_devil_press.mp4"
  },
  {
    "id": "zarzut-z-wycisnieciem-po-sztangi",
    "name": "Zarzut z wyciśnięciem półsztangi",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "sztanga",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/crossfit/zarzut-z-wycisnieciem-polsztangi",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wioslowanie_z_wycisnieciem_polsztangi.mp4"
  },
  {
    "id": "push-up",
    "name": "Push-up",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/cwiczenia/crossfit/push",
    "videoUrl": "https://static.fabrykasily.pl/atlas/pompki_tradycyjne_pompka_klasyczna.mp4"
  },
  {
    "id": "wiatrak-w-kleku-jednonoz",
    "name": "Wiatrak w klęku jednonóż",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "kettlebell",
    "difficulty": "trudne",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/kettlebell/wiatrak-w-kleku-jednonoz",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_wiatrak_w_kleku_jednonoz.mp4"
  },
  {
    "id": "american-swing",
    "name": "American swing",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "kettlebell",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/kettlebell/american-swing",
    "videoUrl": "https://static.fabrykasily.pl/atlas/american_swing.mp4"
  },
  {
    "id": "russian-twist",
    "name": "Russian twist",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "kettlebell",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/kettlebell/russian-twist",
    "videoUrl": "https://static.fabrykasily.pl/atlas/russian_twist.mp4"
  },
  {
    "id": "one-arm-snatch-rwanie-kettla",
    "name": "One arm snatch – rwanie kettla",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "kettlebell",
    "difficulty": "trudne",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/kettlebell/one-arm-snatch-rwanie-kettla",
    "videoUrl": "https://static.fabrykasily.pl/atlas/snatch_jednoracz.mp4"
  },
  {
    "id": "swing-jednoracz",
    "name": "Swing jednorącz",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "kettlebell",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/kettlebell/swing-jednoracz",
    "videoUrl": "https://static.fabrykasily.pl/atlas/swing_jednoracz.mp4"
  },
  {
    "id": "swing",
    "name": "Swing",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "kettlebell",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/kettlebell/swing",
    "videoUrl": "https://static.fabrykasily.pl/atlas/swing_oburacz.mp4"
  },
  {
    "id": "thrusters-przysiad-z-wycisnieciem-jednoracz",
    "name": "Thrusters – przysiad z wyciśnięciem jednorącz",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "kettlebell",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/kettlebell/thrusters-przysiad-z-wycisnieciem-jednoracz",
    "videoUrl": "https://static.fabrykasily.pl/atlas/thrusters_jednoracz.mp4"
  },
  {
    "id": "thrusters-przysiad-z-wycisnieciem",
    "name": "Thrusters – przysiad z wyciśnięciem",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "kettlebell",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/kettlebell/thrusters-przysiad-z-wycisnieciem",
    "videoUrl": "https://static.fabrykasily.pl/atlas/thrusters_oburacz.mp4"
  },
  {
    "id": "windmill-wiatrak",
    "name": "Windmill – wiatrak",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "kettlebell",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/kettlebell/windmill-wiatrak",
    "videoUrl": "https://static.fabrykasily.pl/atlas/windmill.mp4"
  },
  {
    "id": "tgu-tureckie-wstawanie",
    "name": "TGU – tureckie wstawanie",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "kettlebell",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/kettlebell/tgu-tureckie-wstawanie",
    "videoUrl": "https://static.fabrykasily.pl/atlas/TGU.mp4"
  },
  {
    "id": "snatch-rwanie-kettli",
    "name": "Snatch – rwanie kettli",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "kettlebell",
    "difficulty": "trudne",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/kettlebell/snatch-rwanie-kettli",
    "videoUrl": "https://static.fabrykasily.pl/atlas/snatch.mp4"
  },
  {
    "id": "one-arm-clean-zarzut-kettla",
    "name": "One arm clean – zarzut kettla",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "kettlebell",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/kettlebell/one-arm-clean-zarzut-kettla",
    "videoUrl": "https://static.fabrykasily.pl/atlas/clean_jednoracz.mp4"
  },
  {
    "id": "clean-zarzut-kettli",
    "name": "Clean – zarzut kettli",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "kettlebell",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/kettlebell/clean-zarzut-kettli",
    "videoUrl": "https://static.fabrykasily.pl/atlas/clean_oburacz.mp4"
  },
  {
    "id": "one-arm-military-press-wyciskanie-zo-nierskie-jednoracz",
    "name": "One arm military press, wyciskanie żołnierskie jednorącz",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "kettlebell",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/kettlebell/one-arm-military-press-wyciskanie-zolnierskie-jednoracz",
    "videoUrl": "https://static.fabrykasily.pl/atlas/millitary_press_jednoracz.mp4"
  },
  {
    "id": "military-press-wyciskanie-zo-nierskie",
    "name": "Military press, wyciskanie żołnierskie",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "kettlebell",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/kettlebell/military-press-wyciskanie-zolnierskie",
    "videoUrl": "https://static.fabrykasily.pl/atlas/millitary_press_oburacz.mp4"
  },
  {
    "id": "one-arm-overhead-squat-przysiad-z-ciezarem-nad-g-owa",
    "name": "One arm overhead squat – przysiad z ciężarem nad głową",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "kettlebell",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/kettlebell/one-arm-overhead-squat-przysiad-z-ciezarem-nad-glowa",
    "videoUrl": "https://static.fabrykasily.pl/atlas/over_head_jednoracz_z_kettlem.mp4"
  },
  {
    "id": "overhead-squat-przysiad-z-ciezarem-nad-g-owa",
    "name": "Overhead squat – przysiad z ciężarem nad głową",
    "category": "Nogi",
    "primaryMuscles": [
      "nogi",
      "posladki"
    ],
    "equipment": "kettlebell",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/kettlebell/overhead-squat-przysiad-z-ciezarem-nad-glowa",
    "videoUrl": "https://static.fabrykasily.pl/atlas/over_head_squat_kettlebell.mp4"
  },
  {
    "id": "push-press-wyciskanie-jednoracz-z-pomoca-nog",
    "name": "Push press – wyciskanie jednorącz z pomocą nóg",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "kettlebell",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/kettlebell/push-press-wyciskanie-jednoracz-z-pomoca-nog",
    "videoUrl": "https://static.fabrykasily.pl/atlas/push_press_jednoracz.mp4"
  },
  {
    "id": "push-press-wyciskanie-z-pomoca-nog",
    "name": "Push press – wyciskanie z pomocą nóg",
    "category": "Funkcjonalne",
    "primaryMuscles": [
      "cale cialo",
      "core"
    ],
    "equipment": "kettlebell",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/kettlebell/push-press-wyciskanie-z-pomoca-nog",
    "videoUrl": "https://static.fabrykasily.pl/atlas/push_press_oburacz.mp4"
  },
  {
    "id": "podpor-wykroczny-z-rotacja",
    "name": "Podpór wykroczny z rotacją",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/podpor-wykroczny-z-rotacja",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_podpor_wykroczny_z_rotacja.mp4"
  },
  {
    "id": "halo-w-przysiadzie",
    "name": "Halo w przysiadzie",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/halo-w-przysiadzie",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_halo_w_przysiadzie.mp4"
  },
  {
    "id": "halo-w-kleku-jednonoz",
    "name": "Halo w klęku jednonóż",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "trudne",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/halo-w-kleku-jednonoz",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_halo_w_kleku_jednonoz.mp4"
  },
  {
    "id": "90-90-switch",
    "name": "90/90 switch",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/90-90-switch",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_90_90_switch.mp4"
  },
  {
    "id": "90-90-get-up",
    "name": "90/90 get up",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/90-90-get-up",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_90_90_get_up.mp4"
  },
  {
    "id": "assisted-hip-airplane",
    "name": "Assisted hip airplane",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/assisted-hip-airplane",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_assisted_hip_airplane.mp4"
  },
  {
    "id": "opad-tu-owia-z-kijem-na-plecach",
    "name": "Opad tułowia z kijem na plecach",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/opad-tulowia-z-kijem-na-plecach",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_opad_tulowia_z_kijem_na_plecach.mp4"
  },
  {
    "id": "serratus-wall-slide",
    "name": "Serratus wall slide",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/serratus-wall-slide",
    "videoUrl": "https://static.fabrykasily.pl/atlas/video-seratus-wall-slide.mp4"
  },
  {
    "id": "retrakcja-depresja-opatek",
    "name": "Retrakcja – depresja łopatek",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/retrakcja-depresja-lopatek",
    "videoUrl": "https://static.fabrykasily.pl/atlas/retrakcja_depresja_lopatek.mp4"
  },
  {
    "id": "robak-dotykanie-przeciwnych-stop",
    "name": "„Robak” – dotykanie przeciwnych stóp",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/robak-dotykanie-przeciwnych-stop",
    "videoUrl": "https://static.fabrykasily.pl/atlas/robak_dotykanie_przeciwnych_stop.mp4"
  },
  {
    "id": "przenoszenie-ramion-z-guma",
    "name": "Przenoszenie ramion z gumą",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/przenoszenie-ramion-z-guma",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przenoszenie_ramion_z_guma.mp4"
  },
  {
    "id": "pull-apart",
    "name": "Pull apart",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/pull-apart",
    "videoUrl": "https://static.fabrykasily.pl/atlas/m_pull_apart.mp4"
  },
  {
    "id": "przyciaganie-gumy-do-cia-a-szeroko",
    "name": "Przyciąganie gumy do ciała szeroko",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/przyciaganie-gumy-do-ciala-szeroko",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przyciaganie_gumy_do_ciala_szeroko.mp4"
  },
  {
    "id": "przysiad-rotacje-hip-hinge",
    "name": "Przysiad – rotacje – hip hinge",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/przysiad-rotacje-hip-hinge",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przysiad_rotacje_hiphinge.mp4"
  },
  {
    "id": "przysiad-robak-pompka",
    "name": "Przysiad – „robak” – pompka",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/przysiad-robak-pompka",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przysiad_robak_pompka.mp4"
  },
  {
    "id": "przyciaganie-gumy-do-cia-a-w-opadzie-tu-owia",
    "name": "Przyciąganie gumy do ciała w opadzie tułowia",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/przyciaganie-gumy-do-ciala-w-opadzie-tulowia",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przyciaganie_gumy_do_ciala_w_opadzie_tulowia.mp4"
  },
  {
    "id": "rotacje-w-skulonym-siadzie-klecznym",
    "name": "Rotacje w skulonym siadzie klęcznym",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/rotacje-w-skulonym-siadzie-klecznym",
    "videoUrl": "https://static.fabrykasily.pl/atlas/rotacje_w_skulonym_siadzie_klecznym.mp4"
  },
  {
    "id": "pies-z-g-owa-w-do-foczka",
    "name": "„Pies z głową w dół” – „foczka”",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/pies-z-glowa-w-dol-foczka",
    "videoUrl": "https://static.fabrykasily.pl/atlas/pies_z_glowa_w_dol_foczka.mp4"
  },
  {
    "id": "rotacje-barkami-unoszenie-ramion",
    "name": "Rotacje barkami – unoszenie ramion",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/rotacje-barkami-unoszenie-ramion",
    "videoUrl": "https://static.fabrykasily.pl/atlas/rotacje_barkami_unoszenie_ramion.mp4"
  },
  {
    "id": "pies-z-g-owa-w-do-wykrok",
    "name": "„Pies z głową w dół” – wykrok",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/pies-z-glowa-w-dol-wykrok",
    "videoUrl": "https://static.fabrykasily.pl/atlas/pies_z_glowa_w_dol_wykrok.mp4"
  },
  {
    "id": "robak-wykrok-rotacja",
    "name": "„Robak” – wykrok – rotacja",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/robak-wykrok-rotacja",
    "videoUrl": "https://static.fabrykasily.pl/atlas/robak_wykrok_rotacja.mp4"
  },
  {
    "id": "przenoszenie-ramion-w-lezeniu",
    "name": "Przenoszenie ramion w leżeniu",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/przenoszenie-ramion-w-lezeniu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przenoszenie_ramion_w_lezeniu.mp4"
  },
  {
    "id": "przysiad-hip-hinge",
    "name": "Przysiad – hip hinge",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/przysiad-hip-hinge",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przysiad_hip_hinge.mp4"
  },
  {
    "id": "przyciaganie-gumy-do-cia-a-wasko",
    "name": "Przyciąganie gumy do ciała wąsko",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/przyciaganie-gumy-do-ciala-wasko",
    "videoUrl": "https://static.fabrykasily.pl/atlas/przyciaganie_gumy_do_ciala_wasko.mp4"
  },
  {
    "id": "hip-hinge-rotacje",
    "name": "Hip hinge – rotacje",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/hip-hinge-rotacje",
    "videoUrl": "https://static.fabrykasily.pl/atlas/hip_hinge_rotacje.mp4"
  },
  {
    "id": "wykrok-rotacja",
    "name": "Wykrok – rotacja",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/wykrok-rotacja",
    "videoUrl": "https://static.fabrykasily.pl/atlas/wykrok_rotacja.mp4"
  },
  {
    "id": "kozak-squat-mobility",
    "name": "Kozak squat mobility",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/kozak-squat-mobility",
    "videoUrl": "https://static.fabrykasily.pl/atlas/kozak_squat_mobility.mp4"
  },
  {
    "id": "uniesienie-kolana-wykrok-odchylenie-cia-a",
    "name": "Uniesienie kolana – wykrok – odchylenie ciała",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/uniesienie-kolana-wykrok-odchylenie-ciala",
    "videoUrl": "https://static.fabrykasily.pl/atlas/uniesienie_kolana_wykrok_odchylenie_ciala_w_tyl_2.mp4"
  },
  {
    "id": "krazenia-ramion-z-guma",
    "name": "Krążenia ramion z gumą",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "guma",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/krazenia-ramion-z-guma",
    "videoUrl": "https://static.fabrykasily.pl/atlas/krazenia_ramion_z_guma.mp4"
  },
  {
    "id": "skretosk-ony",
    "name": "Skrętoskłony",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/skretosklony",
    "videoUrl": "https://static.fabrykasily.pl/atlas/skreto_sklony.mp4"
  },
  {
    "id": "mobilizacja-bioder-w-kleku-wykrocznym",
    "name": "Mobilizacja bioder w klęku wykrocznym",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/mobilizacja-bioder-w-kleku-wykrocznym",
    "videoUrl": "https://static.fabrykasily.pl/atlas/mobilizacja_bioder_w_kleku_wykrocznym.mp4"
  },
  {
    "id": "odwodzenie-kolan-w-lezeniu",
    "name": "Odwodzenie kolan w leżeniu",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/odwodzenie-kolan-w-lezeniu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/odwodzenie_kolan_w_lezeniu.mp4"
  },
  {
    "id": "scapula-wall-slide",
    "name": "Scapula wall slide",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "masa ciala",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/scapula-wall-slide",
    "videoUrl": "https://static.fabrykasily.pl/atlas/scapula_wall_slide.mp4"
  },
  {
    "id": "odwrocony-mostek-wyciagniecie-przeciwnej-reki",
    "name": "Odwrócony mostek – wyciągnięcie przeciwnej ręki",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "wyciag",
    "difficulty": "srednie",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/mobilizacje/odwrocony-mostek-wyciagniecie-przeciwnej-reki",
    "videoUrl": "https://static.fabrykasily.pl/atlas/odwrocony_mostek_wyciagniecie_przeciwnej_reki_2.mp4"
  },
  {
    "id": "rolowanie-miesni-czworog-owych",
    "name": "Rolowanie mięśni czworogłowych",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "roller",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/rolowanie/rolowanie-miesni-czworoglowych",
    "videoUrl": "https://static.fabrykasily.pl/atlas/miesnie_czworoglowe.mp4"
  },
  {
    "id": "rolowanie-miesni-kulszowo-goleniowych",
    "name": "Rolowanie mięśni kulszowo-goleniowych",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "roller",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/rolowanie/rolowanie-miesni-kulszowogoleniowych",
    "videoUrl": "https://static.fabrykasily.pl/atlas/miesnie_kulszowogoleniowe.mp4"
  },
  {
    "id": "rolowanie-miesni-najszerszych-grzbietu",
    "name": "Rolowanie mięśni najszerszych grzbietu",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "roller",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/rolowanie/rolowanie-miesni-najszerszych-grzbietu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/miesnie_najszersze_grzbietu.mp4"
  },
  {
    "id": "rolowanie-zewnetrznej-czesci-uda",
    "name": "Rolowanie zewnętrznej części uda",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "roller",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/rolowanie/rolowanie-zewnetrznej-czesci-uda",
    "videoUrl": "https://static.fabrykasily.pl/atlas/zewnetrzna_czesc_uda.mp4"
  },
  {
    "id": "rolowanie-miesni-posladkowych",
    "name": "Rolowanie mięśni pośladkowych",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "roller",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/rolowanie/rolowanie-miesni-posladkowych",
    "videoUrl": "https://static.fabrykasily.pl/atlas/miesnie_posladkowe.mp4"
  },
  {
    "id": "rolowanie-miesni-gornej-czesci-grzbietu",
    "name": "Rolowanie mięśni górnej części grzbietu",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "roller",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/rolowanie/rolowanie-miesni-gornej-czesci-grzbietu",
    "videoUrl": "https://static.fabrykasily.pl/atlas/miesnie_gornej_czesci_grzbietu.mp4"
  },
  {
    "id": "rolowanie-miesni-klatki-piersiowej",
    "name": "Rolowanie mięśni klatki piersiowej",
    "category": "Mobilnosc",
    "primaryMuscles": [
      "mobilnosc"
    ],
    "equipment": "roller",
    "difficulty": "latwe",
    "pageUrl": "https://www.fabrykasily.pl/atlas-cwiczen/rolowanie/rolowanie-miesni-klatki-piersiowej",
    "videoUrl": "https://static.fabrykasily.pl/atlas/miesnie_piersiowe.mp4"
  }
];