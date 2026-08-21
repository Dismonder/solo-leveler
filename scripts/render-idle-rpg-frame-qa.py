"""Render one atlas frame on the runtime-like dark background for visual QA."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("atlas", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--frame", type=int, default=0)
    parser.add_argument("--frame-width", type=int, default=192)
    parser.add_argument("--frame-height", type=int, default=256)
    parser.add_argument("--columns", type=int, default=8)
    parser.add_argument("--scale", type=int, default=4)
    args = parser.parse_args()

    atlas = Image.open(args.atlas).convert("RGBA")
    column = args.frame % args.columns
    row = args.frame // args.columns
    left = column * args.frame_width
    top = row * args.frame_height
    frame = atlas.crop((left, top, left + args.frame_width, top + args.frame_height))
    frame = frame.resize(
        (args.frame_width * args.scale, args.frame_height * args.scale),
        Image.Resampling.NEAREST,
    )
    background = Image.new("RGBA", frame.size, (11, 8, 18, 255))
    background.alpha_composite(frame)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    background.convert("RGB").save(args.output, quality=96)


if __name__ == "__main__":
    main()
