# Raport: mini-gry, wydajnosc i jakosc

Data: 2026-06-11

## Checkpoint

Przed badaniem zostal utworzony checkpoint:

- commit: `51b1548 checkpoint: optimized restored web baseline`
- tag: `checkpoint-web-optimized-20260611`

## Zakres badania

Telefon nie byl dostepny w tej turze, wiec nie udaje pomiarow z Xiaomi. Wyniki ponizej opieraja sie na:

- analizie aktywnego kodu mini-gier w `src/components/BonusMiniGames.tsx`;
- testach jednostkowych;
- lokalnym buildzie web/Capacitor;
- dokumentacji web.dev i Android Developers.

## Glowne ustalenia

Aktywna `Ekstrakcja Cienia` dziala jeszcze na React/DOM + Motion, nie na osobnym silniku WebGL. To znaczy, ze kazde trafienie i szybkie ciecie moze jednoczesnie:

- aktualizowac liste celow;
- aktualizowac HUD;
- pokazywac popup punktow;
- pokazywac feedback tekstowy;
- tworzyc burst czasteczek;
- utrzymywac trail ciecia.

To jest poprawne wizualnie, ale najwieksze ryzyko stutterow powstaje przy jednym dlugim ruchu, ktory lapie kilka obiektow naraz.

## Zrodla techniczne

- web.dev `content-visibility`: offscreenowe sekcje powinny omijac render/layout/paint, kiedy nie sa potrzebne: https://web.dev/articles/content-visibility
- web.dev `animations-guide`: animacje powinny preferowac `transform` i `opacity`, a nie layout/paint-heavy properties: https://web.dev/articles/animations-guide
- web.dev code splitting: ciezkie moduly powinny byc ladowane dopiero wtedy, gdy sa potrzebne: https://web.dev/articles/reduce-javascript-payloads-with-code-splitting
- Android frame rate API: aplikacja moze prosic system o dopasowanie odswiezania, ale system/ROM ma finalna decyzje: https://developer.android.com/media/optimize/performance/frame-rate
- Android Game State API: stan gry mozna raportowac systemowi dla lepszej optymalizacji: https://developer.android.com/games/optimize/adpf/gamemode/gamestate-api

## Wdrozone zmiany

1. `src/gameRuntime/miniGamePerformance.ts`
   - dodany centralny modul budzetow dla `Ekstrakcji Cienia`;
   - budzety obiektow i burstow zaleza od profilu jakosci i chwilowego frame pressure;
   - przy stutterze gra ogranicza jednoczesna prace renderu, ale nie wylacza feedbacku trafien.

2. `src/components/BonusMiniGames.tsx`
   - spawn obiektow ma realny limit; poprzednio batch mogl przekroczyc limit, bo limit byl sprawdzany przed dodawaniem nowych obiektow;
   - bursty trafien korzystaja z budzetu i krotszego lifetime pod presja ramek;
   - popup punktow agreguje szybkie trafienia w jedno pokazanie;
   - feedback tekstowy jest throttlowany i pokazuje ostatni istotny komunikat zamiast kilku renderow pod rzad;
   - czasteczki burstu sa memoizowane.

3. `src/index.css`
   - bursty ciecia dostaly `contain`, `backface-visibility` i `will-change`, zeby odizolowac koszt paint/layout.

## Co to poprawia

- mniej naglych aktualizacji Reacta przy wielu trafieniach jednym gestem;
- mniej naraz aktywnych burstow/animacji, gdy aplikacja wykryje stutter;
- zachowanie efektow wizualnych w normalnym i cinematic flow;
- latwiejsze strojenie przyszlych wartosci bez dotykania calego komponentu mini-gry.

## Co nadal wymaga telefonu

- realne minimum FPS i p95/p99 frametime w 60 sekundach `Ekstrakcji Cienia`;
- `adb shell dumpsys gfxinfo com.damia.sololeveler framestats`;
- sprawdzenie, czy WebView Xiaomi utrzymuje 120 Hz przy wlaczonych efektach i aktywnym motywie;
- porownanie `balanced` kontra `cinematic`.

## Rekomendacja dalsza

Najtrafniejsza droga bez utraty jakosci to etapowa migracja samego playfieldu `Ekstrakcji Cienia` do WebGL/Phaser albo Pixi, ale dopiero po zatwierdzeniu obecnej bazy. React powinien zostac dla HUD, pauzy, sklepu i podsumowania, a obiekty gry, trail i particles powinny byc jedna scena canvas z poolingiem. Obecna zmiana stabilizuje DOM runtime i przygotowuje miejsce pod takie strojenie.
