import * as THREE from 'three';
import { canvasPxToPlan3DFt, wallBoxRotationYFromPlanDelta } from '@/lib/plan3d/wallMeshesFromScene';
import { DEFAULT_GRID_PX_PER_FOOT } from '@/lib/plan3d/constants';

/** One tread box in the staircase group's local space (Y up, +Z along the flight). */
export type StairTreadLocal = {
  w: number;
  h: number;
  d: number;
  cx: number;
  cy: number;
  cz: number;
};

export type StaircaseMeshSpec = {
  id: string;
  subType: 'staircase' | 'stairs';
  /** Footprint center on the floor (world Y = 0 for the base). */
  position: THREE.Vector3;
  rotationY: number;
  treads: StairTreadLocal[];
  riseFt: number;
  runWidthFt: number;
  runLengthFt: number;
};

function isStairSceneObject(item: unknown): item is {
  id: string;
  type: string;
  subType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
} {
  if (!item || typeof item !== 'object') return false;
  const o = item as Record<string, unknown>;
  return (
    o.type === 'object' &&
    (o.subType === 'staircase' || o.subType === 'stairs') &&
    typeof o.x === 'number' &&
    typeof o.y === 'number' &&
    typeof o.width === 'number' &&
    typeof o.height === 'number' &&
    typeof o.id === 'string'
  );
}

/** Total rise in feet for 3D preview (not stored on 2D object). */
function defaultRiseFt(runLengthFt: number): number {
  const guess = Math.min(12, Math.max(8, runLengthFt * 0.45));
  return Math.round(guess * 4) / 4;
}

function buildTreads(
  runWidthFt: number,
  runLengthFt: number,
  riseFt: number,
  minSteps: number,
  maxSteps: number
): StairTreadLocal[] {
  const targetTread = 0.85;
  let n = Math.round(runLengthFt / targetTread);
  n = Math.min(maxSteps, Math.max(minSteps, n));
  const treadD = runLengthFt / n;
  const riseH = riseFt / n;
  const out: StairTreadLocal[] = [];
  const z0 = -runLengthFt / 2;
  for (let i = 0; i < n; i++) {
    const zc = z0 + (i + 0.5) * treadD;
    const yc = (i + 0.5) * riseH;
    out.push({
      w: runWidthFt,
      h: riseH,
      d: treadD,
      cx: 0,
      cy: yc,
      cz: zc,
    });
  }
  return out;
}

/**
 * 2D plan objects `subType: 'staircase' | 'stairs'` → stepped volumes for 3D preview.
 * Uses the same canvas→XZ mapping and rotation convention as door openings.
 */
export function staircaseMeshesFromScene(
  scene: unknown[],
  gridPxPerFoot: number = DEFAULT_GRID_PX_PER_FOOT
): StaircaseMeshSpec[] {
  const s = 1 / gridPxPerFoot;
  const out: StaircaseMeshSpec[] = [];

  for (const item of Array.isArray(scene) ? scene : []) {
    if (!isStairSceneObject(item)) continue;

    const rot = item.rotation || 0;
    const th = (-(rot * Math.PI) / 180) as number;
    const cos = Math.cos(th);
    const sin = Math.sin(th);

    const localW = rot % 180 !== 0 ? item.height : item.width;
    const localH = rot % 180 !== 0 ? item.width : item.height;

    const cx = item.x + item.width / 2;
    const cy = item.y + item.height / 2;
    const center = canvasPxToPlan3DFt(cx, cy, gridPxPerFoot);

    const wdx = localW * cos;
    const wdy = localW * sin;
    const lenW = Math.hypot(wdx, wdy) || 1;
    const worldDx = (wdx / lenW) * localW * s;
    const worldDz = (-wdy / lenW) * localW * s;
    const rotationY = wallBoxRotationYFromPlanDelta(worldDx, worldDz);

    const runWidthFt = localW * s;
    const runLengthFt = localH * s;
    const riseFt = defaultRiseFt(runLengthFt);
    const treads = buildTreads(runWidthFt, runLengthFt, riseFt, 4, 18);

    out.push({
      id: item.id,
      subType: item.subType as 'staircase' | 'stairs',
      position: new THREE.Vector3(center.xFt, 0, center.zFt),
      rotationY,
      treads,
      riseFt,
      runWidthFt,
      runLengthFt,
    });
  }

  return out;
}

/** Expand an axis-aligned box in world space to include all stair tread corners (with rotation). */
export function expandBoxWithStaircases(box: THREE.Box3, specs: StaircaseMeshSpec[]): void {
  for (const spec of specs) {
    const cos = Math.cos(spec.rotationY);
    const sin = Math.sin(spec.rotationY);
    const px = spec.position.x;
    const py = spec.position.y;
    const pz = spec.position.z;

    for (const t of spec.treads) {
      const hw = t.w / 2;
      const hh = t.h / 2;
      const hd = t.d / 2;
      const corners: [number, number, number][] = [
        [t.cx - hw, t.cy - hh, t.cz - hd],
        [t.cx + hw, t.cy - hh, t.cz - hd],
        [t.cx + hw, t.cy + hh, t.cz - hd],
        [t.cx - hw, t.cy + hh, t.cz - hd],
        [t.cx - hw, t.cy - hh, t.cz + hd],
        [t.cx + hw, t.cy - hh, t.cz + hd],
        [t.cx + hw, t.cy + hh, t.cz + hd],
        [t.cx - hw, t.cy + hh, t.cz + hd],
      ];
      for (const [lx, ly, lz] of corners) {
        const wx = px + lx * cos + lz * sin;
        const wz = pz - lx * sin + lz * cos;
        const wy = py + ly;
        box.expandByPoint(new THREE.Vector3(wx, wy, wz));
      }
    }
  }
}
