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

## Warunki akceptacji

- Bazowa aplikacja nie jest nadpisywana przez V2.
- Kazdy ekran V2 miesci krytyczne akcje na telefonie.
- Mini-gry nie wymagaja scrollowania w runtime.
- `Ekstrakcja Cienia` nie zamyka aplikacji i nie pracuje w tle po wyjsciu.
- Wyglad V2 jest zgodny z bazowym stylem Solo/System, bez dziecinnych natywnych kontrolek.
- Scroll moze istniec tam, gdzie jest naturalny katalog/lista, ale bez widocznego paska.
