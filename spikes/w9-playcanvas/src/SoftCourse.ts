// W9.3-2: game-local soft toy-course presentation only.
// Uses actual PlayCanvas capsule/sphere meshes, not CSS radii or box normals.
import { Entity, StandardMaterial } from 'playcanvas';

export type CoursePalette = {
  road: StandardMaterial;
  grass: StandardMaterial;
  edge: StandardMaterial;
  stripe: StandardMaterial;
  cyan: StandardMaterial;
  red: StandardMaterial;
  white: StandardMaterial;
  purple: StandardMaterial;
  gold: StandardMaterial;
};

export type SoftPortal = {
  left: Entity;
  right: Entity;
  roundedParts: number;
  setBestLeft(value: boolean): void;
};
export type SoftCourseMetrics = {
  portalParts: number;
  hazardParts: number;
  trackParts: number;
  boxParts: 0;
};

function rounded(
  name: string,
  parent: Entity,
  material: StandardMaterial,
  position: [number, number, number],
  scale: [number, number, number],
  shape: 'capsule' | 'sphere' = 'capsule',
  euler?: [number, number, number]
): Entity {
  const entity = new Entity(name);
  entity.addComponent('render', { type: shape, material });
  entity.setLocalPosition(...position);
  entity.setLocalScale(...scale);
  if (euler) entity.setLocalEulerAngles(...euler);
  parent.addChild(entity);
  return entity;
}

export function createSoftTrack(root: Entity, palette: CoursePalette): SoftCourseMetrics {
  // Capsule mesh's native vertical axis is rotated into the road direction.
  // This makes a genuinely oval top/silhouette rather than a hard-edged slab.
  rounded('soft-track-deck', root, palette.road, [0, -0.36, -30.4],
    [8.0, 84, 0.74], 'capsule', [90, 0, 0]);
  // Landscaped soft shoulders: intentionally broad and calm, not a block kit.
  for (const side of [-1, 1]) {
    rounded('soft-grass-island-' + side, root, palette.grass,
      [side * 12.2, -0.74, -32], [16.6, 89, 1.5], 'capsule', [90, 0, 0]);
    rounded('soft-track-lip-' + side, root, palette.edge,
      [side * 3.77, 0.06, -30.4], [0.39, 84, 0.39], 'capsule', [90, 0, 0]);
    rounded('soft-edge-highlight-' + side, root, palette.white,
      [side * 3.81, 0.24, -30.4], [0.085, 84, 0.085], 'capsule', [90, 0, 0]);
  }
  return { portalParts: 0, hazardParts: 0, trackParts: 7, boxParts: 0 };
}

function half(
  name: string,
  parent: Entity,
  x: number,
  material: StandardMaterial,
  palette: CoursePalette
): { root: Entity; tintable: Entity[] } {
  const root = new Entity(name);
  root.setLocalPosition(x, 0, 0);
  parent.addChild(root);
  const tintable: Entity[] = [];
  // Whole portal is a thick rounded toy arch with open space underneath.
  tintable.push(rounded(name + '-head', root, material, [0, 2.55, 0],
    [0.48, 3.48, 0.52], 'capsule', [0, 0, 90]));
  for (const side of [-1, 1]) {
    tintable.push(rounded(name + '-column-' + side, root, material,
      [side * 1.55, 1.32, 0], [0.44, 2.43, 0.47]));
    rounded(name + '-corner-light-' + side, root, palette.white,
      [side * 1.55, 2.51, 0.23], [0.23, 0.23, 0.19], 'sphere');
  }
  rounded(name + '-crest', root, palette.gold,
    [0, 2.79, 0.15], [0.86, 0.2, 0.22], 'capsule', [0, 0, 90]);
  return { root, tintable };
}

export function createSoftPortal(
  name: string,
  parent: Entity,
  palette: CoursePalette
): SoftPortal {
  const left = half(name + '-left', parent, -1.9, palette.cyan, palette);
  const right = half(name + '-right', parent, 1.9, palette.red, palette);
  let applied: boolean | null = null;
  return {
    left: left.root,
    right: right.root,
    roundedParts: 12,
    setBestLeft(value) {
      if (applied === value) return;
      applied = value;
      for (const item of left.tintable) item.render!.material = value ? palette.cyan : palette.red;
      for (const item of right.tintable) item.render!.material = value ? palette.red : palette.cyan;
    }
  };
}

export function createSoftHazard(
  name: string,
  parent: Entity,
  width: number,
  palette: CoursePalette
): number {
  const bodyWidth = Math.max(0.6, width * 7.7);
  rounded(name + '-roller', parent, palette.red, [0, 0.56, 0],
    [1.08, bodyWidth, 1.15], 'capsule', [0, 0, 90]);
  for (const side of [-1, 1]) {
    rounded(name + '-bumper-cap-' + side, parent, palette.purple,
      [side * bodyWidth * 0.47, 0.55, 0], [0.43, 0.43, 0.43], 'sphere');
  }
  rounded(name + '-soft-warning-ridge', parent, palette.gold,
    [0, 1.05, 0.06], [0.2, bodyWidth * 0.77, 0.2], 'capsule', [0, 0, 90]);
  return 4;
}

export function createSoftStripe(
  name: string,
  root: Entity,
  palette: CoursePalette,
  x: number,
  z: number
): Entity {
  return rounded(name, root, palette.stripe, [x, 0.047, z],
    [0.075, 1.7, 0.07], 'capsule', [90, 0, 0]);
}

export function createSoftDecoration(
  name: string,
  root: Entity,
  palette: CoursePalette,
  x: number,
  z: number,
  alternate: boolean
): Entity {
  return rounded(name, root, alternate ? palette.cyan : palette.purple,
    [x, 0.06, z], [0.40, 1.7, 0.45], 'capsule', [90, 0, 0]);
}

export function createSoftShadow(root: Entity, material: StandardMaterial): Entity {
  return rounded('soft-toy-shadow', root, material,
    [0, 0.025, 2.5], [1.35, 0.046, 1.06], 'sphere');
}
