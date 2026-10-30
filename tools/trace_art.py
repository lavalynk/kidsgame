#!/usr/bin/env python3
"""
Turn coloring-book line art into tappable coloring pages.

    python3 tools/trace_art.py

Reads every image in art/ (png, jpg, jpeg, webp) and writes coloring/traced.js.
Each image becomes one coloring page:

  * every enclosed white area (head, ear, belly, sky...) becomes its own
    tappable region,
  * the black outlines become one line layer drawn on top,
  * the area outside the drawing becomes the colorable background.

The file name is the animal's id and name:  art/red-dragon.png -> "Red Dragon".
If an animal with the same id is hand-drawn in coloring/animals.js, the traced
version replaces it.

Best results: thick black outlines that fully close every shape, plain white
background, no shading or gray fills. See art/README.md.

Needs: opencv-python, numpy  (pip install opencv-python-headless numpy)
"""

import json
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
ART_DIR = ROOT / "art"
OUT_FILE = ROOT / "coloring" / "traced.js"

CANVAS = 400          # game canvas is 400 x 400
WORK_SIZE = 1200      # images are resized so the long side is this many pixels
GAP_SIZES = (5, 9, 15, 21, 29, 41)  # px (at WORK_SIZE): line-break sizes to try closing
MIN_REGION = 0.0003   # regions smaller than this share of the image are ignored (too small to tap)
SIMPLIFY = 1.2        # px tolerance when simplifying outlines (bigger = fewer points)
EXTS = {".png", ".jpg", ".jpeg", ".webp"}


def load_ink(path):
    """Return a boolean mask that is True where the drawing's lines are."""
    img = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if img is None:
        raise ValueError("could not read image")
    # Transparent PNGs: treat transparent pixels as white paper.
    if img.ndim == 3 and img.shape[2] == 4:
        alpha = img[:, :, 3:4].astype(np.float32) / 255
        rgb = img[:, :, :3].astype(np.float32)
        img = (rgb * alpha + 255 * (1 - alpha)).astype(np.uint8)
    gray = img if img.ndim == 2 else cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    h, w = gray.shape
    scale = WORK_SIZE / max(h, w)
    gray = cv2.resize(gray, (round(w * scale), round(h * scale)),
                      interpolation=cv2.INTER_AREA if scale < 1 else cv2.INTER_CUBIC)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)
    # Lines = pixels clearly darker than the paper around them. Comparing against the
    # local neighborhood (not one global cut-off) handles photos with uneven lighting.
    paper = cv2.medianBlur(gray, 61)
    ink = ((paper.astype(np.int16) - gray) > 45).astype(np.uint8) * 255
    ink = cv2.morphologyEx(ink, cv2.MORPH_CLOSE,
                           cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))

    # Drop tiny specks (noise, dust) and the edges of the card / paper if the photo
    # caught them: long thin strips hugging the image border.
    H, W = ink.shape
    n, labels, stats, _ = cv2.connectedComponentsWithStats(ink, connectivity=8)
    for i in range(1, n):
        x, y, bw, bh, area = stats[i]
        m = 0.04 * max(W, H)  # "near the border"
        on_edge = x <= m or y <= m or x + bw >= W - m or y + bh >= H - m
        thin_strip = (bw < 0.03 * W and bh > 0.1 * H) or (bh < 0.03 * H and bw > 0.1 * W)
        # a frame / card border drawn around the whole picture
        frame = False
        if bw > 0.85 * W and bh > 0.85 * H:
            # it's a frame only if nearly all of it hugs the outer edges
            ys_, xs_ = np.nonzero(labels == i)
            band = 0.1 * min(W, H)
            near = (xs_ < band) | (ys_ < band) | (xs_ > W - band) | (ys_ > H - band)
            frame = near.mean() > 0.9
        if area < 40 or (on_edge and thin_strip) or frame:
            ink[labels == i] = 0
    return ink


