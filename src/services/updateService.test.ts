import assert from "node:assert/strict";
import test from "node:test";
import {
  checkForUpdate,
  compareVersions,
  extractGitHubRepo,
  parseGitHubChangelog,
  CURRENT_APP_VERSION,
} from "./updateService";

test("compareVersions accurately compares semantic version strings", () => {
  assert.equal(compareVersions("1.0.1", "1.0.0"), 1);
  assert.equal(compareVersions("1.1.0", "1.0.9"), 1);
  assert.equal(compareVersions("2.0.0", "1.9.9"), 1);
  assert.equal(compareVersions("1.0.0", "1.0.0"), 0);
  assert.equal(compareVersions("v1.0.0", "1.0.0"), 0);
  assert.equal(compareVersions("1.0.0", "1.0.1"), -1);
  assert.equal(compareVersions("0.9.9", "1.0.0"), -1);
});

test("extractGitHubRepo extracts owner and repo from various formats", () => {
  assert.deepEqual(extractGitHubRepo("Dismonder/solo-leveler"), {
    owner: "Dismonder",
    repo: "solo-leveler",
  });
  assert.deepEqual(
    extractGitHubRepo("https://github.com/Dismonder/solo-leveler"),
    { owner: "Dismonder", repo: "solo-leveler" }
  );
  assert.deepEqual(
    extractGitHubRepo("https://github.com/Dismonder/solo-leveler.git"),
    { owner: "Dismonder", repo: "solo-leveler" }
  );
  assert.deepEqual(
    extractGitHubRepo("https://api.github.com/repos/Dismonder/solo-leveler/releases/latest"),
    { owner: "Dismonder", repo: "solo-leveler" }
  );
});

test("parseGitHubChangelog extracts bullet points and strips markdown", () => {
  const body = `
# Release v1.1.0
- **Nowe utwory** i muzyka w tle
* Poprawiono [powiadomienia](https://example.com)
1. Dodano system aktualizacji OTA
- Usunięto błędy
`;
  const result = parseGitHubChangelog(body);
  assert.equal(result.length, 4);
  assert.equal(result[0], "Nowe utwory i muzyka w tle");
  assert.equal(result[1], "Poprawiono powiadomienia");
  assert.equal(result[2], "Dodano system aktualizacji OTA");
  assert.equal(result[3], "Usunięto błędy");
});

test("checkForUpdate detects new version from GitHub Releases API response", async () => {
  const fakeGitHubRelease = {
    tag_name: "v1.2.0",
    name: "Solo Leveler v1.2.0",
    body: "- Nowe soundtracki\n- Większe ikony paska powiadomień",
    published_at: "2026-08-20T12:00:00Z",
    html_url: "https://github.com/Dismonder/solo-leveler/releases/tag/v1.2.0",
    assets: [
      {
        name: "solo-leveler-v1.2.0.apk",
        browser_download_url:
          "https://github.com/Dismonder/solo-leveler/releases/download/v1.2.0/solo-leveler-v1.2.0.apk",
        size: 15420000,
      },
    ],
  };

  const mockFetch = async (url: string | URL | Request) => {
    const urlStr = String(url);
    if (urlStr.includes("api.github.com")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => fakeGitHubRelease,
      };
    }
    return {
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => ({}),
    };
  };

  const result = await checkForUpdate("Dismonder/solo-leveler", mockFetch);

  assert.equal(result.hasUpdate, true);
  assert.equal(result.currentVersion, CURRENT_APP_VERSION);
  assert.equal(result.latestVersion, "1.2.0");
  assert.equal(
    result.downloadUrl,
    "https://github.com/Dismonder/solo-leveler/releases/download/v1.2.0/solo-leveler-v1.2.0.apk"
  );
  assert.equal(result.changelog.length, 2);
  assert.equal(result.changelog[0], "Nowe soundtracki");
});

test("checkForUpdate handles fallback to raw manifest if GitHub API is 404", async () => {
  const fakeManifest = {
    version: "1.1.5",
    versionCode: 3,
    releaseDate: "2026-08-20",
    changelog: ["Fallback z pliku manifestu"],
    downloadUrl: "https://github.com/Dismonder/solo-leveler/releases/download/v1.1.5/app.apk",
  };

  const mockFetch = async (url: string | URL | Request) => {
    const urlStr = String(url);
    if (urlStr.includes("api.github.com")) {
      return {
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({}),
      };
    }
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => fakeManifest,
    };
  };

  const result = await checkForUpdate("Dismonder/solo-leveler", mockFetch);

  assert.equal(result.hasUpdate, true);
  assert.equal(result.latestVersion, "1.1.5");
  assert.equal(result.changelog[0], "Fallback z pliku manifestu");
});



