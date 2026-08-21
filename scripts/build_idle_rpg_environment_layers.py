from __future__ import annotations

import argparse
import hashlib
import math
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageStat


CANVAS_SIZE = (1536, 1024)
OVERLAY_WORK_SIZE = (384, 256)
OVERLAY_SIZE = (768, 512)
PALETTE_COLORS = 256
MIN_PSNR_DB = 35.0


@dataclass(frozen=True)
class Band:
    role: str
    y: int
    height: int
    parallax: float


BANDS = (
    Band("sky", 0, 256, 0.08),
    Band("far", 256, 192, 0.20),
    Band("mid", 448, 192, 0.45),
    Band("ground", 640, 192, 1.00),
    Band("foreground", 832, 192, 1.35),
)


REALMS = {
    "ashen-bulwark": {
        "source": "ash-citadel-battle.webp",
        "colors": ((240, 119, 46), (161, 48, 42), (116, 63, 126)),
    },
    "drowned-archive": {
        "source": "drowned-archive-battle.webp",
        "colors": ((93, 219, 194), (36, 133, 137), (153, 126, 76)),
    },
    "thorn-sky": {
        "source": "thorn-sky-battle.webp",
        "colors": ((226, 176, 255), (128, 83, 180), (188, 224, 255)),
    },
    "duskless-crown": {
        "source": "duskless-crown-battle.webp",
        "colors": ((218, 85, 137), (113, 45, 109), (214, 183, 112)),
    },
}


