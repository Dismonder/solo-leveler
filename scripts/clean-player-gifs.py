from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageSequence


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "art-src" / "raw-assets" / "models" / "modele_bohaterow"
OUT_DIR = ROOT / "src" / "assets" / "models" / "gifs"

FILES = {
    "Eryk-Idle.gif": "hunter-idle.gif",
    "Eryk-Run.gif": "hunter-run.gif",
    "Eryk-Jump.gif": "hunter-jump.gif",
    "Eryk-Attack.gif": "hunter-attack.gif",
}


def clean_frame(frame: Image.Image) -> Image.Image:
    rgba = frame.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue

            is_white_backdrop = r > 214 and g > 214 and b > 214
            is_logo_yellow = y > height * 0.6 and r > 178 and g > 126 and r > b + 34 and g > b + 8
            is_logo_gray = y > height * 0.72 and abs(r - g) < 12 and abs(g - b) < 12 and r > 110

            if is_white_backdrop or is_logo_yellow or is_logo_gray:
                pixels[x, y] = (r, g, b, 0)

    return rgba


def convert_gif(source: Path, target: Path) -> None:
    image = Image.open(source)
    frames: list[Image.Image] = []
    durations: list[int] = []

    for frame in ImageSequence.Iterator(image):
        frames.append(clean_frame(frame))
        durations.append(int(frame.info.get("duration", image.info.get("duration", 80))))

    if not frames:
        raise RuntimeError(f"No frames extracted from {source}")

    target.parent.mkdir(parents=True, exist_ok=True)
    frames[0].save(
        target,
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=0,
        transparency=0,
        disposal=2,
        optimize=False,
    )


def main() -> None:
    for source_name, target_name in FILES.items():
        convert_gif(SOURCE_DIR / source_name, OUT_DIR / target_name)
        print(f"wrote {OUT_DIR / target_name}")


if __name__ == "__main__":
    main()
