---
name: scene-data
description: Scene data model reference for Roomio — JSON schemas for all shape types, coordinate system, ID patterns, and serialization rules.
---

# Scene Data Model Reference

## Overview

The Roomio scene is stored as a **flat JSON array** of shape objects. There is no nesting, no tree structure, no circular references. The array is directly serializable and is the save/load format.

The scene array lives at `engine.scene` and is synced to the active tab via `tabs.get(activeTabId).scene`.

---

## Shape Types

### 1. Wall

A line segment with thickness, used for structural walls.

```json
{
  "id": "wall-abc123def",
  "type": "wall",
  "startX": 325,
  "startY": 25,
  "endX": 750,
  "endY": 25,
  "thickness": 9,
  "lineType": "solid",
  "altitude": 8
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique ID: `wall-{random9}` |
| `type` | `"wall"` | ✅ | Shape type discriminator |
| `startX` | number | ✅ | Start point X (pixels) |
| `startY` | number | ✅ | Start point Y (pixels) |
| `endX` | number | ✅ | End point X (pixels) |
| `endY` | number | ✅ | End point Y (pixels) |
| `thickness` | number | ✅ | Line thickness (pixels). Converted from inches: `inches * (25/12)` |
| `lineType` | `"solid"` \| `"dotted"` | ❌ | Default: `"solid"` |
| `altitude` | number | ❌ | Wall height in feet (metadata only). Default: `8` |

**Thickness conversion**: The sidebar slider value is in **inches**. The stored thickness is in **pixels**: `thickness_px = inches * (gridSize / 12)` where `gridSize = 25`.

### 2. Room

An axis-aligned rectangle representing a room area.

```json
{
  "id": "room-abc123def",
  "type": "room",
  "x": 100,
  "y": 100,
  "width": 300,
  "height": 200
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique ID: `room-{random9}` |
| `type` | `"room"` | ✅ | Shape type discriminator |
| `x` | number | ✅ | Top-left X (pixels) |
| `y` | number | ✅ | Top-left Y (pixels) |
| `width` | number | ✅ | Width (pixels) |
| `height` | number | ✅ | Height (pixels) |

### 2b. Site boundary (lot)

Closed polygon for the property outline (any angles and side lengths). Legacy projects may store an axis-aligned rectangle as `x`, `y`, `width`, `height` instead of `points`; the engine treats that as four corners.

```json
{
  "id": "boundary-abc123def",
  "type": "boundary",
  "points": [
    { "x": 0, "y": 0 },
    { "x": 400, "y": 0 },
    { "x": 450, "y": 200 },
    { "x": 50, "y": 350 }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique ID: `boundary-{random9}` |
| `type` | `"boundary"` | ✅ | Shape type discriminator |
| `points` | `{x,y}[]` | ✅ (preferred) | At least 3 vertices; edges join consecutive vertices and close back to the first |
| `x`, `y`, `width`, `height` | number | legacy | Rectangle form when `points` is absent |

### 3. Object (Element)

A placeable furniture/fixture element from the registry.

```json
{
  "id": "obj-abc123def",
  "type": "object",
  "subType": "door",
  "x": 200,
  "y": 300,
  "width": 75,
  "height": 25,
  "rotation": 90,
  "flipX": false,
  "flipY": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique ID: `obj-{random9}` |
| `type` | `"object"` | ✅ | Shape type discriminator |
| `subType` | string | ✅ | ElementRegistry ID (e.g., `"door"`, `"bed"`, `"text"`) |
| `x` | number | ✅ | Top-left X (pixels) |
| `y` | number | ✅ | Top-left Y (pixels) |
| `width` | number | ✅ | Width (pixels) — swaps with height on 90°/270° rotation |
| `height` | number | ✅ | Height (pixels) — swaps with width on 90°/270° rotation |
| `rotation` | number | ❌ | Degrees: `0`, `90`, `180`, `270`. Default: `0` |
| `flipX` | boolean | ❌ | Horizontal flip. Default: `false` |
| `flipY` | boolean | ❌ | Vertical flip. Default: `false` |

**Text objects** have additional properties:

| Field | Type | Description |
|-------|------|-------------|
| `text` | string | The displayed text content |
| `fontSize` | number | Font size in pixels (8–72) |

### 4. Measurement Line

A non-structural reference line for dimensioning.

```json
{
  "id": "measure-abc123def",
  "type": "measure",
  "startX": 100,
  "startY": 100,
  "endX": 400,
  "endY": 100
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique ID: `measure-{random9}` |
| `type` | `"measure"` | ✅ | Shape type discriminator |
| `startX` | number | ✅ | Start point X (pixels) |
| `startY` | number | ✅ | Start point Y (pixels) |
| `endX` | number | ✅ | End point X (pixels) |
| `endY` | number | ✅ | End point Y (pixels) |

---

## ID Generation

```javascript
`${type}-${Math.random().toString(36).substr(2, 9)}`
```

Examples: `wall-0i5lzdo3l`, `obj-p3fq67dct`, `room-cogcy72fo`, `measure-abc123def`

> **Note**: Some older IDs use `object-` prefix instead of `obj-`. Both work.

---

## Coordinate System

- **Unit**: Pixels
- **Grid size**: `25 px = 1 foot = 12 inches`
- **1 inch**: `25/12 ≈ 2.0833 px`
- **Snap increment**: 1 inch (≈2.083 px)
- **Origin**: Top-left corner of the infinite canvas (before pan/zoom)
- **Positive X**: Right
- **Positive Y**: Down

### Pixel ↔ Feet Conversion

```javascript
// Pixels to architectural notation
const totalInches = Math.round(px / (25 / 12));
const ft = Math.floor(totalInches / 12);
const inches = totalInches % 12;
// Output: "5' 4\"", "10\"", "8'"

// Feet to pixels
const px = feet * 25;

// Inches to pixels
const px = inches * (25 / 12);
```

---

## Programmatic Scene Manipulation

### Adding shapes from code (via Live JSON Editor)

The Live JSON Editor (`toggle-json-sidebar` button) allows direct editing of the scene array. Paste valid JSON to instantly place objects:

```json
[
  {
    "id": "wall-manual001",
    "type": "wall",
    "startX": 100,
    "startY": 100,
    "endX": 600,
    "endY": 100,
    "thickness": 9,
    "altitude": 8
  },
  {
    "id": "room-manual001",
    "type": "room",
    "x": 100,
    "y": 100,
    "width": 500,
    "height": 300
  }
]
```

### Creating a complete floor plan programmatically

To generate a floor plan via code or AI, construct the JSON array following these patterns:

1. **Outer boundary**: 4 walls forming a rectangle
2. **Inner walls**: Walls connecting to boundary/other walls
3. **Rooms**: Rectangles inside walls for labeling
4. **Doors**: Objects with `subType: "door"` placed at wall gaps
5. **Windows**: Objects with `subType: "window"` placed on walls
6. **Furniture**: Objects placed inside rooms

**Wall connection tip**: Walls connect visually when endpoints share exact coordinates. Use the same pixel values for connecting points.

---

## Save/Load Format

The save file is a **project object** (v2.1.0+) with `.json` extension. Filename: `{ProjectName}.json`.

### Current Format (v2.1.0+) — Multi-Design Project

```json
{
  "version": "2.1.0",
  "projectName": "My Home",
  "activeDesignIndex": 0,
  "settings": {
    "bgColor": "#1e1e22",
    "northAngle": 45,
    "showVastu": false,
    "wallThickness": 9,
    "wallLineType": "solid"
  },
  "designs": [
    {
      "id": 0,
      "name": "Ground Floor",
      "scene": [
        { "id": "wall-abc", "type": "wall", ... },
        ...
      ]
    },
    {
      "id": 1,
      "name": "First Floor",
      "scene": [ ... ]
    }
  ]
}
```

### v2.0.0 Format (single-scene, still loadable)

```json
{
  "version": "2.0.0",
  "settings": { ... },
  "scene": [ ... ]
}
```

### Legacy Format (v1.x, still loadable)

A flat JSON array:

```json
[
  { "id": "wall-abc", "type": "wall", ... },
  ...
]
```

The loader auto-detects format:
1. `Array` → legacy v1 (loads into current tab)
2. Object with `designs` array → v2.1.0+ (restores all tabs)
3. Object with `scene` array → v2.0.0 (loads into current tab)

### Top-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | Format version (`"2.1.0"`) |
| `projectName` | string | User-defined project name (used in filename) |
| `activeDesignIndex` | number | Index of the last-active design tab |
| `settings` | object | Global settings (see below) |
| `designs` | array | Array of design objects |

### Settings Fields

| Field | Type | Description |
|-------|------|-------------|
| `bgColor` | string | Canvas background color (hex, e.g., `"#1e1e22"`) |
| `northAngle` | number | Compass north offset in degrees (0–359) |
| `showVastu` | boolean | Whether Vastu grid overlay is visible |
| `wallThickness` | number | Default wall thickness in inches |
| `wallLineType` | `"solid"` \| `"dotted"` | Default wall line style |

### Design Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Tab ID (internal, auto-assigned on load) |
| `name` | string | Design/tab name (e.g., "Ground Floor") |
| `scene` | array | Scene array for this design |

Sample legacy project files are available in `outputs/`:
- `outputs/home.json` — Complete home floor plan example (v1 format)

### Decimal Precision

All coordinate and thickness values are guaranteed to have **at most 2 decimal places**. The `snap()` function applies `Math.round(v * 100) / 100` to eliminate floating-point artifacts.

---

## Hit Testing Behavior

- **Rooms and Objects**: Tested by bounding box (`x ≤ click ≤ x+width`, `y ≤ click ≤ y+height`)
- **Walls and Measures**: Tested by distance to line segment (8px tolerance)
- **Z-order**: Scene array index (last item = topmost). `hitTest` iterates backwards to find topmost hit.
