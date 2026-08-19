import { Capacitor, CapacitorHttp } from "@capacitor/core";

export const CURRENT_APP_VERSION = "1.0.0";
export const CURRENT_APP_BUILD = 1;

export const DEFAULT_GITHUB_REPO = "Dismonder/solo-leveler";
export const STORAGE_KEY_UPDATE_SOURCE = "SOLO_LEVELER_UPDATE_SOURCE";

export const DEFAULT_UPDATE_MANIFEST_URL =
  "https://raw.githubusercontent.com/Dismonder/solo-leveler/main/server/update-manifest.json";


export type AppUpdateManifest = {
  version: string;
  versionCode: number;
  releaseDate: string;
  changelog: string[];
  downloadUrl: string;
  mandatory?: boolean;
  minSupportedVersion?: string;
};

export type AppUpdateInfo = {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  versionCode: number;
  releaseDate: string;
  changelog: string[];
  downloadUrl: string;
  mandatory: boolean;
  sourceUrl: string;
  error?: string;
};

export type GitHubReleaseAsset = {
  name: string;
  browser_download_url: string;
  size?: number;
  content_type?: string;
};

export type GitHubReleaseResponse = {
  tag_name: string;
  name?: string;
  body?: string;
  published_at?: string;
  html_url: string;
  assets?: GitHubReleaseAsset[];
};

export type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<{
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<unknown>;
}>;

export const defaultFetch: FetchLike = async (
  input: string | URL | Request,
  init?: RequestInit
) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const headers: Record<string, string> = {
    Accept: "application/json, application/vnd.github.v3+json",
  };

  if (Capacitor.isNativePlatform()) {
    try {
      const response = await CapacitorHttp.get({
        url,
        headers,
      });
      const ok = response.status >= 200 && response.status < 300;
      return {
        ok,
        status: response.status,
        statusText: ok ? "OK" : `HTTP ${response.status}`,
        json: async () => {
          if (typeof response.data === "string") {
            try {
              return JSON.parse(response.data);
            } catch {
              return response.data;
            }
          }
          return response.data;
        },
      };
    } catch {
      // Fallback to standard fetch
    }
  }

  const res = await fetch(url, {
    cache: "no-cache",
    headers,
  });

  return {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    json: () => res.json(),
  };
};


export function getSavedUpdateSource(): string {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_KEY_UPDATE_SOURCE);
      if (saved && saved.trim()) return saved.trim();
    }
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_GITHUB_REPO;
}

export function saveUpdateSource(source: string): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY_UPDATE_SOURCE, source.trim());
    }
  } catch {
    // localStorage unavailable
  }
}

