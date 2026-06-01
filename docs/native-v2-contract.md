# Solo Leveler V2 - kontrakt migracji natywnej

## Punkt bazowy

- Bazowa wersja web/Capacitor jest zabezpieczona tagiem `checkpoint-restored-web-20260601-040842`.
- Backup zrodel: `C:\Users\Damia\Downloads\solo-leveler-backups\solo-leveler-checkpoint-restored-web-20260601-040842-source.zip`.
- Backup Git: `C:\Users\Damia\Downloads\solo-leveler-backups\solo-leveler-checkpoint-restored-web-20260601-040842.git.bundle`.
- V2 pracuje na osobnej galezi `v2/native-android14-game-engine`.
- V2 instaluje sie jako osobna aplikacja: `com.damia.sololeveler.v2`.

## Cel 1:1

V2 ma odtworzyc bazowa aplikacje 1:1 funkcjonalnie i wizualnie:

- Status lowcy: avatar, level, ranga, CP, XP, quest dzienny, HP, gold.
- Trening: dzisiejszy cel, plan, historia, katalog cwiczen i modal kary.
- Gra: hub mini-gier, sklepy, gotowosc, pauza, wynik, loot, HP, poziomy mini-gier.
- System: Health Connect, audio, wyglad, tracking, sklep, dev po kodzie.
- Motywy, tla, efekty i muzyka maja zachowac dotychczasowe znaczenie.

## Architektura docelowa

- Android 14+ only (`minSdkVersion 34`).
- Natywny shell aplikacji odpowiada za UI, routing, stan, ustawienia i integracje Androida.
- Osobny silnik gier Android odpowiada za aktywna rozgrywke, fizyke gestow, hitboxy, particles i render GPU.
- Mini-gry nie moga byc DOM/React runtime w V2.
- Wersja web/desktop zostaje tylko jako wzorzec i podglad kontraktu, nie jako runtime docelowy.

## Fazy testow

1. Faza pierwsza: `@test-android-apps` na lokalnym buildzie V2, install jako osobna aplikacja i smoke test startu.
2. Faza druga: test na telefonie z bazowa aplikacja i V2 zainstalowanymi obok siebie, porownanie ekran po ekranie.
3. Faza trzecia: 60 sekund aktywnej `Ekstrakcji Cienia`, logcat, screenshoty, `dumpsys gfxinfo`, FPS overlay.

## Status implementacji

- V2 ma podlaczone libGDX jako osobny silnik gry w APK.
- `Ekstrakcja Cienia` ma natywna aktywnosc `NativeGameActivity`, bridge `HunterNativeGamePlugin` i fallback do webowego runtime.
- Natywna scena ma stan `ready/running/pause/result`, przycisk `X` przed startem, `STOP` tylko w rundzie, hitboxy ciecia, zloto, bomby, rzadkie serce HP i rzadki bonus czasu.
- Wynik rundy natywnej jest zapisywany jako `MiniGameResult` w bridge i konsumowany po powrocie do Reacta, z aktualizacja XP, golda, HP, rekordu, levelu mini-gry i lootem.
- Natywna `Ekstrakcja Cienia` uzywa selektywnie kopiowanych assetow z bazowej aplikacji: tlo areny, wraith, decoy i relikt serca. Assety trafiaja do APK przez task `copyNativeGameAssets`, bez kopiowania calego katalogu.
- Natywna scena uzywa fontu Orbitron z lokalnego assetu `src/assets/fonts/orbitron/Orbitron-wght.ttf`, kopiowanego do `native-game/`, z licencja OFL w repozytorium.
- Bridge uruchomienia natywnej gry przekazuje aktualny stan rundy: rekord, level mini-gry, gold, HP, bazowe HP, level gracza, XP, overlay FPS i profil jakosci. Nie wolno polegac wylacznie na starych wartosciach z `SharedPreferences`.
- Rozliczenie wyniku natywnego jest wydzielone do testowalnego helpera `applyNativeMiniGameSettlement`, z testem loot/progress/HP.
- Wynik natywnej rundy niesie tez dane diagnostyczne `fpsLast`, `fpsAverage`, `fpsMin`, `frameMs` i `graphicsQuality`, zeby kolejne decyzje wydajnosciowe mogly bazowac na realnych rundach.
- Android manifest deklaruje aplikacje jako gre oraz `android.game_mode_config` z trybem performance/battery. `HunterPerformancePlugin` ustawia Game State API dla `loading/gameplay/paused`, wymusza preferowany refresh rate i raportuje Game Mode/thermal/Hz.
- Overlay FPS dziala w WebView i w natywnej scenie libGDX. Do `NativeGameActivity` przekazywane sa `fpsOverlayEnabled` oraz `graphicsQuality`, a scena pokazuje FPS/AVG/LOW/frame time bez blokowania sterowania.
- Profil jakosci `performance/balanced/cinematic` wplywa na koszt natywnej sceny: liczbe celow, dlugosc traila, bursty, promienie efektow i MSAA.
- Natywna scena recyklinguje obiekty celow, traili i burstow oraz wstepnie rozgrzewa pule przy starcie sceny, zeby ograniczyc dropy FPS od GC podczas pierwszych ciec i trafien.
- Debugowa siatka z natywnego tla `Ekstrakcji Cienia` jest usunieta; scena korzysta z tla/efektow, nie z widocznego gridu testowego.
- `npm run lint`, `npm test -- --run`, `npm run build` i `npm run android:build` przechodza po podlaczeniu libGDX i assetow.
- Instalacja V2 na Xiaomi jest aktualnie blokowana przez system telefonu: `INSTALL_FAILED_USER_RESTRICTED: Install canceled by user`. Potwierdzone przez `adb install` oraz `pm install` po pushu APK do `/data/local/tmp`, a ponownie po checkpointach natywnej diagnostyki. APK buduje sie poprawnie jako `android/app/build/outputs/apk/debug/app-debug.apk`.
- Aktualny lokalny checkpoint V2 po optymalizacjach natywnej sceny: `checkpoint-v2-native-pooling-20260601-150010`, z bundlem w `C:\Users\Damia\Downloads\solo-leveler-backups\solo-leveler-checkpoint-v2-native-pooling-20260601-150010.git.bundle`.

## Warunki akceptacji

- Bazowa aplikacja nie jest nadpisywana przez V2.
- Kazdy ekran V2 miesci krytyczne akcje na telefonie.
- Mini-gry nie wymagaja scrollowania w runtime.
- `Ekstrakcja Cienia` nie zamyka aplikacji i nie pracuje w tle po wyjsciu.
- Wyglad V2 jest zgodny z bazowym stylem Solo/System, bez dziecinnych natywnych kontrolek.
- Scroll moze istniec tam, gdzie jest naturalny katalog/lista, ale bez widocznego paska.
