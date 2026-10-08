// W9.3: game-local rounded toy character. Presentation-only; no game physics.
// Smooth PlayCanvas sphere meshes give genuinely curved silhouettes instead
// of box geometry with rounded material highlights.
import { Color, Entity, StandardMaterial } from 'playcanvas';

type Part = { pivot: Entity; mesh: Entity };
export type SoftAvatar = {
  readonly root: Entity;
  readonly partCount: number;
  readonly boxPartCount: 0;
  update(time: number, running: boolean, steering: number, mass: number): void;
};

function toyMaterial(hex: string, gloss: number, glow = 0): StandardMaterial {
  const red = parseInt(hex.slice(1, 3), 16) / 255;
  const green = parseInt(hex.slice(3, 5), 16) / 255;
  const blue = parseInt(hex.slice(5, 7), 16) / 255;
  const material = new StandardMaterial();
  material.diffuse = new Color(red, green, blue);
  material.emissive = new Color(red * glow, green * glow, blue * glow);
  material.metalness = 0;
  material.gloss = gloss;
  material.update();
  return material;
}

const colors = {
  shell: toyMaterial('#73DFC5', 0.62, 0.055),
  inner: toyMaterial('#F4FFF0', 0.48, 0.025),
  face: toyMaterial('#213858', 0.72),
  eyeLight: toyMaterial('#FFFFFF', 0.7),
  blush: toyMaterial('#FF9DB2', 0.46),
  accents: toyMaterial('#FFD875', 0.63, 0.09),
  shoes: toyMaterial('#A999F5', 0.54),
  cuff: toyMaterial('#FFF1D2', 0.6)
};

// All dimensions are unit proportions *within* the game's player transform.
function ellipsoid(
  name: string,
  parent: Entity,
  position: [number, number, number],
  size: [number, number, number],
  material: StandardMaterial
): Entity {
  const node = new Entity(name);
  node.addComponent('render', { type: 'sphere', material });
  node.setLocalPosition(...position);
  node.setLocalScale(...size);
  parent.addChild(node);
  return node;
}

function joint(
  name: string,
  parent: Entity,
  pivotPosition: [number, number, number],
  meshOffset: [number, number, number],
  size: [number, number, number],
  material: StandardMaterial
): Part {
  const pivot = new Entity(name + '-pivot');
  pivot.setLocalPosition(...pivotPosition);
  parent.addChild(pivot);
  const mesh = ellipsoid(name, pivot, meshOffset, size, material);
  return { pivot, mesh };
}

/**
 * Rounded, high-contrast original toy mascot.
 * No Kenney mesh is recolored or silently claimed to be a smooth character.
 * Previously licensed Kenney GLBs remain available for world assets.
 */
export function createSoftAvatar(parent: Entity): SoftAvatar {
  const root = new Entity('soft-toy-avatar');
  parent.addChild(root);

  // One clean, immediately identifiable silhouette: large rounded head,
  // broad bean body, tiny flexible arms and softly rounded shoes.
  const body = ellipsoid('toy-body', root, [0, 1.21, 0], [1.26, 1.63, 1.06], colors.shell);
  ellipsoid('toy-belly', root, [0, 1.13, 0.48], [0.72, 0.93, 0.18], colors.inner);
  ellipsoid('toy-head', root, [0, 2.26, 0.02], [1.43, 1.39, 1.26], colors.shell);
  ellipsoid('toy-muzzle', root, [0, 2.02, 0.60], [0.69, 0.45, 0.24], colors.inner);

  // Face looks toward +Z (toward the runner's camera).
  for (const side of [-1, 1]) {
    const x = side * 0.27;
    ellipsoid('toy-eye-' + side, root, [x, 2.37, 0.635], [0.16, 0.23, 0.105], colors.face);
    ellipsoid('toy-eye-glint-' + side, root, [x - 0.025, 2.42, 0.733], [0.055, 0.063, 0.035], colors.eyeLight);
    ellipsoid('toy-cheek-' + side, root, [side * 0.48, 2.08, 0.543], [0.22, 0.11, 0.075], colors.blush);
  }
  ellipsoid('toy-nose', root, [0, 2.16, 0.837], [0.13, 0.11, 0.075], colors.face);
  ellipsoid('toy-mouth', root, [0, 1.99, 0.828], [0.17, 0.045, 0.044], colors.face);

  // Small pastel crown and a soft chest medallion give repeatable identity.
  for (const [i, x] of [-0.3, 0, 0.3].entries()) {
    ellipsoid('toy-top-tuft-' + i, root, [x, 2.92 + (i === 1 ? 0.12 : 0), -0.02],
      [0.38, 0.44, 0.4], colors.accents);
  }
  ellipsoid('toy-chest-badge', root, [0, 1.34, 0.54], [0.28, 0.28, 0.10], colors.accents);

  const arms: Part[] = [];
  const legs: Part[] = [];
  for (const side of [-1, 1]) {
    const arm = joint('toy-arm-' + side, root, [side * 0.66, 1.57, 0],
      [side * 0.21, -0.3, 0.04], [0.40, 0.85, 0.45], colors.shell);
    ellipsoid('toy-mitten-' + side, arm.pivot, [side * 0.23, -0.62, 0.09],
      [0.43, 0.40, 0.42], colors.cuff);
    arms.push(arm);

    const leg = joint('toy-leg-' + side, root, [side * 0.31, 0.67, 0],
      [0, -0.27, 0], [0.43, 0.73, 0.48], colors.shell);
    ellipsoid('toy-sneaker-' + side, leg.pivot, [0, -0.54, 0.17],
      [0.54, 0.34, 0.82], colors.shoes);
    legs.push(leg);
  }
  const count = root.findComponents('render').length;
  // Every part originates from the sphere-only ellipsoid builder; no box
  // is ever added to the avatar's entity hierarchy.

  return {
    root,
    partCount: count,
    boxPartCount: 0,
    update(time, running, steering, mass) {
      const energy = running ? 1 : 0;
      const pulse = Math.sin(time * 11.5);
      const squish = energy ? 1 - Math.abs(pulse) * 0.045 : 1 + Math.sin(time * 2.4) * 0.018;
      const recentredSteer = Math.max(-1, Math.min(1, steering * 2 - 1));
      root.setLocalPosition(0, energy ? Math.abs(pulse) * 0.10 : Math.sin(time * 2.4) * 0.04, 0);
      root.setLocalEulerAngles(0, Math.sin(time * 1.4) * 2, -recentredSteer * (running ? 8 : 2));
      root.setLocalScale(1 + (1 - squish) * 0.34, squish, 1 + (1 - squish) * 0.34);
      for (let i = 0; i < 2; i++) {
        const sign = i === 0 ? 1 : -1;
        arms[i]!.pivot.setLocalEulerAngles(sign * pulse * energy * 29 + sign * 7, 0, sign * 7);
        legs[i]!.pivot.setLocalEulerAngles(-sign * pulse * energy * 24, 0, 0);
      }
      // Keep visual reaction subtle; authoritative mass scaling remains
      // entirely in the existing player.setLocalScale(...growth...) path.
      body.setLocalEulerAngles(Math.min(4, mass * 0.1) * Math.sin(time * 1.9), 0, 0);
    }
  };
}
