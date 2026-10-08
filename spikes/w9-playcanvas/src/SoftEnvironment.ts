// W9.3-3: original smooth environmental forms; decorative, never collidable.
// No new textures, GLBs, draw-time allocations or third-party assets.
import { Color, Entity, StandardMaterial } from 'playcanvas';

const material = (hex: string, gloss = 0.32): StandardMaterial => {
  const m = new StandardMaterial();
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  m.diffuse = new Color(rgb[0]!, rgb[1]!, rgb[2]!);
  m.metalness = 0;
  m.gloss = gloss;
  m.update();
  return m;
};

const soft = {
  leaf: material('#80DBAB'), leafLight: material('#B2EBC7'),
  hill: material('#9EE6C4'), lilac: material('#B9A8FF'),
  cream: material('#FFF0C9'), cloud: material('#F7FDFF'),
  flower: material('#FFE177')
};

function sphere(
  parent: Entity, name: string, position: [number, number, number],
  scale: [number, number, number], surface: StandardMaterial
): Entity {
  const entity = new Entity(name);
  entity.addComponent('render', { type: 'sphere', material: surface, castShadows: false });
  entity.setLocalPosition(...position);
  entity.setLocalScale(...scale);
  parent.addChild(entity);
  return entity;
}

export function createSoftEnvironment(parent: Entity) {
  const scene = new Entity('w9-3-soft-garden');
  parent.addChild(scene);
  let pieces = 0;
  // Broad, quiet far-side hills. The track and gates retain the focal point.
  for (const z of [-22, -58]) for (const side of [-1, 1]) {
    sphere(scene, 'soft-hillside', [side * 19, -0.92, z],
      [12.4, 3.4, 13.5], soft.hill);
    pieces++;
  }
  // Sparse organic trees, placed outside both lane and event collision paths.
  // Each silhouette is a curved toy form, not a faceted/voxel Kenney tree.
  for (let i = 0; i < 8; i++) {
    const side = i % 2 ? -1 : 1;
    const x = side * (8.8 + (i % 3) * 0.6);
    const z = 2 - i * 10.0;
    sphere(scene, 'tree-soft-trunk', [x, 1.0, z],
      [0.56, 2.1, 0.56], soft.cream);
    sphere(scene, 'tree-soft-crown', [x, 2.35, z],
      [2.18, 2.08, 2.0], i % 3 ? soft.leaf : soft.leafLight);
    sphere(scene, 'tree-crown-glint', [x - 0.50, 3.0, z + 0.45],
      [0.70, 0.58, 0.7], soft.leafLight);
    pieces += 3;
  }
  // Cotton-cloud clusters with three actual ellipsoids each. Low density.
  for (let i = 0; i < 4; i++) {
    const side = i % 2 ? -1 : 1;
    const x = side * (6.5 + (i % 2) * 2);
    const y = 10.4 + i * 0.65;
    const z = -18 - i * 14;
    for (let j = -1; j <= 1; j++) {
      sphere(scene, 'cotton-cloud', [x + j * 1.55, y + (j === 0 ? 0.45 : 0), z],
        [2.65, j === 0 ? 1.55 : 1.06, 1.75], soft.cloud);
      pieces++;
    }
  }
  // Deliberate tiny flower accents. Keep this away from gate choice text.
  for (let i = 0; i < 6; i++) {
    const side = i % 2 ? -1 : 1;
    sphere(scene, 'garden-petal', [side * 6.7, 0.25, -5 - i * 12],
      [0.35, 0.46, 0.35], i % 3 ? soft.lilac : soft.flower);
    pieces++;
  }
  return { root: scene, pieces, boxPieces: 0 as const, identity: 'soft-garden-v1' as const };
}
