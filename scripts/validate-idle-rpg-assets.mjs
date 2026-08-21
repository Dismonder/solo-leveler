import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const assetRoot = join(projectRoot, "src", "assets", "idle-rpg");
const manifestPath = join(assetRoot, "asset-manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readPngMetadata(path) {
  const bytes = readFileSync(path);
  assert(bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a", `${path}: invalid PNG signature`);
  assert(bytes.subarray(12, 16).toString("ascii") === "IHDR", `${path}: missing IHDR`);
  return {
    format: "png",
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    bitDepth: bytes[24],
    hasAlpha: bytes[25] === 4 || bytes[25] === 6,
  };
}

function readUint24LE(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function readWebpMetadata(path) {
  const bytes = readFileSync(path);
  assert(bytes.length >= 20, `${path}: truncated WebP`);
  assert(bytes.subarray(0, 4).toString("ascii") === "RIFF", `${path}: invalid WebP RIFF header`);
  assert(bytes.subarray(8, 12).toString("ascii") === "WEBP", `${path}: invalid WebP signature`);

  let offset = 12;
  let width;
  let height;
  let hasAlpha = false;
  while (offset + 8 <= bytes.length) {
    const kind = bytes.subarray(offset, offset + 4).toString("ascii");
    const size = bytes.readUInt32LE(offset + 4);
    const data = offset + 8;
    assert(data + size <= bytes.length, `${path}: truncated ${kind} chunk`);

    if (kind === "VP8X") {
      assert(size >= 10, `${path}: invalid VP8X chunk`);
      hasAlpha ||= (bytes[data] & 0x10) !== 0;
      width = readUint24LE(bytes, data + 4) + 1;
      height = readUint24LE(bytes, data + 7) + 1;
    } else if (kind === "VP8L") {
      assert(size >= 5 && bytes[data] === 0x2f, `${path}: invalid VP8L chunk`);
      const packed = bytes.readUInt32LE(data + 1);
      width ??= (packed & 0x3fff) + 1;
      height ??= ((packed >>> 14) & 0x3fff) + 1;
      hasAlpha ||= ((packed >>> 28) & 1) === 1;
    } else if (kind === "VP8 ") {
      assert(size >= 10 && bytes.subarray(data + 3, data + 6).toString("hex") === "9d012a", `${path}: invalid VP8 frame`);
      width ??= bytes.readUInt16LE(data + 6) & 0x3fff;
      height ??= bytes.readUInt16LE(data + 8) & 0x3fff;
    } else if (kind === "ALPH") {
      hasAlpha = true;
    }

    offset = data + size + (size % 2);
  }

  assert(Number.isInteger(width) && Number.isInteger(height), `${path}: WebP canvas dimensions not found`);
  return { format: "webp", width, height, bitDepth: 8, hasAlpha };
}

function readTextureMetadata(path) {
  const extension = extname(path).toLowerCase();
  if (extension === ".png") return readPngMetadata(path);
  if (extension === ".webp") return readWebpMetadata(path);
  throw new Error(`${path}: unsupported texture format`);
}

function listSourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(directory, entry.name);
    return entry.isDirectory() ? listSourceFiles(absolute) : [absolute];
  });
}

function sameMembers(actual, expected) {
  return actual.length === expected.length && expected.every((entry) => actual.includes(entry));
}

