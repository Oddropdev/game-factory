// W9.3-3: small, bounded one-shot 3D feedback, presentation only.
// Twelve pooled sphere beads; no sprites, particles, colliders or model writes.
import { Entity, type StandardMaterial } from 'playcanvas';

export type JuiceKind = 'reward' | 'impact';
export function createSoftJuice(root: Entity, reward: StandardMaterial, danger: StandardMaterial) {
  const group = new Entity('toy-feedback-ring');
  root.addChild(group);
  const beads: Entity[] = [];
  for (let i = 0; i < 12; i++) {
    const bead = new Entity('ring-bead-' + i);
    bead.addComponent('render', { type: 'sphere', material: reward, castShadows: false });
    group.addChild(bead);
    beads.push(bead);
  }
  group.enabled = false;
  let started = -100;
  let kind: JuiceKind = 'reward';
  let triggered = 0;

  return {
    pieces: beads.length,
    get bursts() { return triggered; },
    get lastKind() { return triggered ? kind : 'none'; },
    get active() { return group.enabled; },
    trigger(next: JuiceKind, now: number, x: number) {
      kind = next;
      started = now;
      triggered++;
      group.setLocalPosition(x, 0.16, 2.5);
      for (const bead of beads) bead.render!.material = kind === 'impact' ? danger : reward;
      group.enabled = true;
    },
    impulse(now: number) {
      const age = now - started;
      return age >= 0 && age < 0.48
        ? (1 - age / 0.48) * Math.sin(Math.PI * Math.min(1, age / 0.48))
        : 0;
    },
    update(now: number, x: number) {
      const age = now - started;
      if (age < 0 || age >= 0.62) {
        group.enabled = false;
        return;
      }
      group.enabled = true;
      group.setLocalPosition(x, 0.16, 2.5);
      const life = age / 0.62;
      const radius = 0.48 + life * 1.95;
      const size = Math.max(0.001, 0.22 * (1 - life));
      for (let i = 0; i < beads.length; i++) {
        const angle = (i / beads.length) * Math.PI * 2;
        const bead = beads[i]!;
        bead.setLocalPosition(Math.cos(angle) * radius, 0.04 + Math.sin(life * Math.PI) * 0.27, Math.sin(angle) * radius);
        bead.setLocalScale(size, size, size);
      }
    }
  };
}
