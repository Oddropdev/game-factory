// W9.3-3: one-field soft toy-world. Every mesh is a real smooth 3D
// sphere/capsule, no unlicensed assets, particle emitters or post-processing.
// Presentation state only: never reads or modifies collision/score mechanics.
import { Color, Entity, StandardMaterial } from 'playcanvas';

export type WorldEvent = 'orb' | 'gate' | 'hazard';
type P = [number, number, number];
type Glow = { node: Entity; velocity: P };
const hex = (value: string): Color => {
  const c = value.replace('#', '');
  return new Color(
    parseInt(c.slice(0, 2), 16) / 255,
    parseInt(c.slice(2, 4), 16) / 255,
    parseInt(c.slice(4, 6), 16) / 255
  );
};
function plastic(color: string, gloss = 0.42, glow = 0): StandardMaterial {
  const mat = new StandardMaterial();
  mat.diffuse = hex(color);
  mat.emissive = hex(color);
  mat.emissive.mulScalar(glow);
  mat.metalness = 0;
  mat.gloss = gloss;
  mat.update();
  return mat;
}

const paint = {
  leaf: plastic('#6BDAA8'),
  mint: plastic('#A5EFC8'),
  berry: plastic('#FF9DB9'),
  cream: plastic('#FFF2D2'),
  trunk: plastic('#DCA97E'),
  cloud: plastic('#FAF6FF', 0.24),
  lilac: plastic('#B8B4FF'),
  gold: plastic('#FFDA72', 0.58, 0.19),
  sparkle: plastic('#FFFAE1', 0.65, 0.25),
  red: plastic('#F66E91', 0.5, 0.06)
};
function blob(name: string, parent: Entity, color: StandardMaterial,
  pos: P, scale: P, capsule = false): Entity {
  const e = new Entity(name);
  e.addComponent('render', { type: capsule ? 'capsule' : 'sphere', material: color });
  e.setLocalPosition(...pos);
  e.setLocalScale(...scale);
  parent.addChild(e);
  return e;
}

export type SoftWorld = {
  readonly environmentPieces: number;
  readonly backgroundBoxPieces: 0;
  readonly particleCapacity: number;
  readonly plantCount: number;
  readonly cloudCount: number;
  readonly activeParticleCount: () => number;
  trigger(type: WorldEvent, originX: number): void;
  update(dt: number, time: number): void;
  readonly pulse: () => number;
};

