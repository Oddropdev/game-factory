import { SeededRng } from '../../core/random/SeededRng';

export type RunnerPickupEvent = {
  id: string;
  kind: 'pickup';
  distance: number;
  x: number;
  width: number;
  points: number;
};

export type RunnerObstacleEvent = {
  id: string;
  kind: 'obstacle';
  distance: number;
  x: number;
  width: number;
  penalty: number;
};

export type RunnerGateEvent = {
  id: string;
  kind: 'gate';
  distance: number;
  split: number;
  leftDelta: number;
  rightDelta: number;
};

export type RunnerCourseEvent =
  | RunnerPickupEvent
  | RunnerObstacleEvent
  | RunnerGateEvent;

export type RunnerCourse = {
  seed: number;
  finishDistance: number;
  events: readonly RunnerCourseEvent[];
};

const LANES = [0.25, 0.5, 0.75] as const;

export const RUNNER_SEED = 0x52a11e7;
export const RUNNER_FINISH_DISTANCE = 100;

export function createRunnerCourse(seed = RUNNER_SEED): RunnerCourse {
  const rng = new SeededRng(seed);
  const lane = (): number => LANES[Math.floor(rng.next() * LANES.length)] ?? 0.5;

  return {
    seed,
    finishDistance: RUNNER_FINISH_DISTANCE,
    events: [
      {
        id: 'pickup-a',
        kind: 'pickup',
        distance: 12,
        x: lane(),
        width: 0.2,
        points: 1
      },
      {
        id: 'obstacle-a',
        kind: 'obstacle',
        distance: 24,
        x: lane(),
        width: 0.24,
        penalty: 1
      },
      {
        id: 'gate-a',
        kind: 'gate',
        distance: 36,
        split: 0.5,
        leftDelta: 2,
        rightDelta: -1
      },
      {
        id: 'pickup-b',
        kind: 'pickup',
        distance: 48,
        x: lane(),
        width: 0.2,
        points: 1
      },
      {
        id: 'obstacle-b',
        kind: 'obstacle',
        distance: 60,
        x: lane(),
        width: 0.24,
        penalty: 1
      },
      {
        id: 'gate-b',
        kind: 'gate',
        distance: 72,
        split: 0.5,
        leftDelta: -1,
        rightDelta: 3
      },
      {
        id: 'pickup-c',
        kind: 'pickup',
        distance: 84,
        x: lane(),
        width: 0.2,
        points: 1
      }
    ]
  };
}

export function runnerCourseSignature(course: RunnerCourse): string {
  return [
    course.seed.toString(16),
    course.finishDistance,
    ...course.events.map(event => {
      if (event.kind === 'gate') {
        return `${event.id}:g:${event.distance}:${event.leftDelta}:${event.rightDelta}`;
      }

      return `${event.id}:${event.kind[0]}:${event.distance}:${event.x.toFixed(2)}`;
    })
  ].join('|');
}
