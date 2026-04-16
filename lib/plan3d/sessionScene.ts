/**
 * Payload key for `/preview-3d`. Prefer **localStorage** when opening in a new tab:
 * `sessionStorage` is not shared across tabs, so the preview would not see the scene.
 */
export const SESSION_3D_SCENE_KEY = 'sketchmyhome_3d_scene';

export type Session3DScenePayload = {
  scene: unknown[];
  gridPxPerFoot: number;
};