// Keep every decoration off the play lanes; nothing obscures gate values.
// The soft landscape remains fixed in world coordinates like the W9.3-2 track.
export function createSoftWorld(root: Entity): SoftWorld {
  const garden = new Entity('w9-soft-sculpted-garden');
  root.addChild(garden);
  let count = 0;
  let cloudCount = 0;
  let plantCount = 0;
  const part = (name: string, parent: Entity, mat: StandardMaterial,
    pos: P, scale: P, capsule = false): Entity => {
    count++;
    return blob(name, parent, mat, pos, scale, capsule);
  };

  // Four distant cloud islands at different heights, asymmetrical enough to
  // remove the empty-sky slab without creating busy foreground geometry.
  for (const [index, x, y, z, size] of [
    [0, -12, 10.5, -34, 2.6], [1, 12, 11.6, -43, 3.3],
    [2, -17, 13.8, -59, 3.1], [3, 19, 10.1, -65, 3.4]
  ] as const) {
    const cloud = new Entity('soft-cloud-bank-' + index);
    cloud.setLocalPosition(x, y, z);
    garden.addChild(cloud);
    part('cloud-core-' + index, cloud, paint.cloud, [0, 0, 0],
      [size * 2.1, size * 0.53, size * 0.72]);
    for (const side of [-1, 1]) part('cloud-puff-' + index + '-' + side,
      cloud, paint.cloud, [side * size * .66, size * .23, 0],
      [size * .95, size * .82, size * .72]);
    cloudCount++;
  }

  // Eight small rounded lollipop-tree sculptures. Roots and crowns all use
  // smooth shapes, instead of the old angular Kenney kit tree silhouettes.
  const placements: Array<[number, number, number]> = [
    [-7.8, -4, 1.05], [8.6, -9, .93],
    [-10, -19, 1.13], [9.4, -25, .92],
    [-8.5, -37, 1.08], [11, -44, 1.22],
    [-9.7, -55, .89], [8.7, -66, 1.12]
  ];
  for (const [i, [x, z, scale]] of placements.entries()) {
    const tree = new Entity('soft-garden-tree-' + i);
    tree.setLocalPosition(x, -0.10, z);
    tree.setLocalScale(scale, scale, scale);
    garden.addChild(tree);
    part('rounded-trunk-' + i, tree, paint.trunk,
      [0, 0.9, 0], [.52, 2.25, .52], true);
    part('rounded-crown-' + i, tree, i % 2 ? paint.leaf : paint.mint,
      [0, 2.58, 0], [2.4, 2.15, 2.2]);
    part('rounded-crown-puff-' + i, tree, paint.leaf,
      [-0.69, 2.2, .14], [1.55, 1.46, 1.5]);
    part('rounded-fruit-' + i, tree, i % 3 ? paint.berry : paint.lilac,
      [.51, 2.27, .89], [.38, .42, .36]);
    plantCount++;
  }

  const particleRoot = new Entity('bounded-toy-juice-pool');
  root.addChild(particleRoot);
  const glows: Glow[] = [];
  const velocityDirections: P[] = [
    [-.9, 1.2, .2], [.9, 1.4, .3], [-.5, 1.8, -.3],
    [.52, 1.7, -.35], [-1.15, 1.0, -.5], [1.15, 1.0, -.5],
    [0, 2.0, 0], [-.25, 1.3, 1], [.3, 1.15, .95]
  ];
  for (const [i, v] of velocityDirections.entries()) {
    const mat = i % 3 === 0 ? paint.gold : i % 3 === 1 ? paint.cream : paint.lilac;
    const node = part('pooled-reward-spark-' + i, particleRoot, mat,
      [0, -30, 0], [.21, .21, .21]);
    node.enabled = false;
    glows.push({ node, velocity: v });
  }

  let lifetime = 0;
  let duration = 0.70;
  let pulseStrength = 0;
  let currentType: WorldEvent = 'orb';
  let active = 0;
  return {
    environmentPieces: count - glows.length,
    backgroundBoxPieces: 0,
    particleCapacity: glows.length,
    plantCount,
    cloudCount,
    activeParticleCount: () => active,
    pulse: () => pulseStrength,
    trigger(type, originX) {
      currentType = type;
      duration = type === 'gate' ? 0.84 : type === 'hazard' ? 0.44 : 0.60;
      lifetime = duration;
      pulseStrength = type === 'gate' ? 1 : type === 'orb' ? .50 : .25;
      particleRoot.setLocalPosition(originX, 1.15, 1.7);
      for (const [i, item] of glows.entries()) {
        item.node.enabled = true;
        item.node.setLocalPosition(0, 0, 0);
        const scale = type === 'gate' ? .31 : type === 'hazard' ? .18 : .23;
        item.node.setLocalScale(scale, scale, scale);
        item.velocity = velocityDirections[i]!;
        const color = type === 'hazard' ? paint.red
          : i % 3 === 0 ? paint.gold : i % 3 === 1 ? paint.sparkle : paint.lilac;
        item.node.render!.material = color;
      }
      active = glows.length;
    },
    update(dt, time) {
      // A bounded deterministic pool of 9 meshes; no unbounded allocations,
      // canvas overlays, physics changes or randomized frame-order effects.
      const step = Math.max(0, Math.min(.05, dt));
      lifetime = Math.max(0, lifetime - step);
      const t = duration ? 1 - lifetime / duration : 1;
      pulseStrength *= Math.exp(-step * 6.2);
      if (lifetime === 0 && active) {
        for (const item of glows) item.node.enabled = false;
        active = 0;
      } else if (active) {
        for (const item of glows) {
          const [vx, vy, vz] = item.velocity;
          item.node.setLocalPosition(vx * t * 1.9,
            vy * (t * 1.5 - .65 * t * t), vz * t);
          const sz = .27 * Math.max(0.025, 1 - t) * (currentType === 'gate' ? 1.2 : .8);
          item.node.setLocalScale(sz, sz, sz);
        }
      }
      // Tree swaying intentionally omitted: moving the whole camera-facing
      // background would make upcoming gate choices harder to read.
      void time;
    }
  };
}