function readTtfCmapCodePoints(path) {
  const bytes = readFileSync(path);
  const tableCount = bytes.readUInt16BE(4);
  let cmapOffset = -1;
  for (let index = 0; index < tableCount; index += 1) {
    const recordOffset = 12 + index * 16;
    if (bytes.subarray(recordOffset, recordOffset + 4).toString("ascii") === "cmap") {
      cmapOffset = bytes.readUInt32BE(recordOffset + 8);
      break;
    }
  }
  assert(cmapOffset >= 0, `${path}: TTF cmap table is missing`);
  const subtableCount = bytes.readUInt16BE(cmapOffset + 2);
  const codePoints = new Set();

  for (let index = 0; index < subtableCount; index += 1) {
    const recordOffset = cmapOffset + 4 + index * 8;
    const subtableOffset = cmapOffset + bytes.readUInt32BE(recordOffset + 4);
    const format = bytes.readUInt16BE(subtableOffset);
    if (format === 12) {
      const groupCount = bytes.readUInt32BE(subtableOffset + 12);
      for (let group = 0; group < groupCount; group += 1) {
        const groupOffset = subtableOffset + 16 + group * 12;
        const start = bytes.readUInt32BE(groupOffset);
        const end = bytes.readUInt32BE(groupOffset + 4);
        for (let codePoint = start; codePoint <= end; codePoint += 1) codePoints.add(codePoint);
      }
    } else if (format === 4) {
      const segmentCount = bytes.readUInt16BE(subtableOffset + 6) / 2;
      const endCodesOffset = subtableOffset + 14;
      const startCodesOffset = endCodesOffset + segmentCount * 2 + 2;
      const deltasOffset = startCodesOffset + segmentCount * 2;
      const rangesOffset = deltasOffset + segmentCount * 2;
      for (let segment = 0; segment < segmentCount; segment += 1) {
        const start = bytes.readUInt16BE(startCodesOffset + segment * 2);
        const end = bytes.readUInt16BE(endCodesOffset + segment * 2);
        const delta = bytes.readInt16BE(deltasOffset + segment * 2);
        const rangeOffsetAddress = rangesOffset + segment * 2;
        const rangeOffset = bytes.readUInt16BE(rangeOffsetAddress);
        for (let codePoint = start; codePoint <= end && codePoint !== 0xffff; codePoint += 1) {
          const glyphId = rangeOffset === 0
            ? (codePoint + delta) & 0xffff
            : bytes.readUInt16BE(rangeOffsetAddress + rangeOffset + (codePoint - start) * 2);
          if (glyphId !== 0) codePoints.add(codePoint);
        }
      }
    }
  }
  return codePoints;
}

assert(manifest.schemaVersion === 1, "Unsupported Idle RPG asset manifest schema");
assert(manifest.atlas.width <= 2048 && manifest.atlas.height <= 2048, "Atlas exceeds 2048 px limit");
assert(manifest.atlas.columns * manifest.atlas.frameWidth === manifest.atlas.width, "Atlas columns do not fill width");
assert(manifest.atlas.rows * manifest.atlas.frameHeight === manifest.atlas.height, "Atlas rows do not fill height");
assert(manifest.atlas.columns * manifest.atlas.rows === manifest.atlas.sourceFrames, "Atlas frame count mismatch");
assert(typeof manifest.animationManifest === "string", "Animation manifest path is missing");

const paths = new Set();
const assetsByPath = new Map();
const textureMetadataByPath = new Map();
let runtimeBytes = 0;
let preloadBytes = 0;

for (const asset of manifest.assets) {
  assert(!paths.has(asset.path), `Duplicate asset path: ${asset.path}`);
  paths.add(asset.path);
  assetsByPath.set(asset.path, asset);
  const absolute = join(assetRoot, asset.path);
  const info = statSync(absolute);
  assert(info.isFile() && info.size > 0, `Missing or empty asset: ${asset.path}`);
  runtimeBytes += info.size;
  if (asset.preload) preloadBytes += info.size;

  if (["atlas", "summon-strip", "map", "environment-layer", "boss-overlay"].includes(asset.kind)) {
    const texture = readTextureMetadata(absolute);
    textureMetadataByPath.set(asset.path, texture);
    assert(texture.width <= 2048 && texture.height <= 2048, `${asset.path}: texture exceeds 2048 px`);
    assert(texture.bitDepth === 8, `${asset.path}: expected 8-bit texture`);
    if (asset.kind === "atlas") {
      assert(texture.width === manifest.atlas.width && texture.height === manifest.atlas.height, `${asset.path}: atlas dimensions mismatch`);
      assert(texture.hasAlpha, `${asset.path}: atlas must contain alpha`);
      const promptRelativePath = asset.path.replace(/[.](?:png|webp)$/i, ".prompt.txt");
      statSync(join(projectRoot, manifest.artSourceRoot, promptRelativePath));
    } else if (asset.kind === "summon-strip") {
      assert(texture.width === manifest.atlas.width && texture.height === manifest.atlas.frameHeight, `${asset.path}: summon strip must contain one complete eight-frame atlas row`);
      assert(texture.hasAlpha, `${asset.path}: summon strip must contain alpha`);
    } else if (asset.kind === "map") {
      const ratio = texture.width / texture.height;
      assert(texture.width >= 900 && texture.height >= 1500 && ratio >= 0.5 && ratio <= 0.68, `${asset.path}: map must be a high-resolution portrait texture`);
    }
  }
}

