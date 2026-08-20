import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const tag = process.argv[2] || "v1.0.1";
const cleanTag = tag.replace(/^v/, "");
const releaseName = `Solo Leveler ${tag}`;
const releaseBody = `## Co nowego w wersji ${tag}
- ⚖️ **System Kar**: domyślnie wyłączono karne ćwiczenia z wymuszonego systemu kar (pełna kontrola w opcjach Systemu)
- 🔔 **Spersonalizowane Powiadomienia**:
  - 💧 Przypomnienia o Eliksirze Many (nawodnieniu)
  - 🎮 Wyzwania bramy lochów z losowymi mini-grami
  - ⚔️ Propozycje ćwiczeń kalistenicznych bez sprzętu z bazy techniki
- 🎯 **Precyzyjny Deep Linking**: kliknięcie powiadomienia natychmiast przenosi i podświetla dane ćwiczenie, uruchamia mini-grę lub otwiera Eliksir Many
- 🎵 **System Soundtracków**: automatyczna muzyka w tle, bitwy i treningu
- 🚀 **Aktualizacje OTA**: natywna obsługa pobierania i instalacji aktualizacji
`;


// 1. Get GitHub Token from Git Credential Manager
function getGitHubToken() {
  const result = spawnSync("git", ["credential", "fill"], {
    input: "protocol=https\nhost=github.com\n\n",
    encoding: "utf-8",
  });

  if (result.status !== 0 || !result.stdout) {
    throw new Error("Nie udało się pobrać poświadczeń z Git Credential Manager");
  }

  const match = result.stdout.match(/password=(.+)/);
  if (!match || !match[1]) {
    throw new Error("Brak hasła/tokenu w Git Credential Manager");
  }

  return match[1].trim();
}

async function main() {
  console.log(`🔐 Pobieram token GitHub...`);
  const token = getGitHubToken();

  const owner = "Dismonder";
  const repo = "solo-leveler";
  const headers = {
    Accept: "application/vnd.github.v3+json",
    Authorization: `token ${token}`,
    "User-Agent": "Solo-Leveler-Publisher",
  };

  console.log(`📦 Tworzę / sprawdzam Release ${tag} na GitHubie (${owner}/${repo})...`);
  
  // Check if release already exists
  let releaseId = null;
  let uploadUrlTemplate = null;

  const listRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, { headers });
  if (listRes.ok) {
    const releases = await listRes.json();
    const existing = releases.find((r) => r.tag_name === tag);
    if (existing) {
      console.log(`ℹ️ Release ${tag} już istnieje (ID: ${existing.id}).`);
      releaseId = existing.id;
      uploadUrlTemplate = existing.upload_url;
    }
  }

  if (!releaseId) {
    const createRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tag_name: tag,
        name: releaseName,
        body: releaseBody,
        draft: false,
        prerelease: false,
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Błąd tworzenia Release: HTTP ${createRes.status} - ${errText}`);
    }

    const createdRelease = await createRes.json();
    releaseId = createdRelease.id;
    uploadUrlTemplate = createdRelease.upload_url;
    console.log(`✅ Utworzono GitHub Release ${tag} (ID: ${releaseId})!`);
  }

  // Check and clean existing assets if needed
  const assetsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/${releaseId}/assets`, { headers });
  if (assetsRes.ok) {
    const existingAssets = await assetsRes.json();
    for (const asset of existingAssets) {
      if (asset.name === "solo-leveler.apk" || asset.name === `solo-leveler-${tag}.apk`) {
        console.log(`🗑️ Usuwam stary asset ${asset.name} (ID: ${asset.id})...`);
        await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/assets/${asset.id}`, {
          method: "DELETE",
          headers,
        });
      }
    }
  }

  // Upload APK asset
  const apkPath = path.join(rootDir, "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk");
  if (!fs.existsSync(apkPath)) {
    throw new Error(`Nie znaleziono pliku APK w ${apkPath}`);
  }

  const apkStats = fs.statSync(apkPath);
  const apkBuffer = fs.readFileSync(apkPath);
  console.log(`📤 Przesyłam plik APK (${(apkStats.size / (1024 * 1024)).toFixed(2)} MB)...`);

  const assetNames = [`solo-leveler.apk`, `solo-leveler-${tag}.apk`];

  for (const assetName of assetNames) {
    const rawUploadUrl = uploadUrlTemplate.replace(/\{(\?.*)?\}$/, "");
    const uploadUrl = `${rawUploadUrl}?name=${encodeURIComponent(assetName)}`;

    console.log(`  -> Wysyłam ${assetName}...`);
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Length": String(apkStats.size),
      },
      body: apkBuffer,
    });

    if (uploadRes.ok) {
      const assetData = await uploadRes.json();
      console.log(`  ✅ Wgrano ${assetName}: ${assetData.browser_download_url}`);
    } else {
      const errText = await uploadRes.text();
      console.warn(`  ⚠️ Błąd przy ${assetName}: HTTP ${uploadRes.status} - ${errText}`);
    }
  }


  console.log(`
🎉 SUKCES! Wydanie ${tag} jest oficjalnie opublikowane na GitHubie!
Link do pobrania: https://github.com/${owner}/${repo}/releases/download/${tag}/solo-leveler.apk
`);
}

main().catch((err) => {
  console.error("❌ Błąd:", err.message);
  process.exit(1);
});
