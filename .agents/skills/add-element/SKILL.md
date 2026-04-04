---
name: add-element
description: How to add a new furniture/fixture element to Roomio. Only 2 files need changes — elements.js and index.html.
---

# Adding a New Element to Roomio

## Overview

Roomio uses a **declarative element registry** pattern. Adding a new piece of furniture or fixture requires changes to exactly **2 files**:

1. `elements.js` — Register the element definition with custom drawing code
2. `index.html` — Add a tool button in the sidebar

**No changes needed** to `canvas-engine.js`, `tools.js`, or `app.js`. The engine and tools read from the registry automatically.

---

## Step 1: Register in `elements.js`

Add a new `ElementRegistry.register()` call at the bottom of `elements.js` (before the final closing marker, after the existing registrations):

```javascript
ElementRegistry.register({
    id: 'bathtub',           // Must be unique. Used as tool name and subType value.
    name: 'Bathtub',         // Display name (shown in sidebar button text)
    icon: 'bath',            // Lucide icon name (browse: https://lucide.dev/icons)
    width: 80,               // Default width in pixels (25px = 1 foot)
    height: 160,             // Default height in pixels
    extraProps: {},           // Optional: additional properties merged into scene object
    draw(ctx, hw, hh, w, h, scale, shape, colors) {
        // Custom Canvas 2D drawing code
        // ctx = CanvasRenderingContext2D (already transformed: origin at center, rotation/flip applied)
        // hw = half-width, hh = half-height
        // w = full width, h = full height
        // scale = current zoom level
        // shape = the scene object (access custom props)
        // colors = { textColor: string }
        
        ctx.fillRect(-hw, -hh, w, h);
        ctx.strokeRect(-hw, -hh, w, h);
        // ... more drawing
    }
});
```

### Draw Function Coordinate System

```
         (-hw, -hh) ────────── (hw, -hh)
              │                     │
              │      (0, 0)         │     ← Origin is CENTER
              │       center        │
              │                     │
         (-hw, hh) ─────────── (hw, hh)
```

- **Origin (0, 0)** is at the center of the element
- The engine has already applied rotation and flip transforms
- `ctx.strokeStyle` and `ctx.fillStyle` are pre-set by the engine with appropriate colors
- `ctx.lineWidth` is pre-set to `2 / scale`
- Use `scale` to keep visual elements constant-size regardless of zoom (e.g., `5 / scale`)

### Common Drawing Patterns

```javascript
// Solid filled rectangle
ctx.fillRect(-hw, -hh, w, h);
ctx.strokeRect(-hw, -hh, w, h);

// Circle/ellipse
ctx.beginPath();
ctx.ellipse(0, 0, hw, hh, 0, 0, 2 * Math.PI);
ctx.fill();
ctx.stroke();

// Internal dividers (like stairs/shelves)
ctx.beginPath();
ctx.moveTo(-hw, -hh + offset);
ctx.lineTo(hw, -hh + offset);
ctx.stroke();

// Dashed outline (like text labels)
ctx.setLineDash([4 / scale, 4 / scale]);
ctx.strokeRect(-hw, -hh, w, h);
ctx.setLineDash([]);

// Inner circle (like washing machine drum)
ctx.beginPath();
ctx.arc(0, 0, radius, 0, 2 * Math.PI);
ctx.stroke();

// Custom text (like text labels)
ctx.font = `${fontSize}px Inter, sans-serif`;
ctx.fillStyle = colors.textColor;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('Label', 0, 0);
```

### Extra Properties

If your element needs custom data (like text elements), use `extraProps`:

```javascript
ElementRegistry.register({
    id: 'label',
    // ...
    extraProps: { text: 'Default Text', fontSize: 14, color: '#ffffff' },
    draw(ctx, hw, hh, w, h, scale, shape, colors) {
        // Access via shape.text, shape.fontSize, shape.color
    }
});
```

These properties are deep-cloned and merged into each new instance when placed.

---

## Step 2: Add Button in `index.html`

Add a `<button>` inside the `<div class="elements-body" id="elements-body">` section (around lines 54–88):

```html
<button class="tool-btn" data-tool="bathtub" title="Add Bathtub">
    <i data-lucide="bath"></i> Bathtub
</button>
```

**Requirements**:
- `data-tool` value **must exactly match** the `id` in `ElementRegistry.register()`
- `data-lucide` attribute **must be a valid Lucide icon name**
- The button text is the user-visible label

---

## Step 3: Test

1. Run `npm start` or open `index.html` directly
2. Click the new button in the sidebar
3. Click on the canvas — the element should appear
4. Verify: select, move, resize, rotate, flip, copy/paste, save/load JSON

---

## Pixel-to-Feet Reference

| Pixels | Real-World |
|--------|-----------|
| 25 px | 1 foot |
| 2.083 px | 1 inch |
| 50 px | 2 feet |
| 75 px | 3 feet |
| 100 px | 4 feet |
| 125 px | 5 feet |

---

## Existing Element Sizes (for reference)

| Element | Width (px) | Height (px) | Approx Real |
|---------|-----------|-------------|-------------|
| Door | 75 | 25 | 3' × 1' |
| Window | 100 | 25 | 4' × 1' |
| Stairs | 75 | 200 | 3' × 8' |
| Bed | 125 | 162.5 | 5' × 6'6" |
| Table | 100 | 100 | 4' × 4' |
| Bookshelf | 100 | 30 | 4' × 1'2" |
| Commode | 45 | 65 | 1'10" × 2'7" |
| Washer | 60 | 60 | 2'5" × 2'5" |
| Chair | 50 | 50 | 2' × 2' |
| Sofa | 180 | 80 | 7'2" × 3'2" |
| Text | 120 | 30 | N/A |

---

## Checklist

- [ ] `ElementRegistry.register()` call added to `elements.js`
- [ ] `id` is unique and lowercase with underscores (no spaces or dashes)
- [ ] `draw()` function renders correctly at different zoom levels
- [ ] Button added to `index.html` inside `#elements-body`
- [ ] `data-tool` matches the registry `id` exactly
- [ ] Lucide icon name is valid
- [ ] Element appears correctly when placed, selected, rotated, flipped
- [ ] Element persists correctly in JSON save/load
