# 🚀 Darmowy Hosting Aktualizacji (0 zł / 100% Free Forever)

### Opcja 1: GitHub Releases & GitHub Raw (Najprostsza i w 100% darmowa)
1. Wrzuć plik `update-manifest.json` do swojego repozytorium na GitHubie (np. do folderu `server/update-manifest.json`).
2. Podaj link bezpośredni (Raw):
   `https://raw.githubusercontent.com/TWOJA_NAZWA/solo-leveler/main/server/update-manifest.json`
3. W `downloadUrl` wklej link do pliku APK z sekcji **GitHub Releases** (np. `https://github.com/TWOJA_NAZWA/solo-leveler/releases/download/v1.0.1/app-release.apk`).
4. GitHub nie pobiera żadnych opłat, nie ma limitów transferu i zapewnia szybkie pobieranie APK na całym świecie.

---

### Opcja 2: Vercel / Cloudflare Pages (Darmowy tier)
1. Wejdź do folderu `server` i wpisz:
   ```bash
   npx vercel
   ```
2. Otrzymasz darmowy adres URL (np. `https://solo-leveler-update.vercel.app/version.json`).
3. Wklej ten adres w `src/services/updateService.ts` jako `DEFAULT_UPDATE_MANIFEST_URL`.

---

### Opcja 3: Lokalny serwer deweloperski
1. Uruchom serwer lokalnie:
   ```bash
   node server/free-update-server.js
   ```
2. Serwer będzie dostępny pod adresem: `http://localhost:4000/version.json`.
