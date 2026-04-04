---
name: roomio-architecture
description: Comprehensive architecture guide for the Roomio 2D Floor Plan Designer — module map, data flow, rendering pipeline, and extension patterns.
---

# Roomio — Architecture & Codebase Reference

## Overview

**Roomio** is a professional, zero-install browser-based 2D architectural floor plan designer. It uses vanilla HTML5 Canvas, CSS, and JavaScript — no frameworks, no build step, no backend. The entire app is a static site that can be opened directly from `index.html`.

**Version**: 2.1.0  
**License**: MIT

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Structure | Vanilla HTML5 |
| Rendering | HTML5 Canvas 2D API |
| Styling | Vanilla CSS with CSS Custom Properties |
| Logic | Vanilla ES6+ JavaScript (classes, modules via `<script>` tags) |
| Icons | [Lucide](https://lucide.dev/) via CDN (`unpkg.com`) |
| Fonts | [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts |
| Dev Server | `npx live-server` (zero install) |
| Deployment | Netlify, Vercel, GitHub Pages, or any static host |

---

## Script Load Order (Critical)

Scripts are loaded via `<script>` tags in `index.html` in **strict dependency order**:

```
1. event-bus.js     → Pub/sub infrastructure (singleton: `appEvents`)
2. elements.js      → Declarative element registry (singleton: `ElementRegistry`)
3. canvas-engine.js → Core rendering, hit detection, grid, Vastu (class: `CanvasEngine`)
4. tools.js         → Mouse/keyboard interaction logic (class: `ToolsManager`)
5. app.js           → UI wiring, tabs, panels, I/O (DOMContentLoaded closure)
```

Each module depends only on the ones loaded before it. There is **no ES module import/export** — all classes and singletons are global.

---

## Module Responsibilities

### 1. `event-bus.js` (48 lines)
- **Purpose**: Lightweight pub/sub decoupling layer
- **Singleton**: `appEvents` (global `EventBus` instance)
- **API**:
  - `appEvents.on(event, callback)` → returns unsubscribe function
  - `appEvents.off(event, callback)`
  - `appEvents.emit(event, ...args)`
- **Note**: Currently registered but underutilized — most communication still uses direct callbacks. Future work should migrate to event-driven communication.

### 2. `elements.js` (222 lines)
- **Purpose**: Declarative registry for all placeable furniture/fixture elements
- **Singleton**: `ElementRegistry`
- **API**:
  - `ElementRegistry.register(definition)` — register a new element type
  - `ElementRegistry.get(id)` — look up element by ID
  - `ElementRegistry.getAll()` — get all registered elements
  - `ElementRegistry.ids()` — get all registered element IDs
- **Current elements**: `door`, `window`, `stairs`, `bed`, `table`, `bookshelf`, `commode`, `washing_machine`, `chair`, `sofa`, `text`
- **Element definition shape**:
  ```javascript
  {
    id: string,           // tool ID and subType identifier
    name: string,         // display label
    icon: string,         // Lucide icon name
    width: number,        // default width in pixels
    height: number,       // default height in pixels
    extraProps?: object,  // additional properties (e.g., { text: 'Label', fontSize: 16 })
    draw(ctx, hw, hh, w, h, scale, shape, colors) // custom Canvas 2D drawing
  }
  ```
- **Draw function coordinate system**: Origin is at the center of the object. `hw` = half-width, `hh` = half-height. Drawing happens in local transformed space (rotation and flip already applied by engine).

### 3. `canvas-engine.js` (761 lines)
- **Purpose**: Core rendering engine, scene management, hit testing, coordinate transforms
- **Class**: `CanvasEngine`
- **Constructor**: `new CanvasEngine(canvasElement)`
- **Key state**:
  - `scene: Array` — flat array of all scene objects
  - `selectedItems: Array` — currently selected objects
  - `scale: number` — zoom level (0.1–5.0)
  - `offsetX, offsetY: number` — pan offset
  - `gridSize: number` — 25 (pixels per foot)
  - `showVastu: boolean` — Vastu grid overlay toggle
  - `northAngle: number` — compass north offset (0–359°)
  - `bgColor: string` — canvas background color (hex)
  - `undoStack: Array` — undo history (max 50 snapshots)
- **Key methods**:
  - `addShape(shape)` — add object to scene (auto-snapshots for undo)
  - `removeShape(shape)` — remove object from scene
  - `clearScene()` — remove all objects
  - `undo()` — restore previous scene state from undo stack
  - `selectItem(item, keepExisting?)` — select/toggle item
  - `setSelection(items)` — set selection to exact list
  - `clearSelection()` — deselect all
  - `deleteSelected()` — remove selected items
  - `hitTest(x, y)` — find topmost item at point
  - `hitTestBox(x1, y1, x2, y2)` — find items in rectangle
  - `render(drawBackgroundAndGrid?)` — redraw entire canvas
  - `snap(value)` — snap coordinate to grid
  - `pixelsToFeet(px)` — convert px to architectural notation (e.g., `5' 4"`)
  - `exportToDataURL()` — export canvas to PNG data URL
  - `zoomAtPosition(x, y, newScale)` — zoom centered on point
  - `setZoom(level)` — zoom centered on canvas
- **Callbacks (set by `app.js`)**:
  - `onSelectionChange(items)` — selection changed
  - `onSceneChange()` — scene modified
  - `activeOverlayCallback(ctx)` — draw tool overlays (set by `ToolsManager`)
- **Rendering pipeline**:
  1. Clear canvas with background color
  2. Update contrast colors (cached, only recomputes on bgColor change)
  3. Apply pan/zoom transform
  4. Draw grid
  5. Draw all scene items (`drawShape()` → `drawObject()` for elements)
  6. Draw multi-selection bounding box
  7. Draw active tool overlay
  8. Draw Vastu grid (if enabled)
  9. Draw corner angles at wall intersections

### 4. `tools.js` (489 lines)
- **Purpose**: All mouse/keyboard interaction: drawing, selection, drag, resize, copy/paste
- **Class**: `ToolsManager`
- **Constructor**: `new ToolsManager(engine)`
- **Key state**:
  - `currentTool: string` — active tool name
  - `state: object` — temporary drawing/interaction state
  - `clipboard: Array` — copied items for paste
  - `isSpaceDown: boolean` — space bar held for pan mode
- **Tools**:
  - `select` — click to select, drag to move, corners to resize, marquee box select
  - `pan` — drag to pan canvas
  - `wall` — click-drag to draw wall
  - `room` — click-drag to draw room rectangle
  - `measure` — click-drag to draw measurement line
  - `delete` — delete selected items (immediately switches back to select)
  - Any `ElementRegistry` ID — places that element at click position
- **Keyboard shortcuts** (not active when input/textarea focused):
  - `Ctrl+Z` — undo last action
  - `Ctrl+C` — copy selected
  - `Ctrl+X` — cut selected
  - `Ctrl+V` — paste with grid-unit offset
  - `Delete` / `Backspace` — delete selected
  - `Escape` — clear selection / cancel drawing
  - `Space` (hold) — temporary pan mode

### 5. `app.js` (~795 lines)
- **Purpose**: UI wiring, tab management, properties panel, JSON editor, settings, undo
- **Structure**: Single `DOMContentLoaded` closure
- **Systems**:
  - **Project name**: Editable input in sidebar header, saved/loaded with project
  - **Undo button**: UI button + Ctrl+Z wired to `engine.undo()`
  - **Tab system**: `Map<tabId, { name, scene }>` — multi-tab design workspace
  - **Properties panel**: Dynamic UI updates on selection change
  - **Floating JSON editor**: Live bidirectional sync with scene (debounced 600ms)
  - **Sidebar collapse**: Show/hide toolbar
  - **Settings**: Wall thickness, line type, background color, north angle
  - **Project I/O**: Save ALL designs to single JSON, load multi-design projects, export PNG
  - **Rotate/flip**: 90° rotation, horizontal/vertical flip for objects

### 6. `style.css` (664 lines)
- **Purpose**: Complete design system and component styles
- **Design tokens** (CSS custom properties):
  ```css
  --bg-dark: #121214
  --bg-canvas: #1e1e22
  --panel-bg: rgba(30, 30, 34, 0.85)
  --primary: #6366f1
  --primary-hover: #4f46e5
  --text-main: #f8fafc
  --text-muted: #94a3b8
  --border-color: #334155
  --border-light: rgba(255, 255, 255, 0.1)
  --danger: #ef4444
  ```
- **Key layout**: `flex` row → sidebar (260px fixed) + canvas (flex: 1)
- **Components**: toolbar, tool buttons, tabs, properties panel, compass, floating JSON editor, sliders, badges

---

## Scene Data Model

The scene is a **flat JSON array** of shape objects. No nesting, no circular references — fully serializable.

### Shape Types

#### Wall
```json
{
  "id": "wall-abc123",
  "type": "wall",
  "startX": 100,
  "startY": 100,
  "endX": 500,
  "endY": 100,
  "thickness": 9,
  "lineType": "solid",    // "solid" | "dotted"
  "altitude": 8           // height in feet (metadata)
}
```

#### Room
```json
{
  "id": "room-abc123",
  "type": "room",
  "x": 100,
  "y": 100,
  "width": 300,
  "height": 200
}
```

#### Object (Element)
```json
{
  "id": "obj-abc123",
  "type": "object",
  "subType": "door",      // matches ElementRegistry ID
  "x": 200,
  "y": 300,
  "width": 75,
  "height": 25,
  "rotation": 0,          // 0, 90, 180, 270
  "flipX": false,
  "flipY": false
}
```

#### Text Object
```json
{
  "id": "obj-abc123",
  "type": "object",
  "subType": "text",
  "x": 100,
  "y": 100,
  "width": 120,
  "height": 30,
  "rotation": 0,
  "text": "Living Room",
  "fontSize": 16
}
```

#### Measurement Line
```json
{
  "id": "measure-abc123",
  "type": "measure",
  "startX": 100,
  "startY": 100,
  "endX": 400,
  "endY": 100
}
```

### Coordinate System
- **Grid**: 25px = 1 foot
- **Snapping**: 1-inch precision (`gridSize / 12 ≈ 2.083px`)
- **Origin**: Top-left of canvas (before pan/zoom transform)
- **Dimensions**: Display as architectural notation: `5' 4"`, `10"`, `8'`

---

## ID Generation Pattern
All IDs use the format: `{type}-{random9chars}`
```javascript
`${type}-${Math.random().toString(36).substr(2, 9)}`
```

---

## Contrast/Color System
The engine auto-adapts colors based on `bgColor`:
- Uses **ITU-R BT.709 Luma** to determine light vs dark background
- Generates complementary colors for walls, components, grid, text
- Cached (`_lastBgColor`) — only recomputes when bgColor changes
- Key derived colors: `compColor`, `wallColor`, `compFill`, `baseText`, `gridColor`, `exportWallColor`

---

## Deployment Configuration

### Netlify (`netlify.toml`)
```toml
[build]
  publish = "."
  command = "echo 'Static site, no build needed'"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Vercel (`vercel.json`)
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

---

## File Size Reference

| File | Size | Lines |
|------|------|-------|
| `index.html` | 17.5 KB | 297 |
| `style.css` | 13.7 KB | 664 |
| `canvas-engine.js` | 30.0 KB | 761 |
| `app.js` | 28.5 KB | 682 |
| `tools.js` | 21.1 KB | 489 |
| `elements.js` | 5.8 KB | 222 |
| `event-bus.js` | 1.2 KB | 48 |
