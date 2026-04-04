---
name: roomio-styling
description: Styling guide for Roomio — CSS design tokens, component patterns, theming rules, and UI extension patterns.
---

# Roomio Styling Guide

## Design Tokens (CSS Custom Properties)

All design tokens are defined in `:root` at the top of `style.css`:

```css
:root {
    --bg-dark: #121214;          /* App background, sidebar, tab bar */
    --bg-canvas: #1e1e22;        /* Canvas background (default) */
    --panel-bg: rgba(30, 30, 34, 0.85);  /* Floating panels (glassmorphism) */
    --primary: #6366f1;          /* Indigo — brand color, active states */
    --primary-hover: #4f46e5;    /* Darker indigo — hover states */
    --text-main: #f8fafc;        /* Primary text color */
    --text-muted: #94a3b8;       /* Secondary/muted text */
    --border-color: #334155;     /* Solid borders */
    --border-light: rgba(255, 255, 255, 0.1);  /* Subtle borders, dividers */
    --danger: #ef4444;           /* Red — delete actions, errors */
}
```

**Always use these tokens** instead of hardcoded color values. This ensures consistency and makes future theming possible.

---

## Layout Structure

```
.app-container (flex row, 100vh × 100vw)
├── .sidebar-toggle-btn (fixed, shown when sidebar collapsed)
├── .toolbar (260px sidebar, collapsible)
│   ├── .brand (logo + title + collapse button)
│   ├── .tools-group (tool buttons section)
│   │   ├── .tool-btn (individual tool buttons)
│   │   ├── .elements-header (collapsible section header)
│   │   └── .elements-body (collapsible elements list)
│   ├── .tools-group (settings section)
│   │   ├── .setting-item (labeled controls)
│   │   └── .slider-container (range inputs)
│   └── .toolbar-section (action buttons)
├── main.canvas-container (flex: 1)
│   ├── .tab-bar (38px top bar, absolute)
│   ├── canvas#design-canvas
│   ├── .compass-overlay (absolute, top-right)
│   ├── .properties-panel (absolute, top-right, glassmorphism)
│   └── .zoom-controls (absolute, bottom-right)
└── .floating-editor (fixed, draggable JSON editor)
```

---

## Component Patterns

### Tool Buttons
```css
.tool-btn {
    /* Base: transparent bg, muted text, flex row with icon gap */
    /* :hover → border-light bg, main text */
    /* .active → primary bg (15% opacity), primary text */
}
```

### Action Buttons
```css
.action-btn {
    /* Base: border-light bg, main text, full width */
    /* :hover → border-color bg */
}
.action-btn.primary {
    /* Primary variant: primary bg, white text */
    /* :hover → translateY(-1px) + box-shadow */
}
```

### Floating Panels (Glassmorphism)
```css
.properties-panel {
    background: var(--panel-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--border-light);
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}
```

### Setting Items
```css
.setting-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 8px;
}
.setting-item label {
    font-size: 13px;
    font-weight: 500;
}
.slider-container {
    display: flex;
    align-items: center;
    gap: 12px;
}
```

### Tabs
```css
.tab {
    /* Base: transparent, muted text, 12px font */
    /* :hover → subtle white bg */
    /* .active → canvas bg, main text, bottom 2px primary border */
}
```

### Status Badges
```css
.status-badge.success {
    background: rgba(34, 197, 94, 0.15);
    color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.3);
}
.status-badge.error {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.3);
}
```

---

## Adding New UI Components

### New Sidebar Section
```html
<div class="tools-group">
    <h3>Section Title</h3>
    <button class="tool-btn" data-tool="my-tool" title="Tool Name">
        <i data-lucide="icon-name"></i> Tool Name
    </button>
</div>
```

### New Setting Control
```html
<div class="setting-item">
    <label for="my-setting">Setting Label</label>
    <div class="slider-container">
        <input type="range" id="my-setting" min="0" max="100" value="50">
        <span id="my-setting-val">50</span>
    </div>
</div>
```

### New Floating Panel
Use the glassmorphism pattern:
```css
.my-panel {
    position: absolute;
    background: var(--panel-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--border-light);
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    z-index: 10;
}
```

---

## Collapsible Section Pattern

Used for both the sidebar and elements list. CSS pattern:

```css
.section-body {
    overflow: hidden;
    transition: max-height 0.3s ease, opacity 0.2s ease;
}
.section-body.collapsed {
    max-height: 0 !important;
    opacity: 0;
    pointer-events: none;
}
```

Toggle JS:
```javascript
element.classList.toggle('collapsed');
```

---

## Important CSS Notes

1. **Canvas offset**: The canvas has `margin-top: 38px` to account for the tab bar
2. **Sidebar transition**: Uses `width` and `padding` transitions (250ms)
3. **Properties panel**: Uses `pointer-events: none` on container, `auto` on children — allows clicks to pass through empty space
4. **Custom scrollbar**: 6px thin, transparent track, border-light thumb
5. **Compass overlay**: Uses `pointer-events: none` — purely visual
6. **Floating editor**: `position: fixed`, z-index 500, draggable via titlebar

---

## Lucide Icons

Icons are rendered via the Lucide library. After dynamically adding new `<i data-lucide="...">` elements, call:

```javascript
lucide.createIcons();
// Or for specific elements:
lucide.createIcons({ nodes: [containerElement] });
```

Browse icons: https://lucide.dev/icons
