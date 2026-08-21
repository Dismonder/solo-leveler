from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


FRAME_WIDTH = 192
FRAME_HEIGHT = 256
ATLAS_COLUMNS = 8
ATLAS_ROWS = 6
TARGET_BASELINE = 232
AIRBORNE_ROWS: dict[str, set[int]] = {
    "ashen-bulwark-atlas": {2},
    "drowned-archive-atlas": {2, 5},
    "thorn-sky-atlas": {2, 4, 5},
    "duskless-crown-atlas": {5},
}


def horizontal_run_mask(rgba: np.ndarray, minimum_run: int) -> np.ndarray:
    """Find opaque, flat-colour scanline smears produced around generated keyframes."""
    opaque = rgba[:, :, 3] > 0
    rgb = rgba[:, :, :3]
    artifact = np.zeros_like(opaque)
    height, width = opaque.shape

    for y in range(height):
        x = 0
        while x < width:
            if not opaque[y, x]:
                x += 1
                continue
            colour = rgb[y, x]
            end = x + 1
            while end < width and opaque[y, end] and np.array_equal(rgb[y, end], colour):
                end += 1
            if end - x >= minimum_run:
                artifact[y, x:end] = True
            x = end
    return artifact


def dilate(mask: np.ndarray, radius: int) -> np.ndarray:
    expanded = mask.copy()
    for _ in range(radius):
        previous = expanded.copy()
        expanded[1:, :] |= previous[:-1, :]
        expanded[:-1, :] |= previous[1:, :]
        expanded[:, 1:] |= previous[:, :-1]
        expanded[:, :-1] |= previous[:, 1:]
    return expanded


def connected_components(mask: np.ndarray) -> list[list[tuple[int, int]]]:
    height, width = mask.shape
    visited = np.zeros_like(mask)
    components: list[list[tuple[int, int]]] = []
    for start_y in range(height):
        for start_x in range(width):
            if visited[start_y, start_x] or not mask[start_y, start_x]:
                continue
            stack = [(start_y, start_x)]
            visited[start_y, start_x] = True
            component: list[tuple[int, int]] = []
            while stack:
                y, x = stack.pop()
                component.append((y, x))
                for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    next_y = y + dy
                    next_x = x + dx
                    if (
                        0 <= next_y < height
                        and 0 <= next_x < width
                        and mask[next_y, next_x]
                        and not visited[next_y, next_x]
                    ):
                        visited[next_y, next_x] = True
                        stack.append((next_y, next_x))
            components.append(component)
    return components


def main_component_bounds(mask: np.ndarray) -> tuple[int, int, int, int] | None:
    components = connected_components(mask)
    if not components:
        return None
    component = max(components, key=len)
    ys = [point[0] for point in component]
    xs = [point[1] for point in component]
    return min(xs), min(ys), max(xs) + 1, max(ys) + 1


def remove_large_neutral_artifacts(rgba: np.ndarray, minimum_area: int = 96) -> np.ndarray:
    """Remove large white/grey generation remnants without erasing actor highlights.

    The authored characters use small neutral highlights, while the unwanted
    background remnants form much larger connected, low-saturation regions.
    Starting from only those large bright components and growing through their
    neutral antialias fringe keeps armour, hair and coloured spell effects intact.
    """
    opaque = rgba[:, :, 3] > 0
    rgb = rgba[:, :, :3].astype(np.int16)
    channel_spread = rgb.max(axis=2) - rgb.min(axis=2)
    brightness = rgb.mean(axis=2)
    bright_neutral = opaque & (rgb.min(axis=2) >= 170) & (channel_spread <= 36)
    artifact_seed = np.zeros_like(bright_neutral)
    for component in connected_components(bright_neutral):
        ys = [point[0] for point in component]
        xs = [point[1] for point in component]
        component_width = max(xs) - min(xs) + 1
        component_height = max(ys) - min(ys) + 1
        is_flat_ground_remnant = (
            len(component) >= 12
            and min(ys) >= FRAME_HEIGHT * 0.45
            and component_width >= 12
            and component_height <= 8
            and component_width >= component_height * 3
        )
        if len(component) >= minimum_area or is_flat_ground_remnant:
            for y, x in component:
                artifact_seed[y, x] = True

    if not artifact_seed.any():
        return rgba

    neutral_fringe = opaque & (brightness >= 68) & (channel_spread <= 58)
    artifact = artifact_seed.copy()
    for _ in range(8):
        artifact |= dilate(artifact, 1) & neutral_fringe
    # Clear the final semitransparent edge as well, but do not cross coloured
    # actor outlines into the character itself.
    artifact |= dilate(artifact, 1) & opaque & (channel_spread <= 70)
    rgba[artifact] = 0
    return rgba


def normalize_baseline_artifacts(rgba: np.ndarray) -> np.ndarray:
    """Turn generated grey contact strips into a subtle dark grounding shadow."""
    opaque = rgba[:, :, 3] > 0
    bounds = main_component_bounds(opaque)
    if bounds is None:
        return rgba
    component_bottom = bounds[3] - 1
    # The generator's contact strip occupies only the final 2-3 scanlines.
    # Restrict cleanup to that band so dark pixels belonging to boots/hooves
    # remain authored character detail rather than being mistaken for shadow.
    band_top = max(0, component_bottom - 4)
    rgb = rgba[:, :, :3].astype(np.int16)
    brightness = rgb.mean(axis=2)
    band = np.zeros_like(opaque)
    band[band_top:component_bottom + 1, :] = True
    # Only neutral, reasonably bright pixels in the final three scanlines are
    # generator contact paint. Saturated orange toes and violet energy remain.
    artifact = (
        band
        & opaque
        & ((rgb.max(axis=2) - rgb.min(axis=2)) <= 80)
        & (brightness >= 64)
    )
    if not artifact.any():
        return rgba
    rgba[artifact, :3] = np.array([14, 11, 20], dtype=np.uint8)
    rgba[artifact, 3] = np.minimum(rgba[artifact, 3], 112)
    return rgba


