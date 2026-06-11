# Mini-gry - badanie wydajnosci i jakosci, runda 2

Data: 2026-06-11
Checkpoint przed zmianami: `checkpoint-mini-games-research-20260611`

## Cel

Zachowac jakosc efektow w mini-grach, ale ograniczyc nagle spadki FPS przez zmniejszenie kosztu renderowania React/DOM. Telefon nie byl dostepny w tej rundzie, wiec wynik Android trzeba traktowac jako hipoteze do potwierdzenia przez `adb shell dumpsys gfxinfo` i overlay FPS po instalacji.

## Ustalenia

- Najciezsza mini-gra nadal jest `Ekstrakcja Cienia`, bo scena gry zawiera jednoczesnie cele, trail ciecia, efekty trafien, popupy, HUD i animowane tla.
- Po poprzedniej rundzie liczba aktywnych obiektow i burstow jest juz budzetowana, ale parent sceny nadal moze odswiezac poddrzewo obiektow przy zmianach HUD/popup/trail.
- Bez utraty jakosci najbezpieczniejszy nastepny krok to ograniczenie zbednych re-renderow przez `React.memo` na elementach sceny, ktore renderuja sie czesto, ale zwykle dostaja te same propsy.
- Dalsze duze zyski beda wymagaly przeniesienia samego pola gry do canvas/WebGL albo imperatywnej warstwy transformacji, bo DOM z wieloma filtrami i animacjami ma naturalny limit przy 120 Hz.

## Wdrozone w tej rundzie

- `GameHud` jest memoizowany, wiec nie przebudowuje sie bez zmiany wyniku, czasu, combo albo popupu.
- `ShadowSliceToken` jest memoizowany, wiec zmiany w trailu, HUD albo feedbacku nie powinny przebudowywac kazdego celu, dopoki sam obiekt celu sie nie zmienil.
- `SliceImpactBurst` i `SlicedHalf` sa memoizowane, zeby aktywne efekty trafienia nie renderowaly sie ponownie przez zmiany w innych warstwach sceny.
- `ShadowExtractionChanceMeter` i `SliceTrail` sa memoizowane, co ogranicza koszt update'ow UI wokol pola gry.

## Runda 3 - hot path gestu ciecia

Checkpoint przed runda 3: `checkpoint-mini-games-runda-3-20260611`

- Podczas jednego gestu ciecia `Ekstrakcja Cienia` cache'uje teraz `getBoundingClientRect()` pola gry. Wczesniej pointer move mogl czytac rect w `pointerToPoint()` i ponownie w `slicePath()`.
- Hit-test dostal szybki prefilter bounding-box: obiekty lezace daleko od odcinka ciecia sa odrzucane przed dokladnym `slicePathIntersectsTarget()`.
- Prefilter jest w `miniGameGeometry`, a nie jako ukryta logika UI, i ma test jednostkowy. To ogranicza ryzyko, ze optymalizacja zacznie gubic prawidlowe trafienia.
- Jakosc efektow nie zostala obnizona: zmiana dotyczy tylko ilosci pracy obliczeniowej przy szybkim ruchu palca.

## Rekomendacje na kolejny etap

1. Zmierzyc 60 sekund `Ekstrakcji Cienia` na telefonie przez overlay FPS i `dumpsys gfxinfo`.
2. Jezeli minima dalej spadaja ponizej 90 FPS przy celu 120 Hz, nie obcinac efektow dalej, tylko przeniesc playfield do canvas/WebGL:
   - React zostaje dla HUD, pauzy, sklepu i wyniku.
   - Canvas/WebGL odpowiada za cele, trail, particles, hitboxy i eksplozje.
3. Zostawic DOM tylko dla ekranow aplikacji, bo problem dotyczy glownie ciaglego renderowania sceny gry.

## Zrodla techniczne

- React `memo`: https://react.dev/reference/react/memo
- Optymalizacja animacji transform/opacity: https://web.dev/articles/animations-guide
- CSS containment i odkladanie pracy renderowania: https://web.dev/articles/content-visibility
- Android frame rate API: https://developer.android.com/media/optimize/performance/frame-rate
- Android Game State API: https://developer.android.com/games/optimize/adpf/gamemode/gamestate-api
