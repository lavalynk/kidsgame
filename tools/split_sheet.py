#!/usr/bin/env python3
"""
Cut a sheet of several coloring pages (a grid) into one image per animal.

    python3 tools/split_sheet.py art/sheets/sheet-01.png 5 4 elephant lion giraffe ...

Arguments: the sheet image, number of columns, number of rows, then one name per
cell, left-to-right and top-to-bottom. Use "-" to skip a cell.
Each cell is saved as art/<name>.png (enlarged, so the tracer gets smooth lines).
Then run tools/trace_art.py.
"""

import sys
from pathlib import Path

import cv2

ROOT = Path(__file__).resolve().parent.parent
INSET = 0.05      # trim this share of each cell's edges (frame lines, gaps, shadows)
UPSCALE = 1       # keep the original pixels; trace_art.py enlarges smoothly itself


def find_framed_cards(img, cols, rows):
    """If every cell has a drawn box around it, return those boxes in reading
    order (left-to-right, top-to-bottom). Otherwise return None."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, ink = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    contours, _ = cv2.findContours(ink, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cell_area = img.shape[0] * img.shape[1] / (cols * rows)
    boxes = [cv2.boundingRect(c) for c in contours]
    boxes = [b for b in boxes if 0.5 * cell_area < b[2] * b[3] < 1.1 * cell_area]
    if len(boxes) != cols * rows:
        return None
    boxes.sort(key=lambda b: b[1])
    ordered = []
    for r in range(rows):
        ordered += sorted(boxes[r * cols:(r + 1) * cols], key=lambda b: b[0])
    return ordered


def main():
    if len(sys.argv) < 5:
        print(__doc__)
        return 1
    sheet, cols, rows, names = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4:]
    if len(names) != cols * rows:
        print(f"Need {cols * rows} names (one per cell), got {len(names)}.")
        return 1

    img = cv2.imread(sheet)
    h, w = img.shape[:2]
    boxes = find_framed_cards(img, cols, rows)
    if boxes:
        print(f"  found {len(boxes)} framed cards - cropping inside each frame")
    else:
        cw, ch = w / cols, h / rows
        boxes = [(int(c * cw), int(r * ch), int(cw), int(ch))
                 for r in range(rows) for c in range(cols)]
    for idx, name in enumerate(names):
        if name == "-":
            continue
        x, y, bw, bh = boxes[idx]
        # trim the frame line / gap at the edges of the cell
        x0, x1 = int(x + bw * INSET), int(x + bw - bw * INSET)
        y0, y1 = int(y + bh * INSET), int(y + bh - bh * INSET)
        cell = img[y0:y1, x0:x1]
        cell = cv2.resize(cell, None, fx=UPSCALE, fy=UPSCALE, interpolation=cv2.INTER_CUBIC)
        out = ROOT / "art" / f"{name}.png"
        cv2.imwrite(str(out), cell)
        print("  saved", out.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
