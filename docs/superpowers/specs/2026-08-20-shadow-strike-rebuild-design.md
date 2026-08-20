# Cięcie Cienia — projekt pełnej przebudowy

## Cel

Przebudować mini-grę „Cięcie Cienia” od zera tak, aby zachowała prosty sens gry timingowej, reagowała dokładnie raz na każde dotknięcie i działała bez zauważalnych microstutterów zarówno przy 60 Hz, jak i przy rzeczywistych 120 Hz na Androidzie.

## Potwierdzone problemy

1. Obecna plansza obsługuje `pointerdown` na całym polu i `click` na przycisku. Jedno fizyczne dotknięcie przycisku uruchamia więc dwa cięcia. W próbie na LDPlayerze osiem dotknięć zakończyło rundę przed czasem.
2. Biały wskaźnik i strefa trafienia poruszają się jednocześnie. Wraz ze wzrostem poziomu oba ruchy przyspieszają, a okno trafienia się zwęża, przez co mechanika staje się trudna do odczytania.
3. Gorąca ścieżka wejścia uruchamia kilka aktualizacji Reacta, dźwięk, feedback DOM i wibrację. Pomiary Event Timing pokazały zdarzenia `click` trwające 64–88 ms.
4. Bezczynny WebView jest stabilny przy rzeczywistych 120 Hz (mediana 8,3 ms, p95 8,4 ms), natomiast aktywna mini-gra spadała do 100,3 FPS, p95 16,7 ms, p99 41,6 ms i najgorszej przerwy 116,7 ms. `gfxinfo` dodatkowo pokazuje GPU p99 tylko 1 ms. Główny problem leży więc w nieregularnej pracy CPU/UI/React podczas wejścia i efektów, nie w limicie GPU.
5. LDPlayer, Android, okno aplikacji i WebView udostępniają obecnie rzeczywiste 120 Hz. Konfiguracja ma `basicSettings.fps: 120` i `basicSettings.heightFrameRate: true`, aktywny render Androida wynosi 120 Hz, a bezpośredni pomiar WebView dał 120,22 FPS. Nie ma podstaw do zmiany konfiguracji emulatora ani do dokładania kolejnego mechanizmu wymuszania trybu.

## Zakres

### W zakresie

- nowy deterministyczny silnik zasad „Cięcia Cienia”;
- nowy lekki renderer Canvas;
- pojedyncza ścieżka obsługi dotyku;
- czytelna, nieruchoma strefa celu i jeden poruszający się wskaźnik;
- poprawne pauzowanie, wznawianie, zmianę rozmiaru i zakończenie rundy;
- przeniesienie dźwięku i haptics poza krytyczną ścieżkę wejścia;
- testy jednostkowe symulacji i regresji podwójnego wejścia;
- pomiar pełnej rundy przy aktywnych 120 Hz przez ADB i Chrome DevTools Protocol;
- weryfikacja całego łańcucha LDPlayer → Android → okno aplikacji → WebView;
- poprawne prezentowanie przez nakładkę częstotliwości aktywnej, a nie tylko najlepszego obsługiwanego trybu.

### Poza zakresem

- zmiany pozostałych mini-gier;
- migracja do Phaser albo innego silnika;
- przebudowa wspólnego ekranu wyników i sklepu;
- publikacja GitHub Release;
- zmiana zapisu postępu gracza lub ekonomii nagród poza wartościami tej mini-gry.

## Rozważone podejścia

### 1. Dedykowany silnik + warstwowy Canvas — wybrane

Symulacja działa na mutowalnym obiekcie runtime, próbkowanym monotonicznym zegarem `performance.now()`. Pozycja wskaźnika jest analityczną falą trójkątną zależną od aktywnego czasu rundy, więc nie zależy od liczby dostarczonych klatek. Statyczna plansza i dynamiczny wskaźnik/HUD są rozdzielone na dwie warstwy Canvas. React montuje grę i zapisuje wynik, ale nie uczestniczy w klatkach ani trafieniach aktywnej rundy.