def save_lossless_webp(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "WEBP", lossless=True, quality=100, method=6, exact=True)
    with Image.open(path) as decoded:
        decoded.load()
        if ImageChops.difference(image.convert("RGBA"), decoded.convert("RGBA")).getbbox() is not None:
            raise RuntimeError(f"Lossless WebP verification failed: {path}")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def make_boss_overlay(realm_id: str, colors: tuple[tuple[int, int, int], ...]) -> Image.Image:
    image = Image.new("RGBA", OVERLAY_WORK_SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    primary, secondary, accent = colors

    # Pixel-stepped edge vignette leaves the combatants and semantic HUD readable.
    for inset, alpha in ((0, 76), (3, 54), (7, 34), (12, 18)):
        draw.rectangle(
            (inset, inset, OVERLAY_WORK_SIZE[0] - 1 - inset, OVERLAY_WORK_SIZE[1] - 1 - inset),
            outline=(*secondary, alpha),
            width=2,
        )

    if realm_id == "ashen-bulwark":
        center = (192, 45)
        for radius, alpha in ((33, 38), (28, 72), (24, 118)):
            draw.ellipse((center[0] - radius, center[1] - radius, center[0] + radius, center[1] + radius), outline=(*primary, alpha), width=2)
        for x in range(18, 370, 37):
            draw.polygon(((x, 244), (x + 3, 232), (x + 6, 244)), fill=(*primary, 88))
    elif realm_id == "drowned-archive":
        for radius, alpha in ((40, 34), (31, 58), (22, 88)):
            draw.ellipse((192 - radius * 2, 52 - radius, 192 + radius * 2, 52 + radius), outline=(*primary, alpha), width=2)
        for x in range(28, 370, 43):
            draw.line((x, 6, x, 18 + (x % 17)), fill=(*accent, 68), width=2)
            draw.rectangle((x - 1, 20 + (x % 17), x + 1, 22 + (x % 17)), fill=(*primary, 92))
    elif realm_id == "thorn-sky":
        for x in (34, 92, 286, 344):
            points = [(x, 5), (x - 7, 31), (x + 2, 45), (x - 5, 72), (x + 7, 91)]
            draw.line(points, fill=(*accent, 104), width=2)
        for x, y in ((45, 194), (77, 223), (310, 205), (340, 231)):
            draw.polygon(((x, y - 8), (x + 5, y), (x, y + 8), (x - 5, y)), outline=(*primary, 76))
    else:
        center = (192, 48)
        draw.arc((center[0] - 44, center[1] - 35, center[0] + 44, center[1] + 35), 195, 345, fill=(*accent, 112), width=3)
        for dx, dy in ((-37, -11), (-18, -27), (0, -31), (19, -25), (38, -9)):
            draw.rectangle((center[0] + dx - 3, center[1] + dy - 2, center[0] + dx + 3, center[1] + dy + 2), fill=(*accent, 96))
        for x in (28, 57, 326, 355):
            draw.line((x, 186, x + (-7 if x < 192 else 7), 242), fill=(*primary, 78), width=2)

    return image.resize(OVERLAY_SIZE, Image.Resampling.NEAREST)


def quality_metrics(original: Image.Image, normalized: Image.Image) -> tuple[float, float]:
    difference = ImageChops.difference(original, normalized)
    stats = ImageStat.Stat(difference)
    mae = sum(stats.mean) / len(stats.mean)
    rmse = math.sqrt(sum(value * value for value in stats.rms) / len(stats.rms))
    psnr = float("inf") if rmse == 0 else 20 * math.log10(255 / rmse)
    return mae, psnr


def build_realm(source_root: Path, output_root: Path, realm_id: str, config: dict[str, object]) -> dict[str, object]:
    source_path = source_root / str(config["source"])
    with Image.open(source_path) as opened:
        original = opened.convert("RGB")
    if original.size != CANVAS_SIZE:
        raise RuntimeError(f"{source_path}: expected {CANVAS_SIZE}, got {original.size}")

    # One shared adaptive palette per realm keeps the five strips coherent and
    # restores the deliberately limited pixel-art color language.
    normalized = original.quantize(
        colors=PALETTE_COLORS,
        method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.NONE,
    ).convert("RGB")
    mae, psnr = quality_metrics(original, normalized)
    if psnr < MIN_PSNR_DB:
        raise RuntimeError(f"{realm_id}: palette normalization PSNR {psnr:.2f} dB is below {MIN_PSNR_DB:.2f} dB")

    realm_root = output_root / realm_id
    rebuilt = Image.new("RGB", CANVAS_SIZE)
    layer_records: list[dict[str, object]] = []
    for band in BANDS:
        layer = normalized.crop((0, band.y, CANVAS_SIZE[0], band.y + band.height))
        path = realm_root / f"{band.role}.webp"
        save_lossless_webp(layer, path)
        with Image.open(path) as decoded:
            rebuilt.paste(decoded.convert("RGB"), (0, band.y))
        layer_records.append(
            {
                "role": band.role,
                "path": path.as_posix(),
                "bytes": path.stat().st_size,
                "sha256": sha256(path),
            }
        )

    if ImageChops.difference(normalized, rebuilt).getbbox() is not None:
        raise RuntimeError(f"{realm_id}: vertical bands do not reconstruct the normalized composite")

    overlay = make_boss_overlay(realm_id, config["colors"])  # type: ignore[arg-type]
    alpha_extrema = overlay.getchannel("A").getextrema()
    if alpha_extrema[0] != 0 or alpha_extrema[1] <= 0:
        raise RuntimeError(f"{realm_id}: boss overlay must combine transparent and visible pixels")
    overlay_path = realm_root / "boss-overlay.webp"
    save_lossless_webp(overlay, overlay_path)

    return {
        "realm": realm_id,
        "source": source_path.as_posix(),
        "sourceBytes": source_path.stat().st_size,
        "layerBytes": sum(int(record["bytes"]) for record in layer_records),
        "overlayBytes": overlay_path.stat().st_size,
        "paletteColors": PALETTE_COLORS,
        "meanAbsoluteError": round(mae, 4),
        "psnrDb": round(psnr, 3),
        "layers": layer_records,
        "overlaySha256": sha256(overlay_path),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Build verified Idle RPG parallax bands and boss overlays.")
    parser.add_argument("--project-root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    project_root = args.project_root.resolve()
    source_root = (
        project_root
        / "art-src"
        / "idlerpg"
        / "source-runtime-art"
        / "backgrounds"
        / "runtime-composites-webp"
    )
    output_root = project_root / "src" / "assets" / "idle-rpg" / "environment"

    total_source = 0
    total_layers = 0
    total_overlays = 0
    for realm_id, config in REALMS.items():
        result = build_realm(source_root, output_root, realm_id, config)
        total_source += int(result["sourceBytes"])
        total_layers += int(result["layerBytes"])
        total_overlays += int(result["overlayBytes"])
        print(
            f"{realm_id}: layers={result['layerBytes']} B, overlay={result['overlayBytes']} B, "
            f"MAE={result['meanAbsoluteError']}, PSNR={result['psnrDb']} dB"
        )

    print(
        f"TOTAL composites={total_source} B; five-band layers={total_layers} B; "
        f"boss overlays={total_overlays} B; generated={total_layers + total_overlays} B"
    )


if __name__ == "__main__":
    main()