def normalize_frame(
    frame: Image.Image,
    minimum_run: int,
    restore_radius: int,
    align_baseline: bool,
) -> Image.Image:
    rgba = np.array(frame.convert("RGBA"))
    opaque = rgba[:, :, 3] > 0
    horizontal_artifacts = horizontal_run_mask(rgba, minimum_run)
    vertical_artifacts = horizontal_run_mask(np.transpose(rgba, (1, 0, 2)), minimum_run).T
    clean_seed = opaque & ~(horizontal_artifacts | vertical_artifacts)
    retained = dilate(clean_seed, restore_radius) & opaque
    rgba[~retained] = 0
    rgba = remove_large_neutral_artifacts(rgba)
    if align_baseline:
        rgba = normalize_baseline_artifacts(rgba)

    normalized = Image.fromarray(rgba, "RGBA")
    bounds = main_component_bounds(np.array(normalized)[:, :, 3] > 0)
    if bounds is None:
        return normalized

    if not align_baseline:
        return normalized

    # A shared cell baseline prevents vertical jitter while keeping authored x motion.
    desired_shift = TARGET_BASELINE - (bounds[3] - 1)
    shift_y = max(-bounds[1], min(FRAME_HEIGHT - bounds[3], desired_shift))
    if shift_y == 0:
        return normalized
    translated = Image.new("RGBA", normalized.size)
    translated.alpha_composite(normalized, (0, shift_y))
    return translated


def normalize_atlas(source: Path, destination: Path, minimum_run: int, restore_radius: int) -> None:
    with Image.open(source) as opened:
        atlas = opened.convert("RGBA")
    expected_size = (FRAME_WIDTH * ATLAS_COLUMNS, FRAME_HEIGHT * ATLAS_ROWS)
    if atlas.size != expected_size:
        raise ValueError(f"{source.name}: expected {expected_size}, got {atlas.size}")

    output = Image.new("RGBA", expected_size)
    for row in range(ATLAS_ROWS):
        for column in range(ATLAS_COLUMNS):
            left = column * FRAME_WIDTH
            top = row * FRAME_HEIGHT
            frame = atlas.crop((left, top, left + FRAME_WIDTH, top + FRAME_HEIGHT))
            output.alpha_composite(
                normalize_frame(
                    frame,
                    minimum_run,
                    restore_radius,
                    row not in AIRBORNE_ROWS.get(source.stem, set()),
                ),
                (left, top),
            )

    destination.parent.mkdir(parents=True, exist_ok=True)
    output.save(destination, "WEBP", lossless=True, method=6, quality=100)

    if source.stem != "core-battle-atlas":
        summon_strip = output.crop((0, FRAME_HEIGHT * 5, FRAME_WIDTH * ATLAS_COLUMNS, FRAME_HEIGHT * 6))
        strip_path = destination.with_name(f"{source.stem}-summon-strip.webp")
        summon_strip.save(strip_path, "WEBP", lossless=True, method=6, quality=100)


def create_contact_sheet(atlases: list[Path], destination: Path) -> None:
    scale = 0.25
    thumb_size = (round(FRAME_WIDTH * ATLAS_COLUMNS * scale), round(FRAME_HEIGHT * ATLAS_ROWS * scale))
    sheet = Image.new("RGBA", (thumb_size[0], thumb_size[1] * len(atlases)), (10, 11, 16, 255))
    draw = ImageDraw.Draw(sheet)
    for index, atlas_path in enumerate(atlases):
        with Image.open(atlas_path) as atlas:
            thumb = atlas.convert("RGBA").resize(thumb_size, Image.Resampling.NEAREST)
        y = index * thumb_size[1]
        sheet.alpha_composite(thumb, (0, y))
        draw.text((6, y + 6), atlas_path.stem, fill=(255, 233, 200, 255), stroke_width=2, stroke_fill=(0, 0, 0, 255))
    destination.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(destination, "PNG")


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize generated Idle RPG keyframe atlases.")
    parser.add_argument("source", type=Path, help="Directory containing source PNG atlases")
    parser.add_argument("destination", type=Path, help="Directory for runtime lossless WebP atlases")
    parser.add_argument("--qa-sheet", type=Path)
    parser.add_argument("--minimum-run", type=int, default=14)
    parser.add_argument("--restore-radius", type=int, default=5)
    args = parser.parse_args()

    outputs: list[Path] = []
    for source in sorted(args.source.resolve().glob("*.png")):
        destination = args.destination.resolve() / f"{source.stem}.webp"
        normalize_atlas(source, destination, args.minimum_run, args.restore_radius)
        outputs.append(destination)
        print(f"normalized {source.name} -> {destination.name} ({destination.stat().st_size} bytes)")
    if args.qa_sheet:
        create_contact_sheet(outputs, args.qa_sheet.resolve())
        print(f"qa sheet -> {args.qa_sheet.resolve()}")


if __name__ == "__main__":
    main()