Zalety: najmniejszy koszt klatki, przewidywalna obsługa wejścia, łatwe testy czystych zasad, brak layoutu w pętli. Wadą jest niewielka ilość dedykowanego kodu renderera.

### 2. Uproszczony DOM/CSS

Strefa i wskaźnik mogłyby być elementami DOM aktualizowanymi przez `transform`. Rozwiązanie byłoby krótsze, ale nadal zależałoby od kompozytora, layoutu wspólnego ekranu i efektów CSS. Po kilku wcześniejszych iteracjach DOM nie daje wystarczającej pewności braku microstutterów.

### 3. Phaser

Phaser zapewniłby pełną pętlę gry i input, lecz zwiększyłby koszt startu oraz złożoność integracji dla jednej bardzo prostej mini-gry. To rozwiązanie narusza YAGNI.

## Nowa pętla rozgrywki

1. Złota strefa „perfect” i otaczająca ją turkusowa strefa trafienia pozostają nieruchome na środku toru.
2. Jeden biały wskaźnik porusza się płynnie od lewej do prawej i z powrotem. Nie teleportuje się przy krawędzi.
3. Gracz dotyka dowolnego miejsca pola gry. Jedno fizyczne dotknięcie może dać najwyżej jeden wynik.
4. Trafienie jest oceniane jako `perfect`, `great`, `good` albo `miss` wyłącznie na podstawie odległości wskaźnika od środka.
5. Udane trafienie dodaje punkty i niewielki bonus czasu. Pudło zeruje combo i odejmuje najwyżej 1 sekundę po uwzględnieniu odporności reliktu.
6. Input ma 100 ms blokady anty-dublującej. Zdarzenia syntetyczne powstałe z tego samego kontaktu są ignorowane.
7. Prędkość rośnie łagodnie i ma twardy limit. Na żadnym poziomie strefa trafienia nie jest węższa niż 16% toru, a jednokierunkowy przejazd wskaźnika nie jest krótszy niż 850 ms.
8. Runda trwa bazowo 30 sekund, a istniejący limit maksymalnego pozostałego czasu 42 sekundy pozostaje zachowany.

Punktacja zachowuje dotychczasową ekonomię: `perfect` daje bazę `75 + min(90, combo×8)`, `great` daje `52 + min(65, combo×6)`, a `good` daje `34 + min(50, combo×5)`; wynik jest mnożony przez bonus punktów i zaokrąglany. Bonusy czasu wynoszą odpowiednio `1400 + combo×70`, `850` i `550` ms, zawsze z limitem 42 000 ms pozostałego czasu. `miss` zeruje combo i odejmuje `1000 × (1 - odporność)` ms. Łączne bonusy runtime są ograniczone do istniejących limitów: 12% szerokości, 15% wyniku i 18% odporności.

## Architektura

### `src/game/shadowStrikeEngine.ts`

Odpowiada wyłącznie za zasady i zegar gry. Eksportuje:

- `ShadowStrikeConfig` — wszystkie stałe balansu po wyliczeniu poziomu i bonusów;
- `ShadowStrikeRuntime` — mutowalny stan jednej rundy;
- `ShadowStrikeOutcome` — wynik pojedynczego zaakceptowanego dotknięcia;
- `createShadowStrikeConfig(level, hitWindowBonus, scoreBonus, penaltyResist)`;
- `createShadowStrikeRuntime(startedAtMs, config)`;
- `advanceShadowStrike(runtime, nowMs)` — aktualizacja czasu i analityczne próbkowanie pozycji bez alokacji obiektów;
- `tryShadowStrike(runtime, nowMs)` — dokładnie jedno rozstrzygnięcie albo `null`, gdy działa blokada wejścia;
- `pauseShadowStrike(runtime, nowMs)` i `resumeShadowStrike(runtime, nowMs)`;
- `getShadowStrikeSnapshot(runtime)` — migawka przeznaczona dla rzadkiej synchronizacji HUD.

