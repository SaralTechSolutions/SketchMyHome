import * as THREE from 'three';
import {
  boundingBoxFromWallSpecs,
  canvasPxToPlan3DFt,
  type WallMeshSpec,
} from '@/lib/plan3d/wallMeshesFromScene';
import { DEFAULT_GRID_PX_PER_FOOT } from '@/lib/plan3d/constants';
import {
  DoorOpening3D,
  WindowOpening3D,
  type WallOpeningMeshSpec,
} from '@/lib/plan3d/wallOpening3d';

export type { WallOpeningMeshSpec, WallOpeningVisualStyle, WallOpeningKind } from '@/lib/plan3d/wallOpening3d';
export {
  WallOpening3DBase,
  DoorOpening3D,
  WindowOpening3D,
  FrameOpening3D,
  CustomWallOpening3D,
} from '@/lib/plan3d/wallOpening3d';

/** @deprecated Use WallOpeningMeshSpec */
export type Opening3DSpec = WallOpeningMeshSpec;

/** @deprecated Use WallOpeningMeshSpec */
export type Door3DSpec = WallOpeningMeshSpec;

function isOpeningObject(
  item: unknown,
  subType: 'door' | 'window'
): item is {
  id: string;
  type: string;
  subType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  altitude?: number;
  sillAltitude?: number;
} {
  if (!item || typeof item !== 'object') return false;
  const o = item as Record<string, unknown>;
  return (
    o.type === 'object' &&
    o.subType === subType &&
    typeof o.x === 'number' &&
    typeof o.y === 'number' &&
    typeof o.width === 'number' &&
    typeof o.height === 'number' &&
    typeof o.id === 'string'
  );
}

function altitudeOpening(item: { altitude?: number }, defaultFt: number): number {
  const a = item.altitude;
  if (typeof a === 'number' && Number.isFinite(a) && a > 0) return Math.min(30, Math.max(1, a));
  if (typeof a === 'string') {
    const p = parseFloat(a);
    if (Number.isFinite(p) && p > 0) return Math.min(30, Math.max(1, p));
  }
  return defaultFt;
}

function windowSillFt(item: { sillAltitude?: number }): number {
  const s = item.sillAltitude;
  if (typeof s === 'number' && Number.isFinite(s) && s >= 0) return Math.min(24, s);
  return 3;
}

function distPointToSegmentPx(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const L2 = dx * dx + dy * dy;
  if (L2 < 1e-12) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / L2;
  t = Math.max(0, Math.min(1, t));
  const nx = ax + t * dx;
  const ny = ay + t * dy;
  return Math.hypot(px - nx, py - ny);
}

function clampedAlongWallFromStartPx(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const L2 = dx * dx + dy * dy;
  if (L2 < 1e-12) return 0;
  const L = Math.sqrt(L2);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L2));
  return t * L;
}

function isWall(item: unknown): item is {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
} {
  if (!item || typeof item !== 'object') return false;
  const o = item as Record<string, unknown>;
  return (
    o.type === 'wall' &&
    typeof o.startX === 'number' &&
    typeof o.startY === 'number' &&
    typeof o.endX === 'number' &&
    typeof o.endY === 'number'
  );
}

export function formatFeetLabel(ft: number): string {
  const totalInches = Math.round(ft * 12);
  const f = Math.floor(totalInches / 12);
  const inch = totalInches % 12;
  if (f === 0) return `${inch}"`;
  if (inch === 0) return `${f}'`;
  return `${f}' ${inch}"`;
}

