---
description: How to add a new furniture/fixture element to Roomio (2-file change)
---

# Adding a New Element

## Prerequisites
Read the add-element skill: `.agents/skills/add-element/SKILL.md`

## Steps

1. **Choose element properties**:
   - Unique `id` (lowercase, underscores, no spaces/dashes)
   - Display `name`
   - Lucide `icon` name (browse: https://lucide.dev/icons)
   - Default `width` and `height` in pixels (25px = 1 foot)

2. **Register the element** in `elements.js` — add an `ElementRegistry.register()` call at the end of the file (after the last existing registration, before the end). Include a `draw()` function with Canvas 2D drawing code.

3. **Add a sidebar button** in `index.html` — add a `<button class="tool-btn">` inside the `<div id="elements-body">` section (around line 54-88). The `data-tool` attribute must exactly match the registry `id`.

4. **Test the element**:
// turbo
```
npm start
```

5. Verify: place, select, move, resize, rotate, flip, copy/paste, save/load JSON.

> **Important**: No changes to `canvas-engine.js`, `tools.js`, or `app.js` are needed. The registry pattern handles everything automatically.