Silnik używa tylko `performance.now()` przekazanego z zewnątrz. Nie używa `Date.now()`, DOM, Reacta, dźwięku ani losowości.

### `src/gameRuntime/shadowStrikeRenderer.ts`

Odpowiada za rozmiar i rysowanie. Eksportuje fabrykę `createShadowStrikeRenderer(staticCanvas, dynamicCanvas)`, która zwraca metody:

- `resize(cssWidth, cssHeight, devicePixelRatio)`;
- `drawStatic(config)`;
- `render(runtime, nowMs)`;
- `flash(outcome, nowMs)`;
- `destroy()`.

Warstwa statyczna jest odświeżana tylko po zmianie rozmiaru lub konfiguracji. Warstwa dynamiczna czyści wyłącznie siebie i rysuje wskaźnik, prosty HUD oraz krótką informację o trafieniu. Teksty HUD są cache'owane i przeliczane tylko po zmianie wartości. Renderer nie używa `shadowBlur`, filtrów CSS, gradientów tworzonych w każdej klatce ani nowych tablic/obiektów w `render()`.

### `src/components/BonusMiniGames.tsx`

Dotychczasowy `ShadowStrikeGame` zostanie zastąpiony cienką integracją:

- tworzy runtime i renderer na start rundy;
- ma jeden `onPointerDown` na polu gry i nie ma drugiego `onClick` do cięcia;
- w `requestAnimationFrame` wywołuje tylko `advanceShadowStrike()` oraz `renderer.render()`;
- nie aktualizuje stanu React podczas aktywnej rundy; HUD należy do Canvas;
- emituje `onComplete` raz po zakończeniu;
- obsługuje pauzę i unmount bez pozostawionego RAF lub timera.

Wskaźnik przycisku zostanie zastąpiony nieinteraktywną podpowiedzią „DOTKNIJ GDZIEKOLWIEK”, aby nie tworzyć drugiej ścieżki wejścia.

Animowany efekt kosmetyczny wspólnej planszy zostanie zastąpiony podczas aktywnej rundy statycznym tłem, aby animacje `motion` nie konkurowały z pętlą wskaźnika.

### `src/utils/audio.ts`

Powstanie `prepareMiniGameAudio()`, wywoływane podczas naciśnięcia Start. Utworzenie lub wznowienie `AudioContext` nastąpi przed rozpoczęciem mierzonej rundy. Dźwięk i krótka wibracja po wyniku zostaną zaplanowane po zmianie stanu, poza synchronicznym handlerem pointera. Brak audio lub haptics nie może blokować wyniku.

### `src/game/miniGameCatalog.ts`

Opis i wskazówki zostaną uproszczone: nieruchomy cel, jeden wskaźnik, jedno dotknięcie. Tekst nie będzie sugerował ruchomej strefy ani osobnego przycisku.

## Przepływ danych

```text
pointerdown -> tryShadowStrike(runtime) -> renderer.flash(outcome)
                                      -> kolejka audio/haptics
                                      -> kolejna migawka HUD

requestAnimationFrame -> advanceShadowStrike(runtime) -> renderer.render(runtime)

Canvas HUD -> odczyt prymitywów runtime bez React state

koniec czasu -> pojedynczy onComplete(finalScore) -> istniejący raport/nagrody
```

## Pauza, błędy i sprzątanie

- Pauza zapisuje monotoniczny moment i zatrzymuje RAF.
- Wznowienie przesuwa linię czasu o dokładny czas pauzy, bez skoku wskaźnika ani utraty czasu rundy.
- Zmiana rozmiaru jest obsługiwana przez jeden `ResizeObserver`; DPR jest ograniczone do 2.
- Brak kontekstu Canvas kończy start czytelnym stanem awaryjnym zamiast uruchamiać pustą rundę.
- Każdy RAF, `ResizeObserver` i odroczony efekt audio/haptics jest anulowany przy unmount.
- `onComplete` jest chronione flagą jednokrotnego zatwierdzenia.

