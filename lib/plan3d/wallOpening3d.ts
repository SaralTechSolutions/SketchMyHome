import * as THREE from 'three';

/**
 * Neutral mesh payload for a wall-hosted opening in plan space → Three.js.
 * Built by `doorOpeningSpecsFromScene` / `windowOpeningSpecsFromScene` in `doors3dFromScene.ts`; wrapped by
 * `DoorOpening3D`, `WindowOpening3D`, etc. for visuals and future shape overrides.
 */
export type WallOpeningMeshSpec = {
  id: string;
  position: THREE.Vector3;
  rotationY: number;
  widthFt: number;
  depthFt: number;
  heightFt: number;
  distStartFt: number | null;
  widthAlongWallFt: number | null;
  distEndFt: number | null;
  cornersFloor: THREE.Vector3[];
  labelStartMid: THREE.Vector3 | null;
  labelWidthCenter: THREE.Vector3 | null;
  labelEndMid: THREE.Vector3 | null;
  sillFt: number;
};

export type WallOpeningKind = 'door' | 'window' | 'frame' | 'custom';

export type WallOpeningVisualStyle = {
  fillColor: string;
  edgeColor: string;
  labelStyle: Record<string, string | number>;
  fillOpacity?: number;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
};

/** Minimum door slab thickness (ft) so the 3D volume reads as a flat rectangular panel, not a sliver. */
const DOOR_MIN_DEPTH_FT = 2 / 12;

/** Round plan-derived feet so the box stays a true rectangular prism (parallel opposite sides). */
function rectPrismDimFt(ft: number, decimals = 4): number {
  if (!Number.isFinite(ft) || ft <= 0) return 0;
  const p = 10 ** decimals;
  return Math.round(ft * p) / p;
}

const DOOR_STYLE: WallOpeningVisualStyle = {
  fillColor: '#a67c52',
  edgeColor: '#4a3226',
  labelStyle: {
    pointerEvents: 'none',
    color: '#fef3c7',
    fontSize: '11px',
    fontWeight: 700,
    fontFamily: 'Inter, system-ui, sans-serif',
    textShadow: '0 1px 3px #000, 0 0 6px #292524',
    whiteSpace: 'nowrap',
  },
  fillOpacity: 0.48,
  roughness: 0.88,
  metalness: 0.04,
  emissive: '#3d2817',
  emissiveIntensity: 0.06,
};

const WINDOW_STYLE: WallOpeningVisualStyle = {
  fillColor: '#fcd34d',
  edgeColor: '#b45309',
  labelStyle: {
    ...DOOR_STYLE.labelStyle,
    color: '#b45309',
  },
  fillOpacity: 0.22,
  roughness: 0.35,
  metalness: 0.12,
};

const FRAME_STYLE: WallOpeningVisualStyle = {
  fillColor: '#d4d4d8',
  edgeColor: '#3f3f46',
  labelStyle: {
    ...DOOR_STYLE.labelStyle,
    color: '#52525b',
  },
  fillOpacity: 0.18,
  roughness: 0.45,
  metalness: 0.2,
};

/**
 * Common base for wall openings in 3D: doors, windows, frames, and custom elements.
 * Subclasses supply `getVisualStyle` and may override `getEffectiveMeshDimensions`
 * when moving beyond a simple box (e.g. arched head, mullions).
 */
export abstract class WallOpening3DBase {
  constructor(protected readonly meshSpec: WallOpeningMeshSpec) {}

  abstract readonly openingKind: WallOpeningKind;

  abstract getVisualStyle(): WallOpeningVisualStyle;

  getMeshSpec(): WallOpeningMeshSpec {
    return this.meshSpec;
  }

  /**
   * Override in derived classes for non-box geometry (custom extrusions, frames with reveals).
   * Default uses the axis-aligned box from the plan footprint.
   */
  getEffectiveMeshDimensions(): { widthFt: number; heightFt: number; depthFt: number } {
    const m = this.meshSpec;
    return { widthFt: m.widthFt, heightFt: m.heightFt, depthFt: m.depthFt };
  }
}

