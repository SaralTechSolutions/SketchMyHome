/**
 * Site boundary helpers: Planner-style workflow (lot first, then structure inside).
 */

/** Drawing scale denominator shown as "1:100" in UI. */
export const DEFAULT_PLAN_SCALE_DENOMINATOR = 100;

/** Zoom limits: max zoom-in 50×, max zoom-out 20× → min scale 1/20. */
export const MIN_VIEW_SCALE = 1 / 20;
export const MAX_VIEW_SCALE = 50;

/**
 * True when the user must draw a site boundary before structural tools.
 * Existing projects that already have walls/rooms/objects but no boundary are not blocked.
 */
export function needsSiteBoundary(scene) {
    if (!scene || scene.length === 0) return true;
    if (scene.some((s) => s.type === 'boundary')) return false;
    return !scene.some((s) =>
        ['wall', 'room', 'object', 'area_measure'].includes(s.type)
    );
}

/** Legacy rectangle boundary → 4 corner points (clockwise from top-left). */
export function rectBoundaryToPoints(b) {
    if (!b || b.x == null || b.width == null) return null;
    return [
        { x: b.x, y: b.y },
        { x: b.x + b.width, y: b.y },
        { x: b.x + b.width, y: b.y + b.height },
        { x: b.x, y: b.y + b.height },
    ];
}

/**
 * Normalized vertex list for a boundary shape (polygon or legacy rectangle).
 * @returns {Array<{x:number,y:number}>|null}
 */
export function getBoundaryPoints(shape) {
    if (!shape || shape.type !== 'boundary') return null;
    if (Array.isArray(shape.points) && shape.points.length >= 3) {
        return shape.points;
    }
    return rectBoundaryToPoints(shape);
}

/**
 * First site boundary in the scene as a closed polygon (or legacy rect as quad).
 */
export function getBoundaryPolygonPoints(scene) {
    const b = scene.find((s) => s.type === 'boundary');
    if (!b) return null;
    return getBoundaryPoints(b);
}

/** Axis-aligned bounds of the site (for room clip, object placement heuristics). */
export function getBoundaryRect(scene) {
    const pts = getBoundaryPolygonPoints(scene);
    if (!pts || pts.length === 0) return null;
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    return {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
    };
}

/** Ray-cast point-in-polygon (matches engine area_measure / even-odd). */
export function pointInPolygon(x, y, points) {
    if (!points || points.length < 3) return false;
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i].x;
        const yi = points[i].y;
        const xj = points[j].x;
        const yj = points[j].y;
        if (Math.abs(yj - yi) < 1e-9) continue;
        const intersect =
            (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
}

function polygonCentroid(points) {
    let cx = 0;
    let cy = 0;
    for (const p of points) {
        cx += p.x;
        cy += p.y;
    }
    const n = points.length;
    return { x: cx / n, y: cy / n };
}

/**
 * If (x,y) is inside the polygon, return it; otherwise move toward centroid until inside (convex-friendly).
 */
export function clampPointToPolygon(x, y, points) {
    if (!points || points.length < 3) return { x, y };
    if (pointInPolygon(x, y, points)) return { x, y };

    const c = polygonCentroid(points);
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
        const t = (lo + hi) / 2;
        const px = x + (c.x - x) * t;
        const py = y + (c.y - y) * t;
        if (pointInPolygon(px, py, points)) hi = t;
        else lo = t;
    }
    const t = hi;
    return {
        x: x + (c.x - x) * t,
        y: y + (c.y - y) * t,
    };
}

/**
 * Clamp a point using the first site boundary in the scene (polygon or legacy rect).
 */
export function clampPointToSiteBoundary(x, y, scene) {
    const pts = getBoundaryPolygonPoints(scene);
    if (!pts || pts.length < 3) return { x, y };
    return clampPointToPolygon(x, y, pts);
}

/** @deprecated Use clampPointToSiteBoundary — kept for any direct imports */
export function clampPointToBoundaryRect(x, y, rect) {
    if (!rect) return { x, y };
    return {
        x: Math.min(Math.max(x, rect.minX), rect.maxX),
        y: Math.min(Math.max(y, rect.minY), rect.maxY),
    };
}

/**
 * Sets axis-aligned bbox fields from `shape.points` (for polygon objects e.g. staircase footprint).
 */
export function syncObjectAabbFromPolygonPoints(shape) {
    if (!shape.points || shape.points.length === 0) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of shape.points) {
        if (typeof p.x === 'number' && typeof p.y === 'number') {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }
    }
    if (!Number.isFinite(minX)) return;
    shape.x = minX;
    shape.y = minY;
    shape.width = Math.max(10, maxX - minX);
    shape.height = Math.max(10, maxY - minY);
}

/** Tools that require a site boundary when {@link needsSiteBoundary} is true. */
export const TOOLS_REQUIRING_BOUNDARY = new Set([
    'wall',
    'room',
    'door',
    'window',
    'stairs',
    'staircase',
    'frame',
    'bed',
    'table',
    'bookshelf',
    'commode',
    'washing_machine',
    'chair',
    'sofa',
    'text',
    'hole',
    'measure_area',
]);
