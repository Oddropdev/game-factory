export type MassOperation = {
  op: 'add' | 'multiply';
  value: number;
};

export type MassRunnerOrbEvent = {
  id: string;
  kind: 'orb';
  distance: number;
  x: number;
  amount: number;
};

export type MassRunnerHazardEvent = {
  id: string;
  kind: 'hazard';
  distance: number;
  x: number;
  width: number;
  penalty: number;
};

export type MassRunnerGateEvent = {
  id: string;
  kind: 'gate';
  distance: number;
  split: number;
  left: MassOperation;
  right: MassOperation;
};

export type MassRunnerEvent =
  | MassRunnerOrbEvent
  | MassRunnerHazardEvent
  | MassRunnerGateEvent;

export type MassRunnerLevelSpec = {
  id: string;
  name: string;
  startMass: number;
  targetMass: number;
  finishDistance: number;
  events: readonly MassRunnerEvent[];
};

const gate = (
  id: string,
  distance: number,
  left: MassOperation,
  right: MassOperation
): MassRunnerGateEvent => ({
  id,
  kind: 'gate',
  distance,
  split: 0.5,
  left,
  right
});

export const MASS_RUNNER_LEVELS: readonly MassRunnerLevelSpec[] = [
  {
    id: 'bulk-up',
    name: 'BULK UP',
    startMass: 4,
    targetMass: 12,
    finishDistance: 120,
    events: [
      { id: 'l1-orb-a', kind: 'orb', distance: 15, x: 0.25, amount: 2 },
      { id: 'l1-hazard', kind: 'hazard', distance: 32, x: 0.5, width: 0.2, penalty: 3 },
      gate('l1-gate-a', 50, { op: 'add', value: 4 }, { op: 'add', value: -3 }),
      { id: 'l1-orb-b', kind: 'orb', distance: 68, x: 0.75, amount: 2 },
      gate('l1-gate-b', 86, { op: 'add', value: -2 }, { op: 'add', value: 3 }),
      { id: 'l1-orb-c', kind: 'orb', distance: 104, x: 0.5, amount: 2 }
    ]
  },
  {
    id: 'double-down',
    name: 'DOUBLE DOWN',
    startMass: 5,
    targetMass: 18,
    finishDistance: 120,
    events: [
      { id: 'l2-orb-a', kind: 'orb', distance: 15, x: 0.75, amount: 2 },
      gate('l2-gate-a', 32, { op: 'add', value: -2 }, { op: 'multiply', value: 2 }),
      { id: 'l2-hazard', kind: 'hazard', distance: 50, x: 0.75, width: 0.22, penalty: 5 },
      { id: 'l2-orb-b', kind: 'orb', distance: 68, x: 0.25, amount: 3 },
      gate('l2-gate-b', 86, { op: 'add', value: 4 }, { op: 'add', value: -4 }),
      { id: 'l2-orb-c', kind: 'orb', distance: 104, x: 0.5, amount: 2 }
    ]
  },
  {
    id: 'heavy-traffic',
    name: 'HEAVY TRAFFIC',
    startMass: 6,
    targetMass: 20,
    finishDistance: 120,
    events: [
      gate('l3-gate-a', 15, { op: 'add', value: 3 }, { op: 'add', value: -2 }),
      { id: 'l3-orb-a', kind: 'orb', distance: 32, x: 0.25, amount: 2 },
      { id: 'l3-hazard-a', kind: 'hazard', distance: 50, x: 0.25, width: 0.22, penalty: 4 },
      gate('l3-gate-b', 68, { op: 'add', value: -3 }, { op: 'multiply', value: 2 }),
      { id: 'l3-orb-b', kind: 'orb', distance: 86, x: 0.75, amount: 2 },
      { id: 'l3-hazard-b', kind: 'hazard', distance: 104, x: 0.75, width: 0.22, penalty: 6 }
    ]
  },
  {
    id: 'critical-mass',
    name: 'CRITICAL MASS',
    startMass: 5,
    targetMass: 22,
    finishDistance: 120,
    events: [
      { id: 'l4-orb-a', kind: 'orb', distance: 15, x: 0.5, amount: 3 },
      { id: 'l4-hazard-a', kind: 'hazard', distance: 32, x: 0.5, width: 0.24, penalty: 5 },
      gate('l4-gate-a', 50, { op: 'multiply', value: 2 }, { op: 'add', value: -4 }),
      { id: 'l4-orb-b', kind: 'orb', distance: 68, x: 0.75, amount: 2 },
      gate('l4-gate-b', 86, { op: 'add', value: -3 }, { op: 'add', value: 5 }),
      { id: 'l4-hazard-b', kind: 'hazard', distance: 104, x: 0.25, width: 0.22, penalty: 7 }
    ]
  },
  {
    id: 'massive-finish',
    name: 'MASSIVE FINISH',
    startMass: 6,
    targetMass: 35,
    finishDistance: 136,
    events: [
      gate('l5-gate-a', 15, { op: 'add', value: -3 }, { op: 'multiply', value: 2 }),
      { id: 'l5-orb-a', kind: 'orb', distance: 32, x: 0.25, amount: 2 },
      { id: 'l5-hazard-a', kind: 'hazard', distance: 50, x: 0.25, width: 0.22, penalty: 7 },
      gate('l5-gate-b', 68, { op: 'add', value: 6 }, { op: 'add', value: -5 }),
      { id: 'l5-orb-b', kind: 'orb', distance: 86, x: 0.75, amount: 3 },
      { id: 'l5-hazard-b', kind: 'hazard', distance: 104, x: 0.75, width: 0.22, penalty: 8 },
      gate('l5-gate-c', 120, { op: 'multiply', value: 2 }, { op: 'add', value: -8 })
    ]
  }
];

export function applyMassOperation(
  mass: number,
  operation: MassOperation
): number {
  const next =
    operation.op === 'multiply'
      ? Math.round(mass * operation.value)
      : mass + operation.value;

  return Math.min(99, Math.max(1, next));
}

export function massRunnerLevelSignature(
  levels: readonly MassRunnerLevelSpec[] = MASS_RUNNER_LEVELS
): string {
  return levels
    .map(level => [
      level.id,
      level.startMass,
      level.targetMass,
      level.finishDistance,
      ...level.events.map(event => {
        if (event.kind === 'gate') {
          return [
            event.id,
            event.distance,
            event.left.op,
            event.left.value,
            event.right.op,
            event.right.value
          ].join(':');
        }

        return [
          event.id,
          event.kind,
          event.distance,
          event.x,
          event.kind === 'orb' ? event.amount : event.penalty
        ].join(':');
      })
    ].join('|'))
    .join('||');
}