/** Door opening: semi-transparent wood panel; mesh is an axis-aligned box (true rectangle, opposite sides equal). */
export class DoorOpening3D extends WallOpening3DBase {
  readonly openingKind = 'door' as const;

  constructor(
    mesh: WallOpeningMeshSpec,
    /** Reserved for swing direction, panel count, etc. */
    protected readonly doorSpecific: Record<string, unknown> = {}
  ) {
    super(mesh);
  }

  getVisualStyle(): WallOpeningVisualStyle {
    return DOOR_STYLE;
  }

  /**
   * Orthogonal box only: width × height face is a rectangle; depth is uniform (same on front/back).
   * Rounded dimensions avoid float noise from plan rotation; depth has a floor so the panel is visible.
   */
  getEffectiveMeshDimensions(): { widthFt: number; heightFt: number; depthFt: number } {
    const m = this.meshSpec;
    const widthFt = rectPrismDimFt(m.widthFt);
    const heightFt = rectPrismDimFt(m.heightFt);
    const depthFt = rectPrismDimFt(Math.max(m.depthFt, DOOR_MIN_DEPTH_FT));
    return { widthFt, heightFt, depthFt };
  }

  getDoorSpecific(): Record<string, unknown> {
    return { ...this.doorSpecific };
  }

  static fromMeshSpecs(specs: WallOpeningMeshSpec[]): DoorOpening3D[] {
    return specs.map((m) => new DoorOpening3D(m));
  }
}

/** Window opening: gold tones + matching labels. */
export class WindowOpening3D extends WallOpening3DBase {
  readonly openingKind = 'window' as const;

  constructor(
    mesh: WallOpeningMeshSpec,
    protected readonly windowSpecific: Record<string, unknown> = {}
  ) {
    super(mesh);
  }

  getVisualStyle(): WallOpeningVisualStyle {
    return WINDOW_STYLE;
  }

  getWindowSpecific(): Record<string, unknown> {
    return { ...this.windowSpecific };
  }

  static fromMeshSpecs(specs: WallOpeningMeshSpec[]): WindowOpening3D[] {
    return specs.map((m) => new WindowOpening3D(m));
  }
}

/** Structural frame / trim preview (neutral). Ready for scene `subType: 'frame'` when added. */
export class FrameOpening3D extends WallOpening3DBase {
  readonly openingKind = 'frame' as const;

  constructor(
    mesh: WallOpeningMeshSpec,
    protected readonly frameSpecific: Record<string, unknown> = {}
  ) {
    super(mesh);
  }

  getVisualStyle(): WallOpeningVisualStyle {
    return FRAME_STYLE;
  }

  getFrameSpecific(): Record<string, unknown> {
    return { ...this.frameSpecific };
  }

  static fromMeshSpecs(specs: WallOpeningMeshSpec[]): FrameOpening3D[] {
    return specs.map((m) => new FrameOpening3D(m));
  }
}

/** Arbitrary opening with caller-supplied style and optional extension bag. */
export class CustomWallOpening3D extends WallOpening3DBase {
  readonly openingKind = 'custom' as const;

  constructor(
    mesh: WallOpeningMeshSpec,
    private readonly style: WallOpeningVisualStyle,
    protected readonly customProps: Record<string, unknown> = {}
  ) {
    super(mesh);
  }

  getVisualStyle(): WallOpeningVisualStyle {
    return this.style;
  }

  getCustomProperties(): Record<string, unknown> {
    return { ...this.customProps };
  }

  static fromMeshSpecs(
    specs: WallOpeningMeshSpec[],
    style: WallOpeningVisualStyle,
    propsPerId?: (id: string) => Record<string, unknown>
  ): CustomWallOpening3D[] {
    return specs.map((m) => new CustomWallOpening3D(m, style, propsPerId?.(m.id) ?? {}));
  }
}