const animation = JSON.parse(readFileSync(join(assetRoot, manifest.animationManifest), "utf8"));

assert(manifest.environment?.composition === "contiguous-vertical-bands", "Environment layers must use contiguous vertical bands");
assert(manifest.environment.canvasWidth === 1536 && manifest.environment.canvasHeight === 1024, "Environment composition must be 1536x1024");
assert(Number.isInteger(manifest.environment.paletteColors) && manifest.environment.paletteColors >= 64 && manifest.environment.paletteColors <= 256, "Environment palette normalization must use 64-256 colors");
const requiredEnvironmentRoles = ["sky", "far", "mid", "ground", "foreground"];
const requiredParallaxFactors = [0.08, 0.20, 0.45, 1.0, 1.35];
assert(sameMembers(manifest.environment.layerRoles, requiredEnvironmentRoles), "Environment must declare sky/far/mid/ground/foreground roles");
assert(sameMembers(Object.keys(manifest.environment.realms), ["ashen-bulwark", "drowned-archive", "thorn-sky", "duskless-crown"]), "Environment must define all four realms");

const referencedEnvironmentLayers = new Set();
const referencedBossOverlays = new Set();
const summonStripTextureBytes = manifest.assets
  .filter((asset) => asset.kind === "summon-strip")
  .map((asset) => {
    const texture = textureMetadataByPath.get(asset.path);
    return texture.width * texture.height * 4;
  })
  .sort((left, right) => right - left)
  .slice(0, 3)
  .reduce((total, bytes) => total + bytes, 0);
const coreAtlasTexture = textureMetadataByPath.get("actors/core-battle-atlas.webp");
assert(coreAtlasTexture, "Core battle atlas metadata is missing");

