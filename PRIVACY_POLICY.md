# Polityka Prywatności aplikacji Solo Leveler

Ostatnia aktualizacja: 21 sierpnia 2026 r.

Aplikacja **Solo Leveler** została stworzona z myślą o pełnej prywatności użytkowników w modelu **Offline-First**. Niniejsza polityka wyjaśnia, jak aplikacja przetwarza dane.

---

## 1. Zbieranie i przetwarzanie danych

* **Przechowywanie lokalne**: Wszelkie dane dotyczące postępów treningowych, statystyk postaci, poziomu, historii ćwiczeń, celów biegowych oraz odblokowanych przedmiotów są zapisywane **wyłącznie w pamięci lokalnej Twojego urządzenia** (LocalStorage / IndexedDB / SQLite).
* **Brak serwerów zewnętrznych i analityki**: Aplikacja nie przesyła Twoich danych osobowych ani telemetrycznych na żadne zewnętrzne serwery. Nie stosujemy skryptów śledzących, analityki zewnętrznej ani sieci reklamowych.
* **Brak konieczności rejestracji**: Aplikacja nie wymaga zakładania konta, podawania adresu e-mail, imienia ani hasła.

---

## 2. Wykorzystanie uprawnień systemowych

Aplikacja może prosić o dostęp do następujących funkcji urządzenia w celu realizacji swoich funkcjonalności:

1. **Czujniki ruchu (Akcelerometr / Żyroskop)**:
   * Wykorzystywane w czasie rzeczywistym do automatycznego zliczania powtórzeń ćwiczeń (np. pompki, przysiady, brzuszki) oraz wykrywania dynamiki ruchu. Dane z czujników są przetwarzane na bieżąco w pamięci urządzenia i nie są nigdzie wysyłane.
2. **Google Health Connect (Opcjonalnie)**:
   * Służy wyłącznie do lokalnego odczytu liczby kroków, przebytego dystansu oraz tętna, aby przeliczać aktywność na punkty doświadczenia (EXP) i statystyki Łowcy w grze.
3. **Powiadomienia i budzik (`POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`)**:
   * Służą do wyświetlania lokalnych powiadomień z przypomnieniem o codziennym treningu, regeneracji many lub karze systemowej.
4. **Bluetooth (BLE - Opcjonalnie)**:
   * Używany wyłącznie do bezpośredniego, lokalnego połączenia z opaską sportową (np. Mi Band) w celu pomiaru tętna podczas treningu.
5. **Działanie w tle / Odtwarzanie dźwięku**:
   * Używane do utrzymania odtwarzacza muzyki treningowej i timera ćwiczeń przy wygaszonym ekranie.

---

## 3. Bezpieczeństwo danych

Ponieważ wszystkie dane są zapisane na Twoim telefonie, pełną kontrolę nad nimi sprawujesz Ty. Usunięcie aplikacji lub wyczyszczenie pamięci podręcznej powoduje trwałe usunięcie zapisanych danych.

---

## 4. Kontakt

W przypadku pytań dotyczących niniejszej polityki prywatności lub działania aplikacji, prosimy o kontakt poprzez repozytorium GitHub:
👉 https://github.com/Dismonder/solo-leveler
