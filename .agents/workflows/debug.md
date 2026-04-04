---
description: How to debug rendering, interaction, or data issues in Roomio
---

# Debugging Roomio

## Prerequisites
Read the architecture skill: `.agents/skills/architecture/SKILL.md`
Read the scene data skill: `.agents/skills/scene-data/SKILL.md`

## Common Debug Scenarios

### 1. Element Not Rendering
**Check in order:**
1. Is it registered in `ElementRegistry`? → Search `elements.js` for the element `id`
2. Does the `draw()` function work? → Add `console.log` inside the draw function
3. Is `canvas-engine.js > drawObject()` reaching the registry lookup? → Line 547-557
4. Is the shape in the scene array? → Open Live JSON Editor (Code button) to inspect

### 2. Element Not Placeable (Click Does Nothing)
**Check in order:**
1. Does the sidebar button have `data-tool` matching the registry `id`? → Check `index.html`
2. Is `tools.js > onMouseDown()` handling the tool? → Line 144 checks `ElementRegistry.get(this.currentTool)`
3. Is the tool button activating? → Check `.tool-btn` click handler in `app.js` (line 161-174)

### 3. Selection/Drag Not Working
**Check in order:**
1. Is `hitTest()` finding the shape? → Check `canvas-engine.js` line 242-263
2. What's the shape type? → `hitTest` handles `room`/`object` (bounding box) and `wall`/`measure` (line distance)
3. Is the shape occluded? → `hitTest` iterates backwards (top item first)

### 4. JSON Save/Load Issues
**Check:**
1. Scene must be a flat JSON array — no circular references
2. All shape fields must be JSON-serializable (numbers, strings, booleans)
3. Check the Live JSON Editor for validation errors ("Format Error" badge)

### 5. Zoom/Pan Issues
**Check:**
1. `engine.scale` — zoom level (0.1–5.0)
2. `engine.offsetX/offsetY` — pan offsets
3. `tools.js > getRelativePos()` — converts screen coords to scene coords

### 6. Contrast/Color Issues
The engine auto-generates colors based on `bgColor`:
1. Check `canvas-engine.js > updateContrastColors()` (line 60-91)
2. Colors are cached — only recompute when `bgColor` changes
3. Uses ITU-R BT.709 Luma for light/dark detection

## Key Debug Points

| What | Where | Line Range |
|------|-------|-----------|
| Element registry lookup | `canvas-engine.js > drawObject()` | 546-557 |
| Tool dispatch (element placement) | `tools.js > onMouseDown()` | 144-169 |
| Hit testing | `canvas-engine.js > hitTest()` | 242-263 |
| Selection change UI | `app.js > engine.onSelectionChange` | 584-675 |
| Scene change sync | `app.js > engine.onSceneChange` | 407-410 |
| JSON editor sync | `app.js > updateJsonEditor()` | 395-405 |
| Contrast color compute | `canvas-engine.js > updateContrastColors()` | 60-91 |
| Render pipeline | `canvas-engine.js > render()` | 323-406 |

## Quick Inspection Commands

Open the browser DevTools console:

```javascript
// Inspect scene
JSON.stringify(engine.scene, null, 2)

// Check registered elements
ElementRegistry.ids()

// Check current tool
toolsManager.currentTool

// Check selection
engine.selectedItems

// Check zoom/pan
console.log(engine.scale, engine.offsetX, engine.offsetY)

// Force re-render
engine.render()
```

> **Note**: `engine` and `toolsManager` are scoped inside the `DOMContentLoaded` closure in `app.js`, so they are NOT accessible from the console by default. To debug, you may need to temporarily assign them to `window`.