for (const [realmId, environment] of Object.entries(manifest.environment.realms)) {
  assert(Array.isArray(environment.layers) && environment.layers.length === 5, `${realmId}: exactly five environment layers are required`);
  assert(environment.layers.map((layer) => layer.role).join(",") === requiredEnvironmentRoles.join(","), `${realmId}: layer order must be sky/far/mid/ground/foreground`);

  let nextY = 0;
  let environmentTextureBytes = 0;
  for (const [index, layer] of environment.layers.entries()) {
    assert(!referencedEnvironmentLayers.has(layer.path), `${realmId}: duplicate layer path ${layer.path}`);
    referencedEnvironmentLayers.add(layer.path);
    assert(assetsByPath.get(layer.path)?.kind === "environment-layer", `${realmId}.${layer.role}: path is not a declared environment-layer asset`);
    assert(Number.isInteger(layer.y) && layer.y === nextY, `${realmId}.${layer.role}: vertical band must begin at ${nextY}`);
    assert(Number.isInteger(layer.height) && layer.height > 0, `${realmId}.${layer.role}: band height must be positive`);
    assert(layer.parallaxFactor === requiredParallaxFactors[index], `${realmId}.${layer.role}: parallax factor must be ${requiredParallaxFactors[index]}`);
    const texture = textureMetadataByPath.get(layer.path);
    assert(texture?.width === manifest.environment.canvasWidth && texture.height === layer.height, `${realmId}.${layer.role}: texture dimensions do not match its band`);
    nextY += layer.height;
    environmentTextureBytes += texture.width * texture.height * 4;
  }
  assert(nextY === manifest.environment.canvasHeight, `${realmId}: vertical bands do not reconstruct the full canvas height`);

  const overlay = environment.bossOverlay;
  assert(overlay && assetsByPath.get(overlay.path)?.kind === "boss-overlay", `${realmId}: boss overlay is missing from runtime assets`);
  assert(!referencedBossOverlays.has(overlay.path), `${realmId}: duplicate boss overlay path`);
  referencedBossOverlays.add(overlay.path);
  const overlayTexture = textureMetadataByPath.get(overlay.path);
  assert(overlayTexture?.width === overlay.width && overlayTexture.height === overlay.height, `${realmId}: boss overlay dimensions mismatch`);
  assert(overlayTexture.hasAlpha, `${realmId}: boss overlay must be transparent`);
  assert(statSync(join(assetRoot, overlay.path)).size <= 262144, `${realmId}: boss overlay exceeds 256 KiB`);
  assert(Number.isFinite(overlay.maxOpacity) && overlay.maxOpacity > 0 && overlay.maxOpacity <= 0.8, `${realmId}: boss overlay opacity must remain subtle`);

  const particles = environment.ambientParticles;
  assert(particles && typeof particles.kind === "string" && particles.kind.length > 0, `${realmId}: ambient particle kind is missing`);
  assert(Array.isArray(particles.colors) && particles.colors.length >= 2 && particles.colors.length <= 4, `${realmId}: ambient particles require 2-4 colors`);
  for (const color of particles.colors) assert(/^#[0-9a-f]{6}$/i.test(color), `${realmId}: invalid ambient color ${color}`);
  assert(Number.isFinite(particles.ratePerSecond) && particles.ratePerSecond > 0 && particles.ratePerSecond <= 30, `${realmId}: ambient particle rate is invalid`);
  assert(Number.isInteger(particles.maxParticles) && particles.maxParticles > 0 && particles.maxParticles <= 64, `${realmId}: ambient particle cap is invalid`);
  for (const [key, minimum, maximum] of [
    ["lifespanMs", 300, 10000],
    ["velocityX", -100, 100],
    ["velocityY", -100, 100],
    ["sizePx", 1, 12],
    ["alpha", 0, 1],
  ]) {
    const range = particles[key];
    assert(Array.isArray(range) && range.length === 2 && range.every(Number.isFinite), `${realmId}: ${key} must be a finite range`);
    assert(range[0] >= minimum && range[1] <= maximum && range[0] <= range[1], `${realmId}: ${key} range is invalid`);
  }
  assert(Number.isFinite(particles.reducedMotionRateMultiplier) && particles.reducedMotionRateMultiplier >= 0 && particles.reducedMotionRateMultiplier <= 0.3, `${realmId}: Reduced Motion particle multiplier is invalid`);

  const realmAtlasPath = animation?.atlases?.[realmId]?.assetPath;
  const realmAtlasTexture = realmAtlasPath ? textureMetadataByPath.get(realmAtlasPath) : undefined;
  assert(realmAtlasTexture, `${realmId}: active realm atlas metadata is missing`);
  const activeBossTextureBytes =
    coreAtlasTexture.width * coreAtlasTexture.height * 4
    + realmAtlasTexture.width * realmAtlasTexture.height * 4
    + environmentTextureBytes
    + overlayTexture.width * overlayTexture.height * 4
    + summonStripTextureBytes;
  assert(activeBossTextureBytes <= manifest.activeBossTextureBudgetBytes, `${realmId}: active boss textures exceed 48 MiB (${activeBossTextureBytes} bytes)`);
}

assert(sameMembers(
  manifest.assets.filter((asset) => asset.kind === "environment-layer").map((asset) => asset.path),
  [...referencedEnvironmentLayers],
), "Every environment-layer asset must be referenced exactly once by a realm");
assert(sameMembers(
  manifest.assets.filter((asset) => asset.kind === "boss-overlay").map((asset) => asset.path),
  [...referencedBossOverlays],
), "Every boss-overlay asset must be referenced exactly once by a realm");

assert(animation.schemaVersion === 1, "Unsupported Idle RPG animation manifest schema");
assert(animation.timelineModel === "authored-keyframe-holds-v1", "Animation timelines must use authored keyframe holds");
assert(animation.atlasGeometry.columns === manifest.atlas.columns, "Animation atlas column count mismatch");
assert(animation.atlasGeometry.rows === manifest.atlas.rows, "Animation atlas row count mismatch");
assert(animation.atlasGeometry.frameWidth === manifest.atlas.frameWidth, "Animation frame width mismatch");
assert(animation.atlasGeometry.frameHeight === manifest.atlas.frameHeight, "Animation frame height mismatch");
assert(animation.atlasGeometry.sourceFrames === manifest.atlas.sourceFrames, "Animation source frame count mismatch");
assert(animation.atlasGeometry.safeInsetPx >= 8, "Animation atlas safe inset must be at least 8 px");
assert(animation.atlasGeometry.extrudePx === 0, "Generated keyframe atlases currently use transparent insets, not fabricated edge extrusion");

for (const [paletteId, colors] of Object.entries(animation.palettes)) {
  assert(Array.isArray(colors) && colors.length >= 4, `Palette ${paletteId} must define at least four colors`);
  for (const color of colors) assert(/^#[0-9a-f]{6}$/i.test(color), `Palette ${paletteId} contains invalid color ${color}`);
}

for (const [atlasId, atlas] of Object.entries(animation.atlases)) {
  assert(assetsByPath.get(atlas.assetPath)?.kind === "atlas", `Animation atlas ${atlasId} does not resolve to a runtime atlas asset`);
}

assert(sameMembers(Object.keys(animation.categories), Object.keys(manifest.animationContracts)), "Animation category set differs from the asset contract");
const actorIds = new Set();
let authoredTimelineFrames = 0;

for (const [categoryName, contract] of Object.entries(manifest.animationContracts)) {
  const category = animation.categories[categoryName];
  assert(category && Number.isInteger(category.frameBudget), `Animation category ${categoryName} is missing`);
  assert(category.frameBudget === contract.frameBudget, `${categoryName}: declared frame budget mismatch`);
  assert(Array.isArray(category.sources) && category.sources.length === contract.sourceCount, `${categoryName}: expected ${contract.sourceCount} actor sources`);
  assert(sameMembers(Object.keys(category.states), contract.requiredStates), `${categoryName}: required state set mismatch`);

  for (const source of category.sources) {
    assert(!actorIds.has(source.actorId), `Duplicate animation actor ID: ${source.actorId}`);
    actorIds.add(source.actorId);
    assert(animation.atlases[source.atlasId], `${source.actorId}: unknown atlas ${source.atlasId}`);
    assert(Number.isInteger(source.rowOffset) && source.rowOffset >= 0 && source.rowOffset % manifest.atlas.columns === 0, `${source.actorId}: rowOffset must start on an atlas row`);
    assert(Number.isInteger(source.rowCount) && source.rowCount >= 1, `${source.actorId}: rowCount must be positive`);
    assert(source.rowOffset + source.rowCount * manifest.atlas.columns <= manifest.atlas.sourceFrames, `${source.actorId}: source region escapes atlas`);
    assert(source.facing === "left" || source.facing === "right", `${source.actorId}: invalid facing`);
    assert(animation.palettes[source.paletteId], `${source.actorId}: unknown palette ${source.paletteId}`);
    assert(source.pivot && source.pivot.x >= 0 && source.pivot.x <= 1 && source.pivot.y >= 0 && source.pivot.y <= 1, `${source.actorId}: pivot must be normalized`);
    assert(source.baselinePx === null || (Number.isInteger(source.baselinePx) && source.baselinePx >= 0 && source.baselinePx < manifest.atlas.frameHeight), `${source.actorId}: invalid baseline`);
  }

  let categoryFrames = 0;
  for (const [stateName, clip] of Object.entries(category.states)) {
    assert(Number.isFinite(clip.fps) && clip.fps > 0 && clip.fps <= 60, `${categoryName}.${stateName}: invalid fps`);
    assert(typeof clip.loop === "boolean", `${categoryName}.${stateName}: loop flag missing`);
    assert(Array.isArray(clip.keyframes) && clip.keyframes.length > 0, `${categoryName}.${stateName}: timeline is empty`);
    assert(Array.isArray(clip.markers), `${categoryName}.${stateName}: markers must be an array`);

    let clipFrames = 0;
    for (const keyframe of clip.keyframes) {
      assert(Number.isInteger(keyframe.sourceFrame) && keyframe.sourceFrame >= 0, `${categoryName}.${stateName}: invalid local source frame`);
      assert(Number.isInteger(keyframe.hold) && keyframe.hold >= 1, `${categoryName}.${stateName}: hold must be a positive display-frame count`);
      for (const source of category.sources) {
        assert(keyframe.sourceFrame < source.rowCount * manifest.atlas.columns, `${categoryName}.${stateName}: local frame ${keyframe.sourceFrame} escapes ${source.actorId}`);
        const resolvedFrame = source.rowOffset + keyframe.sourceFrame;
        assert(resolvedFrame >= 0 && resolvedFrame < manifest.atlas.sourceFrames, `${categoryName}.${stateName}: resolved frame ${resolvedFrame} is outside the atlas`);
      }
      clipFrames += keyframe.hold;
    }

    const markerKeys = new Set();
    for (const marker of clip.markers) {
      assert(typeof marker.name === "string" && marker.name.length > 0, `${categoryName}.${stateName}: marker name is missing`);
      assert(Number.isInteger(marker.frame) && marker.frame >= 0 && marker.frame < clipFrames, `${categoryName}.${stateName}: marker ${marker.name} is outside its expanded timeline`);
      const markerKey = `${marker.name}:${marker.frame}`;
      assert(!markerKeys.has(markerKey), `${categoryName}.${stateName}: duplicate marker ${markerKey}`);
      markerKeys.add(markerKey);
    }
    if (contract.impactStates.includes(stateName)) {
      assert(clip.markers.some((marker) => marker.name === "impact"), `${categoryName}.${stateName}: impact marker is required`);
    }
    if (stateName === "enter") assert(clip.markers.some((marker) => marker.name === "settled"), `${categoryName}.enter: settled marker is required`);
    if (stateName === "hit") assert(clip.markers.some((marker) => marker.name === "recoil"), `${categoryName}.hit: recoil marker is required`);
    if (stateName === "death") assert(clip.markers.some((marker) => marker.name === "vanish"), `${categoryName}.death: vanish marker is required`);
    if (stateName === "intro") assert(clip.markers.some((marker) => marker.name === "roar"), `${categoryName}.intro: roar marker is required`);

    categoryFrames += clipFrames;
  }

  assert(categoryFrames === contract.frameBudget, `${categoryName}: authored timelines total ${categoryFrames}, expected ${contract.frameBudget}`);
  assert(categoryFrames === category.frameBudget, `${categoryName}: timeline total differs from runtime frameBudget`);
  authoredTimelineFrames += categoryFrames * category.sources.length;
}

assert(runtimeBytes <= manifest.runtimeBudgetBytes, `Idle RPG runtime assets exceed 32 MiB: ${runtimeBytes} bytes`);
assert(preloadBytes <= manifest.preloadBudgetBytes, `Idle RPG preload exceeds 6 MiB: ${preloadBytes} bytes`);
assert(readFileSync(join(assetRoot, "fonts", "OFL.txt"), "utf8").includes("SIL OPEN FONT LICENSE"), "Pixelify Sans OFL license is missing");
const polishFontProbe = "ZAŻÓŁĆ GĘŚLĄ JAŹŃ";
const pixelifyCodePoints = readTtfCmapCodePoints(join(assetRoot, "fonts", "PixelifySans-Variable.ttf"));
for (const character of polishFontProbe) {
  if (character !== " ") assert(pixelifyCodePoints.has(character.codePointAt(0)), `Pixelify Sans is missing Polish glyph: ${character}`);
}

const forbidden = [/\/assets\/idlerpg/i, /Monarcha Cieni/i, /Sung[ -]?Jin/i];
for (const source of [join(projectRoot, "src", "game", "idle-rpg"), join(projectRoot, "src", "components", "idle-rpg")].flatMap(listSourceFiles)) {
  if (!/[.](?:ts|tsx|css)$/.test(source)) continue;
  const text = readFileSync(source, "utf8");
  for (const pattern of forbidden) assert(!pattern.test(text), `${source}: forbidden legacy path or IP-like name (${pattern})`);
}

console.log(
  `Idle RPG assets valid: ${manifest.assets.length} runtime files, ${(runtimeBytes / 1048576).toFixed(2)} MiB total, ${(preloadBytes / 1048576).toFixed(2)} MiB preload; ${actorIds.size} actor sources and ${authoredTimelineFrames} validated authored timeline frames.`,
);
