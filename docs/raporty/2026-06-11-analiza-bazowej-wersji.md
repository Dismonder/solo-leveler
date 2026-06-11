# Analiza bazowej wersji - 2026-06-11

## Cel

Doprowadzamy przywrocona wersje web/Capacitor do finalnej jakosci bez kolejnej chaotycznej przebudowy. Telefon nie byl dostepny w tej turze, wiec weryfikacja objela lokalne testy, build web i build Android APK.

## Ustalenia

- Najwiekszym natychmiastowym kosztem w zwyklym UI byl ukryty panel mini-gier montowany poza zakladka `Gra`. Ladowal karty, obrazy i warstwy mimo ze uzytkownik byl np. w `Status`.
- `BonusMiniGames.tsx` byl importowany statycznie w `Dashboard.tsx`, przez co runtime mini-gier byl parsowany razem ze startem aplikacji.
- Diagnostyka FPS miala bufor, ale raport `stutters25/stutters33` bral ostatnia probke. To moglo ukrywac chwilowe spadki po tym, jak aplikacja juz sie uspokoila.
- Build nadal pokazuje duzy glowny chunk oraz bardzo duze pliki MP3. To nie blokuje builda, ale zostaje glownym ryzykiem czasu startu, I/O i pamieci.

## Naprawy wykonane

- Usunieto przygotowywanie ukrytego panelu mini-gier poza aktywna zakladka `Gra`.
- Przeniesiono `BonusMiniGamesPanel` i `GameRuntimeScreen` na lazy import.
- Przeniesiono `MotionTracker` i `FpsOverlay` na lazy import; `FpsOverlay` laduje sie dopiero po wlaczeniu opcji dev.
- Dodano `content-visibility: auto` i containment dla glownych kart w przewijanym widoku aplikacji. Dotyczy to zwyklego UI, nie runtime mini-gier ani modali.
- Poprawiono `performanceTrace.summary()`, zeby raportowal najgorsze zarejestrowane stuttery w buforze, a nie tylko ostatni stan.
- Dodano test regresji dla zachowania stutterow po chwilowym odzyskaniu plynnosci.
- Odfiltrowano eventy nagrod z mini-gier jeszcze przed stanem `Dashboard`, zeby niewidoczne popupy nie powodowaly re-renderu glownego UI.
- Dodano memoizacje postepu questa, aktywnej kary, CP lowcy i brakujacych zadan dziennych.
- Dodano kontrolowany podzial vendor chunkow w Vite: React, Motion, Capacitor i Recharts trafiaja do osobnych plikow cache'owalnych.

## Wyniki techniczne

- Glowny JS po rozdzieleniu mini-gier spadl z ok. `738 kB` do ok. `655 kB`.
- Mini-gry sa teraz osobnym chunkiem `BonusMiniGames` ok. `84 kB`.
- Po dodatkowym lazy-load `MotionTracker` i `FpsOverlay` glowny JS spadl do ok. `631 kB`.
- Nowe chunki: `MotionTracker` ok. `18.28 kB`, `FpsOverlay` ok. `5.34 kB`.
- Po podziale vendor chunkow glowny JS spadl do ok. `272 kB`, bez ostrzezenia o duzym glownym chunku.
- Biblioteki `vendor-react`, `vendor-motion`, `vendor-capacitor` i `vendor-charts` sa osobnymi chunkami, co poprawia cache stabilnego kodu w WebView.
- `npm run lint` przeszedl.
- `npm test -- --run` przeszedl: `125` testow.
- `npm run build` przeszedl.
- `npm run android:build` przeszedl.
- Lokalny serwer `http://localhost:3000/` odpowiada statusem `200`.
- Zasoby w `dist/assets`: JS ok. `1.32 MB`, CSS ok. `0.24 MB`, obrazy PNG ok. `7.85 MB`, MP3 ok. `62.15 MB`.
- Debug APK: ok. `87.71 MB`.
- `adb devices` nie wykryl telefonu ani emulatora, wiec nie wykonano `gfxinfo`, logcat ani Perfetto.

## Ryzyka

- Brak telefonu w tej turze oznacza brak realnego `adb gfxinfo`, brak logcata z WebView i brak pomiarow 120 Hz na Xiaomi.
- Glowny chunk nadal przekracza `500 kB`; nastepny kandydat do rozdzielenia to duzy kod dashboardu i plan treningowy.
- Audio MP3 jest duze: ok. `62.15 MB` w buildzie. Nawet przy poprawnym lazy runtime pierwszy start/losowanie utworu moze dac pojedynczy spike I/O.
- Czesc starych plikow `src/games/*` wyglada na legacy. Trzeba potwierdzic uzycie przed czyszczeniem.

## Zastosowane metody

- `content-visibility: auto` dla offscreen UI: przegladarka moze pominac renderowanie elementow poza viewportem i wyrenderowac je dopiero blisko przewiniecia.
- Code splitting/lazy import: kod niepotrzebny na starcie trafia do osobnych chunkow i nie blokuje pierwszego ekranu.
- Animacje zostaja oparte na istniejacym podejsciu `transform/opacity`; nie dodano nowych kosztownych filtrow ani stalego blur w runtime gry.

## Kolejne kroki

1. Uruchomic pomiar z `fpsOverlayEnabled` i zrzucic `globalThis.__soloFrameTrace.summary()` po 60 sekundach normalnego UI oraz po 60 sekundach `Ekstrakcji Cienia`.
2. Dalszy code-splitting: wyjac ciezkie modaly/system/profil z glownego dashboardu tam, gdzie nie sa potrzebne przy starcie.
3. Zbadac legacy `src/games/*` i usunac tylko jesli nie jest osiagalne.
4. Przy telefonie: wykonac `adb shell dumpsys gfxinfo com.damia.sololeveler framestats` po scrollu Status/System i po rundzie mini-gry.

## Zrodla techniczne

- https://web.dev/articles/content-visibility - `content-visibility` pozwala przegladarce pominac layout/paint offscreen contentu i wyrenderowac go dopiero, gdy zbliza sie do viewportu.
- https://web.dev/articles/reduce-javascript-payloads-with-code-splitting - code splitting zmniejsza poczatkowy ladunek JavaScript i prace main thread przy starcie.
- https://web.dev/articles/animations-guide - animacje oparte o `transform` i `opacity` sa bezpieczniejsze dla plynnosci niz animowanie wlasciwosci powodujacych layout/paint.
