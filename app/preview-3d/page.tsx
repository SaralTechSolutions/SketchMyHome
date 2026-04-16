'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { DEFAULT_GRID_PX_PER_FOOT } from '@/lib/plan3d/constants';
import {
  SESSION_3D_SCENE_KEY,
  type Session3DScenePayload,
} from '@/lib/plan3d/sessionScene';

const FloorPlan3DView = dynamic(() => import('@/components/FloorPlan3DView'), {
  ssr: false,
});

/** ~16×12 ft rectangle in canvas px (25 px/ft), 6" nominal thickness in px. */
const DEMO_SCENE: unknown[] = [
  {
    id: 'boundary-demo',
    type: 'boundary',
    points: [
      { x: 80, y: 80 },
      { x: 520, y: 80 },
      { x: 520, y: 420 },
      { x: 80, y: 420 },
    ],
  },
  {
    id: 'wall-demo-n',
    type: 'wall',
    startX: 100,
    startY: 100,
    endX: 500,
    endY: 100,
    thickness: (6 * DEFAULT_GRID_PX_PER_FOOT) / 12,
    altitude: 9,
  },
  {
    id: 'wall-demo-e',
    type: 'wall',
    startX: 500,
    startY: 100,
    endX: 500,
    endY: 400,
    thickness: (6 * DEFAULT_GRID_PX_PER_FOOT) / 12,
    altitude: 9,
  },
  {
    id: 'wall-demo-s',
    type: 'wall',
    startX: 500,
    startY: 400,
    endX: 100,
    endY: 400,
    thickness: (6 * DEFAULT_GRID_PX_PER_FOOT) / 12,
    altitude: 9,
  },
  {
    id: 'wall-demo-w',
    type: 'wall',
    startX: 100,
    startY: 400,
    endX: 100,
    endY: 100,
    thickness: (6 * DEFAULT_GRID_PX_PER_FOOT) / 12,
    altitude: 9,
  },
];

export default function Preview3DPage() {
  const [scene, setScene] = useState<unknown[]>(DEMO_SCENE);
  const [gridPxPerFoot, setGridPxPerFoot] = useState(DEFAULT_GRID_PX_PER_FOOT);
  const [source, setSource] = useState<'demo' | 'editor'>('demo');

  useEffect(() => {
    try {
      const raw =
        typeof window !== 'undefined'
          ? localStorage.getItem(SESSION_3D_SCENE_KEY) ||
            sessionStorage.getItem(SESSION_3D_SCENE_KEY)
          : null;
      if (!raw) return;
      const parsed = JSON.parse(raw) as Session3DScenePayload;
      if (Array.isArray(parsed.scene)) {
        setScene(parsed.scene);
        setSource('editor');
      }
      if (typeof parsed.gridPxPerFoot === 'number' && parsed.gridPxPerFoot > 0) {
        setGridPxPerFoot(parsed.gridPxPerFoot);
      }
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 py-3">
        <div>
          <h1 className="text-sm font-semibold tracking-tight">3D preview</h1>
          <p className="text-xs text-slate-400">
            {source === 'editor'
              ? 'Scene from editor (session): walls and site boundary. Drag to orbit, scroll to zoom.'
              : 'Demo: site boundary (amber) and walls. Use View → 3D preview in the designer to load your plan.'}
          </p>
        </div>
        <Link
          href="/"
          className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
        >
          Back to designer
        </Link>
      </header>
      <div className="min-h-0 flex-1">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              Loading WebGL…
            </div>
          }
        >
          <FloorPlan3DView scene={scene} gridPxPerFoot={gridPxPerFoot} />
        </Suspense>
      </div>
    </div>
  );
}
