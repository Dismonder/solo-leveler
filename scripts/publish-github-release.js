import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const targetVersion = process.argv[2] ? process.argv[2].replace(/^v/, "") : null;
const changelogText = process.argv[3] || "Nowe uaktualnienie systemu łowcy, nowe funkcje i optymalizacje.";

if (!targetVersion) {
  console.log(`
Użycie:
  npm run release <wersja> [opis-zmian]

Przykład:
  npm run release 1.1.0 "Nowe soundtracki i ulepszone powiadomienia"
`);
  process.exit(1);
}

console.log(`🚀 Przygotowuję wydanie wersji v${targetVersion}...`);

// 1. Update package.json
const pkgPath = path.join(rootDir, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
pkg.version = targetVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`✅ Zaktualizowano package.json -> ${targetVersion}`);

// 2. Update update-manifest.json
const manifestPath = path.join(rootDir, "server", "update-manifest.json");
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  manifest.version = targetVersion;
  manifest.versionCode = (manifest.versionCode || 1) + 1;
  manifest.releaseDate = new Date().toISOString().slice(0, 10);
  manifest.changelog = [changelogText];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`✅ Zaktualizowano server/update-manifest.json -> v${targetVersion} (code: ${manifest.versionCode})`);
}

// 3. Update android/app/build.gradle
const gradlePath = path.join(rootDir, "android", "app", "build.gradle");
if (fs.existsSync(gradlePath)) {
  let gradle = fs.readFileSync(gradlePath, "utf-8");
  gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${targetVersion}"`);
  gradle = gradle.replace(/versionCode\s+(\d+)/, (match, code) => `versionCode ${parseInt(code, 10) + 1}`);
  fs.writeFileSync(gradlePath, gradle);
  console.log(`✅ Zaktualizowano android/app/build.gradle -> versionName "${targetVersion}"`);
}

// 4. Update src/services/updateService.ts
const updateServicePath = path.join(rootDir, "src", "services", "updateService.ts");
if (fs.existsSync(updateServicePath)) {
  let updateCode = fs.readFileSync(updateServicePath, "utf-8");
  updateCode = updateCode.replace(/CURRENT_APP_VERSION = "[^"]+"/, `CURRENT_APP_VERSION = "${targetVersion}"`);
  updateCode = updateCode.replace(/CURRENT_APP_BUILD = (\d+)/, (match, code) => `CURRENT_APP_BUILD = ${parseInt(code, 10) + 1}`);
  fs.writeFileSync(updateServicePath, updateCode);
  console.log(`✅ Zaktualizowano src/services/updateService.ts -> CURRENT_APP_VERSION "${targetVersion}"`);
}


console.log(`
🎉 Gotowe! Aby opublikować wersję na GitHub (z automatyczną kompilacją APK w GitHub Actions):

  git add .
  git commit -m "release: v${targetVersion}"
  git tag v${targetVersion}
  git push origin main --tags

GitHub Actions automatycznie zbuduje APK i stworzy Release, a aplikacje użytkowników same pobiorą aktualizację!
`);