function openingSpecsForSubtype(
  scene: unknown[],
  gridPxPerFoot: number,
  subType: 'door' | 'window',
  defaultAltitudeFt: number
): WallOpeningMeshSpec[] {
  const s = 1 / gridPxPerFoot;
  const walls = (Array.isArray(scene) ? scene : []).filter(isWall);
  const out: WallOpeningMeshSpec[] = [];

  for (const item of Array.isArray(scene) ? scene : []) {
    if (!isOpeningObject(item, subType)) continue;

    const rot = item.rotation || 0;
    const th = (-(rot * Math.PI) / 180) as number;
    const cos = Math.cos(th);
    const sin = Math.sin(th);

    const localW = rot % 180 !== 0 ? item.height : item.width;
    const localH = rot % 180 !== 0 ? item.width : item.height;
    const hw = localW / 2;
    const hh = localH / 2;

    const cx = item.x + item.width / 2;
    const cy = item.y + item.height / 2;

    const cornersCanvas: [number, number][] = [
      [-hw, -hh],
      [hw, -hh],
      [hw, hh],
      [-hw, hh],
    ].map(([lx, ly]) => {
      const rx = lx * cos - ly * sin;
      const ry = lx * sin + ly * cos;
      return [cx + rx, cy + ry];
    });

    const cornersFloor = cornersCanvas.map(([px, py]) => {
      const p = canvasPxToPlan3DFt(px, py, gridPxPerFoot);
      return new THREE.Vector3(p.xFt, 0, p.zFt);
    });

    const wdx = localW * cos;
    const wdy = localW * sin;
    const lenW = Math.hypot(wdx, wdy) || 1;
    const worldDx = (wdx / lenW) * localW * s;
    const worldDz = (-wdy / lenW) * localW * s;
    const rotationY = Math.atan2(worldDz, worldDx);

    const center = canvasPxToPlan3DFt(cx, cy, gridPxPerFoot);
    const openingHeightFt = altitudeOpening(item, defaultAltitudeFt);
    const sillFt = subType === 'window' ? windowSillFt(item) : 0;
    const centerY = sillFt + openingHeightFt / 2;
    const widthFt = localW * s;
    const depthFt = Math.max(localH * s, 0.08);

    let distStartFt: number | null = null;
    let widthAlongWallFt: number | null = null;
    let distEndFt: number | null = null;
    let labelStartMid: THREE.Vector3 | null = null;
    let labelWidthCenter: THREE.Vector3 | null = null;
    let labelEndMid: THREE.Vector3 | null = null;

    let bestWall: (typeof walls)[0] | null = null;
    let bestD = Infinity;
    for (const w of walls) {
      const d = distPointToSegmentPx(cx, cy, w.startX, w.startY, w.endX, w.endY);
      if (d < bestD && d < 55) {
        bestD = d;
        bestWall = w;
      }
    }

    if (bestWall) {
      const ax = bestWall.startX;
      const ay = bestWall.startY;
      const bx = bestWall.endX;
      const by = bestWall.endY;
      const wallLenPx = Math.hypot(bx - ax, by - ay);
      if (wallLenPx > 1e-6) {
        const us = cornersCanvas.map(([px, py]) =>
          clampedAlongWallFromStartPx(px, py, ax, ay, bx, by)
        );
        const uMin = Math.min(...us);
        const uMax = Math.max(...us);
        distStartFt = uMin * s;
        widthAlongWallFt = (uMax - uMin) * s;
        distEndFt = (wallLenPx - uMax) * s;

        const dirx = (bx - ax) / wallLenPx;
        const diry = (by - ay) / wallLenPx;
        const yLbl = sillFt + openingHeightFt + 0.45;
        const midCanvas = (u0: number, u1: number) => {
          const u = (u0 + u1) / 2;
          const px = ax + dirx * u;
          const py = ay + diry * u;
          const p = canvasPxToPlan3DFt(px, py, gridPxPerFoot);
          return new THREE.Vector3(p.xFt, yLbl, p.zFt);
        };
        labelStartMid = midCanvas(0, uMin);
        labelWidthCenter = midCanvas(uMin, uMax);
        labelEndMid = midCanvas(uMax, wallLenPx);
      }
    }

    out.push({
      id: item.id,
      position: new THREE.Vector3(center.xFt, centerY, center.zFt),
      rotationY,
      widthFt,
      depthFt,
      heightFt: openingHeightFt,
      distStartFt,
      widthAlongWallFt,
      distEndFt,
      cornersFloor,
      labelStartMid,
      labelWidthCenter,
      labelEndMid,
      sillFt,
    });
  }

  return out;
}

export function doorOpeningSpecsFromScene(
  scene: unknown[],
  gridPxPerFoot: number = DEFAULT_GRID_PX_PER_FOOT
): WallOpeningMeshSpec[] {
  return openingSpecsForSubtype(scene, gridPxPerFoot, 'door', 7.5);
}

export function windowOpeningSpecsFromScene(
  scene: unknown[],
  gridPxPerFoot: number = DEFAULT_GRID_PX_PER_FOOT
): WallOpeningMeshSpec[] {
  return openingSpecsForSubtype(scene, gridPxPerFoot, 'window', 5);
}

/** Mesh specs wrapped as `DoorOpening3D` for rendering / extension. */
export function doorOpenings3DFromScene(
  scene: unknown[],
  gridPxPerFoot: number = DEFAULT_GRID_PX_PER_FOOT
): DoorOpening3D[] {
  return DoorOpening3D.fromMeshSpecs(doorOpeningSpecsFromScene(scene, gridPxPerFoot));
}

export function windowOpenings3DFromScene(
  scene: unknown[],
  gridPxPerFoot: number = DEFAULT_GRID_PX_PER_FOOT
): WindowOpening3D[] {
  return WindowOpening3D.fromMeshSpecs(windowOpeningSpecsFromScene(scene, gridPxPerFoot));
}

export function combinedBounds3D(
  wallSpecs: WallMeshSpec[],
  boundarySpecs: WallMeshSpec[],
  openingSpecs: WallOpeningMeshSpec[]
): { center: THREE.Vector3; size: number } {
  const box = boundingBoxFromWallSpecs([...wallSpecs, ...boundarySpecs]);
  for (const d of openingSpecs) {
    const y0 = d.sillFt;
    const y1 = d.sillFt + d.heightFt;
    for (const c of d.cornersFloor) {
      box.expandByPoint(new THREE.Vector3(c.x, y0, c.z));
      box.expandByPoint(new THREE.Vector3(c.x, y1, c.z));
    }
  }
  const center = new THREE.Vector3();
  const sphere = new THREE.Sphere();
  box.getBoundingSphere(sphere);
  box.getCenter(center);
  return { center, size: Math.max(sphere.radius * 2.2, 12) };
}
