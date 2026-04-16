import * as THREE from 'three';
import { getBoundaryPolygonPoints } from '@/lib/sketch-my-home/planBoundary';
import { DEFAULT_GRID_PX_PER_FOOT } from './constants';

/**
 * 2D canvas (X right, Y down) → Three.js floor plane (X right, Z forward).
 * Must match `ShapeGeometry` / `ExtrudeGeometry` + `rotateX(-π/2)` in FloorPlan3DView
 * (canvas Y maps to world **-Z**, not +Z).
 */
export function canvasPxToPlan3DFt(
  xPx: number,
  yPx: number,
  gridPxPerFoot: number
): { xFt: number; zFt: number } {
  const s = 1 / gridPxPerFoot;
  return { xFt: xPx * s, zFt: -yPx * s };
}

export type WallMeshSpec = {
  id: string;
  position: THREE.Vector3;
  rotationY: number;
  lengthFt: number;
  heightFt: number;
  thicknessFt: number;
};

function isWallRecord(item: unknown): item is {
  id: string;
  type: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  thickness?: number;
  altitude?: number;
} {
  if (!item || typeof item !== 'object') return false;
  const o = item as Record<string, unknown>;
  return (
    o.type === 'wall' &&
    typeof o.startX === 'number' &&
    typeof o.startY === 'number' &&
    typeof o.endX === 'number' &&
    typeof o.endY === 'number' &&
    typeof o.id === 'string'
  );
}

/** Thickness in canvas px; default 9\" nominal wall. */
function thicknessPxFromWall(
  item: { thickness?: number },
  gridPxPerFoot: number
): number {
  const t = item.thickness;
  if (typeof t === 'number' && Number.isFinite(t) && t > 0) return t;
  if (typeof t === 'string') {
    const p = parseFloat(t);
    if (Number.isFinite(p) && p > 0) return p;
  }
  return (9 / 12) * gridPxPerFoot;
}

function altitudeFtFromWall(item: { altitude?: number }): number {
  const a = item.altitude;
  if (typeof a === 'number' && Number.isFinite(a) && a > 0) return a;
  if (typeof a === 'string') {
    const p = parseFloat(a);
    if (Number.isFinite(p) && p > 0) return Math.min(30, Math.max(1, p));
  }
  return 10;
}

/**
 * Converts 2D wall segments (px, y-down) into axis-aligned boxes in feet (Y-up, XZ floor).
 */
export function wallMeshesFromScene(
  scene: unknown[],
  gridPxPerFoot: number = DEFAULT_GRID_PX_PER_FOOT
): WallMeshSpec[] {
  const s = 1 / gridPxPerFoot;
  const out: WallMeshSpec[] = [];

  for (const item of scene) {
    if (!isWallRecord(item)) continue;

    const start = canvasPxToPlan3DFt(item.startX, item.startY, gridPxPerFoot);
    const end = canvasPxToPlan3DFt(item.endX, item.endY, gridPxPerFoot);
    const dx = end.xFt - start.xFt;
    const dz = end.zFt - start.zFt;
    const lenFt = Math.hypot(dx, dz);
    if (lenFt < 1e-4) continue;

    const heightFt = altitudeFtFromWall(item);
    const thicknessFt = Math.max(thicknessPxFromWall(item, gridPxPerFoot) * s, 0.05);

    const mx = (start.xFt + end.xFt) / 2;
    const mz = (start.zFt + end.zFt) / 2;
    const rotationY = Math.atan2(dz, dx);

    out.push({
      id: item.id,
      position: new THREE.Vector3(mx, heightFt / 2, mz),
      rotationY,
      lengthFt: lenFt,
      heightFt,
      thicknessFt,
    });
  }

  return out;
}

/** Short “curb” segments along the site boundary polygon (2D canvas px → XZ feet). */
export function boundarySegmentsFromScene(
  scene: unknown[],
  gridPxPerFoot: number = DEFAULT_GRID_PX_PER_FOOT
): WallMeshSpec[] {
  const pts = getBoundaryPolygonPoints(Array.isArray(scene) ? scene : []);
  if (!pts || pts.length < 2) return [];

  const s = 1 / gridPxPerFoot;
  const heightFt = 2.5;
  const thicknessFt = 3 / 12;
  const out: WallMeshSpec[] = [];
  const n = pts.length;

  for (let i = 0; i < n; i++) {
    const p0 = pts[i];
    const p1 = pts[(i + 1) % n];
    const a = canvasPxToPlan3DFt(p0.x, p0.y, gridPxPerFoot);
    const b = canvasPxToPlan3DFt(p1.x, p1.y, gridPxPerFoot);
    const dx = b.xFt - a.xFt;
    const dz = b.zFt - a.zFt;
    const lenFt = Math.hypot(dx, dz);
    if (lenFt < 1e-4) continue;

    const mx = (a.xFt + b.xFt) / 2;
    const mz = (a.zFt + b.zFt) / 2;
    const rotationY = Math.atan2(dz, dx);

    // Lengthen slightly so separate boxes overlap at corners (fallback path only).
    const lenExtended = lenFt + 2 * thicknessFt;

    out.push({
      id: `boundary-edge-${i}`,
      position: new THREE.Vector3(mx, heightFt / 2, mz),
      rotationY,
      lengthFt: lenExtended,
      heightFt,
      thicknessFt,
    });
  }

  return out;
}

export function boundingBoxFromWallSpecs(specs: WallMeshSpec[]): THREE.Box3 {
  const box = new THREE.Box3();
  if (specs.length === 0) {
    box.setFromCenterAndSize(new THREE.Vector3(0, 4, 0), new THREE.Vector3(24, 8, 24));
    return box;
  }
  for (const w of specs) {
    const hx =
      (w.lengthFt * Math.abs(Math.cos(w.rotationY)) + w.thicknessFt * Math.abs(Math.sin(w.rotationY))) / 2;
    const hz =
      (w.lengthFt * Math.abs(Math.sin(w.rotationY)) + w.thicknessFt * Math.abs(Math.cos(w.rotationY))) / 2;
    box.expandByPoint(new THREE.Vector3(w.position.x - hx, 0, w.position.z - hz));
    box.expandByPoint(new THREE.Vector3(w.position.x + hx, w.heightFt, w.position.z + hz));
  }
  return box;
}

export function boundsFromWallSpecs(specs: WallMeshSpec[]): {
  center: THREE.Vector3;
  size: number;
} {
  if (specs.length === 0) {
    return { center: new THREE.Vector3(0, 4, 0), size: 24 };
  }
  const box = boundingBoxFromWallSpecs(specs);
  const center = new THREE.Vector3();
  const sphere = new THREE.Sphere();
  box.getBoundingSphere(sphere);
  box.getCenter(center);
  return { center, size: Math.max(sphere.radius * 2.2, 12) };
}
