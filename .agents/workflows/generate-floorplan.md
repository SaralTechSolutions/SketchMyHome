---
description: How to generate a floor plan scene JSON programmatically for Roomio
---

# Generating Floor Plans Programmatically

## Prerequisites
Read the scene data skill: `.agents/skills/scene-data/SKILL.md`

## Steps

1. **Understand the coordinate system**:
   - 25 pixels = 1 foot
   - 1 inch ≈ 2.083 pixels
   - Origin (0,0) is at top-left of infinite canvas
   - Positive X = right, Positive Y = down

2. **Plan the layout** using feet, then convert to pixels:
   - `pixels = feet × 25`
   - Example: 20' × 30' house → 500px × 750px

3. **Build the JSON array** with these shape types in order:
   - **Outer boundary walls** — 4 walls forming the perimeter
   - **Inner partition walls** — walls dividing rooms
   - **Rooms** — rectangles for labeling room areas
   - **Doors** — objects at wall gaps (break the wall into segments with a gap)
   - **Windows** — objects placed on walls
   - **Furniture** — beds, tables, chairs, etc.

4. **Wall connection rules**:
   - Walls connect visually when endpoints share **exact same coordinates**
   - For a door opening: create two wall segments with a gap between them
   - Corner angles auto-display when exactly 2 walls meet at a point

5. **Example: Simple room with a door**:
```json
[
  {"id":"wall-001","type":"wall","startX":100,"startY":100,"endX":600,"endY":100,"thickness":9,"altitude":8},
  {"id":"wall-002","type":"wall","startX":100,"startY":100,"endX":100,"endY":400,"thickness":9,"altitude":8},
  {"id":"wall-003","type":"wall","startX":100,"startY":400,"endX":350,"endY":400,"thickness":9,"altitude":8},
  {"id":"wall-004","type":"wall","startX":425,"startY":400,"endX":600,"endY":400,"thickness":9,"altitude":8},
  {"id":"wall-005","type":"wall","startX":600,"startY":100,"endX":600,"endY":400,"thickness":9,"altitude":8},
  {"id":"room-001","type":"room","x":100,"y":100,"width":500,"height":300},
  {"id":"obj-001","type":"object","subType":"door","x":312.5,"y":387.5,"width":75,"height":25,"rotation":0}
]
```

6. **Save the JSON** to a `.json` file or paste into the Live JSON Editor

7. **Load and verify** in Roomio:
   - Open Roomio → Load Project → select the JSON file
   - Or: toggle Live Editor → paste the JSON array

## Quick Reference: Common Sizes

| Real-World | Pixels |
|-----------|--------|
| 1 foot | 25 px |
| 3 feet (standard door) | 75 px |
| 4 feet (standard window) | 100 px |
| 6 inches (inner wall) | ~12.5 px |
| 9 inches (standard wall) | ~18.75 px |
| 10 feet (small room) | 250 px |
| 15 feet (medium room) | 375 px |
| 20 feet (large room) | 500 px |

## Thickness Reference

| Inches | Pixel Thickness |
|--------|----------------|
| 6 | 12.5 |
| 9 | 18.75 |
| 12 | 25 |
| 18 | 37.5 |

> **Note**: Wall thickness is stored in pixels but the UI slider shows inches. Formula: `px = inches × (25/12)`
