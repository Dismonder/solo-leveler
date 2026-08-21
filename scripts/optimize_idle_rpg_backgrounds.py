from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageChops


def convert_directory(source: Path, destination: Path) -> tuple[int, int]:
    destination.mkdir(parents=True, exist_ok=True)
    total_png = 0
    total_webp = 0
    for source_path in sorted(source.glob("*.png")):
        destination_path = destination / f"{source_path.stem}.webp"
        with Image.open(source_path) as original:
            original.load()
            original.save(destination_path, "WEBP", lossless=True, method=6, quality=100)
            with Image.open(destination_path) as optimized:
                optimized.load()
                converted = optimized.convert(original.mode)
                if ImageChops.difference(original, converted).getbbox() is not None:
                    raise RuntimeError(f"Lossless verification failed: {source_path.name}")
        before = source_path.stat().st_size
        after = destination_path.stat().st_size
        total_png += before
        total_webp += after
        print(f"{source_path.name}: {before} -> {after}")
    return total_png, total_webp


def main() -> None:
    parser = argparse.ArgumentParser(description="Losslessly optimize Idle RPG PNG backgrounds as WebP.")
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    before, after = convert_directory(args.source.resolve(), args.destination.resolve())
    ratio = after / before if before else 0
    print(f"TOTAL {before} -> {after}; saved={before - after}; ratio={ratio:.3f}")


if __name__ == "__main__":
    main()