def contours_to_path(mask, to_canvas):
    """Outline a mask as one SVG path (holes handled with even-odd fill)."""
    contours, _ = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    parts = []
    for c in contours:
        if cv2.contourArea(c) < 12:
            continue
        c = cv2.approxPolyDP(c, SIMPLIFY, True)
        if len(c) < 3:
            continue
        pts = [to_canvas(p[0][0], p[0][1]) for p in c]
        parts.append("M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + "Z")
    return "".join(parts)


def trace(path):
    ink = load_ink(path)

    # Zoom in on the drawing: crop to the lines plus a small margin, so the
    # animal fills the page no matter how much empty paper the image had.
    ys, xs = np.nonzero(ink)
    if len(xs):
        pad = int(0.06 * max(np.ptp(xs), np.ptp(ys)))
        x0, x1 = max(0, xs.min() - pad), min(ink.shape[1], xs.max() + pad + 1)
        y0, y1 = max(0, ys.min() - pad), min(ink.shape[0], ys.max() + pad + 1)
        ink = ink[y0:y1, x0:x1]
    h, w = ink.shape

    # Fit the drawing inside the 400x400 canvas, centered.
    s = CANVAS / max(h, w)
    ox, oy = (CANVAS - w * s) / 2, (CANVAS - h * s) / 2
    to_canvas = lambda x, y: (x * s + ox, y * s + oy)

    # Close gaps in the lines so colors don't leak between parts (or out into the
    # background). Small gaps are common; some drawings leave bigger ones, e.g. where
    # a stem meets an apple. Try a few closing sizes and take the smallest one that
    # captures (nearly) as much colorable area as the best one.
    min_area = MIN_REGION * h * w

    def split_paper(gap):
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (gap, gap))
        paper = cv2.bitwise_not(cv2.dilate(ink, k))
        n, labels, stats, _ = cv2.connectedComponentsWithStats(paper, connectivity=4)
        inside = 0
        for i in range(1, n):
            x, y, bw, bh, area = stats[i]
            if not (x == 0 or y == 0 or x + bw >= w or y + bh >= h) and area >= min_area:
                inside += area
        return inside, (n, labels, stats)

    tries = {g: split_paper(g) for g in GAP_SIZES}
    best = max(v[0] for v in tries.values())
    gap = next(g for g in GAP_SIZES if tries[g][0] >= 0.85 * best)
    n, labels, stats = tries[gap][1]
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (gap, gap))
    grow = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (gap + 4, gap + 4))

    # Eye highlights: a white dot sitting inside a solid black blob (a pupil).
    # For each separate piece of ink, measure how "solid" it is: ink area vs. the
    # area its outer edge encloses. Outlines are hollow (low), pupils are solid (high).
    n_ink, ink_labels, ink_stats, _ = cv2.connectedComponentsWithStats(ink, connectivity=8)
    solidity = {}

    def ink_solidity(j):
        if j not in solidity:
            blob = (ink_labels == j).astype(np.uint8) * 255
            outer, _ = cv2.findContours(blob, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            filled = np.zeros_like(blob)
            cv2.drawContours(filled, outer, -1, 255, -1)
            solidity[j] = ink_stats[j, cv2.CC_STAT_AREA] / max(1, np.count_nonzero(filled))
        return solidity[j]

    touch = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (gap + 6, gap + 6))

    # Sort the white areas: real regions, eye shines, and tiny slivers.
    region_masks = {}                 # label -> mask
    slivers = []                      # too small for a finger
    keep_white = np.zeros_like(ink)   # eye shines: stay white, not tappable
    for i in range(1, n):
        x, y, bw, bh, area = stats[i]
        if x == 0 or y == 0 or x + bw >= w or y + bh >= h:
            continue  # outside of the drawing = the background rect
        mask = (labels == i).astype(np.uint8) * 255
        if area < min_area:
            slivers.append(mask)
            continue
        if area < 0.003 * h * w:
            ring = cv2.dilate(mask, touch) & ~mask
            around = ink_labels[(ring > 0) & (ink > 0)]
            if around.size and ink_solidity(int(np.bincount(around).argmax())) > 0.8:
                keep_white |= mask  # white dot inside a solid black blob = eye shine
                continue
        region_masks[i] = mask

    # A sliver joins the biggest-touching neighbor region so it colors along with it
    # (otherwise it shows up as a stray white or background-colored speck).
    owner = np.zeros(labels.shape, np.int32)
    for i, m in region_masks.items():
        owner[m > 0] = i
    reach = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * gap + 9, 2 * gap + 9))
    for m in slivers:
        near = owner[(cv2.dilate(m, reach) > 0) & (owner > 0)]
        if near.size:
            j = int(np.bincount(near).argmax())
            region_masks[j] = region_masks[j] | m

    regions = []
    for i, mask in region_masks.items():
        mask = cv2.dilate(mask, grow)  # tuck the fill under the outline: no white gaps
        d = contours_to_path(mask, to_canvas)
        if d:
            regions.append((int(stats[i][4]), d))

    # Big regions first so small ones (eyes, spots) sit on top of them.
    regions.sort(key=lambda r: -r[0])

    lines = contours_to_path(ink, to_canvas)
    whites = contours_to_path(cv2.dilate(keep_white, grow), to_canvas)
    svg = [f'<rect class="region bg" x="0" y="0" width="{CANVAS}" height="{CANVAS}"/>']
    svg += [f'<path class="region" fill-rule="evenodd" d="{d}"/>' for _, d in regions]
    if whites:
        svg.append(f'<path class="shine" fill-rule="evenodd" d="{whites}"/>')
    svg.append(f'<path class="lineart" fill-rule="evenodd" d="{lines}"/>')
    return "\n".join(svg), len(regions)


def main():
    # optional: trace_art.py [art_dir] [out_file]  (used for testing)
    art_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else ART_DIR
    out_file = Path(sys.argv[2]) if len(sys.argv) > 2 else OUT_FILE
    files = sorted(p for p in art_dir.glob("*") if p.suffix.lower() in EXTS)
    pages, problems = [], []
    for f in files:
        try:
            svg, count = trace(f)
        except Exception as e:  # keep going so one bad image doesn't block the rest
            problems.append(f"{f.name}: {e}")
            continue
        if count < 3:
            problems.append(f"{f.name}: only {count} closed areas found - "
                            "outlines probably have gaps or the background isn't white")
        animal_id = f.stem.lower().replace(" ", "-").replace("_", "-")
        name = animal_id.replace("-", " ").title()
        pages.append({"id": animal_id, "name": name, "svg": svg})
        print(f"  {f.name:30s} -> {count} regions")

    js = [
        "// GENERATED by tools/trace_art.py from the images in art/ - do not edit by hand.",
        "// Re-run the script after adding or changing art.",
        "window.ANIMALS = window.ANIMALS || [];",
        "[",
    ]
    for p in pages:
        js.append(f"  {{ id: {json.dumps(p['id'])}, name: {json.dumps(p['name'])}, "
                  f"traced: true, svg: `<g class=\"traced\">\n{p['svg']}\n</g>` }},")
    js += [
        "].forEach(function (page) {",
        "  // a traced page replaces a hand-drawn animal with the same id",
        "  var i = window.ANIMALS.findIndex(function (a) { return a.id === page.id; });",
        "  if (i >= 0) window.ANIMALS[i] = page; else window.ANIMALS.push(page);",
        "});",
        "",
    ]
    out_file.write_text("\n".join(js))
    print(f"Wrote {out_file} with {len(pages)} page(s).")
    for p in problems:
        print("WARNING:", p)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
