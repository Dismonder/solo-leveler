const POSTER_WIDTH = 1280;
const POSTER_HEIGHT = 720;

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function compactLabel(value: string, maxLength: number) {
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1)}...` : trimmed;
}

export function createExerciseVideoPoster(title: string, sourceName?: string) {
  const safeTitle = escapeSvgText(compactLabel(title, 34).toUpperCase());
  const safeSource = escapeSvgText(compactLabel(sourceName || "atlas techniki", 24).toUpperCase());
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" viewBox="0 0 ${POSTER_WIDTH} ${POSTER_HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#06111f"/>
      <stop offset="52%" stop-color="#08273a"/>
      <stop offset="100%" stop-color="#0e1020"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="55%">
      <stop offset="0%" stop-color="#67e8f9" stop-opacity="0.55"/>
      <stop offset="48%" stop-color="#22d3ee" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect width="100%" height="100%" fill="url(#glow)"/>
  <circle cx="640" cy="324" r="118" fill="#22d3ee" opacity="0.12" filter="url(#soft)"/>
  <circle cx="640" cy="324" r="78" fill="none" stroke="#67e8f9" stroke-width="4" opacity="0.55"/>
  <path d="M616 282 L616 366 L690 324 Z" fill="#ecfeff"/>
  <text x="640" y="465" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="54" font-weight="900" letter-spacing="6" fill="#f8fafc">${safeTitle}</text>
  <text x="640" y="526" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="900" letter-spacing="7" fill="#67e8f9">WIDEO TECHNIKI · ${safeSource}</text>
  <rect x="88" y="88" width="1104" height="544" rx="44" fill="none" stroke="#67e8f9" stroke-width="2" opacity="0.28"/>
</svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
