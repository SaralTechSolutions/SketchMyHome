---
description: How to add a new UI feature (tool, setting, panel) to Roomio
---

# Adding a New UI Feature

## Prerequisites
Read the architecture skill: `.agents/skills/architecture/SKILL.md`
Read the styling skill: `.agents/skills/styling/SKILL.md`

## Steps

1. **Identify the feature scope** — Does it need:
   - A new tool button? → Modify `index.html` sidebar + `tools.js`
   - A new setting control? → Modify `index.html` sidebar + `app.js`
   - A new floating panel? → Modify `index.html` + `style.css` + `app.js`
   - A new element? → Use the `/add-element` workflow instead

2. **Add HTML structure** in `index.html`:
   - Tool buttons go inside `.tools-group` sections
   - Settings go inside `.setting-item` containers
   - New panels go inside `.canvas-container` or `.app-container`
   - Always use `data-lucide` attributes for icons

3. **Add CSS styles** in `style.css`:
   - Use CSS custom properties from `:root` (never hardcode colors)
   - Follow existing component patterns (see styling skill)
   - For floating panels, use the glassmorphism pattern

4. **Add JavaScript logic** in the appropriate file:
   - Tool behavior → `tools.js`
   - UI wiring & event handlers → `app.js`
   - Rendering changes → `canvas-engine.js`
   - New events → `event-bus.js`

5. **Call `lucide.createIcons()`** after adding any new `<i data-lucide="...">` elements

6. **Test the feature**:
// turbo
```
npm start
```

7. Verify the feature works correctly in the browser