## 120 Hz na LDPlayerze

Stan wejściowy został potwierdzony bez modyfikacji środowiska:

- LDPlayer 14.0.22 ma High FPS 120 i udostępnia Androidowi tryb 2560×1440 @ 120 Hz;
- SurfaceFlinger działa z okresem 8 333 333 ns;
- okno aplikacji ma `preferredRefreshRate=120` i override UID 120 Hz;
- WebView wykonuje `requestAnimationFrame` ze średnią 8,318 ms i p99 8,5 ms;
- nakładka pokazuje obecnie `120/120Hz`, `FPS 120`, `AVG 120`.

Konfiguracja LDPlayera nie będzie zmieniana ani emulator restartowany, dopóki pomiar po instalacji nowego APK nie wykaże regresji. Kod zachowuje działające `WindowManager.LayoutParams.preferredRefreshRate`. Nakładka i usługa wydajności mają preferować `currentRefreshRate` jako wartość aktywną; `refreshRate` pozostaje wyłącznie fallbackiem, gdy warstwa natywna nie potrafi odczytać bieżącego trybu.

Test przechodzi dopiero wtedy, gdy po instalacji nowego APK wszystkie cztery warstwy nadal potwierdzają 118–122 Hz. Jeżeli Android i okno mają 120 Hz, ale WebView nie osiąga co najmniej 115 FPS w bezczynnej próbce, dopiero wtedy wolno otworzyć osobną poprawkę natywną popartą pomiarem.

## Testy i kryteria akceptacji

### Testy automatyczne

- pozycja wskaźnika jest ciągła i odbija się bez teleportacji;
- ta sama sekwencja czasów daje identyczne pozycje przy harmonogramie 60 i 120 Hz;
- strefa celu pozostaje nieruchoma;
- poziom i wynik nie przekraczają limitów prędkości i szerokości;
- dokładnie jedno wejście w ciągu 100 ms jest zaakceptowane;
- klasyfikacja `perfect/great/good/miss` odpowiada granicom stref;
- bonus czasu nigdy nie przekracza 42 sekund;
- kara za pudło nie przekracza 1 sekundy przed odpornością;
- pauza nie przesuwa wskaźnika i nie zużywa czasu;
- koniec rundy i wynik są emitowane tylko raz;
- podczas aktywnej rundy nie występują commity React powodowane ruchem lub trafieniami;
- dotychczasowe testy pozostałych mini-gier nadal przechodzą.

### Test runtime na LDPlayerze

Po rozgrzaniu audio i wejściu do gry wykonywana jest 30-sekundowa sesja z dotknięciami przez ADB oraz pomiarem CDP.

Przy 120 Hz:

- średnio co najmniej 115 FPS;
- mediana delty RAF: 7,8–9,0 ms;
- p95 delty RAF: maksymalnie 10,5 ms;
- p99 delty RAF: maksymalnie 16,7 ms;
- klatki powyżej 25 ms: maksymalnie 0,1% podczas samej rundy;
- jedno fizyczne dotknięcie zwiększa licznik zaakceptowanych wejść najwyżej o 1.

Przy 60 Hz, jako tryb awaryjny:

- mediana delty RAF: 15,5–17,8 ms;
- p95 delty RAF: maksymalnie 19 ms;
- p99 delty RAF: maksymalnie 24 ms;
- brak klatek powyżej 33 ms podczas samej rundy.

Końcowy APK musi przejść `npm test`, `npm run lint`, `npm run build`, `npx cap sync android` i `gradlew.bat assembleDebug`, zachować zgodny podpis oraz uruchomić się przez `adb install -r` bez utraty danych gracza.

## Warunek wydania

Ta praca kończy się lokalnym, przetestowanym APK na LDPlayerze. Publikacja GitHub i podbicie wersji pozostają osobnym krokiem wykonywanym dopiero po ręcznym sprawdzeniu przez użytkownika.