export function compareVersions(v1: string, v2: string): number {
  const clean1 = v1.replace(/^[vV]/, "").split(".").map((n) => parseInt(n, 10) || 0);
  const clean2 = v2.replace(/^[vV]/, "").split(".").map((n) => parseInt(n, 10) || 0);
  const maxLen = Math.max(clean1.length, clean2.length);

  for (let i = 0; i < maxLen; i++) {
    const num1 = clean1[i] || 0;
    const num2 = clean2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

export function parseGitHubChangelog(body?: string): string[] {
  if (!body || !body.trim()) {
    return ["Uaktualnienie systemu łowcy i optymalizacje."];
  }

  const lines = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const cleanList: string[] = [];

  for (const line of lines) {
    if (line.startsWith("#") || line.startsWith("```")) continue;

    // Strip bullet markers (- , * , 1. , etc.)
    const stripped = line
      .replace(/^[-*•]\s+/, "")
      .replace(/^\d+\.\s+/, "")
      .replace(/\*\*(.*?)\*\*/g, "$1") // strip bold
      .replace(/\[(.*?)\]\(.*?\)/g, "$1") // strip links
      .trim();

    if (stripped && stripped.length > 2) {
      cleanList.push(stripped);
    }
  }

  return cleanList.length > 0
    ? cleanList
    : ["Nowa wersja systemu dostępna w repozytorium GitHub."];
}

export function extractGitHubRepo(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim();
  const githubUrlMatch = trimmed.match(
    /(?:github\.com\/|api\.github\.com\/repos\/)?([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\/|\.git|\/releases|$)/
  );

  if (githubUrlMatch && githubUrlMatch[1] && githubUrlMatch[2]) {
    return {
      owner: githubUrlMatch[1],
      repo: githubUrlMatch[2].replace(/\.git$/, ""),
    };
  }
  return null;
}

export async function checkForUpdate(
  customSource?: string,
  fetchFn: FetchLike = defaultFetch
): Promise<AppUpdateInfo> {

  const source = (customSource || getSavedUpdateSource()).trim();

  // 1. Check if source is a GitHub repository (e.g. Damian/solo-leveler)
  const ghRepo = extractGitHubRepo(source);

  if (ghRepo && !source.endsWith(".json")) {
    // Attempt official GitHub Releases API
    const releasesApiUrl = `https://api.github.com/repos/${ghRepo.owner}/${ghRepo.repo}/releases/latest`;
    try {
      const response = await fetchFn(releasesApiUrl, {
        cache: "no-cache",
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (response.ok) {
        const release = (await response.json()) as GitHubReleaseResponse;
        const releaseTag = (release.tag_name || "").replace(/^[vV]/, "");
        const hasUpdate = compareVersions(releaseTag, CURRENT_APP_VERSION) > 0;

        // Find APK file in release assets
        const apkAsset = release.assets?.find(
          (a) => a.name.toLowerCase().endsWith(".apk")
        );
        const downloadUrl = apkAsset?.browser_download_url || release.html_url;
        const changelog = parseGitHubChangelog(release.body);

        return {
          hasUpdate,
          currentVersion: CURRENT_APP_VERSION,
          latestVersion: releaseTag || CURRENT_APP_VERSION,
          versionCode: CURRENT_APP_BUILD + (hasUpdate ? 1 : 0),
          releaseDate: (release.published_at || new Date().toISOString()).slice(0, 10),
          changelog,
          downloadUrl,
          mandatory: false,
          sourceUrl: releasesApiUrl,
        };
      }
    } catch {
      // Fallback to raw manifest if GitHub API fails
    }

    // Fallback: Check raw manifest in the repository main branch
    const rawManifestUrl = `https://raw.githubusercontent.com/${ghRepo.owner}/${ghRepo.repo}/main/server/update-manifest.json`;
    return fetchManifestUpdate(rawManifestUrl, fetchFn, ghRepo);
  }

  // 2. Direct Manifest URL (e.g. JSON file on GitHub raw or custom server)
  const manifestUrl = source.startsWith("http") ? source : DEFAULT_UPDATE_MANIFEST_URL;
  return fetchManifestUpdate(manifestUrl, fetchFn);
}

async function fetchManifestUpdate(
  manifestUrl: string,
  fetchFn: FetchLike,
  ghRepo?: { owner: string; repo: string } | null
): Promise<AppUpdateInfo> {
  try {
    const response = await fetchFn(manifestUrl, {
      cache: "no-cache",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      if (response.status === 404) {
        const repoName = ghRepo ? `${ghRepo.owner}/${ghRepo.repo}` : "GitHub";
        throw new Error(`Repozytorium ${repoName} nie ma jeszcze opublikowanego wydania.`);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const manifest = (await response.json()) as AppUpdateManifest;

    const hasUpdate =
      compareVersions(manifest.version, CURRENT_APP_VERSION) > 0 ||
      (manifest.versionCode > CURRENT_APP_BUILD && manifest.version === CURRENT_APP_VERSION);

    return {
      hasUpdate,
      currentVersion: CURRENT_APP_VERSION,
      latestVersion: manifest.version || CURRENT_APP_VERSION,
      versionCode: manifest.versionCode || CURRENT_APP_BUILD,
      releaseDate: manifest.releaseDate || new Date().toISOString().slice(0, 10),
      changelog: Array.isArray(manifest.changelog) ? manifest.changelog : ["Ogólne ulepszenia i optymalizacje."],
      downloadUrl: manifest.downloadUrl || "",
      mandatory: Boolean(manifest.mandatory),
      sourceUrl: manifestUrl,
    };
  } catch (err) {
    let errorMsg = "Nie udało się połączyć z serwerem aktualizacji.";
    if (err instanceof Error) {
      if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        errorMsg = "Brak połączenia z GitHubem. Sprawdź internet lub nazwę repozytorium w 'Źródło'.";
      } else {
        errorMsg = err.message;
      }
    }

    return {
      hasUpdate: false,
      currentVersion: CURRENT_APP_VERSION,
      latestVersion: CURRENT_APP_VERSION,
      versionCode: CURRENT_APP_BUILD,
      releaseDate: new Date().toISOString().slice(0, 10),
      changelog: [],
      downloadUrl: "",
      mandatory: false,
      sourceUrl: manifestUrl,
      error: errorMsg,
    };
  }
}


export async function installUpdate(downloadUrl: string): Promise<boolean> {
  if (!downloadUrl) return false;

  try {
    if (Capacitor.isNativePlatform() || typeof window !== "undefined") {
      window.open(downloadUrl, "_system");
      return true;
    }
    return false;
  } catch {
    if (typeof window !== "undefined") {
      window.location.href = downloadUrl;
      return true;
    }
    return false;
  }
}

